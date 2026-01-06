'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog'
import { useCart, CartItem } from '@/hooks/use-cart'
import { formatPhoneForWhatsApp } from '@/lib/phone'
import { Loader2, MessageCircle } from 'lucide-react'

import { createOrder } from '@/actions/orders'

interface CheckoutDialogProps {
    storeId: string
    storePhone: string
    total: number
    children: React.ReactNode
}

export default function CheckoutDialog({ storeId, storePhone, total, children }: CheckoutDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const cart = useCart()

    // Estados del formulario
    const [customerName, setCustomerName] = useState('')
    const [customerPhone, setCustomerPhone] = useState('')
    const [customerAddress, setCustomerAddress] = useState('')

    const generateWhatsAppMessage = (items: CartItem[]) => {
        let message = `*NUEVO PEDIDO*\n\n`
        message += `*Cliente:* ${customerName}\n`
        if (customerPhone) message += `*Telefono:* ${customerPhone}\n`
        if (customerAddress) message += `*Direccion:* ${customerAddress}\n`
        message += `\n-------------------\n\n`
        message += `*PRODUCTOS:*\n`

        items.forEach((item, index) => {
            message += `${index + 1}. ${item.title}\n`
            message += `   Cantidad: ${item.quantity}\n`
            message += `   Precio: Q${Number(item.price).toFixed(2)}\n`
            if (item.selectedVariant) {
                message += `   Variante: ${item.selectedVariant}\n`
            }
            message += `   Subtotal: Q${(Number(item.price) * item.quantity).toFixed(2)}\n\n`
        })

        message += `-------------------\n`
        message += `*TOTAL: Q${total.toFixed(2)}*\n\n`
        message += `Gracias por tu compra!`

        return encodeURIComponent(message)
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!customerName.trim()) return

        setLoading(true)

        try {
            // 1. Guardar pedido en base de datos
            await createOrder({
                storeId,
                customerName,
                customerPhone,
                customerAddress,
                total
            }, cart.items)

            // 2. Generar URL de WhatsApp
            const message = generateWhatsAppMessage(cart.items)
            const formattedPhone = formatPhoneForWhatsApp(storePhone)
            const whatsappUrl = `https://wa.me/${formattedPhone}?text=${message}`

            // 3. Limpiar carrito
            cart.clearCart()

            // 4. Cerrar dialog y resetear form
            setOpen(false)
            setCustomerName('')
            setCustomerPhone('')
            setCustomerAddress('')

            // 5. Abrir WhatsApp
            window.open(whatsappUrl, '_blank')

        } catch (error) {
            console.error('Error:', error)
            alert('Hubo un problema al procesar el pedido. Por favor intenta de nuevo.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Finalizar Pedido</DialogTitle>
                    <DialogDescription>
                        Ingresa tus datos para completar el pedido por WhatsApp.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 py-4">
                        {/* Nombre */}
                        <div className="space-y-2">
                            <Label htmlFor="customer-name">
                                Nombre <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="customer-name"
                                placeholder="Tu nombre"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                disabled={loading}
                                required
                            />
                        </div>

                        {/* Teléfono */}
                        <div className="space-y-2">
                            <Label htmlFor="customer-phone">Teléfono (opcional)</Label>
                            <Input
                                id="customer-phone"
                                type="tel"
                                placeholder="+502 1234 5678"
                                value={customerPhone}
                                onChange={(e) => setCustomerPhone(e.target.value)}
                                disabled={loading}
                            />
                        </div>

                        {/* Dirección */}
                        <div className="space-y-2">
                            <Label htmlFor="customer-address">Dirección de entrega (opcional)</Label>
                            <Textarea
                                id="customer-address"
                                placeholder="Zona, Colonia, Calle, Número de casa..."
                                value={customerAddress}
                                onChange={(e) => setCustomerAddress(e.target.value)}
                                disabled={loading}
                                rows={2}
                                className="resize-none"
                            />
                        </div>

                        {/* Resumen */}
                        <div className="p-3 bg-muted rounded-lg">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">
                                    {cart.items.length} {cart.items.length === 1 ? 'producto' : 'productos'}
                                </span>
                                <span className="font-bold text-lg">Q{total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={loading}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading || !customerName.trim()}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Procesando...
                                </>
                            ) : (
                                <>
                                    <MessageCircle className="mr-2 h-4 w-4" />
                                    Confirmar por WhatsApp
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
