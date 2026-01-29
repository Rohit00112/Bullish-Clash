'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Medal, Crown, TrendingUp, Users, Star, EyeOff } from 'lucide-react';
import { leaderboardApi } from '@/lib/api';
import { formatCurrency, formatPercent, formatNumber, getPriceChangeClass } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';

interface LeaderboardEntry {
    rank: number;
    userId: string;
    userName: string;
    portfolioValue: number;
    totalPL: number;
    totalPLPercent: number;
    totalTrades: number;
    isCurrentUser?: boolean;
}

export default function LeaderboardPage() {
    const { user } = useAuthStore();

    // Fetch leaderboard
    const { data: leaderboardData, isLoading } = useQuery({
        queryKey: ['leaderboard'],
        queryFn: async () => {
            const res = await leaderboardApi.getAll();
            return res.data;
        },
        refetchInterval: 10000,
    });

    // Fetch my rank
    const { data: myRank } = useQuery({
        queryKey: ['my-rank'],
        queryFn: async () => {
            const res = await leaderboardApi.getMyRank();
            return res.data;
        },
        refetchInterval: 10000,
    });

    // Map API response to frontend format
    const entries: LeaderboardEntry[] = (leaderboardData?.entries || []).map((entry: any) => ({
        rank: entry.rank,
        userId: entry.userId,
        userName: entry.fullName || entry.username,
        portfolioValue: entry.totalValue,
        totalPL: entry.totalPL,
        totalPLPercent: entry.totalPLPercent,
        totalTrades: entry.tradeCount,
        isCurrentUser: entry.userId === user?.id,
    }));

    // Get top 3 for podium
    const top3 = entries.slice(0, 3);
    const restOfLeaderboard = entries.slice(3);

    // Rank badge component
    const RankBadge = ({ rank }: { rank: number }) => {
        if (rank === 1) {
            return (
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-yellow-500/20">
                    <Crown className="h-5 w-5 text-yellow-500" />
                </div>
            );
        }
        if (rank === 2) {
            return (
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-400/20">
                    <Medal className="h-5 w-5 text-gray-400" />
                </div>
            );
        }
        if (rank === 3) {
            return (
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-600/20">
                    <Medal className="h-5 w-5 text-amber-600" />
                </div>
            );
        }
        return (
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-secondary">
                <span className="text-sm font-bold">{rank}</span>
            </div>
        );
    };

    // Show suspense mode only if hidden AND no entries (regular user view)
    if (leaderboardData?.isHidden && entries.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 space-y-6 animate-in fade-in zoom-in duration-500">
                <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full"></div>
                    <div className="relative bg-secondary/30 p-8 rounded-full border border-white/10 shadow-2xl">
                        <EyeOff className="h-20 w-20 text-primary opacity-50" />
                    </div>
                </div>
                <div className="text-center space-y-2 max-w-md">
                    <h1 className="text-3xl font-bold tracking-tight">Leaderboard in Suspense</h1>
                    <p className="text-muted-foreground">
                        The administrator has hidden the rankings to maintain suspense for the final results!
                    </p>
                </div>
                <div className="flex gap-4 p-4 bg-secondary/10 rounded-xl border border-white/5 backdrop-blur-sm">
                    <div className="text-center px-4">
                        <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Status</p>
                        <p className="text-lg font-semibold text-yellow-500">Hidden</p>
                    </div>
                    <div className="border-l border-white/10"></div>
                    <div className="text-center px-4">
                        <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Phase</p>
                        <p className="text-lg font-semibold">Final Review</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Trophy className="h-6 w-6 text-yellow-500" />
                        Leaderboard
                    </h1>
                    <p className="text-muted-foreground">Real-time rankings based on portfolio value</p>
                </div>

                {/* My Rank Card */}
                {myRank && myRank.rank > 0 && (
                    <div className="card bg-primary/10 border-primary/30 flex items-center gap-4">
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/20">
                            <Star className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Your Rank</p>
                            <p className="text-2xl font-bold">#{myRank.rank}</p>
                        </div>
                        <div className="border-l border-border pl-4 ml-2">
                            <p className="text-sm text-muted-foreground">Portfolio</p>
                            <p className="font-bold">{formatCurrency(myRank.entry?.totalValue || 0)}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Admin View Warning */}
            {leaderboardData?.isHidden && entries.length > 0 && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                    <div className="bg-yellow-500/20 p-2 rounded-full">
                        <EyeOff className="h-5 w-5 text-yellow-500" />
                    </div>
                    <div>
                        <h3 className="font-bold text-yellow-500 flex items-center gap-2">
                            Admin View: Suspense Mode Active
                        </h3>
                        <p className="text-sm text-muted-foreground text-yellow-500/80">
                            The leaderboard is currently <strong>hidden</strong> from participants. You can see this because you are an admin.
                        </p>
                    </div>
                </div>
            )}

            {/* Top 3 Podium */}
            {top3.length >= 3 && (
                <div className="grid grid-cols-3 gap-4">
                    {/* Second Place */}
                    <div className="mt-8">
                        <div
                            className={`card text-center ${top3[1]?.isCurrentUser ? 'ring-2 ring-primary' : ''
                                }`}
                        >
                            <div className="flex justify-center mb-3">
                                <div className="w-16 h-16 rounded-full bg-gray-400/20 flex items-center justify-center">
                                    <Medal className="h-8 w-8 text-gray-400" />
                                </div>
                            </div>
                            <p className="text-lg font-bold text-gray-400 mb-1">2nd</p>
                            <p className="font-medium truncate">{top3[1]?.userName}</p>
                            <p className="text-xl font-bold mt-2">
                                {formatCurrency(top3[1]?.portfolioValue || 0)}
                            </p>
                            <p className={`text-sm ${getPriceChangeClass(top3[1]?.totalPLPercent || 0)}`}>
                                {formatPercent(top3[1]?.totalPLPercent || 0)}
                            </p>
                        </div>
                    </div>

                    {/* First Place */}
                    <div>
                        <div
                            className={`card text-center bg-gradient-to-b from-yellow-500/10 to-transparent border-yellow-500/30 ${top3[0]?.isCurrentUser ? 'ring-2 ring-primary' : ''
                                }`}
                        >
                            <div className="flex justify-center mb-3">
                                <div className="w-20 h-20 rounded-full bg-yellow-500/20 flex items-center justify-center">
                                    <Crown className="h-10 w-10 text-yellow-500" />
                                </div>
                            </div>
                            <p className="text-xl font-bold text-yellow-500 mb-1">1st</p>
                            <p className="font-medium text-lg truncate">{top3[0]?.userName}</p>
                            <p className="text-2xl font-bold mt-2">
                                {formatCurrency(top3[0]?.portfolioValue || 0)}
                            </p>
                            <p className={`text-sm ${getPriceChangeClass(top3[0]?.totalPLPercent || 0)}`}>
                                {formatPercent(top3[0]?.totalPLPercent || 0)}
                            </p>
                        </div>
                    </div>

                    {/* Third Place */}
                    <div className="mt-12">
                        <div
                            className={`card text-center ${top3[2]?.isCurrentUser ? 'ring-2 ring-primary' : ''
                                }`}
                        >
                            <div className="flex justify-center mb-3">
                                <div className="w-14 h-14 rounded-full bg-amber-600/20 flex items-center justify-center">
                                    <Medal className="h-7 w-7 text-amber-600" />
                                </div>
                            </div>
                            <p className="text-lg font-bold text-amber-600 mb-1">3rd</p>
                            <p className="font-medium truncate">{top3[2]?.userName}</p>
                            <p className="text-xl font-bold mt-2">
                                {formatCurrency(top3[2]?.portfolioValue || 0)}
                            </p>
                            <p className={`text-sm ${getPriceChangeClass(top3[2]?.totalPLPercent || 0)}`}>
                                {formatPercent(top3[2]?.totalPLPercent || 0)}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="card">
                    <div className="flex items-center gap-3">
                        <Users className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <p className="text-sm text-muted-foreground">Total Participants</p>
                            <p className="text-xl font-bold">{entries.length}</p>
                        </div>
                    </div>
                </div>
                <div className="card">
                    <div className="flex items-center gap-3">
                        <TrendingUp className="h-5 w-5 text-green-500" />
                        <div>
                            <p className="text-sm text-muted-foreground">Highest Return</p>
                            <p className="text-xl font-bold text-green-500">
                                {formatPercent(top3[0]?.totalPLPercent || 0)}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="card">
                    <div className="flex items-center gap-3">
                        <Trophy className="h-5 w-5 text-yellow-500" />
                        <div>
                            <p className="text-sm text-muted-foreground">Prize Pool</p>
                            <p className="text-xl font-bold text-yellow-500">Coming Soon</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Full Leaderboard Table */}
            <div className="card">
                <h2 className="text-lg font-semibold mb-4">Full Rankings</h2>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-sm text-muted-foreground border-b border-border">
                                <th className="text-left py-3 px-4">Rank</th>
                                <th className="text-left py-3 px-4">Trader</th>
                                <th className="text-right py-3 px-4">Portfolio Value</th>
                                <th className="text-right py-3 px-4">Total P/L</th>
                                <th className="text-right py-3 px-4">Return %</th>
                                <th className="text-right py-3 px-4">Trades</th>
                            </tr>
                        </thead>
                        <tbody>
                            {entries.map((entry) => (
                                <tr
                                    key={entry.userId}
                                    className={`border-b border-border transition-colors ${entry.isCurrentUser
                                        ? 'bg-primary/10 hover:bg-primary/15'
                                        : 'hover:bg-secondary/30'
                                        }`}
                                >
                                    <td className="py-3 px-4">
                                        <RankBadge rank={entry.rank} />
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">{entry.userName}</span>
                                            {entry.isCurrentUser && (
                                                <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                                                    You
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="text-right py-3 px-4 font-mono font-medium">
                                        {formatCurrency(entry.portfolioValue)}
                                    </td>
                                    <td className={`text-right py-3 px-4 font-mono ${getPriceChangeClass(entry.totalPL)}`}>
                                        {formatCurrency(entry.totalPL)}
                                    </td>
                                    <td className={`text-right py-3 px-4 font-mono ${getPriceChangeClass(entry.totalPLPercent)}`}>
                                        {formatPercent(entry.totalPLPercent)}
                                    </td>
                                    <td className="text-right py-3 px-4 font-mono text-muted-foreground">
                                        {formatNumber(entry.totalTrades)}
                                    </td>
                                </tr>
                            ))}

                            {entries.length === 0 && !isLoading && (
                                <tr>
                                    <td colSpan={6} className="text-center py-12 text-muted-foreground">
                                        No participants yet
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
