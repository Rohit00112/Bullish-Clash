import axios from 'axios';
import Cookies from 'js-cookie';

const isServer = typeof window === 'undefined';
const API_URL = isServer
    ? (process.env.INTERNAL_API_URL || 'http://api:4000/api')
    : (process.env.NEXT_PUBLIC_API_URL || '/api');

if (!isServer) {
    console.log('[API] Client-side API URL:', API_URL);
}

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Cookie options
const cookieOptions = {
    expires: 7,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
};

// Request interceptor to add auth token from cookies
api.interceptors.request.use(
    (config) => {
        const token = Cookies.get('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle errors
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If 401 and not already retried, try to refresh token
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            const refreshToken = Cookies.get('refreshToken');
            if (refreshToken) {
                try {
                    const response = await axios.post(`${API_URL}/auth/refresh`, {
                        refreshToken,
                    });

                    const { accessToken, refreshToken: newRefreshToken } = response.data;
                    Cookies.set('accessToken', accessToken, cookieOptions);
                    Cookies.set('refreshToken', newRefreshToken, { ...cookieOptions, expires: 30 });

                    originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                    return api(originalRequest);
                } catch (refreshError) {
                    // Refresh failed, clear auth cookies
                    Cookies.remove('accessToken');
                    Cookies.remove('refreshToken');
                    Cookies.remove('user');
                    window.location.href = '/login';
                }
            } else {
                // No refresh token, redirect to login
                Cookies.remove('accessToken');
                Cookies.remove('refreshToken');
                Cookies.remove('user');
                window.location.href = '/login';
            }
        }

        return Promise.reject(error);
    }
);

// ==================== AUTH ====================

export const authApi = {
    login: (email: string, password: string) =>
        api.post('/auth/login', { email, password }),

    refresh: (refreshToken: string) =>
        api.post('/auth/refresh', { refreshToken }),

    // Admin only
    createUser: (data: {
        email: string;
        username: string;
        fullName: string;
        password: string;
        phone?: string;
    }) => api.post('/auth/create-user', data),

    changePassword: (password: string) => api.post('/auth/change-password', { password }),
};

// ==================== SYMBOLS ====================

export const symbolsApi = {
    getAll: (params?: { sector?: string; search?: string; tradeableOnly?: boolean }) =>
        api.get('/symbols', { params }),

    getById: (id: string) => api.get(`/symbols/${id}`),

    getSectors: () => api.get('/symbols/sectors'),

    // Get only tradeable symbols
    getTradeable: () => api.get('/symbols/tradeable'),

    // Admin
    create: (data: any) => api.post('/symbols', data),
    update: (id: string, data: any) => api.patch(`/symbols/${id}`, data),
    delete: (id: string) => api.delete(`/symbols/${id}`),

    // Admin - set listing status (isTradeable)
    setListingStatus: (id: string, isTradeable: boolean) =>
        api.patch(`/symbols/${id}/listing`, { isTradeable }),
};

// ==================== PRICES ====================

export const pricesApi = {
    getAll: () => api.get('/prices'),

    getLatest: (symbolId: string) => api.get(`/prices/${symbolId}`),

    getHistory: (symbolId: string, params?: { from?: string; to?: string; limit?: number }) =>
        api.get(`/prices/${symbolId}/history`, { params }),

    getCandles: (symbolId: string, params?: { interval?: string; limit?: number }) =>
        api.get(`/prices/${symbolId}/candles`, { params }),

    // Admin
    update: (data: { symbolId: string; change: number; type: 'PERCENTAGE' | 'ABSOLUTE' }) =>
        api.post('/prices/update', data),
};

// ==================== TRADING ====================

export const tradingApi = {
    placeOrder: (data: {
        symbolId: string;
        side: 'buy' | 'sell';
        quantity: number;
        type?: 'market' | 'limit';
        price?: number;
    }) => api.post('/trading/order', data),

    cancelOrder: (orderId: string) =>
        api.post('/trading/order/cancel', { orderId }),

    editOrder: (orderId: string, data: { price?: number; quantity?: number }) =>
        api.post('/trading/order/edit', { orderId, ...data }),

    getOrderBook: (symbolId: string) =>
        api.get(`/trading/orderbook/${symbolId}`),

    getOpenOrders: () =>
        api.get('/trading/orders/open'),

    getOrders: (params?: { status?: string; limit?: number }) =>
        api.get('/trading/orders', { params }),

    getTrades: (params?: { limit?: number }) =>
        api.get('/trading/trades', { params }),
};

// ==================== PORTFOLIO ====================

export const portfolioApi = {
    get: () => api.get('/portfolio'),

    getSummary: () => api.get('/portfolio/summary'),

    getHoldings: () => api.get('/portfolio/holdings'),
};

// ==================== LEADERBOARD ====================

