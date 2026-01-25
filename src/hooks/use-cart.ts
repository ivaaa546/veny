import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface CartItem {
    id: string              // ID del producto original
    cartItemId: string      // ID único: productId-variantHash para diferenciar variantes
    title: string
    price: number
    image_url: string | null
    quantity: number
    selectedVariant?: string
}

// Tipo para agregar items (sin quantity ni cartItemId, se agregan automáticamente)
export type CartItemInput = Omit<CartItem, 'quantity' | 'cartItemId'>

interface CartStore {
    items: CartItem[]
    addItem: (data: CartItemInput) => void
    removeItem: (cartItemId: string) => void
    updateQuantity: (cartItemId: string, quantity: number) => void
    increaseQuantity: (cartItemId: string) => void
    decreaseQuantity: (cartItemId: string) => void
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

                // Crear ID único que incluye la variante para diferenciar items
                const cartItemId = cleanData.selectedVariant
                    ? `${cleanData.id}-${cleanData.selectedVariant.replace(/\s/g, '_')}`
                    : cleanData.id

                const existingItem = currentItems.find((item) => item.cartItemId === cartItemId)

                if (existingItem) {
                    // Si ya existe, aumentamos cantidad
                    set({
                        items: currentItems.map((item) =>
                            item.cartItemId === cartItemId
                                ? { ...item, quantity: item.quantity + 1 }
                                : item
                        ),
                    })
                } else {
                    // Si es nuevo, lo agregamos con quantity: 1
                    set({ items: [...currentItems, { ...cleanData, cartItemId, quantity: 1 }] })
                }
            },

            removeItem: (cartItemId: string) => {
                set({ items: [...get().items.filter((item) => item.cartItemId !== cartItemId)] })
            },

            updateQuantity: (cartItemId: string, quantity: number) => {
                if (quantity <= 0) {
                    get().removeItem(cartItemId)
                    return
                }
                set({
                    items: get().items.map((item) =>
                        item.cartItemId === cartItemId
                            ? { ...item, quantity }
                            : item
                    ),
                })
            },

            increaseQuantity: (cartItemId: string) => {
                set({
                    items: get().items.map((item) =>
                        item.cartItemId === cartItemId
                            ? { ...item, quantity: item.quantity + 1 }
                            : item
                    ),
                })
            },

            decreaseQuantity: (cartItemId: string) => {
                const item = get().items.find((i) => i.cartItemId === cartItemId)
                if (item && item.quantity <= 1) {
                    get().removeItem(cartItemId)
                } else {
                    set({
                        items: get().items.map((i) =>
                            i.cartItemId === cartItemId
                                ? { ...i, quantity: i.quantity - 1 }
                                : i
                        ),
                    })
                }
            },

            clearCart: () => set({ items: [] }),
        }),
        {
            name: 'cart-storage', // Nombre en localStorage
            storage: createJSONStorage(() => localStorage),
            // Migración para limpiar datos antiguos
            onRehydrateStorage: () => (state) => {
                if (state?.items) {
                    // Limpiar items con selectedVariant como objeto y migrar a nuevo formato
                    state.items = state.items
                        .map((item: any) => ({
                            ...item,
                            // Migrar items antiguos sin cartItemId
                            cartItemId: item.cartItemId || (item.selectedVariant
                                ? `${item.id}-${item.selectedVariant.replace(/\s/g, '_')}`
                                : item.id),
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
