import apiClient from '@/lib/api';
import { TokenResponse, RegisterResponse, User } from '@/lib/types';

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

    async getCurrentUser(): Promise<User> {
        const response = await apiClient.get<User>('/api/v1/users/me');
        return response.data;
    },

    async refreshToken(refreshToken: string): Promise<TokenResponse> {
        const response = await apiClient.post<TokenResponse>('/api/v1/auth/refresh', {
            refresh_token: refreshToken,
        });
        return response.data;
    },

    async logout(refreshToken?: string): Promise<{ message: string }> {
        const rToken = refreshToken || (typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null);
        if (rToken) {
            try {
                const response = await apiClient.post<{ message: string }>('/api/v1/auth/logout', {
                    refresh_token: rToken,
                });
                return response.data;
            } catch (error) {
                console.error('Logout API call failed:', error);
            }
        }
        return { message: 'Logged out.' };
    },
};
