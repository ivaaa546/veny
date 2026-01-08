import { describe, it, expect } from 'vitest'
import { generateWhatsAppLink } from '../whatsapp'

describe('generateWhatsAppLink', () => {
    const mockCartItems = [
        {
            id: '1',
            title: 'Hamburguesa Doble',
            price: 50,
            quantity: 2,
            image_url: null,
        },
        {
            id: '2',
            title: 'Pizza Familiar',
            price: 100,
            quantity: 1,
            image_url: null,
        },
    ]

    describe('generación del link', () => {
        it('debe generar un link de WhatsApp válido', () => {
            const link = generateWhatsAppLink('12345678', mockCartItems)
            expect(link).toContain('https://wa.me/')
            expect(link).toContain('?text=')
        })

        it('debe limpiar el número de teléfono', () => {
            const link = generateWhatsAppLink('+502 1234-5678', mockCartItems)
            expect(link).toContain('wa.me/50212345678')
        })

        it('debe incluir todos los productos en el mensaje', () => {
            const link = generateWhatsAppLink('12345678', mockCartItems)
            const decodedMessage = decodeURIComponent(link.split('?text=')[1])

            expect(decodedMessage).toContain('Hamburguesa Doble')
            expect(decodedMessage).toContain('Pizza Familiar')
        })

        it('debe incluir las cantidades correctas', () => {
            const link = generateWhatsAppLink('12345678', mockCartItems)
            const decodedMessage = decodeURIComponent(link.split('?text=')[1])

            expect(decodedMessage).toContain('2x Hamburguesa Doble')
            expect(decodedMessage).toContain('1x Pizza Familiar')
        })
    })

    describe('cálculo de totales', () => {
        it('debe calcular el total correctamente', () => {
            const link = generateWhatsAppLink('12345678', mockCartItems)
            const decodedMessage = decodeURIComponent(link.split('?text=')[1])

            // 2 x 50 + 1 x 100 = 200
            expect(decodedMessage).toContain('Q200')
        })

        it('debe calcular subtotales por producto', () => {
            const link = generateWhatsAppLink('12345678', mockCartItems)
            const decodedMessage = decodeURIComponent(link.split('?text=')[1])

            expect(decodedMessage).toContain('Q100') // 2 x 50
            expect(decodedMessage).toContain('Q100') // 1 x 100
        })

        it('debe manejar carrito vacío', () => {
            const link = generateWhatsAppLink('12345678', [])
            const decodedMessage = decodeURIComponent(link.split('?text=')[1])

            expect(decodedMessage).toContain('Q0')
        })
    })

    describe('formato del mensaje', () => {
        it('debe incluir saludo', () => {
            const link = generateWhatsAppLink('12345678', mockCartItems)
            const decodedMessage = decodeURIComponent(link.split('?text=')[1])

            expect(decodedMessage).toContain('Hola!')
            expect(decodedMessage).toContain('👋')
        })

        it('debe incluir sección de datos de envío', () => {
            const link = generateWhatsAppLink('12345678', mockCartItems)
            const decodedMessage = decodeURIComponent(link.split('?text=')[1])

            expect(decodedMessage).toContain('Mis Datos de Envío')
            expect(decodedMessage).toContain('Nombre:')
            expect(decodedMessage).toContain('Dirección:')
            expect(decodedMessage).toContain('Nota Adicional:')
        })

        it('debe usar emojis para mejor presentación', () => {
            const link = generateWhatsAppLink('12345678', mockCartItems)
            const decodedMessage = decodeURIComponent(link.split('?text=')[1])

            expect(decodedMessage).toContain('💰')
            expect(decodedMessage).toContain('📍')
            expect(decodedMessage).toContain('▪️')
        })

        it('debe codificar correctamente el mensaje para URL', () => {
            const link = generateWhatsAppLink('12345678', mockCartItems)
            const encodedPart = link.split('?text=')[1]

            // No debe contener espacios sin codificar
            expect(encodedPart).not.toContain(' ')
            // Debe contener %20 o + para espacios
            expect(encodedPart).toMatch(/%20|\+/)
        })
    })

    describe('edge cases', () => {
        it('debe manejar productos con caracteres especiales', () => {
            const items = [
                {
                    id: '1',
                    title: 'Pizza "Especial" & Única',
                    price: 100,
                    quantity: 1,
                    image_url: null,
                },
            ]

            const link = generateWhatsAppLink('12345678', items)
            expect(link).toBeTruthy()
            expect(link).toContain('wa.me/')
        })

        it('debe manejar precios decimales', () => {
            const items = [
                {
                    id: '1',
                    title: 'Producto',
                    price: 99.99,
                    quantity: 1,
                    image_url: null,
                },
            ]

            const link = generateWhatsAppLink('12345678', items)
            const decodedMessage = decodeURIComponent(link.split('?text=')[1])

            expect(decodedMessage).toContain('99.99')
        })

        it('debe manejar cantidades grandes', () => {
            const items = [
                {
                    id: '1',
                    title: 'Producto',
                    price: 10,
                    quantity: 100,
                    image_url: null,
                },
            ]

            const link = generateWhatsAppLink('12345678', items)
            const decodedMessage = decodeURIComponent(link.split('?text=')[1])

            expect(decodedMessage).toContain('100x')
            expect(decodedMessage).toContain('Q1000')
        })
    })
})
