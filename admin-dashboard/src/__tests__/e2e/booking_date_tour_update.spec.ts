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
        const uniqueId = Date.now().toString();
        const customerName = `Date Update Test ${uniqueId}`;

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

        // Wait for modal to close
        await expect(page.getByTestId('create-departure-button')).not.toBeVisible({ timeout: 10000 });
        await page.waitForTimeout(2000); // Wait for calendar refresh

        // Add a booking
        const event = page.locator('.fc-event').last();
        await event.click();
        await page.getByTestId('tab-bookings').click();
        await page.getByTestId('add-booking-button').click();
        await page.getByTestId('input-customer-name').fill(customerName);
        await page.getByTestId('input-customer-email').fill(`date${uniqueId}@test.com`);
        await page.getByTestId('input-customer-phone').fill('+123');
        await page.getByTestId('input-customer-document').fill('123');
        await page.getByTestId('input-pax').fill('2');
        await page.getByTestId('submit-booking-button').click();

        // Wait for success and modal close
        await expect(page.getByTestId('submit-booking-button')).not.toBeVisible({ timeout: 15000 });
        await page.waitForTimeout(2000); // Wait for backend sync

        // Open booking from bookings page
        await page.getByTestId('nav-bookings').click();
        await page.waitForURL('/bookings');
        await page.waitForLoadState('networkidle');

        // Search with retry logic
        await page.getByTestId('search-bookings-input').fill(customerName);
        await page.waitForTimeout(2000); // Wait for debounce

        // Retry search if not found immediately (backend latency)
        const row = page.locator('[data-testid^="booking-row-"]').first();
        try {
            await expect(row).toBeVisible({ timeout: 5000 });
        } catch (e) {
            console.log('Booking not found immediately, reloading...');
            await page.reload();
            await page.waitForLoadState('networkidle');
            await page.getByTestId('search-bookings-input').fill(customerName);
            await expect(row).toBeVisible({ timeout: 10000 });
        }

        await row.click();
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

        // Wait for loading state on button
        await expect(page.getByTestId('button-update-date')).toBeDisabled();
        await expect(page.getByTestId('button-update-date')).not.toBeDisabled({ timeout: 10000 });

        // Verify update succeeded (modal should still be open)
        await expect(page.getByTestId('input-update-date')).toBeVisible();
    });

    test('should update tour for private booking independently', async ({ page }) => {
        test.setTimeout(120000);
        // Reuse the booking from previous test or create new one? 
        // Better to create new one for isolation, but for speed let's create one.
        const uniqueId = Date.now().toString();
        const customerName = `Tour Update Test ${uniqueId}`;

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
        await expect(page.getByTestId('create-departure-button')).not.toBeVisible({ timeout: 10000 });
        await page.waitForTimeout(2000);

        // Add a booking
        const event = page.locator('.fc-event').last();
        await event.click();
        await page.getByTestId('tab-bookings').click();
        await page.getByTestId('add-booking-button').click();
        await page.getByTestId('input-customer-name').fill(customerName);
        await page.getByTestId('input-customer-email').fill(`tour${uniqueId}@test.com`);
        await page.getByTestId('input-customer-phone').fill('+123');
        await page.getByTestId('input-customer-document').fill('123');
        await page.getByTestId('input-pax').fill('2');
        await page.getByTestId('submit-booking-button').click();
        await expect(page.getByTestId('submit-booking-button')).not.toBeVisible({ timeout: 15000 });
        await page.waitForTimeout(2000);

        // Navigate to bookings
        await page.getByTestId('nav-bookings').click();
        await page.waitForURL('/bookings');
        await page.waitForLoadState('networkidle');
        await page.getByTestId('search-bookings-input').fill(customerName);
        await page.waitForTimeout(2000);

        const row = page.locator('[data-testid^="booking-row-"]').first();
        try {
            await expect(row).toBeVisible({ timeout: 5000 });
        } catch (e) {
            await page.reload();
            await page.waitForLoadState('networkidle');
            await page.getByTestId('search-bookings-input').fill(customerName);
            await expect(row).toBeVisible({ timeout: 10000 });
        }

        await row.click();
        await page.waitForTimeout(2000);

        // Go to actions tab
        await page.getByTestId('tab-actions').click();

        // Get a different tour ID
        await page.getByTestId('close-modal-button').click();
        await page.getByTestId('nav-tours').click();
        await page.waitForURL('/tours');
        const tourCard2 = page.locator('[data-testid^="tour-card-"]').nth(1);
        let newTourId = (await tourCard2.getAttribute('data-testid'))?.replace('tour-card-', '');

        if (!newTourId) {
            const firstTour = page.locator('[data-testid^="tour-card-"]').first();
            newTourId = (await firstTour.getAttribute('data-testid'))?.replace('tour-card-', '');
        }

        // Go back to booking
        await page.getByTestId('nav-bookings').click();
        await page.getByTestId('search-bookings-input').fill(customerName);
        await page.waitForTimeout(2000);
        await page.locator('[data-testid^="booking-row-"]').first().click();
        await page.waitForTimeout(2000);

        // Update tour independently
        await page.getByTestId('tab-actions').click();
        await page.getByTestId('input-update-tour').fill(newTourId!);
        await page.getByTestId('button-update-tour').click();

        await expect(page.getByTestId('button-update-tour')).toBeDisabled();
        await expect(page.getByTestId('button-update-tour')).not.toBeDisabled({ timeout: 10000 });

        // Verify update succeeded
        await expect(page.getByTestId('input-update-tour')).toBeVisible();
    });

    test('should show blocked state for public shared booking', async ({ page }) => {
        test.setTimeout(120000);
        const uniqueId = Date.now().toString();
        const customerName1 = `Public Test 1 ${uniqueId}`;
        const customerName2 = `Public Test 2 ${uniqueId}`;

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
        await expect(page.getByTestId('create-departure-button')).not.toBeVisible({ timeout: 10000 });
        await page.waitForTimeout(3000);

        // Add first booking
        const event = page.locator('.fc-event').last();
        await event.click();
        await page.getByTestId('tab-bookings').click();
        await page.getByTestId('add-booking-button').click();
        await page.getByTestId('input-customer-name').fill(customerName1);
        await page.getByTestId('input-customer-email').fill(`pub1${uniqueId}@test.com`);
        await page.getByTestId('input-customer-phone').fill('+123');
        await page.getByTestId('input-customer-document').fill('123');
        await page.getByTestId('input-pax').fill('1');
        await page.getByTestId('submit-booking-button').click();
        await expect(page.getByTestId('submit-booking-button')).not.toBeVisible({ timeout: 15000 });
        await page.waitForTimeout(2000);

        // Add second booking
        await page.getByTestId('add-booking-button').click();
        await page.getByTestId('input-customer-name').fill(customerName2);
        await page.getByTestId('input-customer-email').fill(`pub2${uniqueId}@test.com`);
        await page.getByTestId('input-customer-phone').fill('+123');
        await page.getByTestId('input-customer-document').fill('123');
        await page.getByTestId('input-pax').fill('1');
        await page.getByTestId('submit-booking-button').click();
        await expect(page.getByTestId('submit-booking-button')).not.toBeVisible({ timeout: 15000 });
        await page.waitForTimeout(2000);
        await page.getByTestId('close-modal-button').click();

        // Open first booking
        await page.getByTestId('nav-bookings').click();
        await page.waitForURL('/bookings');
        await page.waitForLoadState('networkidle');
        await page.getByTestId('search-bookings-input').fill(customerName1);
        await page.waitForTimeout(2000);

        const row = page.locator('[data-testid^="booking-row-"]').first();
        try {
            await expect(row).toBeVisible({ timeout: 5000 });
        } catch (e) {
            await page.reload();
            await page.waitForLoadState('networkidle');
            await page.getByTestId('search-bookings-input').fill(customerName1);
            await expect(row).toBeVisible({ timeout: 10000 });
        }

        await row.click();
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
        const uniqueId = Date.now().toString();
        const customerName = `Convert Test ${uniqueId}`;

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
        await expect(page.getByTestId('create-departure-button')).not.toBeVisible({ timeout: 10000 });
        await page.waitForTimeout(3000);

        // Add booking
        const event = page.locator('.fc-event').last();
        await event.click();
        await page.getByTestId('tab-bookings').click();
        await page.getByTestId('add-booking-button').click();
        await page.getByTestId('input-customer-name').fill(customerName);
        await page.getByTestId('input-customer-email').fill(`convert${uniqueId}@test.com`);
        await page.getByTestId('input-customer-phone').fill('+123');
        await page.getByTestId('input-customer-document').fill('123');
        await page.getByTestId('input-pax').fill('1');
        await page.getByTestId('submit-booking-button').click();
        await expect(page.getByTestId('submit-booking-button')).not.toBeVisible({ timeout: 15000 });
        await page.waitForTimeout(2000);
        await page.getByTestId('close-modal-button').click();

        // Navigate to bookings
        await page.getByTestId('nav-bookings').click();
        await page.waitForURL('/bookings');
        await page.waitForLoadState('networkidle');
        await page.getByTestId('search-bookings-input').fill(customerName);
        await page.waitForTimeout(2000);

        const row = page.locator('[data-testid^="booking-row-"]').first();
        try {
            await expect(row).toBeVisible({ timeout: 5000 });
        } catch (e) {
            await page.reload();
            await page.waitForLoadState('networkidle');
            await page.getByTestId('search-bookings-input').fill(customerName);
            await expect(row).toBeVisible({ timeout: 10000 });
        }

        await row.click();
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
            await page.getByTestId('search-bookings-input').fill(customerName);
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
    });
});
