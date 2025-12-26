import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Trash2, FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { deleteCategory } from '@/actions/categories'
import CreateCategoryDialog from '@/components/dashboard/CreateCategoryDialog'
import EditCategoryDialog from '@/components/dashboard/EditCategoryDialog'

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

function formatDate(dateString: string) {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-GT', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    })
}

export default async function CategoriesPage() {
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

    // Obtener categorías
    const { data: categories } = await supabase
        .from('categories')
        .select('*')
        .eq('store_id', store.id)
        .order('created_at', { ascending: true })

    return (
        <div className="container mx-auto py-10 px-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Categorías</h1>
                    <p className="text-muted-foreground mt-1">
                        Organiza tus productos en categorías
                    </p>
                </div>
                <CreateCategoryDialog storeId={store.id} />
            </div>

            {/* Contenido */}
            {!categories || categories.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-lg">
                    <FolderOpen className="h-16 w-16 text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No tienes categorías</h3>
                    <p className="text-muted-foreground text-center mb-6 max-w-sm">
                        Las categorías te ayudan a organizar tus productos y facilitan la navegación para tus clientes.
                    </p>
                    <CreateCategoryDialog storeId={store.id} />
                </div>
            ) : (
                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Fecha de creación</TableHead>
                                <TableHead className="text-right w-24">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {categories.map((category) => (
                                <TableRow key={category.id}>
                                    {/* Nombre */}
                                    <TableCell className="font-medium">
                                        {category.name}
                                    </TableCell>

                                    {/* Fecha */}
                                    <TableCell className="text-muted-foreground">
                                        {formatDate(category.created_at)}
                                    </TableCell>

                                    {/* Acciones */}
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <EditCategoryDialog category={{ id: category.id, name: category.name }} />
                                            <form action={async () => {
                                                'use server'
                                                await deleteCategory(category.id)
                                            }}>
                                                <Button
                                                    type="submit"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    title="Eliminar categoría"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </form>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* Contador */}
            {categories && categories.length > 0 && (
                <p className="text-sm text-muted-foreground mt-4">
                    {categories.length} {categories.length === 1 ? 'categoría' : 'categorías'}
                </p>
            )}
        </div>
    )
}