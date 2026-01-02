'use server' // 👈 ESTO ES VITAL. Marca que este archivo corre en el servidor.

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { extractStoragePath, deleteMultipleFromStorage } from '@/lib/supabase'

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

    // 1. Obtener todas las imágenes del producto antes de eliminarlo
    const { data: product } = await supabase
        .from('products')
        .select('image_url')
        .eq('id', productId)
        .single()

    const { data: productImages } = await supabase
        .from('product_images')
        .select('image_url')
        .eq('product_id', productId)

    // 2. Eliminar el producto de la base de datos
    // Esto eliminará automáticamente las variantes e imágenes por CASCADE
    const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)

    if (error) {
        console.error('Error borrando producto:', error)
        throw new Error(`No se pudo borrar el producto: ${error.message}`)
    }

    // 3. Eliminar archivos del storage (después de borrar el producto)
    const imagesToDelete: (string | null)[] = []

    // Agregar imagen principal del producto
    if (product?.image_url) {
        imagesToDelete.push(extractStoragePath(product.image_url))
    }

    // Agregar imágenes adicionales
    if (productImages && productImages.length > 0) {
        productImages.forEach(img => {
            imagesToDelete.push(extractStoragePath(img.image_url))
        })
    }

    // Eliminar todas las imágenes del storage
    if (imagesToDelete.length > 0) {
        await deleteMultipleFromStorage(supabase, imagesToDelete)
    }

    // 4. Refrescar la pantalla
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/products')
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

export async function updateProduct(formData: FormData) {
    const { supabase } = await getAuthenticatedSupabase()

    // 1. Extraer datos del FormData
    const productId = formData.get('product_id') as string
    const title = formData.get('title') as string
    const price = parseFloat(formData.get('price') as string)
    const description = formData.get('description') as string
    const categoryId = formData.get('category_id') as string

    // 2. Extraer y parsear datos de imágenes y variantes (JSON strings)
    const imagesJson = formData.get('images') as string
    const variantsJson = formData.get('variants') as string

    const newImages: string[] = imagesJson ? JSON.parse(imagesJson) : []
    const variants: Array<{ type: string; value: string; priceAdjustment: number }> =
        variantsJson ? JSON.parse(variantsJson) : []

    // 3. Validaciones básicas
    if (!productId || !title || !price) {
        throw new Error('Faltan datos obligatorios')
    }

    // 4. Actualizar el producto BASE
    const { error: productError } = await supabase
        .from('products')
        .update({
            title,
            price,
            description: description || null,
            category_id: categoryId || null,
        })
        .eq('id', productId)

    if (productError) {
        console.error('Error actualizando producto:', productError)
        throw new Error(`Error al actualizar: ${productError.message}`)
    }

    // 5. VARIANTES: Borrar las antiguas e insertar las nuevas
    // Primero eliminamos todas las variantes existentes
    const { error: deleteVariantsError } = await supabase
        .from('product_variants')
        .delete()
        .eq('product_id', productId)

    if (deleteVariantsError) {
        console.error('Error eliminando variantes antiguas:', deleteVariantsError)
    }

    // Insertar las nuevas variantes (si existen)
    if (variants.length > 0) {
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
                throw new Error('Error al guardar las variantes')
            }
        }
    }

    // 6. IMÁGENES: Insertar las nuevas imágenes (sin borrar las existentes)
    if (newImages.length > 0) {
        // Obtener el máximo display_order actual
        const { data: existingImages } = await supabase
            .from('product_images')
            .select('display_order')
            .eq('product_id', productId)
            .order('display_order', { ascending: false })
            .limit(1)

        const maxOrder = existingImages?.[0]?.display_order ?? -1

        const imageRecords = newImages.map((url, index) => ({
            product_id: productId,
            image_url: url,
            display_order: maxOrder + 1 + index
        }))

        const { error: imagesError } = await supabase
            .from('product_images')
            .insert(imageRecords)

        if (imagesError) {
            console.error('Error insertando imágenes:', imagesError)
            throw new Error('Error al guardar las imágenes')
        }
    }

    // 7. Revalidar y redirigir
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/products')
    revalidatePath(`/dashboard/products/${productId}`)
    redirect('/dashboard/products')
}

export async function deleteProductImage(imageId: string, productId: string) {
    const { supabase } = await getAuthenticatedSupabase()

    // 1. Obtener la URL de la imagen antes de eliminarla
    const { data: image } = await supabase
        .from('product_images')
        .select('image_url')
        .eq('id', imageId)
        .single()

    // 2. Eliminar la imagen de la base de datos
    const { error } = await supabase
        .from('product_images')
        .delete()
        .eq('id', imageId)

    if (error) {
        throw new Error('No se pudo borrar la imagen')
    }

    // 3. Eliminar el archivo del storage
    if (image?.image_url) {
        const filePath = extractStoragePath(image.image_url)
        if (filePath) {
            await deleteMultipleFromStorage(supabase, [filePath])
        }
    }

    revalidatePath(`/dashboard/products/${productId}`)
}