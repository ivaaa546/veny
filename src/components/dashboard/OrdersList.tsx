'use client'

import { useState } from 'react'
import { Package, ChevronDown, User, MapPin, Phone, Truck } from 'lucide-react'
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
import OrderActions from '@/components/dashboard/OrderActions'
import { Order, OrderItem, OrderStatus } from '@/types'

interface OrdersListProps {
    orders: Order[]
}

type FilterStatus = 'all' | OrderStatus

function formatDate(dateString: string) {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-GT', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
    })
}

function getStatusBadge(status: OrderStatus) {
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

function getDeliveryPlaceLabel(place: string | null) {
    switch (place) {
        case 'casa': return 'Casa'
        case 'trabajo': return 'Trabajo'
        case 'otro': return 'Otro lugar'
        default: return place
    }
}

export default function OrdersList({ orders }: OrdersListProps) {
    const [filter, setFilter] = useState<FilterStatus>('all')

    // Contar órdenes por estado
    const counts = {
        all: orders.length,
        pending: orders.filter(o => o.status === 'pending').length,
        completed: orders.filter(o => o.status === 'completed').length,
        cancelled: orders.filter(o => o.status === 'cancelled').length,
    }

    // Filtrar órdenes
    const filteredOrders = filter === 'all' 
        ? orders 
        : orders.filter(o => o.status === filter)

    const filterButtons: { key: FilterStatus; label: string; color: string }[] = [
        { key: 'all', label: 'Todos', color: 'bg-slate-100 text-slate-700' },
        { key: 'pending', label: 'Pendientes', color: 'bg-yellow-100 text-yellow-700' },
        { key: 'completed', label: 'Completados', color: 'bg-green-100 text-green-700' },
        { key: 'cancelled', label: 'Cancelados', color: 'bg-red-100 text-red-700' },
    ]

    if (orders.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-lg">
                <Package className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No tienes pedidos aún</h3>
                <p className="text-muted-foreground text-center max-w-sm">
                    Cuando tus clientes hagan pedidos, aparecerán aquí.
                </p>
            </div>
        )
    }

    return (
        <>
            {/* Filtros por estado */}
            <div className="flex flex-wrap gap-2 mb-6">
                {filterButtons.map(({ key, label, color }) => (
                    <button
                        key={key}
                        onClick={() => setFilter(key)}
                        className={`
                            px-4 py-2 rounded-full text-sm font-medium transition-all
                            ${filter === key 
                                ? `${color} ring-2 ring-offset-2 ring-slate-400` 
                                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                            }
                        `}
                    >
                        {label}
                        <span className="ml-2 bg-white/50 px-2 py-0.5 rounded-full text-xs">
                            {counts[key]}
                        </span>
                    </button>
                ))}
            </div>

            {/* Lista de órdenes */}
            {filteredOrders.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                    No hay pedidos con el estado seleccionado.
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredOrders.map((order) => (
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
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
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
                                            {(order.customer_department || order.customer_municipality) && (
                                                <div className="flex items-start gap-2">
                                                    <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">Ubicación</p>
                                                        <p className="font-medium">
                                                            {order.customer_municipality && `${order.customer_municipality}, `}
                                                            {order.customer_department}
                                                        </p>
                                                        {order.customer_zone && (
                                                            <p className="text-xs text-muted-foreground">
                                                                {order.customer_zone}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                            {order.delivery_place && (
                                                <div className="flex items-start gap-2">
                                                    <Truck className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">Entregar en</p>
                                                        <p className="font-medium">{getDeliveryPlaceLabel(order.delivery_place)}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Referencia si existe */}
                                        {order.customer_reference && (
                                            <div className="mb-4 p-2 bg-amber-50 border border-amber-200 rounded text-sm">
                                                <span className="font-medium text-amber-800">Referencia: </span>
                                                <span className="text-amber-700">{order.customer_reference}</span>
                                            </div>
                                        )}

                                        {/* Dirección legacy si existe y no hay campos nuevos */}
                                        {order.customer_address && !order.customer_department && (
                                            <div className="flex items-start gap-2 mb-4">
                                                <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Dirección</p>
                                                    <p className="font-medium">{order.customer_address}</p>
                                                </div>
                                            </div>
                                        )}

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
                                                {order.order_items?.map((item: OrderItem) => (
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
                                        <OrderActions orderId={order.id} currentStatus={order.status} />

                                        {/* Estado estático si no es pending */}
                                        {order.status === 'completed' && (
                                            <div className="mt-4 pt-4 border-t">
                                                <span className="text-sm text-green-600 font-medium">✓ Pedido completado</span>
                                            </div>
                                        )}
                                        {order.status === 'cancelled' && (
                                            <div className="mt-4 pt-4 border-t">
                                                <span className="text-sm text-red-600 font-medium">✕ Pedido cancelado</span>
                                            </div>
                                        )}
                                    </div>
                                </CollapsibleContent>
                            </div>
                        </Collapsible>
                    ))}
                </div>
            )}

            {/* Contador */}
            <p className="text-sm text-muted-foreground mt-4">
                Mostrando {filteredOrders.length} de {orders.length} {orders.length === 1 ? 'pedido' : 'pedidos'}
            </p>
        </>
    )
}
