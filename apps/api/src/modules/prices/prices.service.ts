// ============================================================
// Bullish Battle - Prices Service (Price Engine)
// ============================================================

import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { eq, desc, and, gte, lte } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';
import { DATABASE_CONNECTION } from '../../database/database.module';
import { REDIS_CLIENT } from '../redis/redis.module';
import * as schema from '../../database/schema';
import { TradingGateway } from '../websocket/trading.gateway';
import Redis from 'ioredis';

export interface PriceUpdate {
    symbolId: string;
    priceUpdateType: 'percentage' | 'absolute' | 'override';
    magnitude: number;
    eventId?: string;
}

export interface TradeImpact {
    symbolId: string;
    side: 'buy' | 'sell';
    quantity: number;
    tradeValue: number;
    executionPrice?: number; // If provided, market price moves towards this
}

@Injectable()
export class PricesService {
    constructor(
        @Inject(DATABASE_CONNECTION) private readonly db: any,
        @Inject(REDIS_CLIENT) private readonly redis: Redis,
        @Inject(forwardRef(() => TradingGateway)) private readonly tradingGateway: TradingGateway,
    ) { }

    // Get all latest prices with symbol info
    async getAllLatestPrices() {
        const prices = await this.db.query.latestPrices.findMany({
            with: {
                // We need to join manually
            },
        });

        // Get all symbols
        const symbols = await this.db.query.symbols.findMany({
            where: eq(schema.symbols.isActive, true),
        });

        const symbolMap = new Map(symbols.map((s: any) => [s.id, s]));

        return prices.map((p: any) => {
            const sym = symbolMap.get(p.symbolId) as any;
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
        }).filter((p: any) => p.symbol); // Only return prices for active symbols
    }

    // Get latest price for a single symbol
    async getLatestPrice(symbolId: string) {
        // Try cache first
        const cached = await this.redis.get(`price:${symbolId}`);
        if (cached) {
            return JSON.parse(cached);
        }

        const price = await this.db.query.latestPrices.findFirst({
            where: eq(schema.latestPrices.symbolId, symbolId),
        });

        if (price) {
            // Cache for 5 seconds
            await this.redis.setex(`price:${symbolId}`, 5, JSON.stringify(price));
        }

        return price;
    }

    // Get price history for a symbol
    async getPriceHistory(symbolId: string, options?: { from?: Date; to?: Date; limit?: number }) {
        let conditions: any[] = [eq(schema.priceTicks.symbolId, symbolId)];

        if (options?.from) {
            conditions.push(gte(schema.priceTicks.timestamp, options.from));
        }

        if (options?.to) {
            conditions.push(lte(schema.priceTicks.timestamp, options.to));
        }

        const ticks = await this.db.query.priceTicks.findMany({
            where: and(...conditions),
            orderBy: [desc(schema.priceTicks.timestamp)],
            limit: options?.limit || 100,
        });

        return ticks.reverse(); // Return in chronological order
    }

    // Get OHLCV candles
    async getCandles(symbolId: string, interval = '1m', limit = 100) {
        const candles = await this.db.query.priceCandles.findMany({
            where: and(
                eq(schema.priceCandles.symbolId, symbolId),
                eq(schema.priceCandles.interval, interval),
            ),
            orderBy: [desc(schema.priceCandles.timestamp)],
            limit,
        });

        return candles.reverse().map((c: any) => ({
            timestamp: c.timestamp,
            open: parseFloat(c.open),
            high: parseFloat(c.high),
            low: parseFloat(c.low),
            close: parseFloat(c.close),
            volume: c.volume,
        }));
    }

