import { test, expect } from '@playwright/test';

const ADMIN_KEY = 'ntk_admin_prod_key_2025_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7';

test.describe('Add Booking - Minimal Test', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
        await page.getByTestId('login-input').fill(ADMIN_KEY);
        await page.getByTestId('login-button').click();
        await page.waitForURL('/');
        await page.waitForLoadState('networkidle');
    });

    test('should send request to join booking endpoint', async ({ page }) => {
        // Open first departure
        await page.waitForSelector('[data-testid^="event-"]', { timeout: 10000 });
        const event = page.locator('[data-testid^="event-"]').first();
        await event.click();

        // Wait for departure modal
        await page.waitForSelector('text=Departure Details', { timeout: 5000 });

        // Go to Bookings tab
        await page.getByTestId('tab-bookings').click();
        await page.waitForTimeout(500);

        // Click Add Booking
        const addBtn = page.locator('button:has-text("+ Add Booking")');
        await addBtn.click();

        // Wait for booking modal
        await page.waitForSelector('text=New Booking', { timeout: 5000 });

        // Fill minimal required fields
        await page.getByTestId('input-customer-name').fill('Test User');
        await page.getByTestId('input-customer-email').fill('test@test.com');
        await page.getByTestId('input-customer-phone').fill('+1234567890');
        await page.getByTestId('input-customer-document').fill('TEST123');
        await page.getByTestId('input-pax').fill('1');

        // Listen for network request
        const requestPromise = page.waitForRequest(
            request => request.url().includes('/admin/bookings/join') && request.method() === 'POST',
            { timeout: 10000 }
        );

        // Click submit
        await page.getByTestId('submit-booking-button').click();

        // Wait for request - THIS IS THE KEY TEST
        const request = await requestPromise;

        // If we got here, request was sent successfully
        expect(request.url()).toContain('/admin/bookings/join');

        // Verify payload has required fields
        const payload = request.postDataJSON();
        expect(payload).toHaveProperty('departureId');
        expect(payload).toHaveProperty('customer');
        expect(payload.customer).toHaveProperty('name', 'Test User');
        expect(payload).toHaveProperty('pax', 1);
    });
});
