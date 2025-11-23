import { test, expect } from '@playwright/test';
import axios from 'axios';
import {
    loginAsAdmin,
    getTourId,
    searchAndOpenBooking,
    generateUniqueId,
    getDateString,
    createPrivateBookingViaAPI,
    createPublicBookingViaAPI
} from './helpers/booking-helpers';

const API_URL = 'https://api-wgfhwjbpva-uc.a.run.app';
const ADMIN_KEY = 'ntk_admin_prod_key_2025_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7';
const headers = {
    'X-Admin-Secret-Key': ADMIN_KEY,
    'Content-Type': 'application/json'
};

test.describe('BookingModal - UI & API Tests', () => {
    test.setTimeout(120000);

    test.beforeEach(async ({ page }) => {
        await loginAsAdmin(page);
    });

    // ============================================================
    // PRIVATE BOOKINGS
    // ============================================================
    test.describe('Private Bookings', () => {

        test('should create private booking and verify type', async ({ page }) => {
            test.setTimeout(60000);

            const uniqueId = generateUniqueId();
            const customerName = `PrivateTest_${uniqueId}`;
            const tourId = await getTourId(page);

            // Create via API
            const { bookingId } = await createPrivateBookingViaAPI(tourId, customerName, 2);

            // Verify via API
            const response = await axios.get(`${API_URL}/admin/bookings/${bookingId}`, { headers });
            const booking = response.data.booking || response.data;

            expect(booking.type).toBe('private');
            expect(booking.pax).toBe(2);
            expect(booking.customer.name).toBe(customerName);

            // Verify UI shows correct type
            await searchAndOpenBooking(page, customerName);
            const typeChip = page.getByTestId('booking-type-chip');
            await expect(typeChip).toBeVisible();
            const typeText = await typeChip.textContent();
            expect(typeText?.toUpperCase()).toContain('PRIVATE');
        });

        test('should update tour for private booking via UI Dropdown', async ({ page }) => {
            test.setTimeout(90000);

            const uniqueId = generateUniqueId();
            const customerName = `TourUpdateUI_${uniqueId}`;

            // Get 2 tours
            const toursResponse = await axios.get(`${API_URL}/admin/tours`, { headers });
            const tours = toursResponse.data.tours || toursResponse.data;

            if (tours.length < 2) {
                test.skip(true, 'Need at least 2 tours');
                return;
            }

            const tour1Id = tours[0].tourId;
            const tour2Id = tours[1].tourId;

            // Create booking with tour1
            const { bookingId } = await createPrivateBookingViaAPI(tour1Id, customerName, 2);

            // Open booking in UI
            await searchAndOpenBooking(page, customerName);

            // Go to Actions tab (wait for it to be visible)
            await page.getByTestId('tab-actions').click();

            // Select new tour from dropdown
            // Note: The select element has data-testid="input-update-tour"
            await page.getByTestId('input-update-tour').selectOption(tour2Id);

            // Click update
            await page.getByTestId('button-update-tour').click();

            // Wait for update
            await page.waitForTimeout(3000);

            // Verify via API that tour changed
            const updatedResponse = await axios.get(`${API_URL}/admin/bookings/${bookingId}`, { headers });
            const updatedBooking = updatedResponse.data.booking || updatedResponse.data;

            // Get departure to check tourId
            const depResponse = await axios.get(`${API_URL}/admin/departures/${updatedBooking.departureId}`, { headers });
            const departure = depResponse.data.departure || depResponse.data;

            expect(departure.tourId).toBe(tour2Id);
            console.log(`✓ Tour updated via UI Dropdown`);
        });

        test('should update booking status via UI Dropdown', async ({ page }) => {
            test.setTimeout(60000);

            const uniqueId = generateUniqueId();
            const customerName = `StatusUpdate_${uniqueId}`;
            const tourId = await getTourId(page);

            // Create booking
            const { bookingId } = await createPrivateBookingViaAPI(tourId, customerName, 1);

            // Open booking in UI
            await searchAndOpenBooking(page, customerName);

            // Go to Status tab
            await page.getByTestId('tab-status').click();

            // Change status to 'confirmed' via dropdown
            await page.getByTestId('status-select').selectOption('confirmed');

            // Wait for update (it's immediate on change)
            await page.waitForTimeout(2000);

            // Verify via API
            const response = await axios.get(`${API_URL}/admin/bookings/${bookingId}`, { headers });
            const booking = response.data.booking || response.data;

            expect(booking.status).toBe('confirmed');
            console.log(`✓ Status updated to confirmed via UI Dropdown`);
        });

        test('should update date for private booking via API', async ({ page }) => {
            test.setTimeout(60000);

            const uniqueId = generateUniqueId();
            const customerName = `DateUpdate_${uniqueId}`;
            const tourId = await getTourId(page);

            // Create booking
            const { bookingId, departureId } = await createPrivateBookingViaAPI(tourId, customerName, 2);

            // Get initial departure
            const initialDepResponse = await axios.get(`${API_URL}/admin/departures/${departureId}`, { headers });
            const initialDeparture = initialDepResponse.data.departure || initialDepResponse.data;
            const initialDate = initialDeparture.date;

            // Update date via API (PUT)
            const newDate = getDateString(20);
            await axios.put(`${API_URL}/admin/departures/${departureId}/date`,
                { newDate },
                { headers }
            );

            // Wait for backend
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Verify date changed
            const updatedDepResponse = await axios.get(`${API_URL}/admin/departures/${departureId}`, { headers });
            const updatedDeparture = updatedDepResponse.data.departure || updatedDepResponse.data;
            const updatedDate = updatedDeparture.date;

            expect(updatedDate).not.toBe(initialDate);
            expect(updatedDate).toContain(newDate);

            console.log(`✓ Date updated from ${initialDate} to ${updatedDate}`);
        });
    });

    // ============================================================
    // PUBLIC BOOKINGS
    // ============================================================
    test.describe('Public Bookings', () => {

        test('should create public booking and verify type', async ({ page }) => {
            test.setTimeout(60000);

            const uniqueId = generateUniqueId();
            const customerName = `PublicTest_${uniqueId}`;
            const tourId = await getTourId(page);

            // Create via API
            const { bookingId } = await createPublicBookingViaAPI(tourId, customerName, 1);

            // Verify via API
            const response = await axios.get(`${API_URL}/admin/bookings/${bookingId}`, { headers });
            const booking = response.data.booking || response.data;

            expect(booking.type).toBe('public');
            expect(booking.pax).toBe(1);

            // Verify UI shows correct type
            await searchAndOpenBooking(page, customerName);
            const typeChip = page.getByTestId('booking-type-chip');
            await expect(typeChip).toBeVisible();
            const typeText = await typeChip.textContent();
            expect(typeText?.toUpperCase()).toContain('PUBLIC');

            console.log(`✓ Public booking created with type: ${booking.type}`);
        });

        test('should convert public to private via API', async ({ page }) => {
            test.setTimeout(90000);

            const uniqueId = generateUniqueId();
            const customerName = `ConvertTest_${uniqueId}`;
            const tourId = await getTourId(page);

            // Create public booking
            const { bookingId } = await createPublicBookingViaAPI(tourId, customerName, 1);

            // Verify initial type
            const initialResponse = await axios.get(`${API_URL}/admin/bookings/${bookingId}`, { headers });
            const initialBooking = initialResponse.data.booking || initialResponse.data;
            expect(initialBooking.type).toBe('public');

            // Convert to private via API
            await axios.post(`${API_URL}/admin/bookings/${bookingId}/convert-type`,
                { targetType: 'private' },
                { headers }
            );

            // Wait for backend
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Verify type changed
            const updatedResponse = await axios.get(`${API_URL}/admin/bookings/${bookingId}`, { headers });
            const updatedBooking = updatedResponse.data.booking || updatedResponse.data;
            expect(updatedBooking.type).toBe('private');

            console.log(`✓ Booking converted: public → private`);
        });

        test('should show blocked UI for public bookings', async ({ page }) => {
            test.setTimeout(60000);

            const uniqueId = generateUniqueId();
            const customerName = `BlockedUI_${uniqueId}`;
            const tourId = await getTourId(page);

            // Create public booking
            await createPublicBookingViaAPI(tourId, customerName, 1);

            // Open in UI
            await searchAndOpenBooking(page, customerName);

            // Navigate to Actions tab
            await page.getByTestId('tab-actions').click();
            await page.waitForTimeout(1000);

            // Verify blocked state UI elements are present
            await expect(page.getByTestId('inline-convert-private-button')).toBeVisible();

            // Verify update inputs are NOT visible (blocked)
            const updateDateInput = page.getByTestId('input-update-date');
            const isDateInputVisible = await updateDateInput.isVisible().catch(() => false);
            expect(isDateInputVisible).toBe(false);

            // For public bookings, date/tour inputs should be in blocked section (not directly editable)
            console.log(`✓ Public booking UI correctly shows blocked state`);
        });
    });

    // ============================================================
    // EDGE CASES
    // ============================================================
    test.describe('Edge Cases', () => {

        test('should verify capacity is updated correctly', async ({ page }) => {
            test.setTimeout(60000);

            const uniqueId = generateUniqueId();
            const customerName = `CapacityTest_${uniqueId}`;
            const tourId = await getTourId(page);

            // Create public booking with 2 pax
            const { bookingId, departureId } = await createPublicBookingViaAPI(tourId, customerName, 2);

            // Get departure capacity
            const depResponse = await axios.get(`${API_URL}/admin/departures/${departureId}`, { headers });
            const departure = depResponse.data.departure || depResponse.data;

            expect(departure.currentPax).toBe(2);
            expect(departure.maxPax).toBe(8); // Public departures have max 8

            console.log(`✓ Capacity correctly set: ${departure.currentPax}/${departure.maxPax}`);
        });

        test('should verify ghost departures are cleaned up', async ({ page }) => {
            test.setTimeout(90000);

            const uniqueId = generateUniqueId();
            const customerName = `GhostTest_${uniqueId}`;
            const tourId = await getTourId(page);

            // Create booking 1 (Creates Departure A)
            const { bookingId, departureId } = await createPublicBookingViaAPI(tourId, customerName, 1);

            // Move booking to a new date (Should create Departure B and delete Departure A)
            const newDate = getDateString(30);

            await axios.post(`${API_URL}/admin/bookings/${bookingId}/move`,
                { newTourId: tourId, newDate },
                { headers }
            );

            // Wait for cleanup
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Try to get old departure - should be deleted (404)
            try {
                await axios.get(`${API_URL}/admin/departures/${departureId}`, { headers });
                // If we got here, departure was NOT deleted (fail)
                expect(true).toBe(false); // Force fail
            } catch (error: any) {
                // Should get 404 - departure was deleted ✓
                expect(error.response?.status).toBe(404);
                console.log(`✓ Ghost departure correctly cleaned up (404)`);
            }
        });
    });
});
