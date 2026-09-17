import apiClient from '@/lib/api';
import { SSLCommerzInitResponse, PaymentRecord } from '@/types';

export const paymentService = {
    // Trigger SSLCOMMERZ checkout session
    async initiateSSLCommerz(bookingId: string, amount?: number): Promise<SSLCommerzInitResponse> {
        const res = await apiClient.post<SSLCommerzInitResponse>(
            '/api/v1/payments/sslcommerz/initiate',
            {
                booking_id: bookingId,
                amount: amount || undefined,
            }
        );
        return res.data;
    },

    // Staff/Admin: Record offline counter payment (Cash, bKash/Nagad at desk)
    async recordDeskPayment(
        bookingId: string,
        payload: {
            amount: number;
            payment_method: 'cash' | 'bkash' | 'nagad' | 'card' | 'bank_transfer';
            transaction_id?: string;
            notes?: string;
        }
    ): Promise<PaymentRecord> {
        const res = await apiClient.post<PaymentRecord>(`/api/v1/bookings/${bookingId}/payments`, payload);
        return res.data;
    },

    // Staff/Admin: List financial payment transaction logs
    async listPayments(params?: {
        booking_id?: string;
        payment_method?: string;
        status?: string;
        start_date?: string;
        end_date?: string;
    }): Promise<PaymentRecord[]> {
        const res = await apiClient.get<PaymentRecord[]>('/api/v1/payments', { params });
        return res.data;
    },
};

