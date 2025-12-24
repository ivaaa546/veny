import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getMyStore } from '@/actions/stores'
import { getCategories, createCategory, deleteCategory } from '@/actions/categories'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trash2, Plus } from 'lucide-react'

export default async function CategoriesPage() {
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
                        // Ignorar errores de escritura de cookies en Server Components
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
        <div className="container max-w-2xl py-10">
            <div className="mb-8">
                <h1 className="text-3xl font-bold">Categorías</h1>
                <p className="text-muted-foreground">Gestiona las etiquetas para agrupar tus productos.</p>
            </div>

            {/* 1. FORMULARIO PARA AGREGAR (Con Server Action) */}
            <Card className="mb-8 border-dashed border-2 bg-gray-50/50">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Crear Nueva Categoría</CardTitle>
                </CardHeader>
                <CardContent>
                    <form action={createCategory} className="flex gap-2">
                        {/* Pasamos el ID de la tienda oculto */}
                        <input type="hidden" name="store_id" value={store.id} />

                        <Input
                            name="name"
                            placeholder="Ej: Hamburguesas, Bebidas..."
                            required
                            className="bg-white"
                        />
                        <Button type="submit">
                            <Plus className="h-4 w-4 mr-2" /> Agregar
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* 2. LISTA DE CATEGORÍAS */}
            <div className="space-y-3">
                {categories.length === 0 ? (
                    <div className="text-center py-10 border rounded-lg bg-white">
                        <p className="text-muted-foreground">No tienes categorías aún.</p>
                        <p className="text-sm text-gray-400">Agrega una arriba para empezar.</p>
                    </div>
                ) : (
                    categories.map((cat: any) => (
                        <div
                            key={cat.id}
                            className="flex items-center justify-between p-4 bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow"
                        >
                            <span className="font-medium pl-2 border-l-4 border-black">{cat.name}</span>

                            {/* Botón de Borrar (Server Action Inline) */}
                            <form action={async () => {
                                'use server'
                                await deleteCategory(cat.id)
                            }}>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </form>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}