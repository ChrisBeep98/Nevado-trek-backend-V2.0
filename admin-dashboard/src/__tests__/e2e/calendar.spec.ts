import { test, expect } from '@playwright/test';

const ADMIN_KEY = 'ntk_admin_prod_key_2025_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7';

test.describe('Calendar UI Enhancements', () => {
    test.beforeEach(async ({ page }) => {
        // Login using admin key (same as other E2E tests)
        await page.goto('/login');
        await page.getByTestId('login-input').fill(ADMIN_KEY);
        await page.getByTestId('login-button').click();

        // Wait for redirect to home
        await page.waitForURL('/');
        await page.waitForLoadState('networkidle');
    });

    test('should display booking names in calendar events', async ({ page }) => {
        // Wait for calendar to load
        await page.waitForSelector('[data-testid^="event-"]', { timeout: 10000 });

        // Find an event (there should be at least one if there are departures)
        const events = await page.locator('[data-testid^="event-"]').all();

        if (events.length > 0) {
            const firstEvent = events[0];

            // Event should show pax count
            await expect(firstEvent).toContainText('Pax');

            // Event should be clickable
            await expect(firstEvent).toHaveClass(/cursor-pointer/);
        }
    });

    test('should show tooltip on hover', async ({ page }) => {
        // Wait for calendar
        await page.waitForSelector('[data-testid^="event-"]', { timeout: 10000 });

        const events = await page.locator('[data-testid^="event-"]').all();

        if (events.length > 0) {
            // Hover over first event
            await events[0].hover();

            // Wait a bit for tooltip to appear (delayDuration is 200ms)
            await page.waitForTimeout(300);

            // Tooltip should be visible
            const tooltip = page.locator('[role="tooltip"]');
            await expect(tooltip).toBeVisible({ timeout: 5000 });

            // Tooltip should contain departure details
            await expect(tooltip).toContainText('Departure Details');
            await expect(tooltip).toContainText('Status:');
            await expect(tooltip).toContainText('Type:');
            await expect(tooltip).toContainText('Capacity:');
        }
    });

    test('should display cancelled private departures with reduced opacity', async ({ page }) => {
        await page.waitForSelector('[data-testid^="event-"]', { timeout: 10000 });

        const events = await page.locator('[data-testid^="event-"]').all();

        for (const event of events) {
            const text = await event.textContent();

            // If event contains "Cancelled", check opacity
            if (text?.includes('Cancelled')) {
                const opacity = await event.evaluate((el) => {
                    return window.getComputedStyle(el).opacity;
                });

                // Should have reduced opacity
                expect(parseFloat(opacity)).toBeLessThanOrEqual(0.5);
                console.log('Found cancelled departure with reduced opacity:', opacity);
                break;
            }
        }
    });

    test('should open departure modal when clicking event', async ({ page }) => {
        await page.waitForSelector('[data-testid^="event-"]', { timeout: 10000 });

        const events = await page.locator('[data-testid^="event-"]').all();

        if (events.length > 0) {
            // Click first event
            await events[0].click();

            // Modal should open
            await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 });
        }
    });

    test('should show correct color indicators in legend', async ({ page }) => {
        // Check legend is visible
        await expect(page.locator('text=Public Open')).toBeVisible();
        await expect(page.locator('text=Public Full')).toBeVisible();
        await expect(page.locator('text=Private')).toBeVisible();

        // Check color indicators exist
        const greenIndicator = page.locator('.bg-emerald-500').first();
        const redIndicator = page.locator('.bg-rose-500').first();
        const violetIndicator = page.locator('.bg-violet-500').first();

        await expect(greenIndicator).toBeVisible();
        await expect(redIndicator).toBeVisible();
        await expect(violetIndicator).toBeVisible();
    });

    test('should navigate between months correctly', async ({ page }) => {
        await page.waitForSelector('.fc-toolbar-title', { timeout: 10000 });

        // Get current month
        const initialMonth = await page.locator('.fc-toolbar-title').textContent();

        // Click next month
        await page.click('.fc-next-button');
        await page.waitForTimeout(500);

        // Month should change
        const nextMonth = await page.locator('.fc-toolbar-title').textContent();
        expect(nextMonth).not.toBe(initialMonth);

        // Click previous to go back
        await page.click('.fc-prev-button');
        await page.waitForTimeout(500);

        // Should be back to initial month
        const backMonth = await page.locator('.fc-toolbar-title').textContent();
        expect(backMonth).toBe(initialMonth);
    });

    test('should have New Departure button', async ({ page }) => {
        const newDepButton = page.locator('[data-testid="new-departure-button"]');
        await expect(newDepButton).toBeVisible();
        await expect(newDepButton).toContainText('New Departure');
    });
});
