'use client';

import { useCallback } from 'react';
import { useToast } from './use-toast';
import { notificationHelpers, requestNotificationPermission } from '@/lib/notifications';

export function useNotifications() {
    const { toast } = useToast();

    const notifyTrade = useCallback(
        (data: { side: 'buy' | 'sell'; symbol: string; quantity: number; price: number }) => {
            notificationHelpers.tradeConfirmation(toast, data);
        },
        [toast]
    );

    const notifyPriceAlert = useCallback(
        (data: { symbol: string; price: number; changePercent: number; direction: 'up' | 'down' }) => {
            notificationHelpers.priceAlert(toast, data);
        },
        [toast]
    );

    const notifyLeaderboardUpdate = useCallback(
        (data: { previousRank: number; currentRank: number; competitionName?: string }) => {
            notificationHelpers.leaderboardUpdate(toast, data);
        },
        [toast]
    );

    const notifyMarketEvent = useCallback(
        (data: { title: string; description: string; impactType?: 'positive' | 'negative' | 'neutral' }) => {
            notificationHelpers.marketEvent(toast, data);
        },
        [toast]
    );

    const notifyAchievement = useCallback(
        (data: { name: string; description: string; icon: string; points: number; rarity: string }) => {
            notificationHelpers.achievementUnlocked(toast, data);
        },
        [toast]
    );

    const enableBrowserNotifications = useCallback(async () => {
        return await requestNotificationPermission();
    }, []);

    return {
        notifyTrade,
        notifyPriceAlert,
        notifyLeaderboardUpdate,
        notifyMarketEvent,
        notifyAchievement,
        enableBrowserNotifications,
    };
}
