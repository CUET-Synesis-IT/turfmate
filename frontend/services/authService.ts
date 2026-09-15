import apiClient from '@/lib/api';
import { TokenResponse } from '@/lib/types';
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
};
