import { test, expect } from '@playwright/test';

const ADMIN_KEY = process.env.ADMIN_SECRET_KEY || '';

test.describe('Booking Creation Flow', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
        await page.getByTestId('login-input').fill(ADMIN_KEY);
        await page.getByTestId('login-button').click();
        await page.waitForURL('/');
    });

    test('should create a new booking using the Create Booking button', async ({ page }) => {
        test.setTimeout(120000);

        // 1. Ensure a tour exists
        await page.getByTestId('nav-tours').click();
        await page.waitForURL('/tours');
        await page.waitForTimeout(2000);

        const tourCards = page.locator('[data-testid^="tour-card-"]');
        let tourCount = await tourCards.count();

        if (tourCount === 0) {
            await page.getByTestId('new-tour-button').click();
            await page.getByTestId('input-name-es').fill('E2E Test Tour');
            await page.getByTestId('input-name-en').fill('E2E Test Tour');
            await page.getByTestId('input-price').fill('100000');
            await page.getByTestId('submit-tour-button').click();
            await expect(page.getByRole('heading', { name: 'New Tour' })).not.toBeVisible();
            await page.waitForTimeout(1000);
        }

        // 2. Navigate to Bookings
        await page.getByTestId('nav-bookings').click();
        await page.waitForURL('/bookings');

        // 3. Open New Booking Modal
        await page.getByTestId('new-booking-button').click();
        await expect(page.getByRole('heading', { name: 'New Booking' })).toBeVisible();

        // 4. Select Tour
        const tourSelect = page.getByTestId('select-new-tour');
        await expect(tourSelect).toBeVisible();

        // Wait for options to be populated
        await page.waitForFunction(() => {
            const select = document.querySelector('[data-testid="select-new-tour"]') as HTMLSelectElement;
            return select && select.options.length > 1;
        }, { timeout: 10000 });

        // Select the second option (first actual tour)
        await tourSelect.selectOption({ index: 1 });

        // 5. Select Date (Tomorrow)
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateStr = tomorrow.toISOString().split('T')[0];
        await page.getByTestId('input-new-date').fill(dateStr);

        // 6. Select Type (Private)
        await page.getByTestId('type-private').click();

        // 7. Fill Customer Info
        const timestamp = Date.now();
        const customerName = `Test User ${timestamp}`;
        await page.getByTestId('input-customer-name').fill(customerName);
        await page.getByTestId('input-customer-email').fill(`test${timestamp}@example.com`);
        await page.getByTestId('input-customer-phone').fill('+573001234567');
        await page.getByTestId('input-customer-document').fill('123456789');
        await page.getByTestId('input-pax').fill('2');

        // 8. Submit
        await page.getByTestId('submit-booking-button').click();

        // 9. Verify Toast Notification (Success)
        await expect(page.getByText('Booking created successfully')).toBeVisible({ timeout: 15000 });

        // 10. Verify Modal Closed
        await expect(page.getByRole('heading', { name: 'New Booking' })).not.toBeVisible();

        // 11. Verify Booking appears in list
        await page.getByTestId('search-bookings-input').fill(customerName);
        await page.waitForTimeout(2000);

        const bookingRow = page.locator(`tr:has-text("${customerName}")`);
        await expect(bookingRow).toBeVisible();
    });
});
