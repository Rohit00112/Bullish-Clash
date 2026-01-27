'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { achievementsApi } from '@/lib/api';
import { Loader2, Trophy, Lock, Star, Sparkles, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: string;
    points: number;
    rarity: string;
    isSecret: boolean;
    earned: boolean;
    earnedAt: string | null;
    metadata: any;
}

interface AchievementStats {
    total: number;
    earned: number;
    totalPoints: number;
    byRarity: {
        common: number;
        uncommon: number;
        rare: number;
        epic: number;
        legendary: number;
    };
    recentAchievements: Achievement[];
}

const RARITY_COLORS = {
    common: 'border-gray-400 bg-gray-500/10',
    uncommon: 'border-green-400 bg-green-500/10',
    rare: 'border-blue-400 bg-blue-500/10',
    epic: 'border-purple-400 bg-purple-500/10',
    legendary: 'border-yellow-400 bg-yellow-500/10',
};

const RARITY_TEXT = {
    common: 'text-gray-400',
    uncommon: 'text-green-400',
    rare: 'text-blue-400',
    epic: 'text-purple-400',
    legendary: 'text-yellow-400',
};

const CATEGORY_LABELS: Record<string, string> = {
    milestone: '🏁 Milestones',
    trading: '📈 Trading',
    profit: '💰 Profit',
    special: '✨ Special',
};

