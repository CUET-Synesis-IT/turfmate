import { create } from 'zustand';
import { TokenResponse, User } from './types';
import { authService } from '@/services/authService';

interface AuthStore {
    token: string | null;
    refreshToken: string | null;
    user: User | null;
    isLoadingUser: boolean;
    isHydrated: boolean;
    login: (tokens: TokenResponse, user?: User) => Promise<void>;
    logout: () => Promise<void>;
    setUser: (user: User | null) => void;
    fetchCurrentUser: () => Promise<User | null>;
    isAuthenticated: () => boolean;
    hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
    token: null,
    refreshToken: null,
    user: null,
    isLoadingUser: false,
    isHydrated: false,

    login: async (tokens: TokenResponse, user?: User) => {
        set({
            token: tokens.access_token,
            refreshToken: tokens.refresh_token,
            user: user || null,
        });

        if (typeof window !== 'undefined') {
            localStorage.setItem('access_token', tokens.access_token);
            localStorage.setItem('refresh_token', tokens.refresh_token);
        }

        if (!user) {
            await get().fetchCurrentUser();
        }
    },

    logout: async () => {
        const rToken = get().refreshToken || (typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null);

        // Clear in-memory state
        set({
            token: null,
            refreshToken: null,
            user: null,
            isLoadingUser: false,
        });

        // Clear cached tokens in browser localStorage
        if (typeof window !== 'undefined') {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
        }

        // Invalidate the token stored in the backend database
        if (rToken) {
            try {
                await authService.logout(rToken);
            } catch (error) {
                console.error('Failed to revoke session token in backend:', error);
            }
        }
    },

    setUser: (user: User | null) => {
        set({ user });
    },

    fetchCurrentUser: async () => {
        const token = get().token || (typeof window !== 'undefined' ? localStorage.getItem('access_token') : null);
        if (!token) {
            set({ user: null, isLoadingUser: false });
            return null;
        }

        set({ isLoadingUser: true });

        try {
            const user = await authService.getCurrentUser();
            set({ user, isLoadingUser: false });
            return user;
        } catch (error) {
            console.error('Failed to fetch current user profile:', error);

            // Attempt token refresh if available
            const rToken = get().refreshToken || (typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null);
            if (rToken) {
                try {
                    const newTokens = await authService.refreshToken(rToken);
                    set({
                        token: newTokens.access_token,
                        refreshToken: newTokens.refresh_token,
                    });
                    if (typeof window !== 'undefined') {
                        localStorage.setItem('access_token', newTokens.access_token);
                        localStorage.setItem('refresh_token', newTokens.refresh_token);
                    }
                    const user = await authService.getCurrentUser();
                    set({ user, isLoadingUser: false });
                    return user;
                } catch {
                    await get().logout();
                }
            } else {
                await get().logout();
            }

            set({ user: null, isLoadingUser: false });
            return null;
        }
    },

    isAuthenticated: () => {
        return get().token !== null || (typeof window !== 'undefined' && !!localStorage.getItem('access_token'));
    },

    hydrate: async () => {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('access_token');
            const refreshToken = localStorage.getItem('refresh_token');

            if (token) {
                set({ token, refreshToken, isHydrated: true });
                await get().fetchCurrentUser();
            } else {
                set({ isHydrated: true });
            }
        }
    },
}));
