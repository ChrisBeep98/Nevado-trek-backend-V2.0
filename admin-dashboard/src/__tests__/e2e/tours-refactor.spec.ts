import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './utils/auth-helpers';

test.describe('Tours Management Refactor', () => {
    test.beforeEach(async ({ page }) => {
        await loginAsAdmin(page);
        await page.goto('/tours');
    });

    test('should create a new tour with all fields', async ({ page }) => {
        // 1. Open New Tour Modal
        await page.getByTestId('new-tour-button').click();
        await expect(page.getByRole('dialog')).toBeVisible();

        // 2. Fill Basic Info
        await page.getByTestId('input-name-es').fill('Tour de Prueba Refactor');
        await page.getByTestId('input-name-en').fill('Test Tour Refactor');
        await page.getByTestId('select-type').selectOption('multi-day');
        await page.getByTestId('input-total-days').fill('3');
        await page.getByTestId('input-difficulty').selectOption('Hard');

        // 3. Fill Pricing
        await page.getByRole('tab', { name: 'Pricing' }).click();
        await page.getByTestId('input-tier-0-price-cop').fill('100000');
        await page.getByTestId('input-tier-0-price-usd').fill('30');
        await page.getByTestId('input-tier-3-price-cop').fill('80000');
        await page.getByTestId('input-tier-3-price-usd').fill('25');

        // 4. Fill Itinerary
        await page.getByRole('tab', { name: 'Itinerary' }).click();
        await page.getByRole('button', { name: 'Add Day' }).click();
        await page.locator('input[name="itinerary.days.0.title.es"]').fill('Día 1: Inicio');
        await page.locator('input[name="itinerary.days.0.title.en"]').fill('Day 1: Start');

        // 5. Fill Details (including Altitude)
        await page.getByRole('tab', { name: 'Details' }).click();
        await page.getByTestId('input-location-es').fill('Nevado del Ruiz');
        await page.getByTestId('input-location-en').fill('Nevado del Ruiz');
        await page.getByTestId('input-altitude-es').fill('4500m');
        await page.getByTestId('input-altitude-en').fill('14700ft');

        // 6. Fill Images
        await page.getByRole('tab', { name: 'Images' }).click();
        await page.getByRole('button', { name: 'Random Image' }).click();
        // Wait for image input to be populated (it happens instantly but good to check)
        await expect(page.locator('input[name="images.0"]')).not.toBeEmpty();

        // 7. Submit
        await page.getByTestId('submit-tour-button').click();

        // 8. Verify
        await expect(page.getByRole('dialog')).not.toBeVisible();
        await expect(page.getByText('Tour de Prueba Refactor')).toBeVisible();
    });

    test('should edit an existing tour and persist altitude', async ({ page }) => {
        // 1. Create a tour first to ensure we have one
        const tourName = `Edit Test ${Date.now()}`;
        await page.getByTestId('new-tour-button').click();
        await page.getByTestId('input-name-es').fill(tourName);
        await page.getByTestId('input-name-en').fill(tourName);
        await page.getByTestId('input-altitude-es').click(); // Just to ensure tab switch works if needed, but we are in Basic
        // Go to Details
        await page.getByRole('tab', { name: 'Details' }).click();
        await page.getByTestId('input-altitude-es').fill('3000m');
        await page.getByTestId('submit-tour-button').click();
        await expect(page.getByRole('dialog')).not.toBeVisible();

        // 2. Open Edit Modal
        await page.getByText(tourName).click();
        await expect(page.getByRole('dialog')).toBeVisible();

        // 3. Verify Altitude Persistence
        await page.getByRole('tab', { name: 'Details' }).click();
        await expect(page.getByTestId('input-altitude-es')).toHaveValue('3000m');

        // 4. Edit Altitude
        await page.getByTestId('input-altitude-es').fill('3500m');
        await page.getByTestId('submit-tour-button').click();
        await expect(page.getByRole('dialog')).not.toBeVisible();

        // 5. Re-open and Verify
        await page.getByText(tourName).click();
        await page.getByRole('tab', { name: 'Details' }).click();
        await expect(page.getByTestId('input-altitude-es')).toHaveValue('3500m');
    });

    test('should validate required fields', async ({ page }) => {
        await page.getByTestId('new-tour-button').click();
        await page.getByTestId('submit-tour-button').click();

        // Should show errors
        await expect(page.getByText('Required', { exact: true }).first()).toBeVisible();
    });
});
