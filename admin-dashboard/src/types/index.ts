export interface PricingTier {
    minPax: number;
    maxPax: number;
    priceCOP: number;
    priceUSD: number;
}

export interface Tour {
    tourId: string;
    name: { es: string; en: string };
    description: { es: string; en: string };
    type: 'multi-day' | 'single-day';
    totalDays: number;
    difficulty: string;
    isActive: boolean;
    pricingTiers: PricingTier[];
    version: number;
}

export interface Departure {
    departureId: string;
    tourId: string;
    date: string; // ISO Date
    type: 'public' | 'private';
    status: 'open' | 'closed' | 'completed' | 'cancelled';
    maxPax: number;
    currentPax: number;
    pricingSnapshot: PricingTier[];
    createdAt: string;
}

export interface Booking {
    bookingId: string;
    departureId: string;
    customer: {
        name: string;
        email: string;
        phone: string;
        document: string;
        note?: string;
    };
    pax: number;
    originalPrice: number;
    finalPrice: number;
    status: 'pending' | 'confirmed' | 'paid' | 'cancelled';
    createdAt: string;
}
