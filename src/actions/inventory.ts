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
    is_product: boolean // true = producto sin variantes, false = variante
}

// Obtener todos los items de inventario de una tienda
export async function getStoreInventory(storeId: string): Promise<InventoryItem[]> {
    const supabase = await getAuthenticatedSupabase()

    // 1. Obtener todas las variantes de productos de la tienda
    const { data: variants, error: variantsError } = await supabase
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

    if (variantsError) {
        console.error('Error obteniendo variantes:', variantsError)
    }

    // 2. Obtener productos sin variantes (con stock directo)
    const { data: productsWithoutVariants, error: productsError } = await supabase
        .from('products')
        .select(`
            id,
            title,
            price,
            stock,
            image_url,
            created_at,
            store_id
        `)
        .eq('store_id', storeId)
        .order('created_at', { ascending: false })

    if (productsError) {
        console.error('Error obteniendo productos:', productsError)
    }

    // Obtener IDs de productos que tienen variantes
    const productIdsWithVariants = new Set(
        (variants || []).map((v: any) => v.product_id)
    )

    // Filtrar productos que NO tienen variantes
    const productsStandalone = (productsWithoutVariants || []).filter(
        (p: any) => !productIdsWithVariants.has(p.id)
    )

    // Transformar variantes al formato esperado
    const variantItems: InventoryItem[] = (variants || []).map((v: any) => ({
        id: v.id,
        product_id: v.product_id,
        product_title: v.products.title,
        variant_type: v.variant_type,
        variant_value: v.variant_value,
        price_adjustment: v.price_adjustment,
        stock: v.stock || 0,
        product_price: v.products.price,
        product_image: v.products.image_url,
        created_at: v.created_at,
        is_product: false
    }))

    // Transformar productos sin variantes al formato esperado
    const productItems: InventoryItem[] = productsStandalone.map((p: any) => ({
        id: `product_${p.id}`, // Prefijo para identificar que es un producto
        product_id: p.id,
        product_title: p.title,
        variant_type: 'Producto',
        variant_value: 'Sin variantes',
        price_adjustment: 0,
        stock: p.stock || 0,
        product_price: p.price,
        product_image: p.image_url,
        created_at: p.created_at,
        is_product: true
    }))

    // Combinar y ordenar por fecha de creación
    return [...productItems, ...variantItems].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
}

// Actualizar stock de una variante o producto
export async function updateVariantStock(itemId: string, newStock: number) {
    const supabase = await getAuthenticatedSupabase()

    // Verificar que el usuario está autenticado
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        throw new Error('No autenticado')
    }

    // Determinar si es un producto o una variante
    const isProduct = itemId.startsWith('product_')

    if (isProduct) {
        // Es un producto sin variantes
        const productId = itemId.replace('product_', '')

        // Verificar ownership
        const { data: product, error: productError } = await supabase
            .from('products')
            .select(`
                id,
                stores!inner (
                    user_id
                )
            `)
            .eq('id', productId)
            .single()

        if (productError || !product) {
            throw new Error('Producto no encontrado')
        }

        const storeUserId = (product.stores as any).user_id
        if (storeUserId !== user.id) {
            throw new Error('No tienes permiso para modificar este producto')
        }

        // Actualizar stock del producto
        const { error: updateError } = await supabase
            .from('products')
            .update({ stock: Math.max(0, newStock) })
            .eq('id', productId)

        if (updateError) {
            console.error('Error actualizando stock de producto:', updateError)
            throw new Error('Error al actualizar el stock')
        }
    } else {
        // Es una variante
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
            .eq('id', itemId)
            .single()

        if (variantError || !variant) {
            throw new Error('Variante no encontrada')
        }

        // Verificar ownership
        const storeUserId = (variant.products as any).stores.user_id
        if (storeUserId !== user.id) {
            throw new Error('No tienes permiso para modificar esta variante')
        }

        // Actualizar stock de la variante
        const { error: updateError } = await supabase
            .from('product_variants')
            .update({ stock: Math.max(0, newStock) })
            .eq('id', itemId)

        if (updateError) {
            console.error('Error actualizando stock de variante:', updateError)
            throw new Error('Error al actualizar el stock')
        }
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

    // Actualizar cada item
    for (const update of updates) {
        const isProduct = update.variantId.startsWith('product_')

        if (isProduct) {
            const productId = update.variantId.replace('product_', '')
            const { error } = await supabase
                .from('products')
                .update({ stock: Math.max(0, update.stock) })
                .eq('id', productId)

            if (error) {
                console.error(`Error actualizando producto ${productId}:`, error)
            }
        } else {
            const { error } = await supabase
                .from('product_variants')
                .update({ stock: Math.max(0, update.stock) })
                .eq('id', update.variantId)

            if (error) {
                console.error(`Error actualizando variante ${update.variantId}:`, error)
            }
        }
    }

    revalidatePath('/dashboard/inventory')
    return { success: true }
}

// Obtener estadísticas de inventario
export async function getInventoryStats(storeId: string) {
    const supabase = await getAuthenticatedSupabase()

    // Obtener variantes
    const { data: variants, error: variantsError } = await supabase
        .from('product_variants')
        .select(`
            id,
            stock,
            product_id,
            products!inner (
                store_id
            )
        `)
        .eq('products.store_id', storeId)

    if (variantsError) {
        console.error('Error obteniendo stats de variantes:', variantsError)
    }

    // Obtener productos sin variantes
    const { data: allProducts, error: productsError } = await supabase
        .from('products')
        .select('id, stock')
        .eq('store_id', storeId)

    if (productsError) {
        console.error('Error obteniendo stats de productos:', productsError)
    }

    // IDs de productos con variantes
    const productIdsWithVariants = new Set(
        (variants || []).map((v: any) => v.product_id)
    )

    // Productos sin variantes
    const productsWithoutVariants = (allProducts || []).filter(
        (p: any) => !productIdsWithVariants.has(p.id)
    )

    // Combinar stats
    const allItems = [
        ...(variants || []).map((v: any) => ({ stock: v.stock || 0 })),
        ...productsWithoutVariants.map((p: any) => ({ stock: p.stock || 0 }))
    ]

    const total = allItems.length
    const outOfStock = allItems.filter(item => item.stock <= 0).length
    const lowStock = allItems.filter(item => item.stock > 0 && item.stock <= 5).length
    const inStock = total - outOfStock

    return {
        totalVariants: total,
        inStock,
        outOfStock,
        lowStock
    }
}
