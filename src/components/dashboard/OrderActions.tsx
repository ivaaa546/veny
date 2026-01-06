'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { updateOrderStatus } from '@/actions/orders'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { toast } from 'sonner' // O usar alert si no tienes sonner

interface OrderActionsProps {
    orderId: string
    currentStatus: string
}

export default function OrderActions({ orderId, currentStatus }: OrderActionsProps) {
    const [loading, setLoading] = useState(false)

    const handleStatusChange = async (newStatus: string) => {
        setLoading(true)
        try {
            await updateOrderStatus(orderId, newStatus)
            // toast.success('Estado actualizado') // Si tuvieras toast
        } catch (error) {
            console.error('Error:', error)
            alert('Error al actualizar el estado')
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
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                Marcar como Completado
            </Button>
            
            <Button 
                onClick={() => handleStatusChange('cancelled')} 
                disabled={loading}
                size="sm" 
                variant="destructive"
            >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                Cancelar Pedido
            </Button>
        </div>
    )
}
