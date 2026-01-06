import { notFound, redirect } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { formatPhoneForWhatsApp } from '@/lib/phone'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import StoreProducts from '@/components/storefront/StoreProducts'
import StoreNavbar from '@/components/storefront/StoreNavbar'
import { Phone, Store, MapPin, Smartphone, Instagram, Facebook, Video } from 'lucide-react'

// --- DATA FETCHING ---
async function getStoreData(slug: string) {
    const { data: store } = await supabase.from('stores').select('*').eq('slug', slug).single()
    if (!store) {
        const { data: redirectData } = await supabase.from('store_redirects').select('store_id, stores(slug, is_active, deleted_at)').eq('old_slug', slug).single()
        if (redirectData?.stores) {
            const storeData = redirectData.stores as unknown as { slug: string; is_active: boolean; deleted_at: string | null }
            if (!storeData.is_active || storeData.deleted_at) return { inactive: true }
            return { redirect: storeData.slug }
        }
        return null
    }
    if (store.is_active === false || store.deleted_at) return { inactive: true }
    const { data: products } = await supabase.from('products').select('*').eq('store_id', store.id).eq('is_active', true)
    const { data: categories } = await supabase.from('categories').select('*').eq('store_id', store.id).order('created_at', { ascending: true })
    const { data: productImages } = await supabase.from('product_images').select('*').in('product_id', products?.map(p => p.id) || [])
    const { data: productVariants } = await supabase.from('product_variants').select('*').in('product_id', products?.map(p => p.id) || [])
    return { store, products: products || [], categories: categories || [], productImages: productImages || [], productVariants: productVariants || [] }
}

function getInitials(name: string) {
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)
}

export default async function StorePage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const data = await getStoreData(slug)

    if (!data) return notFound()
    if ('redirect' in data) redirect(`/${data.redirect}`)
    if ('inactive' in data) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
                <div className="text-center max-w-md">
                    <div className="mb-6"><Store className="h-16 w-16 mx-auto text-green-600" /></div>
                    <h1 className="text-xl font-bold text-gray-800 mb-2">Tienda no disponible</h1>
                    <Button asChild variant="outline"><a href="/">Volver al inicio</a></Button>
                </div>
            </div>
        )
    }

    const { store, products, categories, productImages, productVariants } = data

    return (
        <div className="min-h-screen bg-gray-50/50 relative">
            
            {/* 1. NAVBAR */}
            <StoreNavbar 
                storeId={store.id}
                storeName={store.name}
                storePhone={store.phone}
                categories={categories}
            />

            {/* 2. BANNER */}
            <div className="relative w-full h-[22vh] md:h-[28vh] bg-slate-900 overflow-hidden mt-16">
                {store.banner_url ? (
                    <Image src={store.banner_url} alt={store.name} fill className="object-cover opacity-80" priority />
                ) : (
                    <div className="absolute inset-0 bg-black" />
                )}
            </div>

            {/* 3. STORE PROFILE CARD */}
            <div className="container mx-auto px-6 md:px-12 lg:px-20 relative z-10 -mt-12 mb-10">
                <div className="bg-white rounded-xl shadow-md border border-slate-100 p-5 md:p-6 flex flex-col md:flex-row items-center gap-5 max-w-5xl mx-auto">
                    <div className="relative shrink-0">
                        <Avatar className="h-16 w-16 md:h-20 md:w-20 rounded-xl border-4 border-white shadow-sm bg-white">
                            {store.logo_url && <AvatarImage src={store.logo_url} alt={store.name} className="object-cover" />}
                            <AvatarFallback className="text-lg bg-slate-100 text-green-600 rounded-xl font-bold">
                                <Store className="h-8 w-8" />
                            </AvatarFallback>
                        </Avatar>
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <h1 className="text-xl md:text-2xl font-bold text-black tracking-tight">{store.name}</h1>
                        {store.description && (
                            <p className="text-slate-500 text-xs md:text-sm mt-1 max-w-lg leading-relaxed">{store.description}</p>
                        )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-center md:justify-end">
                        <div className="flex items-center gap-2">
                            {store.instagram_url && (
                                <Button size="icon" variant="outline" className="rounded-full h-9 w-9 border-slate-200 hover:text-pink-600 shadow-sm" asChild>
                                    <a href={store.instagram_url} target="_blank" rel="noopener noreferrer">
                                        <Instagram className="h-4 w-4" />
                                    </a>
                                </Button>
                            )}
                            {store.facebook_url && (
                                <Button size="icon" variant="outline" className="rounded-full h-9 w-9 border-slate-200 hover:text-blue-600 shadow-sm" asChild>
                                    <a href={store.facebook_url} target="_blank" rel="noopener noreferrer">
                                        <Facebook className="h-4 w-4" />
                                    </a>
                                </Button>
                            )}
                            {/* TikTok con Logo SVG Personalizado */}
                            {store.tiktok_url && (
                                <Button size="icon" variant="outline" className="rounded-full h-9 w-9 border-slate-200 hover:text-black hover:border-black shadow-sm" asChild>
                                    <a href={store.tiktok_url} target="_blank" rel="noopener noreferrer">
                                        <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                                            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 1 0-1 13.6 6.84 6.84 0 0 0 6.25-6.62V9.42c.05.02.12.03.18.03a4.86 4.86 0 0 0 4.84-4.55l.04-.36h-1.08z" />
                                        </svg>
                                    </a>
                                </Button>
                            )}
                            
                            {/* Botón de WhatsApp - Estilo Outline igual a los demás */}
                            <Button size="icon" variant="outline" className="rounded-full h-9 w-9 border-slate-200 text-green-600 hover:bg-green-50 hover:text-green-700 hover:border-green-300 shadow-sm shrink-0" asChild>
                                <a href={`https://wa.me/${formatPhoneForWhatsApp(store.phone)}`} target="_blank" rel="noopener noreferrer">
                                    <Phone className="h-4 w-4" />
                                </a>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* 4. CATÁLOGO */}
            <div className="container mx-auto px-6 md:px-12 lg:px-20 pb-20 max-w-7xl mx-auto">
                {!products || products.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-xl border border-dashed">
                        <Store className="h-8 w-8 mx-auto text-green-600 mb-2" />
                        <p className="text-slate-500 text-sm">Sin productos aún.</p>
                    </div>
                ) : (
                    <StoreProducts products={products} categories={categories} productImages={productImages} productVariants={productVariants} />
                )}
            </div>
        </div>
    )
}
