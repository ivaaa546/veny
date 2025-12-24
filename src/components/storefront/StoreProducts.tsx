'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import AddToCartButton from '@/components/storefront/AddToCartButton'

interface StoreProductsProps {
    products: any[]
    categories: any[]
}

export default function StoreProducts({ products, categories }: StoreProductsProps) {

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
                {items.map((product) => (
                    <Card key={product.id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                        {/* Imagen */}
                        <div className="aspect-square relative bg-gray-100">
                            {product.image_url ? (
                                <img
                                    src={product.image_url}
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

                        <CardFooter className="p-3 pt-0">
                            <AddToCartButton product={product} />
                        </CardFooter>
                    </Card>
                ))}
            </div>
        )
    }

    return (
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
    )
}