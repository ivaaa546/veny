import { render, RenderOptions } from '@testing-library/react'
import { ReactElement } from 'react'

// Custom render que puede incluir providers si es necesario
export function renderWithProviders(
    ui: ReactElement,
    options?: Omit<RenderOptions, 'wrapper'>
) {
    return render(ui, { ...options })
}

// Re-export everything from testing library
export * from '@testing-library/react'
export { renderWithProviders as render }

// Mock data factories
export const mockProduct = (overrides = {}) => ({
    id: 'product-1',
    store_id: 'store-1',
    title: 'Producto de Prueba',
    description: 'Descripción del producto',
    price: 100,
    image_url: 'https://example.com/image.jpg',
    is_active: true,
    category_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
})

export const mockStore = (overrides = {}) => ({
    id: 'store-1',
    user_id: 'user-1',
    slug: 'test-store',
    name: 'Tienda de Prueba',
    phone: '50212345678',
    description: 'Descripción de la tienda',
    primary_color: '#000000',
    logo_url: null,
    banner_url: null,
    is_active: true,
    deleted_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
})

export const mockCategory = (overrides = {}) => ({
    id: 'category-1',
    store_id: 'store-1',
    name: 'Categoría de Prueba',
    sort_order: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
})

export const mockProductVariant = (overrides = {}) => ({
    id: 'variant-1',
    product_id: 'product-1',
    variant_type: 'Talla',
    variant_value: 'M',
    price_adjustment: 0,
    stock: 10,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
})

export const mockProductImage = (overrides = {}) => ({
    id: 'image-1',
    product_id: 'product-1',
    image_url: 'https://example.com/product-image.jpg',
    display_order: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
})

export const mockCartItem = (overrides = {}) => ({
    id: 'product-1',
    title: 'Producto de Prueba',
    price: 100,
    image_url: 'https://example.com/image.jpg',
    quantity: 1,
    selectedVariant: undefined,
    ...overrides,
})

export const mockUser = (overrides = {}) => ({
    id: 'user-1',
    email: 'test@example.com',
    created_at: new Date().toISOString(),
    ...overrides,
})

export const mockProfile = (overrides = {}) => ({
    id: 'user-1',
    email: 'test@example.com',
    role: 'seller',
    created_at: new Date().toISOString(),
    ...overrides,
})

// Helper para esperar por actualizaciones asíncronas
export const waitForNextUpdate = () =>
    new Promise((resolve) => setTimeout(resolve, 0))
