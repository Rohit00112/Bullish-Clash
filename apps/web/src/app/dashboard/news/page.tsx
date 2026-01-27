'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Newspaper,
    TrendingUp,
    TrendingDown,
    Minus,
    Clock,
    Building2,
    Globe,
    AlertCircle,
    RefreshCw,
} from 'lucide-react';
import { eventsApi } from '@/lib/api';
import { useWebSocket } from '@/hooks/use-websocket';
import { useNotifications } from '@/hooks/use-notifications';

interface MarketEvent {
    id: string;
    title: string;
    description: string;
    impactType: 'positive' | 'negative' | 'neutral';
    scope: 'symbol' | 'sector' | 'market';
    priceUpdateType: 'percentage' | 'absolute' | 'override';
    magnitude: number;
    symbolId?: string;
    symbol?: { symbol: string; companyName: string };
    sector?: string;
    isExecuted: boolean;
    executedAt?: string;
    createdAt: string;
}

const impactConfig = {
    positive: {
        icon: TrendingUp,
        color: 'text-green-500',
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-500/30',
        label: 'Positive Impact',
    },
    negative: {
        icon: TrendingDown,
        color: 'text-red-500',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/30',
        label: 'Negative Impact',
    },
    neutral: {
        icon: Minus,
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-500/10',
        borderColor: 'border-yellow-500/30',
        label: 'Neutral',
    },
};

const scopeConfig = {
    symbol: { icon: Building2, label: 'Company' },
    sector: { icon: Globe, label: 'Sector' },
    market: { icon: Globe, label: 'Market-wide' },
};

export default function NewsPage() {
    const { subscribe } = useWebSocket();
    const { notifyMarketEvent } = useNotifications();
    const [newEventIds, setNewEventIds] = useState<Set<string>>(new Set());

    // Fetch executed events
    const { data: events, isLoading, refetch } = useQuery({
        queryKey: ['news-events'],
        queryFn: async () => {
            const res = await eventsApi.getAll();
            // Only show executed events
            return (res.data as MarketEvent[]).filter(e => e.isExecuted);
        },
        refetchInterval: 30000, // Refresh every 30 seconds
    });

    // Subscribe to new market events via WebSocket
    useEffect(() => {
        const unsubscribe = subscribe('market_event', (data: any) => {
            // Mark as new event
            if (data.eventId) {
                setNewEventIds(prev => new Set(prev).add(data.eventId));
                // Clear the "new" badge after 30 seconds
                setTimeout(() => {
                    setNewEventIds(prev => {
                        const next = new Set(prev);
                        next.delete(data.eventId);
                        return next;
                    });
                }, 30000);
            }
            // Refetch events list
            refetch();
        });

        return () => unsubscribe();
    }, [subscribe, refetch]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const formatMagnitude = (event: MarketEvent) => {
        if (event.priceUpdateType === 'percentage') {
            const sign = event.impactType === 'positive' ? '+' : event.impactType === 'negative' ? '-' : '';
            return `${sign}${Math.abs(event.magnitude)}%`;
        }
        if (event.priceUpdateType === 'absolute') {
            const sign = event.impactType === 'positive' ? '+' : event.impactType === 'negative' ? '-' : '';
            return `${sign}Rs ${Math.abs(event.magnitude).toLocaleString()}`;
        }
        return `Rs ${event.magnitude.toLocaleString()}`;
    };

    const getScopeLabel = (event: MarketEvent) => {
        if (event.scope === 'symbol' && event.symbol) {
            return event.symbol.symbol;
        }
        if (event.scope === 'sector' && event.sector) {
            return event.sector;
        }
        return 'All Stocks';
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Newspaper className="h-6 w-6" />
                        Market News
                    </h1>
                    <p className="text-muted-foreground">
                        Latest market events and announcements affecting stock prices
                    </p>
                </div>
                <button
                    onClick={() => refetch()}
                    className="btn-secondary flex items-center gap-2"
                >
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                </button>
            </div>

            {/* News Feed */}
            {events && events.length > 0 ? (
                <div className="space-y-4">
                    {events
                        .sort((a, b) => new Date(b.executedAt || b.createdAt).getTime() - new Date(a.executedAt || a.createdAt).getTime())
                        .map((event) => {
                            const impact = impactConfig[event.impactType] || impactConfig.neutral;
                            const scope = scopeConfig[event.scope] || scopeConfig.market;
                            const ImpactIcon = impact.icon;
                            const ScopeIcon = scope.icon;
                            const isNew = newEventIds.has(event.id);

                            return (
                                <div
                                    key={event.id}
                                    className={`card border ${impact.borderColor} ${isNew ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}`}
                                >
                                    <div className="flex items-start gap-4">
                                        {/* Impact Icon */}
                                        <div className={`p-3 rounded-lg ${impact.bgColor}`}>
                                            <ImpactIcon className={`h-6 w-6 ${impact.color}`} />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-semibold text-lg">{event.title}</h3>
                                                        {isNew && (
                                                            <span className="px-2 py-0.5 text-xs font-medium bg-primary text-primary-foreground rounded-full animate-pulse">
                                                                NEW
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-muted-foreground mt-1">
                                                        {event.description}
                                                    </p>
                                                </div>

                                                {/* Magnitude Badge */}
                                                <div className={`px-3 py-1.5 rounded-lg font-mono font-bold text-lg ${impact.bgColor} ${impact.color}`}>
                                                    {formatMagnitude(event)}
                                                </div>
                                            </div>

                                            {/* Meta Info */}
                                            <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                                                <div className="flex items-center gap-1.5">
                                                    <Clock className="h-4 w-4" />
                                                    {formatDate(event.executedAt || event.createdAt)}
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <ScopeIcon className="h-4 w-4" />
                                                    {getScopeLabel(event)}
                                                </div>
                                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${impact.bgColor} ${impact.color}`}>
                                                    {impact.label}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                </div>
            ) : (
                <div className="card flex flex-col items-center justify-center py-16 text-center">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold">No Market News Yet</h3>
                    <p className="text-muted-foreground mt-1">
                        Market events and announcements will appear here when published
                    </p>
                </div>
            )}
        </div>
    );
}
