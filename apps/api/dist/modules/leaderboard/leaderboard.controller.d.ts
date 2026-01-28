import { Response } from 'express';
import { LeaderboardService } from './leaderboard.service';
export declare class LeaderboardController {
    private readonly leaderboardService;
    constructor(leaderboardService: LeaderboardService);
    getLeaderboard(role: string, limit?: number, offset?: number): Promise<{
        entries: import("./leaderboard.service").LeaderboardEntry[];
        totalParticipants: number;
        updatedAt: Date;
        isHidden?: boolean;
    }>;
    getMyRank(userId: string, role: string): Promise<{
        rank: number;
        totalParticipants: number;
        entry: import("./leaderboard.service").LeaderboardEntry | null;
        isHidden?: boolean;
    }>;
    exportLeaderboard(res: Response): Promise<void>;
}
