import { TradingGateway } from '../websocket/trading.gateway';
interface AchievementCheck {
    userId: string;
    competitionId: string;
    type: 'trade' | 'portfolio_update' | 'competition_end';
    data?: any;
}
export declare class AchievementsService {
    private readonly db;
    private readonly tradingGateway;
    constructor(db: any, tradingGateway: TradingGateway);
    seedAchievements(): Promise<void>;
    getAllDefinitions(): Promise<any>;
    getUserAchievements(userId: string, competitionId?: string): Promise<any>;
    awardAchievement(userId: string, achievementId: string, competitionId?: string, metadata?: any): Promise<{
        awarded: boolean;
        achievement?: any;
    }>;
    checkTradeAchievements(check: AchievementCheck): Promise<any[]>;
    checkPortfolioAchievements(userId: string, competitionId: string): Promise<any[]>;
    checkCompetitionEndAchievements(competitionId: string): Promise<{
        userId: string;
        achievements: any[];
    }[]>;
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
export {};
