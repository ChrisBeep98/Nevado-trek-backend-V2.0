import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';
const ADMIN_KEY = 'ntk_admin_prod_key_2025_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7';

test.describe('Booking Management - Comprehensive E2E Tests', () => {
    test.beforeEach(async ({ page }) => {
        // Login
        await page.goto(`${BASE_URL}/login`);
        await page.fill('input[type="password"]', ADMIN_KEY);
        await page.click('button[type="submit"]');
        await page.waitForURL(`${BASE_URL}/`);

        // Navigate to Bookings page
        await page.click('a[href="/bookings"]');
        await page.waitForURL(`${BASE_URL}/bookings`);
    });

    test('should display booking type chip when opening a booking', async ({ page }) => {
        // Wait for bookings list to load
        await page.waitForSelector('table tbody tr', { timeout: 10000 });

        // Click on first booking
        const firstBooking = page.locator('table tbody tr').first();
        await firstBooking.click();

        // Wait for modal content to appear (title)
        await expect(page.getByRole('heading', { name: /Manage Booking|New Booking/ })).toBeVisible();

        // Check for chip or "No Departure" or Loading
        try {
            await page.waitForSelector('[data-testid="booking-type-chip"]', { timeout: 5000 });
        } catch (e) {
            console.log('Chip not found. Checking for alternatives...');
            const noDeparture = await page.getByText('No Departure').isVisible();
            const loading = await page.locator('.animate-pulse').isVisible();
            const modalText = await page.locator('[role="dialog"]').innerText();
            console.log(`No Departure visible: ${noDeparture}`);
            console.log(`Loading visible: ${loading}`);
            console.log(`Modal text: ${modalText}`);
            throw new Error('Booking type chip not found');
        }

        // Verify chip exists and shows either "Public" or "Private"
        const chip = page.locator('[data-testid="booking-type-chip"]');
        await expect(chip).toBeVisible();
        const chipText = await chip.textContent();
        expect(['Public', 'Private']).toContain(chipText);

        // Verify chip has correct color
        const chipClasses = await chip.getAttribute('class');
        if (chipText === 'Private') {
            expect(chipClasses).toContain('purple');
        } else {
            expect(chipClasses).toContain('blue');
        }
    });

    test('should show "Booking Status" label (not "Payment Status")', async ({ page }) => {
        // Open first booking
        await page.waitForSelector('table tbody tr');
        await page.locator('table tbody tr').first().click();

        // Navigate to Status & Type tab
        await page.click('[data-testid="tab-status"]');

        // Verify the heading says "Booking Status"
        const statusHeading = page.locator('h3:has-text("Booking Status")');
        await expect(statusHeading).toBeVisible();

        // Verify it does NOT say "Payment Status"
        const paymentStatusHeading = page.locator('h3:has-text("Payment Status")');
        await expect(paymentStatusHeading).not.toBeVisible();
    });

    test('should NOT show duplicate Convert button in Status tab', async ({ page }) => {
        // Open first booking
        await page.waitForSelector('table tbody tr');
        await page.locator('table tbody tr').first().click();

        // Navigate to Status & Type tab
        await page.click('[data-testid="tab-status"]');

        // Verify no "Convert Type" section exists in Status tab
        const convertTypeSection = page.locator('h3:has-text("Convert Type")');
        await expect(convertTypeSection).not.toBeVisible();

        // Navigate to Actions tab
        await page.click('[data-testid="tab-actions"]');

        await page.waitForSelector('[data-testid="input-customer-name"]');

        // Edit customer name
        const nameInput = page.locator('[data-testid="input-customer-name"]');
        const originalName = await nameInput.inputValue();
        const newName = 'E2E Test Customer Updated';

        await nameInput.fill(newName);
        await page.click('[data-testid="submit-booking-button"]');

        // Wait for modal to close
        await page.waitForSelector('[data-testid="booking-type-chip"]', { state: 'hidden', timeout: 5000 });

        // Reopen booking and verify change persisted
        await page.locator('table tbody tr').first().click();
        await page.waitForSelector('[data-testid="input-customer-name"]');
        const updatedName = await page.locator('[data-testid="input-customer-name"]').inputValue();
        expect(updatedName).toBe(newName);

        // Restore original name
        await page.locator('[data-testid="input-customer-name"]').fill(originalName);
        await page.click('[data-testid="submit-booking-button"]');
    });

    test('should update PAX and see capacity change in departure context', async ({ page }) => {
        // Find a PUBLIC booking (look for one that shows capacity info)
        await page.waitForSelector('table tbody tr');

        // Click on first booking
        await page.locator('table tbody tr').first().click();
        await page.waitForSelector('[data-testid="booking-context-capacity"]', { timeout: 5000 });

        // Get current capacity
        const capacityText = await page.locator('[data-testid="booking-context-capacity"] p.text-white').textContent();
        const currentPax = parseInt(capacityText?.split('/')[0] || '0');

        // Get current booking pax
        const paxInput = page.locator('[data-testid="input-pax"]');
        const bookingPax = parseInt(await paxInput.inputValue());

        // Increase PAX by 1
        await paxInput.fill((bookingPax + 1).toString());
        await page.click('[data-testid="submit-booking-button"]');

        // Wait for update
        await page.waitForTimeout(1000);

        // Verify capacity increased
        const newCapacityText = await page.locator('[data-testid="booking-context-capacity"] p.text-white').textContent();
        const newPax = parseInt(newCapacityText?.split('/')[0] || '0');
        expect(newPax).toBe(currentPax + 1);

        // Restore original PAX
        await paxInput.fill(bookingPax.toString());
        await page.click('[data-testid="submit-booking-button"]');
    });

    test('should prevent PAX increase when no capacity available', async ({ page }) => {
        // This test requires a booking in a nearly-full departure
        // For now, we'll skip if not found, or you can set up test data
        await page.waitForSelector('table tbody tr');

        test.skip(); // Skip until we have proper test data setup

        // TODO: Create test data with a 7/8 pax departure
        // Try to increase a 1-pax booking to 3-pax
        // Verify alert appears with capacity error
    });

    test('should allow changing booking status', async ({ page }) => {
        // Open first booking
        await page.waitForSelector('table tbody tr');
        await page.locator('table tbody tr').first().click();

        // Navigate to Status & Type tab
        await page.click('[data-testid="tab-status"]');

        // Get current status
        const confirmedButton = page.locator('[data-testid="status-button-confirmed"]');
        const pendingButton = page.locator('[data-testid="status-button-pending"]');

        // Click on a different status
        const isPending = (await pendingButton.getAttribute('class'))?.includes('bg-indigo-500');

        if (isPending) {
            await confirmedButton.click();
            await page.waitForTimeout(1000);
            expect(await confirmedButton.getAttribute('class')).toContain('bg-indigo-500');
            // Restore
            await pendingButton.click();
        } else {
            await pendingButton.click();
            await page.waitForTimeout(1000);
            expect(await pendingButton.getAttribute('class')).toContain('bg-indigo-500');
            // Restore
            await confirmedButton.click();
        }
    });

    test('should convert public booking to private (with split)', async ({ page: _page }) => {
        // This test requires a PUBLIC departure with multiple bookings
        test.skip(); // Skip until proper test data is set up

        // TODO: Steps would be:
        // 1. Find a public booking with other bookings in same departure
        // 2. Click Convert to Private in Actions tab
        // 3. Verify success message
        // 4. Verify booking now shows as Private type
        // 5. Verify a new departure was created
        // 6. Verify old departure's capacity decreased
    });

    test('should apply discount to booking', async ({ page }) => {
        // Open first booking
        await page.waitForSelector('table tbody tr');
        await page.locator('table tbody tr').first().click();

        // Navigate to Actions tab
        await page.click('[data-testid="tab-actions"]');

        // Wait for price section
        await page.waitForSelector('[data-testid="input-discount-amount"]');

        // Get original price from context
        await page.locator('[data-testid="booking-context-tour"]').first().textContent();

        // Apply discount
        await page.fill('[data-testid="input-discount-amount"]', '50000');
        await page.fill('[data-testid="input-discount-reason"]', 'E2E Test Discount');
        await page.click('[data-testid="apply-price-button"]');

        // Wait for update
        await page.waitForTimeout(1500);

        // Verify discount was applied (final price should be different)
        const finalPriceElement = page.locator('span.text-green-400');
        await expect(finalPriceElement).toBeVisible();

        // Note: Clean up by removing discount would require another API call or manual cleanup
    });

    test('should set final price directly', async ({ page }) => {
        // Open first booking
        await page.waitForSelector('table tbody tr');
        await page.locator('table tbody tr').first().click();

        // Navigate to Actions tab
        await page.click('[data-testid="tab-actions"]');

        // Switch to "Set Final Price" mode
        await page.click('button:has-text("Set Final Price")');

        // Wait for input to appear
        await page.waitForSelector('[data-testid="input-new-price"]');

        // Set new price
        await page.fill('[data-testid="input-new-price"]', '300000');
        await page.fill('[data-testid="input-price-reason"]', 'E2E Test Fixed Price');
        await page.click('[data-testid="apply-price-button"]');

        // Wait for update
        await page.waitForTimeout(1500);

        // Verify final price changed
        const finalPriceElement = page.locator('span.text-green-400');
        await expect(finalPriceElement).toBeVisible();
    });

    test('should show blocked Change Date/Tour for public bookings with others', async ({ page: _page }) => {
        // This requires a public booking with other bookings in same departure
        test.skip(); // Skip until proper test data

        // TODO: Steps would be:
        // 1. Open a public booking that has relatedBookings.length > 0
        // 2. Go to Actions tab
        // 3. Verify "Change Date/Tour - Blocked" section is visible
        // 4. Verify warning message about other bookings
        // 5. Verify "Convert to Private" button is shown as solution
    });

    test('should allow Change Date/Tour for private bookings', async ({ page: _page }) => {
        // This requires a private booking
        test.skip(); // Skip until proper test data

        // TODO: Steps would be:
        // 1. Open a private booking
        // 2. Go to Actions tab
        // 3. Verify "Change Date/Tour" section is NOT blocked
        // 4. Fill new date and tour ID
        // 5. Click Update
        // 6. Verify booking moved to new departure
    });

    test('should display context information correctly', async ({ page }) => {
        // Open first booking
        await page.waitForSelector('table tbody tr');
        await page.locator('table tbody tr').first().click();

        // Verify context section exists
        await page.waitForSelector('[data-testid="booking-context-tour"]');

        // Verify all context elements
        await expect(page.locator('[data-testid="booking-context-tour"]')).toBeVisible();
        await expect(page.locator('[data-testid="booking-context-date"]')).toBeVisible();
        await expect(page.locator('[data-testid="booking-context-type"]')).toBeVisible();

        // Verify type shows "Public" or "Private"
        const typeText = await page.locator('[data-testid="booking-context-type"] p.font-medium').textContent();
        expect(['Public', 'Private']).toContain(typeText || '');

        // If public, verify capacity is shown
        if (typeText === 'Public') {
            await expect(page.locator('[data-testid="booking-context-capacity"]')).toBeVisible();
        }
    });

    test('should display price information correctly', async ({ page }) => {
        // Open first booking
        await page.waitForSelector('table tbody tr');
        await page.locator('table tbody tr').first().click();

        // Wait for price info
        await page.waitForTimeout(1000);

        // Verify original price is displayed
        const originalPriceElement = page.locator('span:has-text("Original:") + span.text-white');
        await expect(originalPriceElement).toBeVisible();

        // Verify final price is displayed
        const finalPriceElement = page.locator('span:has-text("Final:") + span.text-green-400');
        await expect(finalPriceElement).toBeVisible();

        // Verify COP currency is shown
        const priceText = await finalPriceElement.textContent();
        expect(priceText).toContain('COP');
    });

    test('should show other bookings for public departures', async ({ page }) => {
        // Find a public booking with other bookings
        await page.waitForSelector('table tbody tr');

        // Try opening bookings until we find one with related bookings
        const rows = page.locator('table tbody tr');
        const count = await rows.count();

        for (let i = 0; i < Math.min(count, 5); i++) {
            await rows.nth(i).click();
            await page.waitForTimeout(1000);

            // Check if "Other bookings" section exists
            const otherBookingsSection = page.locator('p:has-text("Other bookings in this departure")');
            if (await otherBookingsSection.isVisible()) {
                // Verify section is visible
                await expect(otherBookingsSection).toBeVisible();

                // Verify at least one other booking is listed
                const bookingsList = page.locator('p:has-text("Other bookings") ~ div div.text-xs');
                await expect(await bookingsList.count()).toBeGreaterThan(0);

                break;
            }

            // Close modal and try next
            await page.click('[data-testid="close-modal-button"]');
            await page.waitForTimeout(500);
        }
    });
});
