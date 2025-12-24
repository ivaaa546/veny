'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

// Buscar mi tienda
export async function getMyStore(userId: string) {
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
                        // Ignorar errores de setAll en Server Components
                    }
                },
            },
        }
    )

    const { data: store } = await supabase
        .from('stores')
        .select('*')
        .eq('user_id', userId)
        .single() // Devuelve null si no existe
    return store
}

// Crear o Actualizar Tienda
export async function updateStore(formData: FormData) {
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
                        // Ignorar errores de setAll en Server Components
                    }
                },
            },
        }
    )

    const name = formData.get('name') as string
    const slug = formData.get('slug') as string
    const phone = formData.get('phone') as string
    const userId = formData.get('user_id') as string

    // Validación básica del Slug (URL)
    // Solo permitimos letras, números y guiones
    const slugRegex = /^[a-z0-9-]+$/
    if (!slugRegex.test(slug)) {
        throw new Error('El link solo puede tener letras minúsculas, números y guiones.')
    }

    // 1. Verificar si el slug ya está usado por OTRA persona
    const { data: existingStore } = await supabase
        .from('stores')
        .select('id, user_id')
        .eq('slug', slug)
        .single()

    if (existingStore && existingStore.user_id !== userId) {
        throw new Error('¡Ese link ya está ocupado! Elige otro.')
    }

    // 2. "Upsert" (Actualizar si existe, Crear si no)
    // Como 'user_id' es único en la tabla stores, esto funciona perfecto.
    const { error } = await supabase
        .from('stores')
        .upsert({
            user_id: userId,
            name,
            slug,
            phone,
            // Si ya existe, no toques el logo ni el color por ahora
        }, { onConflict: 'user_id' })

    if (error) {
        console.error(error)
        throw new Error('Error al guardar la tienda')
    }

    revalidatePath('/dashboard')
}