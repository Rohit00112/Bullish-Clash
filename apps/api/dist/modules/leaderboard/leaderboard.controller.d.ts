import { Response } from 'express';
import { LeaderboardService } from './leaderboard.service';
export declare class LeaderboardController {
    private readonly leaderboardService;
    constructor(leaderboardService: LeaderboardService);
    getLeaderboard(limit?: number, offset?: number): Promise<{
        entries: import("./leaderboard.service").LeaderboardEntry[];
        totalParticipants: number;
        updatedAt: Date;
    }>;
    getMyRank(userId: string): Promise<{
        rank: number;
        totalParticipants: number;
        entry: import("./leaderboard.service").LeaderboardEntry | null;
    }>;
    exportLeaderboard(res: Response): Promise<void>;
}
