import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getDashboardStats } from '@/actions/dashboard'
import StoreForm from '@/components/ui/dashboard/StoreForm'
import ShareStoreCard from '@/components/dashboard/ShareStoreCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
    PlusCircle,
    Package,
    FolderOpen,
    ShoppingBag,
    Settings,
    TrendingUp,
    ArrowUpRight,
    Users,
    CreditCard
} from 'lucide-react'

export default async function DashboardPage() {
    const stats = await getDashboardStats()

    if (!stats) {
        redirect('/login')
    }

    if (stats.storeDeletedAt) {
        redirect('/recover')
    }

    // ONBOARDING: Usuario sin tienda
    if (!stats.store) {
        return (
            <div className="max-w-2xl mx-auto py-20 text-center">
                <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Store className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight mb-2">¡Bienvenido a goveny!</h1>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">Estás a un paso de tener tu tienda online. Configura los detalles básicos para empezar.</p>
                <div className="bg-card border rounded-xl p-6 text-left shadow-sm">
                    <StoreForm userId={stats.userId} />
                </div>
            </div>
        )
    }

    // DASHBOARD REAL
    return (
        <div className="space-y-8">
            {/* Top Header Section */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Resumen</h2>
                    <p className="text-muted-foreground">
                        Bienvenido de nuevo, {stats.userName.split(' ')[0]}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" asChild>
                        <Link href={`/${stats.store.slug}`} target="_blank">
                            <ArrowUpRight className="mr-2 h-4 w-4" /> Ver Tienda
                        </Link>
                    </Button>
                    <Button asChild className="shadow-lg shadow-primary/20">
                        <Link href="/dashboard/products/new">
                            <PlusCircle className="mr-2 h-4 w-4" /> Crear Producto
                        </Link>
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard
                    title="Ingresos Totales"
                    value="Q 0.00"
                    icon={CreditCard}
                    trend="+0% mes pasado"
                    color="text-emerald-600"
                    bg="bg-emerald-100 dark:bg-emerald-900/20"
                />
                <KpiCard
                    title="Pedidos Activos"
                    value="0"
                    icon={ShoppingBag}
                    trend="0 pendientes"
                    color="text-blue-600"
                    bg="bg-blue-100 dark:bg-blue-900/20"
                />
                <KpiCard
                    title="Productos"
                    value={stats.totalProducts.toString()}
                    icon={Package}
                    trend={`${stats.activeProducts} publicados`}
                    color="text-violet-600"
                    bg="bg-violet-100 dark:bg-violet-900/20"
                />
                <KpiCard
                    title="Categorías"
                    value={stats.totalCategories.toString()}
                    icon={FolderOpen}
                    trend="Organización"
                    color="text-amber-600"
                    bg="bg-amber-100 dark:bg-amber-900/20"
                />
            </div>

                        {/* Main Content Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
                            
                            {/* Left Column: Chart & Quick Actions (Span 5) */}
                            <div className="lg:col-span-5 space-y-6">
                                {/* Fake Chart / Overview */}
                                <Card className="shadow-sm">
                                    <CardHeader>
                                        <CardTitle>Rendimiento de Ventas</CardTitle>
                                        <CardDescription>Resumen de actividad de los últimos 7 días</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-[200px] flex items-end justify-between gap-2 mt-4">
                                            {[35, 20, 45, 30, 60, 45, 75].map((h, i) => (
                                                <div key={i} className="w-full bg-primary/10 rounded-t-md relative group overflow-hidden" style={{ height: `${h}%` }}>
                                                    <div className="absolute bottom-0 left-0 right-0 bg-primary/80 h-0 transition-all duration-500 group-hover:h-full opacity-80"></div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex justify-between text-xs text-muted-foreground mt-2 px-1">
                                            <span>Lun</span><span>Mar</span><span>Mié</span><span>Jue</span><span>Vie</span><span>Sáb</span><span>Dom</span>
                                        </div>
                                    </CardContent>
                                </Card>
            
                                {/* Quick Actions */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                     <ActionCard 
                                        href="/dashboard/products"
                                        icon={Package}
                                        title="Gestionar Inventario"
                                        desc="Editar productos y stock"
                                     />
                                     <ActionCard 
                                        href="/dashboard/settings"
                                        icon={Settings}
                                        title="Configurar Tienda"
                                        desc="Logo, colores y datos"
                                     />
                                </div>
                            </div>
            
                            {/* Right Column: Store Card & Recent (Span 2) */}
                            <div className="lg:col-span-2 space-y-6">
                                <ShareStoreCard slug={stats.store.slug} />
                                
                                {/* Recent Activity Placeholder */}
                                <Card className="shadow-sm">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-lg">Actividad</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-5">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                                                    <TrendingUp className="h-4 w-4 text-green-600" />
                                                </div>
                                                <div className="space-y-0.5">
                                                    <p className="text-sm font-medium leading-none">Online</p>
                                                    <p className="text-[11px] text-muted-foreground">Tienda publicada</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                                                    <Users className="h-4 w-4 text-blue-600" />
                                                </div>
                                                <div className="space-y-0.5">
                                                    <p className="text-sm font-medium leading-none">Perfil</p>
                                                    <p className="text-[11px] text-muted-foreground">Bienvenido</p>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>        </div>
    )
}

function KpiCard({ title, value, icon: Icon, trend, color, bg }: any) {
    return (
        <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                    <div className={`p-2 rounded-lg ${bg}`}>
                        <Icon className={`h-4 w-4 ${color}`} />
                    </div>
                </div>
                <div className="flex flex-col gap-1 mt-2">
                    <div className="text-2xl font-bold">{value}</div>
                    <p className="text-xs text-muted-foreground">
                        {trend}
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}

function ActionCard({ href, icon: Icon, title, desc }: any) {
    return (
        <Link href={href} className="block group">
            <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer shadow-sm">
                <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                    <div className="p-3 rounded-full bg-primary/5 group-hover:bg-primary/10 transition-colors">
                        <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-semibold">{title}</h3>
                        <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                </CardContent>
            </Card>
        </Link>
    )
}

import { Store } from 'lucide-react'
