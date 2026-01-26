import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import OrdersList from '@/components/dashboard/OrdersList'
import { Order } from '@/types'

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

export default async function OrdersPage() {
    const supabase = await getSupabaseClient()

    // Verificar autenticación
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
        redirect('/login')
    }

    // Obtener la tienda del usuario
    const { data: store } = await supabase
        .from('stores')
        .select('id')
        .eq('user_id', session.user.id)
        .single()

    if (!store) {
        redirect('/dashboard')
    }

    // Obtener pedidos con sus items
    const { data: ordersData } = await supabase
        .from('orders')
        .select(`
            *,
            order_items(*)
        `)
        .eq('store_id', store.id)
        .order('created_at', { ascending: false })

    const orders = (ordersData || []) as Order[]

    return (
        <div className="container mx-auto py-10 px-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Pedidos</h1>
                    <p className="text-muted-foreground mt-1">
                        Gestiona los pedidos de tu tienda
                    </p>
                </div>
            </div>

            {/* Lista de pedidos con filtros */}
            <OrdersList orders={orders} />
        </div>
    )
}
