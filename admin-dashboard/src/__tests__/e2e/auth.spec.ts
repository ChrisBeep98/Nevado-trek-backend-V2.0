import { test, expect } from '@playwright/test';

console.error('AUTH TEST LOADED');

const ADMIN_KEY = process.env.ADMIN_SECRET_KEY || '';

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
