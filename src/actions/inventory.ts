'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

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

export interface InventoryItem {
    id: string
    product_id: string
    product_title: string
    variant_type: string
    variant_value: string
    price_adjustment: number
    stock: number
    product_price: number
    product_image: string | null
    created_at: string
}

// Obtener todos los items de inventario de una tienda
export async function getStoreInventory(storeId: string): Promise<InventoryItem[]> {
    const supabase = await getAuthenticatedSupabase()

    // Obtener todas las variantes de productos de la tienda
    const { data: variants, error } = await supabase
        .from('product_variants')
        .select(`
            id,
            product_id,
            variant_type,
            variant_value,
            price_adjustment,
            stock,
            created_at,
            products!inner (
                id,
                title,
                price,
                image_url,
                store_id
            )
        `)
        .eq('products.store_id', storeId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error obteniendo inventario:', error)
        return []
    }

    // Transformar los datos al formato esperado
    return (variants || []).map((v: any) => ({
        id: v.id,
        product_id: v.product_id,
        product_title: v.products.title,
        variant_type: v.variant_type,
        variant_value: v.variant_value,
        price_adjustment: v.price_adjustment,
        stock: v.stock || 0,
        product_price: v.products.price,
        product_image: v.products.image_url,
        created_at: v.created_at
    }))
}

// Actualizar stock de una variante
export async function updateVariantStock(variantId: string, newStock: number) {
    const supabase = await getAuthenticatedSupabase()

    // Verificar que el usuario es dueño de la variante
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        throw new Error('No autenticado')
    }

    // Obtener la variante con información del producto y tienda
    const { data: variant, error: variantError } = await supabase
        .from('product_variants')
        .select(`
            id,
            products!inner (
                store_id,
                stores!inner (
                    user_id
                )
            )
        `)
        .eq('id', variantId)
        .single()

    if (variantError || !variant) {
        throw new Error('Variante no encontrada')
    }

    // Verificar ownership
    const storeUserId = (variant.products as any).stores.user_id
    if (storeUserId !== user.id) {
        throw new Error('No tienes permiso para modificar esta variante')
    }

    // Actualizar stock
    const { error: updateError } = await supabase
        .from('product_variants')
        .update({ stock: Math.max(0, newStock) })
        .eq('id', variantId)

    if (updateError) {
        console.error('Error actualizando stock:', updateError)
        throw new Error('Error al actualizar el stock')
    }

    revalidatePath('/dashboard/inventory')
    return { success: true }
}

// Actualizar múltiples stocks a la vez
export async function updateMultipleStocks(updates: { variantId: string; stock: number }[]) {
    const supabase = await getAuthenticatedSupabase()

    // Verificar autenticación
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        throw new Error('No autenticado')
    }

    // Obtener la tienda del usuario
    const { data: store } = await supabase
        .from('stores')
        .select('id')
        .eq('user_id', user.id)
        .single()

    if (!store) {
        throw new Error('No tienes una tienda')
    }

    // Actualizar cada variante
    for (const update of updates) {
        const { error } = await supabase
            .from('product_variants')
            .update({ stock: Math.max(0, update.stock) })
            .eq('id', update.variantId)

        if (error) {
            console.error(`Error actualizando variante ${update.variantId}:`, error)
        }
    }

    revalidatePath('/dashboard/inventory')
    return { success: true }
}

// Obtener estadísticas de inventario
export async function getInventoryStats(storeId: string) {
    const supabase = await getAuthenticatedSupabase()

    const { data: variants, error } = await supabase
        .from('product_variants')
        .select(`
            id,
            stock,
            products!inner (
                store_id
            )
        `)
        .eq('products.store_id', storeId)

    if (error) {
        console.error('Error obteniendo stats:', error)
        return {
            totalVariants: 0,
            inStock: 0,
            outOfStock: 0,
            lowStock: 0
        }
    }

    const total = variants?.length || 0
    const outOfStock = variants?.filter(v => (v.stock || 0) <= 0).length || 0
    const lowStock = variants?.filter(v => (v.stock || 0) > 0 && (v.stock || 0) <= 5).length || 0
    const inStock = total - outOfStock

    return {
        totalVariants: total,
        inStock,
        outOfStock,
        lowStock
    }
}
