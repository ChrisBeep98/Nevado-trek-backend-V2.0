import type { Page } from '@playwright/test';
import axios from 'axios';

/**
 * Helper functions for Booking E2E tests
 * Uses direct API calls for reliable test data creation
 */

const ADMIN_KEY = 'ntk_admin_prod_key_2025_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7';
const API_URL = 'https://api-wgfhwjbpva-uc.a.run.app';

const headers = {
    'X-Admin-Secret-Key': ADMIN_KEY,
    'Content-Type': 'application/json'
};

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
 * Get first available tour ID from backend
 */
export async function getTourId(page: Page): Promise<string> {
    try {
        const response = await axios.get(`${API_URL}/admin/tours`, { headers });
        const tours = response.data.tours || response.data;
        if (!tours || tours.length === 0) {
            throw new Error('No tours found in database');
        }
        return tours[0].tourId;
    } catch (error) {
        console.error('Failed to get tour ID:', error);
        throw error;
    }
}

/**
 * Create a private booking via API and return booking ID
 */
export async function createPrivateBookingViaAPI(
    tourId: string,
    customerName: string,
    pax: number = 2
): Promise<{ bookingId: string, departureId: string }> {
    const date = getDateString(7);
    const email = `${customerName.replace(/\s/g, '').toLowerCase()}@test.com`;

    const bookingData = {
        tourId,
        date,
        type: 'private',
        customer: {
            name: customerName,
            email,
            phone: '+1234567890',
            document: 'TEST123456'
        },
        pax
    };

    try {
        const response = await axios.post(`${API_URL}/admin/bookings`, bookingData, { headers });
        return {
            bookingId: response.data.bookingId,
            departureId: response.data.departureId
        };
    } catch (error) {
        console.error('Failed to create private booking:', error);
        throw error;
    }
}

/**
 * Create a public booking via API
 */
export async function createPublicBookingViaAPI(
    tourId: string,
    customerName: string,
    pax: number = 1
): Promise<{ bookingId: string, departureId: string }> {
    const date = getDateString(7);
    const email = `${customerName.replace(/\s/g, '').toLowerCase()}@test.com`;

    const bookingData = {
        tourId,
        date,
        type: 'public',
        customer: {
            name: customerName,
            email,
            phone: '+1234567890',
            document: 'TEST123456'
        },
        pax
    };

    try {
        const response = await axios.post(`${API_URL}/admin/bookings`, bookingData, { headers });
        return {
            bookingId: response.data.bookingId,
            departureId: response.data.departureId
        };
    } catch (error) {
        console.error('Failed to create public booking:', error);
        throw error;
    }
}

/**
 * Search for a booking and open it in the UI
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
 * Create a complete private booking via API and navigate to it
 */
export async function createAndOpenPrivateBooking(
    page: Page,
    tourId: string,
    customerName: string,
    pax: number = 2
): Promise<void> {
    // Create booking via API
    await createPrivateBookingViaAPI(tourId, customerName, pax);

    // Navigate to bookings and open it
    await searchAndOpenBooking(page, customerName);
}

/**
 * Create public departure with multiple bookings via API
 * Returns array of customer names for later retrieval
 */
export async function createPublicDepartureWithBookings(
    page: Page,
    tourId: string,
    bookingCount: number = 2
): Promise<string[]> {
    const uniqueId = generateUniqueId();
    const customerNames: string[] = [];

    // Create first booking (creates the public departure)
    const customerName1 = `PublicTest1_${uniqueId}`;
    customerNames.push(customerName1);
    const { departureId } = await createPublicBookingViaAPI(tourId, customerName1, 1);

    // Add additional bookings to the SAME departure using join endpoint
    for (let i = 1; i < bookingCount; i++) {
        const customerName = `PublicTest${i + 1}_${uniqueId}`;
        customerNames.push(customerName);
        const email = `publictest${i + 1}_${uniqueId}@test.com`;

        const joinData = {
            departureId,
            customer: {
                name: customerName,
                email,
                phone: '+1234567890',
                document: 'TEST123456'
            },
            pax: 1
        };

        try {
            await axios.post(`${API_URL}/public/bookings/join`, joinData, {
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (error) {
            console.error(`Failed to join booking ${i + 1}:`, error);
            throw error;
        }
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
