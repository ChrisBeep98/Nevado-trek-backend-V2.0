import { test, expect } from '@playwright/test';

const ADMIN_KEY = 'ntk_admin_prod_key_2025_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7';

test.describe('Booking Logic Full Flow', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
        await page.getByTestId('login-input').fill(ADMIN_KEY);
        await page.getByTestId('login-button').click();
        await page.waitForURL('/');
    });

    test('should verify Private and Public Shared logic with fresh data', async ({ page }) => {
        // 1. Create a Test Tour (to ensure we have one)
        await page.getByTestId('nav-tours').click();
        await page.waitForURL('/tours');

        await page.waitForSelector('[data-testid^="tour-card-"]', { timeout: 10000 });
        const tourCard = page.locator('[data-testid^="tour-card-"]').first();
        const tourId = (await tourCard.getAttribute('data-testid'))?.replace('tour-card-', '');
        console.log('Using Tour ID:', tourId);

        // 2. Go to Departures (Calendar)
        await page.getByTestId('nav-home').click();
        await page.waitForURL('/');
        await page.waitForTimeout(2000); // Wait for calendar

        // 3. Create a PRIVATE Departure
        await page.getByTestId('new-departure-button').click();

        // Modal should open
        await expect(page.getByText('New Departure')).toBeVisible();

        // Fill Departure Form
        await page.getByTestId('input-date').fill(new Date().toISOString().split('T')[0]);
        await page.getByTestId('input-max-pax').fill('10');
        await page.getByTestId('select-type').selectOption('private');
        await page.getByTestId('input-price').fill('100000');
        await page.getByTestId('select-tour').selectOption(tourId!);

        await page.getByTestId('create-departure-button').click();

        // Wait for modal to close
        await expect(page.getByText('New Departure')).not.toBeVisible();

        // 4. Add Booking to this Private Departure
        // We need to find the departure we just created.
        await page.waitForTimeout(2000); // Wait for refetch

        // Find the event. It should be on the calendar.
        // Since we used today's date, it should be visible.
        // Click the LAST event (most recently added).
        const event = page.locator('.fc-event').last();
        await event.click();

        // Departure Modal Opens
        await expect(page.getByText('Departure Details')).toBeVisible();

        // Click "Bookings" tab first!
        await page.getByTestId('tab-bookings').click();

        await page.getByTestId('add-booking-button').click();

        // Booking Modal Opens
        await expect(page.getByText('New Booking')).toBeVisible();

        // Fill Booking Form
        await page.getByTestId('input-customer-name').fill('Private Logic Test');
        await page.getByTestId('input-customer-email').fill('private@test.com');
        await page.getByTestId('input-customer-phone').fill('+123');
        await page.getByTestId('input-customer-document').fill('123');
        await page.getByTestId('input-pax').fill('2');
        await page.getByTestId('submit-booking-button').click();

        // Wait for Booking Modal to close
        await expect(page.getByText('New Booking')).not.toBeVisible();

        // Close Departure Modal
        await page.getByTestId('close-modal-button').click(); // Or use X button

        // 5. Verify Private Logic
        await page.getByTestId('nav-bookings').click();
        await page.waitForURL('/bookings');
        await page.waitForTimeout(1000);

        // Search
        await page.getByTestId('search-bookings-input').fill('Private Logic Test');
        await page.waitForTimeout(1000);

        await page.locator('[data-testid^="booking-row-"]').first().click();

        // Check Logic
        await expect(page.getByTestId('booking-type-chip')).toContainText('Private');
        await page.getByTestId('tab-actions').click();
        await expect(page.getByTestId('input-move-date')).toBeVisible();

        await page.getByTestId('close-modal-button').click();

        // ---------------------------------------------------------

        // 6. Create PUBLIC Departure with 2 Bookings
        await page.getByTestId('nav-home').click();
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

        // Open Departure
        await page.locator('.fc-event').last().click();
        await expect(page.getByText('Departure Details')).toBeVisible();

        // Add Booking 1
        await page.getByTestId('tab-bookings').click();
        await page.getByTestId('add-booking-button').click();
        await page.getByTestId('input-customer-name').fill('Public Shared 1');
        await page.getByTestId('input-customer-email').fill('p1@test.com');
        await page.getByTestId('input-customer-phone').fill('+123');
        await page.getByTestId('input-customer-document').fill('123');
        await page.getByTestId('input-pax').fill('1');
        await page.getByTestId('submit-booking-button').click();
        await expect(page.getByText('New Booking')).not.toBeVisible();

        // Add Booking 2
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

        // 7. Verify Public Shared Logic
        await page.getByTestId('nav-bookings').click();
        await page.getByTestId('search-bookings-input').fill('Public Shared 1');
        await page.waitForTimeout(1000);

        await page.locator('[data-testid^="booking-row-"]').first().click();

        // Check Logic
        await expect(page.getByTestId('booking-type-chip')).toContainText('Public');
        await page.getByTestId('tab-actions').click();
        await expect(page.getByText('Change Date/Tour - Blocked')).toBeVisible();

    });
});
