import ProductForm from '@/components/ui/dashboard/ProductForm'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getMyStore } from '@/actions/stores'
import { getCategories } from '@/actions/categories'

export default async function NewProductPage() {
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

    const { data: { session } } = await supabase.auth.getSession()

    if (!session) redirect('/login')

    // Obtener la tienda del usuario
    const store = await getMyStore(session.user.id)
    if (!store) redirect('/dashboard')

    // Obtener las categorías de la tienda
    const categories = await getCategories(store.id)

    return (
        <div className="container mx-auto px-4">
            <h1 className="text-3xl font-bold mb-6">Crear Nuevo Producto</h1>
            <ProductForm userId={session.user.id} categories={categories} />
        </div>
    )
}