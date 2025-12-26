import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import RecoverAccountCard from '@/components/dashboard/RecoverAccountCard'

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

export default async function RecoverPage() {
    const supabase = await getSupabaseClient()

    // Verificar autenticación
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
        redirect('/login')
    }

    // Obtener la tienda del usuario
    const { data: store } = await supabase
        .from('stores')
        .select('id, name, deleted_at')
        .eq('user_id', session.user.id)
        .single()

    // Si no tiene tienda o la tienda no está marcada para eliminar
    if (!store || !store.deleted_at) {
        redirect('/dashboard')
    }

    // Calcular días restantes
    const deletedDate = new Date(store.deleted_at)
    const now = new Date()
    const daysSinceDelete = Math.floor((now.getTime() - deletedDate.getTime()) / (1000 * 60 * 60 * 24))
    const daysRemaining = Math.max(0, 30 - daysSinceDelete)

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <RecoverAccountCard
                storeId={store.id}
                storeName={store.name}
                daysRemaining={daysRemaining}
            />
        </div>
    )
}
