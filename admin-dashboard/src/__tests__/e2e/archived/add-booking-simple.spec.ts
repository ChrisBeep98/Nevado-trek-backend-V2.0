import { test, expect } from '@playwright/test';

const ADMIN_KEY = process.env.ADMIN_SECRET_KEY || '';

test.describe('Add Booking to Departure - Debug', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
        await page.getByTestId('login-input').fill(ADMIN_KEY);
        await page.getByTestId('login-button').click();
        await page.waitForURL('/');
        await page.waitForLoadState('networkidle');
    });

    test('should add booking to public departure', async ({ page }) => {
        // Wait for events to load
        await page.waitForSelector('[data-testid^="event-"]', { timeout: 10000 });

        // Click first event
        const firstEvent = page.locator('[data-testid^="event-"]').first();
        await firstEvent.click();

        // Wait for DepartureModal
        await page.waitForSelector('text=Departure Details', { timeout: 5000 });

        // Click Bookings tab
        await page.getByTestId('tab-bookings').click();
        await page.waitForTimeout(500);

        // Click Add Booking button
        await page.locator('button:has-text("+ Add Booking")').click();
        await page.waitForTimeout(500);

        // Verify BookingModal opened
        await expect(page.locator('text=New Booking')).toBeVisible();

        // Fill form
        await page.getByTestId('input-customer-name').fill('E2E Test Customer');
        await page.getByTestId('input-customer-email').fill('e2e@test.com');
        await page.getByTestId('input-customer-phone').fill('+1234567890');
        await page.getByTestId('input-customer-document').fill('E2E123');
        await page.getByTestId('input-pax').fill('1');

        // Listen for network requests
        const createBookingRequest = page.waitForRequest(request =>
            request.url().includes('/admin/bookings') && request.method() === 'POST'
        );

        // Click submit button
        await page.getByTestId('submit-booking-button').click();

        // Wait for request
        const request = await createBookingRequest;
        console.log('Request URL:', request.url());
        console.log('Request payload:', await request.postDataJSON());

        // Wait for response
        const response = await request.response();
        console.log('Response status:', response?.status());
        console.log('Response body:', await response?.json());

        // Verify modal closed or error shown
        await page.waitForTimeout(2000);
    });
});
