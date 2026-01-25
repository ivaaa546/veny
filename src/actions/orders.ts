'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

// Cliente de Supabase para acciones públicas (sin autenticación requerida)
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface CartItem {
    id: string
    title: string
    price: number
    quantity: number
    selectedVariant?: string
    variantId?: string // ID de la variante para decrementar stock
}

interface OrderData {
    storeId: string
    customerName: string
    customerLastName?: string
    customerPhone?: string
    customerAddress?: string // Legacy field, mantener por compatibilidad
    customerDepartment?: string
    customerMunicipality?: string
    customerZone?: string
    customerReference?: string
    deliveryPlace?: string // casa, trabajo, otro
    total: number
}

export async function createOrder(orderData: OrderData, cartItems: CartItem[]) {
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
    // Esto fallará silenciosamente si las columnas no existen aún
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

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Helper para obtener cliente autenticado
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

// Función para obtener pedidos de una tienda (para el dashboard)
export async function getStoreOrders(storeId: string) {
    // Usamos cliente autenticado para respetar RLS
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

    return orders || []
}

// Función para actualizar el estado de un pedido
export async function updateOrderStatus(orderId: string, status: string) {
    // IMPORTANTE: Usar cliente autenticado
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
