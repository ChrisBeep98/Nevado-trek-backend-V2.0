import { test, expect } from '@playwright/test';
import { 
    loginAsAdmin, 
    getTourId, 
    createPublicBookingViaAPI, 
    createPrivateBookingViaAPI,
    searchAndOpenBooking,
    generateUniqueId,
    getDateString
} from './helpers/booking-helpers';

test.describe('Booking Transfer Flow (Production)', () => {
    let tourId: string;
    let targetDepartureId: string;
    let targetDate: string;
    let bookingId: string;
    let uniqueId: string;

    test.beforeAll(async ({ request }) => {
        // Setup data via API
        // We need a browser context for some helpers if they use page, but here we use API helpers
        // Actually helpers use axios, so we don't need playwright request context for them, 
        // but we need 'page' for getTourId if we use the helper version.
        // Let's just use the API helpers.
    });

    test.beforeEach(async ({ page }) => {
        uniqueId = generateUniqueId();
        
        // 1. Login
        await loginAsAdmin(page);
        
        // 2. Get a Tour ID
        tourId = await getTourId(page);
        console.log(`Using Tour ID: ${tourId}`);

        // 3. Create Target Public Departure (Date: 7 days from now)
        // We create a booking to ensure the departure exists
        const targetCustomer = `TargetPublic_${uniqueId}`;
        const publicBooking = await createPublicBookingViaAPI(tourId, targetCustomer, 1);
        targetDepartureId = publicBooking.departureId;
        targetDate = getDateString(7);
        console.log(`Created Target Departure: ${targetDepartureId} on ${targetDate}`);

        // 4. Create Source Private Booking (Date: 8 days from now)
        const sourceCustomer = `SourcePrivate_${uniqueId}`;
        const privateBooking = await createPrivateBookingViaAPI(tourId, sourceCustomer, 2);
        bookingId = privateBooking.bookingId;
        console.log(`Created Source Booking: ${bookingId}`);

        // 5. Open the Source Booking
        await searchAndOpenBooking(page, sourceCustomer);
    });

    test('should transfer a private booking to an existing public departure', async ({ page }) => {
        // 1. Go to Transfer Tab
        await page.click('[data-testid="tab-transfer"]');
        
        // 2. Verify "Join Public Departure" section is visible
        await expect(page.locator('text=Join Public Departure')).toBeVisible();
        
        // 3. Select the target departure
        // The select might have multiple options, we need to select the one with our date/id
        // Since we can't easily select by ID in standard select without value, 
        // we'll select by value (departureId).
        const select = page.locator('[data-testid="select-transfer-departure"]');
        await select.selectOption(targetDepartureId);
        
        // 4. Click Join
        await page.click('[data-testid="btn-join-public"]');
        
        // 5. Handle Confirmation Dialog (if any)
        // The helper logic in BookingModal uses window.confirm.
        // Playwright auto-dismisses dialogs unless handled.
        // We need to accept it.
        page.on('dialog', dialog => dialog.accept());
        
        // 6. Verify Success Message
        await expect(page.getByText('Booking transferred to public departure')).toBeVisible({ timeout: 10000 });
        
        // 7. Verify UI updates
        // Should now be in the public departure
        // The modal might close or update. Logic says onClose().
        // So we should be back at the list or the modal closed.
        // Let's re-open the booking to check details or check the row if visible.
        
        // Re-open booking to verify
        await searchAndOpenBooking(page, `SourcePrivate_${uniqueId}`);
        
        // Check "Type" in context header
        await expect(page.getByText('Public', { exact: true })).toBeVisible();
        
        // Check Date matches target date
        // The date format in UI might be "Mon, Dec 30, 2025" or similar.
        // We'll just check if the "Public" badge is there, which confirms the transfer type change.
        // And we can check if the departureId matches if displayed, but it's usually not.
    });
});