export default function AchievementsPage() {
    const queryClient = useQueryClient();
    const [checkMessage, setCheckMessage] = useState<string | null>(null);

    // Fetch achievements
    const { data: achievements, isLoading: achievementsLoading } = useQuery({
        queryKey: ['achievements'],
        queryFn: async () => {
            const res = await achievementsApi.getMyAchievements();
            return res.data as Achievement[];
        },
    });

    // Fetch stats
    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['achievement-stats'],
        queryFn: async () => {
            const res = await achievementsApi.getMyStats();
            return res.data as AchievementStats;
        },
    });

    // Check achievements mutation
    const checkMutation = useMutation({
        mutationFn: async () => {
            const res = await achievementsApi.checkAchievements();
            return res.data;
        },
        onSuccess: (data) => {
            // Refresh achievements and stats
            queryClient.invalidateQueries({ queryKey: ['achievements'] });
            queryClient.invalidateQueries({ queryKey: ['achievement-stats'] });

            if (data.awarded?.length > 0) {
                setCheckMessage(`🎉 Unlocked ${data.awarded.length} achievement(s)!`);
            } else {
                setCheckMessage('No new achievements to unlock');
            }
            setTimeout(() => setCheckMessage(null), 3000);
        },
    });

    if (achievementsLoading || statsLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    // Group achievements by category
    const groupedAchievements = achievements?.reduce((acc, achievement) => {
        const category = achievement.category;
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(achievement);
        return acc;
    }, {} as Record<string, Achievement[]>) || {};

    const earnedCount = achievements?.filter(a => a.earned).length || 0;
    const totalCount = achievements?.length || 0;
    const progressPercent = totalCount > 0 ? (earnedCount / totalCount) * 100 : 0;

    return (
        <div className="space-y-6">
            {/* Check Message */}
            {checkMessage && (
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-center text-sm">
                    {checkMessage}
                </div>
            )}

            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Progress Card */}
                <div className="card md:col-span-2">
                    <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                            <Trophy className="h-8 w-8 text-primary" />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold">{earnedCount} / {totalCount}</h2>
                                <button
                                    onClick={() => checkMutation.mutate()}
                                    disabled={checkMutation.isPending}
                                    className="btn btn-sm btn-secondary flex items-center gap-1.5"
                                >
                                    <RefreshCw className={cn("h-4 w-4", checkMutation.isPending && "animate-spin")} />
                                    Check
                                </button>
                            </div>
                            <p className="text-sm text-muted-foreground">Achievements Unlocked</p>
                            <div className="mt-2 h-2 bg-secondary rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary transition-all duration-500"
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Points Card */}
                <div className="card">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                            <Star className="h-6 w-6 text-yellow-500" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold">{stats?.totalPoints || 0}</h3>
                            <p className="text-sm text-muted-foreground">Total Points</p>
                        </div>
                    </div>
                </div>

                {/* Rarity Breakdown */}
                <div className="card">
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">By Rarity</h3>
                    <div className="flex flex-wrap gap-2">
                        {stats?.byRarity && Object.entries(stats.byRarity).map(([rarity, count]) => (
                            count > 0 && (
                                <span
                                    key={rarity}
                                    className={cn(
                                        'px-2 py-1 rounded text-xs font-medium',
                                        RARITY_TEXT[rarity as keyof typeof RARITY_TEXT]
                                    )}
                                >
                                    {count} {rarity}
                                </span>
                            )
                        ))}
                        {(!stats?.byRarity || Object.values(stats.byRarity).every(v => v === 0)) && (
                            <span className="text-xs text-muted-foreground">
                                No achievements yet
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Recent Achievements */}
            {stats?.recentAchievements && stats.recentAchievements.length > 0 && (
                <div className="card">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-yellow-500" />
                        Recently Unlocked
                    </h2>
                    <div className="flex gap-4 overflow-x-auto pb-2">
                        {stats.recentAchievements.map((achievement) => (
                            <div
                                key={achievement.id}
                                className={cn(
                                    'flex-shrink-0 w-32 p-3 rounded-lg border-2 text-center',
                                    RARITY_COLORS[achievement.rarity as keyof typeof RARITY_COLORS]
                                )}
                            >
                                <div className="text-3xl mb-2">{achievement.icon}</div>
                                <p className="text-sm font-medium truncate">{achievement.name}</p>
                                <p className={cn(
                                    'text-xs capitalize',
                                    RARITY_TEXT[achievement.rarity as keyof typeof RARITY_TEXT]
                                )}>
                                    {achievement.rarity}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* All Achievements by Category */}
            {Object.entries(groupedAchievements).map(([category, categoryAchievements]) => (
                <div key={category} className="card">
                    <h2 className="text-lg font-semibold mb-4">
                        {CATEGORY_LABELS[category] || category}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {categoryAchievements.map((achievement) => (
                            <AchievementCard key={achievement.id} achievement={achievement} />
                        ))}
                    </div>
                </div>
            ))}

            {/* Empty State */}
            {(!achievements || achievements.length === 0) && (
                <div className="card text-center py-12">
                    <Trophy className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h2 className="text-xl font-semibold mb-2">No Achievements Yet</h2>
                    <p className="text-muted-foreground">
                        Start trading to unlock achievements and earn points!
                    </p>
                </div>
            )}
        </div>
    );
}

function AchievementCard({ achievement }: { achievement: Achievement }) {
    const isLocked = !achievement.earned;
    const isSecret = achievement.isSecret && isLocked;

    return (
        <div
            className={cn(
                'relative p-4 rounded-lg border-2 transition-all',
                isLocked
                    ? 'border-border bg-secondary/20 opacity-60'
                    : RARITY_COLORS[achievement.rarity as keyof typeof RARITY_COLORS],
                !isLocked && 'hover:scale-105'
            )}
        >
            {/* Rarity Badge */}
            <span
                className={cn(
                    'absolute top-2 right-2 px-1.5 py-0.5 rounded text-xs font-medium capitalize',
                    isLocked ? 'text-muted-foreground' : RARITY_TEXT[achievement.rarity as keyof typeof RARITY_TEXT]
                )}
            >
                {achievement.rarity}
            </span>

            {/* Icon */}
            <div className="text-4xl mb-3">
                {isSecret ? '❓' : achievement.icon}
            </div>

            {/* Name */}
            <h3 className={cn(
                'font-semibold mb-1',
                isLocked && 'text-muted-foreground'
            )}>
                {isSecret ? '???' : achievement.name}
            </h3>

            {/* Description */}
            <p className="text-sm text-muted-foreground mb-2">
                {isSecret ? 'This is a secret achievement' : achievement.description}
            </p>

            {/* Points */}
            <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                    +{achievement.points} pts
                </span>

                {isLocked ? (
                    <Lock className="h-4 w-4 text-muted-foreground" />
                ) : (
                    <span className="text-xs text-green-500">
                        ✓ Unlocked
                    </span>
                )}
            </div>

            {/* Earned Date */}
            {achievement.earnedAt && (
                <p className="text-xs text-muted-foreground mt-2">
                    {new Date(achievement.earnedAt).toLocaleDateString()}
                </p>
            )}
        </div>
    );
}
