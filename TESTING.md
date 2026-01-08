# Testing en VENY

Este proyecto incluye una suite completa de testing con **Vitest**, **React Testing Library** y **Playwright**.

## 📋 Tipos de Tests

### 1. **Unit Tests** (Vitest)
Tests de funciones puras y utilidades:
- `src/lib/__tests__/phone.test.ts` - Formateo de teléfonos
- `src/lib/__tests__/whatsapp.test.ts` - Generación de links de WhatsApp
- `src/lib/__tests__/utils.test.ts` - Utilidades generales

### 2. **Component Tests** (React Testing Library)
Tests de componentes React:
- `src/hooks/__tests__/use-cart.test.ts` - Hook del carrito
- `src/components/storefront/__tests__/AddToCartButton.test.tsx` - Botón de agregar al carrito

### 3. **Integration Tests** (Vitest + Mocks)
Tests de Server Actions con mocks de Supabase:
- `src/actions/__tests__/products.test.ts` - CRUD de productos (próximamente)

### 4. **E2E Tests** (Playwright)
Tests de flujos completos de usuario:
- `e2e/auth.spec.ts` - Autenticación (login, registro, logout)
- `e2e/storefront.spec.ts` - Tienda pública (productos, carrito, filtros)
- `e2e/dashboard.spec.ts` - Dashboard del vendedor (próximamente)

---

## 🚀 Comandos

### Unit & Integration Tests (Vitest)

```bash
# Ejecutar todos los tests
npm run test

# Ejecutar tests en modo watch (re-ejecuta al guardar)
npm run test:watch

# Ejecutar tests con UI interactiva
npm run test:ui

# Generar reporte de cobertura
npm run test:coverage
```

### E2E Tests (Playwright)

```bash
# Ejecutar tests E2E (headless)
npm run test:e2e

# Ejecutar tests E2E con UI de Playwright
npm run test:e2e:ui

# Ejecutar tests E2E con navegador visible
npm run test:e2e:headed

# Ejecutar todos los tests (unit + E2E)
npm run test:all
```

---

## 📁 Estructura de Testing

```
veny/
├── e2e/                              # E2E Tests (Playwright)
│   ├── auth.spec.ts
│   ├── storefront.spec.ts
│   └── dashboard.spec.ts
├── src/
│   ├── test/                         # Test utilities
│   │   ├── setup.ts                  # Setup global de Vitest
│   │   ├── utils.tsx                 # Helpers y mock factories
│   │   └── mocks/
│   │       └── supabase.ts           # Mocks de Supabase
│   ├── lib/__tests__/                # Unit tests
│   ├── hooks/__tests__/              # Hook tests
│   ├── components/**/__tests__/      # Component tests
│   └── actions/__tests__/            # Integration tests
├── vitest.config.ts                  # Config de Vitest
├── playwright.config.ts              # Config de Playwright
└── .env.test.example                 # Ejemplo de env vars para testing
```

---

## ⚙️ Configuración

### Variables de Entorno para Testing

Crea un archivo `.env.test` (no se commitea) basado en `.env.test.example`:

```bash
# Supabase Test Project (opcional, para E2E)
NEXT_PUBLIC_SUPABASE_URL=https://your-test-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-test-anon-key
```

### Configuración de Playwright

Para E2E tests, Playwright necesita instalar los navegadores:

```bash
npx playwright install
```

---

## 📊 Cobertura de Código

Después de ejecutar `npm run test:coverage`, abre el reporte HTML:

```bash
# Windows
start coverage/index.html

# macOS
open coverage/index.html

# Linux
xdg-open coverage/index.html
```

**Objetivos de Cobertura:**
- ✅ Funciones utilitarias: 100%
- ✅ Hooks: 90%
- ✅ Componentes críticos: 80%
- ✅ Server Actions: 70%

---

## 🧪 Escribir Nuevos Tests

### Unit Test Example

```typescript
// src/lib/__tests__/myFunction.test.ts
import { describe, it, expect } from 'vitest'
import { myFunction } from '../myFunction'

describe('myFunction', () => {
  it('debe hacer algo', () => {
    expect(myFunction('input')).toBe('output')
  })
})
```

### Component Test Example

```typescript
// src/components/__tests__/MyComponent.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@/test/utils'
import MyComponent from '../MyComponent'

describe('MyComponent', () => {
  it('debe renderizar correctamente', () => {
    render(<MyComponent />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })
})
```

### E2E Test Example

```typescript
// e2e/myFeature.spec.ts
import { test, expect } from '@playwright/test'

test('debe hacer algo en el navegador', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('h1')).toBeVisible()
})
```

---

## 🔧 Mocks y Utilidades

### Mock de Supabase

```typescript
import { mockSupabaseClient, mockAuthenticatedUser } from '@/test/mocks/supabase'

// Simular usuario autenticado
mockAuthenticatedUser('user-id-123')

// Simular respuesta de query
mockSupabaseClient.from('products').select.mockResolvedValue({
  data: [{ id: '1', title: 'Producto' }],
  error: null,
})
```

### Mock Data Factories

```typescript
import { mockProduct, mockStore, mockCartItem } from '@/test/utils'

const product = mockProduct({ title: 'Mi Producto', price: 100 })
const store = mockStore({ slug: 'mi-tienda' })
const cartItem = mockCartItem({ quantity: 2 })
```

---

## 🐛 Debugging

### Vitest

```bash
# Ejecutar un solo archivo de test
npm run test src/lib/__tests__/phone.test.ts

# Ejecutar tests que coincidan con un patrón
npm run test -- --grep "formatPhoneForWhatsApp"

# Ver output detallado
npm run test -- --reporter=verbose
```

### Playwright

```bash
# Ejecutar un solo archivo
npm run test:e2e e2e/auth.spec.ts

# Ejecutar con debug mode
npx playwright test --debug

# Ver trace de un test fallido
npx playwright show-trace trace.zip
```

---

## 📝 Notas Importantes

### Mocking de Next.js

Los módulos de Next.js están mockeados en `src/test/setup.ts`:
- `next/navigation` (useRouter, useSearchParams)
- `next/headers` (cookies)
- `next/cache` (revalidatePath)

### Testing con Server Components

Los Server Components no se pueden testear directamente con RTL. Estrategias:
1. Extraer lógica a funciones puras y testear esas
2. Testear el output HTML con Playwright (E2E)
3. Convertir a Client Component temporalmente para testing

### Supabase en Tests

**Unit/Integration Tests:** Usar mocks (ya configurados en `src/test/mocks/supabase.ts`)

**E2E Tests:** Usar BD de prueba o mocks según necesidad

---

## 🎯 CI/CD

Para ejecutar tests en CI (GitHub Actions, etc.):

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:coverage
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
```

---

## 📚 Recursos

- [Vitest Docs](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Docs](https://playwright.dev/)
- [Testing Next.js](https://nextjs.org/docs/testing)

---

**Última actualización:** Enero 2026
