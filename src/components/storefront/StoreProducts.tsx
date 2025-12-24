'use client'

import { useState } from 'react'
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
    const [selectedProduct, setSelectedProduct] = useState<any | null>(null)
    const [modalOpen, setModalOpen] = useState(false)

    const handleProductClick = (product: any) => {
        setSelectedProduct(product)
        setModalOpen(true)
    }

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
                <div className="py-10 text-center text-gray-500 col-span-full">
                    <p>No hay productos en esta categoría.</p>
                </div>
            )
        }

        return (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
                {items.map((product) => {
                    // Buscar la imagen principal (orden 0 o la primera encontrada)
                    const mainImage = productImages
                        ?.filter(img => img.product_id === product.id)
                        ?.sort((a, b) => a.display_order - b.display_order)[0]?.image_url

                    // Usar esa imagen y si no hay, usar la antigua del producto (legacy)
                    const displayImage = mainImage || product.image_url

                    return (
                        <Card
                            key={product.id}
                            className="overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => handleProductClick(product)}
                        >
                            {/* Imagen */}
                            <div className="aspect-square relative bg-gray-100">
                                {displayImage ? (
                                    <img
                                        src={displayImage}
                                        alt={product.title}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-gray-400 text-xs">
                                        Sin Foto
                                    </div>
                                )}
                            </div>

                            <CardContent className="p-3">
                                <h4 className="font-medium truncate text-sm">{product.title}</h4>
                                <p className="font-bold text-lg text-green-700">Q{product.price}</p>
                            </CardContent>

                            <CardFooter className="p-3 pt-0" onClick={(e) => e.stopPropagation()}>
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
            <Tabs defaultValue="todos" className="w-full">
                {/* BARRA DE CATEGORÍAS (Scrollable en móviles) */}
                <div className="overflow-x-auto pb-2 scrollbar-hide">
                    <TabsList className="w-full justify-start h-auto p-1 bg-transparent gap-2">

                        {/* Botón "Todos" */}
                        <TabsTrigger
                            value="todos"
                            className="rounded-full border border-gray-200 px-4 py-2 data-[state=active]:bg-black data-[state=active]:text-white"
                        >
                            Todos
                        </TabsTrigger>

                        {/* Botones de tus Categorías */}
                        {categories.map((cat) => (
                            <TabsTrigger
                                key={cat.id}
                                value={cat.id}
                                className="rounded-full border border-gray-200 px-4 py-2 data-[state=active]:bg-black data-[state=active]:text-white whitespace-nowrap"
                            >
                                {cat.name}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </div>

                {/* CONTENIDO: Pestaña "Todos" */}
                <TabsContent value="todos">
                    {renderProductGrid(products)}
                </TabsContent>

                {/* CONTENIDO: Pestañas individuales (Filtramos por ID) */}
                {categories.map((cat) => (
                    <TabsContent key={cat.id} value={cat.id}>
                        {renderProductGrid(products.filter(p => p.category_id === cat.id))}
                    </TabsContent>
                ))}

            </Tabs>

            {/* Modal de Detalles del Producto */}
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