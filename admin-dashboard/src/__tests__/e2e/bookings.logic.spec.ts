import { test, expect } from '@playwright/test';

const ADMIN_KEY = process.env.ADMIN_SECRET_KEY || '';

test.describe('Booking Logic Scenarios', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
        await page.getByTestId('login-input').fill(ADMIN_KEY);
        await page.getByTestId('login-button').click();
        await page.waitForURL('/');
        await page.getByTestId('nav-bookings').click();
        await page.waitForURL('/bookings');
        await page.waitForTimeout(2000); // Wait for grid to load
    });

    test('should correctly handle Private vs Public Shared logic', async ({ page }) => {
        await page.waitForSelector('[data-testid^="booking-row-"]', { timeout: 10000 });
        const rows = page.locator('[data-testid^="booking-row-"]');
        const count = await rows.count();

        console.log(`Found ${count} bookings to scan.`);

        let verifiedPrivateOrSolo = false;
        let verifiedPublicShared = false;

        // Scan up to 15 rows to find examples
        for (let i = 0; i < Math.min(count, 15); i++) {
            console.log(`Checking row ${i}...`);
            await rows.nth(i).click();

            // Wait for modal
            await expect(page.getByText('Manage Booking')).toBeVisible();
            await expect(page.locator('.animate-spin')).not.toBeVisible({ timeout: 10000 });

            // Wait a moment for departure data to load
            await page.waitForTimeout(1000);

            // Check Type Chip
            const typeChip = page.getByTestId('booking-type-chip');

            if (await typeChip.isVisible()) {
                const typeText = await typeChip.textContent();
                const isPrivateType = typeText?.toLowerCase().includes('private');

                // Check Context for "Other bookings" (Shared Public)
                const hasOtherBookings = await page.getByText('Other bookings in this departure').isVisible();

                console.log(`Row ${i}: Type=${typeText}, HasOthers=${hasOtherBookings}`);

                // Go to Actions Tab
                await page.getByTestId('tab-actions').click();

                if (isPrivateType || !hasOtherBookings) {
                    // Scenario: Private OR Solo Public -> Should ALLOW Move
                    if (!verifiedPrivateOrSolo) {
                        console.log('Verifying Private/Solo Logic...');
                        await expect(page.getByTestId('input-move-date')).toBeVisible();
                        await expect(page.getByTestId('input-move-tour-id')).toBeVisible();
                        await expect(page.getByTestId('move-booking-button')).toBeVisible();
                        verifiedPrivateOrSolo = true;
                    }
                } else {
                    // Scenario: Public Shared -> Should BLOCK Move
                    if (!verifiedPublicShared) {
                        console.log('Verifying Public Shared Logic...');
                        await expect(page.getByText('Change Date/Tour - Blocked')).toBeVisible();
                        await expect(page.getByTestId('inline-convert-private-button')).toBeVisible();
                        verifiedPublicShared = true;
                    }
                }
            } else {
                console.log(`Row ${i}: Skipped - No departure data (Type Chip not visible)`);
            }

            await page.getByTestId('close-modal-button').click();

            if (verifiedPrivateOrSolo && verifiedPublicShared) {
                console.log('Both scenarios verified!');
                break;
            }
        }

        if (!verifiedPrivateOrSolo && !verifiedPublicShared) {
            throw new Error('Could not find any valid bookings to verify logic!');
        } else {
            console.log(`Verification Summary: Private/Solo=${verifiedPrivateOrSolo}, PublicShared=${verifiedPublicShared}`);
        }
    });
});
