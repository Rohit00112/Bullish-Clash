import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { eq, and, desc } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';
import { DATABASE_CONNECTION } from '../../database/database.module';
import * as schema from '../../database/schema';
import { PlaceBidDto } from './bidding.dto';
import { CompetitionService } from '../competition/competition.service';

@Injectable()
export class BiddingService {
    constructor(
        @Inject(DATABASE_CONNECTION) private readonly db: any,
        private readonly competitionService: CompetitionService,
    ) { }

    async placeBid(userId: string, dto: PlaceBidDto) {
        // 1. Get active competition
        const competition = await this.competitionService.getActiveCompetition();
        if (!competition) {
            throw new NotFoundException('No active competition found');
        }

        // 2. Verify competition is in BIDDING phase
        if (competition.status !== 'bidding') {
            throw new BadRequestException(`Bidding is not active (Status: ${competition.status})`);
        }

        // 3. Verify symbol exists
        const symbol = await this.db.query.symbols.findFirst({
            where: eq(schema.symbols.id, dto.symbolId),
        });

        if (!symbol) {
            throw new NotFoundException('Symbol not found');
        }

        // 4. Check user balance (Total Cost = Price * Quantity)
        const totalCost = dto.price * dto.quantity;

        const portfolio = await this.db.query.portfolios.findFirst({
            where: and(
                eq(schema.portfolios.userId, userId),
                eq(schema.portfolios.competitionId, competition.id),
            ),
        });

        if (!portfolio) {
            throw new BadRequestException('You need to join the competition first');
        }

        if (Number(portfolio.cash) < totalCost) {
            throw new BadRequestException('Insufficient cash balance');
        }

        // 5. Place Bid (Transaction)
        // Note: For simplicity, we deduct cash immediately (escrow)
        // If bid is rejected/partial, we refund.

        await this.db.transaction(async (tx: any) => {
            // Deduct cash
            await tx.update(schema.portfolios)
                .set({
                    cash: (Number(portfolio.cash) - totalCost).toString(),
                    updatedAt: new Date(),
                })
                .where(eq(schema.portfolios.id, portfolio.id));

            // Create Ledger Entry for frozen cash
            await tx.insert(schema.ledgerEntries).values({
                userId,
                competitionId: competition.id,
                type: 'bid_freeze',
                amount: (-totalCost).toString(),
                balanceAfter: (Number(portfolio.cash) - totalCost).toString(),
                description: `Bid placed for ${dto.quantity} ${symbol.symbol} @ ${dto.price}`,
            });

            // Create Bid
            await tx.insert(schema.bids).values({
                userId,
                competitionId: competition.id,
                symbolId: dto.symbolId,
                quantity: dto.quantity,
                price: dto.price.toString(),
                status: 'pending',
            });
        });

        return { success: true, message: 'Bid placed successfully' };
    }

    async getMyBids(userId: string) {
        const competition = await this.competitionService.getActiveCompetition();
        if (!competition) {
            return [];
        }

        const bids = await this.db.query.bids.findMany({
            where: and(
                eq(schema.bids.userId, userId),
                eq(schema.bids.competitionId, competition.id),
            ),

            orderBy: [desc(schema.bids.createdAt)],
        });

        // Manual join if relation not set (Drizzle relations need definition)
        // Assuming we fix relations or fetch symbols manually.
        // Let's manually map for safety now as I haven't checked relations.ts
        const bidData = await Promise.all(bids.map(async (bid: any) => {
            const sym = await this.db.query.symbols.findFirst({
                where: eq(schema.symbols.id, bid.symbolId),
            });
            return {
                ...bid,
                symbolSymbol: sym?.symbol,
                price: parseFloat(bid.price),
                total: parseFloat(bid.price) * bid.quantity,
            };
        }));

        return bidData;
    }

    // Admin: Allocate Bids (Simple Logic: Full Allocation for now, or Random)
    async processBids(competitionId: string) {
        //Logic:
        // 1. Get all pending bids
        // 2. Convert to positions (Holdings)
        // 3. Mark bids as 'processed'
        // 4. Refund if necessary (not implementing complex IPO matching yet)

        const bids = await this.db.query.bids.findMany({
            where: and(
                eq(schema.bids.competitionId, competitionId),
                eq(schema.bids.status, 'pending'),
            ),
        });

        if (bids.length === 0) {
            return { message: 'No pending bids to process' };
        }

        await this.db.transaction(async (tx: any) => {
            for (const bid of bids) {
                // Check if holding exists
                const existingHolding = await tx.query.holdings.findFirst({
                    where: and(
                        eq(schema.holdings.userId, bid.userId),
                        eq(schema.holdings.competitionId, bid.competitionId),
                        eq(schema.holdings.symbolId, bid.symbolId),
                    ),
                });

                const totalCost = Number(bid.price) * bid.quantity;

                if (existingHolding) {
                    // Average Price Calculation
                    const currentQty = existingHolding.quantity;
                    const currentCost = Number(existingHolding.totalCost);
                    const newQty = currentQty + bid.quantity;
                    const newCost = currentCost + totalCost;
                    const newAvg = newCost / newQty;

                    await tx.update(schema.holdings)
                        .set({
                            quantity: newQty,
                            totalCost: newCost.toString(),
                            avgPrice: newAvg.toString(),
                            updatedAt: new Date(),
                        })
                        .where(eq(schema.holdings.id, existingHolding.id));
                } else {
                    await tx.insert(schema.holdings).values({
                        userId: bid.userId,
                        competitionId: bid.competitionId,
                        symbolId: bid.symbolId,
                        quantity: bid.quantity,
                        avgPrice: bid.price,
                        totalCost: totalCost.toString(),
                    });
                }

                // Mark bid processed
                await tx.update(schema.bids)
                    .set({
                        status: 'processed',
                        allocatedQuantity: bid.quantity, // Full allocation
                        updatedAt: new Date(),
                    })
                    .where(eq(schema.bids.id, bid.id));
            }
        });

        return { success: true, count: bids.length, message: 'Bids processed and allocated' };
    }
}
