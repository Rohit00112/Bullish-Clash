"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AchievementsService = void 0;
const common_1 = require("@nestjs/common");
const drizzle_orm_1 = require("drizzle-orm");
const database_module_1 = require("../../database/database.module");
const schema = require("../../database/schema");
const achievements_1 = require("../../database/schema/achievements");
const trading_gateway_1 = require("../websocket/trading.gateway");
let AchievementsService = class AchievementsService {
    db;
    tradingGateway;
    constructor(db, tradingGateway) {
        this.db = db;
        this.tradingGateway = tradingGateway;
    }
    async seedAchievements() {
        for (const achievement of achievements_1.DEFAULT_ACHIEVEMENTS) {
            await this.db.insert(schema.achievementDefinitions)
                .values(achievement)
                .onConflictDoNothing();
        }
    }
    async getAllDefinitions() {
        return this.db.query.achievementDefinitions.findMany({
            orderBy: (definitions, { asc }) => [asc(definitions.category), asc(definitions.points)],
        });
    }
    async getUserAchievements(userId, competitionId) {
        let conditions = [(0, drizzle_orm_1.eq)(schema.userAchievements.userId, userId)];
        if (competitionId) {
            conditions.push((0, drizzle_orm_1.eq)(schema.userAchievements.competitionId, competitionId));
        }
        const earned = await this.db.query.userAchievements.findMany({
            where: (0, drizzle_orm_1.and)(...conditions),
            orderBy: (achievements, { desc }) => [desc(achievements.earnedAt)],
        });
        const definitions = await this.getAllDefinitions();
        return definitions.map((def) => {
            const userAchievement = earned.find((e) => e.achievementId === def.id);
            return {
                ...def,
                earned: !!userAchievement,
                earnedAt: userAchievement?.earnedAt || null,
                metadata: userAchievement?.metadata ? JSON.parse(userAchievement.metadata) : null,
            };
        });
    }
    async awardAchievement(userId, achievementId, competitionId, metadata) {
        const existing = await this.db.query.userAchievements.findFirst({
            where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.userAchievements.userId, userId), (0, drizzle_orm_1.eq)(schema.userAchievements.achievementId, achievementId), competitionId
                ? (0, drizzle_orm_1.eq)(schema.userAchievements.competitionId, competitionId)
                : (0, drizzle_orm_1.sql) `${schema.userAchievements.competitionId} IS NULL`),
        });
        if (existing) {
            return { awarded: false };
        }
        const definition = await this.db.query.achievementDefinitions.findFirst({
            where: (0, drizzle_orm_1.eq)(schema.achievementDefinitions.id, achievementId),
        });
        if (!definition) {
            return { awarded: false };
        }
        await this.db.insert(schema.userAchievements).values({
            userId,
            achievementId,
            competitionId: competitionId || null,
            metadata: metadata ? JSON.stringify(metadata) : null,
        });
        console.log(`[ACHIEVEMENT] Awarded "${definition.name}" to user ${userId}`);
        this.tradingGateway.sendAchievementUnlocked(userId, definition);
        return {
            awarded: true,
            achievement: definition,
        };
    }
    async checkTradeAchievements(check) {
        const { userId, competitionId } = check;
        const awarded = [];
        const trades = await this.db.query.trades.findMany({
            where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.trades.userId, userId), (0, drizzle_orm_1.eq)(schema.trades.competitionId, competitionId)),
        });
        if (trades.length >= 1) {
            const result = await this.awardAchievement(userId, 'first_trade', competitionId);
            if (result.awarded)
                awarded.push(result.achievement);
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tradesToday = trades.filter((t) => new Date(t.executedAt) >= today);
        if (tradesToday.length >= 10) {
            const result = await this.awardAchievement(userId, 'day_trader', competitionId);
            if (result.awarded)
                awarded.push(result.achievement);
        }
        const totalVolume = trades.reduce((sum, t) => sum + parseFloat(t.total), 0);
        if (totalVolume >= 1000000) {
            const result = await this.awardAchievement(userId, 'volume_trader', competitionId, { volume: totalVolume });
            if (result.awarded)
                awarded.push(result.achievement);
        }
        const uniqueSymbols = new Set(trades.map((t) => t.symbolId));
        if (uniqueSymbols.size >= 5) {
            const result = await this.awardAchievement(userId, 'diversified', competitionId, { stocks: uniqueSymbols.size });
            if (result.awarded)
                awarded.push(result.achievement);
        }
        const competition = await this.db.query.competitions.findFirst({
            where: (0, drizzle_orm_1.eq)(schema.competitions.id, competitionId),
        });
        if (competition) {
            const competitionStart = new Date(competition.startTime);
            const firstHourEnd = new Date(competitionStart.getTime() + 60 * 60 * 1000);
            const hasEarlyTrade = trades.some((t) => new Date(t.executedAt) <= firstHourEnd);
            if (hasEarlyTrade) {
                const result = await this.awardAchievement(userId, 'early_bird', competitionId);
                if (result.awarded)
                    awarded.push(result.achievement);
            }
        }
        const sortedTrades = [...trades].sort((a, b) => new Date(a.executedAt).getTime() - new Date(b.executedAt).getTime());
        let winStreak = 0;
        let maxWinStreak = 0;
        for (const trade of sortedTrades) {
            if (trade.side === 'sell') {
                winStreak++;
                maxWinStreak = Math.max(maxWinStreak, winStreak);
            }
        }
        if (maxWinStreak >= 5) {
            const result = await this.awardAchievement(userId, 'winning_streak', competitionId, { streak: maxWinStreak });
            if (result.awarded)
                awarded.push(result.achievement);
        }
        const allSymbols = await this.db.query.symbols.findMany({
            where: (0, drizzle_orm_1.eq)(schema.symbols.isActive, true),
        });
        if (uniqueSymbols.size >= allSymbols.length && allSymbols.length > 0) {
            const result = await this.awardAchievement(userId, 'market_master', competitionId);
            if (result.awarded)
                awarded.push(result.achievement);
        }
        return awarded;
    }
    async checkPortfolioAchievements(userId, competitionId) {
        const awarded = [];
        const portfolio = await this.db.query.portfolios.findFirst({
            where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.portfolios.userId, userId), (0, drizzle_orm_1.eq)(schema.portfolios.competitionId, competitionId)),
        });
        if (!portfolio)
            return awarded;
        const competition = await this.db.query.competitions.findFirst({
            where: (0, drizzle_orm_1.eq)(schema.competitions.id, competitionId),
        });
        if (!competition)
            return awarded;
        const holdings = await this.db.query.holdings.findMany({
            where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.holdings.userId, userId), (0, drizzle_orm_1.eq)(schema.holdings.competitionId, competitionId)),
        });
        let holdingsValue = 0;
        for (const holding of holdings) {
            if (holding.quantity > 0) {
                const symbol = await this.db.query.symbols.findFirst({
                    where: (0, drizzle_orm_1.eq)(schema.symbols.id, holding.symbolId),
                });
                if (symbol) {
                    holdingsValue += holding.quantity * parseFloat(symbol.currentPrice);
                }
            }
        }
        const initialBalance = parseFloat(competition.startingBalance);
        const currentValue = parseFloat(portfolio.cash) + holdingsValue;
        const profitPercent = ((currentValue - initialBalance) / initialBalance) * 100;
        if (profitPercent >= 10) {
            const result = await this.awardAchievement(userId, 'profit_10', competitionId, { profit: profitPercent.toFixed(2) });
            if (result.awarded)
                awarded.push(result.achievement);
        }
        if (profitPercent >= 25) {
            const result = await this.awardAchievement(userId, 'profit_25', competitionId, { profit: profitPercent.toFixed(2) });
            if (result.awarded)
                awarded.push(result.achievement);
        }
        if (profitPercent >= 50) {
            const result = await this.awardAchievement(userId, 'profit_50', competitionId, { profit: profitPercent.toFixed(2) });
            if (result.awarded)
                awarded.push(result.achievement);
        }
        if (profitPercent >= 100) {
            const result = await this.awardAchievement(userId, 'profit_100', competitionId, { profit: profitPercent.toFixed(2) });
            if (result.awarded)
                awarded.push(result.achievement);
        }
        return awarded;
    }
    async checkCompetitionEndAchievements(competitionId) {
        const portfolios = await this.db.query.portfolios.findMany({
            where: (0, drizzle_orm_1.eq)(schema.portfolios.competitionId, competitionId),
            orderBy: (portfolios, { desc }) => [desc(portfolios.totalValue)],
        });
        const awarded = [];
        for (let i = 0; i < portfolios.length; i++) {
            const portfolio = portfolios[i];
            const rank = i + 1;
            const userAchievements = [];
            if (rank === 1) {
                const result = await this.awardAchievement(portfolio.userId, 'champion', competitionId, { rank });
                if (result.awarded)
                    userAchievements.push(result.achievement);
            }
            if (rank <= 3) {
                const result = await this.awardAchievement(portfolio.userId, 'top_3', competitionId, { rank });
                if (result.awarded)
                    userAchievements.push(result.achievement);
            }
            if (rank <= 10) {
                const result = await this.awardAchievement(portfolio.userId, 'top_10', competitionId, { rank });
                if (result.awarded)
                    userAchievements.push(result.achievement);
            }
            if (userAchievements.length > 0) {
                awarded.push({ userId: portfolio.userId, achievements: userAchievements });
            }
        }
        return awarded;
    }
    async getUserStats(userId) {
        const achievements = await this.getUserAchievements(userId);
        const earned = achievements.filter((a) => a.earned);
        const totalPoints = earned.reduce((sum, a) => sum + a.points, 0);
        const byRarity = {
            common: earned.filter((a) => a.rarity === 'common').length,
            uncommon: earned.filter((a) => a.rarity === 'uncommon').length,
            rare: earned.filter((a) => a.rarity === 'rare').length,
            epic: earned.filter((a) => a.rarity === 'epic').length,
            legendary: earned.filter((a) => a.rarity === 'legendary').length,
        };
        return {
            total: achievements.length,
            earned: earned.length,
            totalPoints,
            byRarity,
            recentAchievements: earned.slice(0, 5),
        };
    }
};
exports.AchievementsService = AchievementsService;
exports.AchievementsService = AchievementsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(database_module_1.DATABASE_CONNECTION)),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => trading_gateway_1.TradingGateway))),
    __metadata("design:paramtypes", [Object, trading_gateway_1.TradingGateway])
], AchievementsService);
//# sourceMappingURL=achievements.service.js.map