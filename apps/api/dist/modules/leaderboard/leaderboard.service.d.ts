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
export declare class LeaderboardService {
    private readonly db;
    private readonly redis;
    private readonly portfolioService;
    private readonly competitionService;
    constructor(db: any, redis: Redis, portfolioService: PortfolioService, competitionService: CompetitionService);
    getLeaderboard(options?: {
        limit?: number;
        offset?: number;
        isAdmin?: boolean;
    }): Promise<{
        entries: LeaderboardEntry[];
        totalParticipants: number;
        updatedAt: Date;
        isHidden?: boolean;
    }>;
    calculateLeaderboard(competitionId: string): Promise<{
        entries: LeaderboardEntry[];
        totalParticipants: number;
        updatedAt: Date;
    }>;
    getUserRank(userId: string, isAdmin?: boolean): Promise<{
        rank: number;
        totalParticipants: number;
        entry: LeaderboardEntry | null;
        isHidden?: boolean;
    }>;
    invalidateCache(competitionId?: string): Promise<void>;
    exportLeaderboard(): Promise<string>;
}
