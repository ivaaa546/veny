import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Package, ChevronDown, User, MapPin, Phone } from 'lucide-react'
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
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { updateOrderStatus } from '@/actions/orders'

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
        hour: '2-digit',
        minute: '2-digit'
    })
}

function getStatusBadge(status: string) {
    switch (status) {
        case 'pending':
            return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">Pendiente</Badge>
        case 'completed':
            return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">Completado</Badge>
        case 'cancelled':
            return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">Cancelado</Badge>
        default:
            return <Badge variant="outline">{status}</Badge>
    }
}

export default async function OrdersPage() {
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

    // Obtener pedidos con sus items
    const { data: orders } = await supabase
        .from('orders')
        .select(`
            *,
            order_items(*)
        `)
        .eq('store_id', store.id)
        .order('created_at', { ascending: false })

    return (
        <div className="container mx-auto py-10 px-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Pedidos</h1>
                    <p className="text-muted-foreground mt-1">
                        Gestiona los pedidos de tu tienda
                    </p>
                </div>
            </div>

            {/* Contenido */}
            {!orders || orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-lg">
                    <Package className="h-16 w-16 text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No tienes pedidos aún</h3>
                    <p className="text-muted-foreground text-center max-w-sm">
                        Cuando tus clientes hagan pedidos, aparecerán aquí.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map((order) => (
                        <Collapsible key={order.id}>
                            <div className="border rounded-lg bg-white">
                                {/* Fila principal del pedido */}
                                <div className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <CollapsibleTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <ChevronDown className="h-4 w-4" />
                                            </Button>
                                        </CollapsibleTrigger>

                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-sm text-muted-foreground">
                                                    #{order.id.slice(0, 8).toUpperCase()}
                                                </span>
                                                {getStatusBadge(order.status)}
                                            </div>
                                            <div className="flex items-center gap-4 mt-1 text-sm">
                                                <span className="flex items-center gap-1">
                                                    <User className="h-3 w-3" />
                                                    {order.customer_name}
                                                </span>
                                                <span className="text-muted-foreground">
                                                    {formatDate(order.created_at)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <span className="font-bold text-lg">Q{Number(order.total).toFixed(2)}</span>
                                        <p className="text-xs text-muted-foreground">
                                            {order.order_items?.length || 0} productos
                                        </p>
                                    </div>
                                </div>

                                {/* Detalles expandidos */}
                                <CollapsibleContent>
                                    <div className="border-t px-4 py-4 bg-muted/30">
                                        {/* Info del cliente */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                            <div className="flex items-start gap-2">
                                                <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Cliente</p>
                                                    <p className="font-medium">{order.customer_name}</p>
                                                </div>
                                            </div>
                                            {order.customer_phone && (
                                                <div className="flex items-start gap-2">
                                                    <Phone className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">Teléfono</p>
                                                        <p className="font-medium">{order.customer_phone}</p>
                                                    </div>
                                                </div>
                                            )}
                                            {order.customer_address && (
                                                <div className="flex items-start gap-2">
                                                    <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">Dirección</p>
                                                        <p className="font-medium">{order.customer_address}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Lista de productos */}
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Producto</TableHead>
                                                    <TableHead className="text-center">Cantidad</TableHead>
                                                    <TableHead className="text-right">Precio</TableHead>
                                                    <TableHead className="text-right">Subtotal</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {order.order_items?.map((item: { id: string; product_title: string; variant_info?: string; quantity: number; price: number }) => (
                                                    <TableRow key={item.id}>
                                                        <TableCell>
                                                            <div>
                                                                <span className="font-medium">{item.product_title}</span>
                                                                {item.variant_info && (
                                                                    <span className="text-xs text-muted-foreground ml-2">
                                                                        ({item.variant_info})
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-center">{item.quantity}</TableCell>
                                                        <TableCell className="text-right">Q{Number(item.price).toFixed(2)}</TableCell>
                                                        <TableCell className="text-right font-medium">
                                                            Q{(Number(item.price) * item.quantity).toFixed(2)}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>

                                        {/* Acciones */}
                                        <div className="flex gap-2 mt-4 pt-4 border-t">
                                            {order.status === 'pending' && (
                                                <>
                                                    <form action={async () => {
                                                        'use server'
                                                        await updateOrderStatus(order.id, 'completed')
                                                    }}>
                                                        <Button type="submit" size="sm" className="bg-green-600 hover:bg-green-700">
                                                            Marcar como Completado
                                                        </Button>
                                                    </form>
                                                    <form action={async () => {
                                                        'use server'
                                                        await updateOrderStatus(order.id, 'cancelled')
                                                    }}>
                                                        <Button type="submit" size="sm" variant="destructive">
                                                            Cancelar Pedido
                                                        </Button>
                                                    </form>
                                                </>
                                            )}
                                            {order.status === 'completed' && (
                                                <span className="text-sm text-green-600 font-medium">✓ Pedido completado</span>
                                            )}
                                            {order.status === 'cancelled' && (
                                                <span className="text-sm text-red-600 font-medium">✕ Pedido cancelado</span>
                                            )}
                                        </div>
                                    </div>
                                </CollapsibleContent>
                            </div>
                        </Collapsible>
                    ))}
                </div>
            )}

            {/* Contador */}
            {orders && orders.length > 0 && (
                <p className="text-sm text-muted-foreground mt-4">
                    {orders.length} {orders.length === 1 ? 'pedido' : 'pedidos'}
                </p>
            )}
        </div>
    )
}
