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

    // 5. Get single booking by reference code
    async getBookingByReference(reference: string): Promise<BookingResponse> {
        const res = await apiClient.get<BookingResponse>(`/api/v1/bookings/reference/${reference}`);
        return res.data;
    },

    // 6. Get single booking by ID
    async getBookingById(bookingId: string): Promise<BookingResponse> {
        const res = await apiClient.get<BookingResponse>(`/api/v1/bookings/${bookingId}`);
        return res.data;
    },

    // 7. Staff/Admin: List all bookings with filtering
    async listAllBookings(params?: {
        venue_id?: string;
        court_id?: string;
        customer_id?: string;
        status?: string;
        search?: string;
        start_date?: string;
        end_date?: string;
        skip?: number;
        limit?: number;
    }): Promise<BookingResponse[]> {
        const res = await apiClient.get<BookingResponse[]>('/api/v1/bookings', { params });
        return res.data;
    },

    // 8. Staff/Admin: Create walk-in or phone booking
    async createStaffBooking(payload: {
        court_id: string;
        start_datetime: string;
        end_datetime: string;
        customer_id?: string;
        customer_phone?: string;
        customer_name?: string;
        deposit_paid?: number;
        status?: string;
        customer_notes?: string;
        internal_notes?: string;
    }): Promise<BookingResponse> {
        const res = await apiClient.post<BookingResponse>('/api/v1/bookings/staff', payload);
        return res.data;
    },

    // 9. Staff/Admin: Manually block slot for maintenance or private VIP hold
    async createCourtBlock(payload: {
        court_id: string;
        start_datetime: string;
        end_datetime: string;
        reason: string;
        internal_notes?: string;
    }): Promise<BookingResponse> {
        const res = await apiClient.post<BookingResponse>('/api/v1/bookings/block', payload);
        return res.data;
    },

    // 10. Staff/Admin: Update booking status (confirmed, completed, no_show, etc.)
    async updateBookingStatus(bookingId: string, newStatus: string): Promise<BookingResponse> {
        const res = await apiClient.patch<BookingResponse>(`/api/v1/bookings/${bookingId}/status`, {
            status: newStatus,
        });
        return res.data;
    },

    // 11. Staff/Admin: Delete / release a blocked pitch hold or draft booking
    async deleteBooking(bookingId: string): Promise<void> {
        await apiClient.delete(`/api/v1/bookings/${bookingId}`);
    },
};
