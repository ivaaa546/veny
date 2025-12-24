'use client'

import { ShoppingBag, Trash2 } from 'lucide-react'
import { useCart } from '@/hooks/use-cart'
import { generateWhatsAppLink } from '@/lib/whatsapp'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'

interface CartSidebarProps {
    storePhone: string
    children: React.ReactNode // El botón trigger (icono de bolsa)
}

export default function CartSidebar({ storePhone, children }: CartSidebarProps) {
    const cart = useCart()

    // Calculamos el total
    const total = cart.items.reduce((acc, item) => acc + (Number(item.price) * item.quantity), 0)

    const handleCheckout = () => {
        const link = generateWhatsAppLink(storePhone, cart.items)
        window.open(link, '_blank')
    }

    return (
        <Sheet>
            <SheetTrigger asChild>
                {children}
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md flex flex-col h-full">
                <SheetHeader>
                    <SheetTitle>Tu Pedido ({cart.items.length})</SheetTitle>
                </SheetHeader>

                {/* Lista de Productos (Scrollable) */}
                <div className="flex-1 overflow-hidden mt-4">
                    {cart.items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                            <ShoppingBag className="h-12 w-12 mb-2 opacity-20" />
                            <p>Tu carrito está vacío</p>
                        </div>
                    ) : (
                        <ScrollArea className="h-[60vh]">
                            <div className="space-y-4 pr-4">
                                {cart.items.map((item) => (
                                    <div key={item.id} className="flex gap-4 items-start">
                                        {/* Imagen Miniatura */}
                                        <div className="h-16 w-16 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                                            {item.image_url && (
                                                <img src={item.image_url} alt={item.title} className="h-full w-full object-cover" />
                                            )}
                                        </div>
                                        {/* Info */}
                                        <div className="flex-1">
                                            <h4 className="font-medium text-sm line-clamp-2">{item.title}</h4>
                                            <p className="text-sm text-gray-500">
                                                {item.quantity} x Q{item.price}
                                            </p>
                                        </div>
                                        {/* Borrar */}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-red-500"
                                            onClick={() => cart.removeItem(item.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    )}
                </div>

                {/* Footer con Total y Botón */}
                {cart.items.length > 0 && (
                    <div className="border-t pt-4 mt-auto space-y-4">
                        <Separator />
                        <div className="flex justify-between font-bold text-lg">
                            <span>Total:</span>
                            <span>Q{total.toFixed(2)}</span>
                        </div>
                        <Button
                            className="w-full bg-green-600 hover:bg-green-700 h-12 text-lg"
                            onClick={handleCheckout}
                        >
                            Completar Pedido por WhatsApp
                        </Button>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    )
}