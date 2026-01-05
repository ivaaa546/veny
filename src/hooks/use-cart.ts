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

// Tipo para agregar items (sin quantity, se agrega automáticamente)
export type CartItemInput = Omit<CartItem, 'quantity'>

interface CartStore {
    items: CartItem[]
    addItem: (data: CartItemInput) => void
    removeItem: (id: string) => void
    clearCart: () => void
    total: number // Calculado dinámicamente
}

export const useCart = create(
    persist<CartStore>(
        (set, get) => ({
            items: [],
            total: 0,

            addItem: (data: CartItemInput) => {
                const currentItems = get().items

                // Limpiar el item para asegurar que selectedVariant sea string
                const cleanData: CartItemInput = {
                    id: data.id,
                    title: data.title,
                    price: Number(data.price),
                    image_url: data.image_url,
                    selectedVariant: typeof data.selectedVariant === 'string'
                        ? data.selectedVariant
                        : undefined
                }

                const existingItem = currentItems.find((item) => item.id === cleanData.id)

                if (existingItem) {
                    // Si ya existe, aumentamos cantidad
                    set({
                        items: currentItems.map((item) =>
                            item.id === cleanData.id
                                ? { ...item, quantity: item.quantity + 1 }
                                : item
                        ),
                    })
                } else {
                    // Si es nuevo, lo agregamos con quantity: 1
                    set({ items: [...currentItems, { ...cleanData, quantity: 1 }] })
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
            // Migración para limpiar datos antiguos
            onRehydrateStorage: () => (state) => {
                if (state?.items) {
                    // Limpiar items con selectedVariant como objeto
                    state.items = state.items
                        .map((item: any) => ({
                            ...item,
                            selectedVariant: typeof item.selectedVariant === 'string'
                                ? item.selectedVariant
                                : undefined
                        }))
                        .filter((item: any) => item.id && item.title && item.price)
                }
            }
        }
    )
)