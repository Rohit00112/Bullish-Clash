import { AchievementsService } from './achievements.service';
export declare class AchievementsController {
    private readonly achievementsService;
    private readonly db;
    constructor(achievementsService: AchievementsService, db: any);
    getDefinitions(): Promise<any>;
    getMyAchievements(req: any): Promise<any>;
    getMyCompetitionAchievements(req: any, competitionId: string): Promise<any>;
    getMyStats(req: any): Promise<{
        total: any;
        earned: any;
        totalPoints: any;
        byRarity: {
            common: any;
            uncommon: any;
            rare: any;
            epic: any;
            legendary: any;
        };
        recentAchievements: any;
    }>;
    checkAchievements(req: any): Promise<{
        message: string;
        awarded: any[];
    }>;
    getUserAchievements(userId: string): Promise<any>;
    getUserStats(userId: string): Promise<{
        total: any;
        earned: any;
        totalPoints: any;
        byRarity: {
            common: any;
            uncommon: any;
            rare: any;
            epic: any;
            legendary: any;
        };
        recentAchievements: any;
    }>;
}
