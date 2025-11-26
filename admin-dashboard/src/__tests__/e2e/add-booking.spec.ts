import { test, expect } from '@playwright/test';

const ADMIN_KEY = 'ntk_admin_prod_key_2025_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7';

test.describe('Add Booking to Existing Departure', () => {
    test.beforeEach(async ({ page }) => {
        // Login
        await page.goto('/login');
        await page.getByTestId('login-input').fill(ADMIN_KEY);
        await page.getByTestId('login-button').click();
        await page.waitForURL('/');
        await page.waitForLoadState('networkidle');
    });

    test('should open BookingModal when clicking "+ Add Booking" button', async ({ page }) => {
        // Navigate to calendar and click on a departure
        await page.waitForSelector('[data-testid^="event-"]', { timeout: 10000 });

        const firstEvent = page.locator('[data-testid^="event-"]').first();
        await firstEvent.click();

        // Wait for DepartureModal to open
        await expect(page.locator('text=Departure Details')).toBeVisible();

        // Go to Bookings tab
        await page.getByTestId('tab-bookings').click();

        // Click "+ Add Booking" button
        const addBookingBtn = page.locator('button:has-text("+ Add Booking")');
        await expect(addBookingBtn).toBeVisible();
        await addBookingBtn.click();

        // Verify BookingModal opens with "New Booking" title
        await expect(page.locator('text=New Booking')).toBeVisible();

        // Verify context section shows departure info
        await expect(page.getByTestId('booking-context-tour')).toBeVisible();
        await expect(page.getByTestId('booking-context-date')).toBeVisible();
        await expect(page.getByTestId('booking-context-type')).toBeVisible();
    });

    test('should create booking successfully with valid data', async ({ page }) => {
        // Open a public departure with available capacity
        await page.waitForSelector('[data-testid^="event-"]', { timeout: 10000 });

        const events = await page.locator('[data-testid^="event-"]').all();

        for (const event of events) {
            await event.click();
            await page.waitForTimeout(500);

            // Look for a public departure
            const typeChip = page.locator('text=PUBLIC');
            if (await typeChip.isVisible()) {
                // Go to Bookings tab and click Add Booking
                await page.getByTestId('tab-bookings').click();
                await page.locator('button:has-text("+ Add Booking")').click();

                // Fill in customer info
                await page.getByTestId('input-customer-name').fill('Test Customer E2E');
                await page.getByTestId('input-customer-email').fill('test-e2e@example.com');
                await page.getByTestId('input-customer-phone').fill('+1234567890');
                await page.getByTestId('input-customer-document').fill('TEST12345');

                // Set pax to 1
                await page.getByTestId('input-pax').fill('1');

                // Submit
                const submitBtn = page.locator('button[type="submit"]:has-text("Create Booking")');
                await submitBtn.click();

                // Wait for modal to close
                await expect(page.locator('text=New Booking')).not.toBeVisible({ timeout: 5000 });

                // Verify we're back at DepartureModal or it refreshed
                await page.waitForTimeout(1000);

                break;
            } else {
                // Close and try next
                const closeBtn = page.locator('button[aria-label="Close"]').first();
                if (await closeBtn.isVisible()) await closeBtn.click();
                await page.waitForTimeout(300);
            }
        }
    });

    test('should show capacity error when trying to add more pax than available', async ({ page }) => {
        // Look for a nearly full departure  
        await page.waitForSelector('[data-testid^="event-"]', { timeout: 10000 });

        const events = await page.locator('[data-testid^="event-"]').all();

        for (const event of events) {
            await event.click();
            await page.waitForTimeout(500);

            const typeChip = page.locator('text=PUBLIC');
            if (await typeChip.isVisible()) {
                // Check capacity
                const capacityText = await page.getByTestId('booking-context-capacity').textContent();

                if (capacityText) {
                    // Extract current/max from "3/8 pax" format
                    const match = capacityText.match(/(\d+)\/(\d+)/);
                    if (match) {
                        const current = parseInt(match[1]);
                        const max = parseInt(match[2]);
                        const available = max - current;

                        if (available < 8) { // If less than full capacity
                            // Try to add more pax than available
                            await page.getByTestId('tab-bookings').click();
                            await page.locator('button:has-text("+ Add Booking")').click();

                            // Fill customer info
                            await page.getByTestId('input-customer-name').fill('Capacity Test');
                            await page.getByTestId('input-customer-email').fill('capacity@test.com');
                            await page.getByTestId('input-customer-phone').fill('+9999999999');
                            await page.getByTestId('input-customer-document').fill('CAP123');

                            // Try to add MORE than available
                            const excessivePax = available + 1;
                            await page.getByTestId('input-pax').fill(excessivePax.toString());

                            // Setup dialog handler
                            let dialogMessage = '';
                            page.on('dialog', async dialog => {
                                dialogMessage = dialog.message();
                                await dialog.accept();
                            });

                            // Submit
                            const submitBtn = page.locator('button[type="submit"]:has-text("Create Booking")');
                            await submitBtn.click();

                            await page.waitForTimeout(500);

                            // Verify error message
                            expect(dialogMessage).toContain('Cannot add');
                            expect(dialogMessage).toContain('space');

                            break;
                        }
                    }
                }
            }

            // Close and try next
            const closeBtn = page.locator('button[aria-label="Close"]').first();
            if (await closeBtn.isVisible()) await closeBtn.click();
            await page.waitForTimeout(300);
        }
    });
});
