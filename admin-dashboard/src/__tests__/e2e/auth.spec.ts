import { test, expect } from '@playwright/test';

const ADMIN_KEY = 'ntk_admin_prod_key_2025_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7';

test.describe('Authentication', () => {
    test('should login successfully with valid admin key', async ({ page }) => {
        await page.goto('/login');

        await page.getByTestId('login-input').fill(ADMIN_KEY);
        await page.getByTestId('login-button').click();

        // Should redirect to home
        await page.waitForURL('/', { timeout: 10000 });
        await expect(page).toHaveURL('/');

        // Verify calendar is visible
        await expect(page.locator('.fc-view')).toBeVisible({ timeout: 10000 });
    });

    test('should fail login with invalid admin key', async ({ page }) => {
        await page.goto('/login');

        await page.getByTestId('login-input').fill('wrong_key_123');
        await page.getByTestId('login-button').click();

        // Should see error or stay on login
        await page.waitForTimeout(2000);

        // Either shows error or stays on login page
        const hasError = await page.getByText('Invalid Admin Key').isVisible().catch(() => false);
        const onLoginPage = page.url().includes('/login');

        expect(hasError || onLoginPage).toBe(true);
    });

    test('should logout successfully', async ({ page }) => {
        // First login
        await page.goto('/login');
        await page.getByTestId('login-input').fill(ADMIN_KEY);
        await page.getByTestId('login-button').click();
        await page.waitForURL('/');

        // Click logout
        await page.getByTestId('logout-button').click();

        // Should redirect to login
        await page.waitForURL('/login', { timeout: 5000 });
        await expect(page).toHaveURL('/login');
    });
});
