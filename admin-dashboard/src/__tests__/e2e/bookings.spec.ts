import { test, expect } from '@playwright/test';

const ADMIN_KEY = 'ntk_admin_prod_key_2025_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7';

test.describe('Booking Management', () => {
    // Setup: Login before each test
    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
        await page.getByTestId('login-input').fill(ADMIN_KEY);
        await page.getByTestId('login-button').click();
        await page.waitForURL('/');

        // Navigate to bookings page
        await page.getByTestId('nav-bookings').click();
        await page.waitForURL('/bookings');
    });

    test('should display bookings page', async ({ page }) => {
        // Verify page elements
        await expect(page.getByTestId('search-bookings-input')).toBeVisible();
        await expect(page.getByTestId('status-filter-select')).toBeVisible();
        await expect(page.getByTestId('new-booking-button')).toBeVisible();

        // Bookings table should be visible
        await expect(page.locator('table')).toBeVisible();
    });

    test('should filter bookings by status', async ({ page }) => {
        // Select "confirmed" filter
        await page.getByTestId('status-filter-select').selectOption('confirmed');

        // Wait for filter to apply
        await page.waitForTimeout(500);

        // Page should still be responsive
        await expect(page.getByTestId('search-bookings-input')).toBeVisible();
    });

    test('should search bookings', async ({ page }) => {
        // Type in search input
        await page.getByTestId('search-bookings-input').fill('Test');

        // Wait for search to apply
        await page.waitForTimeout(500);

        // Page should still be responsive
        await expect(page.getByTestId('new-booking-button')).toBeVisible();
    });
});