    // Update price (used by admin events)
    async updatePrice(update: PriceUpdate): Promise<any> {
        const latestPrice = await this.db.query.latestPrices.findFirst({
            where: eq(schema.latestPrices.symbolId, update.symbolId),
        });

        if (!latestPrice) {
            throw new Error(`No price record found for symbol ${update.symbolId}`);
        }

        const currentPrice = parseFloat(latestPrice.price);
        let newPrice: number;

        // Calculate new price based on update type
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

        // Ensure price is valid
        if (newPrice <= 0) {
            newPrice = 0.01; // Minimum price
        }

        // Round to 2 decimal places
        newPrice = Math.round(newPrice * 100) / 100;

        const change = newPrice - parseFloat(latestPrice.previousClose);
        const changePercent = (change / parseFloat(latestPrice.previousClose)) * 100;

        // Update latest price
        const [updated] = await this.db.update(schema.latestPrices)
            .set({
                price: newPrice.toString(),
                high: Math.max(parseFloat(latestPrice.high), newPrice).toString(),
                low: Math.min(parseFloat(latestPrice.low), newPrice).toString(),
                change: change.toString(),
                changePercent: changePercent.toString(),
                updatedAt: new Date(),
            })
            .where(eq(schema.latestPrices.symbolId, update.symbolId))
            .returning();

        // Record price tick
        await this.db.insert(schema.priceTicks).values({
            symbolId: update.symbolId,
            price: newPrice.toString(),
            previousPrice: currentPrice.toString(),
            change: (newPrice - currentPrice).toString(),
            changePercent: ((newPrice - currentPrice) / currentPrice * 100).toString(),
            volume: 0,
            eventId: update.eventId,
        });

        // Get symbol info
        const symbol = await this.db.query.symbols.findFirst({
            where: eq(schema.symbols.id, update.symbolId),
        });

        // Clear cache
        await this.redis.del(`price:${update.symbolId}`);

        // Broadcast price update via WebSocket
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

    // Batch update prices (for market-wide events)
    async batchUpdatePrices(updates: PriceUpdate[]): Promise<any[]> {
        const results = [];

        for (const update of updates) {
            try {
                const result = await this.updatePrice(update);
                results.push(result);
            } catch (error) {
                console.error(`Failed to update price for ${update.symbolId}:`, error);
                results.push({
                    symbolId: update.symbolId,
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }

        return results;
    }

    // Reset day's prices (for new trading day)
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
                .where(eq(schema.latestPrices.id, lp.id));
        }

        // Clear all price caches
        const keys = await this.redis.keys('price:*');
        if (keys.length > 0) {
            await this.redis.del(...keys);
        }

        return { success: true, symbolsReset: latestPrices.length };
    }

    /**
     * Apply market impact from trading activity
     * Formula: New Stock Price = Current Price × (1 + %Change/100)
     * 
     * Impact calculation:
     * - Buy pressure increases price
     * - Sell pressure decreases price
     * - Impact is proportional to trade value
     * 
     * More aggressive impact for visible price changes in simulation
     */
    async applyTradeImpact(impact: TradeImpact): Promise<any> {
        const latestPrice = await this.db.query.latestPrices.findFirst({
            where: eq(schema.latestPrices.symbolId, impact.symbolId),
        });

        if (!latestPrice) {
            console.log(`[TradeImpact] No price record for symbol ${impact.symbolId}`);
            return null;
        }

        const currentPrice = parseFloat(latestPrice.price);
        const currentVolume = latestPrice.volume || 0;

        // Market price = Last Traded Price (LTP)
        // The price of the most recent trade becomes the market price
        let finalPrice: number;

        if (impact.executionPrice) {
            // Set market price directly to the last traded price
            finalPrice = impact.executionPrice;
        } else {
            // Fallback: Calculate impact based on trade value (for market orders without specific price)
            const baseImpactPerUnit = 0.5; // 0.5% per 10,000 NPR
            const tradeUnit = 10000;
            const maxImpactPercent = 5;

            let impactPercent = Math.min(
                (impact.tradeValue / tradeUnit) * baseImpactPerUnit,
                maxImpactPercent
            );

            if (impact.side === 'sell') {
                impactPercent = -impactPercent;
            }

            finalPrice = currentPrice * (1 + impactPercent / 100);
        }

        // Round to 2 decimal places
        finalPrice = Math.max(Math.round(finalPrice * 100) / 100, 0.01);

        const change = finalPrice - parseFloat(latestPrice.previousClose);
        const changePercent = (change / parseFloat(latestPrice.previousClose)) * 100;
        const priceChange = finalPrice - currentPrice;
        const priceChangePercent = currentPrice > 0 ? (priceChange / currentPrice) * 100 : 0;

        // Update volume
        const newVolume = currentVolume + impact.quantity;

        console.log(`[TradeImpact] ${impact.side.toUpperCase()} - Symbol: ${impact.symbolId}, LTP: ${finalPrice}, Prev: ${currentPrice} (${priceChangePercent >= 0 ? '+' : ''}${priceChangePercent.toFixed(2)}%)`);

        // Update latest price
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
            .where(eq(schema.latestPrices.symbolId, impact.symbolId));

        // Record price tick
        await this.db.insert(schema.priceTicks).values({
            symbolId: impact.symbolId,
            price: finalPrice.toString(),
            previousPrice: currentPrice.toString(),
            change: priceChange.toString(),
            changePercent: priceChangePercent.toString(),
            volume: impact.quantity,
        });

        // Get symbol info
        const symbol = await this.db.query.symbols.findFirst({
            where: eq(schema.symbols.id, impact.symbolId),
        });

        // Clear cache
        await this.redis.del(`price:${impact.symbolId}`);

        // Broadcast price update via WebSocket
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
}
