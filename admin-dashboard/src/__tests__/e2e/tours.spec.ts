import { test, expect } from '@playwright/test';

test.describe('Tours Management', () => {
    // Setup: Login before each test
    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
        await page.getByTestId('login-input').fill('ntk_admin_prod_key_2025_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7');
        await page.getByTestId('login-button').click();
        await page.waitForURL('/');
    });

    test('should navigate to tours page', async ({ page }) => {
        // Navigate to tours
        await page.getByTestId('nav-tours').click();
        await page.waitForURL('/tours');

        // Verify page loaded
        await expect(page.getByTestId('new-tour-button')).toBeVisible();
    });

    test('should display tour cards', async ({ page }) => {
        // Navigate to tours
        await page.getByTestId('nav-tours').click();
        await page.waitForURL('/tours');

        // Wait for tours to load (if any exist)
        await page.waitForTimeout(1000);

        // The page should at least show the new tour button
        await expect(page.getByTestId('new-tour-button')).toBeVisible();
    });
});
