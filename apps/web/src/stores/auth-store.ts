import { create } from 'zustand';
import Cookies from 'js-cookie';
import { authApi, usersApi, api } from '@/lib/api';

interface User {
    id: string;
    email: string;
    username: string;
    fullName: string;
    role: 'admin' | 'participant';
    avatarUrl?: string;
    phone?: string;
    isActive: boolean;
    mustChangePassword?: boolean;
    createdAt: string;
}

interface AuthState {
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;

    // Actions
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    initialize: () => void;
    updateUser: (data: Partial<User>) => void;
    clearError: () => void;
}

// Cookie options for secure storage
const cookieOptions = {
    expires: 7, // 7 days
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
};

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,

    login: async (email: string, password: string) => {
        console.log(`[AUTH] Client: Attempting login for ${email} via ${api.defaults.baseURL}`);
        set({ isLoading: true, error: null });
        try {
            const response = await authApi.login(email, password);
            const { user, accessToken, refreshToken } = response.data;

            // Save to cookies for persistence across tabs
            Cookies.set('accessToken', accessToken, cookieOptions);
            Cookies.set('refreshToken', refreshToken, { ...cookieOptions, expires: 30 }); // Refresh token lasts longer
            Cookies.set('user', JSON.stringify(user), cookieOptions);

            set({
                user,
                accessToken,
                refreshToken,
                isAuthenticated: true,
                isLoading: false,
            });
        } catch (error: any) {
            const message = error.response?.data?.message || 'Login failed';
            set({ error: message, isLoading: false });
            throw error;
        }
    },

    logout: () => {
        // Remove cookies
        Cookies.remove('accessToken');
        Cookies.remove('refreshToken');
        Cookies.remove('user');

        set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            error: null,
        });
    },

    initialize: () => {
        const accessToken = Cookies.get('accessToken');
        const refreshToken = Cookies.get('refreshToken');
        const userStr = Cookies.get('user');

        if (accessToken && refreshToken && userStr) {
            try {
                const user = JSON.parse(userStr);
                set({
                    user,
                    accessToken,
                    refreshToken,
                    isAuthenticated: true,
                });
            } catch {
                // Invalid user data, clear everything
                Cookies.remove('accessToken');
                Cookies.remove('refreshToken');
                Cookies.remove('user');
            }
        }
    },

    updateUser: (data) => {
        const currentUser = get().user;
        if (currentUser) {
            const updatedUser = { ...currentUser, ...data };
            Cookies.set('user', JSON.stringify(updatedUser), cookieOptions);
            set({ user: updatedUser });
        }
    },

    clearError: () => {
        set({ error: null });
    },
}));
