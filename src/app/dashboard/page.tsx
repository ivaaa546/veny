import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getDashboardStats } from '@/actions/dashboard'
import StoreForm from '@/components/ui/dashboard/StoreForm'
import ShareStoreCard from '@/components/dashboard/ShareStoreCard'
import LogoutButton from '@/components/ui/dashboard/LogoutButton'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PlusCircle, Package, FolderOpen, ShoppingBag, Settings } from 'lucide-react'

export default async function DashboardPage() {
    const stats = await getDashboardStats()

    if (!stats) {
        redirect('/login')
    }

    // CASO 0: Cuenta marcada para eliminación -> Redirigir a recuperación
    if (stats.storeDeletedAt) {
        redirect('/recover')
    }

    // CASO 1: Usuario nuevo sin tienda -> Muestra Onboarding
    if (!stats.store) {
        return (
            <div className="container py-10">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold">¡Bienvenido a Veny! 🚀</h1>
                    <p className="text-muted-foreground">Antes de subir productos, necesitamos configurar tu tienda.</p>
                </div>
                <StoreForm userId={stats.userId} />
            </div>
        )
    }

    // CASO 2: Usuario con tienda -> Muestra Dashboard Real
    return (
        <div className="container mx-auto py-10 px-4 space-y-8">

            {/* Header con saludo */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">
                        Hola, {stats.userName} 👋
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Bienvenido al panel de <span className="font-medium text-foreground">{stats.store.name}</span>
                    </p>
                </div>
                <div className="flex gap-2">
                    <LogoutButton />
                    <Button variant="outline" asChild>
                        <Link href="/dashboard/settings">
                            <Settings className="mr-2 h-4 w-4" /> Configurar
                        </Link>
                    </Button>
                    <Button asChild>
                        <Link href="/dashboard/products/new">
                            <PlusCircle className="mr-2 h-4 w-4" /> Nuevo Producto
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Grid principal */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Columna izquierda: Estadísticas + Enlaces rápidos */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Tarjetas de estadísticas */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* Total Productos */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    Total Productos
                                </CardTitle>
                                <Package className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold">{stats.totalProducts}</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {stats.activeProducts} activos
                                </p>
                            </CardContent>
                        </Card>

                        {/* Categorías */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    Categorías
                                </CardTitle>
                                <FolderOpen className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold">{stats.totalCategories}</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    para organizar
                                </p>
                            </CardContent>
                        </Card>

                        {/* Estado de la tienda */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    Estado
                                </CardTitle>
                                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className={`text-3xl font-bold ${stats.storeIsActive ? 'text-green-600' : 'text-gray-400'}`}>
                                    {stats.storeIsActive ? 'Activa' : 'Inactiva'}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {stats.storeIsActive ? 'lista para vender' : 'tienda oculta'}
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Enlaces rápidos */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Acciones Rápidas</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
                                    <Link href="/dashboard/products">
                                        <Package className="h-5 w-5" />
                                        <span className="text-xs">Productos</span>
                                    </Link>
                                </Button>
                                <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
                                    <Link href="/dashboard/categories">
                                        <FolderOpen className="h-5 w-5" />
                                        <span className="text-xs">Categorías</span>
                                    </Link>
                                </Button>
                                <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
                                    <Link href="/dashboard/products/new">
                                        <PlusCircle className="h-5 w-5" />
                                        <span className="text-xs">Nuevo Producto</span>
                                    </Link>
                                </Button>
                                <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
                                    <Link href="/dashboard/settings">
                                        <Settings className="h-5 w-5" />
                                        <span className="text-xs">Configuración</span>
                                    </Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Columna derecha: QR para compartir */}
                <div className="lg:col-span-1">
                    <ShareStoreCard slug={stats.store.slug} />
                </div>
            </div>
        </div>
    )
}