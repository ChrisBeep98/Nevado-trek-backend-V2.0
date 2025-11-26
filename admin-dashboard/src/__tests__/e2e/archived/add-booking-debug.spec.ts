import { test, expect } from '@playwright/test';

const ADMIN_KEY = 'ntk_admin_prod_key_2025_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7';

test.describe('Add Booking Debug', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
        await page.getByTestId('login-input').fill(ADMIN_KEY);
        await page.getByTestId('login-button').click();
        await page.waitForURL('/');
        await page.waitForLoadState('networkidle');
    });

    test('step by step debug', async ({ page }) => {
        // Step 1: Open departure
        console.log('Step 1: Opening departure...');
        await page.waitForSelector('[data-testid^="event-"]', { timeout: 10000 });
        const firstEvent = page.locator('[data-testid^="event-"]').first();
        await firstEvent.click();
        await expect(page.locator('text=Departure Details')).toBeVisible();
        console.log('✓ Departure modal opened');

        // Step 2: Go to Bookings tab
        console.log('Step 2: Opening Bookings tab...');
        await page.getByTestId('tab-bookings').click();
        await page.waitForTimeout(500);
        console.log('✓ Bookings tab opened');

        // Step 3: Click Add Booking
        console.log('Step 3: Clicking Add Booking...');
        await page.locator('button:has-text("+ Add Booking")').click();
        await expect(page.locator('text=New Booking')).toBeVisible();
        console.log('✓ Booking modal opened');

        // Step 4: Fill form
        console.log('Step 4: Filling form...');
        await page.getByTestId('input-customer-name').fill('Debug Test');
        await page.getByTestId('input-customer-email').fill('debug@test.com');
        await page.getByTestId('input-customer-phone').fill('+9999999999');
        await page.getByTestId('input-customer-document').fill('DEBUG123');
        await page.getByTestId('input-pax').fill('1');
        console.log('✓ Form filled');

        // Step 5: Setup network listener
        console.log('Step 5: Setting up network listener...');
        let requestSent = false;
        let responseReceived = false;
        let responseStatus = 0;
        let responseBody: any = null;

        page.on('request', request => {
            if (request.url().includes('/admin/bookings/join') && request.method() === 'POST') {
                console.log('✓ Request sent to:', request.url());
                requestSent = true;
            }
        });

        page.on('response', async response => {
            if (response.url().includes('/admin/bookings/join')) {
                console.log('✓ Response received:', response.status());
                responseReceived = true;
                responseStatus = response.status();
                try {
                    responseBody = await response.json();
                    console.log('Response body:', JSON.stringify(responseBody, null, 2));
                } catch (e) {
                    console.log('Could not parse response body');
                }
            }
        });

        // Step 6: Submit
        console.log('Step 6: Submitting form...');
        await page.getByTestId('submit-booking-button').click();

        // Wait for request/response
        await page.waitForTimeout(3000);

        console.log('Request sent:', requestSent);
        console.log('Response received:', responseReceived);
        console.log('Response status:', responseStatus);

        // Check if successful
        if (responseStatus === 201) {
            console.log('✓ Backend responded with success (201)');

            // Check for toast
            const toastVisible = await page.locator('text=Booking created successfully').isVisible().catch(() => false);
            console.log('Toast visible:', toastVisible);

            // Check if modal closed
            await page.waitForTimeout(1000);
            const modalClosed = !(await page.locator('text=New Booking').isVisible().catch(() => true));
            console.log('Modal closed:', modalClosed);
        } else {
            console.log('❌ Backend error:', responseStatus, responseBody);
        }

        // ASSERTIONS
        expect(requestSent).toBe(true);
        expect(responseReceived).toBe(true);
        expect(responseStatus).toBe(201);
    });
});
