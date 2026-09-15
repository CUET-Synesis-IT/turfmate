import apiClient from '@/lib/api';
import { TokenResponse, RegisterResponse } from '@/lib/types';
export const authService = {
    async login(
        phoneNumber: string,
        password: string
    ): Promise<TokenResponse> {
        const response = await apiClient.post<TokenResponse>(
            '/api/v1/auth/login',
            {
                phone_number: phoneNumber,
                password: password,
            }
        );
        return response.data;
    },

    async register(
        phoneNumber: string,
        fullName: string,
        password: string,
        email?: string
    ): Promise<RegisterResponse> {
        const payload: Record<string, string> = {
            phone_number: phoneNumber,
            full_name: fullName,
            password: password,
        };

        // Only include email if provided
        if (email) {
            payload.email = email;
        }

        const response = await apiClient.post<RegisterResponse>(
            '/api/v1/auth/register',
            payload
        );
        return response.data;
    },
};
