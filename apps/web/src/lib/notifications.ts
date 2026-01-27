// Notification Service
// Checks user preferences before showing notifications

export type NotificationType = 'tradeConfirmations' | 'priceAlerts' | 'leaderboardUpdates' | 'marketEvents' | 'achievements';

export interface NotificationPreferences {
    tradeConfirmations: boolean;
    priceAlerts: boolean;
    leaderboardUpdates: boolean;
    marketEvents: boolean;
    achievements: boolean;
}

// Get notification preferences from localStorage
export function getNotificationPreferences(): NotificationPreferences {
    if (typeof window === 'undefined') {
        return {
            tradeConfirmations: true,
            priceAlerts: true,
            leaderboardUpdates: false,
            marketEvents: true,
            achievements: true,
        };
    }

    try {
        const saved = localStorage.getItem('notifications');
        if (saved) {
            return JSON.parse(saved);
        }
    } catch (e) {
        console.error('Failed to load notification preferences:', e);
    }

    return {
        tradeConfirmations: true,
        priceAlerts: true,
        leaderboardUpdates: false,
        marketEvents: true,
        achievements: true,
    };
}

// Check if a notification type is enabled
export function isNotificationEnabled(type: NotificationType): boolean {
    const prefs = getNotificationPreferences();
    return prefs[type] ?? true;
}

// Request browser notification permission
export async function requestNotificationPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
        return false;
    }

    if (Notification.permission === 'granted') {
        return true;
    }

    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }

    return false;
}

// Show a browser notification
export function showBrowserNotification(title: string, options?: NotificationOptions): void {
    if (typeof window === 'undefined' || !('Notification' in window)) {
        return;
    }

    if (Notification.permission === 'granted') {
        new Notification(title, {
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            ...options,
        });
    }
}

// Notification helper functions that check preferences

export interface NotifyOptions {
    showBrowser?: boolean; // Also show browser notification
    playSound?: boolean;   // Play notification sound
}

// These functions will be called from the notification hook
export const notificationHelpers = {
    // Trade confirmation notification
    tradeConfirmation: (
        toast: (props: { title: string; description?: string; variant?: 'default' | 'destructive' }) => void,
        data: { side: 'buy' | 'sell'; symbol: string; quantity: number; price: number },
        options?: NotifyOptions
    ) => {
        if (!isNotificationEnabled('tradeConfirmations')) return;

        const action = data.side === 'buy' ? 'Bought' : 'Sold';
        const title = `${action} ${data.quantity} ${data.symbol}`;
        const description = `@ Rs ${data.price.toLocaleString()} per share`;

        toast({ title, description });

        if (options?.showBrowser) {
            showBrowserNotification(title, { body: description, tag: 'trade' });
        }
    },

    // Price alert notification
    priceAlert: (
        toast: (props: { title: string; description?: string; variant?: 'default' | 'destructive' }) => void,
        data: { symbol: string; price: number; changePercent: number; direction: 'up' | 'down' },
        options?: NotifyOptions
    ) => {
        if (!isNotificationEnabled('priceAlerts')) return;

        const arrow = data.direction === 'up' ? '📈' : '📉';
        const title = `${arrow} ${data.symbol} ${data.direction === 'up' ? 'Up' : 'Down'} ${Math.abs(data.changePercent).toFixed(2)}%`;
        const description = `Current price: Rs ${data.price.toLocaleString()}`;

        toast({ title, description });

        if (options?.showBrowser) {
            showBrowserNotification(title, { body: description, tag: 'price-alert' });
        }
    },

    // Leaderboard update notification
    leaderboardUpdate: (
        toast: (props: { title: string; description?: string; variant?: 'default' | 'destructive' }) => void,
        data: { previousRank: number; currentRank: number; competitionName?: string },
        options?: NotifyOptions
    ) => {
        if (!isNotificationEnabled('leaderboardUpdates')) return;

        const improved = data.currentRank < data.previousRank;
        const emoji = improved ? '🏆' : '📊';
        const title = `${emoji} Rank ${improved ? 'Up' : 'Changed'}: #${data.currentRank}`;
        const description = improved
            ? `You moved up from #${data.previousRank}!`
            : `You moved from #${data.previousRank} to #${data.currentRank}`;

        toast({ title, description });

        if (options?.showBrowser) {
            showBrowserNotification(title, { body: description, tag: 'leaderboard' });
        }
    },

    // Market event notification
    marketEvent: (
        toast: (props: { title: string; description?: string; variant?: 'default' | 'destructive' }) => void,
        data: { title: string; description: string; impactType?: 'positive' | 'negative' | 'neutral' },
        options?: NotifyOptions
    ) => {
        if (!isNotificationEnabled('marketEvents')) return;

        const emoji = data.impactType === 'positive' ? '📰' : data.impactType === 'negative' ? '⚠️' : '📢';
        const title = `${emoji} ${data.title}`;

        toast({ title, description: data.description });

        if (options?.showBrowser) {
            showBrowserNotification(title, { body: data.description, tag: 'market-event' });
        }
    },

    // Achievement unlocked notification
    achievementUnlocked: (
        toast: (props: { title: string; description?: string; variant?: 'default' | 'destructive' }) => void,
        data: { name: string; description: string; icon: string; points: number; rarity: string },
        options?: NotifyOptions
    ) => {
        if (!isNotificationEnabled('achievements')) return;

        const title = `🏆 Achievement Unlocked: ${data.name}`;
        const description = `${data.icon} ${data.description} (+${data.points} pts)`;

        toast({ title, description });

        if (options?.showBrowser) {
            showBrowserNotification(title, { body: description, tag: 'achievement' });
        }
    },
};
