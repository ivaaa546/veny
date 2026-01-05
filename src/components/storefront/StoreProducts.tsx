'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import AddToCartButton from '@/components/storefront/AddToCartButton'
import ProductDetailsModal from '@/components/storefront/ProductDetailsModal'

interface StoreProductsProps {
    products: any[]
    categories: any[]
    productImages?: any[]
    productVariants?: any[]
}

export default function StoreProducts({
    products,
    categories,
    productImages = [],
    productVariants = []
}: StoreProductsProps) {
    const searchParams = useSearchParams()
    const searchTerm = searchParams.get('search')?.toLowerCase() || ''

    const [selectedProduct, setSelectedProduct] = useState<any | null>(null)
    const [modalOpen, setModalOpen] = useState(false)

    const handleProductClick = (product: any) => {
        setSelectedProduct(product)
        setModalOpen(true)
    }

    // Filtrar productos según búsqueda
    const filteredProducts = searchTerm
        ? products.filter(p => p.title.toLowerCase().includes(searchTerm))
        : products

    // Obtener imágenes y variantes del producto seleccionado
    const selectedProductImages = selectedProduct
        ? productImages.filter(img => img.product_id === selectedProduct.id)
        : []

    const selectedProductVariants = selectedProduct
        ? productVariants.filter(v => v.product_id === selectedProduct.id)
        : []

    // Función auxiliar para renderizar la rejilla de productos
    const renderProductGrid = (items: any[]) => {
        if (items.length === 0) {
            return (
                <div className="py-20 text-center text-slate-400 col-span-full">
                    <p className="text-sm">No se encontraron productos.</p>
                </div>
            )
        }

        return (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2 mt-6 animate-in fade-in duration-500">
                {items.map((product) => {
                    const mainImage = productImages
                        ?.filter(img => img.product_id === product.id)
                        ?.sort((a, b) => a.display_order - b.display_order)[0]?.image_url

                    const displayImage = mainImage || product.image_url

                    return (
                        <Card
                            key={product.id}
                            className="overflow-hidden shadow-none hover:shadow-sm transition-all cursor-pointer border-none bg-transparent group"
                            onClick={() => handleProductClick(product)}
                        >
                            <div className="aspect-[4/5] relative bg-slate-100 rounded-lg overflow-hidden">
                                {displayImage ? (
                                    <img
                                        src={displayImage}
                                        alt={product.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-slate-300 text-[9px] uppercase font-bold tracking-widest text-center px-1">
                                        Sin Foto
                                    </div>
                                )}
                            </div>

                            <CardContent className="p-1.5 space-y-0 text-center">
                                <h4 className="font-medium truncate text-[11px] text-slate-700 group-hover:text-black transition-colors">{product.title}</h4>
                                <p className="font-bold text-[12px] text-black">Q{product.price}</p>
                            </CardContent>

                            <CardFooter className="p-1 pt-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                <AddToCartButton product={product} />
                            </CardFooter>
                        </Card>
                    )
                })}
            </div>
        )
    }

    return (
        <>
            {searchTerm ? (
                // MODO BÚSQUEDA: Mostrar resultados directos
                <div className="mt-4">
                    <h3 className="text-sm font-medium text-slate-500 mb-4">
                        Resultados para "{searchTerm}" ({filteredProducts.length})
                    </h3>
                    {renderProductGrid(filteredProducts)}
                </div>
            ) : (
                // MODO NORMAL: Tabs de Categorías
                <Tabs defaultValue="todos" className="w-full">
                    {/* BARRA DE CATEGORÍAS (Scrollable) */}
                    <div className="overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                        <TabsList className="w-full justify-start h-auto p-0 bg-transparent gap-2">
                            <TabsTrigger
                                value="todos"
                                className="rounded-full border border-slate-200 px-5 py-2 text-xs font-medium data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:border-black transition-all hover:border-slate-300 bg-white"
                            >
                                Todos
                            </TabsTrigger>
                            {categories.map((cat) => (
                                <TabsTrigger
                                    key={cat.id}
                                    value={cat.id}
                                    className="rounded-full border border-slate-200 px-5 py-2 text-xs font-medium data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:border-black transition-all hover:border-slate-300 bg-white whitespace-nowrap"
                                >
                                    {cat.name}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </div>

                    <TabsContent value="todos" className="mt-0">
                        {renderProductGrid(products)}
                    </TabsContent>

                    {categories.map((cat) => (
                        <TabsContent key={cat.id} value={cat.id} className="mt-0">
                            {renderProductGrid(products.filter(p => p.category_id === cat.id))}
                        </TabsContent>
                    ))}
                </Tabs>
            )}

            {/* Modal de Detalles */}
            {selectedProduct && (
                <ProductDetailsModal
                    product={selectedProduct}
                    images={selectedProductImages}
                    variants={selectedProductVariants}
                    open={modalOpen}
                    onOpenChange={setModalOpen}
                />
            )}
        </>
    )
}
