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
exports.WatchlistService = void 0;
const common_1 = require("@nestjs/common");
const drizzle_orm_1 = require("drizzle-orm");
const database_module_1 = require("../../database/database.module");
const schema = require("../../database/schema");
const prices_service_1 = require("../prices/prices.service");
let WatchlistService = class WatchlistService {
    db;
    pricesService;
    constructor(db, pricesService) {
        this.db = db;
        this.pricesService = pricesService;
    }
    async getWatchlist(userId) {
        const watchlistItems = await this.db.query.watchlist.findMany({
            where: (0, drizzle_orm_1.eq)(schema.watchlist.userId, userId),
            orderBy: [(0, drizzle_orm_1.desc)(schema.watchlist.createdAt)],
        });
        if (watchlistItems.length === 0) {
            return [];
        }
        const symbolIds = watchlistItems.map((w) => w.symbolId);
        const symbols = await this.db.query.symbols.findMany();
        const symbolMap = new Map(symbols.map((s) => [s.id, s]));
        const latestPrices = await this.pricesService.getAllLatestPrices();
        const priceMap = new Map(latestPrices.map((p) => [p.symbolId, p]));
        return watchlistItems.map((item) => {
            const symbol = symbolMap.get(item.symbolId);
            const priceData = priceMap.get(item.symbolId);
            return {
                id: item.id,
                symbolId: item.symbolId,
                symbol: symbol?.symbol || '',
                companyName: symbol?.companyName || '',
                sector: symbol?.sector || '',
                price: priceData?.price || 0,
                change: priceData?.change || 0,
                changePercent: priceData?.changePercent || 0,
                high: priceData?.high || 0,
                low: priceData?.low || 0,
                volume: priceData?.volume || 0,
                addedAt: item.createdAt,
            };
        });
    }
    async addToWatchlist(userId, symbolId) {
        const symbol = await this.db.query.symbols.findFirst({
            where: (0, drizzle_orm_1.eq)(schema.symbols.id, symbolId),
        });
        if (!symbol) {
            throw new common_1.BadRequestException('Symbol not found');
        }
        const existing = await this.db.query.watchlist.findFirst({
            where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.watchlist.userId, userId), (0, drizzle_orm_1.eq)(schema.watchlist.symbolId, symbolId)),
        });
        if (existing) {
            throw new common_1.BadRequestException('Symbol already in watchlist');
        }
        const count = await this.db.query.watchlist.findMany({
            where: (0, drizzle_orm_1.eq)(schema.watchlist.userId, userId),
        });
        if (count.length >= 50) {
            throw new common_1.BadRequestException('Watchlist limit reached (maximum 50 symbols)');
        }
        const [item] = await this.db.insert(schema.watchlist).values({
            userId,
            symbolId,
        }).returning();
        return {
            success: true,
            message: `${symbol.symbol} added to watchlist`,
            item: {
                id: item.id,
                symbolId: item.symbolId,
                symbol: symbol.symbol,
                companyName: symbol.companyName,
            },
        };
    }
    async removeFromWatchlist(userId, symbolId) {
        const existing = await this.db.query.watchlist.findFirst({
            where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.watchlist.userId, userId), (0, drizzle_orm_1.eq)(schema.watchlist.symbolId, symbolId)),
        });
        if (!existing) {
            throw new common_1.BadRequestException('Symbol not in watchlist');
        }
        await this.db.delete(schema.watchlist).where((0, drizzle_orm_1.eq)(schema.watchlist.id, existing.id));
        return {
            success: true,
            message: 'Symbol removed from watchlist',
        };
    }
    async isInWatchlist(userId, symbolId) {
        const existing = await this.db.query.watchlist.findFirst({
            where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.watchlist.userId, userId), (0, drizzle_orm_1.eq)(schema.watchlist.symbolId, symbolId)),
        });
        return !!existing;
    }
};
exports.WatchlistService = WatchlistService;
exports.WatchlistService = WatchlistService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(database_module_1.DATABASE_CONNECTION)),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => prices_service_1.PricesService))),
    __metadata("design:paramtypes", [Object, prices_service_1.PricesService])
], WatchlistService);
//# sourceMappingURL=watchlist.service.js.map