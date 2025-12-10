import { test, expect } from '@playwright/test';

const ADMIN_KEY = process.env.ADMIN_SECRET_KEY || '';

test.describe('Booking Logic Full Flow', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
        await page.getByTestId('login-input').fill(ADMIN_KEY);
        await page.getByTestId('login-button').click();
        await page.waitForURL('/');
    });

    test('should verify Private and Public Shared logic with fresh data', async ({ page }) => {
        test.setTimeout(120000);
        console.log('Starting test...');

        console.log('Step 1: Getting Tour ID');
        await page.getByTestId('nav-tours').click();
        await page.waitForURL('/tours');

        await page.waitForSelector('[data-testid^="tour-card-"]', { timeout: 10000 });
        const tourCard = page.locator('[data-testid^="tour-card-"]').first();
        const tourId = (await tourCard.getAttribute('data-testid'))?.replace('tour-card-', '');
        console.log('Using Tour ID:', tourId);

        console.log('Step 2: Going to Calendar');
        await page.goto('/');
        await page.waitForURL('/');
        await page.waitForTimeout(2000);

        console.log('Step 3: Creating PRIVATE Departure');
        const newDepBtn = page.getByTestId('new-departure-button');
        await expect(newDepBtn).toBeVisible({ timeout: 10000 });
        await newDepBtn.click();

        await expect(page.getByText('New Departure')).toBeVisible();

        await page.getByTestId('input-date').fill(new Date().toISOString().split('T')[0]);
        await page.getByTestId('input-max-pax').fill('10');
        await page.getByTestId('select-type').selectOption('private');
        await page.getByTestId('input-price').fill('100000');
        await page.getByTestId('select-tour').selectOption(tourId!);

        await page.getByTestId('create-departure-button').click();
        await expect(page.getByText('New Departure')).not.toBeVisible();
        console.log('Private Departure Created');

        console.log('Step 4: Adding Booking to Private Departure');
        await page.waitForTimeout(2000);

        const event = page.locator('.fc-event').last();
        await event.click();

        await expect(page.getByText('Departure Details')).toBeVisible();

        await page.getByTestId('tab-bookings').click();

        await page.getByTestId('add-booking-button').click();

        await expect(page.getByText('New Booking')).toBeVisible();

        await page.getByTestId('input-customer-name').fill('Private Logic Test');
        await page.getByTestId('input-customer-email').fill('private@test.com');
        await page.getByTestId('input-customer-phone').fill('+123');
        await page.getByTestId('input-customer-document').fill('123');
        await page.getByTestId('input-pax').fill('2');
        await page.getByTestId('submit-booking-button').click();

        await expect(page.getByText('New Booking')).not.toBeVisible();

        await page.getByTestId('close-modal-button').click();

        console.log('Step 5: Verifying Private Logic');
        await page.getByTestId('nav-bookings').click();
        await page.waitForURL('/bookings');
        await page.waitForTimeout(1000);

        await page.getByTestId('search-bookings-input').fill('Private Logic Test');
        await page.waitForTimeout(1000);

        await page.locator('[data-testid^="booking-row-"]').first().click();

        await expect(page.getByTestId('booking-type-chip')).toContainText('Private');
        await page.getByTestId('tab-actions').click();
        await expect(page.getByTestId('input-move-date')).toBeVisible();
        console.log('Private Logic Verified');

        await page.getByTestId('close-modal-button').click();

        // ---------------------------------------------------------

        console.log('Step 6: Creating PUBLIC Departure');
        await page.goto('/');
        await page.waitForURL('/');
        await page.waitForTimeout(1000);

        await page.getByTestId('new-departure-button').click();
        await expect(page.getByText('New Departure')).toBeVisible();

        await page.getByTestId('input-date').fill(new Date().toISOString().split('T')[0]);
        await page.getByTestId('input-max-pax').fill('10');
        await page.getByTestId('select-type').selectOption('public');
        await page.getByTestId('input-price').fill('50000');
        await page.getByTestId('select-tour').selectOption(tourId!);

        await page.getByTestId('create-departure-button').click();
        await expect(page.getByText('New Departure')).not.toBeVisible();
        await page.waitForTimeout(2000);

        console.log('Opening Public Departure');
        await page.locator('.fc-event').last().click();
        await expect(page.getByText('Departure Details')).toBeVisible();

        await page.getByTestId('tab-bookings').click();

        console.log('Adding Booking 1');
        await page.getByTestId('add-booking-button').click();
        await page.getByTestId('input-customer-name').fill('Public Shared 1');
        await page.getByTestId('input-customer-email').fill('p1@test.com');
        await page.getByTestId('input-customer-phone').fill('+123');
        await page.getByTestId('input-customer-document').fill('123');
        await page.getByTestId('input-pax').fill('1');
        await page.getByTestId('submit-booking-button').click();
        await expect(page.getByText('New Booking')).not.toBeVisible();

        console.log('Adding Booking 2');
        await page.waitForTimeout(500);
        await page.getByTestId('add-booking-button').click();
        await page.getByTestId('input-customer-name').fill('Public Shared 2');
        await page.getByTestId('input-customer-email').fill('p2@test.com');
        await page.getByTestId('input-customer-phone').fill('+123');
        await page.getByTestId('input-customer-document').fill('123');
        await page.getByTestId('input-pax').fill('1');
        await page.getByTestId('submit-booking-button').click();
        await expect(page.getByText('New Booking')).not.toBeVisible();

        await page.getByTestId('close-modal-button').click();

        console.log('Step 7: Verifying Public Shared Logic');
        await page.getByTestId('nav-bookings').click();
        await page.getByTestId('search-bookings-input').fill('Public Shared 1');
        await page.waitForTimeout(1000);

        await page.locator('[data-testid^="booking-row-"]').first().click();

        await expect(page.getByTestId('booking-type-chip')).toContainText('Public');
        await page.getByTestId('tab-actions').click();
        await expect(page.getByText('Change Date/Tour - Blocked')).toBeVisible();
        console.log('Public Shared Logic Verified');

    });
});
