import { test, expect } from '@playwright/test';

const ADMIN_KEY = 'ntk_admin_prod_key_2025_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7';

test.describe('Tours - Complete CRUD', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
        await page.getByTestId('login-input').fill(ADMIN_KEY);
        await page.getByTestId('login-button').click();
        await page.waitForURL('/');

        // Navigate to tours
        await page.getByTestId('nav-tours').click();
        await page.waitForURL('/tours');
        await page.waitForTimeout(2000); // Wait for tours to load
    });

    test('should update tour - Basic tab only', async ({ page }) => {
        // Wait for tours to load
        await page.waitForSelector('[data-testid^="tour-card-"]', { timeout: 10000 });

        // Click first tour
        await page.locator('[data-testid^="tour-card-"]').first().click();

        // Wait for modal
        await expect(page.getByText('Edit Tour')).toBeVisible();

        // Edit name in Basic tab
        const nameInput = page.getByTestId('input-name-es');
        await nameInput.fill('Updated Tour Name ES');

        // Click Update Tour
        await page.getByTestId('submit-tour-button').click();

        // Wait for toast or modal close
        await page.waitForTimeout(2000);

        // Modal should close
        await expect(page.getByText('Edit Tour')).not.toBeVisible();
    });

    test('should update tour - Pricing tab', async ({ page }) => {
        // Wait for tours
        await page.waitForSelector('[data-testid^="tour-card-"]', { timeout: 10000 });

        // Click first tour
        await page.locator('[data-testid^="tour-card-"]').first().click();

        // Wait for modal
        await expect(page.getByText('Edit Tour')).toBeVisible();

        // Go to Pricing tab
        await page.getByRole('tab', { name: 'Pricing' }).click();
        await page.waitForTimeout(500);

        // Edit first tier COP price
        const priceInput = page.getByTestId('input-tier-0-price-cop');
        await priceInput.fill('500000');

        // Click Update Tour
        await page.getByTestId('submit-tour-button').click();

        // Wait for response
        await page.waitForTimeout(2000);

        // Modal should close
        await expect(page.getByText('Edit Tour')).not.toBeVisible();
    });

    test('should update tour - Details tab', async ({ page }) => {
        // Wait for tours
        await page.waitForSelector('[data-testid^="tour-card-"]', { timeout: 10000 });

        // Click first tour
        await page.locator('[data-testid^="tour-card-"]').first().click();

        // Wait for modal
        await expect(page.getByText('Edit Tour')).toBeVisible();

        // Go to Details tab
        await page.getByRole('tab', { name: 'Details' }).click();
        await page.waitForTimeout(500);

        // Edit location
        const locationInput = page.getByTestId('input-location-es');
        await locationInput.fill('Bogotá, Colombia - Updated');

        // Edit altitude
        const altitudeInput = page.getByTestId('input-altitude-es');
        await altitudeInput.fill('2,600 msnm');

        // Click Update Tour
        await page.getByTestId('submit-tour-button').click();

        // Wait for response
        await page.waitForTimeout(2000);

        // Modal should close
        await expect(page.getByText('Edit Tour')).not.toBeVisible();
    });

    test('should update tour - All tabs', async ({ page }) => {
        // Wait for tours
        await page.waitForSelector('[data-testid^="tour-card-"]', { timeout: 10000 });

        // Click first tour
        await page.locator('[data-testid^="tour-card-"]').first().click();

        // Wait for modal
        await expect(page.getByText('Edit Tour')).toBeVisible();

        // BASIC TAB
        await page.getByTestId('input-name-es').fill('Complete Update Test');

        // PRICING TAB
        await page.getByRole('tab', { name: 'Pricing' }).click();
        await page.waitForTimeout(300);
        await page.getByTestId('input-tier-0-price-cop').fill('600000');

        // DETAILS TAB
        await page.getByRole('tab', { name: 'Details' }).click();
        await page.waitForTimeout(300);
        await page.getByTestId('input-location-es').fill('Test Location');
        await page.getByTestId('input-altitude-es').fill('3,000 msnm');

        // Submit
        await page.getByTestId('submit-tour-button').click();

        // Wait for response
        await page.waitForTimeout(2000);

        // Modal should close
        await expect(page.getByText('Edit Tour')).not.toBeVisible();
    });
});
