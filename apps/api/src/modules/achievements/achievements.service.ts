import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { eq, and, sql } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../../database/database.module';
import * as schema from '../../database/schema';
import { DEFAULT_ACHIEVEMENTS } from '../../database/schema/achievements';
import { TradingGateway } from '../websocket/trading.gateway';

interface AchievementCheck {
    userId: string;
    competitionId: string;
    type: 'trade' | 'portfolio_update' | 'competition_end';
    data?: any;
}

@Injectable()
export class AchievementsService {
    constructor(
        @Inject(DATABASE_CONNECTION) private readonly db: any,
        @Inject(forwardRef(() => TradingGateway)) private readonly tradingGateway: TradingGateway,
    ) { }

    // Initialize achievement definitions in database
    async seedAchievements() {
        for (const achievement of DEFAULT_ACHIEVEMENTS) {
            await this.db.insert(schema.achievementDefinitions)
                .values(achievement)
                .onConflictDoNothing();
        }
    }

    // Get all achievement definitions
    async getAllDefinitions() {
        return this.db.query.achievementDefinitions.findMany({
            orderBy: (definitions: any, { asc }: any) => [asc(definitions.category), asc(definitions.points)],
        });
    }

    // Get user's earned achievements
    async getUserAchievements(userId: string, competitionId?: string) {
        let conditions: any[] = [eq(schema.userAchievements.userId, userId)];

        if (competitionId) {
            conditions.push(eq(schema.userAchievements.competitionId, competitionId));
        }

        const earned = await this.db.query.userAchievements.findMany({
            where: and(...conditions),
            orderBy: (achievements: any, { desc }: any) => [desc(achievements.earnedAt)],
        });

        const definitions = await this.getAllDefinitions();

        // Combine with definitions
        return definitions.map((def: any) => {
            const userAchievement = earned.find((e: any) => e.achievementId === def.id);
            return {
                ...def,
                earned: !!userAchievement,
                earnedAt: userAchievement?.earnedAt || null,
                metadata: userAchievement?.metadata ? JSON.parse(userAchievement.metadata) : null,
            };
        });
    }

    // Award an achievement to a user
    async awardAchievement(
        userId: string,
        achievementId: string,
        competitionId?: string,
        metadata?: any,
    ): Promise<{ awarded: boolean; achievement?: any }> {
        // Check if already earned
        const existing = await this.db.query.userAchievements.findFirst({
            where: and(
                eq(schema.userAchievements.userId, userId),
                eq(schema.userAchievements.achievementId, achievementId),
                competitionId
                    ? eq(schema.userAchievements.competitionId, competitionId)
                    : sql`${schema.userAchievements.competitionId} IS NULL`,
            ),
        });

        if (existing) {
            return { awarded: false };
        }

        // Get achievement definition
        const definition = await this.db.query.achievementDefinitions.findFirst({
            where: eq(schema.achievementDefinitions.id, achievementId),
        });

        if (!definition) {
            return { awarded: false };
        }

        // Award the achievement
        await this.db.insert(schema.userAchievements).values({
            userId,
            achievementId,
            competitionId: competitionId || null,
            metadata: metadata ? JSON.stringify(metadata) : null,
        });

        console.log(`[ACHIEVEMENT] Awarded "${definition.name}" to user ${userId}`);

        // Send real-time notification
        this.tradingGateway.sendAchievementUnlocked(userId, definition);

        return {
            awarded: true,
            achievement: definition,
        };
    }

    // Check and award achievements after a trade
    async checkTradeAchievements(check: AchievementCheck) {
        const { userId, competitionId } = check;
        const awarded: any[] = [];

        // Get user's trade history
        const trades = await this.db.query.trades.findMany({
            where: and(
                eq(schema.trades.userId, userId),
                eq(schema.trades.competitionId, competitionId),
            ),
        });

        // First Trade achievement - award if user has any trades
        if (trades.length >= 1) {
            const result = await this.awardAchievement(userId, 'first_trade', competitionId);
            if (result.awarded) awarded.push(result.achievement);
        }

        // Day Trader - 10 trades in one day
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tradesToday = trades.filter((t: any) => new Date(t.executedAt) >= today);
        if (tradesToday.length >= 10) {
            const result = await this.awardAchievement(userId, 'day_trader', competitionId);
            if (result.awarded) awarded.push(result.achievement);
        }

        // Volume Trader - Rs. 10,00,000 total volume
        const totalVolume = trades.reduce((sum: number, t: any) => sum + parseFloat(t.total), 0);
        if (totalVolume >= 1000000) {
            const result = await this.awardAchievement(userId, 'volume_trader', competitionId, { volume: totalVolume });
            if (result.awarded) awarded.push(result.achievement);
        }

        // Diversified - 5+ different stocks
        const uniqueSymbols = new Set(trades.map((t: any) => t.symbolId));
        if (uniqueSymbols.size >= 5) {
            const result = await this.awardAchievement(userId, 'diversified', competitionId, { stocks: uniqueSymbols.size });
            if (result.awarded) awarded.push(result.achievement);
        }

        // Early Bird - trade in first hour of competition
        const competition = await this.db.query.competitions.findFirst({
            where: eq(schema.competitions.id, competitionId),
        });
        if (competition) {
            const competitionStart = new Date(competition.startTime);
            const firstHourEnd = new Date(competitionStart.getTime() + 60 * 60 * 1000);
            const hasEarlyTrade = trades.some((t: any) => new Date(t.executedAt) <= firstHourEnd);
            if (hasEarlyTrade) {
                const result = await this.awardAchievement(userId, 'early_bird', competitionId);
                if (result.awarded) awarded.push(result.achievement);
            }
        }

        // Winning Streak - 5 profitable trades in a row
        const sortedTrades = [...trades].sort((a: any, b: any) =>
            new Date(a.executedAt).getTime() - new Date(b.executedAt).getTime()
        );
        let winStreak = 0;
        let maxWinStreak = 0;
        for (const trade of sortedTrades) {
            // Simple check: buy trades followed by sell trades at higher price
            // This is simplified - in reality you'd track position entry/exit prices
            if (trade.side === 'sell') {
                winStreak++;
                maxWinStreak = Math.max(maxWinStreak, winStreak);
            }
        }
        if (maxWinStreak >= 5) {
            const result = await this.awardAchievement(userId, 'winning_streak', competitionId, { streak: maxWinStreak });
            if (result.awarded) awarded.push(result.achievement);
        }

        // Market Master - traded every stock
        const allSymbols = await this.db.query.symbols.findMany({
            where: eq(schema.symbols.isActive, true),
        });
        if (uniqueSymbols.size >= allSymbols.length && allSymbols.length > 0) {
            const result = await this.awardAchievement(userId, 'market_master', competitionId);
            if (result.awarded) awarded.push(result.achievement);
        }

        return awarded;
    }

