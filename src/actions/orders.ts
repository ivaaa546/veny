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
    // 1. Insertar el pedido principal
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
            store_id: orderData.storeId,
            total: orderData.total,
            status: 'pending',
            customer_name: orderData.customerName,
            customer_phone: orderData.customerPhone || null,
            customer_address: orderData.customerAddress || null,
        })
        .select('id')
        .single()

    if (orderError || !order) {
        console.error('Error creando pedido:', orderError)
        throw new Error('Error al crear el pedido')
    }

    // 2. Insertar los items del pedido
    const orderItems = cartItems.map(item => ({
        order_id: order.id,
        product_id: item.productId,
        product_title: item.productTitle,
        quantity: item.quantity,
        price: item.price,
        variant_info: item.variantInfo || null,
    }))

    const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

    if (itemsError) {
        console.error('Error insertando items:', itemsError)
        // Intentar borrar el pedido si fallan los items
        await supabase.from('orders').delete().eq('id', order.id)
        throw new Error('Error al guardar los productos del pedido')
    }

    return { orderId: order.id }
}

// Función para obtener pedidos de una tienda (para el dashboard)
export async function getStoreOrders(storeId: string) {
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
    const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId)

    if (error) {
        console.error('Error actualizando estado:', error)
        throw new Error('Error al actualizar el estado del pedido')
    }

    revalidatePath('/dashboard/orders')
}
