import { notFound, redirect } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { formatPhoneForWhatsApp } from '@/lib/phone'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
// IMPORTANTE: Importamos tus nuevos componentes
import CartSidebar from '@/components/storefront/CartSidebar'
import StoreProducts from '@/components/storefront/StoreProducts'
import { MessageCircle, ShoppingBag, Store } from 'lucide-react'

// Esta función obtiene los datos de la tienda, productos, categorías, imágenes y variantes
async function getStoreData(slug: string) {
    // Primero buscar la tienda por slug actual
    const { data: store } = await supabase
        .from('stores')
        .select('*')
        .eq('slug', slug)
        .single()

    // Si no existe, verificar si hay un redirect
    if (!store) {
        const { data: redirectData } = await supabase
            .from('store_redirects')
            .select('store_id, stores(slug, is_active, deleted_at)')
            .eq('old_slug', slug)
            .single()

        if (redirectData?.stores) {
            const storeData = redirectData.stores as unknown as { slug: string; is_active: boolean; deleted_at: string | null }
            // Si la tienda redirecteada está inactiva o eliminada, retornar inactive
            if (!storeData.is_active || storeData.deleted_at) {
                return { inactive: true }
            }
            // Retornar info para redirect
            return { redirect: storeData.slug }
        }
        return null
    }

    // Verificar si la tienda está inactiva o marcada para eliminación
    if (store.is_active === false || store.deleted_at) {
        return { inactive: true }
    }

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

function getInitials(name: string) {
    return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
}

export default async function StorePage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const data = await getStoreData(slug)

    if (!data) return notFound()

    // Si hay redirect, redirigir al nuevo slug
    if ('redirect' in data) {
        redirect(`/${data.redirect}`)
    }

    // Si la tienda está inactiva o marcada para eliminación
    if ('inactive' in data) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
                <div className="text-center max-w-md">
                    <div className="mb-6">
                        <Store className="h-20 w-20 mx-auto text-gray-300" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">
                        Tienda no disponible
                    </h1>
                    <p className="text-gray-500 mb-6">
                        Esta tienda no está disponible en este momento.
                        Es posible que haya sido desactivada temporalmente.
                    </p>
                    <Button asChild variant="outline">
                        <a href="/">Volver al inicio</a>
                    </Button>
                </div>
            </div>
        )
    }

    const { store, products, categories, productImages, productVariants } = data

    return (
        <div className="min-h-screen bg-gray-50 pb-20">

            {/* 1. HEADER CON CARRITO FUNCIONAL */}
            <div className="bg-white shadow-sm sticky top-0 z-20">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {/* Logo en el header */}
                        <Avatar className="h-9 w-9">
                            {store.logo_url ? (
                                <AvatarImage src={store.logo_url} alt={store.name} />
                            ) : null}
                            <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                                {getInitials(store.name)}
                            </AvatarFallback>
                        </Avatar>
                        <h1 className="font-bold text-xl truncate">{store.name}</h1>
                    </div>

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
            <div className="relative">
                {/* Imagen de Banner */}
                {store.banner_url ? (
                    <div className="relative w-full h-48 md:h-64">
                        <Image
                            src={store.banner_url}
                            alt={`Banner de ${store.name}`}
                            fill
                            className="object-cover"
                            priority
                        />
                        {/* Overlay oscuro para legibilidad */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                    </div>
                ) : (
                    <div className="w-full h-48 md:h-64 bg-gradient-to-br from-gray-900 to-gray-700" />
                )}

                {/* Contenido sobre el banner */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center px-4">
                    {/* Logo grande */}
                    <Avatar className="h-20 w-20 mb-4 border-4 border-white shadow-lg">
                        {store.logo_url ? (
                            <AvatarImage src={store.logo_url} alt={store.name} />
                        ) : null}
                        <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                            {store.logo_url ? null : <Store className="h-8 w-8" />}
                            {!store.logo_url && getInitials(store.name)}
                        </AvatarFallback>
                    </Avatar>

                    <p className="text-sm opacity-80 mb-1">Bienvenido a</p>
                    <h2 className="text-3xl font-bold mb-2">{store.name}</h2>

                    {/* Descripción si existe */}
                    {store.description && (
                        <p className="text-sm opacity-90 max-w-md mb-4">{store.description}</p>
                    )}

                    <Button size="sm" variant="secondary" className="gap-2" asChild>
                        <a href={`https://wa.me/${formatPhoneForWhatsApp(store.phone)}`} target="_blank">
                            <MessageCircle className="h-4 w-4" /> Dudas al WhatsApp
                        </a>
                    </Button>
                </div>
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
