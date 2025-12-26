import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Plus, Edit, Trash2, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { deleteProduct } from '@/actions/products'

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

export default async function ProductsPage() {
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

    // Obtener productos con variantes y categorías
    const { data: products } = await supabase
        .from('products')
        .select(`
            *,
            product_variants(count),
            categories(name),
            product_images(image_url, display_order)
        `)
        .eq('store_id', store.id)
        .order('created_at', { ascending: false })

    // Función para obtener la imagen principal
    const getPrimaryImage = (images: Array<{ image_url: string; display_order: number }> | null) => {
        if (!images || images.length === 0) return null
        const sorted = [...images].sort((a, b) => a.display_order - b.display_order)
        return sorted[0].image_url
    }

    return (
        <div className="container mx-auto py-10 px-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Inventario</h1>
                    <p className="text-muted-foreground mt-1">
                        Gestiona tus productos y variantes
                    </p>
                </div>
                <Link href="/dashboard/products/new">
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Nuevo Producto
                    </Button>
                </Link>
            </div>

            {/* Contenido */}
            {!products || products.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-lg">
                    <Package className="h-16 w-16 text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No tienes productos</h3>
                    <p className="text-muted-foreground text-center mb-6 max-w-sm">
                        Empieza agregando tu primer producto para que tus clientes puedan verlo en tu tienda.
                    </p>
                    <Link href="/dashboard/products/new">
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Crear mi primer producto
                        </Button>
                    </Link>
                </div>
            ) : (
                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-20">Imagen</TableHead>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Categoría</TableHead>
                                <TableHead>Variantes</TableHead>
                                <TableHead className="text-right">Precio</TableHead>
                                <TableHead className="text-right w-32">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {products.map((product) => {
                                const primaryImage = getPrimaryImage(product.product_images)
                                const variantCount = product.product_variants?.[0]?.count ?? 0

                                return (
                                    <TableRow key={product.id}>
                                        {/* Imagen */}
                                        <TableCell>
                                            {primaryImage ? (
                                                <Image
                                                    src={primaryImage}
                                                    alt={product.title}
                                                    width={48}
                                                    height={48}
                                                    className="rounded-md object-cover w-12 h-12"
                                                />
                                            ) : (
                                                <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center">
                                                    <Package className="h-5 w-5 text-muted-foreground" />
                                                </div>
                                            )}
                                        </TableCell>

                                        {/* Nombre */}
                                        <TableCell className="font-medium">
                                            {product.title}
                                        </TableCell>

                                        {/* Categoría */}
                                        <TableCell>
                                            {product.categories?.name ? (
                                                <Badge variant="secondary">
                                                    {product.categories.name}
                                                </Badge>
                                            ) : (
                                                <span className="text-muted-foreground text-sm">Sin categoría</span>
                                            )}
                                        </TableCell>

                                        {/* Variantes */}
                                        <TableCell>
                                            {variantCount > 0 ? (
                                                <span className="text-sm">
                                                    {variantCount} {variantCount === 1 ? 'opción' : 'opciones'}
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground text-sm">Único</span>
                                            )}
                                        </TableCell>

                                        {/* Precio */}
                                        <TableCell className="text-right font-medium">
                                            Q{product.price.toFixed(2)}
                                        </TableCell>

                                        {/* Acciones */}
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {/* Botón Editar */}
                                                <Link href={`/dashboard/products/${product.id}`}>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        title="Editar producto"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                </Link>

                                                {/* Botón Borrar */}
                                                <form action={async () => {
                                                    'use server'
                                                    await deleteProduct(product.id)
                                                }}>
                                                    <Button
                                                        type="submit"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </form>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* Contador */}
            {products && products.length > 0 && (
                <p className="text-sm text-muted-foreground mt-4">
                    Mostrando {products.length} {products.length === 1 ? 'producto' : 'productos'}
                </p>
            )}
        </div>
    )
}
