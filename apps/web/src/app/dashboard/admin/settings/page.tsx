'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, Save, Loader2, RefreshCw, Palette, Moon, Sun, Monitor, Check, Play, Square, Pause } from 'lucide-react';
import { competitionApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

type Theme = 'light' | 'dark' | 'system';

interface CompetitionSettings {
    id: string;
    name: string;
    status: 'draft' | 'scheduled' | 'active' | 'paused' | 'ended';
    startingCash: number;
    commissionRate: number;
    maxPositionSize: number;
    tradingHoursStart: string;
    tradingHoursEnd: string;
    startTime: string;
    endTime: string;
    isActive: boolean;
}

export default function AdminSettingsPage() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    // Theme state
    const [theme, setTheme] = useState<Theme>('dark');

    // Form state
    const [name, setName] = useState('');
    const [startingCash, setStartingCash] = useState('');
    const [commissionRate, setCommissionRate] = useState('');
    const [maxPositionSize, setMaxPositionSize] = useState('');
    const [tradingHoursStart, setTradingHoursStart] = useState('');
    const [tradingHoursEnd, setTradingHoursEnd] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');

    // Load theme from localStorage
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') as Theme;
        if (savedTheme) {
            setTheme(savedTheme);
        }
    }, []);

    // Handle theme change
    const handleThemeChange = (newTheme: Theme) => {
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);

        const root = document.documentElement;
        if (newTheme === 'system') {
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            if (systemTheme === 'dark') {
                root.classList.add('dark');
            } else {
                root.classList.remove('dark');
            }
        } else if (newTheme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }

        toast({ title: 'Theme Updated' });
    };
    // Fetch settings
    const { data: settings, isLoading } = useQuery({
        queryKey: ['competition-settings'],
        queryFn: async () => {
            const res = await competitionApi.getSettings();
            return res.data;
        },
        refetchOnMount: true,
    });

    // Populate form when settings load
    useEffect(() => {
        if (settings) {
            setName(settings.name || '');
            setStartingCash(settings.startingCash?.toString() || '1000000');
            setCommissionRate(settings.commissionRate?.toString() || '0.4');
            setMaxPositionSize(settings.maxPositionSize?.toString() || '25');
            setTradingHoursStart(settings.tradingHoursStart || '11:00');
            setTradingHoursEnd(settings.tradingHoursEnd || '15:00');
            if (settings.startTime) {
                setStartTime(formatDateForInput(settings.startTime));
            }
            if (settings.endTime) {
                setEndTime(formatDateForInput(settings.endTime));
            }
        }
    }, [settings]);

    // Helper to format date for datetime-local input (local time)
    const formatDateForInput = (dateString: string) => {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    // Update settings mutation
    const updateSettingsMutation = useMutation({
        mutationFn: async (data: Partial<CompetitionSettings>) => {
            const res = await competitionApi.updateSettings(data);
            return res.data;
        },
        onSuccess: () => {
            toast({ title: 'Settings Updated' });
            queryClient.invalidateQueries({ queryKey: ['competition-settings'] });
        },
        onError: (error: any) => {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to update settings',
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
            toast({ title: 'Competition Started', description: 'Trading is now enabled' });
            queryClient.invalidateQueries({ queryKey: ['competition-settings'] });
        },
        onError: (error: any) => {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to start competition',
                variant: 'destructive',
            });
        },
    });

    const pauseCompetitionMutation = useMutation({
        mutationFn: async () => {
            const res = await competitionApi.pause();
            return res.data;
        },
        onSuccess: () => {
            toast({ title: 'Competition Paused', description: 'Trading is temporarily disabled' });
            queryClient.invalidateQueries({ queryKey: ['competition-settings'] });
        },
        onError: (error: any) => {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to pause competition',
                variant: 'destructive',
            });
        },
    });

    const endCompetitionMutation = useMutation({
        mutationFn: async () => {
            const res = await competitionApi.end();
            return res.data;
        },
        onSuccess: () => {
            toast({ title: 'Competition Ended', description: 'Trading has been permanently disabled' });
            queryClient.invalidateQueries({ queryKey: ['competition-settings'] });
        },
        onError: (error: any) => {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to end competition',
                variant: 'destructive',
            });
        },
    });

    // Handle save
    const handleSave = () => {
        // datetime-local gives us local time, we need to send ISO string
        // new Date() interprets the value as local time which is correct
        updateSettingsMutation.mutate({
            name,
            startingCash: parseFloat(startingCash),
            commissionRate: parseFloat(commissionRate),
            maxPositionSize: parseFloat(maxPositionSize),
            tradingHoursStart,
            tradingHoursEnd,
            startTime: startTime ? new Date(startTime).toISOString() : undefined,
            endTime: endTime ? new Date(endTime).toISOString() : undefined,
        });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-2xl">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Settings className="h-6 w-6" />
                    Admin Settings
                </h1>
                <p className="text-muted-foreground">Configure competition and appearance</p>
            </div>

            {/* Competition Status Control */}
            <div className="card">
                <h2 className="text-lg font-semibold mb-4">Competition Control</h2>

                <div className="flex items-center justify-between mb-4">
                    <div>
                        <p className="font-medium">Current Status</p>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${settings?.status === 'active'
                                    ? 'bg-green-500/20 text-green-500'
                                    : settings?.status === 'paused'
                                        ? 'bg-yellow-500/20 text-yellow-500'
                                        : settings?.status === 'ended'
                                            ? 'bg-red-500/20 text-red-500'
                                            : 'bg-muted text-muted-foreground'
                                }`}>
                                <span className={`w-2 h-2 rounded-full ${settings?.status === 'active'
                                        ? 'bg-green-500 animate-pulse'
                                        : settings?.status === 'paused'
                                            ? 'bg-yellow-500'
                                            : settings?.status === 'ended'
                                                ? 'bg-red-500'
                                                : 'bg-muted-foreground'
                                    }`} />
                                {settings?.status === 'active' ? 'Active' :
                                    settings?.status === 'paused' ? 'Paused' :
                                        settings?.status === 'ended' ? 'Ended' :
                                            settings?.status === 'scheduled' ? 'Scheduled' : 'Draft'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-3">
                    {/* Start Button - show when not active and not ended */}
                    {settings?.status !== 'active' && settings?.status !== 'ended' && (
                        <button
                            onClick={() => startCompetitionMutation.mutate()}
                            disabled={startCompetitionMutation.isPending}
                            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                        >
                            {startCompetitionMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Play className="h-4 w-4" />
                            )}
                            Start Competition
                        </button>
                    )}

                    {/* Pause Button - show when active */}
                    {settings?.status === 'active' && (
                        <button
                            onClick={() => pauseCompetitionMutation.mutate()}
                            disabled={pauseCompetitionMutation.isPending}
                            className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50"
                        >
                            {pauseCompetitionMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Pause className="h-4 w-4" />
                            )}
                            Pause Competition
                        </button>
                    )}

                    {/* End Button - show when active or paused */}
                    {(settings?.status === 'active' || settings?.status === 'paused') && (
                        <button
                            onClick={() => {
                                if (confirm('Are you sure you want to end the competition? This action cannot be undone and trading will be permanently disabled.')) {
                                    endCompetitionMutation.mutate();
                                }
                            }}
                            disabled={endCompetitionMutation.isPending}
                            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                        >
                            {endCompetitionMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Square className="h-4 w-4" />
                            )}
                            End Competition
                        </button>
                    )}

                    {/* Status message for ended competition */}
                    {settings?.status === 'ended' && (
                        <p className="text-muted-foreground text-sm">
                            Competition has ended. Reset to start a new competition.
                        </p>
                    )}
                </div>
            </div>

            {/* Appearance */}
            <div className="card">
                <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                    <Palette className="h-5 w-5" />
                    Appearance
                </h2>

                <div>
                    <label className="label">Theme</label>
                    <div className="grid grid-cols-3 gap-3">
                        <button
                            onClick={() => handleThemeChange('light')}
                            className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-colors ${theme === 'light'
                                ? 'border-primary bg-primary/10'
                                : 'border-border hover:bg-secondary/50'
                                }`}
                        >
                            <Sun className="h-6 w-6" />
                            <span className="text-sm">Light</span>
                            {theme === 'light' && <Check className="h-4 w-4 text-primary" />}
                        </button>

                        <button
                            onClick={() => handleThemeChange('dark')}
                            className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-colors ${theme === 'dark'
                                ? 'border-primary bg-primary/10'
                                : 'border-border hover:bg-secondary/50'
                                }`}
                        >
                            <Moon className="h-6 w-6" />
                            <span className="text-sm">Dark</span>
                            {theme === 'dark' && <Check className="h-4 w-4 text-primary" />}
                        </button>

                        <button
                            onClick={() => handleThemeChange('system')}
                            className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-colors ${theme === 'system'
                                ? 'border-primary bg-primary/10'
                                : 'border-border hover:bg-secondary/50'
                                }`}
                        >
                            <Monitor className="h-6 w-6" />
                            <span className="text-sm">System</span>
                            {theme === 'system' && <Check className="h-4 w-4 text-primary" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Competition Settings */}
            <div className="card space-y-6">
                <h2 className="text-lg font-semibold">Competition Settings</h2>

                {/* Competition Name */}
                <div>
                    <label className="label">Competition Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g., Bullish Clash 2024"
                        className="input w-full"
                    />
                </div>

                {/* Starting Cash */}
                <div>
                    <label className="label">Starting Cash (Rs.)</label>
                    <input
                        type="number"
                        value={startingCash}
                        onChange={(e) => setStartingCash(e.target.value)}
                        placeholder="1000000"
                        className="input w-full"
                        min="0"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                        Each participant starts with {formatCurrency(parseFloat(startingCash) || 0)}
                    </p>
                </div>

                {/* Commission Rate */}
                <div>
                    <label className="label">Commission Rate (%)</label>
                    <input
                        type="number"
                        value={commissionRate}
                        onChange={(e) => setCommissionRate(e.target.value)}
                        placeholder="0.4"
                        className="input w-full"
                        min="0"
                        max="10"
                        step="0.01"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                        {commissionRate}% charged on each trade (buy and sell)
                    </p>
                </div>

                {/* Max Position Size */}
                <div>
                    <label className="label">Max Position Size (%)</label>
                    <input
                        type="number"
                        value={maxPositionSize}
                        onChange={(e) => setMaxPositionSize(e.target.value)}
                        placeholder="25"
                        className="input w-full"
                        min="1"
                        max="100"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                        Maximum {maxPositionSize}% of portfolio in a single stock
                    </p>
                </div>

                {/* Trading Hours */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="label">Trading Hours Start</label>
                        <input
                            type="time"
                            value={tradingHoursStart}
                            onChange={(e) => setTradingHoursStart(e.target.value)}
                            className="input w-full"
                        />
                    </div>
                    <div>
                        <label className="label">Trading Hours End</label>
                        <input
                            type="time"
                            value={tradingHoursEnd}
                            onChange={(e) => setTradingHoursEnd(e.target.value)}
                            className="input w-full"
                        />
                    </div>
                </div>
                <p className="text-xs text-muted-foreground -mt-4">
                    Trading allowed between {tradingHoursStart || '11:00'} - {tradingHoursEnd || '15:00'} (Nepal time)
                </p>

                {/* Competition Duration */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="label">Competition Start</label>
                        <input
                            type="datetime-local"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            className="input w-full"
                        />
                    </div>
                    <div>
                        <label className="label">Competition End</label>
                        <input
                            type="datetime-local"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            className="input w-full"
                        />
                    </div>
                </div>

                {/* Save Button */}
                <div className="flex gap-3 pt-4 border-t border-border">
                    <button
                        onClick={handleSave}
                        disabled={updateSettingsMutation.isPending}
                        className="btn-primary flex items-center gap-2"
                    >
                        {updateSettingsMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4" />
                        )}
                        Save Settings
                    </button>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="card border-red-500/30 bg-red-500/5">
                <h3 className="text-lg font-semibold text-red-500 mb-4">Danger Zone</h3>
                <p className="text-sm text-muted-foreground mb-4">
                    Resetting the competition will clear all portfolios, trades, and rankings. This action cannot be undone.
                </p>
                <button
                    onClick={() => {
                        if (
                            confirm(
                                'Are you sure you want to reset the entire competition? All portfolios and trades will be deleted.'
                            )
                        ) {
                            // Reset competition
                            competitionApi.reset().then(() => {
                                toast({ title: 'Competition Reset' });
                                queryClient.invalidateQueries();
                            });
                        }
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500/30 transition-colors"
                >
                    <RefreshCw className="h-4 w-4" />
                    Reset Competition
                </button>
            </div>
        </div>
    );
}
