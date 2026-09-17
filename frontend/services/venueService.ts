import apiClient from '@/lib/api';
import { Venue, Court } from '@/types';

export interface VenueCreatePayload {
    name: string;
    address: string;
    area?: string;
    district?: string;
    description?: string;
    contact_phone?: string;
    opening_time?: string;
    closing_time?: string;
}

export interface CourtCreatePayload {
    name: string;
    sport_type?: string;
    surface_type?: string;
    court_size?: string;
    base_price_per_hour: number;
    is_indoor?: boolean;
}

export const venueService = {
    // List all venues
    async getVenues(): Promise<Venue[]> {
        const res = await apiClient.get<Venue[]>('/api/v1/venues');
        return res.data;
    },

    // List courts under a venue
    async getVenueCourts(venueId: string): Promise<Court[]> {
        const res = await apiClient.get<Court[]>(`/api/v1/venues/${venueId}/courts`);
        return res.data;
    },

    // Create a new venue (Staff, Admin, Superuser)
    async createVenue(payload: VenueCreatePayload): Promise<Venue> {
        const res = await apiClient.post<Venue>('/api/v1/venues', payload);
        return res.data;
    },

    // Update existing venue (Staff, Admin, Superuser)
    async updateVenue(venueId: string, payload: Partial<VenueCreatePayload>): Promise<Venue> {
        const res = await apiClient.patch<Venue>(`/api/v1/venues/${venueId}`, payload);
        return res.data;
    },

    // Create court/pitch under venue (Staff, Admin, Superuser)
    async createCourt(venueId: string, payload: CourtCreatePayload): Promise<Court> {
        const res = await apiClient.post<Court>(`/api/v1/venues/${venueId}/courts`, payload);
        return res.data;
    },

    // Update court details (Staff, Admin, Superuser)
    async updateCourt(courtId: string, payload: Partial<CourtCreatePayload & { is_active?: boolean }>): Promise<Court> {
        const res = await apiClient.patch<Court>(`/api/v1/courts/${courtId}`, payload);
        return res.data;
    },
};
