import { test, expect } from '@playwright/test';

const ADMIN_KEY = 'ntk_admin_prod_key_2025_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7';

test.describe('Tours CRUD Operations', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
        await page.getByTestId('login-input').fill(ADMIN_KEY);
        await page.getByTestId('login-button').click();
        await page.waitForURL('/');

        // Navigate to tours
        await page.getByTestId('nav-tours').click();
        await page.waitForURL('/tours');
    });

    test('should create a new tour with complete data', async ({ page }) => {
        // Click new tour button
        await page.getByTestId('new-tour-button').click();

        // Wait for modal to open
        await expect(page.getByText('New Tour')).toBeVisible();

        // Fill in basic info
        await page.getByTestId('input-name-es').fill('Tour de Prueba E2E');
        await page.getByTestId('input-name-en').fill('E2E Test Tour');

        // Navigate to Details tab to fill location
        await page.getByRole('tab', { name: 'Details' }).click();
        await page.waitForTimeout(300);

        // Fill in location
        await page.getByTestId('input-location-es').fill('Nevado del Cocuy, Colombia');
        await page.getByTestId('input-location-en').fill('Nevado del Cocuy, Colombia');

        // Submit the form
        await page.getByTestId('submit-tour-button').click();

        // Wait for modal to close
        await expect(page.getByText('New Tour')).not.toBeVisible({ timeout: 10000 });

        // Verify the new tour appears in the list
        await expect(page.getByText('Tour de Prueba E2E')).toBeVisible({ timeout: 5000 });
    });

    test('should edit an existing tour', async ({ page }) => {
        // Wait for tours to load
        await page.waitForTimeout(2000);

        // Click on first tour card
        const firstTour = page.locator('[data-testid^="tour-card-"]').first();
        await firstTour.waitFor({ state: 'visible', timeout: 10000 });
        await firstTour.click();

        // Wait for modal
        await page.waitForTimeout(1000);

        // Modify the name
        const nameInput = page.getByTestId('input-name-es');
        await nameInput.waitFor({ state: 'visible' });
        await nameInput.click();
        await nameInput.fill('Tour Editado E2E');

        // Save changes
        await page.getByTestId('submit-tour-button').click();

        // Wait for modal to close
        await page.waitForTimeout(2000);

        // Verify the edited name appears
        await expect(page.getByText('Tour Editado E2E')).toBeVisible({ timeout: 5000 });
    });
});

