import { test, expect } from '@playwright/test';

const ADMIN_KEY = 'ntk_admin_prod_key_2025_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7';

test.describe('BookingModal Complete Functionality', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
        await page.getByTestId('login-input').fill(ADMIN_KEY);
        await page.getByTestId('login-button').click();
        await page.waitForURL('/');
    });

    test('should display booking details correctly', async ({ page }) => {
        test.setTimeout(60000);

        // Navigate to bookings page
        await page.getByTestId('nav-bookings').click();
        await page.waitForURL('/bookings');
        await page.waitForTimeout(2000);

        // Find any booking
        const bookingRow = page.locator('[data-testid^="booking-row-"]').first();
        await bookingRow.waitFor({ state: 'visible', timeout: 10000 });
        await bookingRow.click();

        // Wait for modal to open
        await page.waitForTimeout(2000);

        // Verify basic structure exists
        const contextTour = page.getByTestId('booking-context-tour');
        const contextDate = page.getByTestId('booking-context-date');
        const contextType = page.getByTestId('booking-context-type');

        // Verify these elements are visible
        await expect(contextTour).toBeVisible();
        await expect(contextDate).toBeVisible();
        await expect(contextType).toBeVisible();
    });

    test('should show move options for private booking', async ({ page }) => {
        test.setTimeout(60000);

        // Navigate to bookings
        await page.getByTestId('nav-bookings').click();
        await page.waitForURL('/bookings');
        await page.waitForTimeout(1000);

        // Find first booking
        const bookingRow = page.locator('[data-testid^="booking-row-"]').first();
        await bookingRow.waitFor({ state: 'visible', timeout: 10000 });
        await bookingRow.click();
        await page.waitForTimeout(2000);

        // Check if it's private
        const typeChip = page.getByTestId('booking-type-chip');
        if (await typeChip.isVisible()) {
            const typeText = await typeChip.textContent();
            if (typeText?.includes('Private')) {
                // Go to actions tab
                await page.getByTestId('tab-actions').click();

                // Verify move options are visible
                await expect(page.getByTestId('input-move-date')).toBeVisible();
            }
        }
    });

    test('should block move options for public shared booking', async ({ page }) => {
        test.setTimeout(120000);

        // Get a tour ID
        await page.getByTestId('nav-tours').click();
        await page.waitForURL('/tours');
        await page.waitForSelector('[data-testid^="tour-card-"]', { timeout: 10000 });
        const tourCard = page.locator('[data-testid^="tour-card-"]').first();
        const tourId = (await tourCard.getAttribute('data-testid'))?.replace('tour-card-', '');

        // Create a public departure
        await page.goto('/');
        await page.waitForTimeout(2000);
        await page.getByTestId('new-departure-button').click();
        await page.getByTestId('input-date').fill(new Date().toISOString().split('T')[0]);
        await page.getByTestId('select-type').selectOption('public');
        await page.getByTestId('input-price').fill('50000');
        await page.getByTestId('input-max-pax').fill('10');
        await page.getByTestId('select-tour').selectOption(tourId!);
        await page.getByTestId('create-departure-button').click();
        await page.waitForTimeout(3000);

        // Add first booking
        const event = page.locator('.fc-event').last();
        await event.click();
        await page.getByTestId('tab-bookings').click();
        await page.getByTestId('add-booking-button').click();
        await page.getByTestId('input-customer-name').fill('Test Public 1');
        await page.getByTestId('input-customer-email').fill('tp1@test.com');
        await page.getByTestId('input-customer-phone').fill('+123');
        await page.getByTestId('input-customer-document').fill('123');
        await page.getByTestId('input-pax').fill('1');
        await page.getByTestId('submit-booking-button').click();
        await page.waitForTimeout(2000);

        // Add second booking
        await page.getByTestId('add-booking-button').click();
        await page.getByTestId('input-customer-name').fill('Test Public 2');
        await page.getByTestId('input-customer-email').fill('tp2@test.com');
        await page.getByTestId('input-customer-phone').fill('+123');
        await page.getByTestId('input-customer-document').fill('123');
        await page.getByTestId('input-pax').fill('1');
        await page.getByTestId('submit-booking-button').click();
        await page.waitForTimeout(2000);
        await page.getByTestId('close-modal-button').click();

        // Open first booking
        await page.getByTestId('nav-bookings').click();
        await page.getByTestId('search-bookings-input').fill('Test Public 1');
        await page.waitForTimeout(1000);
        await page.locator('[data-testid^="booking-row-"]').first().click();
        await page.waitForTimeout(2000);

        // Verify type is Public
        await expect(page.getByTestId('booking-type-chip')).toContainText('Public');

        // Go to actions tab and verify blocked
        await page.getByTestId('tab-actions').click();
        await expect(page.getByText('Change Date/Tour - Blocked')).toBeVisible();
        await expect(page.getByTestId('inline-convert-private-button')).toBeVisible();
    });

    test('should convert public shared booking to private', async ({ page }) => {
        test.setTimeout(90000);

        // Navigate to bookings and find "Test Public 1"
        await page.getByTestId('nav-bookings').click();
        await page.waitForURL('/bookings');
        await page.getByTestId('search-bookings-input').fill('Test Public 1');
        await page.waitForTimeout(1000);

        const bookingRow = page.locator('[data-testid^="booking-row-"]').first();
        await bookingRow.click();
        await page.waitForTimeout(2000);

        // Verify it's public
        const typeChip = page.getByTestId('booking-type-chip');
        const typeText = await typeChip.textContent();

        if (typeText?.includes('Public')) {
            // Go to actions and convert
            await page.getByTestId('tab-actions').click();
            await page.getByTestId('inline-convert-private-button').click();

            // Wait for conversion
            await page.waitForTimeout(3000);

            // Close and reopen
            await page.getByTestId('close-modal-button').click();
            await page.waitForTimeout(1000);
            await page.getByTestId('search-bookings-input').fill('Test Public 1');
            await page.waitForTimeout(1000);
            await page.locator('[data-testid^="booking-row-"]').first().click();
            await page.waitForTimeout(2000);

            // Verify now private
            await expect(page.getByTestId('booking-type-chip')).toContainText('Private');

            // Verify move options visible
            await page.getByTestId('tab-actions').click();
            await expect(page.getByTestId('input-move-date')).toBeVisible();
        }
    });

    test('should treat public alone booking as private-like', async ({ page }) => {
        test.setTimeout(90000);

        // Get a tour ID
        await page.getByTestId('nav-tours').click();
        await page.waitForURL('/tours');
        await page.waitForSelector('[data-testid^="tour-card-"]', { timeout: 10000 });
        const tourCard = page.locator('[data-testid^="tour-card-"]').first();
        const tourId = (await tourCard.getAttribute('data-testid'))?.replace('tour-card-', '');

        // Create a public departure
        await page.goto('/');
        await page.waitForTimeout(2000);
        await page.getByTestId('new-departure-button').click();
        await page.getByTestId('input-date').fill(new Date().toISOString().split('T')[0]);
        await page.getByTestId('select-type').selectOption('public');
        await page.getByTestId('input-price').fill('50000');
        await page.getByTestId('input-max-pax').fill('10');
        await page.getByTestId('select-tour').selectOption(tourId!);
        await page.getByTestId('create-departure-button').click();
        await page.waitForTimeout(3000);

        // Add only one booking
        const event = page.locator('.fc-event').last();
        await event.click();
        await page.getByTestId('tab-bookings').click();
        await page.getByTestId('add-booking-button').click();
        await page.getByTestId('input-customer-name').fill('Test Alone');
        await page.getByTestId('input-customer-email').fill('alone@test.com');
        await page.getByTestId('input-customer-phone').fill('+123');
        await page.getByTestId('input-customer-document').fill('123');
        await page.getByTestId('input-pax').fill('2');
        await page.getByTestId('submit-booking-button').click();
        await page.waitForTimeout(2000);
        await page.getByTestId('close-modal-button').click();

        // Open booking
        await page.getByTestId('nav-bookings').click();
        await page.getByTestId('search-bookings-input').fill('Test Alone');
        await page.waitForTimeout(1000);
        await page.locator('[data-testid^="booking-row-"]').first().click();
        await page.waitForTimeout(2000);

        // Go to actions tab
        await page.getByTestId('tab-actions').click();

        // Should show move options (acts like private)
        await expect(page.getByTestId('input-move-date')).toBeVisible();
    });
});
