import { test, expect } from '@playwright/test';

const ADMIN_KEY = 'ntk_admin_prod_key_2025_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7';

test.describe('Departure Management', () => {
    // Setup: Login before each test
    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
        await page.getByTestId('login-input').fill(ADMIN_KEY);
        await page.getByTestId('login-button').click();
        await page.waitForURL('/');
    });

    test('should display calendar page', async ({ page }) => {
        // Verify we're on the calendar/home page
        await page.waitForSelector('.fc-view', { timeout: 10000 });

        // Verify "New Departure" button is visible
        await expect(page.getByTestId('new-departure-button')).toBeVisible();

        // Verify calendar is rendered
        await expect(page.locator('.fc-view')).toBeVisible();
    });

    test('should navigate to other pages from calendar', async ({ page }) => {
        // Navigate to bookings
        await page.getByTestId('nav-bookings').click();
        await page.waitForURL('/bookings');

        // Navigate back to calendar
        await page.getByTestId('nav-calendar').click();
        await page.waitForURL('/');

        // Verify calendar is still visible
        await expect(page.locator('.fc-view')).toBeVisible();
    });
});
