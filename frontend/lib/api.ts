import axios from 'axios';
import { useAuthStore } from './auth-store';

const apiClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add Authorization header
apiClient.interceptors.request.use(
    (config) => {
        if (typeof window !== 'undefined') {
            const authStore = useAuthStore.getState();
            const token = authStore.token || localStorage.getItem('access_token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle token refresh on 401
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (
            error.response?.status === 401 &&
            !originalRequest._retry &&
            !originalRequest.url?.includes('/auth/login') &&
            !originalRequest.url?.includes('/auth/refresh')
        ) {
            originalRequest._retry = true;
            if (typeof window !== 'undefined') {
                const refreshToken = localStorage.getItem('refresh_token');
                if (refreshToken) {
                    try {
                        const res = await axios.post(
                            `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}/api/v1/auth/refresh`,
                            { refresh_token: refreshToken }
                        );
                        const newTokens = res.data;
                        useAuthStore.getState().login(newTokens);
                        originalRequest.headers.Authorization = `Bearer ${newTokens.access_token}`;
                        return apiClient(originalRequest);
                    } catch {
                        useAuthStore.getState().logout();
                    }
                } else {
                    useAuthStore.getState().logout();
                }
            }
        }
        return Promise.reject(error);
    }
);

export default apiClient;
