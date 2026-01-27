'use client'

// Hook para disparar eventos de Facebook Pixel

// Tipos para los eventos
interface ProductData {
    id: string
    title: string
    price: number
    category?: string
}

interface CartItemData {
    id: string
    title: string
    price: number
    quantity: number
}

// Verificar si fbq está disponible
function getFbq(): ((action: string, event: string, data?: object) => void) | null {
    if (typeof window !== 'undefined' && 'fbq' in window) {
        return (window as any).fbq
    }
    return null
}

// Evento: ViewContent - Cuando el usuario ve un producto
export function trackViewContent(product: ProductData) {
    const fbq = getFbq()
    if (!fbq) return

    fbq('track', 'ViewContent', {
        content_name: product.title,
        content_ids: [product.id],
        content_type: 'product',
        value: product.price,
        currency: 'GTQ',
    })
}

// Evento: AddToCart - Cuando el usuario agrega un producto al carrito
export function trackAddToCart(product: ProductData, quantity: number = 1) {
    const fbq = getFbq()
    if (!fbq) return

    fbq('track', 'AddToCart', {
        content_name: product.title,
        content_ids: [product.id],
        content_type: 'product',
        value: product.price * quantity,
        currency: 'GTQ',
        num_items: quantity,
    })
}

// Evento: InitiateCheckout - Cuando el usuario inicia el proceso de checkout
export function trackInitiateCheckout(items: CartItemData[], total: number) {
    const fbq = getFbq()
    if (!fbq) return

    fbq('track', 'InitiateCheckout', {
        content_ids: items.map(item => item.id),
        content_type: 'product',
        value: total,
        currency: 'GTQ',
        num_items: items.reduce((sum, item) => sum + item.quantity, 0),
    })
}

// Evento: Purchase - Cuando el usuario completa una compra
export function trackPurchase(orderId: string, total: number, items: CartItemData[]) {
    const fbq = getFbq()
    if (!fbq) return

    fbq('track', 'Purchase', {
        content_ids: items.map(item => item.id),
        content_type: 'product',
        value: total,
        currency: 'GTQ',
        num_items: items.reduce((sum, item) => sum + item.quantity, 0),
        order_id: orderId,
    })
}

// Evento: Search - Cuando el usuario busca productos
export function trackSearch(searchQuery: string) {
    const fbq = getFbq()
    if (!fbq) return

    fbq('track', 'Search', {
        search_string: searchQuery,
    })
}

// Evento: Contact - Cuando el usuario contacta por WhatsApp
export function trackContact() {
    const fbq = getFbq()
    if (!fbq) return

    fbq('track', 'Contact')
}
