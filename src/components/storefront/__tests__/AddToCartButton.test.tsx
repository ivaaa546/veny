import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { toast } from 'sonner'
import AddToCartButton from '../AddToCartButton'
import { useCart } from '@/hooks/use-cart'

// Mock del hook useCart
vi.mock('@/hooks/use-cart', () => ({
    useCart: vi.fn(),
}))

// Mock de sonner toast
vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}))

describe('AddToCartButton', () => {
    const mockAddItem = vi.fn()
    const mockProduct = {
        id: 'product-1',
        title: 'Producto de Prueba',
        price: 100,
        image_url: 'https://example.com/image.jpg',
    }

    beforeEach(() => {
        vi.clearAllMocks()
            ; (useCart as any).mockReturnValue({
                addItem: mockAddItem,
                items: [],
                removeItem: vi.fn(),
                clearCart: vi.fn(),
            })
    })

    describe('renderizado', () => {
        it('debe renderizar el botón correctamente', () => {
            render(<AddToCartButton product={mockProduct} />)

            const button = screen.getByRole('button', { name: /agregar/i })
            expect(button).toBeInTheDocument()
        })

        it('debe mostrar el texto "Agregar +"', () => {
            render(<AddToCartButton product={mockProduct} />)

            expect(screen.getByText('Agregar +')).toBeInTheDocument()
        })
    })

    describe('funcionalidad', () => {
        it('debe agregar el producto al carrito al hacer click', () => {
            render(<AddToCartButton product={mockProduct} />)

            const button = screen.getByRole('button', { name: /agregar/i })
            fireEvent.click(button)

            expect(mockAddItem).toHaveBeenCalledTimes(1)
            expect(mockAddItem).toHaveBeenCalledWith({
                id: 'product-1',
                title: 'Producto de Prueba',
                price: 100,
                image_url: 'https://example.com/image.jpg',
                selectedVariant: undefined,
            })
        })

        it('debe mostrar un toast de éxito al agregar', () => {
            render(<AddToCartButton product={mockProduct} />)

            const button = screen.getByRole('button', { name: /agregar/i })
            fireEvent.click(button)

            expect(toast.success).toHaveBeenCalledWith('Agregado al carrito', {
                description: 'Producto de Prueba',
                duration: 2000,
            })
        })

        it('debe limpiar el producto antes de agregar', () => {
            const productWithExtraFields = {
                ...mockProduct,
                extraField: 'should be removed',
                anotherField: 123,
            }

            render(<AddToCartButton product={productWithExtraFields} />)

            const button = screen.getByRole('button', { name: /agregar/i })
            fireEvent.click(button)

            const calledWith = mockAddItem.mock.calls[0][0]
            expect(calledWith).not.toHaveProperty('extraField')
            expect(calledWith).not.toHaveProperty('anotherField')
        })

        it('debe convertir el precio a número', () => {
            const productWithStringPrice = {
                ...mockProduct,
                price: '150' as any,
            }

            render(<AddToCartButton product={productWithStringPrice} />)

            const button = screen.getByRole('button', { name: /agregar/i })
            fireEvent.click(button)

            const calledWith = mockAddItem.mock.calls[0][0]
            expect(calledWith.price).toBe(150)
            expect(typeof calledWith.price).toBe('number')
        })
    })

    describe('manejo de variantes', () => {
        it('debe incluir la variante seleccionada si existe', () => {
            const productWithVariant = {
                ...mockProduct,
                selectedVariant: 'Talla: M (+Q5)',
            }

            render(<AddToCartButton product={productWithVariant} />)

            const button = screen.getByRole('button', { name: /agregar/i })
            fireEvent.click(button)

            expect(mockAddItem).toHaveBeenCalledWith(
                expect.objectContaining({
                    selectedVariant: 'Talla: M (+Q5)',
                })
            )
        })

        it('debe usar undefined si no hay variante', () => {
            render(<AddToCartButton product={mockProduct} />)

            const button = screen.getByRole('button', { name: /agregar/i })
            fireEvent.click(button)

            expect(mockAddItem).toHaveBeenCalledWith(
                expect.objectContaining({
                    selectedVariant: undefined,
                })
            )
        })
    })

    describe('manejo de imagen', () => {
        it('debe usar null si no hay imagen', () => {
            const productWithoutImage = {
                ...mockProduct,
                image_url: null,
            }

            render(<AddToCartButton product={productWithoutImage} />)

            const button = screen.getByRole('button', { name: /agregar/i })
            fireEvent.click(button)

            expect(mockAddItem).toHaveBeenCalledWith(
                expect.objectContaining({
                    image_url: null,
                })
            )
        })

        it('debe usar null si image_url es undefined', () => {
            const productWithoutImage = {
                id: 'product-1',
                title: 'Producto',
                price: 100,
            }

            render(<AddToCartButton product={productWithoutImage} />)

            const button = screen.getByRole('button', { name: /agregar/i })
            fireEvent.click(button)

            expect(mockAddItem).toHaveBeenCalledWith(
                expect.objectContaining({
                    image_url: null,
                })
            )
        })
    })
})
