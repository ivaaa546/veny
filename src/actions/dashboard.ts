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
    userId: string
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
    // Nuevas métricas de ventas
    totalRevenue: number
    pendingOrders: number
    salesChart: { date: string; amount: number; label: string }[]
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
            userId: session.user.id,
            store: null,
            totalProducts: 0,
            activeProducts: 0,
            totalCategories: 0,
            storeIsActive: false,
            storeDeletedAt: null,
            userName: session.user.email?.split('@')[0] || 'Usuario',
            totalRevenue: 0,
            pendingOrders: 0,
            salesChart: Array(7).fill({ date: '', amount: 0, label: '' })
        }
    }

    // Ejecutar consultas en paralelo para mejor rendimiento
    const [
        { count: totalProducts },
        { count: activeProducts },
        { count: totalCategories },
        { data: orders },
        { count: pendingOrders }
    ] = await Promise.all([
        // 1. Productos totales
        supabase.from('products').select('*', { count: 'exact', head: true }).eq('store_id', store.id),
        // 2. Productos activos
        supabase.from('products').select('*', { count: 'exact', head: true }).eq('store_id', store.id).eq('is_active', true),
        // 3. Categorías
        supabase.from('categories').select('*', { count: 'exact', head: true }).eq('store_id', store.id),
        // 4. Pedidos (últimos 7 días + total histórico para ingresos)
        supabase.from('orders').select('total, created_at, status').eq('store_id', store.id).neq('status', 'cancelled'),
        // 5. Pedidos pendientes
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('store_id', store.id).eq('status', 'pending')
    ])

    // Procesar datos de ventas
    let totalRevenue = 0
    const last7DaysMap = new Map<string, number>()
    
    // Inicializar mapa de últimos 7 días
    const today = new Date()
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
    
    for (let i = 6; i >= 0; i--) {
        const d = new Date(today)
        d.setDate(d.getDate() - i)
        const dateKey = d.toISOString().split('T')[0] // YYYY-MM-DD
        last7DaysMap.set(dateKey, 0)
    }

    if (orders) {
        orders.forEach(order => {
            // Sumar al ingreso total histórico (si no está cancelado)
            totalRevenue += Number(order.total) || 0

            // Sumar al gráfico si es de los últimos 7 días
            const orderDate = order.created_at.split('T')[0]
            if (last7DaysMap.has(orderDate)) {
                last7DaysMap.set(orderDate, (last7DaysMap.get(orderDate) || 0) + Number(order.total))
            }
        })
    }

    // Convertir mapa a array para el gráfico
    const salesChart = Array.from(last7DaysMap.entries()).map(([date, amount]) => {
        const d = new Date(date)
        // Ajuste zona horaria manual simple para obtener día correcto
        const dayIndex = new Date(d.getTime() + d.getTimezoneOffset() * 60000).getDay()
        return {
            date,
            amount,
            label: days[dayIndex]
        }
    })

    return {
        userId: session.user.id,
        store,
        totalProducts: totalProducts || 0,
        activeProducts: activeProducts || 0,
        totalCategories: totalCategories || 0,
        storeIsActive: store.is_active ?? true,
        storeDeletedAt: store.deleted_at ?? null,
        userName: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Usuario',
        totalRevenue,
        pendingOrders: pendingOrders || 0,
        salesChart
    }
}
