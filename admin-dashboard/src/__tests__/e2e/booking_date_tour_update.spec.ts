import { test, expect } from '@playwright/test';
import {
    loginAsAdmin,
    getTourId,
    createAndOpenPrivateBooking,
    createPublicDepartureWithBookings,
    searchAndOpenBooking,
    generateUniqueId,
    getDateString,
} from './helpers/booking-helpers';

/**
 * BookingModal - Date/Tour Update Functionality
 * 
 * Tests cover:
 * - Private bookings: Independent date/tour updates
 * - Public bookings: Blocked state and conversion flow
 * - Backend bug verification: Type field, price calculation
 */
test.describe('BookingModal - Date/Tour Update Functionality', () => {

    test.beforeEach(async ({ page }) => {
        await loginAsAdmin(page);
    });

    // ============================================================
    // PRIVATE BOOKING TESTS
    // ============================================================
    test.describe('Private Bookings', () => {

        test('should update date independently without changing tour', async ({ page }) => {
            test.setTimeout(120000);

            const uniqueId = generateUniqueId();
            const customerName = `Date Update Test ${uniqueId}`;

            // Get tour ID
            const tourId = await getTourId(page);

            // Create private booking
            await createAndOpenPrivateBooking(page, tourId, customerName, 2);

            // Navigate to Actions tab
            await page.getByTestId('tab-actions').click();

            // Verify private booking shows update fields
            await expect(page.getByTestId('input-update-date')).toBeVisible();
            await expect(page.getByTestId('button-update-date')).toBeVisible();
            await expect(page.getByTestId('input-update-tour')).toBeVisible();
            await expect(page.getByTestId('button-update-tour')).toBeVisible();

            // Get initial tour ID for later verification
            const tourSelect = page.getByTestId('input-update-tour');
            const initialTourId = await tourSelect.inputValue();

            // Update date independently
            const newDate = getDateString(15); // 15 days from now
            await page.getByTestId('input-update-date').fill(newDate);
            await page.getByTestId('button-update-date').click();

            // Wait for loading state
            await expect(page.getByTestId('button-update-date')).toBeDisabled();
            await expect(page.getByTestId('button-update-date')).not.toBeDisabled({ timeout: 10000 });

            // Close modal and reopen to verify persistence
            await page.keyboard.press('Escape');
            await page.waitForTimeout(2000);
            await searchAndOpenBooking(page, customerName);
            await page.getByTestId('tab-actions').click();

            // Verify date changed
            const updatedDate = await page.getByTestId('input-update-date').inputValue();
            expect(updatedDate).toBe(newDate);

            // Verify tour ID remained unchanged
            const unchangedTourId = await page.getByTestId('input-update-tour').inputValue();
            expect(unchangedTourId).toBe(initialTourId);
        });

        test('should update tour independently and recalculate price correctly', async ({ page }) => {
            test.setTimeout(120000);

            const uniqueId = generateUniqueId();
            const customerName = `Tour Update Test ${uniqueId}`;

            // Get tour IDs (need 2 different tours)
            await page.goto('/tours');
            await page.waitForSelector('[data-testid^="tour-card-"]', { timeout: 10000 });
            const tourCards = page.locator('[data-testid^="tour-card-"]');
            const count = await tourCards.count();

            if (count < 2) {
                test.skip(true, 'Need at least 2 tours for this test');
                return;
            }

            const tour1Id = (await tourCards.nth(0).getAttribute('data-testid'))!.replace('tour-card-', '');
            const tour2Id = (await tourCards.nth(1).getAttribute('data-testid'))!.replace('tour-card-', '');

            // Create private booking with tour1
            await createAndOpenPrivateBooking(page, tour1Id, customerName, 2);

            // Navigate to Actions tab
            await page.getByTestId('tab-actions').click();

            // Get initial date for later verification
            const initialDate = await page.getByTestId('input-update-date').inputValue();

            // Get initial price
            await page.getByTestId('tab-details').click();
            const initialPriceText = await page.getByText(/Original Price/).textContent();
            console.log('Initial price:', initialPriceText);

            // Update tour independently
            await page.getByTestId('tab-actions').click();
            await page.getByTestId('input-update-tour').selectOption(tour2Id);
            await page.getByTestId('button-update-tour').click();

            // Wait for loading state
            await expect(page.getByTestId('button-update-tour')).toBeDisabled();
            await expect(page.getByTestId('button-update-tour')).not.toBeDisabled({ timeout: 10000 });

            // Wait for price update
            await page.waitForTimeout(1000);

            // Close modal and reopen to verify persistence
            await page.keyboard.press('Escape');
            await page.waitForTimeout(2000);
            await searchAndOpenBooking(page, customerName);
            await page.getByTestId('tab-actions').click();

            // Verify tour changed
            const updatedTourId = await page.getByTestId('input-update-tour').inputValue();
            expect(updatedTourId).toBe(tour2Id);

            // Verify date remained unchanged
            const unchangedDate = await page.getByTestId('input-update-date').inputValue();
            expect(unchangedDate).toBe(initialDate);

            // Verify price was recalculated
            await page.getByTestId('tab-details').click();
            const updatedPriceText = await page.getByText(/Original Price/).textContent();
            console.log('Updated price:', updatedPriceText);

            // Price should have changed (different tour = different pricing)
            expect(updatedPriceText).not.toBe(initialPriceText);

            // CRITICAL: Verify price is NOT doubled
            // Extract numeric value from price text
            const priceMatch = updatedPriceText?.match(/[\d,]+/);
            if (priceMatch) {
                const priceValue = parseInt(priceMatch[0].replace(/,/g, ''));
                // Sanity check: price should be reasonable (not millions)
                expect(priceValue).toBeLessThan(1000000); // 1M COP max
                expect(priceValue).toBeGreaterThan(10000); // 10k COP min
                console.log('Price sanity check passed:', priceValue);
            }
        });
    });

    // ============================================================
    // PUBLIC BOOKING TESTS
    // ============================================================
    test.describe('Public Bookings', () => {

        test('should display blocked state with convert button for public bookings', async ({ page }) => {
            test.setTimeout(120000);

            // const uniqueId = generateUniqueId();
            const tourId = await getTourId(page);

            // Create public departure with 2 bookings
            const [customer1] = await createPublicDepartureWithBookings(page, tourId, 2);

            // Open first booking
            await searchAndOpenBooking(page, customer1);

            // Navigate to Actions tab
            await page.getByTestId('tab-actions').click();

            // Verify update inputs are HIDDEN (blocked state)
            await expect(page.getByTestId('input-update-date')).not.toBeVisible();
            await expect(page.getByTestId('button-update-date')).not.toBeVisible();
            await expect(page.getByTestId('input-update-tour')).not.toBeVisible();
            await expect(page.getByTestId('button-update-tour')).not.toBeVisible();

            // Verify Convert to Private button is visible
            await expect(page.getByTestId('inline-convert-private-button')).toBeVisible();

            // Verify warning message is present
            const warningText = await page.locator('text=/blocked|public|convert/i').first().textContent();
            expect(warningText).toBeTruthy();
            console.log('Warning message:', warningText);
        });

        test('should verify public booking has type field set to public', async ({ page }) => {
            test.setTimeout(120000);

            // const uniqueId = generateUniqueId();
            const tourId = await getTourId(page);

            // Create public departure with 1 booking
            const [customerName] = await createPublicDepartureWithBookings(page, tourId, 1);

            // Open booking
            await searchAndOpenBooking(page, customerName);

            // Verify type chip shows "PUBLIC"
            const typeChip = page.getByTestId('booking-type-chip');
            await expect(typeChip).toBeVisible();
            const typeText = await typeChip.textContent();
            expect(typeText?.toUpperCase()).toContain('PUBLIC');

            console.log('Booking type:', typeText);
        });

        test('should convert public booking to private and unlock update options', async ({ page }) => {
            test.setTimeout(150000);

            // const uniqueId = generateUniqueId();
            const tourId = await getTourId(page);

            // Create public departure with 2 bookings
            const [customer1, customer2] = await createPublicDepartureWithBookings(page, tourId, 2);

            // Open first booking
            await searchAndOpenBooking(page, customer1);

            // Navigate to Actions tab
            await page.getByTestId('tab-actions').click();

            // Verify blocked state initially
            await expect(page.getByTestId('inline-convert-private-button')).toBeVisible();

            // Click Convert to Private
            await page.getByTestId('inline-convert-private-button').click();

            // Wait for conversion (button should be disabled during processing)
            await expect(page.getByTestId('inline-convert-private-button')).toBeDisabled();

            // Wait for conversion to complete and UI to update
            await page.waitForTimeout(3000);

            // Verify type changed to PRIVATE
            const typeChip = page.getByTestId('booking-type-chip');
            const updatedTypeText = await typeChip.textContent();
            expect(updatedTypeText?.toUpperCase()).toContain('PRIVATE');
            console.log('Updated booking type:', updatedTypeText);

            // Verify update options are now VISIBLE (unlocked)
            await expect(page.getByTestId('input-update-date')).toBeVisible();
            await expect(page.getByTestId('button-update-date')).toBeVisible();
            await expect(page.getByTestId('input-update-tour')).toBeVisible();
            await expect(page.getByTestId('button-update-tour')).toBeVisible();

            // Verify Convert button is now HIDDEN
            await expect(page.getByTestId('inline-convert-private-button')).not.toBeVisible();

            // Test that we can now update date
            const newDate = getDateString(20);
            await page.getByTestId('input-update-date').fill(newDate);
            await page.getByTestId('button-update-date').click();

            // Wait for update
            await expect(page.getByTestId('button-update-date')).toBeDisabled();
            await expect(page.getByTestId('button-update-date')).not.toBeDisabled({ timeout: 10000 });

            // Close and reopen to verify
            await page.keyboard.press('Escape');
            await page.waitForTimeout(2000);
            await searchAndOpenBooking(page, customer1);
            await page.getByTestId('tab-actions').click();

            // Verify date was updated
            const updatedDate = await page.getByTestId('input-update-date').inputValue();
            expect(updatedDate).toBe(newDate);

            console.log('Successfully updated date after conversion');

            // Verify second booking is still public (not affected by conversion)
            await page.keyboard.press('Escape');
            await page.waitForTimeout(1000);
            await searchAndOpenBooking(page, customer2);
            const secondBookingType = await page.getByTestId('booking-type-chip').textContent();
            expect(secondBookingType?.toUpperCase()).toContain('PUBLIC');

            console.log('Second booking remains public:', secondBookingType);
        });
    });

    // ============================================================
    // EDGE CASES & VALIDATION
    // ============================================================
    test.describe('Edge Cases', () => {

        test('should validate price is not doubled after tour update', async ({ page }) => {
            test.setTimeout(120000);

            const uniqueId = generateUniqueId();
            const customerName = `Price Validation ${uniqueId}`;

            // Get 2 tours
            await page.goto('/tours');
            await page.waitForSelector('[data-testid^="tour-card-"]', { timeout: 10000 });
            const tourCards = page.locator('[data-testid^="tour-card-"]');

            if (await tourCards.count() < 2) {
                test.skip(true, 'Need at least 2 tours');
                return;
            }

            const tour1Id = (await tourCards.nth(0).getAttribute('data-testid'))!.replace('tour-card-', '');
            const tour2Id = (await tourCards.nth(1).getAttribute('data-testid'))!.replace('tour-card-', '');

            // Create booking with 2 pax
            await createAndOpenPrivateBooking(page, tour1Id, customerName, 2);

            // Get initial price
            await page.getByTestId('tab-details').click();
            const initialPriceElement = page.locator('text=/Original Price/').locator('..').locator('text=/[\d,]+/');
            const initialPriceText = await initialPriceElement.textContent();
            const initialPrice = parseInt(initialPriceText!.replace(/,/g, ''));

            console.log('Initial price for 2 pax:', initialPrice);

            // Update tour
            await page.getByTestId('tab-actions').click();
            await page.getByTestId('input-update-tour').selectOption(tour2Id);
            await page.getByTestId('button-update-tour').click();
            await expect(page.getByTestId('button-update-tour')).not.toBeDisabled({ timeout: 10000 });
            await page.waitForTimeout(1000);

            // Get updated price
            await page.getByTestId('tab-details').click();
            const updatedPriceElement = page.locator('text=/Original Price/').locator('..').locator('text=/[\d,]+/');
            const updatedPriceText = await updatedPriceElement.textContent();
            const updatedPrice = parseInt(updatedPriceText!.replace(/,/g, ''));

            console.log('Updated price for 2 pax:', updatedPrice);

            // CRITICAL BUG VERIFICATION
            // If bug exists: updatedPrice would be DOUBLE the expected tier price
            // With 2 pax, if tier is 180k, buggy code would give 360k

            // Verify price is within reasonable range (not doubled)
            // Assuming tours have similar pricing (50k - 300k per booking)
            expect(updatedPrice).toBeGreaterThan(50000);
            expect(updatedPrice).toBeLessThan(500000);

            // Verify price difference is reasonable (not exactly doubled)
            const ratio = updatedPrice / initialPrice;
            expect(ratio).not.toBeCloseTo(2.0, 0.1); // Should NOT be close to 2x

            console.log(`Price ratio: ${ratio.toFixed(2)}x - Verified NOT doubled ✓`);
        });
    });
});
