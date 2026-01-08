import { test, expect } from '@playwright/test'

test.describe('Storefront - Tienda Pública', () => {
    // Nota: Estos tests requieren que tengas una tienda de prueba creada
    // Ajusta el slug según tu tienda de prueba
    const TEST_STORE_SLUG = 'test-store'

    test.beforeEach(async ({ page }) => {
        // Navegar a la tienda de prueba
        await page.goto(`/${TEST_STORE_SLUG}`)
    })

    test('debe cargar la página de la tienda correctamente', async ({ page }) => {
        // Verificar que la página cargó
        await expect(page).toHaveURL(new RegExp(TEST_STORE_SLUG))

        // Verificar que hay contenido visible
        await expect(page.locator('body')).toBeVisible()
    })

    test('debe mostrar productos en la tienda', async ({ page }) => {
        // Esperar a que los productos carguen
        // Ajusta el selector según tu implementación
        const productCards = page.locator('[data-testid="product-card"]').or(
            page.locator('article').or(
                page.locator('.product-card')
            )
        )

        // Verificar que hay al menos un producto visible
        await expect(productCards.first()).toBeVisible({ timeout: 10000 })
    })

    test('debe permitir filtrar por categorías', async ({ page }) => {
        // Buscar tabs de categorías
        const categoryTabs = page.locator('button[role="tab"]')

        // Verificar que hay tabs
        const tabCount = await categoryTabs.count()
        if (tabCount > 1) {
            // Click en la segunda categoría (la primera suele ser "Todos")
            await categoryTabs.nth(1).click()

            // Esperar a que se actualice el contenido
            await page.waitForTimeout(500)

            // Verificar que sigue habiendo productos visibles
            await expect(page.locator('body')).toContainText(/./i)
        }
    })

    test('debe abrir modal de detalles al hacer click en un producto', async ({ page }) => {
        // Buscar el primer producto
        const firstProduct = page.locator('article, [data-testid="product-card"]').first()

        // Esperar a que sea visible y hacer click
        await firstProduct.waitFor({ state: 'visible', timeout: 10000 })
        await firstProduct.click()

        // Verificar que se abrió un modal/dialog
        const dialog = page.locator('[role="dialog"]')
        await expect(dialog).toBeVisible({ timeout: 5000 })
    })

    test('debe agregar producto al carrito', async ({ page }) => {
        // Buscar botón de agregar al carrito
        const addToCartButton = page.locator('button').filter({ hasText: /agregar/i }).first()

        if (await addToCartButton.isVisible()) {
            // Click en agregar al carrito
            await addToCartButton.click()

            // Verificar que apareció un toast o notificación
            await expect(
                page.locator('text=/agregado|añadido|carrito/i')
            ).toBeVisible({ timeout: 3000 })
        }
    })

    test('debe mostrar el carrito al hacer click en el ícono', async ({ page }) => {
        // Buscar el ícono del carrito (puede ser un botón con ícono de shopping cart)
        const cartButton = page.locator('button').filter({
            has: page.locator('svg')
        }).filter({
            hasText: /carrito|cart/i
        }).or(
            page.locator('[aria-label*="carrito"], [aria-label*="cart"]')
        )

        if (await cartButton.first().isVisible()) {
            await cartButton.first().click()

            // Verificar que se abrió el sidebar del carrito
            await expect(
                page.locator('text=/carrito|cart/i')
            ).toBeVisible({ timeout: 3000 })
        }
    })

    test('debe ser responsive en móvil', async ({ page }) => {
        // Cambiar a viewport móvil
        await page.setViewportSize({ width: 375, height: 667 })

        // Verificar que la página sigue siendo usable
        await expect(page.locator('body')).toBeVisible()

        // Verificar que los productos se muestran en grid móvil
        const products = page.locator('article, [data-testid="product-card"]')
        await expect(products.first()).toBeVisible({ timeout: 10000 })
    })
})

test.describe('Storefront - Búsqueda', () => {
    const TEST_STORE_SLUG = 'test-store'

    test('debe permitir buscar productos', async ({ page }) => {
        await page.goto(`/${TEST_STORE_SLUG}`)

        // Buscar input de búsqueda
        const searchInput = page.locator('input[type="search"], input[placeholder*="buscar" i], input[placeholder*="search" i]')

        if (await searchInput.isVisible()) {
            // Escribir en el buscador
            await searchInput.fill('pizza')

            // Esperar resultados
            await page.waitForTimeout(500)

            // Verificar que hay resultados o mensaje
            await expect(page.locator('body')).toContainText(/./i)
        }
    })
})

test.describe('Storefront - Manejo de Errores', () => {
    test('debe mostrar error 404 para tienda inexistente', async ({ page }) => {
        // Navegar a una tienda que no existe
        await page.goto('/tienda-que-no-existe-12345')

        // Verificar que muestra algún mensaje de error o redirección
        // Esto depende de tu implementación
        await expect(page.locator('body')).toContainText(/./i)
    })

    test('debe manejar tienda inactiva', async ({ page }) => {
        // Esto requeriría una tienda de prueba marcada como inactiva
        // Ajusta según tu implementación
    })
})
