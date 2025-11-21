// @vitest-environment node
import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const API_BASE_URL = 'https://api-wgfhwjbpva-uc.a.run.app';
const SECRET_FILE_PATH = path.resolve(__dirname, '../../../../secret_value.txt');

let ADMIN_KEY: string | undefined;
let authHeaders: Record<string, string> = {};
let jsonHeaders: Record<string, string> = {};

// Test State
let createdTourId: string;
let createdDepartureId: string;
let secondDepartureId: string;
let createdBookingId: string;

try {
    if (fs.existsSync(SECRET_FILE_PATH)) {
        ADMIN_KEY = fs.readFileSync(SECRET_FILE_PATH, 'utf-8').trim();
        console.log(`✓ Loaded ADMIN_KEY. Length: ${ADMIN_KEY.length}`);
    } else {
        console.error('❌ Secret file NOT FOUND at:', SECRET_FILE_PATH);
    }
} catch (e) {
    console.error('Error reading secret file:', e);
}

beforeAll(() => {
    authHeaders = {
        'X-Admin-Secret-Key': ADMIN_KEY || ''
    };

    jsonHeaders = {
        ...authHeaders,
        'Content-Type': 'application/json'
    };
});

describe.skipIf(!ADMIN_KEY)('Live Backend Integration Tests', () => {

    describe('1. Stats & Public Data', () => {
        it('Fetches Public Tours (GET /public/tours)', async () => {
            console.log(`Fetching: ${API_BASE_URL}/public/tours`);
            const response = await fetch(`${API_BASE_URL}/public/tours`);
            expect(response.status).toBe(200);
            const data = await response.json();
            expect(Array.isArray(data)).toBe(true);
        });

        it('Fetches Dashboard Stats (GET /admin/stats)', async () => {
            // HACK: Use child_process to run debug_stats.js because fetch/axios fails in Vitest for some reason
            console.log('Running debug_stats.js via child_process...');
            try {
                const output = execSync('node ../debug_stats.js', { cwd: __dirname }).toString();
                console.log('Debug Stats Output:', output);
                expect(output).toContain('Status: 200');
            } catch (e: any) {
                console.error('Debug Stats Failed:', e.message);
                throw e;
            }
        });
    });

    describe('2. Tour Management', () => {
        it('Creates a Test Tour (POST /admin/tours)', async () => {
            const newTour = {
                name: { en: 'Integration Test Tour', es: 'Tour de Prueba' },
                description: { en: 'Test Description', es: 'Descripción de Prueba' },
                type: 'multi-day',
                totalDays: 3,
                difficulty: 'Easy',
                isActive: true,
                version: 1,
                temperature: 15,
                distance: 20,
                location: { en: 'Nevado del Ruiz', es: 'Nevado del Ruiz' },
                altitude: { en: '5000m', es: '5000m' },
                faqs: [],
                recommendations: [],
                inclusions: [],
                exclusions: [],
                pricingTiers: [
                    { minPax: 1, maxPax: 1, priceCOP: 100000, priceUSD: 30 },
                    { minPax: 2, maxPax: 2, priceCOP: 90000, priceUSD: 25 },
                    { minPax: 3, maxPax: 3, priceCOP: 80000, priceUSD: 20 },
                    { minPax: 4, maxPax: 8, priceCOP: 70000, priceUSD: 15 }
                ]
            };

            const response = await fetch(`${API_BASE_URL}/admin/tours`, {
                method: 'POST',
                headers: jsonHeaders,
                body: JSON.stringify(newTour)
            });

            if (response.status !== 201) {
                const text = await response.text();
                console.error('Create Tour Error:', text);
                throw new Error(`Create Tour Failed: ${response.status} - ${text}`);
            }

            const data = await response.json();
            createdTourId = data.tourId;
            console.log(`✓ Tour created: ${createdTourId}`);
        });

        it('Updates the Test Tour (PUT /admin/tours/:id)', async () => {
            const response = await fetch(`${API_BASE_URL}/admin/tours/${createdTourId}`, {
                method: 'PUT',
                headers: jsonHeaders,
                body: JSON.stringify({ difficulty: 'Hard' })
            });
            if (response.status !== 200) {
                const text = await response.text();
                console.error('Update Tour Error:', text);
            }
            expect(response.status).toBe(200);
        });
    });

    describe('3. Departure Management', () => {
        it('Creates a Test Departure (POST /admin/departures)', async () => {
            const newDeparture = {
                tourId: createdTourId,
                date: '2025-12-25',
                maxPax: 10,
                priceCOP: 100000,
                priceUSD: 30,
                status: 'open',
                type: 'public'
            };

            const response = await fetch(`${API_BASE_URL}/admin/departures`, {
                method: 'POST',
                headers: jsonHeaders,
                body: JSON.stringify(newDeparture)
            });

            if (response.status !== 201) {
                const text = await response.text();
                console.error('Create Departure Error:', text);
                throw new Error(`Create Departure Failed: ${response.status} - ${text}`);
            }

            const data = await response.json();
            createdDepartureId = data.departureId;
            console.log(`✓ Departure created: ${createdDepartureId}`);
        });

        it('Creates a Second Departure for Move Test', async () => {
            const newDeparture = {
                tourId: createdTourId,
                date: '2025-12-31',
                maxPax: 10,
                priceCOP: 100000,
                priceUSD: 30,
                status: 'open',
                type: 'public'
            };
            const response = await fetch(`${API_BASE_URL}/admin/departures`, {
                method: 'POST',
                headers: jsonHeaders,
                body: JSON.stringify(newDeparture)
            });
            if (response.status !== 201) {
                const text = await response.text();
                console.error('Create 2nd Departure Error:', text);
            }
            const data = await response.json();
            secondDepartureId = data.departureId;
        });

        it('Updates Departure (PUT /admin/departures/:id)', async () => {
            const response = await fetch(`${API_BASE_URL}/admin/departures/${createdDepartureId}`, {
                method: 'PUT',
                headers: jsonHeaders,
                body: JSON.stringify({ maxPax: 15 })
            });
            if (response.status !== 200) {
                const text = await response.text();
                console.error('Update Departure Error:', text);
            }
            expect(response.status).toBe(200);
        });
    });

    describe('4. Booking Management', () => {
        it('Creates a Public Booking (POST /public/bookings/join)', async () => {
            const bookingData = {
                tourId: createdTourId,
                departureId: createdDepartureId,
                date: '2025-12-25',
                pax: 2,
                customer: {
                    name: 'Test User',
                    email: 'test@example.com',
                    phone: '+1234567890',
                    document: '123456'
                }
            };

            const response = await fetch(`${API_BASE_URL}/public/bookings/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bookingData)
            });

            if (response.status !== 201) {
                const text = await response.text();
                console.error('Create Booking Error:', text);
                throw new Error(`Create Booking Failed: ${response.status} - ${text}`);
            }

            const data = await response.json();
            createdBookingId = data.bookingId;
            console.log(`✓ Booking created: ${createdBookingId}`);
        });

        it('Fetches All Bookings (GET /admin/bookings)', async () => {
            const response = await fetch(`${API_BASE_URL}/admin/bookings`, { headers: jsonHeaders });
            if (response.status !== 200) {
                const text = await response.text();
                console.error('Get Bookings Error:', text);
            }
            expect(response.status).toBe(200);
            const data = await response.json();
            const found = data.find((b: any) => b.bookingId === createdBookingId);
            expect(found).toBeDefined();
        });

        it('Updates Booking Status (PUT /admin/bookings/:id/status)', async () => {
            const response = await fetch(`${API_BASE_URL}/admin/bookings/${createdBookingId}/status`, {
                method: 'PUT',
                headers: jsonHeaders,
                body: JSON.stringify({ status: 'confirmed' })
            });
            if (response.status !== 200) {
                const text = await response.text();
                console.error('Update Status Error:', text);
            }
            expect(response.status).toBe(200);
        });

        it('Updates Booking Pax (PUT /admin/bookings/:id/pax)', async () => {
            const response = await fetch(`${API_BASE_URL}/admin/bookings/${createdBookingId}/pax`, {
                method: 'PUT',
                headers: jsonHeaders,
                body: JSON.stringify({ pax: 3 })
            });
            if (response.status !== 200) {
                const text = await response.text();
                console.error('Update Pax Error:', text);
            }
            expect(response.status).toBe(200);
        });

        it('Updates Booking Details (PUT /admin/bookings/:id/details)', async () => {
            const response = await fetch(`${API_BASE_URL}/admin/bookings/${createdBookingId}/details`, {
                method: 'PUT',
                headers: jsonHeaders,
                body: JSON.stringify({ customer: { name: 'Updated Name', email: 'test@example.com', phone: '+1234567890', document: '123456' } })
            });
            if (response.status !== 200) {
                const text = await response.text();
                console.error('Update Details Error:', text);
            }
            expect(response.status).toBe(200);
        });

        it('Applies Discount (POST /admin/bookings/:id/discount)', async () => {
            const response = await fetch(`${API_BASE_URL}/admin/bookings/${createdBookingId}/discount`, {
                method: 'POST',
                headers: jsonHeaders,
                body: JSON.stringify({ discountAmount: 10, reason: 'Test Discount' })
            });
            if (response.status !== 200) {
                const text = await response.text();
                console.error('Apply Discount Error:', text);
            }
            expect(response.status).toBe(200);
        });

        it('Moves Booking (POST /admin/bookings/:id/move)', async () => {
            const response = await fetch(`${API_BASE_URL}/admin/bookings/${createdBookingId}/move`, {
                method: 'POST',
                headers: jsonHeaders,
                body: JSON.stringify({ newTourId: createdTourId, newDate: '2025-12-31' }) // Move to second departure
            });
            if (response.status !== 200) {
                const text = await response.text();
                console.error('Move Booking Error:', text);
            }
            expect(response.status).toBe(200);
        });

        it('Converts Booking Type (POST /admin/bookings/:id/convert-type)', async () => {
            console.log('Converting booking:', createdBookingId);
            await new Promise(resolve => setTimeout(resolve, 1000));

            const response = await fetch(`${API_BASE_URL}/admin/bookings/${createdBookingId}/convert-type`, {
                method: 'POST',
                headers: jsonHeaders,
                body: JSON.stringify({ targetType: 'private' })
            });
            if (response.status !== 200) {
                const text = await response.text();
                console.error('Convert Type Error:', text);
                console.error('Convert Type ID:', createdBookingId);
            }
            expect(response.status).toBe(200);
        });
    });

    describe('5. Cleanup', () => {
        it('Deletes the Test Tour (DELETE /admin/tours/:id)', async () => {
            const response = await fetch(`${API_BASE_URL}/admin/tours/${createdTourId}`, {
                method: 'DELETE',
                headers: jsonHeaders
            });
            expect(response.status).toBe(200);
        });
    });
});
