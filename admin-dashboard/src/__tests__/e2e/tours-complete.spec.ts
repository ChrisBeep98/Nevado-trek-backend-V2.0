import { test, expect } from '@playwright/test';

const ADMIN_KEY = process.env.ADMIN_SECRET_KEY || '';

test.describe('Tours - Complete E2E Tests', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
        await page.getByTestId('login-input').fill(ADMIN_KEY);
        await page.getByTestId('login-button').click();
        await page.waitForURL('/');

        // Navigate to tours
        await page.getByTestId('nav-tours').click();
        await page.waitForURL('/tours');
        await page.waitForTimeout(2000);
    });

    test('should create minimal tour with only required fields', async ({ page }) => {
        // Click New Tour
        await page.getByTestId('new-tour-button').click();

        // Wait for modal
        await expect(page.getByText('New Tour')).toBeVisible();

        // Fill required fields in Basic tab
        await page.getByTestId('input-name-es').fill('Tour Mínimo Test');
        await page.getByTestId('input-name-en').fill('Minimal Test Tour');
        await page.locator('textarea[name="description.es"]').fill('Descripción de prueba');
        await page.locator('textarea[name="description.en"]').fill('Test description');
        await page.getByTestId('input-difficulty').fill('Easy');

        // Go to Details tab to fill required fields
        await page.getByRole('tab', { name: 'Details' }).click();
        await page.waitForTimeout(300);

        await page.getByTestId('input-location-es').fill('Bogotá');
        await page.getByTestId('input-location-en').fill('Bogota');
        await page.getByTestId('input-altitude-es').fill('2,600 msnm');
        await page.getByTestId('input-altitude-en').fill('2,600 masl');

        // Submit
        await page.getByTestId('submit-tour-button').click();

        // Wait for success
        await page.waitForTimeout(3000);

        // Modal should close
        await expect(page.getByText('New Tour')).not.toBeVisible({ timeout: 5000 });
    });

    test('should create complete tour with all fields', async ({ page }) => {
        // Click New Tour
        await page.getByTestId('new-tour-button').click();

        // Wait for modal
        await expect(page.getByText('New Tour')).toBeVisible();

        // BASIC TAB
        await page.getByTestId('input-name-es').fill('Tour Completo Test');
        await page.getByTestId('input-name-en').fill('Complete Test Tour');
        await page.locator('textarea[name="description.es"]').fill('Descripción completa del tour de prueba');
        await page.locator('textarea[name="description.en"]').fill('Complete test tour description');
        await page.getByTestId('input-short-desc-es').fill('Descripción corta para listados');
        await page.getByTestId('input-short-desc-en').fill('Short description for listings');
        await page.getByTestId('input-difficulty').fill('Medium');

        // PRICING TAB
        await page.getByRole('tab', { name: 'Pricing' }).click();
        await page.waitForTimeout(300);
        await page.getByTestId('input-tier-0-price-cop').fill('500000');
        await page.getByTestId('input-tier-0-price-usd').fill('125');

        // DETAILS TAB
        await page.getByRole('tab', { name: 'Details' }).click();
        await page.waitForTimeout(300);
        await page.getByTestId('input-location-es').fill('Sierra Nevada');
        await page.getByTestId('input-location-en').fill('Sierra Nevada');
        await page.getByTestId('input-altitude-es').fill('4,800 msnm');
        await page.getByTestId('input-altitude-en').fill('4,800 masl');

        // Submit
        await page.getByTestId('submit-tour-button').click();

        // Wait for success
        await page.waitForTimeout(3000);

        // Modal should close
        await expect(page.getByText('New Tour')).not.toBeVisible({ timeout: 5000 });
    });

    test('should update tour - Basic tab', async ({ page }) => {
        // Wait for tours to load
        const tourCard = page.locator('[data-testid^="tour-card-"]').first();
        await expect(tourCard).toBeVisible({ timeout: 10000 });

        // Click first tour
        await tourCard.click();

        // Wait for modal
        await expect(page.getByText('Edit Tour')).toBeVisible();

        // Edit name
        const nameInput = page.getByTestId('input-name-es');
        await nameInput.fill('Tour Actualizado');

        // Submit
        await page.getByTestId('submit-tour-button').click();

        // Wait for success
        await page.waitForTimeout(2000);

        // Modal should close
        await expect(page.getByText('Edit Tour')).not.toBeVisible({ timeout: 5000 });
    });

    test('should update tour - Pricing tab', async ({ page }) => {
        // Wait for tours
        const tourCard = page.locator('[data-testid^="tour-card-"]').first();
        await expect(tourCard).toBeVisible({ timeout: 10000 });

        // Click first tour
        await tourCard.click();

        // Wait for modal
        await expect(page.getByText('Edit Tour')).toBeVisible();

        // Go to Pricing tab
        await page.getByRole('tab', { name: 'Pricing' }).click();
        await page.waitForTimeout(500);

        // Edit price
        const priceInput = page.getByTestId('input-tier-0-price-cop');
        await priceInput.fill('600000');

        // Submit
        await page.getByTestId('submit-tour-button').click();

        // Wait for success
        await page.waitForTimeout(2000);

        // Modal should close
        await expect(page.getByText('Edit Tour')).not.toBeVisible({ timeout: 5000 });
    });

    test('should update tour - Details tab', async ({ page }) => {
        // Wait for tours
        const tourCard = page.locator('[data-testid^="tour-card-"]').first();
        await expect(tourCard).toBeVisible({ timeout: 10000 });

        // Click first tour
        await tourCard.click();

        // Wait for modal
        await expect(page.getByText('Edit Tour')).toBeVisible();

        // Go to Details tab
        await page.getByRole('tab', { name: 'Details' }).click();
        await page.waitForTimeout(500);

        // Edit location and altitude
        await page.getByTestId('input-location-es').fill('Bogotá - Updated');
        await page.getByTestId('input-altitude-es').fill('2,650 msnm');

        // Submit
        await page.getByTestId('submit-tour-button').click();

        // Wait for success
        await page.waitForTimeout(2000);

        // Modal should close
        await expect(page.getByText('Edit Tour')).not.toBeVisible({ timeout: 5000 });
    });

    test('should update tour - All tabs combined', async ({ page }) => {
        // Wait for tours
        const tourCard = page.locator('[data-testid^="tour-card-"]').first();
        await expect(tourCard).toBeVisible({ timeout: 10000 });

        // Click first tour
        await tourCard.click();

        // Wait for modal
        await expect(page.getByText('Edit Tour')).toBeVisible();

        // BASIC TAB
        await page.getByTestId('input-name-es').fill('Tour Multi-Tab Update');
        await page.getByTestId('input-short-desc-es').fill('Actualización completa de múltiples pestañas');

        // PRICING TAB
        await page.getByRole('tab', { name: 'Pricing' }).click();
        await page.waitForTimeout(300);
        await page.getByTestId('input-tier-0-price-cop').fill('700000');

        // DETAILS TAB
        await page.getByRole('tab', { name: 'Details' }).click();
        await page.waitForTimeout(300);
        await page.getByTestId('input-location-es').fill('Multi-Tab Test Location');
        await page.getByTestId('input-altitude-es').fill('3,000 msnm');

        // Submit
        await page.getByTestId('submit-tour-button').click();

        // Wait for success
        await page.waitForTimeout(2000);

        // Modal should close
        await expect(page.getByText('Edit Tour')).not.toBeVisible({ timeout: 5000 });
    });
});
