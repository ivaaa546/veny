import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
// IMPORTANTE: Importamos tus nuevos componentes
import CartSidebar from '@/components/storefront/CartSidebar'
import StoreProducts from '@/components/storefront/StoreProducts'
import { MessageCircle } from 'lucide-react'
import { ShoppingBag } from 'lucide-react'

// Esta función obtiene los datos de la tienda, productos, categorías, imágenes y variantes
async function getStoreData(slug: string) {
    const { data: store } = await supabase
        .from('stores')
        .select('*')
        .eq('slug', slug)
        .single()

    if (!store) return null

    // Obtener productos activos
    const { data: products } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', store.id)
        .eq('is_active', true)

    // Obtener categorías de la tienda
    const { data: categories } = await supabase
        .from('categories')
        .select('*')
        .eq('store_id', store.id)
        .order('created_at', { ascending: true })

    // Obtener todas las imágenes de los productos
    const { data: productImages } = await supabase
        .from('product_images')
        .select('*')
        .in('product_id', products?.map(p => p.id) || [])

    // Obtener todas las variantes de los productos
    const { data: productVariants } = await supabase
        .from('product_variants')
        .select('*')
        .in('product_id', products?.map(p => p.id) || [])

    return {
        store,
        products: products || [],
        categories: categories || [],
        productImages: productImages || [],
        productVariants: productVariants || []
    }
}

export default async function StorePage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const data = await getStoreData(slug)

    if (!data) return notFound()

    const { store, products, categories, productImages, productVariants } = data

    return (
        <div className="min-h-screen bg-gray-50 pb-20">

            {/* 1. HEADER CON CARRITO FUNCIONAL */}
            <div className="bg-white shadow-sm sticky top-0 z-10">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <h1 className="font-bold text-xl truncate">{store.name}</h1>

                    {/* Envolvemos el botón de la bolsa con tu Sidebar */}
                    <CartSidebar storePhone={store.phone}>
                        <Button size="icon" variant="ghost" className="relative">
                            <ShoppingBag className="h-6 w-6" />
                            {/* Un punto rojo decorativo (Más adelante lo haremos contador real) */}
                            <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full animate-pulse" />
                        </Button>
                    </CartSidebar>
                </div>
            </div>

            {/* BANNER DE TIENDA */}
            <div className="bg-black text-white py-8 px-4 text-center">
                <p className="text-sm opacity-80 mb-1">Bienvenido a</p>
                <h2 className="text-3xl font-bold mb-4">{store.name}</h2>
                <Button size="sm" variant="secondary" className="gap-2" asChild>
                    <a href={`https://wa.me/${store.phone}`} target="_blank">
                        <MessageCircle className="h-4 w-4" /> Dudas al WhatsApp
                    </a>
                </Button>
            </div>

            {/* CATÁLOGO CON FILTRADO POR CATEGORÍAS */}
            <div className="container mx-auto px-4 py-8">
                <h3 className="font-bold text-lg mb-4">Catálogo</h3>

                {!products || products.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">
                        <p>Esta tienda aún no tiene productos.</p>
                    </div>
                ) : (
                    <StoreProducts
                        products={products}
                        categories={categories}
                        productImages={productImages}
                        productVariants={productVariants}
                    />
                )}
            </div>
        </div>
    )
}