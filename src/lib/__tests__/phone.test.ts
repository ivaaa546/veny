import { describe, it, expect } from 'vitest'
import { formatPhoneForWhatsApp } from '../phone'

describe('formatPhoneForWhatsApp', () => {
    describe('números guatemaltecos (8 dígitos)', () => {
        it('debe agregar código de país 502 a número de 8 dígitos', () => {
            expect(formatPhoneForWhatsApp('12345678')).toBe('50212345678')
        })

        it('debe manejar números con espacios', () => {
            expect(formatPhoneForWhatsApp('1234 5678')).toBe('50212345678')
        })

        it('debe manejar números con guiones', () => {
            expect(formatPhoneForWhatsApp('1234-5678')).toBe('50212345678')
        })

        it('debe manejar números con paréntesis', () => {
            expect(formatPhoneForWhatsApp('(1234) 5678')).toBe('50212345678')
        })
    })

    describe('números con código de país', () => {
        it('debe manejar números que empiezan con +502', () => {
            expect(formatPhoneForWhatsApp('+50212345678')).toBe('50212345678')
        })

        it('debe manejar números que empiezan con 502', () => {
            expect(formatPhoneForWhatsApp('50212345678')).toBe('50212345678')
        })

        it('debe manejar números con + y espacios', () => {
            expect(formatPhoneForWhatsApp('+502 1234 5678')).toBe('50212345678')
        })
    })

    describe('números internacionales', () => {
        it('debe mantener números con otros códigos de país', () => {
            expect(formatPhoneForWhatsApp('+1234567890')).toBe('1234567890')
        })

        it('debe manejar números largos sin código 502', () => {
            // Números de 10 dígitos se devuelven tal cual según la implementación
            expect(formatPhoneForWhatsApp('1234567890')).toBe('1234567890')
        })
    })

    describe('edge cases', () => {
        it('debe retornar string vacío para null', () => {
            expect(formatPhoneForWhatsApp(null)).toBe('')
        })

        it('debe retornar string vacío para undefined', () => {
            expect(formatPhoneForWhatsApp(undefined)).toBe('')
        })

        it('debe retornar string vacío para string vacío', () => {
            expect(formatPhoneForWhatsApp('')).toBe('')
        })

        it('debe limpiar caracteres especiales', () => {
            expect(formatPhoneForWhatsApp('(502) 1234-5678 ext. 123')).toBe('50212345678123')
        })
    })

    describe('validación de longitud', () => {
        it('debe agregar 502 a números cortos', () => {
            expect(formatPhoneForWhatsApp('123')).toBe('502123')
        })

        it('debe manejar correctamente números de 11 dígitos con 502', () => {
            expect(formatPhoneForWhatsApp('50212345678')).toBe('50212345678')
        })
    })
})
