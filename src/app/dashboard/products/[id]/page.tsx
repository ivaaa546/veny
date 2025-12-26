import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect, notFound } from 'next/navigation'
import ProductForm from '@/components/ui/dashboard/ProductForm'

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

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function EditProductPage({ params }: PageProps) {
    const { id } = await params
    const supabase = await getSupabaseClient()

    // Verificar autenticación
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
        redirect('/login')
    }

    // Obtener el producto con todas sus relaciones
    const { data: product, error } = await supabase
        .from('products')
        .select(`
            *,
            product_variants(*),
            product_images(*)
        `)
        .eq('id', id)
        .single()

    if (error || !product) {
        notFound()
    }

    // Verificar que el producto pertenece a la tienda del usuario
    const { data: store } = await supabase
        .from('stores')
        .select('id')
        .eq('user_id', session.user.id)
        .single()

    if (!store || product.store_id !== store.id) {
        redirect('/dashboard/products')
    }

    // Obtener categorías para el select
    const { data: categories } = await supabase
        .from('categories')
        .select('id, name')
        .eq('store_id', store.id)
        .order('name')

    // Transformar datos para el formulario
    const initialData = {
        id: product.id,
        title: product.title,
        price: product.price,
        description: product.description || '',
        category_id: product.category_id || '',
        variants: (product.product_variants || []).map((v: { variant_type: string; variant_value: string; price_adjustment: number }) => ({
            type: v.variant_type,
            value: v.variant_value,
            priceAdjustment: v.price_adjustment || 0
        })),
        images: (product.product_images || [])
            .sort((a: { display_order: number }, b: { display_order: number }) => a.display_order - b.display_order)
            .map((img: { id: string; image_url: string }) => ({
                id: img.id,
                url: img.image_url
            }))
    }

    return (
        <div className="container mx-auto py-10 px-4">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Editar Producto</h1>
                <p className="text-muted-foreground mt-1">
                    Modifica la información de tu producto
                </p>
            </div>

            <ProductForm
                userId={session.user.id}
                categories={categories || []}
                initialData={initialData}
            />
        </div>
    )
}
