// ============================================================
// Bullish Clash - Trading Service (Order Execution Engine)
// Real-world order book with price-time priority matching
// ============================================================

import { Injectable, Inject, BadRequestException, forwardRef } from '@nestjs/common';
import { eq, and, desc, asc, sql, gte, lte } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';
import { DATABASE_CONNECTION } from '../../database/database.module';
import { REDIS_CLIENT } from '../redis/redis.module';
import * as schema from '../../database/schema';
import { PricesService } from '../prices/prices.service';
import { CompetitionService } from '../competition/competition.service';
import { TradingGateway } from '../websocket/trading.gateway';
import { AchievementsService } from '../achievements/achievements.service';
import { PlaceOrderDto, CancelOrderDto, EditOrderDto } from './trading.dto';
import Redis from 'ioredis';

interface MatchResult {
    trades: Array<{
        id: string;
        buyOrderId: string;
        sellOrderId: string;
        buyerId: string;
        sellerId: string;
        quantity: number;
        price: number;
    }>;
    remainingQuantity: number;
}

@Injectable()
export class TradingService {
    constructor(
        @Inject(DATABASE_CONNECTION) private readonly db: any,
        @Inject(REDIS_CLIENT) private readonly redis: Redis,
        @Inject(forwardRef(() => PricesService)) private readonly pricesService: PricesService,
        @Inject(forwardRef(() => CompetitionService)) private readonly competitionService: CompetitionService,
        @Inject(forwardRef(() => TradingGateway)) private readonly tradingGateway: TradingGateway,
        private readonly achievementsService: AchievementsService,
    ) { }

    // ============================================================
    // Main Order Placement - Handles both Market and Limit orders
    // ============================================================
    async placeOrder(userId: string, dto: PlaceOrderDto) {
        const competition = await this.competitionService.getActiveCompetition();

        if (!competition) {
            throw new BadRequestException('No active competition');
        }

        if (competition.status !== 'active') {
            throw new BadRequestException('Competition is not active. Trading is disabled.');
        }

        const now = new Date();
        if (now < new Date(competition.startTime) || now > new Date(competition.endTime)) {
            throw new BadRequestException('Trading is only allowed during competition hours');
        }

        // Rate limiting
        const rateLimitKey = `order_rate:${userId}`;
        const orderCount = await this.redis.incr(rateLimitKey);
        if (orderCount === 1) {
            await this.redis.expire(rateLimitKey, 60);
        }
        if (orderCount > 30) {
            throw new BadRequestException('Rate limit exceeded. Maximum 30 orders per minute.');
        }

        const portfolio = await this.db.query.portfolios.findFirst({
            where: and(
                eq(schema.portfolios.userId, userId),
                eq(schema.portfolios.competitionId, competition.id),
            ),
        });

        if (!portfolio) {
            throw new BadRequestException('Portfolio not found. Please join the competition first.');
        }

        // Daily trade limit check
        if (competition.maxDailyTrades) {
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            const todayTrades = await this.db.select({ count: sql<number>`count(*)` })
                .from(schema.trades)
                .where(and(
                    eq(schema.trades.userId, userId),
                    eq(schema.trades.competitionId, competition.id),
                    sql`${schema.trades.executedAt} >= ${todayStart}`,
                ));
            if (todayTrades[0].count >= competition.maxDailyTrades) {
                throw new BadRequestException(`Daily trade limit (${competition.maxDailyTrades}) reached`);
            }
        }

        // Get latest price for validation
        const latestPrice = await this.pricesService.getLatestPrice(dto.symbolId);
        if (!latestPrice) {
            throw new BadRequestException('Symbol not found or price not available');
        }

        const currentPrice = parseFloat(latestPrice.price);
        const orderType = dto.type || 'market';
        const orderPrice = orderType === 'limit' ? dto.price! : currentPrice;

        // Validate limit order price
        if (orderType === 'limit') {
            if (!dto.price || dto.price <= 0) {
                throw new BadRequestException('Limit orders require a valid price');
            }
            // Price must be within 10% of current price (circuit breaker)
            const maxDeviation = 0.10;
            const minPrice = currentPrice * (1 - maxDeviation);
            const maxPrice = currentPrice * (1 + maxDeviation);
            if (dto.price < minPrice || dto.price > maxPrice) {
                throw new BadRequestException(
                    `Limit price must be within 10% of current price (रू${minPrice.toFixed(2)} - रू${maxPrice.toFixed(2)})`
                );
            }
        }

        const commissionRate = parseFloat(competition.commissionRate);
        const estimatedTotal = orderPrice * dto.quantity;
        const estimatedCommission = estimatedTotal * commissionRate;

        // Validate funds/shares
        if (dto.side === 'buy') {
            const requiredCash = estimatedTotal + estimatedCommission;
            if (parseFloat(portfolio.cash) < requiredCash) {
                throw new BadRequestException(
                    `Insufficient cash. Required: रू${requiredCash.toFixed(2)}, Available: रू${parseFloat(portfolio.cash).toFixed(2)}`
                );
            }

            // Check position size limit (maxPositionSize is a percentage of initial capital)
            if (competition.maxPositionSize) {
                const currentHolding = await this.db.query.holdings.findFirst({
                    where: and(
                        eq(schema.holdings.userId, userId),
                        eq(schema.holdings.competitionId, competition.id),
                        eq(schema.holdings.symbolId, dto.symbolId),
                    ),
                });
                const currentQuantity = currentHolding?.quantity || 0;
                const newValue = (currentQuantity + dto.quantity) * orderPrice;
                // maxPositionSize is percentage (e.g., 50 = 50% of initial capital)
                const initialCapital = parseFloat(competition.initialCapital);
                const maxPositionValue = (parseFloat(competition.maxPositionSize) / 100) * initialCapital;
                if (newValue > maxPositionValue) {
                    throw new BadRequestException(
                        `Position would exceed maximum allowed (${competition.maxPositionSize}% = रू${maxPositionValue.toLocaleString()})`
                    );
                }
            }

            // Reserve cash for limit orders
            if (orderType === 'limit') {
                await this.reserveCash(userId, competition.id, requiredCash);
            }
        } else {
            const holding = await this.db.query.holdings.findFirst({
                where: and(
                    eq(schema.holdings.userId, userId),
                    eq(schema.holdings.competitionId, competition.id),
                    eq(schema.holdings.symbolId, dto.symbolId),
                ),
            });

            // Check available shares (total - reserved)
            const reservedShares = await this.getReservedShares(userId, competition.id, dto.symbolId);
            const availableShares = (holding?.quantity || 0) - reservedShares;

            if (availableShares < dto.quantity) {
                throw new BadRequestException(
                    `Insufficient shares. Available: ${availableShares} (${reservedShares} reserved in open orders)`
                );
            }

            if (!competition.allowShortSelling && (!holding || holding.quantity < dto.quantity)) {
                throw new BadRequestException('Short selling is not allowed');
            }
        }

        // Execute order based on type
        if (orderType === 'market') {
            return await this.executeMarketOrder(userId, competition.id, dto, currentPrice, commissionRate);
        } else {
            return await this.placeLimitOrder(userId, competition.id, dto, commissionRate);
        }
    }

