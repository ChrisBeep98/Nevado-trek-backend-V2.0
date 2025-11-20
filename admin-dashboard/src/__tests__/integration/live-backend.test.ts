// @vitest-environment node
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const API_BASE_URL = 'https://api-wgfhwjbpva-uc.a.run.app';
const SECRET_FILE_PATH = path.resolve(__dirname, '../../../../secret_value.txt');

let ADMIN_KEY: string | undefined;

try {
    if (fs.existsSync(SECRET_FILE_PATH)) {
        ADMIN_KEY = fs.readFileSync(SECRET_FILE_PATH, 'utf-8').trim();
        console.log(`✓ Loaded ADMIN_KEY. Length: ${ADMIN_KEY.length}`);
    }
} catch (e) {
    console.error('Error reading secret file:', e);
}

const authHeaders = {
    'X-Admin-Secret-Key': ADMIN_KEY || ''
};

const jsonHeaders = {
    ...authHeaders,
    'Content-Type': 'application/json'
};

describe.skipIf(!ADMIN_KEY)('Live Backend Integration Tests', () => {
    let createdTourId: string;

    it('Fetches Public Tours (GET /public/tours)', async () => {
        const response = await fetch(`${API_BASE_URL}/public/tours`);
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(Array.isArray(data)).toBe(true);
        console.log(`✓ Public tours fetched: ${data.length} tours`);
    });

    it('Fetches Tours with Auth (GET /admin/tours)', async () => {
        const response = await fetch(`${API_BASE_URL}/admin/tours`, { headers: authHeaders });
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(Array.isArray(data)).toBe(true);
        console.log(`✓ Admin tours fetched: ${data.length} tours`);
    });

    it('Fetches Departures (GET /admin/departures)', async () => {
        const response = await fetch(`${API_BASE_URL}/admin/departures?start=2023-01-01&end=2025-12-31`, {
            headers: authHeaders
        });
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(Array.isArray(data)).toBe(true);
        console.log(`✓ Departures fetched: ${data.length} departures`);
    });

    it('Creates a Test Tour (POST /admin/tours)', async () => {
        const newTour = {
            name: { en: 'Integration Test Tour', es: 'Tour de Prueba' },
            description: { en: 'Test Description', es: 'Descripción de Prueba' },
            type: 'multi-day',
            totalDays: 3,
            difficulty: 'Easy',
            isActive: false,
            version: 1,
            temperature: 15,
            distance: 20,
            location: { en: 'Nevado del Ruiz', es: 'Nevado del Ruiz' },
            altitude: { en: '5000m', es: '5000m' },
            faqs: [
                {
                    question: { en: 'What is the difficulty level?', es: '¿Cuál es el nivel de dificultad?' },
                    answer: { en: 'This tour is rated as Easy and suitable for most fitness levels.', es: 'Este tour está clasificado como Fácil y es adecuado para la mayoría de niveles de fitness.' }
                },
                {
                    question: { en: 'Do I need previous experience?', es: '¿Necesito experiencia previa?' },
                    answer: { en: 'No previous experience is required for this tour.', es: 'No se requiere experiencia previa para este tour.' }
                }
            ],
            recommendations: [
                { en: 'Bring warm clothing', es: 'Traer ropa abrigada' },
                { en: 'Stay hydrated', es: 'Mantenerse hidratado' },
                { en: 'Use sunscreen', es: 'Usar protector solar' }
            ],
            inclusions: [
                { en: 'Professional guide', es: 'Guía profesional' },
                { en: 'Meals during the tour', es: 'Comidas durante el tour' },
                { en: 'Transportation', es: 'Transporte' },
                { en: 'Safety equipment', es: 'Equipo de seguridad' }
            ],
            exclusions: [
                { en: 'Personal expenses', es: 'Gastos personales' },
                { en: 'Travel insurance', es: 'Seguro de viaje' },
                { en: 'Alcoholic beverages', es: 'Bebidas alcohólicas' }
            ],
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
            console.error(`Create Tour Failed: ${response.status} - ${text}`);
            throw new Error(`Create Tour Failed: ${response.status} - ${text}`);
        }

        const data = await response.json();
        expect(data).toHaveProperty('tourId');
        createdTourId = data.tourId;
        console.log(`✓ Tour created: ${createdTourId}`);
    });

    it('Updates the Test Tour (PUT /admin/tours/:id)', async () => {
        if (!createdTourId) {
            console.warn('⚠ Skipping update test - no tour was created');
            return;
        }

        const updateData = {
            difficulty: 'Hard'
        };
        const response = await fetch(`${API_BASE_URL}/admin/tours/${createdTourId}`, {
            method: 'PUT',
            headers: jsonHeaders,
            body: JSON.stringify(updateData)
        });

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.success).toBe(true);

        // Verify the update by fetching the tour
        const verifyResponse = await fetch(`${API_BASE_URL}/admin/tours/${createdTourId}`, {
            headers: authHeaders
        });
        const updatedTour = await verifyResponse.json();
        expect(updatedTour.difficulty).toBe('Hard');
        console.log(`✓ Tour updated: ${createdTourId}`);
    });

    it('Deletes the Test Tour (DELETE /admin/tours/:id)', async () => {
        if (!createdTourId) {
            console.warn('⚠ Skipping delete test - no tour was created');
            return;
        }

        const response = await fetch(`${API_BASE_URL}/admin/tours/${createdTourId}`, {
            method: 'DELETE',
            headers: authHeaders
        });
        expect(response.status).toBe(200);
        console.log(`✓ Tour deleted: ${createdTourId}`);
    });
});
