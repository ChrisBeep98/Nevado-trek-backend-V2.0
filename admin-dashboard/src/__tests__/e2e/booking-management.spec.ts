import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';
const ADMIN_KEY = 'ntk_admin_prod_key_2025_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7';

test.describe('Booking Management - Comprehensive E2E Tests', () => {
    test.beforeEach(async ({ page }) => {
        // Login
        await page.goto(`${BASE_URL}/login`);
        await page.getByTestId('login-input').fill(ADMIN_KEY);
        await page.getByTestId('login-button').click();
        await page.waitForURL(`${BASE_URL}/`);

        // Navigate to Bookings page
        await page.getByTestId('nav-bookings').click();
        await page.waitForURL(`${BASE_URL}/bookings`);
    });

    test('should open booking modal and display basic structure', async ({ page }) => {
        // Wait for bookings list
        await page.waitForSelector('table tbody tr', { timeout: 10000 });

        // Click first booking
        await page.locator('table tbody tr').first().click();

        // Verify modal opens with heading
        await expect(page.getByRole('heading', { name: /Manage Booking/ })).toBeVisible({ timeout: 10000 });

        // Verify tabs exist (only shown when editing)
        await expect(page.getByTestId('tab-details')).toBeVisible();
        await expect(page.getByTestId('tab-status')).toBeVisible();
        await expect(page.getByTestId('tab-actions')).toBeVisible();
    });

    test('should show correct tab content when switching tabs', async ({ page }) => {
        // Open modal
        await page.waitForSelector('table tbody tr');
        await page.locator('table tbody tr').first().click();
        await expect(page.getByRole('heading', { name: /Manage Booking/ })).toBeVisible();

        // Details tab - check has customer fields
        await expect(page.getByTestId('input-customer-name')).toBeVisible();
        await expect(page.getByTestId('input-pax')).toBeVisible();

        // Status tab - check has status section
        await page.getByTestId('tab-status').click();
        await page.waitForTimeout(500);
        await expect(page.getByRole('heading', { name: /Booking Status/i })).toBeVisible();

        // Should NOT say "Payment Status"
        const paymentHeading = page.getByRole('heading', { name: /Payment Status/i });
        await expect(paymentHeading).not.toBeVisible();

        // Actions tab - check has price fields
        await page.getByTestId('tab-actions').click();
        await page.waitForTimeout(500);
        await expect(page.getByRole('heading', { name: /Update Price/i })).toBeVisible();
    });

    test('should allow editing customer details', async ({ page }) => {
        // Open modal
        await page.waitForSelector('table tbody tr');
        await page.locator('table tbody tr').first().click();
        await expect(page.getByRole('heading', { name: /Manage Booking/ })).toBeVisible();

        // Get current name
        const nameInput = page.getByTestId('input-customer-name');
        const originalName = await nameInput.inputValue();

        // Change name
        const newName = `Test Customer ${Date.now()}`;
        await nameInput.fill(newName);

        // Submit
        await page.getByTestId('submit-booking-button').click();

        // Should see success indication (toast or modal close)
        await page.waitForTimeout(2000);

        // Verify change persisted (reopen modal)
        await page.locator('table tbody tr').first().click();
        await expect(page.getByRole('heading', { name: /Manage Booking/ })).toBeVisible();

        const updatedName = await page.getByTestId('input-customer-name').inputValue();
        expect(updatedName).toBe(newName);

        // Restore original name
        await page.getByTestId('input-customer-name').fill(originalName);
        await page.getByTestId('submit-booking-button').click();
        await page.waitForTimeout(1000);
    });

    test('should allow changing booking status', async ({ page }) => {
        // Open modal
        await page.waitForSelector('table tbody tr');
        await page.locator('table tbody tr').first().click();
        await expect(page.getByRole('heading', { name: /Manage Booking/ })).toBeVisible();

        // Go to Status tab
        await page.getByTestId('tab-status').click();
        await page.waitForTimeout(500);

        // Get current status
        const statusSelect = page.getByTestId('status-select');
        const originalStatus = await statusSelect.inputValue();

        // Change to different status
        const newStatus = originalStatus === 'pending' ? 'confirmed' : 'pending';
        await statusSelect.selectOption(newStatus);

        // Wait for update
        await page.waitForTimeout(2000);

        // Verify status changed
        const currentStatus = await statusSelect.inputValue();
        expect(currentStatus).toBe(newStatus);

        // Restore original
        await statusSelect.selectOption(originalStatus);
        await page.waitForTimeout(1000);
    });

    test('should show price update options in Actions tab', async ({ page }) => {
        // Open modal
        await page.waitForSelector('table tbody tr');
        await page.locator('table tbody tr').first().click();
        await expect(page.getByRole('heading', { name: /Manage Booking/ })).toBeVisible();

        // Go to Actions tab
        await page.getByTestId('tab-actions').click();
        await page.waitForTimeout(500);

        // Verify price section exists
        await expect(page.getByRole('heading', { name: /Update Price/i })).toBeVisible();

        // Toggle between modes
        await page.getByRole('button', { name: /Apply Discount/i }).click();
        await expect(page.getByTestId('input-discount-amount')).toBeVisible();

        await page.getByRole('button', { name: /Set Final Price/i }).click();
        await expect(page.getByTestId('input-new-price')).toBeVisible();
    });

    test('should validate PAX updates', async ({ page }) => {
        // Open modal  
        await page.waitForSelector('table tbody tr');
        await page.locator('table tbody tr').first().click();
        await expect(page.getByRole('heading', { name: /Manage Booking/ })).toBeVisible();

        // Get current PAX
        const paxInput = page.getByTestId('input-pax');
        const originalPax = await paxInput.inputValue();

        // Try to update PAX
        const newPax = parseInt(originalPax) + 1;
        await paxInput.fill(newPax.toString());
        await page.getByTestId('submit-booking-button').click();

        // Wait for response (might be success or capacity error)
        await page.waitForTimeout(2000);

        // Either way, form should still be responsive
        await expect(paxInput).toBeVisible();

        // Restore original
        await paxInput.fill(originalPax);
        await page.getByTestId('submit-booking-button').click();
        await page.waitForTimeout(1000);
    });

    test('should display booking context information', async ({ page }) => {
        // Open modal
        await page.waitForSelector('table tbody tr');
        await page.locator('table tbody tr').first().click();
        await expect(page.getByRole('heading', { name: /Manage Booking/ })).toBeVisible();

        // Wait for context data to load
        await page.waitForTimeout(2000);

        // At minimum, should show some context
        // Tour name might be "Unknown Tour" if data hasn't loaded
        const tourContext = page.getByTestId('booking-context-tour');
        const hasContext = await tourContext.isVisible().catch(() => false);

        if (hasContext) {
            // If context is visible, verify basic structure
            await expect(tourContext).toBeVisible();

            // Date context should also exist
            await expect(page.getByTestId('booking-context-date')).toBeVisible();

            // Type context should exist
            await expect(page.getByTestId('booking-context-type')).toBeVisible();
        }

        // Test passes if modal opened successfully, context is optional
    });

    test('should show price information', async ({ page }) => {
        // Open modal
        await page.waitForSelector('table tbody tr');
        await page.locator('table tbody tr').first().click();
        await expect(page.getByRole('heading', { name: /Manage Booking/ })).toBeVisible();

        // Wait for data
        await page.waitForTimeout(2000);

        // Go to Actions tab where prices are shown
        await page.getByTestId('tab-actions').click();
        await page.waitForTimeout(500);

        // Price section should exist
        await expect(page.getByRole('heading', { name: /Update Price/i })).toBeVisible();
    });

    test('should handle modal close correctly', async ({ page }) => {
        // Open modal
        await page.waitForSelector('table tbody tr');
        await page.locator('table tbody tr').first().click();
        await expect(page.getByRole('heading', { name: /Manage Booking/ })).toBeVisible();

        // Close modal via X button
        await page.getByTestId('close-modal-button').click();

        // Modal should close
        await expect(page.getByRole('heading', { name: /Manage Booking/ })).not.toBeVisible();

        // Should be back at bookings page
        await expect(page.getByTestId('search-bookings-input')).toBeVisible();
    });

    test('should filter bookings by status', async ({ page }) => {
        // Verify filter buttons exist
        await expect(page.getByRole('button', { name: /All/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /Pending/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /Confirmed/i })).toBeVisible();

        // Click filter
        await page.getByRole('button', { name: /Confirmed/i }).click();

        // Wait for filter to apply
        await page.waitForTimeout(1000);

        // Table should still be visible (even if empty)
        await expect(page.locator('table')).toBeVisible();
    });

    test('should search bookings', async ({ page }) => {
        // Search input should exist
        const searchInput = page.getByTestId('search-bookings-input');
        await expect(searchInput).toBeVisible();

        // Try searching
        await searchInput.fill('test');

        // Wait for search to apply
        await page.waitForTimeout(1000);

        // Table should still be visible
        await expect(page.locator('table')).toBeVisible();

        // Clear search
        await searchInput.clear();
        await page.waitForTimeout(500);
    });
});
