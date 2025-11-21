import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
    test('should redirect to login when unauthenticated', async ({ page }) => {
        await page.goto('/');
        await expect(page).toHaveURL('/login');
    });

    test('should login successfully with valid key', async ({ page }) => {
        await page.goto('/login');

        // Fill in the secret key
        await page.getByTestId('login-input').fill('ntk_admin_prod_key_2025_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7');
        await page.getByTestId('login-button').click();

        // Should redirect to dashboard
        await page.waitForURL('/');

        // Verify we're on the dashboard
        await expect(page.getByText('Dashboard')).toBeVisible();
    });

    test('should logout successfully', async ({ page }) => {
        // Login first
        await page.goto('/login');
        await page.getByTestId('login-input').fill('ntk_admin_prod_key_2025_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7');
        await page.getByTestId('login-button').click();
        await page.waitForURL('/');

        // Logout
        await page.getByTestId('logout-button').click();

        // Should redirect to login
        await page.waitForURL('/login');
    });
});
