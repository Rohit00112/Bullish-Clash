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
exports.LeaderboardService = void 0;
const common_1 = require("@nestjs/common");
const drizzle_orm_1 = require("drizzle-orm");
const database_module_1 = require("../../database/database.module");
const redis_module_1 = require("../redis/redis.module");
const schema = require("../../database/schema");
const portfolio_service_1 = require("../portfolio/portfolio.service");
const competition_service_1 = require("../competition/competition.service");
const ioredis_1 = require("ioredis");
let LeaderboardService = class LeaderboardService {
    db;
    redis;
    portfolioService;
    competitionService;
    constructor(db, redis, portfolioService, competitionService) {
        this.db = db;
        this.redis = redis;
        this.portfolioService = portfolioService;
        this.competitionService = competitionService;
    }
    async getLeaderboard(options) {
        const competition = await this.competitionService.getActiveCompetition();
        if (!competition) {
            return { entries: [], totalParticipants: 0, updatedAt: new Date() };
        }
        if (competition.isLeaderboardHidden && !options?.isAdmin) {
            return {
                entries: [],
                totalParticipants: 0,
                updatedAt: new Date(),
                isHidden: true
            };
        }
        const limit = options?.limit || 100;
        const offset = options?.offset || 0;
        const cacheKey = `leaderboard:${competition.id}`;
        const cached = await this.redis.get(cacheKey);
        if (cached) {
            const data = JSON.parse(cached);
            return {
                entries: data.entries.slice(offset, offset + limit),
                totalParticipants: data.totalParticipants,
                updatedAt: new Date(data.updatedAt),
                isHidden: competition.isLeaderboardHidden,
            };
        }
        const leaderboard = await this.calculateLeaderboard(competition.id);
        await this.redis.setex(cacheKey, 5, JSON.stringify(leaderboard));
        return {
            entries: leaderboard.entries.slice(offset, offset + limit),
            totalParticipants: leaderboard.totalParticipants,
            updatedAt: leaderboard.updatedAt,
            isHidden: competition.isLeaderboardHidden,
        };
    }
    async calculateLeaderboard(competitionId) {
        const participants = await this.db.query.competitionParticipants.findMany({
            where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.competitionParticipants.competitionId, competitionId), (0, drizzle_orm_1.eq)(schema.competitionParticipants.isActive, true)),
        });
        const userIds = participants.map((p) => p.userId);
        if (userIds.length === 0) {
            return { entries: [], totalParticipants: 0, updatedAt: new Date() };
        }
        const users = await this.db.query.users.findMany();
        const userMap = new Map(users.map((u) => [u.id, u]));
        const portfolios = await this.db.query.portfolios.findMany({
            where: (0, drizzle_orm_1.eq)(schema.portfolios.competitionId, competitionId),
        });
        const portfolioMap = new Map(portfolios.map((p) => [p.userId, p]));
        const holdings = await this.db.query.holdings.findMany({
            where: (0, drizzle_orm_1.eq)(schema.holdings.competitionId, competitionId),
        });
        const holdingsByUser = new Map();
        holdings.forEach((h) => {
            if (!holdingsByUser.has(h.userId)) {
                holdingsByUser.set(h.userId, []);
            }
            holdingsByUser.get(h.userId).push(h);
        });
        const latestPrices = await this.db.query.latestPrices.findMany();
        const priceMap = new Map(latestPrices.map((p) => [p.symbolId, parseFloat(p.price)]));
        const competition = await this.db.query.competitions.findFirst({
            where: (0, drizzle_orm_1.eq)(schema.competitions.id, competitionId),
        });
        const startingCash = parseFloat(competition?.startingCash || '1000000');
        const prevRanksKey = `leaderboard_ranks:${competitionId}`;
        const prevRanksStr = await this.redis.get(prevRanksKey);
        const previousRanks = prevRanksStr ? JSON.parse(prevRanksStr) : {};
        const entries = [];
        for (const participant of participants) {
            const user = userMap.get(participant.userId);
            const portfolio = portfolioMap.get(participant.userId);
            const userHoldings = holdingsByUser.get(participant.userId) || [];
            if (!user || !portfolio)
                continue;
            const cash = parseFloat(portfolio.cash);
            let investedValue = 0;
            let unrealizedPL = 0;
            for (const holding of userHoldings) {
                const currentPrice = priceMap.get(holding.symbolId) || parseFloat(holding.avgPrice);
                const avgPrice = parseFloat(holding.avgPrice);
                const marketValue = holding.quantity * currentPrice;
                const costBasis = holding.quantity * avgPrice;
                investedValue += marketValue;
                unrealizedPL += marketValue - costBasis;
            }
            const realizedPL = parseFloat(portfolio.realizedPL);
            const totalValue = cash + investedValue;
            const totalPL = unrealizedPL + realizedPL;
            const totalPLPercent = startingCash > 0 ? ((totalValue - startingCash) / startingCash) * 100 : 0;
            entries.push({
                rank: 0,
                userId: user.id,
                username: user.username,
                fullName: user.fullName,
                avatarUrl: user.avatarUrl,
                totalValue,
                cash,
                investedValue,
                unrealizedPL,
                realizedPL,
                totalPL,
                totalPLPercent,
                tradeCount: portfolio.tradeCount,
                previousRank: previousRanks[user.id],
                rankChange: 0,
            });
        }
        entries.sort((a, b) => b.totalValue - a.totalValue);
        const newRanks = {};
        entries.forEach((entry, index) => {
            entry.rank = index + 1;
            newRanks[entry.userId] = entry.rank;
            if (entry.previousRank) {
                entry.rankChange = entry.previousRank - entry.rank;
            }
        });
        await this.redis.setex(prevRanksKey, 3600, JSON.stringify(newRanks));
        return {
            entries,
            totalParticipants: entries.length,
            updatedAt: new Date(),
        };
    }
    async getUserRank(userId, isAdmin = false) {
        const competition = await this.competitionService.getActiveCompetition();
        if (competition?.isLeaderboardHidden && !isAdmin) {
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
    async invalidateCache(competitionId) {
        if (competitionId) {
            await this.redis.del(`leaderboard:${competitionId}`);
        }
        else {
            const keys = await this.redis.keys('leaderboard:*');
            if (keys.length > 0) {
                await this.redis.del(...keys);
            }
        }
    }
    async exportLeaderboard() {
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
};
exports.LeaderboardService = LeaderboardService;
exports.LeaderboardService = LeaderboardService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(database_module_1.DATABASE_CONNECTION)),
    __param(1, (0, common_1.Inject)(redis_module_1.REDIS_CLIENT)),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => portfolio_service_1.PortfolioService))),
    __param(3, (0, common_1.Inject)((0, common_1.forwardRef)(() => competition_service_1.CompetitionService))),
    __metadata("design:paramtypes", [Object, ioredis_1.default,
        portfolio_service_1.PortfolioService,
        competition_service_1.CompetitionService])
], LeaderboardService);
//# sourceMappingURL=leaderboard.service.js.map