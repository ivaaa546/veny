'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

// Cliente de Supabase para acciones públicas (sin autenticación requerida)
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface CartItem {
    productId: string
    productTitle: string
    price: number
    quantity: number
    variantInfo?: string
}

interface OrderData {
    storeId: string
    customerName: string
    customerPhone?: string
    customerAddress?: string
    total: number
}

export async function createOrder(orderData: OrderData, cartItems: CartItem[]) {
    // Preparar items para el JSONB
    const itemsJson = cartItems.map(item => ({
        product_id: item.id, // Corregido: antes era item.productId
        product_title: item.title, // Corregido: antes era item.productTitle
        quantity: item.quantity,
        price: item.price,
        variant_info: item.selectedVariant || null, // Corregido: antes era item.variantInfo
    }))

    // Llamar a la función RPC segura
    const { data: orderId, error } = await supabase
        .rpc('create_new_order', {
            p_store_id: orderData.storeId,
            p_total: orderData.total,
            p_customer_name: orderData.customerName,
            p_customer_phone: orderData.customerPhone || null,
            p_customer_address: orderData.customerAddress || null,
            p_items: itemsJson
        })

    if (error) {
        console.error('Error creando pedido via RPC:', error)
        throw new Error(`Error Supabase: ${error.message} (${error.code})`)
    }

    if (!orderId) {
        throw new Error('No se recibió confirmación del pedido')
    }

    return { orderId }
}

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// ... (resto de imports)

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

// ... (createOrder se queda igual porque usa RPC o cliente anónimo si así se desea, 
// PERO createOrder usa RPC security definer, así que el cliente anónimo está bien ahí)

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
