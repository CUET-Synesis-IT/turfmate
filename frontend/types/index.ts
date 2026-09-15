/**
 * Core TypeScript interfaces for TurfMate
 */

export interface Venue {
    id: string;
    name: string;
    slug: string;
    address: string;
    city: string;
    imageUrl: string;
    amenities: string[];
    priceRangeMin: number;
    priceRangeMax: number;
    rating?: number;
    reviewCount?: number;
}

export interface Court {
    id: string;
    venueId: string;
    name: string;
    slug?: string;
    type: '5-a-side' | '7-a-side';
    surface: 'indoor' | 'outdoor';
    turfGrade: string;
    dimensions: string;
    hourlyRateDay: number;
    hourlyRateNight: number;
    imageUrl: string;
    features: string[];
    popular?: boolean;
}

export interface TimeSlot {
    id: string;
    courtId: string;
    courtName?: string;
    date: string;
    startTime: string;
    endTime: string;
    status: 'available' | 'booked' | 'blocked';
    period: 'morning' | 'afternoon' | 'prime_night';
    price: number;
}

export interface Booking {
    id: string;
    venueName: string;
    courtName: string;
    date: string;
    startTime: string;
    endTime: string;
    status: 'upcoming' | 'completed' | 'cancelled';
}

export interface Testimonial {
    id: string;
    name: string;
    teamName: string;
    role: string;
    avatar: string;
    rating: number;
    comment: string;
    matchType: string;
}

export interface FaqItem {
    id: string;
    question: string;
    answer: string;
    category: 'booking' | 'pricing' | 'facility' | 'policies';
}
