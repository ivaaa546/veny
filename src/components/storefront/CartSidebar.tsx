'use client'

import { ShoppingBag, Trash2, Minus, Plus } from 'lucide-react'
import { useCart } from '@/hooks/use-cart'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import CheckoutDialog from './CheckoutDialog'

interface CartSidebarProps {
    storeId: string
    storePhone: string
    children: React.ReactNode // El botón trigger (icono de bolsa)
}

export default function CartSidebar({ storeId, storePhone, children }: CartSidebarProps) {
    const cart = useCart()

    // Calculamos el total
    const total = cart.items.reduce((acc, item) => acc + (Number(item.price) * item.quantity), 0)

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
                                    <div key={item.cartItemId} className="flex gap-3 items-start">
                                        {/* Imagen Miniatura */}
                                        <div className="h-16 w-16 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                                            {item.image_url && (
                                                <img src={item.image_url} alt={item.title} className="h-full w-full object-cover" />
                                            )}
                                        </div>
                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-medium text-sm line-clamp-2">{item.title}</h4>
                                            {item.selectedVariant && (
                                                <p className="text-xs text-muted-foreground">{item.selectedVariant}</p>
                                            )}
                                            <p className="text-sm font-semibold text-green-700 mt-1">
                                                Q{(item.price * item.quantity).toFixed(2)}
                                            </p>
                                            
                                            {/* Controles de cantidad */}
                                            <div className="flex items-center gap-2 mt-2">
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-7 w-7"
                                                    onClick={() => cart.decreaseQuantity(item.cartItemId)}
                                                >
                                                    <Minus className="h-3 w-3" />
                                                </Button>
                                                <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-7 w-7"
                                                    onClick={() => cart.increaseQuantity(item.cartItemId)}
                                                >
                                                    <Plus className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                        {/* Borrar */}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-red-500 flex-shrink-0"
                                            onClick={() => cart.removeItem(item.cartItemId)}
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
                        <CheckoutDialog
                            storeId={storeId}
                            storePhone={storePhone}
                            total={total}
                        >
<Button className="w-full bg-black hover:bg-gray-800 h-12 text-lg">
                                Completar Pedido
                            </Button>
                        </CheckoutDialog>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    )
}