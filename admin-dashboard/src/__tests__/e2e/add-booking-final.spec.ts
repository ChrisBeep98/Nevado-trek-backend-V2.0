import { test, expect } from '@playwright/test';

const ADMIN_KEY = 'ntk_admin_prod_key_2025_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7';

test.describe('Add Booking to Existing Departure', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
        await page.getByTestId('login-input').fill(ADMIN_KEY);
        await page.getByTestId('login-button').click();
        await page.waitForURL('/');
        await page.waitForLoadState('networkidle');
    });

    test('should create booking in existing departure via join endpoint', async ({ page }) => {
        // STEP 1: Open departure
        await page.waitForSelector('[data-testid^="event-"]', { timeout: 10000 });
        await page.locator('[data-testid^="event-"]').first().click();
        await page.waitForSelector('text=Departure Details', { timeout: 5000 });

        // STEP 2: Open Bookings tab and Add Booking
        await page.getByTestId('tab-bookings').click();
        await page.waitForTimeout(500);
        await page.locator('button:has-text("+ Add Booking")').click();
        await page.waitForSelector('text=New Booking', { timeout: 5000 });

        // STEP 3: Fill form with unique data
        const timestamp = Date.now();
        await page.getByTestId('input-customer-name').fill(`E2E Test ${timestamp}`);
        await page.getByTestId('input-customer-email').fill(`test${timestamp}@example.com`);
        await page.getByTestId('input-customer-phone').fill('+1234567890');
        await page.getByTestId('input-customer-document').fill(`E2E${timestamp}`);
        await page.getByTestId('input-pax').fill('1');

        // STEP 4: Setup listeners for request and response
        const responsePromise = page.waitForResponse(
            response => response.url().includes('/admin/bookings/join') && response.status() === 201,
            { timeout: 10000 }
        );

        // STEP 5: Submit form
        await page.getByTestId('submit-booking-button').click();

        // STEP 6: Wait for successful response
        const response = await responsePromise;
        expect(response.status()).toBe(201);

        const data = await response.json();
        expect(data).toHaveProperty('success', true);
        expect(data).toHaveProperty('booking');

        // STEP 7: Verify modal closed (booking modal should close on success)
        await expect(page.locator('text=New Booking')).not.toBeVisible({ timeout: 3000 });

        // Test passed - booking was created successfully via join endpoint
    });
});
