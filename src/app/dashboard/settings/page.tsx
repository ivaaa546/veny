import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import StoreSettingsForm from '@/components/dashboard/StoreSettingsForm'
import DangerZone from '@/components/dashboard/DangerZone'

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

export default async function SettingsPage() {
    const supabase = await getSupabaseClient()

    // Verificar autenticación
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
        redirect('/login')
    }

    // Obtener la tienda del usuario
    const { data: store, error } = await supabase
        .from('stores')
        .select('*')
        .eq('user_id', session.user.id)
        .single()

    if (error || !store) {
        redirect('/dashboard')
    }

    return (
        <div className="container mx-auto py-10 px-4 space-y-8">
            {/* Header */}
            <div className="mb-8 max-w-2xl mx-auto">
                <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
                <p className="text-muted-foreground mt-1">
                    Personaliza la información de tu tienda
                </p>
            </div>

            {/* Formulario */}
            <StoreSettingsForm store={store} userId={session.user.id} />

            {/* Zona de Peligro */}
            <div className="max-w-2xl mx-auto">
                <DangerZone
                    storeId={store.id}
                    isActive={store.is_active ?? true}
                    deletedAt={store.deleted_at}
                />
            </div>
        </div>
    )
}

