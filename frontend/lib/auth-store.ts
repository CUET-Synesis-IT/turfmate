import { create } from 'zustand';
import { TokenResponse } from './types';

interface AuthStore {
    token: string | null;
    refreshToken: string | null;
    login: (tokens: TokenResponse) => void;
    logout: () => void;
    isAuthenticated: () => boolean;
    hydrate: () => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
    token: null,
    refreshToken: null,

    login: (tokens: TokenResponse) => {
        set({ token: tokens.access_token });
        if (typeof window !== 'undefined') {
            localStorage.setItem('refresh_token', tokens.refresh_token);
        }
    },

    logout: () => {
        set({ token: null, refreshToken: null });
        if (typeof window !== 'undefined') {
            localStorage.removeItem('refresh_token');
        }
    },

    isAuthenticated: () => {
        return get().token !== null;
    },

    hydrate: () => {
        if (typeof window !== 'undefined') {
            const refreshToken = localStorage.getItem('refresh_token');
            if (refreshToken) {
                set({ refreshToken });
            }
        }
    },
}));