test.describe('Booking CRUD Operations', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
        await page.getByTestId('login-input').fill(ADMIN_KEY);
        await page.getByTestId('login-button').click();
        await page.waitForURL('/');

        // Navigate to bookings
        await page.getByTestId('nav-bookings').click();
        await page.waitForURL('/bookings');
    });

    test('should edit existing booking details', async ({ page }) => {
        // Wait for bookings to load
        await page.waitForTimeout(2000);

        // Click on first booking
        const firstBooking = page.locator('[data-testid^="booking-row-"]').first();
        await firstBooking.waitFor({ state: 'visible', timeout: 10000 });
        await firstBooking.click();

        // Wait for modal
        await expect(page.getByText('Manage Booking')).toBeVisible({ timeout: 5000 });

        // Edit customer name
        const nameInput = page.getByTestId('input-customer-name');
        await nameInput.waitFor({ state: 'visible' });
        await nameInput.click();
        await nameInput.fill('Cliente Editado E2E');

        // Edit pax count
        const paxInput = page.getByTestId('input-pax');
        await paxInput.click();
        await paxInput.fill('4');

        // Save changes
        await page.getByTestId('submit-booking-button').click();

        // Wait for modal to close
        await page.waitForTimeout(2000);

        // Reopen to verify changes persisted
        await page.locator('[data-testid^="booking-row-"]').first().click();
        await expect(page.getByTestId('input-customer-name')).toHaveValue('Cliente Editado E2E');
        await expect(page.getByTestId('input-pax')).toHaveValue('4');
    });

    test('should change booking status', async ({ page }) => {
        // Click on first booking
        const firstBooking = page.locator('[data-testid^="booking-row-"]').first();
        await firstBooking.waitFor({ state: 'visible', timeout: 10000 });
        await firstBooking.click();

        // Wait for modal
        await expect(page.getByText('Manage Booking')).toBeVisible();

        // Go to status tab
        await page.getByTestId('tab-status').click();
        await page.waitForTimeout(500);

        // Change status to confirmed
        await page.getByTestId('status-button-confirmed').click();
        await page.waitForTimeout(1500);

        // Close modal
        await page.getByTestId('close-modal-button').click();
        await page.waitForTimeout(1000);

        // Reopen and verify status changed
        await page.locator('[data-testid^="booking-row-"]').first().click();
        await page.getByTestId('tab-status').click();
        await expect(page.getByTestId('status-button-confirmed')).toHaveClass(/indigo-500/);
    });

    test('should apply discount to booking', async ({ page }) => {
        // Click on first booking
        const firstBooking = page.locator('[data-testid^="booking-row-"]').first();
        await firstBooking.waitFor({ state: 'visible', timeout: 10000 });

        // Get original price from table
        const priceCell = await firstBooking.locator('td').nth(2).textContent();

        await firstBooking.click();

        // Wait for modal
        await expect(page.getByText('Manage Booking')).toBeVisible();

        // Go to actions tab
        await page.getByTestId('tab-actions').click();
        await page.waitForTimeout(500);

        // Apply discount
        await page.getByTestId('input-discount-amount').fill('50000');
        await page.getByTestId('input-discount-reason').fill('E2E Test Discount');
        await page.getByTestId('apply-discount-button').click();

        await page.waitForTimeout(2000);

        // Close modal
        await page.getByTestId('close-modal-button').click();
        await page.waitForTimeout(1000);

        // Verify price changed in table
        const newPriceCell = await page.locator('[data-testid^="booking-row-"]').first().locator('td').nth(2).textContent();
        expect(newPriceCell).not.toBe(priceCell);
    });

    test('should filter bookings by status', async ({ page }) => {
        // Wait for bookings to load
        await page.waitForTimeout(2000);

        // Count total bookings
        const totalRows = await page.locator('[data-testid^="booking-row-"]').count();

        // Filter by confirmed
        await page.getByTestId('status-filter-select').selectOption('confirmed');
        await page.waitForTimeout(1000);

        // Count filtered bookings
        const filteredRows = await page.locator('[data-testid^="booking-row-"]').count();

        // Should have fewer rows (unless all are confirmed)
        expect(filteredRows).toBeLessThanOrEqual(totalRows);

        // All visible rows should show CONFIRMED status
        const statusBadges = await page.locator('[data-testid^="booking-row-"]').allTextContents();
        statusBadges.forEach(row => {
            if (row.includes('PENDING') || row.includes('PAID') || row.includes('CANCELLED')) {
                throw new Error('Found non-confirmed booking in filtered results');
            }
        });
    });

    test('should search bookings by customer name', async ({ page }) => {
        // Wait for bookings to load
        await page.waitForTimeout(2000);

        // Get first customer name
        const firstRow = page.locator('[data-testid^="booking-row-"]').first();
        const customerName = await firstRow.locator('td').first().locator('div').first().textContent();

        // Search for first word of customer name
        const searchTerm = customerName?.split(' ')[0] || 'Test';
        await page.getByTestId('search-bookings-input').fill(searchTerm);
        await page.waitForTimeout(1000);

        // All visible rows should contain the search term
        const visibleRows = await page.locator('[data-testid^="booking-row-"]').allTextContents();
        visibleRows.forEach(row => {
            expect(row.toLowerCase()).toContain(searchTerm.toLowerCase());
        });
    });
});

test.describe('Departure Operations', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
        await page.getByTestId('login-input').fill(ADMIN_KEY);
        await page.getByTestId('login-button').click();
        await page.waitForURL('/');
    });

    test('should edit departure details', async ({ page }) => {
        // Wait for calendar to load
        await page.waitForSelector('.fc-view', { timeout: 10000 });

        // Click on first event
        const firstEvent = page.locator('[data-testid^="event-"]').first();
        await firstEvent.waitFor({ state: 'visible', timeout: 10000 });
        await firstEvent.click();

        // Wait for modal
        await page.waitForTimeout(1500);

        // Edit max pax
        const maxPaxInput = page.getByTestId('input-max-pax');
        if (await maxPaxInput.count() > 0) {
            await maxPaxInput.fill('10');

            // Save
            await page.getByTestId('save-departure-button').click();
            await page.waitForTimeout(2000);

            // Reopen to verify
            await firstEvent.click();
            await page.waitForTimeout(1000);
            await expect(page.getByTestId('input-max-pax')).toHaveValue('10');
        }
    });
});
