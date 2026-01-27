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
exports.PricesService = void 0;
const common_1 = require("@nestjs/common");
const drizzle_orm_1 = require("drizzle-orm");
const database_module_1 = require("../../database/database.module");
const redis_module_1 = require("../redis/redis.module");
const schema = require("../../database/schema");
const trading_gateway_1 = require("../websocket/trading.gateway");
const ioredis_1 = require("ioredis");
let PricesService = class PricesService {
    db;
    redis;
    tradingGateway;
    constructor(db, redis, tradingGateway) {
        this.db = db;
        this.redis = redis;
        this.tradingGateway = tradingGateway;
    }
    async getAllLatestPrices() {
        const prices = await this.db.query.latestPrices.findMany({
            with: {},
        });
        const symbols = await this.db.query.symbols.findMany({
            where: (0, drizzle_orm_1.eq)(schema.symbols.isActive, true),
        });
        const symbolMap = new Map(symbols.map((s) => [s.id, s]));
        return prices.map((p) => {
            const sym = symbolMap.get(p.symbolId);
            return {
                symbolId: p.symbolId,
                symbol: sym?.symbol || '',
                companyName: sym?.companyName || '',
                sector: sym?.sector || '',
                price: parseFloat(p.price),
                previousClose: parseFloat(p.previousClose),
                open: parseFloat(p.open),
                high: parseFloat(p.high),
                low: parseFloat(p.low),
                volume: p.volume,
                change: parseFloat(p.change),
                changePercent: parseFloat(p.changePercent),
                updatedAt: p.updatedAt,
            };
        }).filter((p) => p.symbol);
    }
    async getLatestPrice(symbolId) {
        const cached = await this.redis.get(`price:${symbolId}`);
        if (cached) {
            return JSON.parse(cached);
        }
        const price = await this.db.query.latestPrices.findFirst({
            where: (0, drizzle_orm_1.eq)(schema.latestPrices.symbolId, symbolId),
        });
        if (price) {
            await this.redis.setex(`price:${symbolId}`, 5, JSON.stringify(price));
        }
        return price;
    }
    async getPriceHistory(symbolId, options) {
        let conditions = [(0, drizzle_orm_1.eq)(schema.priceTicks.symbolId, symbolId)];
        if (options?.from) {
            conditions.push((0, drizzle_orm_1.gte)(schema.priceTicks.timestamp, options.from));
        }
        if (options?.to) {
            conditions.push((0, drizzle_orm_1.lte)(schema.priceTicks.timestamp, options.to));
        }
        const ticks = await this.db.query.priceTicks.findMany({
            where: (0, drizzle_orm_1.and)(...conditions),
            orderBy: [(0, drizzle_orm_1.desc)(schema.priceTicks.timestamp)],
            limit: options?.limit || 100,
        });
        return ticks.reverse();
    }
    async getCandles(symbolId, interval = '1m', limit = 100) {
        const candles = await this.db.query.priceCandles.findMany({
            where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.priceCandles.symbolId, symbolId), (0, drizzle_orm_1.eq)(schema.priceCandles.interval, interval)),
            orderBy: [(0, drizzle_orm_1.desc)(schema.priceCandles.timestamp)],
            limit,
        });
        return candles.reverse().map((c) => ({
            timestamp: c.timestamp,
            open: parseFloat(c.open),
            high: parseFloat(c.high),
            low: parseFloat(c.low),
            close: parseFloat(c.close),
            volume: c.volume,
        }));
    }
    async updatePrice(update) {
        const latestPrice = await this.db.query.latestPrices.findFirst({
            where: (0, drizzle_orm_1.eq)(schema.latestPrices.symbolId, update.symbolId),
        });
        if (!latestPrice) {
            throw new Error(`No price record found for symbol ${update.symbolId}`);
        }
        const currentPrice = parseFloat(latestPrice.price);
        let newPrice;
        switch (update.priceUpdateType) {
            case 'percentage':
                newPrice = currentPrice * (1 + update.magnitude / 100);
                break;
            case 'absolute':
                newPrice = currentPrice + update.magnitude;
                break;
            case 'override':
                newPrice = update.magnitude;
                break;
            default:
                throw new Error(`Invalid price update type: ${update.priceUpdateType}`);
        }
        if (newPrice <= 0) {
            newPrice = 0.01;
        }
        newPrice = Math.round(newPrice * 100) / 100;
        const change = newPrice - parseFloat(latestPrice.previousClose);
        const changePercent = (change / parseFloat(latestPrice.previousClose)) * 100;
        const [updated] = await this.db.update(schema.latestPrices)
            .set({
            price: newPrice.toString(),
            high: Math.max(parseFloat(latestPrice.high), newPrice).toString(),
            low: Math.min(parseFloat(latestPrice.low), newPrice).toString(),
            change: change.toString(),
            changePercent: changePercent.toString(),
            updatedAt: new Date(),
        })
            .where((0, drizzle_orm_1.eq)(schema.latestPrices.symbolId, update.symbolId))
            .returning();
        await this.db.insert(schema.priceTicks).values({
            symbolId: update.symbolId,
            price: newPrice.toString(),
            previousPrice: currentPrice.toString(),
            change: (newPrice - currentPrice).toString(),
            changePercent: ((newPrice - currentPrice) / currentPrice * 100).toString(),
            volume: 0,
            eventId: update.eventId,
        });
        const symbol = await this.db.query.symbols.findFirst({
            where: (0, drizzle_orm_1.eq)(schema.symbols.id, update.symbolId),
        });
        await this.redis.del(`price:${update.symbolId}`);
        const priceUpdate = {
            symbolId: update.symbolId,
            symbol: symbol?.symbol || '',
            price: newPrice,
            previousPrice: currentPrice,
            change: newPrice - currentPrice,
            changePercent: ((newPrice - currentPrice) / currentPrice * 100),
            eventId: update.eventId,
        };
        this.tradingGateway.broadcastPriceUpdate(priceUpdate);
        return {
            symbolId: update.symbolId,
            symbol: symbol?.symbol,
            previousPrice: currentPrice,
            newPrice,
            change: newPrice - currentPrice,
            changePercent: ((newPrice - currentPrice) / currentPrice * 100),
        };
    }
    async batchUpdatePrices(updates) {
        const results = [];
        for (const update of updates) {
            try {
                const result = await this.updatePrice(update);
                results.push(result);
            }
            catch (error) {
                console.error(`Failed to update price for ${update.symbolId}:`, error);
                results.push({
                    symbolId: update.symbolId,
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }
        return results;
    }
    async resetDayPrices() {
        const latestPrices = await this.db.query.latestPrices.findMany();
        for (const lp of latestPrices) {
            await this.db.update(schema.latestPrices)
                .set({
                previousClose: lp.price,
                open: lp.price,
                high: lp.price,
                low: lp.price,
                change: '0',
                changePercent: '0',
                volume: 0,
                updatedAt: new Date(),
            })
                .where((0, drizzle_orm_1.eq)(schema.latestPrices.id, lp.id));
        }
        const keys = await this.redis.keys('price:*');
        if (keys.length > 0) {
            await this.redis.del(...keys);
        }
        return { success: true, symbolsReset: latestPrices.length };
    }
    async applyTradeImpact(impact) {
        const latestPrice = await this.db.query.latestPrices.findFirst({
            where: (0, drizzle_orm_1.eq)(schema.latestPrices.symbolId, impact.symbolId),
        });
        if (!latestPrice) {
            console.log(`[TradeImpact] No price record for symbol ${impact.symbolId}`);
            return null;
        }
        const currentPrice = parseFloat(latestPrice.price);
        const currentVolume = latestPrice.volume || 0;
        let finalPrice;
        if (impact.executionPrice) {
            finalPrice = impact.executionPrice;
        }
        else {
            const baseImpactPerUnit = 0.5;
            const tradeUnit = 10000;
            const maxImpactPercent = 5;
            let impactPercent = Math.min((impact.tradeValue / tradeUnit) * baseImpactPerUnit, maxImpactPercent);
            if (impact.side === 'sell') {
                impactPercent = -impactPercent;
            }
            finalPrice = currentPrice * (1 + impactPercent / 100);
        }
        finalPrice = Math.max(Math.round(finalPrice * 100) / 100, 0.01);
        const change = finalPrice - parseFloat(latestPrice.previousClose);
        const changePercent = (change / parseFloat(latestPrice.previousClose)) * 100;
        const priceChange = finalPrice - currentPrice;
        const priceChangePercent = currentPrice > 0 ? (priceChange / currentPrice) * 100 : 0;
        const newVolume = currentVolume + impact.quantity;
        console.log(`[TradeImpact] ${impact.side.toUpperCase()} - Symbol: ${impact.symbolId}, LTP: ${finalPrice}, Prev: ${currentPrice} (${priceChangePercent >= 0 ? '+' : ''}${priceChangePercent.toFixed(2)}%)`);
        await this.db.update(schema.latestPrices)
            .set({
            price: finalPrice.toString(),
            high: Math.max(parseFloat(latestPrice.high), finalPrice).toString(),
            low: Math.min(parseFloat(latestPrice.low), finalPrice).toString(),
            change: change.toString(),
            changePercent: changePercent.toString(),
            volume: newVolume,
            updatedAt: new Date(),
        })
            .where((0, drizzle_orm_1.eq)(schema.latestPrices.symbolId, impact.symbolId));
        await this.db.insert(schema.priceTicks).values({
            symbolId: impact.symbolId,
            price: finalPrice.toString(),
            previousPrice: currentPrice.toString(),
            change: priceChange.toString(),
            changePercent: priceChangePercent.toString(),
            volume: impact.quantity,
        });
        const symbol = await this.db.query.symbols.findFirst({
            where: (0, drizzle_orm_1.eq)(schema.symbols.id, impact.symbolId),
        });
        await this.redis.del(`price:${impact.symbolId}`);
        const priceUpdate = {
            symbolId: impact.symbolId,
            symbol: symbol?.symbol || '',
            price: finalPrice,
            previousPrice: currentPrice,
            change: priceChange,
            changePercent: priceChangePercent,
            tradeImpact: true,
            side: impact.side,
        };
        this.tradingGateway.broadcastPriceUpdate(priceUpdate);
        return {
            symbolId: impact.symbolId,
            symbol: symbol?.symbol,
            previousPrice: currentPrice,
            newPrice: finalPrice,
            changePercent: priceChangePercent,
            side: impact.side,
            volume: newVolume,
        };
    }
};
exports.PricesService = PricesService;
exports.PricesService = PricesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(database_module_1.DATABASE_CONNECTION)),
    __param(1, (0, common_1.Inject)(redis_module_1.REDIS_CLIENT)),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => trading_gateway_1.TradingGateway))),
    __metadata("design:paramtypes", [Object, ioredis_1.default,
        trading_gateway_1.TradingGateway])
], PricesService);
//# sourceMappingURL=prices.service.js.map