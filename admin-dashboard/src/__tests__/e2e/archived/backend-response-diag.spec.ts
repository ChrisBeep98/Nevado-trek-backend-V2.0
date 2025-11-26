import { test } from '@playwright/test';

const ADMIN_KEY = 'ntk_admin_prod_key_2025_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7';

test.describe('Backend Response Diagnostic', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
        await page.getByTestId('login-input').fill(ADMIN_KEY);
        await page.getByTestId('login-button').click();
        await page.waitForURL('/');
        await page.waitForLoadState('networkidle');
    });

    test('inspect backend response', async ({ page }) => {
        // Open departure and add booking
        await page.waitForSelector('[data-testid^="event-"]');
        await page.locator('[data-testid^="event-"]').first().click();
        await page.waitForSelector('text=Departure Details');
        await page.getByTestId('tab-bookings').click();
        await page.waitForTimeout(500);
        await page.locator('button:has-text("+ Add Booking")').click();
        await page.waitForSelector('text=New Booking');

        // Fill form
        await page.getByTestId('input-customer-name').fill('Diagnostic Test');
        await page.getByTestId('input-customer-email').fill('diag@test.com');
        await page.getByTestId('input-customer-phone').fill('+1111111111');
        await page.getByTestId('input-customer-document').fill('DIAG123');
        await page.getByTestId('input-pax').fill('1');

        // Listen for response
        page.on('response', async response => {
            if (response.url().includes('/admin/bookings')) {
                console.log('=== BACKEND RESPONSE ===');
                console.log('URL:', response.url());
                console.log('Status:', response.status());
                console.log('Status text:', response.statusText());
                try {
                    const body = await response.json();
                    console.log('Body:', JSON.stringify(body, null, 2));
                } catch (e) {
                    const text = await response.text();
                    console.log('Body (text):', text);
                }
                console.log('========================');
            }
        });

        // Submit
        await page.getByTestId('submit-booking-button').click();

        // Wait to capture response
        await page.waitForTimeout(5000);
    });
});
