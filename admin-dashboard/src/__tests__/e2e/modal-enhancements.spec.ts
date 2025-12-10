import { test, expect } from '@playwright/test';

const ADMIN_KEY = process.env.ADMIN_SECRET_KEY || '';

test.describe('Departure Modal - Convert to Public', () => {
    test.beforeEach(async ({ page }) => {
        // Login
        await page.goto('/login');
        await page.getByTestId('login-input').fill(ADMIN_KEY);
        await page.getByTestId('login-button').click();
        await page.waitForURL('/');
        await page.waitForLoadState('networkidle');
    });

    test('should show Convert to Public for private departures', async ({ page }) => {
        // Navigate to calendar
        await page.waitForSelector('[data-testid^="event-"]', { timeout: 10000 });

        // Find and click on a private departure event
        const events = await page.locator('[data-testid^="event-"]').all();

        let privateDepartureFound = false;
        for (const event of events) {
            await event.click();
            await page.waitForTimeout(500);

            // Check if this is a private departure
            const typeChip = page.locator('text=PRIVATE');
            if (await typeChip.isVisible()) {
                privateDepartureFound = true;

                // Go to Tools tab
                await page.getByTestId('tab-tools').click();

                // Check that Convert to Public button exists
                const convertButton = page.getByTestId('convert-to-public-button');
                await expect(convertButton).toBeVisible();
                await expect(convertButton).toContainText('Convert to Public');

                break;
            }
        }

        if (!privateDepartureFound) {
            console.log('No private departure found, skipping test');
        }
    });

    test('should NOT show Convert to Public for public departures', async ({ page }) => {
        await page.waitForSelector('[data-testid^="event-"]', { timeout: 10000 });

        const events = await page.locator('[data-testid^="event-"]').all();

        let publicDepartureFound = false;
        for (const event of events) {
            await event.click();
            await page.waitForTimeout(500);

            // Check if this is a public departure
            const typeChip = page.locator('text=PUBLIC');
            if (await typeChip.isVisible()) {
                publicDepartureFound = true;

                // Go to Tools tab
                await page.getByTestId('tab-tools').click();

                // Convert to Public button should NOT be visible
                const convertButton = page.getByTestId('convert-to-public-button');
                await expect(convertButton).not.toBeVisible();

                break;
            }
        }

        if (!publicDepartureFound) {
            console.log('No public departure found, test passed by default');
        }
    });
});

test.describe('Booking Modal - Cancellation Warning', () => {
    test.beforeEach(async ({ page }) => {
        // Login
        await page.goto('/login');
        await page.getByTestId('login-input').fill(ADMIN_KEY);
        await page.getByTestId('login-button').click();
        await page.waitForURL('/');

        // Navigate to bookings page
        await page.getByTestId('nav-bookings').click();
        await page.waitForURL('/bookings');
        await page.waitForTimeout(1500);
    });

    test('should show warning when cancelling booking', async ({ page }) => {
        // Wait for bookings to load
        await page.waitForSelector('[data-testid^="booking-row-"]', { timeout: 10000 });

        const bookings = await page.locator('[data-testid^="booking-row-"]').all();

        if (bookings.length > 0) {
            // Click first booking
            await bookings[0].click();

            // Wait for modal to open
            await expect(page.locator('text=Manage Booking')).toBeVisible();

            // Go to Status tab
            await page.getByTestId('tab-status').click();

            // Setup dialog handler to capture the warning
            let dialogMessage = '';
            page.on('dialog', async dialog => {
                dialogMessage = dialog.message();
                await dialog.dismiss(); // Don't proceed with cancellation in test
            });

            // Select cancelled status
            const statusSelect = page.getByTestId('status-select');
            await statusSelect.selectOption('cancelled');

            // Wait a bit for dialog to appear
            await page.waitForTimeout(500);

            // Verify warning message contains key words
            expect(dialogMessage).toContain('WARNING');
            expect(dialogMessage).toContain('IRREVERSIBLE');
            expect(dialogMessage).toContain('cannot be reactivated');
        }
    });

    test('should NOT show warning when changing to other statuses', async ({ page }) => {
        await page.waitForSelector('[data-testid^="booking-row-"]', { timeout: 10000 });

        const bookings = await page.locator('[data-testid^="booking-row-"]').all();

        if (bookings.length > 0) {
            await bookings[0].click();
            await expect(page.locator('text=Manage Booking')).toBeVisible();
            await page.getByTestId('tab-status').click();

            let dialogAppeared = false;
            page.on('dialog', async dialog => {
                dialogAppeared = true;
                await dialog.accept();
            });

            // Try changing to confirmed (should not show dialog)
            const statusSelect = page.getByTestId('status-select');
            await statusSelect.selectOption('confirmed');
            await page.waitForTimeout(500);

            // No dialog should have appeared
            expect(dialogAppeared).toBe(false);
        }
    });
});
