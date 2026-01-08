import { describe, it, expect } from 'vitest'
import { cn } from '../utils'

describe('cn (className utility)', () => {
    it('debe combinar clases simples', () => {
        expect(cn('class1', 'class2')).toBe('class1 class2')
    })

    it('debe manejar clases condicionales', () => {
        expect(cn('base', true && 'conditional')).toBe('base conditional')
        expect(cn('base', false && 'conditional')).toBe('base')
    })

    it('debe eliminar clases duplicadas', () => {
        expect(cn('px-4', 'px-2')).toBe('px-2')
    })

    it('debe manejar clases de Tailwind conflictivas', () => {
        expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
    })

    it('debe manejar arrays de clases', () => {
        expect(cn(['class1', 'class2'])).toBe('class1 class2')
    })

    it('debe manejar objetos de clases', () => {
        expect(cn({ class1: true, class2: false })).toBe('class1')
    })

    it('debe manejar undefined y null', () => {
        expect(cn('class1', undefined, null, 'class2')).toBe('class1 class2')
    })

    it('debe manejar strings vacíos', () => {
        expect(cn('class1', '', 'class2')).toBe('class1 class2')
    })

    it('debe combinar múltiples tipos de inputs', () => {
        expect(
            cn('base', ['array1', 'array2'], { obj1: true, obj2: false }, 'final')
        ).toBe('base array1 array2 obj1 final')
    })

    describe('Tailwind merge', () => {
        it('debe resolver conflictos de padding', () => {
            expect(cn('p-4', 'p-8')).toBe('p-8')
        })

        it('debe resolver conflictos de margin', () => {
            expect(cn('m-2', 'm-4')).toBe('m-4')
        })

        it('debe mantener clases no conflictivas', () => {
            expect(cn('px-4', 'py-2')).toBe('px-4 py-2')
        })

        it('debe resolver conflictos de background', () => {
            expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500')
        })

        it('debe resolver conflictos de text color', () => {
            expect(cn('text-sm', 'text-lg')).toBe('text-lg')
        })
    })
})
