'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, Wallet, PieChart, Activity, Clock } from 'lucide-react';
import { portfolioApi, competitionApi, leaderboardApi, pricesApi } from '@/lib/api';
import { formatCurrency, formatPercent, getCountdown, getPriceChangeClass } from '@/lib/utils';
import { usePriceStore } from '@/stores/price-store';
import { useAuthStore } from '@/stores/auth-store';
import Link from 'next/link';

export default function DashboardPage() {
    const { user } = useAuthStore();
    const { setPrices, getAllPrices } = usePriceStore();
    const [countdown, setCountdown] = useState({ hours: 0, minutes: 0, seconds: 0, total: 0 });

    // Fetch portfolio
    const { data: portfolio } = useQuery({
        queryKey: ['portfolio'],
        queryFn: async () => {
            const res = await portfolioApi.get();
            return res.data;
        },
        refetchInterval: 10000,
    });

    // Fetch competition stats
    const { data: competition } = useQuery({
        queryKey: ['competition-stats'],
        queryFn: async () => {
            const res = await competitionApi.getStats();
            return res.data;
        },
        refetchInterval: 5000,
    });

    // Fetch user rank
    const { data: rankData } = useQuery({
        queryKey: ['my-rank'],
        queryFn: async () => {
            const res = await leaderboardApi.getMyRank();
            return res.data;
        },
        refetchInterval: 10000,
    });

    // Fetch prices
    const { data: pricesData } = useQuery({
        queryKey: ['prices'],
        queryFn: async () => {
            const res = await pricesApi.getAll();
            return res.data;
        },
        refetchInterval: 5000,
    });

    // Update price store
    useEffect(() => {
        if (pricesData) {
            setPrices(pricesData);
        }
    }, [pricesData, setPrices]);

    // Competition countdown
    useEffect(() => {
        if (!competition?.endTime) return;

        const interval = setInterval(() => {
            setCountdown(getCountdown(competition.endTime));
        }, 1000);

        return () => clearInterval(interval);
    }, [competition?.endTime]);

    const prices = getAllPrices();
    const topGainers = [...prices].sort((a, b) => b.changePercent - a.changePercent).slice(0, 5);
    const topLosers = [...prices].sort((a, b) => a.changePercent - b.changePercent).slice(0, 5);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Welcome back, {user?.fullName?.split(' ')[0]}!</h1>
                    <p className="text-muted-foreground">Here&apos;s your trading overview</p>
                </div>

                {/* Competition Timer */}
                {competition && countdown.total > 0 && (
                    <div className="card flex items-center gap-3 bg-primary/10 border-primary/30">
                        <Clock className="h-5 w-5 text-primary" />
                        <div>
                            <p className="text-xs text-muted-foreground">Competition ends in</p>
                            <p className="font-mono font-bold text-lg">
                                {countdown.hours.toString().padStart(2, '0')}:
                                {countdown.minutes.toString().padStart(2, '0')}:
                                {countdown.seconds.toString().padStart(2, '0')}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Portfolio Value */}
                <div className="card">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Portfolio Value</span>
                        <Wallet className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-2xl font-bold">{formatCurrency(portfolio?.totalValue || 0)}</p>
                    <p className={`text-sm ${getPriceChangeClass(portfolio?.totalPL || 0)}`}>
                        {formatPercent(portfolio?.totalPLPercent || 0)} all time
                    </p>
                </div>

                {/* Cash Balance */}
                <div className="card">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Cash Balance</span>
                        <PieChart className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-2xl font-bold">{formatCurrency(portfolio?.cash || 0)}</p>
                    <p className="text-sm text-muted-foreground">
                        Available for trading
                    </p>
                </div>

                {/* Total P/L */}
                <div className="card">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Total P/L</span>
                        {(portfolio?.totalPL || 0) >= 0 ? (
                            <TrendingUp className="h-5 w-5 text-green-500" />
                        ) : (
                            <TrendingDown className="h-5 w-5 text-red-500" />
                        )}
                    </div>
                    <p className={`text-2xl font-bold ${getPriceChangeClass(portfolio?.totalPL || 0)}`}>
                        {formatCurrency(portfolio?.totalPL || 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                        Unrealized: {formatCurrency(portfolio?.unrealizedPL || 0)}
                    </p>
                </div>

                {/* Rank */}
                <div className="card">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Your Rank</span>
                        <Activity className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-2xl font-bold">
                        #{rankData?.rank || '-'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                        of {rankData?.totalParticipants || 0} traders
                    </p>
                </div>
            </div>

            {/* Positions & Market */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Your Positions */}
                <div className="card">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold">Your Positions</h2>
                        <Link href="/dashboard/portfolio" className="text-sm text-primary hover:underline">
                            View all
                        </Link>
                    </div>

                    {portfolio?.positions?.length > 0 ? (
                        <div className="space-y-3">
                            {portfolio.positions.slice(0, 5).map((position: any) => (
                                <div
                                    key={position.symbolId}
                                    className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg"
                                >
                                    <div>
                                        <p className="font-medium">{position.symbol}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {position.quantity} shares @ {formatCurrency(position.avgPrice)}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-medium">{formatCurrency(position.marketValue)}</p>
                                        <p className={`text-sm ${getPriceChangeClass(position.unrealizedPL)}`}>
                                            {formatPercent(position.unrealizedPLPercent)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            <p>No positions yet</p>
                            <Link href="/dashboard/trade" className="text-primary hover:underline text-sm">
                                Start trading
                            </Link>
                        </div>
                    )}
                </div>

                {/* Market Movers */}
                <div className="card">
                    <h2 className="text-lg font-semibold mb-4">Market Movers</h2>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Top Gainers */}
                        <div>
                            <h3 className="text-sm font-medium text-green-500 mb-2 flex items-center gap-1">
                                <TrendingUp className="h-4 w-4" /> Top Gainers
                            </h3>
                            <div className="space-y-2">
                                {topGainers.slice(0, 5).map((stock) => (
                                    <div key={stock.symbolId} className="flex justify-between text-sm">
                                        <span>{stock.symbol}</span>
                                        <span className="text-green-500">{formatPercent(stock.changePercent)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Top Losers */}
                        <div>
                            <h3 className="text-sm font-medium text-red-500 mb-2 flex items-center gap-1">
                                <TrendingDown className="h-4 w-4" /> Top Losers
                            </h3>
                            <div className="space-y-2">
                                {topLosers.slice(0, 5).map((stock) => (
                                    <div key={stock.symbolId} className="flex justify-between text-sm">
                                        <span>{stock.symbol}</span>
                                        <span className="text-red-500">{formatPercent(stock.changePercent)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <Link
                        href="/dashboard/trade"
                        className="btn-primary w-full mt-4 text-center block"
                    >
                        Trade Now
                    </Link>
                </div>
            </div>

            {/* Competition Info */}
            {competition && (
                <div className="card bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h2 className="text-lg font-semibold">{competition.name}</h2>
                            <p className="text-sm text-muted-foreground">
                                {competition.participantCount} participants • {competition.totalTrades} total trades
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Link href="/dashboard/leaderboard" className="btn-secondary">
                                View Leaderboard
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
