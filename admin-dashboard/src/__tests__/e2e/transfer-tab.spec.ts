import { test, expect } from '@playwright/test';

test.describe('Transfer Tab', () => {
    test.beforeEach(async ({ page }) => {
        // Login
        await page.goto('http://localhost:5173');
        await page.fill('[data-testid="admin-key-input"]', 'nevadotrek2025');
        await page.click('[data-testid="login-button"]');
        await expect(page).toHaveURL('http://localhost:5173/', { timeout: 5000 });
    });

    test('should show Transfer tab for existing bookings', async ({ page }) => {
        // Navigate to calendar
        await page.waitForLoadState('networkidle');

        // Find and click a departure
        const departure = page.locator('[data-testid^="departure-card-"]').first();
        await departure.waitFor({ state: 'visible', timeout: 10000 });
        await departure.click();

        // Wait for modal
        await expect(page.locator('text=Departure Details')).toBeVisible({ timeout: 5000 });

        // Go to Bookings tab
        await page.click('[data-testid="tab-bookings"]');
        await page.waitForTimeout(500);

        // Click on a booking to edit
        const bookingRow = page.locator('[data-testid^="booking-row-"]').first();
        if (await bookingRow.isVisible()) {
            await bookingRow.click();

            // Wait for booking modal
            await page.waitForTimeout(1000);

            // Verify Transfer tab exists
            const transferTab = page.locator('[data-testid="tab-transfer"]');
            await expect(transferTab).toBeVisible();
        }
    });

    test('should allow private booking to join public departure', async ({ page }) => {
        // This test requires: 
        // 1. A private booking 
        // 2. Available public departures for the same tour

        // Navigate to calendar
        await page.waitForLoadState('networkidle');

        // Find a private departure (purple)
        const privateDeparture = page.locator('[data-testid^="departure-card-"]').filter({
            has: page.locator('.bg-purple-500\\/10')
        }).first();

        const isPrivateVisible = await privateDeparture.isVisible();
        if (isPrivateVisible) {
            await privateDeparture.click();
            await expect(page.locator('text=Departure Details')).toBeVisible();

            // Go to Bookings tab
            await page.click('[data-testid="tab-bookings"]');
            await page.waitForTimeout(500);

            // Click on the booking
            const bookingRow = page.locator('[data-testid^="booking-row-"]').first();
            await bookingRow.click();
            await page.waitForTimeout(1000);

            // Go to Transfer tab
            await page.click('[data-testid="tab-transfer"]');
            await page.waitForTimeout(500);

            // Verify warning appears
            await expect(page.locator('text=Join Public Departure')).toBeVisible();
            await expect(page.locator('text=Converting to public will move you to a shared group departure')).toBeVisible();

            // Check if there are available departures
            const select = page.locator('[data-testid="select-transfer-departure"]');
            if (await select.isVisible()) {
                // Select a departure
                await select.selectOption({ index: 1 });

                // Verify button is enabled
                const joinButton = page.locator('[data-testid="btn-join-public"]');
                await expect(joinButton).toBeEnabled();

                // Note: Not clicking to avoid actual transfer in test
                console.log('Transfer tab UI validated for private booking');
            } else {
                // No available departures
                await expect(page.locator('text=No available public departures')).toBeVisible();
            }
        }
    });

    test('should allow public booking to move to another departure', async ({ page }) => {
        // This test requires:
        // 1. A public booking
        // 2. Other available public departures for the same tour

        // Navigate to calendar
        await page.waitForLoadState('networkidle');

        // Find a public departure (blue)
        const publicDeparture = page.locator('[data-testid^="departure-card-"]').filter({
            has: page.locator('.bg-blue-500\\/10')
        }).first();

        if (await publicDeparture.isVisible()) {
            await publicDeparture.click();
            await expect(page.locator('text=Departure Details')).toBeVisible();

            // Go to Bookings tab
            await page.click('[data-testid="tab-bookings"]');
            await page.waitForTimeout(500);

            // Click on a booking
            const bookingRow = page.locator('[data-testid^="booking-row-"]').first();
            await bookingRow.click();
            await page.waitForTimeout(1000);

            // Go to Transfer tab
            await page.click('[data-testid="tab-transfer"]');
            await page.waitForTimeout(500);

            // Verify warning appears
            await expect(page.locator('text=Move to Another Departure')).toBeVisible();
            await expect(page.locator('text=This will remove you from the current group')).toBeVisible();

            // Verify current group is shown
            const currentGroup = page.locator('text=Current Group');
            if (await currentGroup.isVisible()) {
                console.log('Current group members displayed');
            }

            // Check if there are available departures
            const select = page.locator('[data-testid="select-transfer-departure"]');
            if (await select.isVisible()) {
                // Select a departure
                await select.selectOption({ index: 1 });

                // Verify button is enabled
                const moveButton = page.locator('[data-testid="btn-move-departure"]');
                await expect(moveButton).toBeEnabled();

                // Note: Not clicking to avoid actual transfer in test
                console.log('Transfer tab UI validated for public booking');
            } else {
                // No other available departures
                await expect(page.locator('text=No other available public departures')).toBeVisible();
            }
        }
    });

    test('should show appropriate message when no departures available', async ({ page }) => {
        // Navigate to calendar
        await page.waitForLoadState('networkidle');

        // Find any departure
        const departure = page.locator('[data-testid^="departure-card-"]').first();
        await departure.waitFor({ state: 'visible', timeout: 10000 });
        await departure.click();

        // Go to Bookings  tab
        await page.click('[data-testid="tab-bookings"]');
        await page.waitForTimeout(500);

        // Click on a booking
        const bookingRow = page.locator('[data-testid^="booking-row-"]').first();
        if (await bookingRow.isVisible()) {
            await bookingRow.click();
            await page.waitForTimeout(1000);

            // Go to Transfer tab
            await page.click('[data-testid="tab-transfer"]');
            await page.waitForTimeout(500);

            // One of these messages should be visible
            const noPrivateMsg = page.locator('text=No available public departures');
            const noPublicMsg = page.locator('text=No other available public departures');

            const hasMessage = (await noPrivateMsg.isVisible()) || (await noPublicMsg.isVisible());

            if (!hasMessage) {
                // Departures are available - verify select is visible
                await expect(page.locator('[data-testid="select-transfer-departure"]')).toBeVisible();
            }
        }
    });
});
