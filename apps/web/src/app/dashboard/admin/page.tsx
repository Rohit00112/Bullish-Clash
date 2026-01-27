'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Settings,
    TrendingUp,
    TrendingDown,
    Calendar,
    Users,
    BarChart3,
    Play,
    Pause,
    RefreshCw,
    Plus,
    Send,
    AlertCircle,
    CheckCircle,
    Loader2,
} from 'lucide-react';
import { competitionApi, symbolsApi, pricesApi, eventsApi } from '@/lib/api';
import { formatCurrency, formatPercent, formatNumber } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function AdminPage() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    // State for quick price update
    const [selectedSymbol, setSelectedSymbol] = useState('');
    const [priceChange, setPriceChange] = useState('');
    const [changeType, setChangeType] = useState<'PERCENTAGE' | 'ABSOLUTE'>('PERCENTAGE');

    // Fetch competition stats
    const { data: competition } = useQuery({
        queryKey: ['admin-competition'],
        queryFn: async () => {
            const res = await competitionApi.getStats();
            return res.data;
        },
    });

    // Fetch symbols
    const { data: symbols } = useQuery({
        queryKey: ['admin-symbols'],
        queryFn: async () => {
            const res = await symbolsApi.getAll();
            return res.data;
        },
    });

    // Fetch recent events
    const { data: events } = useQuery({
        queryKey: ['admin-events'],
        queryFn: async () => {
            const res = await eventsApi.getAll();
            return res.data;
        },
    });

    // Update price mutation
    const updatePriceMutation = useMutation({
        mutationFn: async (data: { symbolId: string; change: number; type: 'PERCENTAGE' | 'ABSOLUTE' }) => {
            const res = await pricesApi.update(data);
            return res.data;
        },
        onSuccess: () => {
            toast({
                title: 'Price Updated',
                description: 'Price has been updated successfully',
            });
            queryClient.invalidateQueries({ queryKey: ['prices'] });
            setSelectedSymbol('');
            setPriceChange('');
        },
        onError: (error: any) => {
            toast({
                title: 'Update Failed',
                description: error.response?.data?.message || 'Failed to update price',
                variant: 'destructive',
            });
        },
    });

    // Competition control mutations
    const startCompetitionMutation = useMutation({
        mutationFn: async () => {
            const res = await competitionApi.start();
            return res.data;
        },
        onSuccess: () => {
            toast({ title: 'Competition Started' });
            queryClient.invalidateQueries({ queryKey: ['admin-competition'] });
        },
    });

    const pauseCompetitionMutation = useMutation({
        mutationFn: async () => {
            const res = await competitionApi.pause();
            return res.data;
        },
        onSuccess: () => {
            toast({ title: 'Competition Paused' });
            queryClient.invalidateQueries({ queryKey: ['admin-competition'] });
        },
    });

    const resetCompetitionMutation = useMutation({
        mutationFn: async () => {
            const res = await competitionApi.reset();
            return res.data;
        },
        onSuccess: () => {
            toast({ title: 'Competition Reset' });
            queryClient.invalidateQueries({ queryKey: ['admin-competition'] });
        },
    });

    // Handle quick price update
    const handlePriceUpdate = () => {
        if (!selectedSymbol || !priceChange) return;

        updatePriceMutation.mutate({
            symbolId: selectedSymbol,
            change: parseFloat(priceChange),
            type: changeType,
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Settings className="h-6 w-6" />
                        Admin Dashboard
                    </h1>
                    <p className="text-muted-foreground">Manage competition and market events</p>
                </div>
            </div>

            {/* Competition Status */}
            <div className="card bg-gradient-to-r from-primary/10 to-primary/5">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-lg font-semibold">{competition?.name || 'Competition'}</h2>
                        <p className="text-sm text-muted-foreground">
                            Status:{' '}
                            <span
                                className={`font-medium ${competition?.status === 'active'
                                    ? 'text-green-500'
                                    : competition?.status === 'paused'
                                        ? 'text-yellow-500'
                                        : competition?.status === 'ended'
                                            ? 'text-red-500'
                                            : 'text-muted-foreground'
                                    }`}
                            >
                                {competition?.status || 'draft'}
                            </span>
                        </p>
                    </div>

                    <div className="flex gap-2">
                        {/* Start button - show when not active and not ended */}
                        {competition?.status !== 'active' && competition?.status !== 'ended' && (
                            <button
                                onClick={() => startCompetitionMutation.mutate()}
                                disabled={startCompetitionMutation.isPending}
                                className="btn-primary flex items-center gap-2"
                            >
                                <Play className="h-4 w-4" />
                                {startCompetitionMutation.isPending ? 'Starting...' : 'Start'}
                            </button>
                        )}
                        {/* Pause button - show when active */}
                        {competition?.status === 'active' && (
                            <button
                                onClick={() => pauseCompetitionMutation.mutate()}
                                disabled={pauseCompetitionMutation.isPending}
                                className="btn-secondary flex items-center gap-2"
                            >
                                <Pause className="h-4 w-4" />
                                {pauseCompetitionMutation.isPending ? 'Pausing...' : 'Pause'}
                            </button>
                        )}
                        {/* Reset button - always available */}
                        <button
                            onClick={() => {
                                if (confirm('Are you sure you want to reset the competition? This will clear all portfolios.')) {
                                    resetCompetitionMutation.mutate();
                                }
                            }}
                            disabled={resetCompetitionMutation.isPending}
                            className="btn-secondary flex items-center gap-2 text-red-500 hover:bg-red-500/10"
                        >
                            <RefreshCw className="h-4 w-4" />
                            {resetCompetitionMutation.isPending ? 'Resetting...' : 'Reset'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="card">
                    <div className="flex items-center gap-3">
                        <Users className="h-8 w-8 text-primary" />
                        <div>
                            <p className="text-sm text-muted-foreground">Participants</p>
                            <p className="text-2xl font-bold">{formatNumber(competition?.participantCount || 0)}</p>
                        </div>
                    </div>
                </div>
                <div className="card">
                    <div className="flex items-center gap-3">
                        <BarChart3 className="h-8 w-8 text-green-500" />
                        <div>
                            <p className="text-sm text-muted-foreground">Total Trades</p>
                            <p className="text-2xl font-bold">{formatNumber(competition?.totalTrades || 0)}</p>
                        </div>
                    </div>
                </div>
                <div className="card">
                    <div className="flex items-center gap-3">
                        <TrendingUp className="h-8 w-8 text-yellow-500" />
                        <div>
                            <p className="text-sm text-muted-foreground">Active Symbols</p>
                            <p className="text-2xl font-bold">
                                {symbols?.filter((s: any) => s.isActive).length || 0}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="card">
                    <div className="flex items-center gap-3">
                        <Calendar className="h-8 w-8 text-blue-500" />
                        <div>
                            <p className="text-sm text-muted-foreground">Events Created</p>
                            <p className="text-2xl font-bold">{events?.length || 0}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Quick Price Update */}
                <div className="card">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Quick Price Update
                    </h3>

                    <div className="space-y-4">
                        <div>
                            <label className="label">Select Symbol</label>
                            <select
                                value={selectedSymbol}
                                onChange={(e) => setSelectedSymbol(e.target.value)}
                                className="input w-full"
                            >
                                <option value="">Select a symbol...</option>
                                {symbols?.filter((s: any) => s.isActive).map((symbol: any) => (
                                    <option key={symbol.id} value={symbol.id}>
                                        {symbol.symbol} - {symbol.companyName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="label">Change Type</label>
                                <select
                                    value={changeType}
                                    onChange={(e) => setChangeType(e.target.value as 'PERCENTAGE' | 'ABSOLUTE')}
                                    className="input w-full"
                                >
                                    <option value="PERCENTAGE">Percentage (%)</option>
                                    <option value="ABSOLUTE">Absolute (Rs.)</option>
                                </select>
                            </div>
                            <div>
                                <label className="label">
                                    {changeType === 'PERCENTAGE' ? 'Change %' : 'Change Rs.'}
                                </label>
                                <input
                                    type="number"
                                    value={priceChange}
                                    onChange={(e) => setPriceChange(e.target.value)}
                                    placeholder={changeType === 'PERCENTAGE' ? 'e.g., 5 or -3' : 'e.g., 100 or -50'}
                                    className="input w-full"
                                />
                            </div>
                        </div>

                        <button
                            onClick={handlePriceUpdate}
                            disabled={!selectedSymbol || !priceChange || updatePriceMutation.isPending}
                            className="btn-primary w-full flex items-center justify-center gap-2"
                        >
                            {updatePriceMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Send className="h-4 w-4" />
                            )}
                            Apply Price Change
                        </button>
                    </div>
                </div>

                {/* Quick Links */}
                <div className="card">
                    <h3 className="text-lg font-semibold mb-4">Admin Actions</h3>

                    <div className="grid grid-cols-2 gap-4">
                        <Link
                            href="/dashboard/admin/users"
                            className="p-4 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors text-center"
                        >
                            <Users className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                            <p className="font-medium">Manage Users</p>
                            <p className="text-xs text-muted-foreground">Add participants</p>
                        </Link>

                        <Link
                            href="/dashboard/admin/events"
                            className="p-4 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors text-center"
                        >
                            <Calendar className="h-8 w-8 mx-auto mb-2 text-primary" />
                            <p className="font-medium">Create Event</p>
                            <p className="text-xs text-muted-foreground">Market news & scripts</p>
                        </Link>

                        <Link
                            href="/dashboard/admin/symbols"
                            className="p-4 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors text-center"
                        >
                            <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-500" />
                            <p className="font-medium">Manage Symbols</p>
                            <p className="text-xs text-muted-foreground">Add/edit stocks</p>
                        </Link>

                        <Link
                            href="/dashboard/admin/settings"
                            className="p-4 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors text-center"
                        >
                            <Settings className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                            <p className="font-medium">Settings</p>
                            <p className="text-xs text-muted-foreground">Competition config</p>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Recent Events */}
            <div className="card">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Recent Events</h3>
                    <Link href="/dashboard/admin/events" className="text-sm text-primary hover:underline">
                        View all
                    </Link>
                </div>

                {events && events.length > 0 ? (
                    <div className="space-y-3">
                        {events.slice(0, 5).map((event: any) => (
                            <div
                                key={event.id}
                                className="flex items-start gap-3 p-3 bg-secondary/30 rounded-lg"
                            >
                                {event.status === 'EXECUTED' ? (
                                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                                ) : event.status === 'PENDING' ? (
                                    <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                                ) : (
                                    <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                                )}
                                <div className="flex-1">
                                    <p className="font-medium">{event.title}</p>
                                    <p className="text-sm text-muted-foreground line-clamp-1">
                                        {event.description}
                                    </p>
                                    <div className="flex gap-2 mt-1">
                                        {event.affectedSymbols?.map((symbol: any) => (
                                            <span
                                                key={symbol.symbolId}
                                                className={`text-xs px-2 py-0.5 rounded ${symbol.priceChange >= 0
                                                    ? 'bg-green-500/20 text-green-500'
                                                    : 'bg-red-500/20 text-red-500'
                                                    }`}
                                            >
                                                {symbol.ticker} {symbol.priceChange >= 0 ? '+' : ''}
                                                {symbol.priceChange}%
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                    {event.status}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-muted-foreground">
                        <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No events created yet</p>
                        <Link href="/dashboard/admin/events" className="text-primary hover:underline text-sm">
                            Create your first event
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
