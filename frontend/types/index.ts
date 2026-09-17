/**
 * Core TypeScript interfaces for TurfMate aligned with Backend Models
 */

export type UserRole = 'admin' | 'staff' | 'customer';
export type FacilityStatus = 'active' | 'maintenance' | 'inactive';
export type SportType = 'football' | 'cricket' | 'badminton' | 'other';
export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show' | 'blocked';
export type PaymentMethod = 'cash' | 'bkash' | 'nagad' | 'card' | 'online_gateway' | 'bank_transfer';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface User {
    id: string;
    phone_number: string;
    full_name: string;
    email?: string | null;
    role: UserRole;
    is_active: boolean;
    avatar_url?: string | null;
    created_at?: string;
    updated_at?: string;
}

export interface Venue {
    id: string;
    name: string;
    slug: string;
    district: string;
    area: string;
    address: string;
    google_maps_url?: string | null;
    opening_time: string; // e.g. "07:00:00"
    closing_time: string; // e.g. "01:00:00"
    contact_phone?: string | null;
    contact_email?: string | null;
    status: FacilityStatus;
    status_note?: string | null;
    is_active: boolean;
    imageUrl?: string;
    amenities?: string[];
    priceRangeMin?: number;
    priceRangeMax?: number;
    rating?: number;
    reviewCount?: number;
}

export interface Court {
    id: string;
    venue_id: string;
    name: string;
    slug?: string;
    sport_type: SportType;
    surface_type?: string | null;
    court_size?: string | null;
    base_price_per_hour: number;
    night_price_per_hour?: number;
    status: FacilityStatus;
    status_note?: string | null;
    is_indoor: boolean;
    is_active: boolean;
    imageUrl?: string;
    features?: string[];
    popular?: boolean;
}

export interface SlotInfo {
    id?: string;
    court_id?: string;
    court_name?: string;
    start_time: string; // formatted time or ISO
    end_time: string;
    price: number;
    is_available: boolean;
    status: 'available' | 'booked' | 'blocked' | 'maintenance';
    reason?: string | null;
    period?: 'morning' | 'afternoon' | 'prime_night';
}

export interface CourtAvailabilityResponse {
    court_id: string;
    court_name: string;
    date: string;
    venue_id: string;
    venue_name: string;
    venue_status: FacilityStatus;
    court_status: FacilityStatus;
    slots: SlotInfo[];
}

export interface BookingResponse {
    id: string;
    booking_reference: string; // e.g. "TM-260917-VX2V"
    court_id: string;
    court?: {
        id: string;
        name: string;
        sport_type: SportType;
        venue_id: string;
        venue_name?: string | null;
    };
    customer_id: string;
    customer?: {
        id: string;
        full_name: string;
        phone_number: string;
        email?: string | null;
    };
    start_datetime: string;
    end_datetime: string;
    status: BookingStatus;
    total_amount: number;
    deposit_paid: number;
    remaining_balance: number;
    customer_notes?: string | null;
    internal_notes?: string | null;
    cancellation_reason?: string | null;
    cancelled_at?: string | null;
    created_at: string;
}

export interface SSLCommerzInitResponse {
    status: string;
    gateway_url: string;
    session_key?: string;
    transaction_id: string;
    amount: number;
    currency: string;
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
