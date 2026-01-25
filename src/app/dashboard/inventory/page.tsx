import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { redirect } from 'next/navigation'
import { getStoreInventory, getInventoryStats } from '@/actions/inventory'
import InventoryClient from './InventoryClient'

async function getStore() {
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
                        // Ignorar
                    }
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: store } = await supabase
        .from('stores')
        .select('*')
        .eq('user_id', user.id)
        .single()

    if (!store) redirect('/dashboard')

    return store
}

export default async function InventoryPage() {
    const store = await getStore()
    const inventory = await getStoreInventory(store.id)
    const stats = await getInventoryStats(store.id)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Inventario</h1>
                <p className="text-muted-foreground">
                    Gestiona el stock de las variantes de tus productos
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <StatCard
                    title="Total Variantes"
                    value={stats.totalVariants}
                    className="bg-slate-50"
                />
                <StatCard
                    title="Con Stock"
                    value={stats.inStock}
                    className="bg-green-50 text-green-700"
                />
                <StatCard
                    title="Stock Bajo"
                    value={stats.lowStock}
                    subtitle="(5 o menos)"
                    className="bg-amber-50 text-amber-700"
                />
                <StatCard
                    title="Sin Stock"
                    value={stats.outOfStock}
                    className="bg-red-50 text-red-700"
                />
            </div>

            {/* Inventory Table */}
            <InventoryClient inventory={inventory} />
        </div>
    )
}

function StatCard({ 
    title, 
    value, 
    subtitle,
    className = '' 
}: { 
    title: string
    value: number
    subtitle?: string
    className?: string 
}) {
    return (
        <div className={`rounded-xl border p-4 ${className}`}>
            <p className="text-sm font-medium opacity-80">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
            {subtitle && <p className="text-xs opacity-60">{subtitle}</p>}
        </div>
    )
}
