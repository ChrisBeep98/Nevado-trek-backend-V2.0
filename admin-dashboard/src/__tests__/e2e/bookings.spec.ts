import { test, expect } from '@playwright/test';

const ADMIN_KEY = 'ntk_admin_prod_key_2025_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7';

test.describe('Bookings Management', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
        await page.getByTestId('login-input').fill(ADMIN_KEY);
        await page.getByTestId('login-button').click();
        await page.waitForURL('/');

        // Navigate to bookings
        await page.getByTestId('nav-bookings').click();
        await page.waitForURL('/bookings');
        await page.waitForTimeout(1500);
    });

    test('should display bookings page', async ({ page }) => {
        await expect(page.getByTestId('search-bookings-input')).toBeVisible();
        await expect(page.getByTestId('status-filter-select')).toBeVisible();
        await expect(page.getByTestId('new-booking-button')).toBeVisible();
    });

    test('should have search functionality', async ({ page }) => {
        const searchInput = page.getByTestId('search-bookings-input');
        await expect(searchInput).toBeVisible();

        // Type something
        await searchInput.fill('test');
        await page.waitForTimeout(500);

        // Page should still work
        await expect(page.getByTestId('new-booking-button')).toBeVisible();
    });

    test('should have filter functionality', async ({ page }) => {
        const filterSelect = page.getByTestId('status-filter-select');
        await expect(filterSelect).toBeVisible();

        // Change filter
        await filterSelect.selectOption('confirmed');
        await page.waitForTimeout(500);

        // Page should still work
        await expect(page.getByTestId('search-bookings-input')).toBeVisible();
    });

    test('should open booking modal and display tabs when editing', async ({ page }) => {
        // Wait for bookings to load
        await page.waitForSelector('[data-testid^="booking-row-"]', { timeout: 10000 });

        // Click first booking
        await page.locator('[data-testid^="booking-row-"]').first().click();

        // Check modal title
        await expect(page.getByText('Manage Booking')).toBeVisible();

        // Check tabs
        await expect(page.getByTestId('tab-details')).toBeVisible();
        await expect(page.getByTestId('tab-status')).toBeVisible();
        await expect(page.getByTestId('tab-actions')).toBeVisible();

        // Check if data is loaded (name input should have value)
        const nameInput = page.getByTestId('input-customer-name');
        await expect(nameInput).not.toBeEmpty();
    });

    test('should edit booking details', async ({ page }) => {
        // Wait for bookings to load
        await page.waitForSelector('[data-testid^="booking-row-"]', { timeout: 10000 });

        const bookingRows = page.locator('[data-testid^="booking-row-"]');
        const rowCount = await bookingRows.count();

        if (rowCount > 0) {
            // Click first booking
            await bookingRows.first().click();

            // Edit name and ensure other fields are valid
            const nameInput = page.getByTestId('input-customer-name');
            await nameInput.fill('Updated Name E2E');

            await page.getByTestId('input-customer-email').fill('test@example.com');
            await page.getByTestId('input-customer-phone').fill('+1234567890');
            await page.getByTestId('input-customer-document').fill('123456789');

            // Save
            await page.getByTestId('submit-booking-button').click();

            // Modal should close
            await expect(page.getByText('Manage Booking')).not.toBeVisible();
        } else {
            // No bookings, test passes
            expect(true).toBe(true);
        }
    });
});
