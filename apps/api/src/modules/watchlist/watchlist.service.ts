// ============================================================
// Bullish Clash - Watchlist Service
// ============================================================

import { Injectable, Inject, BadRequestException, forwardRef } from '@nestjs/common';
import { eq, and, desc } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../../database/database.module';
import * as schema from '../../database/schema';
import { PricesService } from '../prices/prices.service';

@Injectable()
export class WatchlistService {
    constructor(
        @Inject(DATABASE_CONNECTION) private readonly db: any,
        @Inject(forwardRef(() => PricesService)) private readonly pricesService: PricesService,
    ) { }

    // Get user's watchlist with current prices
    async getWatchlist(userId: string) {
        const watchlistItems = await this.db.query.watchlist.findMany({
            where: eq(schema.watchlist.userId, userId),
            orderBy: [desc(schema.watchlist.createdAt)],
        });

        if (watchlistItems.length === 0) {
            return [];
        }

        // Get symbols
        const symbolIds = watchlistItems.map((w: any) => w.symbolId);
        const symbols = await this.db.query.symbols.findMany();
        const symbolMap = new Map(symbols.map((s: any) => [s.id, s]));

        // Get latest prices
        const latestPrices = await this.pricesService.getAllLatestPrices();
        const priceMap = new Map(latestPrices.map((p: any) => [p.symbolId, p]));

        return watchlistItems.map((item: any) => {
            const symbol = symbolMap.get(item.symbolId) as any;
            const priceData = priceMap.get(item.symbolId) as any;

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

    // Add symbol to watchlist
    async addToWatchlist(userId: string, symbolId: string) {
        // Check if symbol exists
        const symbol = await this.db.query.symbols.findFirst({
            where: eq(schema.symbols.id, symbolId),
        });

        if (!symbol) {
            throw new BadRequestException('Symbol not found');
        }

        // Check if already in watchlist
        const existing = await this.db.query.watchlist.findFirst({
            where: and(
                eq(schema.watchlist.userId, userId),
                eq(schema.watchlist.symbolId, symbolId),
            ),
        });

        if (existing) {
            throw new BadRequestException('Symbol already in watchlist');
        }

        // Check watchlist limit (max 50 symbols)
        const count = await this.db.query.watchlist.findMany({
            where: eq(schema.watchlist.userId, userId),
        });

        if (count.length >= 50) {
            throw new BadRequestException('Watchlist limit reached (maximum 50 symbols)');
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

    // Remove symbol from watchlist
    async removeFromWatchlist(userId: string, symbolId: string) {
        const existing = await this.db.query.watchlist.findFirst({
            where: and(
                eq(schema.watchlist.userId, userId),
                eq(schema.watchlist.symbolId, symbolId),
            ),
        });

        if (!existing) {
            throw new BadRequestException('Symbol not in watchlist');
        }

        await this.db.delete(schema.watchlist).where(
            eq(schema.watchlist.id, existing.id),
        );

        return {
            success: true,
            message: 'Symbol removed from watchlist',
        };
    }

    // Check if symbol is in user's watchlist
    async isInWatchlist(userId: string, symbolId: string): Promise<boolean> {
        const existing = await this.db.query.watchlist.findFirst({
            where: and(
                eq(schema.watchlist.userId, userId),
                eq(schema.watchlist.symbolId, symbolId),
            ),
        });

        return !!existing;
    }
}
