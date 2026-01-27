// ============================================================
// Bullish Clash - Portfolio Service
// ============================================================

import { Injectable, Inject, NotFoundException, forwardRef } from '@nestjs/common';
import { eq, and, sql } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../../database/database.module';
import * as schema from '../../database/schema';
import { PricesService } from '../prices/prices.service';
import { CompetitionService } from '../competition/competition.service';

@Injectable()
export class PortfolioService {
    constructor(
        @Inject(DATABASE_CONNECTION) private readonly db: any,
        @Inject(forwardRef(() => PricesService)) private readonly pricesService: PricesService,
        @Inject(forwardRef(() => CompetitionService)) private readonly competitionService: CompetitionService,
    ) { }

    // Get user's complete portfolio with current values
    async getPortfolio(userId: string) {
        const competition = await this.competitionService.getActiveCompetition();

        if (!competition) {
            throw new NotFoundException('No active competition');
        }

        // Get portfolio
        const portfolio = await this.db.query.portfolios.findFirst({
            where: and(
                eq(schema.portfolios.userId, userId),
                eq(schema.portfolios.competitionId, competition.id),
            ),
        });

        if (!portfolio) {
            throw new NotFoundException('Portfolio not found. Please join the competition.');
        }

        // Get holdings
        const holdings = await this.db.query.holdings.findMany({
            where: and(
                eq(schema.holdings.userId, userId),
                eq(schema.holdings.competitionId, competition.id),
            ),
        });

        // Get all latest prices
        const latestPrices = await this.pricesService.getAllLatestPrices();
        const priceMap = new Map(latestPrices.map((p: any) => [p.symbolId, p]));

        // Get symbols
        const symbols = await this.db.query.symbols.findMany();
        const symbolMap = new Map(symbols.map((s: any) => [s.id, s]));

        // Calculate positions
        const positions = holdings
            .filter((h: any) => h.quantity > 0)
            .map((h: any) => {
                const priceData = priceMap.get(h.symbolId) as any;
                const symbolData = symbolMap.get(h.symbolId) as any;
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

        // Calculate totals
        const cash = parseFloat(portfolio.cash);
        const investedValue = positions.reduce((sum: number, p: any) => sum + p.marketValue, 0);
        const totalValue = cash + investedValue;
        const unrealizedPL = positions.reduce((sum: number, p: any) => sum + p.unrealizedPL, 0);
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

    // Get just the holdings (positions)
    async getHoldings(userId: string) {
        const portfolio = await this.getPortfolio(userId);
        return portfolio.positions;
    }

    // Get portfolio summary (quick overview)
    async getPortfolioSummary(userId: string) {
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

    // Calculate portfolio value for a user (used by leaderboard)
    async calculatePortfolioValue(userId: string, competitionId: string): Promise<number> {
        const portfolio = await this.db.query.portfolios.findFirst({
            where: and(
                eq(schema.portfolios.userId, userId),
                eq(schema.portfolios.competitionId, competitionId),
            ),
        });

        if (!portfolio) return 0;

        const holdings = await this.db.query.holdings.findMany({
            where: and(
                eq(schema.holdings.userId, userId),
                eq(schema.holdings.competitionId, competitionId),
            ),
        });

        const latestPrices = await this.pricesService.getAllLatestPrices();
        const priceMap = new Map(latestPrices.map((p: any) => [p.symbolId, p.price]));

        const investedValue = holdings.reduce((sum: number, h: any) => {
            const price = priceMap.get(h.symbolId) || parseFloat(h.avgPrice);
            return sum + (h.quantity * (price as number));
        }, 0);

        return parseFloat(portfolio.cash) + investedValue;
    }
}
