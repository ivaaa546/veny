'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

// Helper para crear cliente Supabase
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

// Actualizar configuración de la tienda (Settings)
export async function updateStoreSettings(formData: FormData) {
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

    // Verificar sesión
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
        throw new Error('No estás autenticado')
    }

    const storeId = formData.get('store_id') as string
    const name = formData.get('name') as string
    const slug = formData.get('slug') as string
    const description = formData.get('description') as string
    const phone = formData.get('phone') as string
    const logoUrlJson = formData.get('logo_url') as string
    const bannerUrlJson = formData.get('banner_url') as string

    if (!storeId || !name) {
        throw new Error('Faltan datos obligatorios')
    }

    // Validar y verificar slug si se envía
    if (slug) {
        const slugRegex = /^[a-z0-9-]+$/
        if (!slugRegex.test(slug)) {
            throw new Error('El link solo puede tener letras minúsculas, números y guiones')
        }

        // Verificar si el slug ya está usado por otra tienda
        const { data: existingStore } = await supabase
            .from('stores')
            .select('id')
            .eq('slug', slug)
            .neq('id', storeId)
            .single()

        if (existingStore) {
            throw new Error('Ese link ya está ocupado. Elige otro.')
        }

        // Verificar si también existe como un redirect de otra tienda
        const { data: existingRedirect } = await supabase
            .from('store_redirects')
            .select('id, store_id')
            .eq('old_slug', slug)
            .single()

        if (existingRedirect && existingRedirect.store_id !== storeId) {
            throw new Error('Ese link ya está reservado. Elige otro.')
        }
    }

    // Obtener el slug actual de la tienda para crear redirect si cambia
    const { data: currentStore } = await supabase
        .from('stores')
        .select('slug')
        .eq('id', storeId)
        .single()

    const oldSlug = currentStore?.slug

    // Si el slug cambia, guardar el antiguo para redirección
    if (slug && oldSlug && slug !== oldSlug) {
        // Verificar que no exista ya este redirect
        const { data: existingOldRedirect } = await supabase
            .from('store_redirects')
            .select('id')
            .eq('old_slug', oldSlug)
            .single()

        if (!existingOldRedirect) {
            // Guardar el slug antiguo para redirección
            await supabase
                .from('store_redirects')
                .insert({
                    store_id: storeId,
                    old_slug: oldSlug
                })
        }
    }

    // Parsear logo URL si viene
    let logoUrl: string | null = null
    if (logoUrlJson) {
        try {
            logoUrl = JSON.parse(logoUrlJson)
        } catch {
            logoUrl = logoUrlJson
        }
    }

    // Parsear banner URL si viene
    let bannerUrl: string | null = null
    if (bannerUrlJson) {
        try {
            bannerUrl = JSON.parse(bannerUrlJson)
        } catch {
            bannerUrl = bannerUrlJson
        }
    }

    // Preparar datos de actualización
    const updateData: Record<string, string | null> = {
        name,
        slug: slug || null,
        description: description || null,
        phone: phone || null,
    }

    // Solo actualizar logo si viene uno nuevo
    if (logoUrl) {
        updateData.logo_url = logoUrl
    }

    // Solo actualizar banner si viene uno nuevo
    if (bannerUrl) {
        updateData.banner_url = bannerUrl
    }

    const { error } = await supabase
        .from('stores')
        .update(updateData)
        .eq('id', storeId)

    if (error) {
        console.error('Error actualizando tienda:', error)
        // Mostrar mensaje más específico
        if (error.message?.includes('column')) {
            throw new Error(`Columna faltante en la tabla stores. Ejecuta: ALTER TABLE stores ADD COLUMN IF NOT EXISTS description TEXT; ALTER TABLE stores ADD COLUMN IF NOT EXISTS logo_url TEXT;`)
        }
        throw new Error(`Error al guardar: ${error.message}`)
    }

    // Obtener el slug para revalidar la página pública
    const { data: store } = await supabase
        .from('stores')
        .select('slug')
        .eq('id', storeId)
        .single()

    revalidatePath('/dashboard/settings')
    revalidatePath('/dashboard')
    if (store?.slug) {
        revalidatePath(`/${store.slug}`)
    }
}

// Función para activar/desactivar la tienda
export async function toggleStoreActive(storeId: string, isActive: boolean) {
    const supabase = await getSupabaseClient()

    // Verificar sesión
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
        throw new Error('No estás autenticado')
    }

    const { error } = await supabase
        .from('stores')
        .update({ is_active: isActive })
        .eq('id', storeId)
        .eq('user_id', session.user.id)

    if (error) {
        console.error('Error:', error)
        throw new Error('Error al cambiar el estado de la tienda')
    }

    revalidatePath('/dashboard/settings')
    revalidatePath('/dashboard')
}

// Función para desactivar cuenta (soft delete - 30 días para reactivar)
export async function deleteAccount(storeId: string) {
    const supabase = await getSupabaseClient()

    // Verificar sesión
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
        throw new Error('No estás autenticado')
    }

    // Verificar que la tienda pertenece al usuario
    const { data: store } = await supabase
        .from('stores')
        .select('id')
        .eq('id', storeId)
        .eq('user_id', session.user.id)
        .single()

    if (!store) {
        throw new Error('No tienes permiso para eliminar esta tienda')
    }

    // Soft delete: marcar fecha de eliminación (30 días para reactivar)
    const { error } = await supabase
        .from('stores')
        .update({
            deleted_at: new Date().toISOString(),
            is_active: false
        })
        .eq('id', storeId)

    if (error) {
        console.error('Error desactivando cuenta:', error)
        throw new Error('Error al desactivar la cuenta')
    }

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/settings')

    return { success: true }
}

// Función para reactivar cuenta (antes de los 30 días)
export async function reactivateAccount(storeId: string) {
    const supabase = await getSupabaseClient()

    // Verificar sesión
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
        throw new Error('No estás autenticado')
    }

    // Verificar que la tienda pertenece al usuario y está marcada para eliminar
    const { data: store } = await supabase
        .from('stores')
        .select('id, deleted_at')
        .eq('id', storeId)
        .eq('user_id', session.user.id)
        .single()

    if (!store) {
        throw new Error('No tienes permiso para reactivar esta tienda')
    }

    if (!store.deleted_at) {
        throw new Error('Esta cuenta no está desactivada')
    }

    // Verificar que no han pasado más de 30 días
    const deletedAt = new Date(store.deleted_at)
    const now = new Date()
    const daysSinceDelete = Math.floor((now.getTime() - deletedAt.getTime()) / (1000 * 60 * 60 * 24))

    if (daysSinceDelete > 30) {
        throw new Error('El período de reactivación ha expirado')
    }

    // Reactivar cuenta
    const { error } = await supabase
        .from('stores')
        .update({
            deleted_at: null,
            is_active: true
        })
        .eq('id', storeId)

    if (error) {
        console.error('Error reactivando cuenta:', error)
        throw new Error('Error al reactivar la cuenta')
    }

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/settings')

    return { success: true }
}