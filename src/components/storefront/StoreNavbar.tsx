'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ShoppingCart, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import CartSidebar from './CartSidebar'

interface StoreNavbarProps {
    storeName: string
    storePhone: string
    categories: { id: string; name: string }[]
}

export default function StoreNavbar({ 
    storeName, 
    storePhone,
}: StoreNavbarProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [isSearchOpen, setIsSearchOpen] = useState(false)
    const [searchValue, setSearchValue] = useState(searchParams.get('search') || '')

    // Manejar búsqueda
    const handleSearch = (term: string) => {
        setSearchValue(term)
        const params = new URLSearchParams(searchParams.toString())
        if (term) {
            params.set('search', term)
        } else {
            params.delete('search')
        }
        router.replace(`?${params.toString()}`, { scroll: false })
    }

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-100 h-16 shadow-sm">
            <div className="container mx-auto px-4 h-full flex items-center justify-between">
                
                {/* 1. Izquierda: Nombre de la Tienda */}
                <div className="flex items-center gap-3">
                    <span className="font-bold text-lg text-black truncate max-w-[200px]">
                        {storeName}
                    </span>
                </div>

                {/* 2. Derecha: Acciones (Búsqueda y Carrito) */}
                <div className="flex items-center gap-2 md:gap-4">
                    
                    {/* Buscador Expandible */}
                    <div className={cn(
                        "flex items-center transition-all duration-300 ease-in-out relative",
                        isSearchOpen ? "w-[160px] sm:w-[250px]" : "w-10"
                    )}>
                        {isSearchOpen ? (
                            <div className="relative w-full">
                                <Input 
                                    placeholder="Buscar..." 
                                    className="h-9 pr-8 pl-3 rounded-full bg-slate-100 border-none text-black placeholder:text-slate-500 focus-visible:ring-1 focus-visible:ring-black"
                                    autoFocus
                                    value={searchValue}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    onBlur={() => !searchValue && setIsSearchOpen(false)}
                                />
                                <X 
                                    className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-slate-500" 
                                    onClick={() => {
                                        setSearchValue('')
                                        handleSearch('')
                                        setIsSearchOpen(false)
                                    }}
                                />
                            </div>
                        ) : (
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => setIsSearchOpen(true)}
                                className="rounded-full text-black hover:bg-slate-100"
                            >
                                <Search className="h-5 w-5" />
                            </Button>
                        )}
                    </div>

                    {/* Carrito (Verde con icono de carrito) */}
                    <CartSidebar storePhone={storePhone}>
                        <Button 
                            size="icon" 
                            className="rounded-full relative shadow-lg shadow-green-600/20 bg-green-600 text-white hover:bg-green-700 h-10 w-10 transition-all border-2 border-white"
                        >
                            <ShoppingCart className="h-5 w-5" />
                            {/* Dot indicador rojo */}
                            <span className="absolute -top-0.5 -right-0.5 h-3 w-3 bg-red-500 border-2 border-white rounded-full" />
                        </Button>
                    </CartSidebar>
                </div>
            </div>
        </header>
    )
}