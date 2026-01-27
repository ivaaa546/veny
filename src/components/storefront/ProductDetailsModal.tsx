'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ShoppingCart, Zap, Share2, Check } from 'lucide-react'
import { toast } from 'sonner'
import { useState, useEffect } from 'react'
import { useCart } from '@/hooks/use-cart'
import { trackViewContent, trackAddToCart } from '@/hooks/use-facebook-pixel'
import CheckoutDialog from './CheckoutDialog'

interface ProductDetailsModalProps {
    product: any
    images?: Array<{ image_url: string; display_order: number }>
    variants?: Array<{ id: string; variant_type: string; variant_value: string; price_adjustment: number; stock: number }>
    open: boolean
    onOpenChange: (open: boolean) => void
    storeId: string
    storePhone: string
    storeSlug: string
}

export default function ProductDetailsModal({
    product,
    images = [],
    variants = [],
    open,
    onOpenChange,
    storeId,
    storePhone,
    storeSlug
}: ProductDetailsModalProps) {
    const [selectedImage, setSelectedImage] = useState(0)
    const [selectedVariant, setSelectedVariant] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)
    const [checkoutOpen, setCheckoutOpen] = useState(false)
    const [quantity, setQuantity] = useState(1)

    const cart = useCart()

    // Usar imágenes de la relación o fallback a image_url del producto
    const productImages = images.length > 0
        ? images.sort((a, b) => a.display_order - b.display_order).map(img => img.image_url)
        : product.image_url ? [product.image_url] : []

    // Calcular precio con variante seleccionada
    const selectedVariantData = variants.find(v => v.id === selectedVariant)
    const finalPrice = selectedVariantData
        ? product.price + selectedVariantData.price_adjustment
        : product.price

    // Agrupar variantes por tipo
    const variantsByType = variants.reduce((acc: any, variant) => {
        if (!acc[variant.variant_type]) {
            acc[variant.variant_type] = []
        }
        acc[variant.variant_type].push(variant)
        return acc
    }, {})

    // Track ViewContent cuando se abre el modal
    useEffect(() => {
        if (open && product) {
            trackViewContent({
                id: product.id,
                title: product.title,
                price: product.price,
            })
        }
    }, [open, product])

    // Calcular si el producto está agotado
    const hasVariants = variants.length > 0
    const isOutOfStock = hasVariants
        ? selectedVariantData
            ? (selectedVariantData.stock || 0) <= 0
            : variants.every(v => (v.stock || 0) <= 0)
        : false

    // Manejar "Comprar Ahora"
    const handleBuyNow = () => {
        // Agregar al carrito con la cantidad seleccionada
        for (let i = 0; i < quantity; i++) {
            cart.addItem({
                id: product.id,
                title: product.title,
                price: finalPrice,
                image_url: productImages[0] ?? product.image_url ?? null,
                selectedVariant: selectedVariantData
                    ? `${selectedVariantData.variant_type}: ${selectedVariantData.variant_value}`
                    : undefined
            })
        }
        // Cerrar modal del producto y abrir checkout
        onOpenChange(false)
        // Pequeño delay para que se cierre el modal primero
        setTimeout(() => {
            setCheckoutOpen(true)
        }, 100)
    }

    // Manejar "Compartir"
    const handleShare = async () => {
        const url = `${window.location.origin}/${storeSlug}#producto-${product.id}`

        try {
            await navigator.clipboard.writeText(url)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            // Fallback para navegadores que no soportan clipboard API
            const textArea = document.createElement('textarea')
            textArea.value = url
            document.body.appendChild(textArea)
            textArea.select()
            document.execCommand('copy')
            document.body.removeChild(textArea)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    // Manejar agregar al carrito
    const handleAddToCart = () => {
        cart.addItem({
            id: product.id,
            title: product.title,
            price: finalPrice,
            image_url: productImages[0] ?? product.image_url ?? null,
            selectedVariant: selectedVariantData
                ? `${selectedVariantData.variant_type}: ${selectedVariantData.variant_value}`
                : undefined
        })

        // Track AddToCart event
        trackAddToCart({
            id: product.id,
            title: product.title,
            price: finalPrice,
        }, 1)

        toast.success('Agregado al carrito', {
            description: `${product.title} ${selectedVariantData ? `(${selectedVariantData.variant_value})` : ''}`,
            duration: 2000,
        })
    }

    // Calcular total del carrito para el checkout
    const cartTotal = cart.items.reduce((acc, item) => acc + (Number(item.price) * item.quantity), 0)

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[900px] max-w-full max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <div className="flex items-start justify-between">
                            <DialogTitle className="text-2xl pr-8">{product.title}</DialogTitle>
                            {/* Botón Compartir */}
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleShare}
                                className="h-8 w-8 flex-shrink-0"
                                title="Compartir producto"
                            >
                                {copied ? (
                                    <Check className="h-4 w-4 text-green-600" />
                                ) : (
                                    <Share2 className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    </DialogHeader>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Columna Izquierda: Imágenes */}
                        <div className="space-y-3">
                            {/* Imagen Principal */}
                            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative">
                                {productImages.length > 0 ? (
                                    <img
                                        src={productImages[selectedImage]}
                                        alt={product.title}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                            e.currentTarget.parentElement?.classList.add('broken-image-fallback');
                                        }}
                                    />
                                ) : null}

                                {/* Fallback visible only when image is hidden or missing */}
                                <div className="absolute inset-0 flex items-center justify-center text-gray-400 bg-gray-100 -z-10">
                                    <span className="text-sm">Sin Foto</span>
                                </div>
                            </div>

                            {/* Miniaturas (si hay múltiples imágenes) */}
                            {productImages.length > 1 && (
                                <div className="grid grid-cols-4 gap-2">
                                    {productImages.map((img, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setSelectedImage(index)}
                                            className={`aspect-square rounded-md overflow-hidden border-2 transition-all ${selectedImage === index
                                                ? 'border-black ring-2 ring-black'
                                                : 'border-gray-200 hover:border-gray-400'
                                                }`}
                                        >
                                            <img
                                                src={img}
                                                alt={`${product.title} ${index + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Columna Derecha: Información */}
                        <div className="space-y-4">
                            {/* Precio */}
                            <div>
                                <p className="text-3xl font-bold text-green-700">
                                    Q{finalPrice.toFixed(2)}
                                </p>
                                {selectedVariantData && selectedVariantData.price_adjustment !== 0 && (
                                    <p className="text-sm text-gray-500">
                                        Precio base: Q{product.price.toFixed(2)}
                                        {selectedVariantData.price_adjustment > 0 ? ' +' : ' '}
                                        Q{selectedVariantData.price_adjustment.toFixed(2)}
                                    </p>
                                )}
                            </div>

                            {/* Descripción */}
                            {product.description && (
                                <div>
                                    <h3 className="font-semibold mb-2">Descripción</h3>
                                    <p className="text-gray-700 text-sm whitespace-pre-line">
                                        {product.description}
                                    </p>
                                </div>
                            )}

                            {/* Variantes */}
                            {Object.keys(variantsByType).length > 0 && (
                                <div className="space-y-2">
                                    {Object.entries(variantsByType).map(([type, typeVariants]: [string, any]) => (
                                        <div key={type}>
                                            <label className="text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wider">{type}</label>
                                            <div className="flex flex-wrap gap-2">
                                                {typeVariants.map((variant: any) => {
                                                    const variantOutOfStock = (variant.stock || 0) <= 0
                                                    return (
                                                        <button
                                                            key={variant.id}
                                                            disabled={variantOutOfStock}
                                                            onClick={() => {
                                                                if (variantOutOfStock) return
                                                                // Toggle
                                                                setSelectedVariant(prev => prev === variant.id ? null : variant.id)
                                                            }}
                                                            className={`px-3 py-1.5 text-sm rounded-md border transition-all 
                                                                ${variantOutOfStock ? 'opacity-50 cursor-not-allowed line-through text-gray-400' : ''}
                                                                ${selectedVariant === variant.id
                                                                    ? 'border-black bg-black text-white shadow-sm'
                                                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                                }`}
                                                        >
                                                            {variant.variant_value}
                                                            {variantOutOfStock && (
                                                                <span className="ml-1 text-[10px]">(Agotado)</span>
                                                            )}
                                                            {!variantOutOfStock && variant.price_adjustment !== 0 && (
                                                                <span className="ml-1 text-[10px] opacity-80">
                                                                    ({variant.price_adjustment > 0 ? '+' : ''}
                                                                    Q{variant.price_adjustment})
                                                                </span>
                                                            )}
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Selector de cantidad y botón Comprar Ahora */}
                            <div className="pt-4 space-y-3">
                                {/* Selector de Cantidad */}
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-700">Cantidad</span>
                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                            disabled={quantity <= 1 || isOutOfStock}
                                            className="h-9 w-9 rounded-full border border-gray-300 flex items-center justify-center text-lg font-medium hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            −
                                        </button>
                                        <span className="w-8 text-center text-lg font-semibold">{quantity}</span>
                                        <button
                                            type="button"
                                            onClick={() => setQuantity(q => q + 1)}
                                            disabled={isOutOfStock}
                                            className="h-9 w-9 rounded-full border border-gray-300 flex items-center justify-center text-lg font-medium hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>

                                {/* Subtotal */}
                                {quantity > 1 && (
                                    <div className="text-right text-sm text-gray-600">
                                        Subtotal: <span className="font-semibold text-green-700">Q{(finalPrice * quantity).toFixed(2)}</span>
                                    </div>
                                )}

                                {/* Botón Comprar Ahora */}
                                <Button
                                    onClick={handleBuyNow}
                                    disabled={isOutOfStock}
                                    className="w-full bg-black hover:bg-gray-800 h-12 text-base"
                                >
                                    <svg viewBox="0 0 24 24" fill="currentColor" className="mr-2 h-5 w-5">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                    </svg>
                                    Comprar Ahora por WhatsApp
                                </Button>

                                {/* Botón Agregar al Carrito */}
                                <Button
                                    onClick={handleAddToCart}
                                    disabled={isOutOfStock}
                                    variant="outline"
                                    className="w-full h-11"
                                >
                                    <ShoppingCart className="mr-2 h-4 w-4" />
                                    Agregar al Carrito
                                </Button>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Checkout Dialog en modo controlado */}
            <CheckoutDialog
                storeId={storeId}
                storePhone={storePhone}
                total={cartTotal}
                open={checkoutOpen}
                onOpenChange={setCheckoutOpen}
            />
        </>
    )
}
