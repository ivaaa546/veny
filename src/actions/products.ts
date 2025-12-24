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

    // 1. Extraer datos del FormData (que viene de tu <form>)
    const title = formData.get('title') as string
    const price = parseFloat(formData.get('price') as string)
    const categoryId = formData.get('category_id') as string
    const imageUrl = formData.get('image_url') as string
    const userId = session.user.id // Usar el userId de la sesión autenticada

    // 2. Validaciones básicas
    if (!title || !price || !userId) {
        throw new Error('Faltan datos obligatorios')
    }

    // 3. Buscar el ID de la tienda de este usuario
    // (Porque el producto pertenece a una tienda, no directamente al usuario)
    const { data: store } = await supabase
        .from('stores')
        .select('id')
        .eq('user_id', userId)
        .single()

    if (!store) {
        throw new Error('No tienes una tienda creada.')
    }

    // 4. Insertar en Supabase
    const { error } = await supabase
        .from('products')
        .insert({
            title,
            price,
            image_url: imageUrl,
            category_id: categoryId || null, // Puede ser null
            store_id: store.id,
            is_active: true
        })

    if (error) {
        console.error('Error creando producto:', error)
        throw new Error(`Error al guardar en la base de datos: ${error.message}`)
    }

    // 5. ¡Magia de Next.js! 
    // Esto borra la caché del dashboard para que el producto nuevo aparezca
    // instantáneamente sin tener que recargar la página (F5).
    revalidatePath('/dashboard')

    // Opcional: Redirigir al usuario de vuelta al dashboard
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