export const leaderboardApi = {
    get: (params?: { limit?: number; offset?: number }) =>
        api.get('/leaderboard', { params }),

    getAll: (params?: { limit?: number; offset?: number }) =>
        api.get('/leaderboard', { params }),

    getMyRank: () => api.get('/leaderboard/my-rank'),

    export: () => api.get('/leaderboard/export', { responseType: 'blob' }),
};

// ==================== COMPETITION ====================

export const competitionApi = {
    getActive: () => api.get('/competition/active'),

    getStats: () => api.get('/competition/active/stats'),

    getById: (id: string) => api.get(`/competition/${id}`),

    join: (id: string) => api.post(`/competition/${id}/join`),

    // Admin
    getAll: () => api.get('/competition'),
    create: (data: any) => api.post('/competition', data),
    update: (id: string, data: any) => api.patch(`/competition/${id}`, data),
    updateStatus: (id: string, status: string) =>
        api.post(`/competition/${id}/status/${status}`),
    start: () => api.post('/competition/active/start'),
    pause: () => api.post('/competition/active/pause'),
    end: () => api.post('/competition/active/end'),
    reset: () => api.post('/competition/active/reset'),
    getSettings: () => api.get('/competition/active/settings'),
    updateSettings: (data: any) => api.patch('/competition/active/settings', data),
    exportReport: (id: string) => api.get(`/competition/${id}/export`),
};

// ==================== EVENTS (Admin) ====================

export const eventsApi = {
    getAll: (params?: { executed?: boolean; limit?: number }) =>
        api.get('/events', { params }),

    getById: (id: string) => api.get(`/events/${id}`),

    getExamples: () => api.get('/events/examples'),

    create: (data: any) => api.post('/events', data),

    update: (id: string, data: any) => api.put(`/events/${id}`, data),

    execute: (id: string) => api.post(`/events/${id}/execute`),

    delete: (id: string) => api.delete(`/events/${id}`),

    getAuditLogs: (params?: { adminId?: string; action?: string; limit?: number }) =>
        api.get('/events/audit-logs', { params }),
};

// ==================== WATCHLIST ====================

export const watchlistApi = {
    get: () => api.get('/watchlist'),

    add: (symbolId: string) => api.post('/watchlist', { symbolId }),

    remove: (symbolId: string) => api.delete(`/watchlist/${symbolId}`),

    check: (symbolId: string) => api.get(`/watchlist/${symbolId}/check`),
};

// ==================== USERS ====================

export const usersApi = {
    getMe: () => api.get('/users/me'),

    updateMe: (data: { fullName?: string; phone?: string; avatarUrl?: string }) =>
        api.patch('/users/me', data),

    // Admin
    getAll: (params?: { page?: number; limit?: number }) =>
        api.get('/users', { params }),

    getById: (id: string) => api.get(`/users/${id}`),

    deleteUser: (id: string) => api.delete(`/users/${id}`),
};

// ==================== ACHIEVEMENTS ====================

export const achievementsApi = {
    // Get all achievement definitions
    getDefinitions: () => api.get('/achievements/definitions'),

    // Get current user's achievements
    getMyAchievements: () => api.get('/achievements'),

    // Get achievements for a specific competition
    getCompetitionAchievements: (competitionId: string) =>
        api.get(`/achievements/competition/${competitionId}`),

    // Get current user's achievement stats
    getMyStats: () => api.get('/achievements/stats'),

    // Manually trigger achievement check
    checkAchievements: () => api.post('/achievements/check'),

    // Get another user's achievements (public)
    getUserAchievements: (userId: string) =>
        api.get(`/achievements/user/${userId}`),

    // Get another user's stats (public)
    getUserStats: (userId: string) =>
        api.get(`/achievements/user/${userId}/stats`),
};

// ==================== BIDDING ====================

export const biddingApi = {
    placeBid: (data: { symbolId: string; quantity: number; price: number }) =>
        api.post('/bidding', data),

    getMyBids: () => api.get('/bidding/me'),

    // Get symbols available for bidding (with floor prices)
    getBiddableSymbols: () => api.get('/bidding/symbols'),

    // Admin
    processBids: (competitionId: string) =>
        api.post(`/bidding/process/${competitionId}`),
};

// ==================== REMARKS ====================

export const remarksApi = {
    create: (data: {
        type: 'trade_justification' | 'strategy' | 'risk_assessment' | 'market_sentiment';
        content: string;
        title?: string;
        symbolId?: string;
    }) => api.post('/remarks', data),

    getMyRemarks: () => api.get('/remarks/me'),
    getAll: (competitionId: string) => api.get(`/remarks/competition/${competitionId}`),
    scoreRemark: (remarkId: string, score: number) => api.patch(`/remarks/${remarkId}/score`, { score }),
    update: (remarkId: string, content: string) => api.patch(`/remarks/${remarkId}`, { content }),
};
