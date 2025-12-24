'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

// Helper para crear el cliente de Supabase autenticado
async function getSupabaseClient() {
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
                        // Ignorar errores de setAll en Server Components
                    }
                },
            },
        }
    )
}

// 1. Obtener categorías de mi tienda
export async function getCategories(storeId: string) {
    const supabase = await getSupabaseClient()

    const { data } = await supabase
        .from('categories')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: true })

    return data || []
}

// 2. Crear nueva categoría
export async function createCategory(formData: FormData) {
    const supabase = await getSupabaseClient()

    const name = formData.get('name') as string
    const storeId = formData.get('store_id') as string

    if (!name || !storeId) return

    const { error } = await supabase
        .from('categories')
        .insert({
            name,
            store_id: storeId
        })

    if (error) {
        console.error('Error al crear categoría:', error)
        throw new Error('Error al crear categoría')
    }

    revalidatePath('/dashboard/categories') // Actualizar la lista
    revalidatePath('/dashboard/products/new') // Actualizar el selector de productos
}

// 3. Borrar categoría
export async function deleteCategory(categoryId: string) {
    const supabase = await getSupabaseClient()

    const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId)

    if (error) {
        console.error('Error al borrar categoría:', error)
        throw new Error('Error al borrar')
    }

    revalidatePath('/dashboard/categories')
}