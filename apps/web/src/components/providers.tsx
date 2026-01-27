'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useWebSocket } from '@/hooks/use-websocket';
import { useNotifications } from '@/hooks/use-notifications';
import { isNotificationEnabled } from '@/lib/notifications';

// Initialize auth from localStorage
function AuthInitializer({ children }: { children: React.ReactNode }) {
    const initialize = useAuthStore((state) => state.initialize);
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        initialize();
        setIsInitialized(true);
    }, [initialize]);

    if (!isInitialized) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return <>{children}</>;
}

// WebSocket connection manager
function WebSocketManager({ children }: { children: React.ReactNode }) {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const token = useAuthStore((state) => state.accessToken);
    const { connect, disconnect, authenticate, subscribe } = useWebSocket();
    const { notifyMarketEvent, notifyPriceAlert, notifyLeaderboardUpdate, notifyAchievement } = useNotifications();
    const previousRankRef = useRef<number | null>(null);

    useEffect(() => {
        // Always connect to receive public updates
        connect();

        return () => {
            disconnect();
        };
    }, [connect, disconnect]);

    useEffect(() => {
        // Authenticate when logged in
        if (isAuthenticated && token) {
            authenticate(token);
        }
    }, [isAuthenticated, token, authenticate]);

    // Subscribe to market events for notifications
    useEffect(() => {
        const unsubMarketEvent = subscribe('market_event', (data: any) => {
            if (isNotificationEnabled('marketEvents')) {
                notifyMarketEvent({
                    title: data.title || 'Market Event',
                    description: data.description || 'A new market event has occurred',
                    impactType: data.impactType,
                });
            }
        });

        // Subscribe to significant price changes
        const unsubPriceUpdate = subscribe('price_update', (data: any) => {
            if (isNotificationEnabled('priceAlerts')) {
                // Only notify for significant changes (> 3%)
                const changePercent = Math.abs(data.changePercent || 0);
                if (changePercent >= 3) {
                    notifyPriceAlert({
                        symbol: data.symbol,
                        price: data.price,
                        changePercent: data.changePercent,
                        direction: data.changePercent >= 0 ? 'up' : 'down',
                    });
                }
            }
        });

        // Subscribe to leaderboard updates
        const unsubLeaderboard = subscribe('leaderboard_update', (data: any) => {
            if (isNotificationEnabled('leaderboardUpdates') && data.userRank !== undefined) {
                const currentRank = data.userRank;
                if (previousRankRef.current !== null && previousRankRef.current !== currentRank) {
                    notifyLeaderboardUpdate({
                        previousRank: previousRankRef.current,
                        currentRank: currentRank,
                    });
                }
                previousRankRef.current = currentRank;
            }
        });

        // Subscribe to achievement unlocks
        const unsubAchievement = subscribe('achievement_unlocked', (data: any) => {
            if (isNotificationEnabled('achievements')) {
                notifyAchievement({
                    name: data.name,
                    description: data.description,
                    icon: data.icon,
                    points: data.points,
                    rarity: data.rarity,
                });
            }
        });

        return () => {
            unsubMarketEvent();
            unsubPriceUpdate();
            unsubLeaderboard();
            unsubAchievement();
        };
    }, [subscribe, notifyMarketEvent, notifyPriceAlert, notifyLeaderboardUpdate, notifyAchievement]);

    return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 5 * 1000, // 5 seconds
                        refetchOnWindowFocus: false,
                    },
                },
            })
    );

    return (
        <QueryClientProvider client={queryClient}>
            <AuthInitializer>
                <WebSocketManager>{children}</WebSocketManager>
            </AuthInitializer>
        </QueryClientProvider>
    );
}