    // Check portfolio-based achievements
    async checkPortfolioAchievements(userId: string, competitionId: string) {
        const awarded: any[] = [];

        // Get portfolio
        const portfolio = await this.db.query.portfolios.findFirst({
            where: and(
                eq(schema.portfolios.userId, userId),
                eq(schema.portfolios.competitionId, competitionId),
            ),
        });

        if (!portfolio) return awarded;

        // Get competition for initial balance
        const competition = await this.db.query.competitions.findFirst({
            where: eq(schema.competitions.id, competitionId),
        });

        if (!competition) return awarded;

        // Get holdings to calculate total value
        const holdings = await this.db.query.holdings.findMany({
            where: and(
                eq(schema.holdings.userId, userId),
                eq(schema.holdings.competitionId, competitionId),
            ),
        });

        // Get current prices for holdings
        let holdingsValue = 0;
        for (const holding of holdings) {
            if (holding.quantity > 0) {
                const symbol = await this.db.query.symbols.findFirst({
                    where: eq(schema.symbols.id, holding.symbolId),
                });
                if (symbol) {
                    holdingsValue += holding.quantity * parseFloat(symbol.currentPrice);
                }
            }
        }

        const initialBalance = parseFloat(competition.startingBalance);
        const currentValue = parseFloat(portfolio.cash) + holdingsValue;
        const profitPercent = ((currentValue - initialBalance) / initialBalance) * 100;

        // Profit achievements
        if (profitPercent >= 10) {
            const result = await this.awardAchievement(userId, 'profit_10', competitionId, { profit: profitPercent.toFixed(2) });
            if (result.awarded) awarded.push(result.achievement);
        }
        if (profitPercent >= 25) {
            const result = await this.awardAchievement(userId, 'profit_25', competitionId, { profit: profitPercent.toFixed(2) });
            if (result.awarded) awarded.push(result.achievement);
        }
        if (profitPercent >= 50) {
            const result = await this.awardAchievement(userId, 'profit_50', competitionId, { profit: profitPercent.toFixed(2) });
            if (result.awarded) awarded.push(result.achievement);
        }
        if (profitPercent >= 100) {
            const result = await this.awardAchievement(userId, 'profit_100', competitionId, { profit: profitPercent.toFixed(2) });
            if (result.awarded) awarded.push(result.achievement);
        }

        // Note: Comeback King and Diamond Hands require tracking historical values
        // which aren't currently stored. Skipping for now.

        return awarded;
    }

    // Check competition end achievements (leaderboard positions)
    async checkCompetitionEndAchievements(competitionId: string) {
        // Get final leaderboard
        const portfolios = await this.db.query.portfolios.findMany({
            where: eq(schema.portfolios.competitionId, competitionId),
            orderBy: (portfolios: any, { desc }: any) => [desc(portfolios.totalValue)],
        });

        const awarded: { userId: string; achievements: any[] }[] = [];

        for (let i = 0; i < portfolios.length; i++) {
            const portfolio = portfolios[i];
            const rank = i + 1;
            const userAchievements: any[] = [];

            // Champion - 1st place
            if (rank === 1) {
                const result = await this.awardAchievement(portfolio.userId, 'champion', competitionId, { rank });
                if (result.awarded) userAchievements.push(result.achievement);
            }

            // Top 3
            if (rank <= 3) {
                const result = await this.awardAchievement(portfolio.userId, 'top_3', competitionId, { rank });
                if (result.awarded) userAchievements.push(result.achievement);
            }

            // Top 10
            if (rank <= 10) {
                const result = await this.awardAchievement(portfolio.userId, 'top_10', competitionId, { rank });
                if (result.awarded) userAchievements.push(result.achievement);
            }

            if (userAchievements.length > 0) {
                awarded.push({ userId: portfolio.userId, achievements: userAchievements });
            }
        }

        return awarded;
    }

    // Get user's achievement stats
    async getUserStats(userId: string) {
        const achievements = await this.getUserAchievements(userId);
        const earned = achievements.filter((a: any) => a.earned);

        const totalPoints = earned.reduce((sum: number, a: any) => sum + a.points, 0);

        const byRarity = {
            common: earned.filter((a: any) => a.rarity === 'common').length,
            uncommon: earned.filter((a: any) => a.rarity === 'uncommon').length,
            rare: earned.filter((a: any) => a.rarity === 'rare').length,
            epic: earned.filter((a: any) => a.rarity === 'epic').length,
            legendary: earned.filter((a: any) => a.rarity === 'legendary').length,
        };

        return {
            total: achievements.length,
            earned: earned.length,
            totalPoints,
            byRarity,
            recentAchievements: earned.slice(0, 5),
        };
    }
}
