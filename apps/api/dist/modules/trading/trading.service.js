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
exports.TradingService = void 0;
const common_1 = require("@nestjs/common");
const drizzle_orm_1 = require("drizzle-orm");
const uuid_1 = require("uuid");
const database_module_1 = require("../../database/database.module");
const redis_module_1 = require("../redis/redis.module");
const schema = require("../../database/schema");
const prices_service_1 = require("../prices/prices.service");
const competition_service_1 = require("../competition/competition.service");
const trading_gateway_1 = require("../websocket/trading.gateway");
const achievements_service_1 = require("../achievements/achievements.service");
const ioredis_1 = require("ioredis");
let TradingService = class TradingService {
    db;
    redis;
    pricesService;
    competitionService;
    tradingGateway;
    achievementsService;
    constructor(db, redis, pricesService, competitionService, tradingGateway, achievementsService) {
        this.db = db;
        this.redis = redis;
        this.pricesService = pricesService;
        this.competitionService = competitionService;
        this.tradingGateway = tradingGateway;
        this.achievementsService = achievementsService;
    }
    async placeOrder(userId, dto) {
        const competition = await this.competitionService.getActiveCompetition();
        if (!competition) {
            throw new common_1.BadRequestException('No active competition');
        }
        if (competition.status !== 'active') {
            throw new common_1.BadRequestException('Competition is not active. Trading is disabled.');
        }
        const now = new Date();
        if (now < new Date(competition.startTime) || now > new Date(competition.endTime)) {
            throw new common_1.BadRequestException('Trading is only allowed during competition hours');
        }
        const rateLimitKey = `order_rate:${userId}`;
        const orderCount = await this.redis.incr(rateLimitKey);
        if (orderCount === 1) {
            await this.redis.expire(rateLimitKey, 60);
        }
        if (orderCount > 30) {
            throw new common_1.BadRequestException('Rate limit exceeded. Maximum 30 orders per minute.');
        }
        const portfolio = await this.db.query.portfolios.findFirst({
            where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.portfolios.userId, userId), (0, drizzle_orm_1.eq)(schema.portfolios.competitionId, competition.id)),
        });
        if (!portfolio) {
            throw new common_1.BadRequestException('Portfolio not found. Please join the competition first.');
        }
        if (competition.maxDailyTrades) {
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            const todayTrades = await this.db.select({ count: (0, drizzle_orm_1.sql) `count(*)` })
                .from(schema.trades)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.trades.userId, userId), (0, drizzle_orm_1.eq)(schema.trades.competitionId, competition.id), (0, drizzle_orm_1.sql) `${schema.trades.executedAt} >= ${todayStart}`));
            if (todayTrades[0].count >= competition.maxDailyTrades) {
                throw new common_1.BadRequestException(`Daily trade limit (${competition.maxDailyTrades}) reached`);
            }
        }
        const latestPrice = await this.pricesService.getLatestPrice(dto.symbolId);
        if (!latestPrice) {
            throw new common_1.BadRequestException('Symbol not found or price not available');
        }
        const currentPrice = parseFloat(latestPrice.price);
        const orderType = dto.type || 'market';
        const orderPrice = orderType === 'limit' ? dto.price : currentPrice;
        if (orderType === 'limit') {
            if (!dto.price || dto.price <= 0) {
                throw new common_1.BadRequestException('Limit orders require a valid price');
            }
            const maxDeviation = 0.10;
            const minPrice = currentPrice * (1 - maxDeviation);
            const maxPrice = currentPrice * (1 + maxDeviation);
            if (dto.price < minPrice || dto.price > maxPrice) {
                throw new common_1.BadRequestException(`Limit price must be within 10% of current price (रू${minPrice.toFixed(2)} - रू${maxPrice.toFixed(2)})`);
            }
        }
        const commissionRate = parseFloat(competition.commissionRate);
        const estimatedTotal = orderPrice * dto.quantity;
        const estimatedCommission = estimatedTotal * commissionRate;
        if (dto.side === 'buy') {
            const requiredCash = estimatedTotal + estimatedCommission;
            if (parseFloat(portfolio.cash) < requiredCash) {
                throw new common_1.BadRequestException(`Insufficient cash. Required: रू${requiredCash.toFixed(2)}, Available: रू${parseFloat(portfolio.cash).toFixed(2)}`);
            }
            if (competition.maxPositionSize) {
                const currentHolding = await this.db.query.holdings.findFirst({
                    where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.holdings.userId, userId), (0, drizzle_orm_1.eq)(schema.holdings.competitionId, competition.id), (0, drizzle_orm_1.eq)(schema.holdings.symbolId, dto.symbolId)),
                });
                const currentQuantity = currentHolding?.quantity || 0;
                const newValue = (currentQuantity + dto.quantity) * orderPrice;
                const initialCapital = parseFloat(competition.initialCapital);
                const maxPositionValue = (parseFloat(competition.maxPositionSize) / 100) * initialCapital;
                if (newValue > maxPositionValue) {
                    throw new common_1.BadRequestException(`Position would exceed maximum allowed (${competition.maxPositionSize}% = रू${maxPositionValue.toLocaleString()})`);
                }
            }
            if (orderType === 'limit') {
                await this.reserveCash(userId, competition.id, requiredCash);
            }
        }
        else {
            const holding = await this.db.query.holdings.findFirst({
                where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.holdings.userId, userId), (0, drizzle_orm_1.eq)(schema.holdings.competitionId, competition.id), (0, drizzle_orm_1.eq)(schema.holdings.symbolId, dto.symbolId)),
            });
            const reservedShares = await this.getReservedShares(userId, competition.id, dto.symbolId);
            const availableShares = (holding?.quantity || 0) - reservedShares;
            if (availableShares < dto.quantity) {
                throw new common_1.BadRequestException(`Insufficient shares. Available: ${availableShares} (${reservedShares} reserved in open orders)`);
            }
            if (!competition.allowShortSelling && (!holding || holding.quantity < dto.quantity)) {
                throw new common_1.BadRequestException('Short selling is not allowed');
            }
        }
        if (orderType === 'market') {
            return await this.executeMarketOrder(userId, competition.id, dto, currentPrice, commissionRate);
        }
        else {
            return await this.placeLimitOrder(userId, competition.id, dto, commissionRate);
        }
    }
    async executeMarketOrder(userId, competitionId, dto, currentPrice, commissionRate) {
        const orderId = (0, uuid_1.v4)();
        const now = new Date();
        try {
            const [order] = await this.db.insert(schema.orders).values({
                id: orderId,
                userId,
                competitionId,
                symbolId: dto.symbolId,
                side: dto.side,
                type: 'market',
                quantity: dto.quantity,
                filledQuantity: 0,
                remainingQuantity: dto.quantity,
                avgFilledPrice: null,
                status: 'pending',
                commission: '0',
                priority: now,
            }).returning();
            const matchResult = await this.matchMarketOrder(competitionId, dto.symbolId, dto.side, dto.quantity);
            let totalFilled = 0;
            let totalValue = 0;
            const trades = [];
            for (const match of matchResult.trades) {
                const tradeId = (0, uuid_1.v4)();
                const tradeValue = match.quantity * match.price;
                const commission = tradeValue * commissionRate;
                const [trade] = await this.db.insert(schema.trades).values({
                    id: tradeId,
                    orderId,
                    userId,
                    competitionId,
                    symbolId: dto.symbolId,
                    side: dto.side,
                    quantity: match.quantity,
                    price: match.price.toString(),
                    total: tradeValue.toString(),
                    commission: commission.toString(),
                }).returning();
                await this.updateMatchedOrder(dto.side === 'buy' ? match.sellOrderId : match.buyOrderId, match.quantity, match.price, commissionRate);
                await this.processTradeSettlement(dto.side === 'buy' ? match.sellerId : match.buyerId, competitionId, dto.symbolId, dto.side === 'buy' ? 'sell' : 'buy', match.quantity, match.price, commission, tradeId);
                trades.push(trade);
                totalFilled += match.quantity;
                totalValue += tradeValue;
            }
            const remainingQty = dto.quantity - totalFilled;
            if (remainingQty > 0) {
                const tradeId = (0, uuid_1.v4)();
                const tradeValue = remainingQty * currentPrice;
                const commission = tradeValue * commissionRate;
                const [trade] = await this.db.insert(schema.trades).values({
                    id: tradeId,
                    orderId,
                    userId,
                    competitionId,
                    symbolId: dto.symbolId,
                    side: dto.side,
                    quantity: remainingQty,
                    price: currentPrice.toString(),
                    total: tradeValue.toString(),
                    commission: commission.toString(),
                }).returning();
                trades.push(trade);
                totalFilled += remainingQty;
                totalValue += tradeValue;
            }
            const avgPrice = totalValue / totalFilled;
            const totalCommission = totalValue * commissionRate;
            await this.db.update(schema.orders)
                .set({
                filledQuantity: totalFilled,
                remainingQuantity: 0,
                avgFilledPrice: avgPrice.toString(),
                status: 'filled',
                commission: totalCommission.toString(),
                updatedAt: new Date(),
            })
                .where((0, drizzle_orm_1.eq)(schema.orders.id, orderId));
            await this.processTradeSettlement(userId, competitionId, dto.symbolId, dto.side, totalFilled, avgPrice, totalCommission, trades[0].id);
            await this.pricesService.applyTradeImpact({
                symbolId: dto.symbolId,
                side: dto.side,
                quantity: totalFilled,
                tradeValue: totalValue,
                executionPrice: avgPrice,
            });
            const symbol = await this.db.query.symbols.findFirst({
                where: (0, drizzle_orm_1.eq)(schema.symbols.id, dto.symbolId),
            });
            this.tradingGateway.sendTradeExecuted(userId, {
                trade: {
                    ...trades[0],
                    price: avgPrice,
                    total: totalValue,
                    commission: totalCommission,
                    symbol: symbol?.symbol,
                },
            });
            this.tradingGateway.broadcastOrderBookUpdate(dto.symbolId);
            this.tradingGateway.triggerLeaderboardUpdate();
            this.checkAchievementsAfterTrade(userId, competitionId).catch(err => {
                console.error('Achievement check error:', err);
            });
            return {
                order: {
                    ...order,
                    remainingQuantity: 0,
                    avgFilledPrice: avgPrice,
                    commission: totalCommission,
                },
                trades: trades.map(t => ({
                    ...t,
                    price: parseFloat(t.price),
                    total: parseFloat(t.total),
                    commission: parseFloat(t.commission),
                    symbol: symbol?.symbol,
                })),
                message: `${dto.side === 'buy' ? 'Bought' : 'Sold'} ${totalFilled} ${symbol?.symbol} @ avg रू${avgPrice.toFixed(2)}`,
            };
        }
        catch (error) {
            console.error('Market order execution error:', error);
            throw new common_1.BadRequestException('Failed to execute order. Please try again.');
        }
    }
    async placeLimitOrder(userId, competitionId, dto, commissionRate) {
        const orderId = (0, uuid_1.v4)();
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        try {
            const [order] = await this.db.insert(schema.orders).values({
                id: orderId,
                userId,
                competitionId,
                symbolId: dto.symbolId,
                side: dto.side,
                type: 'limit',
                quantity: dto.quantity,
                price: dto.price.toString(),
                filledQuantity: 0,
                remainingQuantity: dto.quantity,
                avgFilledPrice: null,
                status: 'open',
                commission: '0',
                priority: now,
                expiresAt: expiresAt,
            }).returning();
            const matchResult = await this.matchLimitOrder(competitionId, dto.symbolId, dto.side, dto.quantity, dto.price);
            let totalFilled = 0;
            let totalValue = 0;
            const trades = [];
            for (const match of matchResult.trades) {
                const tradeId = (0, uuid_1.v4)();
                const tradeValue = match.quantity * match.price;
                const commission = tradeValue * commissionRate;
                const [trade] = await this.db.insert(schema.trades).values({
                    id: tradeId,
                    orderId,
                    userId,
                    competitionId,
                    symbolId: dto.symbolId,
                    side: dto.side,
                    quantity: match.quantity,
                    price: match.price.toString(),
                    total: tradeValue.toString(),
                    commission: commission.toString(),
                }).returning();
                await this.updateMatchedOrder(dto.side === 'buy' ? match.sellOrderId : match.buyOrderId, match.quantity, match.price, commissionRate);
                await this.processTradeSettlement(dto.side === 'buy' ? match.sellerId : match.buyerId, competitionId, dto.symbolId, dto.side === 'buy' ? 'sell' : 'buy', match.quantity, match.price, commission, tradeId);
                trades.push(trade);
                totalFilled += match.quantity;
                totalValue += tradeValue;
            }
            const remainingQty = dto.quantity - totalFilled;
            const avgPrice = totalFilled > 0 ? totalValue / totalFilled : null;
            const totalCommission = totalValue * commissionRate;
            const status = totalFilled === dto.quantity ? 'filled'
                : totalFilled > 0 ? 'partial'
                    : 'open';
            await this.db.update(schema.orders)
                .set({
                filledQuantity: totalFilled,
                remainingQuantity: remainingQty,
                avgFilledPrice: avgPrice?.toString() || null,
                status,
                commission: totalCommission.toString(),
                expiresAt: status !== 'filled' ? expiresAt : null,
                updatedAt: new Date(),
            })
                .where((0, drizzle_orm_1.eq)(schema.orders.id, orderId));
            if (totalFilled > 0) {
                await this.processTradeSettlement(userId, competitionId, dto.symbolId, dto.side, totalFilled, avgPrice, totalCommission, trades[0].id);
                await this.pricesService.applyTradeImpact({
                    symbolId: dto.symbolId,
                    side: dto.side,
                    quantity: totalFilled,
                    tradeValue: totalValue,
                    executionPrice: avgPrice,
                });
            }
            const symbol = await this.db.query.symbols.findFirst({
                where: (0, drizzle_orm_1.eq)(schema.symbols.id, dto.symbolId),
            });
            if (trades.length > 0) {
                this.tradingGateway.sendTradeExecuted(userId, {
                    trade: {
                        ...trades[0],
                        price: avgPrice,
                        total: totalValue,
                        commission: totalCommission,
                        symbol: symbol?.symbol,
                    },
                });
            }
            this.tradingGateway.broadcastOrderBookUpdate(dto.symbolId);
            if (trades.length > 0) {
                this.tradingGateway.triggerLeaderboardUpdate();
                this.checkAchievementsAfterTrade(userId, competitionId).catch(err => {
                    console.error('Achievement check error:', err);
                });
            }
            const message = status === 'filled'
                ? `Limit order filled: ${dto.side === 'buy' ? 'Bought' : 'Sold'} ${totalFilled} ${symbol?.symbol} @ avg रू${avgPrice?.toFixed(2)}`
                : status === 'partial'
                    ? `Limit order partially filled: ${totalFilled}/${dto.quantity} @ रू${avgPrice?.toFixed(2)}. Remaining ${remainingQty} in order book.`
                    : `Limit order placed: ${dto.side.toUpperCase()} ${dto.quantity} ${symbol?.symbol} @ रू${dto.price?.toFixed(2)}`;
            return {
                order: {
                    ...order,
                    price: dto.price,
                    remainingQuantity: remainingQty,
                    avgFilledPrice: avgPrice,
                    commission: totalCommission,
                },
                trades: trades.map(t => ({
                    ...t,
                    price: parseFloat(t.price),
                    total: parseFloat(t.total),
                    commission: parseFloat(t.commission),
                    symbol: symbol?.symbol,
                })),
                message,
            };
        }
        catch (error) {
            if (dto.side === 'buy') {
                const estimatedTotal = dto.price * dto.quantity;
                await this.releaseReservedCash(userId, competitionId, estimatedTotal * (1 + commissionRate));
            }
            console.error('Limit order placement error:', error);
            throw new common_1.BadRequestException('Failed to place order. Please try again.');
        }
    }
    async matchMarketOrder(competitionId, symbolId, side, quantity) {
        const oppositeSide = side === 'buy' ? 'sell' : 'buy';
        const matchingOrders = await this.db.query.orders.findMany({
            where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.orders.competitionId, competitionId), (0, drizzle_orm_1.eq)(schema.orders.symbolId, symbolId), (0, drizzle_orm_1.eq)(schema.orders.side, oppositeSide), (0, drizzle_orm_1.eq)(schema.orders.type, 'limit'), (0, drizzle_orm_1.sql) `${schema.orders.status} IN ('open', 'partial')`, (0, drizzle_orm_1.sql) `${schema.orders.remainingQuantity} > 0`),
            orderBy: side === 'buy'
                ? [(0, drizzle_orm_1.asc)(schema.orders.price), (0, drizzle_orm_1.asc)(schema.orders.priority)]
                : [(0, drizzle_orm_1.desc)(schema.orders.price), (0, drizzle_orm_1.asc)(schema.orders.priority)],
        });
        const trades = [];
        let remainingQty = quantity;
        for (const order of matchingOrders) {
            if (remainingQty <= 0)
                break;
            const matchQty = Math.min(remainingQty, order.remainingQuantity);
            const matchPrice = parseFloat(order.price);
            trades.push({
                id: (0, uuid_1.v4)(),
                buyOrderId: side === 'buy' ? '' : order.id,
                sellOrderId: side === 'sell' ? '' : order.id,
                buyerId: side === 'buy' ? '' : order.userId,
                sellerId: side === 'sell' ? '' : order.userId,
                quantity: matchQty,
                price: matchPrice,
            });
            remainingQty -= matchQty;
        }
        return { trades, remainingQuantity: remainingQty };
    }
    async matchLimitOrder(competitionId, symbolId, side, quantity, limitPrice) {
        const oppositeSide = side === 'buy' ? 'sell' : 'buy';
        const priceCondition = side === 'buy'
            ? (0, drizzle_orm_1.lte)(schema.orders.price, limitPrice.toString())
            : (0, drizzle_orm_1.gte)(schema.orders.price, limitPrice.toString());
        const matchingOrders = await this.db.query.orders.findMany({
            where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.orders.competitionId, competitionId), (0, drizzle_orm_1.eq)(schema.orders.symbolId, symbolId), (0, drizzle_orm_1.eq)(schema.orders.side, oppositeSide), (0, drizzle_orm_1.eq)(schema.orders.type, 'limit'), (0, drizzle_orm_1.sql) `${schema.orders.status} IN ('open', 'partial')`, (0, drizzle_orm_1.sql) `${schema.orders.remainingQuantity} > 0`, priceCondition),
            orderBy: side === 'buy'
                ? [(0, drizzle_orm_1.asc)(schema.orders.price), (0, drizzle_orm_1.asc)(schema.orders.priority)]
                : [(0, drizzle_orm_1.desc)(schema.orders.price), (0, drizzle_orm_1.asc)(schema.orders.priority)],
        });
        const trades = [];
        let remainingQty = quantity;
        for (const order of matchingOrders) {
            if (remainingQty <= 0)
                break;
            const matchQty = Math.min(remainingQty, order.remainingQuantity);
            const matchPrice = parseFloat(order.price);
            trades.push({
                id: (0, uuid_1.v4)(),
                buyOrderId: side === 'buy' ? '' : order.id,
                sellOrderId: side === 'sell' ? '' : order.id,
                buyerId: side === 'buy' ? '' : order.userId,
                sellerId: side === 'sell' ? '' : order.userId,
                quantity: matchQty,
                price: matchPrice,
            });
            remainingQty -= matchQty;
        }
        return { trades, remainingQuantity: remainingQty };
    }
    async updateMatchedOrder(orderId, filledQty, price, commissionRate) {
        const order = await this.db.query.orders.findFirst({
            where: (0, drizzle_orm_1.eq)(schema.orders.id, orderId),
        });
        if (!order)
            return;
        const newFilledQty = order.filledQuantity + filledQty;
        const newRemainingQty = order.remainingQuantity - filledQty;
        const tradeValue = filledQty * price;
        const commission = tradeValue * commissionRate;
        const oldValue = order.filledQuantity * (parseFloat(order.avgFilledPrice) || 0);
        const newAvgPrice = (oldValue + tradeValue) / newFilledQty;
        const newStatus = newRemainingQty === 0 ? 'filled' : 'partial';
        await this.db.update(schema.orders)
            .set({
            filledQuantity: newFilledQty,
            remainingQuantity: newRemainingQty,
            avgFilledPrice: newAvgPrice.toString(),
            commission: (parseFloat(order.commission) + commission).toString(),
            status: newStatus,
            updatedAt: new Date(),
        })
            .where((0, drizzle_orm_1.eq)(schema.orders.id, orderId));
        this.tradingGateway.sendOrderUpdate(order.userId, {
            orderId,
            status: newStatus,
            filledQuantity: newFilledQty,
            remainingQuantity: newRemainingQty,
            avgFilledPrice: newAvgPrice,
        });
    }
    async processTradeSettlement(userId, competitionId, symbolId, side, quantity, price, commission, tradeId) {
        const total = price * quantity;
        const netAmount = side === 'buy' ? -(total + commission) : total - commission;
        const portfolio = await this.db.query.portfolios.findFirst({
            where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.portfolios.userId, userId), (0, drizzle_orm_1.eq)(schema.portfolios.competitionId, competitionId)),
        });
        const holding = await this.db.query.holdings.findFirst({
            where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.holdings.userId, userId), (0, drizzle_orm_1.eq)(schema.holdings.competitionId, competitionId), (0, drizzle_orm_1.eq)(schema.holdings.symbolId, symbolId)),
        });
        let realizedPL = 0;
        const newCash = parseFloat(portfolio.cash) + netAmount;
        if (side === 'buy') {
            if (holding) {
                const currentValue = holding.quantity * parseFloat(holding.avgPrice);
                const newValue = quantity * price;
                const newQuantity = holding.quantity + quantity;
                const newAvgPrice = (currentValue + newValue) / newQuantity;
                await this.db.update(schema.holdings)
                    .set({
                    quantity: newQuantity,
                    avgPrice: newAvgPrice.toString(),
                    totalCost: (newQuantity * newAvgPrice).toString(),
                    updatedAt: new Date(),
                })
                    .where((0, drizzle_orm_1.eq)(schema.holdings.id, holding.id));
            }
            else {
                await this.db.insert(schema.holdings).values({
                    userId,
                    competitionId,
                    symbolId,
                    quantity,
                    avgPrice: price.toString(),
                    totalCost: total.toString(),
                });
            }
        }
        else {
            const avgCost = parseFloat(holding.avgPrice);
            realizedPL = (price - avgCost) * quantity - commission;
            const newQuantity = holding.quantity - quantity;
            if (newQuantity === 0) {
                await this.db.delete(schema.holdings).where((0, drizzle_orm_1.eq)(schema.holdings.id, holding.id));
            }
            else {
                await this.db.update(schema.holdings)
                    .set({
                    quantity: newQuantity,
                    totalCost: (newQuantity * avgCost).toString(),
                    updatedAt: new Date(),
                })
                    .where((0, drizzle_orm_1.eq)(schema.holdings.id, holding.id));
            }
        }
        await this.db.update(schema.portfolios)
            .set({
            cash: newCash.toString(),
            realizedPL: (parseFloat(portfolio.realizedPL) + realizedPL).toString(),
            tradeCount: portfolio.tradeCount + 1,
            updatedAt: new Date(),
        })
            .where((0, drizzle_orm_1.eq)(schema.portfolios.id, portfolio.id));
        await this.db.insert(schema.ledgerEntries).values({
            userId,
            competitionId,
            type: side,
            amount: netAmount.toString(),
            balanceAfter: newCash.toString(),
            referenceId: tradeId,
            description: `${side.toUpperCase()} ${quantity} shares @ रू${price.toFixed(2)}`,
        });
    }
    async reserveCash(userId, competitionId, amount) {
        const key = `reserved_cash:${userId}:${competitionId}`;
        const current = parseFloat(await this.redis.get(key) || '0');
        await this.redis.set(key, (current + amount).toString());
    }
    async releaseReservedCash(userId, competitionId, amount) {
        const key = `reserved_cash:${userId}:${competitionId}`;
        const current = parseFloat(await this.redis.get(key) || '0');
        await this.redis.set(key, Math.max(0, current - amount).toString());
    }
    async getReservedShares(userId, competitionId, symbolId) {
        const result = await this.db.select({ total: (0, drizzle_orm_1.sql) `COALESCE(SUM(${schema.orders.remainingQuantity}), 0)` })
            .from(schema.orders)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.orders.userId, userId), (0, drizzle_orm_1.eq)(schema.orders.competitionId, competitionId), (0, drizzle_orm_1.eq)(schema.orders.symbolId, symbolId), (0, drizzle_orm_1.eq)(schema.orders.side, 'sell'), (0, drizzle_orm_1.sql) `${schema.orders.status} IN ('open', 'partial')`));
        return result[0]?.total || 0;
    }
    async cancelOrder(userId, dto) {
        const order = await this.db.query.orders.findFirst({
            where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.orders.id, dto.orderId), (0, drizzle_orm_1.eq)(schema.orders.userId, userId)),
        });
        if (!order) {
            throw new common_1.BadRequestException('Order not found');
        }
        if (order.status === 'filled' || order.status === 'cancelled') {
            throw new common_1.BadRequestException(`Cannot cancel ${order.status} order`);
        }
        await this.db.update(schema.orders)
            .set({
            status: 'cancelled',
            updatedAt: new Date(),
        })
            .where((0, drizzle_orm_1.eq)(schema.orders.id, dto.orderId));
        if (order.side === 'buy' && order.type === 'limit') {
            const reservedAmount = order.remainingQuantity * parseFloat(order.price);
            await this.releaseReservedCash(userId, order.competitionId, reservedAmount * 1.01);
        }
        this.tradingGateway.broadcastOrderBookUpdate(order.symbolId);
        return { message: 'Order cancelled successfully', orderId: dto.orderId };
    }
    async editOrder(userId, dto) {
        const order = await this.db.query.orders.findFirst({
            where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.orders.id, dto.orderId), (0, drizzle_orm_1.eq)(schema.orders.userId, userId)),
        });
        if (!order) {
            throw new common_1.BadRequestException('Order not found');
        }
        if (order.type !== 'limit') {
            throw new common_1.BadRequestException('Only limit orders can be edited');
        }
        if (!['open', 'partial', 'pending'].includes(order.status)) {
            throw new common_1.BadRequestException(`Cannot edit ${order.status} order`);
        }
        if (!dto.price && !dto.quantity) {
            throw new common_1.BadRequestException('Provide at least price or quantity to update');
        }
        const competition = await this.competitionService.getActiveCompetition();
        if (!competition || competition.status !== 'active') {
            throw new common_1.BadRequestException('Cannot edit order - competition not active');
        }
        const latestPrice = await this.pricesService.getLatestPrice(order.symbolId);
        if (!latestPrice) {
            throw new common_1.BadRequestException('Symbol price not available');
        }
        const currentPrice = parseFloat(latestPrice.price);
        const newPrice = dto.price ?? parseFloat(order.price);
        const newQuantity = dto.quantity ?? order.remainingQuantity;
        const oldPrice = parseFloat(order.price);
        const oldRemainingQuantity = order.remainingQuantity;
        if (dto.price) {
            const maxDeviation = 0.10;
            const minPrice = currentPrice * (1 - maxDeviation);
            const maxPrice = currentPrice * (1 + maxDeviation);
            if (dto.price < minPrice || dto.price > maxPrice) {
                throw new common_1.BadRequestException(`Limit price must be within 10% of current price (रू${minPrice.toFixed(2)} - रू${maxPrice.toFixed(2)})`);
            }
        }
        if (dto.quantity && dto.quantity < 1) {
            throw new common_1.BadRequestException('Quantity must be at least 1');
        }
        if (order.side === 'buy') {
            const portfolio = await this.db.query.portfolios.findFirst({
                where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.portfolios.userId, userId), (0, drizzle_orm_1.eq)(schema.portfolios.competitionId, order.competitionId)),
            });
            if (!portfolio) {
                throw new common_1.BadRequestException('Portfolio not found');
            }
            const oldReserved = oldRemainingQuantity * oldPrice * 1.01;
            const newRequired = newQuantity * newPrice * 1.01;
            const cashDifference = newRequired - oldReserved;
            if (cashDifference > 0) {
                if (parseFloat(portfolio.cash) < cashDifference) {
                    throw new common_1.BadRequestException(`Insufficient cash for edit. Additional required: रू${cashDifference.toFixed(2)}, Available: रू${parseFloat(portfolio.cash).toFixed(2)}`);
                }
                await this.db.update(schema.portfolios)
                    .set({
                    cash: (0, drizzle_orm_1.sql) `${schema.portfolios.cash} - ${cashDifference}`,
                    updatedAt: new Date(),
                })
                    .where((0, drizzle_orm_1.eq)(schema.portfolios.id, portfolio.id));
            }
            else if (cashDifference < 0) {
                await this.db.update(schema.portfolios)
                    .set({
                    cash: (0, drizzle_orm_1.sql) `${schema.portfolios.cash} + ${Math.abs(cashDifference)}`,
                    updatedAt: new Date(),
                })
                    .where((0, drizzle_orm_1.eq)(schema.portfolios.id, portfolio.id));
            }
            if (competition.maxPositionSize) {
                const currentHolding = await this.db.query.holdings.findFirst({
                    where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.holdings.userId, userId), (0, drizzle_orm_1.eq)(schema.holdings.competitionId, order.competitionId), (0, drizzle_orm_1.eq)(schema.holdings.symbolId, order.symbolId)),
                });
                const currentQuantity = currentHolding?.quantity || 0;
                const newValue = (currentQuantity + newQuantity) * newPrice;
                const initialCapital = parseFloat(competition.initialCapital);
                const maxPositionValue = (parseFloat(competition.maxPositionSize) / 100) * initialCapital;
                if (newValue > maxPositionValue) {
                    if (cashDifference !== 0) {
                        await this.db.update(schema.portfolios)
                            .set({
                            cash: (0, drizzle_orm_1.sql) `${schema.portfolios.cash} + ${cashDifference}`,
                            updatedAt: new Date(),
                        })
                            .where((0, drizzle_orm_1.eq)(schema.portfolios.id, portfolio.id));
                    }
                    throw new common_1.BadRequestException(`Position would exceed maximum allowed (रू${maxPositionValue.toFixed(2)})`);
                }
            }
        }
        if (order.side === 'sell' && dto.quantity) {
            const holding = await this.db.query.holdings.findFirst({
                where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.holdings.userId, userId), (0, drizzle_orm_1.eq)(schema.holdings.competitionId, order.competitionId), (0, drizzle_orm_1.eq)(schema.holdings.symbolId, order.symbolId)),
            });
            const otherSellOrders = await this.db.select({ total: (0, drizzle_orm_1.sql) `SUM(${schema.orders.remainingQuantity})` })
                .from(schema.orders)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.orders.userId, userId), (0, drizzle_orm_1.eq)(schema.orders.competitionId, order.competitionId), (0, drizzle_orm_1.eq)(schema.orders.symbolId, order.symbolId), (0, drizzle_orm_1.eq)(schema.orders.side, 'sell'), (0, drizzle_orm_1.sql) `${schema.orders.status} IN ('open', 'partial')`, (0, drizzle_orm_1.sql) `${schema.orders.id} != ${dto.orderId}`));
            const otherReserved = otherSellOrders[0]?.total || 0;
            const availableShares = (holding?.quantity || 0) - otherReserved;
            if (dto.quantity > availableShares + oldRemainingQuantity) {
                throw new common_1.BadRequestException(`Cannot increase quantity. Available shares: ${availableShares + oldRemainingQuantity}`);
            }
        }
        const filledQuantity = order.quantity - oldRemainingQuantity;
        const newTotalQuantity = dto.quantity ? filledQuantity + dto.quantity : order.quantity;
        await this.db.update(schema.orders)
            .set({
            price: newPrice.toString(),
            quantity: newTotalQuantity,
            remainingQuantity: newQuantity,
            priority: new Date(),
            updatedAt: new Date(),
        })
            .where((0, drizzle_orm_1.eq)(schema.orders.id, dto.orderId));
        this.tradingGateway.broadcastOrderBookUpdate(order.symbolId);
        const updatedOrder = await this.db.query.orders.findFirst({
            where: (0, drizzle_orm_1.eq)(schema.orders.id, dto.orderId),
        });
        return {
            message: 'Order updated successfully',
            order: {
                id: updatedOrder.id,
                symbolId: updatedOrder.symbolId,
                side: updatedOrder.side,
                type: updatedOrder.type,
                price: parseFloat(updatedOrder.price),
                quantity: updatedOrder.quantity,
                remainingQuantity: updatedOrder.remainingQuantity,
                status: updatedOrder.status,
                updatedAt: updatedOrder.updatedAt,
            },
        };
    }
    async getOrderBook(symbolId, competitionId) {
        let compId = competitionId;
        if (!compId) {
            const competition = await this.competitionService.getActiveCompetition();
            if (!competition) {
                return { bids: [], asks: [], lastPrice: 0, spread: 0, spreadPercent: 0 };
            }
            compId = competition.id;
        }
        const bids = await this.db
            .select({
            price: schema.orders.price,
            quantity: (0, drizzle_orm_1.sql) `SUM(${schema.orders.remainingQuantity})`,
            orderCount: (0, drizzle_orm_1.sql) `COUNT(*)`,
        })
            .from(schema.orders)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.orders.competitionId, compId), (0, drizzle_orm_1.eq)(schema.orders.symbolId, symbolId), (0, drizzle_orm_1.eq)(schema.orders.side, 'buy'), (0, drizzle_orm_1.eq)(schema.orders.type, 'limit'), (0, drizzle_orm_1.sql) `${schema.orders.status} IN ('open', 'partial')`, (0, drizzle_orm_1.sql) `${schema.orders.remainingQuantity} > 0`))
            .groupBy(schema.orders.price)
            .orderBy((0, drizzle_orm_1.desc)(schema.orders.price))
            .limit(10);
        const asks = await this.db
            .select({
            price: schema.orders.price,
            quantity: (0, drizzle_orm_1.sql) `SUM(${schema.orders.remainingQuantity})`,
            orderCount: (0, drizzle_orm_1.sql) `COUNT(*)`,
        })
            .from(schema.orders)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.orders.competitionId, compId), (0, drizzle_orm_1.eq)(schema.orders.symbolId, symbolId), (0, drizzle_orm_1.eq)(schema.orders.side, 'sell'), (0, drizzle_orm_1.eq)(schema.orders.type, 'limit'), (0, drizzle_orm_1.sql) `${schema.orders.status} IN ('open', 'partial')`, (0, drizzle_orm_1.sql) `${schema.orders.remainingQuantity} > 0`))
            .groupBy(schema.orders.price)
            .orderBy((0, drizzle_orm_1.asc)(schema.orders.price))
            .limit(10);
        const lastTrade = await this.db.query.trades.findFirst({
            where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.trades.competitionId, compId), (0, drizzle_orm_1.eq)(schema.trades.symbolId, symbolId)),
            orderBy: [(0, drizzle_orm_1.desc)(schema.trades.executedAt)],
        });
        const latestPrice = await this.pricesService.getLatestPrice(symbolId);
        const lastPrice = lastTrade ? parseFloat(lastTrade.price) : (latestPrice ? parseFloat(latestPrice.price) : 0);
        const bestBid = bids.length > 0 ? parseFloat(bids[0].price) : 0;
        const bestAsk = asks.length > 0 ? parseFloat(asks[0].price) : 0;
        const spread = bestAsk > 0 && bestBid > 0 ? bestAsk - bestBid : 0;
        const spreadPercent = bestBid > 0 ? (spread / bestBid) * 100 : 0;
        return {
            bids: bids.map((b) => ({
                price: parseFloat(b.price),
                quantity: Number(b.quantity),
                orderCount: Number(b.orderCount),
            })),
            asks: asks.map((a) => ({
                price: parseFloat(a.price),
                quantity: Number(a.quantity),
                orderCount: Number(a.orderCount),
            })),
            lastPrice,
            spread,
            spreadPercent,
        };
    }
    async getOpenOrders(userId) {
        const orders = await this.db.query.orders.findMany({
            where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.orders.userId, userId), (0, drizzle_orm_1.sql) `${schema.orders.status} IN ('open', 'partial')`),
            orderBy: [(0, drizzle_orm_1.desc)(schema.orders.createdAt)],
        });
        const symbolIds = [...new Set(orders.map((o) => o.symbolId))];
        if (symbolIds.length === 0)
            return [];
        const symbols = await this.db.query.symbols.findMany();
        const symbolMap = new Map(symbols.map((s) => [s.id, s]));
        return orders.map((o) => ({
            ...o,
            price: o.price ? parseFloat(o.price) : null,
            avgFilledPrice: o.avgFilledPrice ? parseFloat(o.avgFilledPrice) : null,
            commission: parseFloat(o.commission),
            symbol: symbolMap.get(o.symbolId)?.symbol,
            companyName: symbolMap.get(o.symbolId)?.companyName,
        }));
    }
    async getOrders(userId, options) {
        let conditions = [(0, drizzle_orm_1.eq)(schema.orders.userId, userId)];
        if (options?.status) {
            conditions.push((0, drizzle_orm_1.eq)(schema.orders.status, options.status));
        }
        const orders = await this.db.query.orders.findMany({
            where: (0, drizzle_orm_1.and)(...conditions),
            orderBy: [(0, drizzle_orm_1.desc)(schema.orders.createdAt)],
            limit: options?.limit || 50,
        });
        const symbolIds = [...new Set(orders.map((o) => o.symbolId))];
        if (symbolIds.length === 0)
            return [];
        const symbols = await this.db.query.symbols.findMany();
        const symbolMap = new Map(symbols.map((s) => [s.id, s]));
        return orders.map((o) => ({
            ...o,
            price: o.price ? parseFloat(o.price) : null,
            avgFilledPrice: o.avgFilledPrice ? parseFloat(o.avgFilledPrice) : null,
            commission: parseFloat(o.commission),
            symbol: symbolMap.get(o.symbolId)?.symbol,
            companyName: symbolMap.get(o.symbolId)?.companyName,
        }));
    }
    async getTrades(userId, options) {
        console.log('[getTrades] Fetching trades for user:', userId, 'limit:', options?.limit);
        const trades = await this.db.query.trades.findMany({
            where: (0, drizzle_orm_1.eq)(schema.trades.userId, userId),
            orderBy: [(0, drizzle_orm_1.desc)(schema.trades.executedAt)],
            limit: options?.limit || 100,
        });
        console.log('[getTrades] Found', trades.length, 'trades');
        const symbolIds = [...new Set(trades.map((t) => t.symbolId))];
        if (symbolIds.length === 0)
            return [];
        const symbols = await this.db.query.symbols.findMany();
        const symbolMap = new Map(symbols.map((s) => [s.id, s]));
        const allTrades = await this.db.query.trades.findMany({
            where: (0, drizzle_orm_1.eq)(schema.trades.userId, userId),
            orderBy: [(0, drizzle_orm_1.asc)(schema.trades.executedAt)],
        });
        console.log('[getTrades] Total trades for P/L calc:', allTrades.length);
        const symbolCostBasis = new Map();
        const tradeAvgCostMap = new Map();
        for (const trade of allTrades) {
            const symbolId = trade.symbolId;
            let basis = symbolCostBasis.get(symbolId) || { totalShares: 0, totalCost: 0 };
            const tradePrice = parseFloat(trade.price);
            if (trade.side === 'buy') {
                basis.totalShares += trade.quantity;
                basis.totalCost += trade.quantity * tradePrice;
            }
            else {
                const avgCost = basis.totalShares > 0 ? basis.totalCost / basis.totalShares : tradePrice;
                tradeAvgCostMap.set(trade.id, avgCost);
                if (basis.totalShares > 0) {
                    const costPerShare = basis.totalCost / basis.totalShares;
                    basis.totalShares -= trade.quantity;
                    basis.totalCost -= trade.quantity * costPerShare;
                    if (basis.totalShares <= 0) {
                        basis = { totalShares: 0, totalCost: 0 };
                    }
                }
            }
            symbolCostBasis.set(symbolId, basis);
        }
        return trades.map((t) => {
            const price = parseFloat(t.price);
            const total = parseFloat(t.total);
            const commission = parseFloat(t.commission);
            let realizedPL = null;
            let avgCost = null;
            if (t.side === 'sell') {
                avgCost = tradeAvgCostMap.get(t.id) || price;
                realizedPL = (price - avgCost) * t.quantity - commission;
            }
            return {
                ...t,
                price,
                total,
                commission,
                realizedPL,
                avgCost,
                symbol: symbolMap.get(t.symbolId)?.symbol,
                companyName: symbolMap.get(t.symbolId)?.companyName,
            };
        });
    }
    async getTradesRaw(userId) {
        const trades = await this.db.query.trades.findMany({
            where: (0, drizzle_orm_1.eq)(schema.trades.userId, userId),
            orderBy: [(0, drizzle_orm_1.desc)(schema.trades.executedAt)],
            limit: 100,
        });
        return { count: trades.length, trades };
    }
    async expireOrders() {
        const now = new Date();
        const expiredOrders = await this.db.query.orders.findMany({
            where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.sql) `${schema.orders.status} IN ('open', 'partial')`, (0, drizzle_orm_1.sql) `${schema.orders.expiresAt} IS NOT NULL`, (0, drizzle_orm_1.sql) `${schema.orders.expiresAt} < ${now}`),
        });
        for (const order of expiredOrders) {
            await this.db.update(schema.orders)
                .set({
                status: 'expired',
                updatedAt: now,
            })
                .where((0, drizzle_orm_1.eq)(schema.orders.id, order.id));
            if (order.side === 'buy') {
                const reservedAmount = order.remainingQuantity * parseFloat(order.price);
                await this.releaseReservedCash(order.userId, order.competitionId, reservedAmount * 1.01);
            }
            this.tradingGateway.sendOrderUpdate(order.userId, {
                orderId: order.id,
                status: 'expired',
                message: 'Order expired',
            });
        }
        return { expired: expiredOrders.length };
    }
    async checkAchievementsAfterTrade(userId, competitionId) {
        try {
            const tradeAchievements = await this.achievementsService.checkTradeAchievements({
                userId,
                competitionId,
                type: 'trade',
            });
            const portfolioAchievements = await this.achievementsService.checkPortfolioAchievements(userId, competitionId);
            const allAchievements = [...tradeAchievements, ...portfolioAchievements];
            for (const achievement of allAchievements) {
                this.tradingGateway.sendAchievementUnlocked(userId, achievement);
            }
        }
        catch (error) {
            console.error('Error checking achievements:', error);
        }
    }
};
exports.TradingService = TradingService;
exports.TradingService = TradingService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(database_module_1.DATABASE_CONNECTION)),
    __param(1, (0, common_1.Inject)(redis_module_1.REDIS_CLIENT)),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => prices_service_1.PricesService))),
    __param(3, (0, common_1.Inject)((0, common_1.forwardRef)(() => competition_service_1.CompetitionService))),
    __param(4, (0, common_1.Inject)((0, common_1.forwardRef)(() => trading_gateway_1.TradingGateway))),
    __metadata("design:paramtypes", [Object, ioredis_1.default,
        prices_service_1.PricesService,
        competition_service_1.CompetitionService,
        trading_gateway_1.TradingGateway,
        achievements_service_1.AchievementsService])
], TradingService);
//# sourceMappingURL=trading.service.js.map