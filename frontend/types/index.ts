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
}

export interface Court {
    id: string;
    venueId: string;
    name: string;
    type: '5-a-side' | '7-a-side';
    surface: 'indoor' | 'outdoor';
}

export interface TimeSlot {
    id: string;
    courtId: string;
    date: string;
    startTime: string;
    endTime: string;
    status: 'available' | 'booked' | 'blocked';
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
