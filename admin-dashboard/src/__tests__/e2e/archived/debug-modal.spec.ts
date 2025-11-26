import { test } from '@playwright/test';
import * as fs from 'fs';

const BASE_URL = 'http://localhost:5173';
const ADMIN_KEY = 'ntk_admin_prod_key_2025_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7';
const LOG_FILE = 'modal_debug.txt';

test('debug modal content', async ({ page }) => {
    fs.writeFileSync(LOG_FILE, '--- MODAL DEBUG TEST ---\n');

    // Login
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="password"]', ADMIN_KEY);
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/`);

    // Navigate to Bookings
    await page.click('a[href="/bookings"]');
    await page.waitForURL(`${BASE_URL}/bookings`);

    // Wait for bookings to load
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    // Click first booking
    await page.locator('table tbody tr').first().click();

    // Wait a bit for modal content
    await page.waitForTimeout(2000);

    // Get all modal text
    const modalText = await page.locator('[role="dialog"]').innerText();
    fs.appendFileSync(LOG_FILE, '\n=== MODAL CONTENT ===\n');
    fs.appendFileSync(LOG_FILE, modalText + '\n');

    // Check for specific elements
    const hasChip = await page.locator('[data-testid="booking-type-chip"]').isVisible();
    const hasNoDeparture = await page.getByText('No Departure').isVisible();
    const hasLoading = await page.locator('.animate-pulse').count();

    fs.appendFileSync(LOG_FILE, `\n=== ELEMENT STATUS ===\n`);
    fs.appendFileSync(LOG_FILE, `Chip visible: ${hasChip}\n`);
    fs.appendFileSync(LOG_FILE, `No Departure visible: ${hasNoDeparture}\n`);
    fs.appendFileSync(LOG_FILE, `Loading elements count: ${hasLoading}\n`);

    // Take screenshot
    await page.screenshot({ path: 'modal_screenshot.png', fullPage: true });

    console.log('Debug info written to', LOG_FILE);
});
