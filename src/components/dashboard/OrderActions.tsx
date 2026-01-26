'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { updateOrderStatus } from '@/actions/orders'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { OrderStatus } from '@/types'

interface OrderActionsProps {
    orderId: string
    currentStatus: OrderStatus | string
}

export default function OrderActions({ orderId, currentStatus }: OrderActionsProps) {
    const [loading, setLoading] = useState(false)
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false)

    const handleStatusChange = async (newStatus: OrderStatus) => {
        setLoading(true)
        try {
            await updateOrderStatus(orderId, newStatus)
            toast.success(
                newStatus === 'completed' 
                    ? 'Pedido marcado como completado' 
                    : 'Pedido cancelado'
            )
            setCancelDialogOpen(false)
        } catch (error) {
            console.error('Error:', error)
            toast.error('Error al actualizar el estado del pedido')
        } finally {
            setLoading(false)
        }
    }

    if (currentStatus !== 'pending') {
        return null // Solo mostramos acciones para pedidos pendientes
    }

    return (
        <div className="flex gap-2 mt-4 pt-4 border-t">
            <Button 
                onClick={() => handleStatusChange('completed')} 
                disabled={loading}
                size="sm" 
                className="bg-green-600 hover:bg-green-700"
            >
                {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                )}
                Marcar como Completado
            </Button>
            
            <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                <AlertDialogTrigger asChild>
                    <Button 
                        disabled={loading}
                        size="sm" 
                        variant="destructive"
                    >
                        <XCircle className="mr-2 h-4 w-4" />
                        Cancelar Pedido
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Cancelar este pedido?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción marcará el pedido como cancelado. El cliente debería ser notificado de esta cancelación.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={loading}>No, volver</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault()
                                handleStatusChange('cancelled')
                            }}
                            disabled={loading}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {loading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : null}
                            Sí, cancelar pedido
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
