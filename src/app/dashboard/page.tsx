import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getMyStore } from '@/actions/stores'
import StoreForm from '@/components/ui/dashboard/StoreForm'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { PlusCircle, ExternalLink } from 'lucide-react'
import LogoutButton from '@/components/ui/dashboard/LogoutButton'

export default async function DashboardPage() {
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
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
        }
    )

    const { data: { session } } = await supabase.auth.getSession()

    if (!session) redirect('/login')

    // Buscamos si ya tiene tienda
    const store = await getMyStore(session.user.id)

    // CASO 1: Usuario nuevo sin tienda -> Muestra Onboarding
    if (!store) {
        return (
            <div className="container py-10">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold">¡Bienvenido a LinkStore! 🚀</h1>
                    <p className="text-muted-foreground">Antes de subir productos, necesitamos configurar tu tienda.</p>
                </div>
                <StoreForm userId={session.user.id} />
            </div>
        )
    }

    // CASO 2: Usuario con tienda -> Muestra Dashboard Real
    return (
        <div className="container py-10 space-y-8">

            {/* Encabezado */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">{store.name}</h1>
                    <a
                        href={`/${store.slug}`}
                        target="_blank"
                        className="text-blue-600 hover:underline flex items-center gap-1 mt-1"
                    >
                        Ver mi tienda pública <ExternalLink className="h-4 w-4" />
                    </a>
                </div>
                <div className="flex gap-2">
                    <LogoutButton />
                    {/* Botón para editar tienda (Reusa el form en otra página o modal) */}
                    <Button variant="outline" asChild>
                        <Link href="/dashboard/settings">Configurar</Link>
                    </Button>
                    {/* Botón Acción Principal */}
                    <Button asChild>
                        <Link href="/dashboard/products/new">
                            <PlusCircle className="mr-2 h-4 w-4" /> Nuevo Producto
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Aquí podrías poner estadísticas simples */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-6 border rounded-xl bg-gray-50">
                    <h3 className="font-medium text-muted-foreground">Estado</h3>
                    <p className="text-2xl font-bold text-green-600">Activa</p>
                </div>
                {/* Más tarjetas... */}
            </div>

        </div>
    )
}