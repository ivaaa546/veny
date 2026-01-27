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
        // Agregar al carrito
        cart.addItem({
            id: product.id,
            title: product.title,
            price: finalPrice,
            image_url: productImages[0] ?? product.image_url ?? null,
            selectedVariant: selectedVariantData
                ? `${selectedVariantData.variant_type}: ${selectedVariantData.variant_value}`
                : undefined
        })
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

                            {/* Botones de acción */}
                            <div className="pt-4 space-y-2">
                                {/* Botón Comprar Ahora */}
                                <Button
                                    onClick={handleBuyNow}
                                    disabled={isOutOfStock}
                                    className="w-full bg-black hover:bg-gray-800 h-12 text-base"
                                >
                                    <Zap className="mr-2 h-5 w-5" />
                                    Comprar Ahora
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
