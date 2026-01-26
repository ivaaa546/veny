'use server'

import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { Order, OrderStatus, DeliveryPlace } from '@/types'

// Cliente de Supabase para acciones públicas (sin autenticación requerida)
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ====================================================================
// TIPOS PARA CREAR ÓRDENES
// ====================================================================

interface CartItemForOrder {
    id: string
    title: string
    price: number
    quantity: number
    selectedVariant?: string
    variantId?: string // ID de la variante para decrementar stock
}

interface CreateOrderData {
    storeId: string
    customerName: string
    customerLastName?: string
    customerPhone?: string
    customerAddress?: string // Legacy field
    customerDepartment?: string
    customerMunicipality?: string
    customerZone?: string
    customerReference?: string
    deliveryPlace?: DeliveryPlace
    total: number
}

interface CreateOrderResult {
    orderId: string
}

// ====================================================================
// HELPER PARA CLIENTE AUTENTICADO
// ====================================================================

async function getAuthenticatedSupabase() {
    const cookieStore = await cookies()
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // Ignorar errores en Server Components
                    }
                },
            },
        }
    )
}

// ====================================================================
// CREAR ORDEN (PÚBLICO - Para checkout)
// ====================================================================

export async function createOrder(
    orderData: CreateOrderData, 
    cartItems: CartItemForOrder[]
): Promise<CreateOrderResult> {
    // Preparar items para el JSONB
    const itemsJson = cartItems.map(item => ({
        product_id: item.id,
        product_title: item.title,
        quantity: item.quantity,
        price: item.price,
        variant_info: item.selectedVariant || null,
    }))

    // Construir la dirección completa para el campo legacy si hay datos nuevos
    let fullAddress = orderData.customerAddress || ''
    if (orderData.customerDepartment || orderData.customerMunicipality) {
        const parts = []
        if (orderData.customerMunicipality) parts.push(orderData.customerMunicipality)
        if (orderData.customerDepartment) parts.push(orderData.customerDepartment)
        if (orderData.customerZone) parts.push(`Zona ${orderData.customerZone}`)
        if (orderData.customerReference) parts.push(`Ref: ${orderData.customerReference}`)
        fullAddress = parts.join(', ')
    }

    // Llamar a la función RPC segura
    const { data: orderId, error } = await supabase
        .rpc('create_new_order', {
            p_store_id: orderData.storeId,
            p_total: orderData.total,
            p_customer_name: `${orderData.customerName}${orderData.customerLastName ? ' ' + orderData.customerLastName : ''}`,
            p_customer_phone: orderData.customerPhone || null,
            p_customer_address: fullAddress || null,
            p_items: itemsJson
        })

    if (error) {
        console.error('Error creando pedido via RPC:', error)
        throw new Error(`Error Supabase: ${error.message} (${error.code})`)
    }

    if (!orderId) {
        throw new Error('No se recibió confirmación del pedido')
    }

    // Actualizar la orden con los campos adicionales (si existen las columnas)
    try {
        const updateData: Record<string, string | null> = {}
        if (orderData.customerLastName) updateData.customer_last_name = orderData.customerLastName
        if (orderData.customerDepartment) updateData.customer_department = orderData.customerDepartment
        if (orderData.customerMunicipality) updateData.customer_municipality = orderData.customerMunicipality
        if (orderData.customerZone) updateData.customer_zone = orderData.customerZone
        if (orderData.customerReference) updateData.customer_reference = orderData.customerReference
        if (orderData.deliveryPlace) updateData.delivery_place = orderData.deliveryPlace

        if (Object.keys(updateData).length > 0) {
            await supabase
                .from('orders')
                .update(updateData)
                .eq('id', orderId)
        }
    } catch (updateError) {
        // Ignorar errores de actualización (las columnas pueden no existir aún)
        console.warn('Advertencia: No se pudieron actualizar campos adicionales de la orden:', updateError)
    }

    // Decrementar stock para cada item con variante
    for (const item of cartItems) {
        if (item.selectedVariant) {
            // Parsear la variante (formato: "Tipo: Valor")
            const [variantType, variantValue] = item.selectedVariant.split(': ')
            
            if (variantType && variantValue) {
                // Buscar la variante por producto, tipo y valor
                const { data: variant } = await supabase
                    .from('product_variants')
                    .select('id, stock')
                    .eq('product_id', item.id)
                    .eq('variant_type', variantType.trim())
                    .eq('variant_value', variantValue.trim())
                    .single()

                if (variant && variant.stock > 0) {
                    // Decrementar stock (no permitir valores negativos)
                    const newStock = Math.max(0, variant.stock - item.quantity)
                    await supabase
                        .from('product_variants')
                        .update({ stock: newStock })
                        .eq('id', variant.id)
                }
            }
        }
    }

    return { orderId }
}

// ====================================================================
// OBTENER ÓRDENES DE UNA TIENDA (AUTENTICADO)
// ====================================================================

export async function getStoreOrders(storeId: string): Promise<Order[]> {
    const supabase = await getAuthenticatedSupabase()
    
    const { data: orders, error } = await supabase
        .from('orders')
        .select(`
            *,
            order_items(*)
        `)
        .eq('store_id', storeId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error obteniendo pedidos:', error)
        return []
    }

    return (orders || []) as Order[]
}

// ====================================================================
// ACTUALIZAR ESTADO DE ORDEN (AUTENTICADO)
// ====================================================================

export async function updateOrderStatus(
    orderId: string, 
    status: OrderStatus | string
): Promise<void> {
    const supabase = await getAuthenticatedSupabase()

    const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId)

    if (error) {
        console.error('Error actualizando estado:', error)
        throw new Error(`Error Supabase: ${error.message}`)
    }

    revalidatePath('/dashboard/orders')
}

// ====================================================================
// OBTENER ESTADÍSTICAS DE ÓRDENES (AUTENTICADO)
// ====================================================================

interface OrderStats {
    totalOrders: number
    pendingOrders: number
    completedOrders: number
    cancelledOrders: number
    totalRevenue: number
}

export async function getOrderStats(storeId: string): Promise<OrderStats> {
    const supabase = await getAuthenticatedSupabase()
    
    const { data: orders, error } = await supabase
        .from('orders')
        .select('status, total')
        .eq('store_id', storeId)

    if (error) {
        console.error('Error obteniendo estadísticas:', error)
        return {
            totalOrders: 0,
            pendingOrders: 0,
            completedOrders: 0,
            cancelledOrders: 0,
            totalRevenue: 0,
        }
    }

    const stats = (orders || []).reduce((acc, order) => {
        acc.totalOrders++
        if (order.status === 'pending') acc.pendingOrders++
        if (order.status === 'completed') {
            acc.completedOrders++
            acc.totalRevenue += Number(order.total)
        }
        if (order.status === 'cancelled') acc.cancelledOrders++
        return acc
    }, {
        totalOrders: 0,
        pendingOrders: 0,
        completedOrders: 0,
        cancelledOrders: 0,
        totalRevenue: 0,
    })

    return stats
}
