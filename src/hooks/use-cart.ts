import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface CartItem {
    id: string
    title: string
    price: number
    image_url: string | null
    quantity: number
    selectedVariant?: string
}

interface CartStore {
    items: CartItem[]
    addItem: (data: CartItem) => void
    removeItem: (id: string) => void
    clearCart: () => void
    total: number // Calculado dinámicamente
}

export const useCart = create(
    persist<CartStore>(
        (set, get) => ({
            items: [],
            total: 0,

            addItem: (data: any) => {
                const currentItems = get().items
                const existingItem = currentItems.find((item) => item.id === data.id)

                if (existingItem) {
                    // Si ya existe, aumentamos cantidad
                    set({
                        items: currentItems.map((item) =>
                            item.id === data.id
                                ? { ...item, quantity: item.quantity + 1 }
                                : item
                        ),
                    })
                } else {
                    // Si es nuevo, lo agregamos con quantity: 1
                    set({ items: [...currentItems, { ...data, quantity: 1 }] })
                }
            },

            removeItem: (id: string) => {
                set({ items: [...get().items.filter((item) => item.id !== id)] })
            },

            clearCart: () => set({ items: [] }),
        }),
        {
            name: 'cart-storage', // Nombre en localStorage
            storage: createJSONStorage(() => localStorage),
        }
    )
)