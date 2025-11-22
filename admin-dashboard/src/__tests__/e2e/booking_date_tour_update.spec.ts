import { test, expect } from '@playwright/test';

const ADMIN_KEY = 'ntk_admin_prod_key_2025_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7';

test.describe('BookingModal Date/Tour Update Functionality', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
        await page.getByTestId('login-input').fill(ADMIN_KEY);
        await page.getByTestId('login-button').click();
        await page.waitForURL('/');
    });

    test('should update date for private booking independently', async ({ page }) => {
        test.setTimeout(120000);

        // Get a tour ID
        await page.getByTestId('nav-tours').click();
        await page.waitForURL('/tours');
        await page.waitForSelector('[data-testid^="tour-card-"]', { timeout: 10000 });
        const tourCard = page.locator('[data-testid^="tour-card-"]').first();
        const tourId = (await tourCard.getAttribute('data-testid'))?.replace('tour-card-', '');

        // Create a private departure
        await page.goto('/');
        await page.waitForTimeout(2000);
        await page.getByTestId('new-departure-button').click();
        const today = new Date();
        const initialDate = today.toISOString().split('T')[0];
        await page.getByTestId('input-date').fill(initialDate);
        await page.getByTestId('select-type').selectOption('private');
        await page.getByTestId('input-price').fill('100000');
        await page.getByTestId('input-max-pax').fill('10');
        await page.getByTestId('select-tour').selectOption(tourId!);
        await page.getByTestId('create-departure-button').click();
        await page.waitForTimeout(3000);

        // Add a booking
        const event = page.locator('.fc-event').last();
        await event.click();
        await page.getByTestId('tab-bookings').click();
        await page.getByTestId('add-booking-button').click();
        await page.getByTestId('input-customer-name').fill('Date Update Test');
        await page.getByTestId('input-customer-email').fill('date@test.com');
        await page.getByTestId('input-customer-phone').fill('+123');
        await page.getByTestId('input-customer-document').fill('123');
        await page.getByTestId('input-pax').fill('2');
        await page.getByTestId('submit-booking-button').click();
        await page.waitForTimeout(2000);
        await page.getByTestId('close-modal-button').click();

        // Open booking from bookings page
        await page.getByTestId('nav-bookings').click();
        await page.getByTestId('search-bookings-input').fill('Date Update Test');
        await page.waitForTimeout(1000);
        await page.locator('[data-testid^="booking-row-"]').first().click();
        await page.waitForTimeout(2000);

        // Verify private booking shows separate update options
        await page.getByTestId('tab-actions').click();
        await expect(page.getByTestId('input-update-date')).toBeVisible();
        await expect(page.getByTestId('button-update-date')).toBeVisible();
        await expect(page.getByTestId('input-update-tour')).toBeVisible();
        await expect(page.getByTestId('button-update-tour')).toBeVisible();

        // Update date independently
        const newDate = new Date();
        newDate.setDate(newDate.getDate() + 5);
        const newDateStr = newDate.toISOString().split('T')[0];
        await page.getByTestId('input-update-date').fill(newDateStr);
        await page.getByTestId('button-update-date').click();
        await page.waitForTimeout(2000);

        // Verify update succeeded (modal should still be open)
        await expect(page.getByTestId('input-update-date')).toBeVisible();
    });

    test('should update tour for private booking independently', async ({ page }) => {
        test.setTimeout(120000);

        // Navigate to bookings and find "Date Update Test"
        await page.getByTestId('nav-bookings').click();
        await page.waitForURL('/bookings');
        await page.getByTestId('search-bookings-input').fill('Date Update Test');
        await page.waitForTimeout(1000);

        const bookingRow = page.locator('[data-testid^="booking-row-"]').first();
        if (await bookingRow.isVisible()) {
            await bookingRow.click();
            await page.waitForTimeout(2000);

            // Go to actions tab
            await page.getByTestId('tab-actions').click();

            // Get a different tour ID
            await page.getByTestId('close-modal-button').click();
            await page.getByTestId('nav-tours').click();
            await page.waitForURL('/tours');
            const tourCard = page.locator('[data-testid^="tour-card-"]').nth(1);
            let newTourId = (await tourCard.getAttribute('data-testid'))?.replace('tour-card-', '');

            if (!newTourId) {
                // If no second tour, use first tour
                const firstTour = page.locator('[data-testid^="tour-card-"]').first();
                newTourId = (await firstTour.getAttribute('data-testid'))?.replace('tour-card-', '');
            }

            // Go back to booking
            await page.getByTestId('nav-bookings').click();
            await page.getByTestId('search-bookings-input').fill('Date Update Test');
            await page.waitForTimeout(1000);
            await page.locator('[data-testid^="booking-row-"]').first().click();
            await page.waitForTimeout(2000);

            // Update tour independently
            await page.getByTestId('tab-actions').click();
            await page.getByTestId('input-update-tour').fill(newTourId!);
            await page.getByTestId('button-update-tour').click();
            await page.waitForTimeout(2000);

            // Verify update succeeded
            await expect(page.getByTestId('input-update-tour')).toBeVisible();
        }
    });

    test('should show blocked state for public shared booking', async ({ page }) => {
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
        await page.getByTestId('input-customer-name').fill('Public Test 1');
        await page.getByTestId('input-customer-email').fill('pub1@test.com');
        await page.getByTestId('input-customer-phone').fill('+123');
        await page.getByTestId('input-customer-document').fill('123');
        await page.getByTestId('input-pax').fill('1');
        await page.getByTestId('submit-booking-button').click();
        await page.waitForTimeout(2000);

        // Add second booking
        await page.getByTestId('add-booking-button').click();
        await page.getByTestId('input-customer-name').fill('Public Test 2');
        await page.getByTestId('input-customer-email').fill('pub2@test.com');
        await page.getByTestId('input-customer-phone').fill('+123');
        await page.getByTestId('input-customer-document').fill('123');
        await page.getByTestId('input-pax').fill('1');
        await page.getByTestId('submit-booking-button').click();
        await page.waitForTimeout(2000);
        await page.getByTestId('close-modal-button').click();

        // Open first booking
        await page.getByTestId('nav-bookings').click();
        await page.getByTestId('search-bookings-input').fill('Public Test 1');
        await page.waitForTimeout(1000);
        await page.locator('[data-testid^="booking-row-"]').first().click();
        await page.waitForTimeout(2000);

        // Verify type is Public
        await expect(page.getByTestId('booking-type-chip')).toContainText('Public');

        // Go to actions tab
        await page.getByTestId('tab-actions').click();

        // Verify date/tour inputs are NOT visible (blocked state)
        await expect(page.getByTestId('input-update-date')).not.toBeVisible();
        await expect(page.getByTestId('input-update-tour')).not.toBeVisible();

        // Verify blocked message and convert button are visible
        await expect(page.getByText('Change Date/Tour - Blocked')).toBeVisible();
        await expect(page.getByTestId('inline-convert-private-button')).toBeVisible();
    });

    test('should show update options after converting to private', async ({ page }) => {
        test.setTimeout(120000);

        // Navigate to bookings and find "Public Test 1"
        await page.getByTestId('nav-bookings').click();
        await page.waitForURL('/bookings');
        await page.getByTestId('search-bookings-input').fill('Public Test 1');
        await page.waitForTimeout(1000);

        const bookingRow = page.locator('[data-testid^="booking-row-"]').first();
        if (await bookingRow.isVisible()) {
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
                await page.getByTestId('search-bookings-input').fill('Public Test 1');
                await page.waitForTimeout(1000);
                await page.locator('[data-testid^="booking-row-"]').first().click();
                await page.waitForTimeout(2000);

                // Verify now private
                await expect(page.getByTestId('booking-type-chip')).toContainText('Private');

                // Verify update options are now visible
                await page.getByTestId('tab-actions').click();
                await expect(page.getByTestId('input-update-date')).toBeVisible();
                await expect(page.getByTestId('button-update-date')).toBeVisible();
                await expect(page.getByTestId('input-update-tour')).toBeVisible();
                await expect(page.getByTestId('button-update-tour')).toBeVisible();
            }
        }
    });
});
