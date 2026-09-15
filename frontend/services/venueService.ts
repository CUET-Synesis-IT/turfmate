import apiClient from '@/lib/api';
import { Venue, Court } from '@/types';

export const venueService = {
    async getVenues(): Promise<Venue[]> {
        const res = await apiClient.get<Venue[]>('/api/v1/venues');
        return res.data;
    },

    async getVenueCourts(venueId: string): Promise<Court[]> {
        const res = await apiClient.get<Court[]>(`/api/v1/venues/${venueId}/courts`);
        return res.data;
    },
};
