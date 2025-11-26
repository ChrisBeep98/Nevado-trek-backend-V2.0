import { test, expect } from '@playwright/test';

const ADMIN_KEY = 'ntk_admin_prod_key_2025_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7';

test.describe('Add Booking to Existing Departure - Complete Flow', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
        await page.getByTestId('login-input').fill(ADMIN_KEY);
        await page.getByTestId('login-button').click();
        await page.waitForURL('/');
        await page.waitForLoadState('networkidle');
    });

    test('should successfully add booking to public departure and show toast', async ({ page }) => {
        // Find and click a public departure
        await page.waitForSelector('[data-testid^="event-"]', { timeout: 10000 });

        // Get first event
        const firstEvent = page.locator('[data-testid^="event-"]').first();
        await firstEvent.click();

        // Wait for DepartureModal
        await expect(page.locator('text=Departure Details')).toBeVisible();

        // Go to Bookings tab
        await page.getByTestId('tab-bookings').click();
        await page.waitForTimeout(500);

        // Get initial booking count
        const bookingsListBefore = await page.locator('[data-testid^="booking-card-"]').count();

        // Click Add Booking
        await page.locator('button:has-text("+ Add Booking")').click();
        await expect(page.locator('text=New Booking')).toBeVisible();

        // Fill form with unique data
        const timestamp = Date.now();
        await page.getByTestId('input-customer-name').fill(`Test User ${timestamp}`);
        await page.getByTestId('input-customer-email').fill(`test${timestamp}@test.com`);
        await page.getByTestId('input-customer-phone').fill('+1234567890');
        await page.getByTestId('input-customer-document').fill(`DOC${timestamp}`);
        await page.getByTestId('input-pax').fill('1');

        // Submit
        await page.getByTestId('submit-booking-button').click();

        // Wait for success toast
        await expect(page.locator('text=Booking created successfully')).toBeVisible({ timeout: 5000 });

        // Verify modal closed
        await expect(page.locator('text=New Booking')).not.toBeVisible({ timeout: 3000 });

        // Wait for departure modal to refresh
        await page.waitForTimeout(1500);

        // Verify booking was added (count should increase)
        const bookingsListAfter = await page.locator('[data-testid^="booking-card-"]').count();
        expect(bookingsListAfter).toBe(bookingsListBefore + 1);

        // Verify the new booking appears in the list
        await expect(page.locator(`text=Test User ${timestamp}`)).toBeVisible();
    });
});
