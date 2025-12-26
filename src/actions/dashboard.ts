'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

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
                        // Ignorar errores en Server Components
                    }
                },
            },
        }
    )
}

export interface DashboardStats {
    store: {
        id: string
        name: string
        slug: string
        logo_url?: string | null
        is_active?: boolean
        deleted_at?: string | null
    } | null
    totalProducts: number
    activeProducts: number
    totalCategories: number
    storeIsActive: boolean
    storeDeletedAt: string | null
    userName: string
}

export async function getDashboardStats(): Promise<DashboardStats | null> {
    const supabase = await getSupabaseClient()

    // Verificar sesión
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
        return null
    }

    // Obtener tienda del usuario
    const { data: store } = await supabase
        .from('stores')
        .select('id, name, slug, logo_url, is_active, deleted_at')
        .eq('user_id', session.user.id)
        .single()

    if (!store) {
        return {
            store: null,
            totalProducts: 0,
            activeProducts: 0,
            totalCategories: 0,
            storeIsActive: false,
            storeDeletedAt: null,
            userName: session.user.email?.split('@')[0] || 'Usuario'
        }
    }

    // Contar productos totales
    const { count: totalProducts } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('store_id', store.id)

    // Contar productos activos
    const { count: activeProducts } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('store_id', store.id)
        .eq('is_active', true)

    // Contar categorías
    const { count: totalCategories } = await supabase
        .from('categories')
        .select('*', { count: 'exact', head: true })
        .eq('store_id', store.id)

    return {
        store,
        totalProducts: totalProducts || 0,
        activeProducts: activeProducts || 0,
        totalCategories: totalCategories || 0,
        storeIsActive: store.is_active ?? true,
        storeDeletedAt: store.deleted_at ?? null,
        userName: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Usuario'
    }
}