    // ============================================================
    // Market Order Execution - Immediate execution against order book
    // ============================================================
    private async executeMarketOrder(
        userId: string,
        competitionId: string,
        dto: PlaceOrderDto,
        currentPrice: number,
        commissionRate: number,
    ) {
        const orderId = uuid();
        const now = new Date();

        try {
            // Create order record FIRST (due to foreign key constraint on trades)
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

            // Try to match against existing limit orders first
            const matchResult = await this.matchMarketOrder(competitionId, dto.symbolId, dto.side, dto.quantity);

            let totalFilled = 0;
            let totalValue = 0;
            const trades: any[] = [];

            // Process matches from order book
            for (const match of matchResult.trades) {
                const tradeId = uuid();
                const tradeValue = match.quantity * match.price;
                const commission = tradeValue * commissionRate;

                // Create trade record
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

                // Update counterparty's order
                await this.updateMatchedOrder(
                    dto.side === 'buy' ? match.sellOrderId : match.buyOrderId,
                    match.quantity,
                    match.price,
                    commissionRate,
                );

                // Process counterparty's portfolio
                await this.processTradeSettlement(
                    dto.side === 'buy' ? match.sellerId : match.buyerId,
                    competitionId,
                    dto.symbolId,
                    dto.side === 'buy' ? 'sell' : 'buy',
                    match.quantity,
                    match.price,
                    commission,
                    tradeId,
                );

                trades.push(trade);
                totalFilled += match.quantity;
                totalValue += tradeValue;
            }

            // Fill remaining at current price (market maker simulation)
            const remainingQty = dto.quantity - totalFilled;
            if (remainingQty > 0) {
                const tradeId = uuid();
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

            // Update order record with final values
            await this.db.update(schema.orders)
                .set({
                    filledQuantity: totalFilled,
                    remainingQuantity: 0,
                    avgFilledPrice: avgPrice.toString(),
                    status: 'filled',
                    commission: totalCommission.toString(),
                    updatedAt: new Date(),
                })
                .where(eq(schema.orders.id, orderId));

            // Update user's portfolio
            await this.processTradeSettlement(
                userId,
                competitionId,
                dto.symbolId,
                dto.side,
                totalFilled,
                avgPrice,
                totalCommission,
                trades[0].id,
            );

            // Apply market impact - price moves towards execution price
            await this.pricesService.applyTradeImpact({
                symbolId: dto.symbolId,
                side: dto.side,
                quantity: totalFilled,
                tradeValue: totalValue,
                executionPrice: avgPrice,
            });

            // Get symbol info
            const symbol = await this.db.query.symbols.findFirst({
                where: eq(schema.symbols.id, dto.symbolId),
            });

            // Broadcast updates
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

            // Check for achievements (async, don't block the response)
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
        } catch (error) {
            console.error('Market order execution error:', error);
            throw new BadRequestException('Failed to execute order. Please try again.');
        }
    }

    // ============================================================
    // Limit Order Placement - Add to order book
    // ============================================================
    private async placeLimitOrder(
        userId: string,
        competitionId: string,
        dto: PlaceOrderDto,
        commissionRate: number,
    ) {
        const orderId = uuid();
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hour expiry

        try {
            // Create order record FIRST (due to foreign key constraint on trades)
            const [order] = await this.db.insert(schema.orders).values({
                id: orderId,
                userId,
                competitionId,
                symbolId: dto.symbolId,
                side: dto.side,
                type: 'limit',
                quantity: dto.quantity,
                price: dto.price!.toString(),
                filledQuantity: 0,
                remainingQuantity: dto.quantity,
                avgFilledPrice: null,
                status: 'open',
                commission: '0',
                priority: now,
                expiresAt: expiresAt,
            }).returning();

            // Try immediate matching
            const matchResult = await this.matchLimitOrder(
                competitionId,
                dto.symbolId,
                dto.side,
                dto.quantity,
                dto.price!,
            );

            let totalFilled = 0;
            let totalValue = 0;
            const trades: any[] = [];

            // Process matches
            for (const match of matchResult.trades) {
                const tradeId = uuid();
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

                // Update counterparty order
                await this.updateMatchedOrder(
                    dto.side === 'buy' ? match.sellOrderId : match.buyOrderId,
                    match.quantity,
                    match.price,
                    commissionRate,
                );

                // Process counterparty settlement
                await this.processTradeSettlement(
                    dto.side === 'buy' ? match.sellerId : match.buyerId,
                    competitionId,
                    dto.symbolId,
                    dto.side === 'buy' ? 'sell' : 'buy',
                    match.quantity,
                    match.price,
                    commission,
                    tradeId,
                );

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

            // Update order record with final values
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
                .where(eq(schema.orders.id, orderId));

            // Process user's fills
            if (totalFilled > 0) {
                await this.processTradeSettlement(
                    userId,
                    competitionId,
                    dto.symbolId,
                    dto.side,
                    totalFilled,
                    avgPrice!,
                    totalCommission,
                    trades[0].id,
                );

                // Apply market impact - price moves towards execution price
                await this.pricesService.applyTradeImpact({
                    symbolId: dto.symbolId,
                    side: dto.side,
                    quantity: totalFilled,
                    tradeValue: totalValue,
                    executionPrice: avgPrice!,
                });
            }

            // Get symbol info
            const symbol = await this.db.query.symbols.findFirst({
                where: eq(schema.symbols.id, dto.symbolId),
            });

            // Broadcast updates
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

                // Check for achievements (async, don't block the response)
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
        } catch (error) {
            // Release reserved funds on error
            if (dto.side === 'buy') {
                const estimatedTotal = dto.price! * dto.quantity;
                await this.releaseReservedCash(userId, competitionId, estimatedTotal * (1 + commissionRate));
            }
            console.error('Limit order placement error:', error);
            throw new BadRequestException('Failed to place order. Please try again.');
        }
    }

    // ============================================================
    // Order Matching Engine - Price-Time Priority
    // ============================================================
    private async matchMarketOrder(
        competitionId: string,
        symbolId: string,
        side: 'buy' | 'sell',
        quantity: number,
    ): Promise<MatchResult> {
        // For buy market orders, match against sell limit orders (asks)
        // For sell market orders, match against buy limit orders (bids)
        const oppositeSide = side === 'buy' ? 'sell' : 'buy';

        const matchingOrders = await this.db.query.orders.findMany({
            where: and(
                eq(schema.orders.competitionId, competitionId),
                eq(schema.orders.symbolId, symbolId),
                eq(schema.orders.side, oppositeSide),
                eq(schema.orders.type, 'limit'),
                sql`${schema.orders.status} IN ('open', 'partial')`,
                sql`${schema.orders.remainingQuantity} > 0`,
            ),
            orderBy: side === 'buy'
                ? [asc(schema.orders.price), asc(schema.orders.priority)] // Best ask first (lowest price)
                : [desc(schema.orders.price), asc(schema.orders.priority)], // Best bid first (highest price)
        });

        const trades: MatchResult['trades'] = [];
        let remainingQty = quantity;

        for (const order of matchingOrders) {
            if (remainingQty <= 0) break;

            const matchQty = Math.min(remainingQty, order.remainingQuantity);
            const matchPrice = parseFloat(order.price);

            trades.push({
                id: uuid(),
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

    private async matchLimitOrder(
        competitionId: string,
        symbolId: string,
        side: 'buy' | 'sell',
        quantity: number,
        limitPrice: number,
    ): Promise<MatchResult> {
        const oppositeSide = side === 'buy' ? 'sell' : 'buy';

        // For buy: match asks <= limit price
        // For sell: match bids >= limit price
        const priceCondition = side === 'buy'
            ? lte(schema.orders.price, limitPrice.toString())
            : gte(schema.orders.price, limitPrice.toString());

        const matchingOrders = await this.db.query.orders.findMany({
            where: and(
                eq(schema.orders.competitionId, competitionId),
                eq(schema.orders.symbolId, symbolId),
                eq(schema.orders.side, oppositeSide),
                eq(schema.orders.type, 'limit'),
                sql`${schema.orders.status} IN ('open', 'partial')`,
                sql`${schema.orders.remainingQuantity} > 0`,
                priceCondition,
            ),
            orderBy: side === 'buy'
                ? [asc(schema.orders.price), asc(schema.orders.priority)]
                : [desc(schema.orders.price), asc(schema.orders.priority)],
        });

        const trades: MatchResult['trades'] = [];
        let remainingQty = quantity;

        for (const order of matchingOrders) {
            if (remainingQty <= 0) break;

            const matchQty = Math.min(remainingQty, order.remainingQuantity);
            const matchPrice = parseFloat(order.price); // Price-time priority: use resting order's price

            trades.push({
                id: uuid(),
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

    // ============================================================
    // Order Book Updates
    // ============================================================
    private async updateMatchedOrder(
        orderId: string,
        filledQty: number,
        price: number,
        commissionRate: number,
    ) {
        const order = await this.db.query.orders.findFirst({
            where: eq(schema.orders.id, orderId),
        });

        if (!order) return;

        const newFilledQty = order.filledQuantity + filledQty;
        const newRemainingQty = order.remainingQuantity - filledQty;
        const tradeValue = filledQty * price;
        const commission = tradeValue * commissionRate;

        // Calculate new average filled price
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
            .where(eq(schema.orders.id, orderId));

        // Notify the order owner
        this.tradingGateway.sendOrderUpdate(order.userId, {
            orderId,
            status: newStatus,
            filledQuantity: newFilledQty,
            remainingQuantity: newRemainingQty,
            avgFilledPrice: newAvgPrice,
        });
    }

    // ============================================================
    // Trade Settlement - Update portfolios and holdings
    // ============================================================
    private async processTradeSettlement(
        userId: string,
        competitionId: string,
        symbolId: string,
        side: 'buy' | 'sell',
        quantity: number,
        price: number,
        commission: number,
        tradeId: string,
    ) {
        const total = price * quantity;
        const netAmount = side === 'buy' ? -(total + commission) : total - commission;

        const portfolio = await this.db.query.portfolios.findFirst({
            where: and(
                eq(schema.portfolios.userId, userId),
                eq(schema.portfolios.competitionId, competitionId),
            ),
        });

        const holding = await this.db.query.holdings.findFirst({
            where: and(
                eq(schema.holdings.userId, userId),
                eq(schema.holdings.competitionId, competitionId),
                eq(schema.holdings.symbolId, symbolId),
            ),
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
                    .where(eq(schema.holdings.id, holding.id));
            } else {
                await this.db.insert(schema.holdings).values({
                    userId,
                    competitionId,
                    symbolId,
                    quantity,
                    avgPrice: price.toString(),
                    totalCost: total.toString(),
                });
            }
        } else {
            const avgCost = parseFloat(holding!.avgPrice);
            realizedPL = (price - avgCost) * quantity - commission;
            const newQuantity = holding!.quantity - quantity;

            if (newQuantity === 0) {
                await this.db.delete(schema.holdings).where(eq(schema.holdings.id, holding!.id));
            } else {
                await this.db.update(schema.holdings)
                    .set({
                        quantity: newQuantity,
                        totalCost: (newQuantity * avgCost).toString(),
                        updatedAt: new Date(),
                    })
                    .where(eq(schema.holdings.id, holding!.id));
            }
        }

        // Update portfolio
        await this.db.update(schema.portfolios)
            .set({
                cash: newCash.toString(),
                realizedPL: (parseFloat(portfolio.realizedPL) + realizedPL).toString(),
                tradeCount: portfolio.tradeCount + 1,
                updatedAt: new Date(),
            })
            .where(eq(schema.portfolios.id, portfolio.id));

        // Record ledger entry
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

    // ============================================================
    // Cash/Share Reservation for Limit Orders
    // ============================================================
    private async reserveCash(userId: string, competitionId: string, amount: number) {
        const key = `reserved_cash:${userId}:${competitionId}`;
        const current = parseFloat(await this.redis.get(key) || '0');
        await this.redis.set(key, (current + amount).toString());
    }

    private async releaseReservedCash(userId: string, competitionId: string, amount: number) {
        const key = `reserved_cash:${userId}:${competitionId}`;
        const current = parseFloat(await this.redis.get(key) || '0');
        await this.redis.set(key, Math.max(0, current - amount).toString());
    }

    private async getReservedShares(userId: string, competitionId: string, symbolId: string): Promise<number> {
        // Sum remaining quantity of open sell orders
        const result = await this.db.select({ total: sql<number>`COALESCE(SUM(${schema.orders.remainingQuantity}), 0)` })
            .from(schema.orders)
            .where(and(
                eq(schema.orders.userId, userId),
                eq(schema.orders.competitionId, competitionId),
                eq(schema.orders.symbolId, symbolId),
                eq(schema.orders.side, 'sell'),
                sql`${schema.orders.status} IN ('open', 'partial')`,
            ));
        return result[0]?.total || 0;
    }

    // ============================================================
    // Cancel Order
    // ============================================================
    async cancelOrder(userId: string, dto: CancelOrderDto) {
        const order = await this.db.query.orders.findFirst({
            where: and(
                eq(schema.orders.id, dto.orderId),
                eq(schema.orders.userId, userId),
            ),
        });

        if (!order) {
            throw new BadRequestException('Order not found');
        }

        if (order.status === 'filled' || order.status === 'cancelled') {
            throw new BadRequestException(`Cannot cancel ${order.status} order`);
        }

        await this.db.update(schema.orders)
            .set({
                status: 'cancelled',
                updatedAt: new Date(),
            })
            .where(eq(schema.orders.id, dto.orderId));

        // Release reserved funds
        if (order.side === 'buy' && order.type === 'limit') {
            const reservedAmount = order.remainingQuantity * parseFloat(order.price);
            await this.releaseReservedCash(userId, order.competitionId, reservedAmount * 1.01);
        }

        // Broadcast order book update
        this.tradingGateway.broadcastOrderBookUpdate(order.symbolId);

        return { message: 'Order cancelled successfully', orderId: dto.orderId };
    }

    // ============================================================
    // Edit Order - Allows users to modify their open limit orders
    // ============================================================
    async editOrder(userId: string, dto: EditOrderDto) {
        const order = await this.db.query.orders.findFirst({
            where: and(
                eq(schema.orders.id, dto.orderId),
                eq(schema.orders.userId, userId),
            ),
        });

        if (!order) {
            throw new BadRequestException('Order not found');
        }

        // Only open/partial limit orders can be edited
        if (order.type !== 'limit') {
            throw new BadRequestException('Only limit orders can be edited');
        }

        if (!['open', 'partial', 'pending'].includes(order.status)) {
            throw new BadRequestException(`Cannot edit ${order.status} order`);
        }

        if (!dto.price && !dto.quantity) {
            throw new BadRequestException('Provide at least price or quantity to update');
        }

        const competition = await this.competitionService.getActiveCompetition();
        if (!competition || competition.status !== 'active') {
            throw new BadRequestException('Cannot edit order - competition not active');
        }

        // Get current price for validation
        const latestPrice = await this.pricesService.getLatestPrice(order.symbolId);
        if (!latestPrice) {
            throw new BadRequestException('Symbol price not available');
        }

        const currentPrice = parseFloat(latestPrice.price);
        const newPrice = dto.price ?? parseFloat(order.price);
        const newQuantity = dto.quantity ?? order.remainingQuantity;
        const oldPrice = parseFloat(order.price);
        const oldRemainingQuantity = order.remainingQuantity;

        // Validate new price is within 10% of current price (circuit breaker)
        if (dto.price) {
            const maxDeviation = 0.10;
            const minPrice = currentPrice * (1 - maxDeviation);
            const maxPrice = currentPrice * (1 + maxDeviation);
            if (dto.price < minPrice || dto.price > maxPrice) {
                throw new BadRequestException(
                    `Limit price must be within 10% of current price (रू${minPrice.toFixed(2)} - रू${maxPrice.toFixed(2)})`
                );
            }
        }

        // Validate quantity
        if (dto.quantity && dto.quantity < 1) {
            throw new BadRequestException('Quantity must be at least 1');
        }

        // For buy orders, adjust reserved cash
        if (order.side === 'buy') {
            const portfolio = await this.db.query.portfolios.findFirst({
                where: and(
                    eq(schema.portfolios.userId, userId),
                    eq(schema.portfolios.competitionId, order.competitionId),
                ),
            });

            if (!portfolio) {
                throw new BadRequestException('Portfolio not found');
            }

            // Calculate cash difference
            const oldReserved = oldRemainingQuantity * oldPrice * 1.01; // with commission buffer
            const newRequired = newQuantity * newPrice * 1.01;
            const cashDifference = newRequired - oldReserved;

            if (cashDifference > 0) {
                // Need more cash
                if (parseFloat(portfolio.cash) < cashDifference) {
                    throw new BadRequestException(
                        `Insufficient cash for edit. Additional required: रू${cashDifference.toFixed(2)}, Available: रू${parseFloat(portfolio.cash).toFixed(2)}`
                    );
                }
                // Reserve additional cash
                await this.db.update(schema.portfolios)
                    .set({
                        cash: sql`${schema.portfolios.cash} - ${cashDifference}`,
                        updatedAt: new Date(),
                    })
                    .where(eq(schema.portfolios.id, portfolio.id));
            } else if (cashDifference < 0) {
                // Release excess cash
                await this.db.update(schema.portfolios)
                    .set({
                        cash: sql`${schema.portfolios.cash} + ${Math.abs(cashDifference)}`,
                        updatedAt: new Date(),
                    })
                    .where(eq(schema.portfolios.id, portfolio.id));
            }

            // Check position size limit after edit
            if (competition.maxPositionSize) {
                const currentHolding = await this.db.query.holdings.findFirst({
                    where: and(
                        eq(schema.holdings.userId, userId),
                        eq(schema.holdings.competitionId, order.competitionId),
                        eq(schema.holdings.symbolId, order.symbolId),
                    ),
                });
                const currentQuantity = currentHolding?.quantity || 0;
                const newValue = (currentQuantity + newQuantity) * newPrice;
                const initialCapital = parseFloat(competition.initialCapital);
                const maxPositionValue = (parseFloat(competition.maxPositionSize) / 100) * initialCapital;
                if (newValue > maxPositionValue) {
                    // Rollback cash change
                    if (cashDifference !== 0) {
                        await this.db.update(schema.portfolios)
                            .set({
                                cash: sql`${schema.portfolios.cash} + ${cashDifference}`,
                                updatedAt: new Date(),
                            })
                            .where(eq(schema.portfolios.id, portfolio.id));
                    }
                    throw new BadRequestException(
                        `Position would exceed maximum allowed (रू${maxPositionValue.toFixed(2)})`
                    );
                }
            }
        }

        // For sell orders, validate holdings
        if (order.side === 'sell' && dto.quantity) {
            const holding = await this.db.query.holdings.findFirst({
                where: and(
                    eq(schema.holdings.userId, userId),
                    eq(schema.holdings.competitionId, order.competitionId),
                    eq(schema.holdings.symbolId, order.symbolId),
                ),
            });

            // Calculate total shares already reserved in other open sell orders
            const otherSellOrders = await this.db.select({ total: sql<number>`SUM(${schema.orders.remainingQuantity})` })
                .from(schema.orders)
                .where(and(
                    eq(schema.orders.userId, userId),
                    eq(schema.orders.competitionId, order.competitionId),
                    eq(schema.orders.symbolId, order.symbolId),
                    eq(schema.orders.side, 'sell'),
                    sql`${schema.orders.status} IN ('open', 'partial')`,
                    sql`${schema.orders.id} != ${dto.orderId}`,
                ));

            const otherReserved = otherSellOrders[0]?.total || 0;
            const availableShares = (holding?.quantity || 0) - otherReserved;

            if (dto.quantity > availableShares + oldRemainingQuantity) {
                throw new BadRequestException(
                    `Cannot increase quantity. Available shares: ${availableShares + oldRemainingQuantity}`
                );
            }
        }

        // Update the order
        const filledQuantity = order.quantity - oldRemainingQuantity;
        const newTotalQuantity = dto.quantity ? filledQuantity + dto.quantity : order.quantity;

        await this.db.update(schema.orders)
            .set({
                price: newPrice.toString(),
                quantity: newTotalQuantity,
                remainingQuantity: newQuantity,
                priority: new Date(), // Reset priority when price changes
                updatedAt: new Date(),
            })
            .where(eq(schema.orders.id, dto.orderId));

        // Broadcast order book update
        this.tradingGateway.broadcastOrderBookUpdate(order.symbolId);

        // Fetch updated order
        const updatedOrder = await this.db.query.orders.findFirst({
            where: eq(schema.orders.id, dto.orderId),
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

    // ============================================================
    // Get Order Book
    // ============================================================
    async getOrderBook(symbolId: string, competitionId?: string) {
        let compId = competitionId;
        if (!compId) {
            const competition = await this.competitionService.getActiveCompetition();
            if (!competition) {
                return { bids: [], asks: [], lastPrice: 0, spread: 0, spreadPercent: 0 };
            }
            compId = competition.id;
        }

        // Get aggregated bids (buy orders) - highest price first
        const bids = await this.db
            .select({
                price: schema.orders.price,
                quantity: sql<number>`SUM(${schema.orders.remainingQuantity})`,
                orderCount: sql<number>`COUNT(*)`,
            })
            .from(schema.orders)
            .where(and(
                eq(schema.orders.competitionId, compId!),
                eq(schema.orders.symbolId, symbolId),
                eq(schema.orders.side, 'buy'),
                eq(schema.orders.type, 'limit'),
                sql`${schema.orders.status} IN ('open', 'partial')`,
                sql`${schema.orders.remainingQuantity} > 0`,
            ))
            .groupBy(schema.orders.price)
            .orderBy(desc(schema.orders.price))
            .limit(10);

        // Get aggregated asks (sell orders) - lowest price first
        const asks = await this.db
            .select({
                price: schema.orders.price,
                quantity: sql<number>`SUM(${schema.orders.remainingQuantity})`,
                orderCount: sql<number>`COUNT(*)`,
            })
            .from(schema.orders)
            .where(and(
                eq(schema.orders.competitionId, compId!),
                eq(schema.orders.symbolId, symbolId),
                eq(schema.orders.side, 'sell'),
                eq(schema.orders.type, 'limit'),
                sql`${schema.orders.status} IN ('open', 'partial')`,
                sql`${schema.orders.remainingQuantity} > 0`,
            ))
            .groupBy(schema.orders.price)
            .orderBy(asc(schema.orders.price))
            .limit(10);

        // Get last traded price
        const lastTrade = await this.db.query.trades.findFirst({
            where: and(
                eq(schema.trades.competitionId, compId!),
                eq(schema.trades.symbolId, symbolId),
            ),
            orderBy: [desc(schema.trades.executedAt)],
        });

        const latestPrice = await this.pricesService.getLatestPrice(symbolId);
        const lastPrice = lastTrade ? parseFloat(lastTrade.price) : (latestPrice ? parseFloat(latestPrice.price) : 0);

        // Calculate spread
        const bestBid = bids.length > 0 ? parseFloat(bids[0].price) : 0;
        const bestAsk = asks.length > 0 ? parseFloat(asks[0].price) : 0;
        const spread = bestAsk > 0 && bestBid > 0 ? bestAsk - bestBid : 0;
        const spreadPercent = bestBid > 0 ? (spread / bestBid) * 100 : 0;

        return {
            bids: bids.map((b: { price: string; quantity: number; orderCount: number }) => ({
                price: parseFloat(b.price),
                quantity: Number(b.quantity),
                orderCount: Number(b.orderCount),
            })),
            asks: asks.map((a: { price: string; quantity: number; orderCount: number }) => ({
                price: parseFloat(a.price),
                quantity: Number(a.quantity),
                orderCount: Number(a.orderCount),
            })),
            lastPrice,
            spread,
            spreadPercent,
        };
    }

    // ============================================================
    // Get User's Open Orders
    // ============================================================
    async getOpenOrders(userId: string) {
        const orders = await this.db.query.orders.findMany({
            where: and(
                eq(schema.orders.userId, userId),
                sql`${schema.orders.status} IN ('open', 'partial')`,
            ),
            orderBy: [desc(schema.orders.createdAt)],
        });

        const symbolIds = [...new Set(orders.map((o: any) => o.symbolId))];
        if (symbolIds.length === 0) return [];

        const symbols = await this.db.query.symbols.findMany();
        const symbolMap = new Map(symbols.map((s: any) => [s.id, s]));

        return orders.map((o: any) => ({
            ...o,
            price: o.price ? parseFloat(o.price) : null,
            avgFilledPrice: o.avgFilledPrice ? parseFloat(o.avgFilledPrice) : null,
            commission: parseFloat(o.commission),
            symbol: (symbolMap.get(o.symbolId) as any)?.symbol,
            companyName: (symbolMap.get(o.symbolId) as any)?.companyName,
        }));
    }

    // ============================================================
    // Get User's Orders (all statuses)
    // ============================================================
    async getOrders(userId: string, options?: { status?: string; limit?: number }) {
        let conditions: any[] = [eq(schema.orders.userId, userId)];

        if (options?.status) {
            conditions.push(eq(schema.orders.status, options.status as any));
        }

        const orders = await this.db.query.orders.findMany({
            where: and(...conditions),
            orderBy: [desc(schema.orders.createdAt)],
            limit: options?.limit || 50,
        });

        const symbolIds = [...new Set(orders.map((o: any) => o.symbolId))];
        if (symbolIds.length === 0) return [];

        const symbols = await this.db.query.symbols.findMany();
        const symbolMap = new Map(symbols.map((s: any) => [s.id, s]));

        return orders.map((o: any) => ({
            ...o,
            price: o.price ? parseFloat(o.price) : null,
            avgFilledPrice: o.avgFilledPrice ? parseFloat(o.avgFilledPrice) : null,
            commission: parseFloat(o.commission),
            symbol: (symbolMap.get(o.symbolId) as any)?.symbol,
            companyName: (symbolMap.get(o.symbolId) as any)?.companyName,
        }));
    }

    // ============================================================
    // Get User's Trades
    // ============================================================
    async getTrades(userId: string, options?: { limit?: number }) {
        console.log('[getTrades] Fetching trades for user:', userId, 'limit:', options?.limit);

        const trades = await this.db.query.trades.findMany({
            where: eq(schema.trades.userId, userId),
            orderBy: [desc(schema.trades.executedAt)],
            limit: options?.limit || 100,
        });

        console.log('[getTrades] Found', trades.length, 'trades');

        const symbolIds = [...new Set(trades.map((t: any) => t.symbolId))];
        if (symbolIds.length === 0) return [];

        const symbols = await this.db.query.symbols.findMany();
        const symbolMap = new Map(symbols.map((s: any) => [s.id, s]));

        // Get ALL trades for this user to calculate running avg cost per symbol
        const allTrades = await this.db.query.trades.findMany({
            where: eq(schema.trades.userId, userId),
            orderBy: [asc(schema.trades.executedAt)],
        });

        console.log('[getTrades] Total trades for P/L calc:', allTrades.length);

        // Calculate running average cost for each symbol at each point in time
        // Using FIFO-like weighted average tracking
        const symbolCostBasis = new Map<string, { totalShares: number; totalCost: number }>();
        const tradeAvgCostMap = new Map<string, number>(); // tradeId -> avgCost at time of trade

        for (const trade of allTrades) {
            const symbolId = trade.symbolId;
            let basis = symbolCostBasis.get(symbolId) || { totalShares: 0, totalCost: 0 };
            const tradePrice = parseFloat(trade.price);

            if (trade.side === 'buy') {
                // Add to cost basis
                basis.totalShares += trade.quantity;
                basis.totalCost += trade.quantity * tradePrice;
            } else {
                // Sell - record the avg cost at time of sale
                const avgCost = basis.totalShares > 0 ? basis.totalCost / basis.totalShares : tradePrice;
                tradeAvgCostMap.set(trade.id, avgCost);
                // Reduce cost basis proportionally
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

        // Now map the trades with correct P/L
        return trades.map((t: any) => {
            const price = parseFloat(t.price);
            const total = parseFloat(t.total);
            const commission = parseFloat(t.commission);

            let realizedPL: number | null = null;
            let avgCost: number | null = null;

            if (t.side === 'sell') {
                avgCost = tradeAvgCostMap.get(t.id) || price;
                // Profit = (Sell Price - Avg Cost) * Quantity - Commission
                realizedPL = (price - avgCost) * t.quantity - commission;
            }
            // BUY trades have no realized P/L (null)

            return {
                ...t,
                price,
                total,
                commission,
                realizedPL,
                avgCost,
                symbol: (symbolMap.get(t.symbolId) as any)?.symbol,
                companyName: (symbolMap.get(t.symbolId) as any)?.companyName,
            };
        });
    }

    // Debug: Get raw trades
    async getTradesRaw(userId: string) {
        const trades = await this.db.query.trades.findMany({
            where: eq(schema.trades.userId, userId),
            orderBy: [desc(schema.trades.executedAt)],
            limit: 100,
        });
        return { count: trades.length, trades };
    }

    // ============================================================
    // Expire Old Orders (called by cron job)
    // ============================================================
    async expireOrders() {
        const now = new Date();

        const expiredOrders = await this.db.query.orders.findMany({
            where: and(
                sql`${schema.orders.status} IN ('open', 'partial')`,
                sql`${schema.orders.expiresAt} IS NOT NULL`,
                sql`${schema.orders.expiresAt} < ${now}`,
            ),
        });

        for (const order of expiredOrders) {
            await this.db.update(schema.orders)
                .set({
                    status: 'expired',
                    updatedAt: now,
                })
                .where(eq(schema.orders.id, order.id));

            // Release reserved funds for buy orders
            if (order.side === 'buy') {
                const reservedAmount = order.remainingQuantity * parseFloat(order.price);
                await this.releaseReservedCash(order.userId, order.competitionId, reservedAmount * 1.01);
            }

            // Notify user
            this.tradingGateway.sendOrderUpdate(order.userId, {
                orderId: order.id,
                status: 'expired',
                message: 'Order expired',
            });
        }

        return { expired: expiredOrders.length };
    }

    // ============================================================
    // Achievement Checking Helper
    // ============================================================
    private async checkAchievementsAfterTrade(userId: string, competitionId: string) {
        try {
            // Check trade-based achievements
            const tradeAchievements = await this.achievementsService.checkTradeAchievements({
                userId,
                competitionId,
                type: 'trade',
            });

            // Check portfolio-based achievements
            const portfolioAchievements = await this.achievementsService.checkPortfolioAchievements(
                userId,
                competitionId,
            );

            // Notify user of any new achievements
            const allAchievements = [...tradeAchievements, ...portfolioAchievements];
            for (const achievement of allAchievements) {
                this.tradingGateway.sendAchievementUnlocked(userId, achievement);
            }
        } catch (error) {
            console.error('Error checking achievements:', error);
        }
    }
}
