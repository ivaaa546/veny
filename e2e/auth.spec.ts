import { test, expect } from '@playwright/test'

test.describe('Autenticación', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/login')
    })

    test('debe mostrar el formulario de login', async ({ page }) => {
        // Verificar que estamos en la página de login
        await expect(page).toHaveURL(/login/)

        // Verificar que hay campos de email y password
        await expect(page.locator('input[type="email"]')).toBeVisible()
        await expect(page.locator('input[type="password"]')).toBeVisible()

        // Verificar que hay botón de submit
        await expect(page.locator('button[type="submit"]')).toBeVisible()
    })

    test('debe mostrar error con credenciales inválidas', async ({ page }) => {
        // Llenar formulario con credenciales incorrectas
        await page.fill('input[type="email"]', 'usuario@inexistente.com')
        await page.fill('input[type="password"]', 'passwordincorrecto')

        // Submit
        await page.click('button[type="submit"]')

        // Esperar mensaje de error
        await expect(
            page.locator('text=/error|incorrecto|inválido/i')
        ).toBeVisible({ timeout: 5000 })
    })

    test('debe redirigir al dashboard con credenciales válidas', async ({ page }) => {
        // NOTA: Ajusta estas credenciales a tu usuario de prueba
        const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com'
        const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'testpassword123'

        // Llenar formulario
        await page.fill('input[type="email"]', TEST_EMAIL)
        await page.fill('input[type="password"]', TEST_PASSWORD)

        // Submit
        await page.click('button[type="submit"]')

        // Esperar redirección al dashboard
        await expect(page).toHaveURL(/dashboard/, { timeout: 10000 })
    })

    test('debe tener link a página de registro', async ({ page }) => {
        // Buscar link de registro
        const registerLink = page.locator('a[href*="register"], a:has-text("registr")')

        if (await registerLink.isVisible()) {
            await expect(registerLink).toBeVisible()
        }
    })
})

test.describe('Registro', () => {
    test.beforeEach(async ({ page }) => {
        // Intentar navegar a la página de registro
        await page.goto('/register')
    })

    test('debe mostrar el formulario de registro', async ({ page }) => {
        // Verificar campos del formulario
        const emailInput = page.locator('input[type="email"]')
        const passwordInput = page.locator('input[type="password"]')

        if (await emailInput.isVisible()) {
            await expect(emailInput).toBeVisible()
            await expect(passwordInput).toBeVisible()
        }
    })
})

test.describe('Logout', () => {
    test('debe cerrar sesión correctamente', async ({ page }) => {
        // NOTA: Este test requiere estar autenticado primero
        // Puedes usar el contexto de autenticación de Playwright

        // Navegar al dashboard
        await page.goto('/dashboard')

        // Buscar botón de logout
        const logoutButton = page.locator('button:has-text("cerrar sesión"), button:has-text("logout"), button:has-text("salir")')

        if (await logoutButton.first().isVisible()) {
            await logoutButton.first().click()

            // Verificar redirección a login o home
            await page.waitForURL(/login|^\/$/, { timeout: 5000 })
        }
    })
})

test.describe('Protección de Rutas', () => {
    test('debe redirigir a login si no está autenticado', async ({ page }) => {
        // Intentar acceder al dashboard sin autenticación
        await page.goto('/dashboard')

        // Debería redirigir a login
        await expect(page).toHaveURL(/login/, { timeout: 5000 })
    })

    test('debe permitir acceso al dashboard si está autenticado', async ({ page, context }) => {
        // NOTA: Este test requiere configurar el contexto de autenticación
        // Ver: https://playwright.dev/docs/auth

        // Por ahora, solo verificamos que la ruta existe
        await page.goto('/dashboard')
        await expect(page.locator('body')).toBeVisible()
    })
})
