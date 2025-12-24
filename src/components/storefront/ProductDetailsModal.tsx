'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ShoppingCart, X } from 'lucide-react'
import { useState } from 'react'
import AddToCartButton from './AddToCartButton'

interface ProductDetailsModalProps {
    product: any
    images?: Array<{ image_url: string; display_order: number }>
    variants?: Array<{ id: string; variant_type: string; variant_value: string; price_adjustment: number }>
    open: boolean
    onOpenChange: (open: boolean) => void
}

export default function ProductDetailsModal({
    product,
    images = [],
    variants = [],
    open,
    onOpenChange
}: ProductDetailsModalProps) {
    const [selectedImage, setSelectedImage] = useState(0)
    const [selectedVariant, setSelectedVariant] = useState<string | null>(null)

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

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl">{product.title}</DialogTitle>
                </DialogHeader>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Columna Izquierda: Imágenes */}
                    <div className="space-y-3">
                        {/* Imagen Principal */}
                        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                            {productImages.length > 0 ? (
                                <img
                                    src={productImages[selectedImage]}
                                    alt={product.title}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-400">
                                    Sin Foto
                                </div>
                            )}
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
                                            {typeVariants.map((variant: any) => (
                                                <button
                                                    key={variant.id}
                                                    onClick={() => {
                                                        // Toggle
                                                        setSelectedVariant(prev => prev === variant.id ? null : variant.id)
                                                    }}
                                                    className={`px-3 py-1.5 text-sm rounded-md border transition-all ${selectedVariant === variant.id
                                                            ? 'border-black bg-black text-white shadow-sm'
                                                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    {variant.variant_value}
                                                    {variant.price_adjustment !== 0 && (
                                                        <span className="ml-1 text-[10px] opacity-80">
                                                            ({variant.price_adjustment > 0 ? '+' : ''}
                                                            Q{variant.price_adjustment})
                                                        </span>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Botón Agregar al Carrito */}
                        <div className="pt-4">
                            <AddToCartButton
                                product={{
                                    ...product,
                                    price: finalPrice,
                                    selectedVariant: selectedVariantData
                                }}
                            />
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
