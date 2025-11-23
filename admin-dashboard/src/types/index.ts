export interface PricingTier {
    minPax: number;
    maxPax: number;
    priceCOP: number;
    priceUSD: number;
}

export interface BilingualContent {
    es: string;
    en: string;
}

export interface Tour {
    tourId: string;
    name: BilingualContent;
    description: BilingualContent;
    shortDescription?: BilingualContent;
    type: 'multi-day' | 'single-day';
    totalDays: number;
    difficulty: string;
    isActive: boolean;
    pricingTiers: PricingTier[];
    version: number;

    // Extended fields
    altitude?: BilingualContent;
    temperature?: number;
    distance?: number;
    location?: BilingualContent;
    faqs?: Array<{
        question: BilingualContent;
        answer: BilingualContent;
    }>;
    recommendations?: BilingualContent[];
    inclusions?: BilingualContent[];
    exclusions?: BilingualContent[];
    itinerary?: {
        days: Array<{
            dayNumber: number;
            title: BilingualContent;
            activities: BilingualContent[];
        }>;
    };
    images?: string[];
    createdAt?: string;
    updatedAt?: string;
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
    type: 'private' | 'public'; // ADDED: Backend now always sets this field
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
    discountReason?: string;
    status: 'pending' | 'confirmed' | 'paid' | 'cancelled';
    createdAt: string;
}

// Re-export common types
export type BookingStatus = Booking['status'];
export type DepartureType = Departure['type'];
export type DepartureStatus = Departure['status'];
