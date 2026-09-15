import apiClient from '@/lib/api';
import { SSLCommerzInitResponse } from '@/types';

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
};
