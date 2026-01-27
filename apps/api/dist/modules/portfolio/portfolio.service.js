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
exports.PortfolioService = void 0;
const common_1 = require("@nestjs/common");
const drizzle_orm_1 = require("drizzle-orm");
const database_module_1 = require("../../database/database.module");
const schema = require("../../database/schema");
const prices_service_1 = require("../prices/prices.service");
const competition_service_1 = require("../competition/competition.service");
let PortfolioService = class PortfolioService {
    db;
    pricesService;
    competitionService;
    constructor(db, pricesService, competitionService) {
        this.db = db;
        this.pricesService = pricesService;
        this.competitionService = competitionService;
    }
    async getPortfolio(userId) {
        const competition = await this.competitionService.getActiveCompetition();
        if (!competition) {
            throw new common_1.NotFoundException('No active competition');
        }
        const portfolio = await this.db.query.portfolios.findFirst({
            where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.portfolios.userId, userId), (0, drizzle_orm_1.eq)(schema.portfolios.competitionId, competition.id)),
        });
        if (!portfolio) {
            throw new common_1.NotFoundException('Portfolio not found. Please join the competition.');
        }
        const holdings = await this.db.query.holdings.findMany({
            where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.holdings.userId, userId), (0, drizzle_orm_1.eq)(schema.holdings.competitionId, competition.id)),
        });
        const latestPrices = await this.pricesService.getAllLatestPrices();
        const priceMap = new Map(latestPrices.map((p) => [p.symbolId, p]));
        const symbols = await this.db.query.symbols.findMany();
        const symbolMap = new Map(symbols.map((s) => [s.id, s]));
        const positions = holdings
            .filter((h) => h.quantity > 0)
            .map((h) => {
            const priceData = priceMap.get(h.symbolId);
            const symbolData = symbolMap.get(h.symbolId);
            const currentPrice = priceData?.price || parseFloat(h.avgPrice);
            const avgPrice = parseFloat(h.avgPrice);
            const marketValue = h.quantity * currentPrice;
            const costBasis = h.quantity * avgPrice;
            const unrealizedPL = marketValue - costBasis;
            const unrealizedPLPercent = costBasis > 0 ? (unrealizedPL / costBasis) * 100 : 0;
            return {
                symbolId: h.symbolId,
                symbol: symbolData?.symbol || '',
                companyName: symbolData?.companyName || '',
                sector: symbolData?.sector || '',
                quantity: h.quantity,
                avgPrice,
                currentPrice,
                marketValue,
                costBasis,
                unrealizedPL,
                unrealizedPLPercent,
                dayChange: priceData?.change || 0,
                dayChangePercent: priceData?.changePercent || 0,
            };
        });
        const cash = parseFloat(portfolio.cash);
        const investedValue = positions.reduce((sum, p) => sum + p.marketValue, 0);
        const totalValue = cash + investedValue;
        const unrealizedPL = positions.reduce((sum, p) => sum + p.unrealizedPL, 0);
        const realizedPL = parseFloat(portfolio.realizedPL);
        const totalPL = unrealizedPL + realizedPL;
        const startingCash = parseFloat(competition.startingCash);
        const totalPLPercent = startingCash > 0 ? ((totalValue - startingCash) / startingCash) * 100 : 0;
        return {
            userId,
            competitionId: competition.id,
            cash,
            investedValue,
            totalValue,
            positions,
            unrealizedPL,
            realizedPL,
            totalPL,
            totalPLPercent,
            tradeCount: portfolio.tradeCount,
            startingCash,
            updatedAt: portfolio.updatedAt,
        };
    }
    async getHoldings(userId) {
        const portfolio = await this.getPortfolio(userId);
        return portfolio.positions;
    }
    async getPortfolioSummary(userId) {
        const portfolio = await this.getPortfolio(userId);
        return {
            userId,
            cash: portfolio.cash,
            investedValue: portfolio.investedValue,
            totalValue: portfolio.totalValue,
            totalPL: portfolio.totalPL,
            totalPLPercent: portfolio.totalPLPercent,
            positionCount: portfolio.positions.length,
            tradeCount: portfolio.tradeCount,
        };
    }
    async calculatePortfolioValue(userId, competitionId) {
        const portfolio = await this.db.query.portfolios.findFirst({
            where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.portfolios.userId, userId), (0, drizzle_orm_1.eq)(schema.portfolios.competitionId, competitionId)),
        });
        if (!portfolio)
            return 0;
        const holdings = await this.db.query.holdings.findMany({
            where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.holdings.userId, userId), (0, drizzle_orm_1.eq)(schema.holdings.competitionId, competitionId)),
        });
        const latestPrices = await this.pricesService.getAllLatestPrices();
        const priceMap = new Map(latestPrices.map((p) => [p.symbolId, p.price]));
        const investedValue = holdings.reduce((sum, h) => {
            const price = priceMap.get(h.symbolId) || parseFloat(h.avgPrice);
            return sum + (h.quantity * price);
        }, 0);
        return parseFloat(portfolio.cash) + investedValue;
    }
};
exports.PortfolioService = PortfolioService;
exports.PortfolioService = PortfolioService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(database_module_1.DATABASE_CONNECTION)),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => prices_service_1.PricesService))),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => competition_service_1.CompetitionService))),
    __metadata("design:paramtypes", [Object, prices_service_1.PricesService,
        competition_service_1.CompetitionService])
], PortfolioService);
//# sourceMappingURL=portfolio.service.js.map