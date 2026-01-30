// ============================================================
// Bullish Clash - Leaderboard Service
// ============================================================

import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { eq, and, sql } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../../database/database.module';
import { REDIS_CLIENT } from '../redis/redis.module';
import * as schema from '../../database/schema';
import { PortfolioService } from '../portfolio/portfolio.service';
import { CompetitionService } from '../competition/competition.service';
import Redis from 'ioredis';

export interface LeaderboardEntry {
    rank: number;
    userId: string;
    username: string;
    fullName: string;
    avatarUrl?: string;
    totalValue: number;
    cash: number;
    investedValue: number;
    unrealizedPL: number;
    realizedPL: number;
    totalPL: number;
    totalPLPercent: number;
    tradeCount: number;
    previousRank?: number;
    rankChange: number;
}

@Injectable()
export class LeaderboardService {
    constructor(
        @Inject(DATABASE_CONNECTION) private readonly db: any,
        @Inject(REDIS_CLIENT) private readonly redis: Redis,
        @Inject(forwardRef(() => PortfolioService)) private readonly portfolioService: PortfolioService,
        @Inject(forwardRef(() => CompetitionService)) private readonly competitionService: CompetitionService,
    ) { }

    // Get full leaderboard
    async getLeaderboard(options?: { limit?: number; offset?: number; isAdmin?: boolean }): Promise<{
        entries: LeaderboardEntry[];
        totalParticipants: number;
        updatedAt: Date;
        isHidden?: boolean;
    }> {
        const competition = await this.competitionService.getActiveCompetition();

        if (!competition) {
            return { entries: [], totalParticipants: 0, updatedAt: new Date() };
        }

        // If leaderboard is hidden and user is not admin, return empty entries or minimal info
        // if (competition.isLeaderboardHidden && !options?.isAdmin) {
        if (false) { // Temporarily disabled
            return {
                entries: [],
                totalParticipants: 0, // We could return real count but entries empty
                updatedAt: new Date(),
                isHidden: true
            };
        }

        const limit = options?.limit || 100;
        const offset = options?.offset || 0;

        // Try to get from cache
        const cacheKey = `leaderboard:${competition.id}`;
        const cached = await this.redis.get(cacheKey);

        if (cached) {
            const data = JSON.parse(cached);
            return {
                entries: data.entries.slice(offset, offset + limit),
                totalParticipants: data.totalParticipants,
                updatedAt: new Date(data.updatedAt),
                // isHidden: competition.isLeaderboardHidden, // Expose status to admins even from cache
            };
        }

        // Calculate fresh leaderboard
        const leaderboard = await this.calculateLeaderboard(competition.id);

        // Cache for 5 seconds
        await this.redis.setex(cacheKey, 5, JSON.stringify(leaderboard));

        return {
            entries: leaderboard.entries.slice(offset, offset + limit),
            totalParticipants: leaderboard.totalParticipants,
            updatedAt: leaderboard.updatedAt,
            // isHidden: competition.isLeaderboardHidden, // Expose status to admins
        };
    }

