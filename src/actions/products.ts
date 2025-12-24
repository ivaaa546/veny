'use server' // 👈 ESTO ES VITAL. Marca que este archivo corre en el servidor.

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// Función helper para obtener el cliente de Supabase autenticado
async function getAuthenticatedSupabase() {
    const cookieStore = await cookies()
    const supabase = createServerClient(
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
                        // Ignorar errores de cookies en Server Components
                    }
                },
            },
        }
    )

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
        throw new Error('No estás autenticado')
    }

    return { supabase, session }
}

export async function createProduct(formData: FormData) {
    const { supabase, session } = await getAuthenticatedSupabase()

    // 1. Extraer datos del FormData
    const title = formData.get('title') as string
    const price = parseFloat(formData.get('price') as string)
    const description = formData.get('description') as string
    const categoryId = formData.get('category_id') as string
    const userId = session.user.id

    // 2. Extraer y parsear datos de imágenes y variantes (JSON strings)
    const imagesJson = formData.get('images') as string
    const variantsJson = formData.get('variants') as string

    const images: string[] = imagesJson ? JSON.parse(imagesJson) : []
    const variants: Array<{ type: string; value: string; priceAdjustment: number }> =
        variantsJson ? JSON.parse(variantsJson) : []

    // 3. Validaciones básicas
    if (!title || !price || !userId) {
        throw new Error('Faltan datos obligatorios')
    }

    // 4. Buscar el ID de la tienda de este usuario
    const { data: store } = await supabase
        .from('stores')
        .select('id')
        .eq('user_id', userId)
        .single()

    if (!store) {
        throw new Error('No tienes una tienda creada.')
    }

    // 5. Insertar el producto BASE y obtener su ID
    const { data: newProduct, error: productError } = await supabase
        .from('products')
        .insert({
            title,
            price,
            description: description || null,
            category_id: categoryId || null,
            store_id: store.id,
            is_active: true
        })
        .select('id')
        .single()

    if (productError || !newProduct) {
        console.error('Error creando producto:', productError)
        throw new Error(`Error al guardar en la base de datos: ${productError?.message}`)
    }

    const productId = newProduct.id

    try {
        // 6. Insertar IMÁGENES en product_images (si existen)
        if (images.length > 0) {
            const imageRecords = images.map((url, index) => ({
                product_id: productId,
                image_url: url,
                display_order: index
            }))

            const { error: imagesError } = await supabase
                .from('product_images')
                .insert(imageRecords)

            if (imagesError) {
                console.error('Error insertando imágenes:', imagesError)
                // Rollback: eliminar el producto creado
                await supabase.from('products').delete().eq('id', productId)
                throw new Error('Error al guardar las imágenes')
            }
        }

        // 7. Insertar VARIANTES en product_variants (si existen)
        if (variants.length > 0) {
            // Filtrar variantes vacías
            const validVariants = variants.filter(v => v.type && v.value)

            if (validVariants.length > 0) {
                const variantRecords = validVariants.map(v => ({
                    product_id: productId,
                    variant_type: v.type,
                    variant_value: v.value,
                    price_adjustment: v.priceAdjustment || 0
                }))

                const { error: variantsError } = await supabase
                    .from('product_variants')
                    .insert(variantRecords)

                if (variantsError) {
                    console.error('Error insertando variantes:', variantsError)
                    // Rollback: eliminar producto e imágenes
                    await supabase.from('product_images').delete().eq('product_id', productId)
                    await supabase.from('products').delete().eq('id', productId)
                    throw new Error('Error al guardar las variantes')
                }
            }
        }

    } catch (error) {
        // Si algo falla, propagar el error
        throw error
    }

    // 8. Revalidar y redirigir
    revalidatePath('/dashboard')
    redirect('/dashboard')
}

export async function deleteProduct(productId: string) {
    const { supabase } = await getAuthenticatedSupabase()

    // 1. Borrar de Supabase
    const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)

    if (error) {
        throw new Error('No se pudo borrar el producto')
    }

    // 2. Refrescar la pantalla
    revalidatePath('/dashboard')
}

export async function toggleProductStatus(productId: string, currentStatus: boolean) {
    const { supabase } = await getAuthenticatedSupabase()

    // Cambiar de Activo a Inactivo
    const { error } = await supabase
        .from('products')
        .update({ is_active: !currentStatus })
        .eq('id', productId)

    if (error) throw new Error('Error actualizando estado')

    revalidatePath('/dashboard')
}