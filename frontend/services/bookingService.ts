import apiClient from '@/lib/api';
import { CourtAvailabilityResponse, BookingResponse } from '@/types';

export const bookingService = {
    // 1. Get real-time slot grid with pricing
    async getAvailability(courtId: string, dateStr: string): Promise<CourtAvailabilityResponse> {
        const res = await apiClient.get<CourtAvailabilityResponse>(
            `/api/v1/courts/${courtId}/availability?date=${dateStr}`
        );
        return res.data;
    },

    // 2. Customer self-booking
    async createBooking(payload: {
        court_id: string;
        start_datetime: string;
        end_datetime: string;
        customer_notes?: string;
    }): Promise<BookingResponse> {
        const res = await apiClient.post<BookingResponse>('/api/v1/bookings', payload);
        return res.data;
    },

    // 3. Customer's bookings list
    async getMyBookings(): Promise<BookingResponse[]> {
        const res = await apiClient.get<BookingResponse[]>('/api/v1/bookings');
        return res.data;
    },

    // 4. Cancel booking
    async cancelBooking(bookingId: string, reason: string): Promise<BookingResponse> {
        const res = await apiClient.post<BookingResponse>(`/api/v1/bookings/${bookingId}/cancel`, {
            cancellation_reason: reason,
        });
        return res.data;
    },
};