    // Calculate full leaderboard
    async calculateLeaderboard(competitionId: string): Promise<{
        entries: LeaderboardEntry[];
        totalParticipants: number;
        updatedAt: Date;
    }> {
        // Get all participants
        const participants = await this.db.query.competitionParticipants.findMany({
            where: and(
                eq(schema.competitionParticipants.competitionId, competitionId),
                eq(schema.competitionParticipants.isActive, true),
            ),
        });

        // Get user info
        const userIds = participants.map((p: any) => p.userId);
        if (userIds.length === 0) {
            return { entries: [], totalParticipants: 0, updatedAt: new Date() };
        }

        const users = await this.db.query.users.findMany();
        const userMap = new Map(users.map((u: any) => [u.id, u]));

        // Get portfolios
        const portfolios = await this.db.query.portfolios.findMany({
            where: eq(schema.portfolios.competitionId, competitionId),
        });
        const portfolioMap = new Map(portfolios.map((p: any) => [p.userId, p]));

        // Get all holdings
        const holdings = await this.db.query.holdings.findMany({
            where: eq(schema.holdings.competitionId, competitionId),
        });

        // Group holdings by user
        const holdingsByUser = new Map<string, any[]>();
        holdings.forEach((h: any) => {
            if (!holdingsByUser.has(h.userId)) {
                holdingsByUser.set(h.userId, []);
            }
            holdingsByUser.get(h.userId)!.push(h);
        });

        // Get latest prices
        const latestPrices = await this.db.query.latestPrices.findMany();
        const priceMap = new Map(latestPrices.map((p: any) => [p.symbolId, parseFloat(p.price)]));

        // Get competition starting cash
        const competition = await this.db.query.competitions.findFirst({
            where: eq(schema.competitions.id, competitionId),
        });
        const startingCash = parseFloat(competition?.startingCash || '1000000');

        // Get previous ranks from cache
        const prevRanksKey = `leaderboard_ranks:${competitionId}`;
        const prevRanksStr = await this.redis.get(prevRanksKey);
        const previousRanks: Record<string, number> = prevRanksStr ? JSON.parse(prevRanksStr) : {};

        // Calculate entry for each participant
        const entries: LeaderboardEntry[] = [];

        for (const participant of participants) {
            const user = userMap.get(participant.userId);
            const portfolio = portfolioMap.get(participant.userId);
            const userHoldings = holdingsByUser.get(participant.userId) || [];

            if (!user || !portfolio) continue;

            const cash = parseFloat((portfolio as any).cash);

            // Calculate invested value and unrealized P/L
            let investedValue = 0;
            let unrealizedPL = 0;

            for (const holding of userHoldings) {
                const currentPrice = priceMap.get(holding.symbolId) || parseFloat(holding.avgPrice);
                const avgPrice = parseFloat(holding.avgPrice);
                const marketValue = (holding.quantity as number) * (currentPrice as number);
                const costBasis = holding.quantity * avgPrice;

                investedValue += marketValue;
                unrealizedPL += marketValue - costBasis;
            }

            const realizedPL = parseFloat((portfolio as any).realizedPL);
            const totalValue = cash + investedValue;
            const totalPL = unrealizedPL + realizedPL;
            const totalPLPercent = startingCash > 0 ? ((totalValue - startingCash) / startingCash) * 100 : 0;

            entries.push({
                rank: 0, // Will be set after sorting
                userId: (user as any).id,
                username: (user as any).username,
                fullName: (user as any).fullName,
                avatarUrl: (user as any).avatarUrl,
                totalValue,
                cash,
                investedValue,
                unrealizedPL,
                realizedPL,
                totalPL,
                totalPLPercent,
                tradeCount: (portfolio as any).tradeCount,
                previousRank: previousRanks[(user as any).id],
                rankChange: 0, // Will be calculated after sorting
            });
        }

        // Sort by total value (descending)
        entries.sort((a, b) => b.totalValue - a.totalValue);

        // Assign ranks and calculate rank change
        const newRanks: Record<string, number> = {};
        entries.forEach((entry, index) => {
            entry.rank = index + 1;
            newRanks[entry.userId] = entry.rank;

            if (entry.previousRank) {
                entry.rankChange = entry.previousRank - entry.rank;
            }
        });

        // Save new ranks
        await this.redis.setex(prevRanksKey, 3600, JSON.stringify(newRanks)); // Cache for 1 hour

        return {
            entries,
            totalParticipants: entries.length,
            updatedAt: new Date(),
        };
    }

    // Get user's rank
    async getUserRank(userId: string, isAdmin: boolean = false): Promise<{
        rank: number;
        totalParticipants: number;
        entry: LeaderboardEntry | null;
        isHidden?: boolean;
    }> {
        const competition = await this.competitionService.getActiveCompetition();
        // if (competition?.isLeaderboardHidden && !isAdmin) {
        if (false) { // Temporarily disabled
            return {
                rank: 0,
                totalParticipants: 0,
                entry: null,
                isHidden: true
            };
        }

        const leaderboard = await this.getLeaderboard({ limit: 10000, isAdmin });
        const entry = leaderboard.entries.find(e => e.userId === userId);

        return {
            rank: entry?.rank || 0,
            totalParticipants: leaderboard.totalParticipants,
            entry: entry || null,
        };
    }

    // Invalidate cache (called after price updates or trades)
    async invalidateCache(competitionId?: string) {
        if (competitionId) {
            await this.redis.del(`leaderboard:${competitionId}`);
        } else {
            // Invalidate all leaderboard caches
            const keys = await this.redis.keys('leaderboard:*');
            if (keys.length > 0) {
                await this.redis.del(...keys);
            }
        }
    }

    // Export leaderboard as CSV data
    async exportLeaderboard(): Promise<string> {
        const leaderboard = await this.getLeaderboard({ limit: 10000 });

        const headers = [
            'Rank',
            'Username',
            'Full Name',
            'Total Value (NPR)',
            'Cash (NPR)',
            'Invested Value (NPR)',
            'Unrealized P/L (NPR)',
            'Realized P/L (NPR)',
            'Total P/L (NPR)',
            'Total P/L %',
            'Trade Count',
        ];

        const rows = leaderboard.entries.map(entry => [
            entry.rank,
            entry.username,
            entry.fullName,
            entry.totalValue.toFixed(2),
            entry.cash.toFixed(2),
            entry.investedValue.toFixed(2),
            entry.unrealizedPL.toFixed(2),
            entry.realizedPL.toFixed(2),
            entry.totalPL.toFixed(2),
            entry.totalPLPercent.toFixed(2),
            entry.tradeCount,
        ]);

        return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    }
}
