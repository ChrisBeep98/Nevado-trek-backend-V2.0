import type { Page } from '@playwright/test';

/**
 * Helper functions for Booking E2E tests
 */

const ADMIN_KEY = 'ntk_admin_prod_key_2025_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7';

// Track created resources for cleanup
const createdDepartureIds: string[] = [];
const createdBookingIds: string[] = [];

/**
 * Login as admin
 */
export async function loginAsAdmin(page: Page) {
    await page.goto('/login');
    await page.getByTestId('login-input').fill(ADMIN_KEY);
    await page.getByTestId('login-button').click();
    await page.waitForURL('/');
}

/**
 * Get first available tour ID from tours page
 */
export async function getTourId(page: Page): Promise<string> {
    await page.goto('/tours');
    await page.waitForURL('/tours');
    await page.waitForSelector('[data-testid^="tour-card-"]', { timeout: 10000 });
    const tourCard = page.locator('[data-testid^="tour-card-"]').first();
    const tourId = (await tourCard.getAttribute('data-testid'))?.replace('tour-card-', '');

    if (!tourId) {
        throw new Error('No tour found');
    }

    return tourId;
}

/**
 * Create a private departure and return its ID
 */
export async function createPrivateDeparture(
    page: Page,
    tourId: string,
    date: string
): Promise<void> {
    await page.goto('/');
    await page.waitForTimeout(2000);
    await page.getByTestId('new-departure-button').click();
    await page.getByTestId('input-date').fill(date);
    await page.getByTestId('select-type').selectOption('private');
    await page.getByTestId('input-price').fill('100000');
    await page.getByTestId('input-max-pax').fill('10');
    await page.getByTestId('select-tour').selectOption(tourId);
    await page.getByTestId('create-departure-button').click();

    // Wait for modal to close
    await page.waitForSelector('[data-testid="create-departure-button"]', {
        state: 'hidden',
        timeout: 10000
    });
    await page.waitForTimeout(2000); // Wait for calendar refresh
}

/**
 * Create a public departure and return its ID
 */
export async function createPublicDeparture(
    page: Page,
    tourId: string,
    date: string
): Promise<void> {
    await page.goto('/');
    await page.waitForTimeout(2000);
    await page.getByTestId('new-departure-button').click();
    await page.getByTestId('input-date').fill(date);
    await page.getByTestId('select-type').selectOption('public');
    await page.getByTestId('input-price').fill('100000');
    await page.getByTestId('input-max-pax').fill('8');
    await page.getByTestId('select-tour').selectOption(tourId);
    await page.getByTestId('create-departure-button').click();

    // Wait for modal to close
    await page.waitForSelector('[data-testid="create-departure-button"]', {
        state: 'hidden',
        timeout: 10000
    });
    await page.waitForTimeout(2000); // Wait for calendar refresh
}

/**
 * Search for a booking and open it
 */
export async function searchAndOpenBooking(
    page: Page,
    customerName: string
): Promise<void> {
    await page.goto('/bookings');
    await page.waitForURL('/bookings');
    await page.waitForLoadState('networkidle');

    // Search for booking
    await page.getByTestId('search-bookings-input').fill(customerName);
    await page.waitForTimeout(2000); // Wait for debounce

    // Retry logic for backend latency
    const row = page.locator('[data-testid^="booking-row-"]').first();
    try {
        await row.waitFor({ state: 'visible', timeout: 5000 });
    } catch (e) {
        console.log('Booking not found immediately, reloading...');
        await page.reload();
        await page.waitForLoadState('networkidle');
        await page.getByTestId('search-bookings-input').fill(customerName);
        await row.waitFor({ state: 'visible', timeout: 10000 });
    }

    // Click to open booking modal
    await row.click();
    await page.waitForTimeout(2000);
}

/**
 * Close any open modal
 */
export async function closeModal(page: Page): Promise<void> {
    const closeButton = page.getByTestId('close-modal-button');
    if (await closeButton.isVisible()) {
        await closeButton.click();
        await page.waitForTimeout(1000);
    }
}

/**
 * Add a booking to the currently open departure modal
 */
export async function addBookingToDeparture(
    page: Page,
    name: string,
    email: string,
    pax: number
): Promise<void> {
    await page.getByTestId('add-booking-button').click();
    await page.getByTestId('input-customer-name').fill(name);
    await page.getByTestId('input-customer-email').fill(email);
    await page.getByTestId('input-customer-phone').fill('+1234567890');
    await page.getByTestId('input-customer-document').fill('123456789');
    await page.getByTestId('input-pax').fill(pax.toString());
    await page.getByTestId('submit-booking-button').click();

    // Wait for booking modal to close (it returns to departure modal)
    await page.waitForSelector('[data-testid="submit-booking-button"]', { state: 'hidden' });
}

/**
 * Generate unique test identifier
 */
export function generateUniqueId(): string {
    return `${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

/**
 * Get date string for days from now
 */
export function getDateString(daysFromNow: number = 7): string {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date.toISOString().split('T')[0];
}

/**
 * Create a complete private booking (departure + booking) and navigate to it
 */
export async function createAndOpenPrivateBooking(
    page: Page,
    tourId: string,
    customerName: string,
    pax: number = 2
): Promise<void> {
    const date = getDateString(7);
    const email = `${customerName.replace(/\s/g, '')}@test.com`;

    // Create private departure
    await createPrivateDeparture(page, tourId, date);

    // Add booking
    await addBookingToDeparture(page, customerName, email, pax);

    // Navigate to bookings and open it
    await searchAndOpenBooking(page, customerName);
}

/**
 * Create public departure with multiple bookings
 */
export async function createPublicDepartureWithBookings(
    page: Page,
    tourId: string,
    bookingCount: number = 2
): Promise<string[]> {
    const uniqueId = generateUniqueId();
    const date = getDateString(7);
    const customerNames: string[] = [];

    // Create public departure ONCE
    await createPublicDeparture(page, tourId, date);

    // Add bookings to the SAME departure
    for (let i = 0; i < bookingCount; i++) {
        const customerName = `Public Test ${i + 1} ${uniqueId}`;
        customerNames.push(customerName);
        const email = `public${i + 1}_${uniqueId}@test.com`;

        if (i > 0) {
            // For subsequent bookings, re-open the same departure
            await page.goto('/');
            await page.waitForTimeout(2000);

            // Click the most recent event (should be our public departure)
            const event = page.locator('.fc-event').last();
            await event.click();
            await page.waitForTimeout(2000);
            await page.getByTestId('tab-bookings').click();
            await page.waitForTimeout(1000);
        }

        await addBookingToDeparture(page, customerName, email, 1);

        // Close DepartureModal after each booking
        await closeModal(page);
        await page.waitForTimeout(1000);
    }

    return customerNames;
}

/**
 * Cleanup all created test data
 * Call this in test.afterEach() or test.afterAll()
 */
export async function cleanupTestData(page: Page): Promise<void> {
    // Note: This requires backend API endpoints for deletion
    // For now, we rely on manual cleanup script
    console.log('Test cleanup - departures and bookings will be removed by cleanup script');
}
