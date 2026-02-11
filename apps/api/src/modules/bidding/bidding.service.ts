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

    // Get all biddable symbols with their floor prices
    async getBiddableSymbols() {
        const competition = await this.competitionService.getActiveCompetition();

        if (!competition || competition.status !== 'bidding') {
            return [];
        }

        const symbols = await this.db.query.symbols.findMany({
            where: eq(schema.symbols.isActive, true),
            orderBy: [schema.symbols.symbol],
        });

        return symbols.map((s: any) => ({
            id: s.id,
            symbol: s.symbol,
            companyName: s.companyName,
            sector: s.sector,
            basePrice: parseFloat(s.basePrice),
            floorPrice: s.floorPrice ? parseFloat(s.floorPrice) : parseFloat(s.basePrice),
            listedShares: s.listedShares,
            logoUrl: s.logoUrl,
        }));
    }

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

        // 3. Enforce bidding hours
        const now = new Date();
        const nepaliTime = now.toLocaleTimeString('en-US', {
            timeZone: 'Asia/Kathmandu',
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
        });
        const [curH, curM] = nepaliTime.split(':').map(Number);
        const currentMinutes = curH * 60 + curM;

        const biddingStart = competition.biddingHoursStart || '09:00';
        const biddingEnd = competition.biddingHoursEnd || '11:00';
        const [startH, startM] = biddingStart.split(':').map(Number);
        const [endH, endM] = biddingEnd.split(':').map(Number);
        const startMinutes = startH * 60 + startM;
        const endMinutes = endH * 60 + endM;

        if (currentMinutes < startMinutes || currentMinutes >= endMinutes) {
            throw new BadRequestException(
                `Bidding is only allowed between ${biddingStart} - ${biddingEnd} Nepal time. Current time: ${nepaliTime}`
            );
        }

        // 4. Verify symbol exists
        const symbol = await this.db.query.symbols.findFirst({
            where: eq(schema.symbols.id, dto.symbolId),
        });

        if (!symbol) {
            throw new NotFoundException('Symbol not found');
        }

        // 5. Validate bid price against floor price
        // Participants CANNOT bid below floor price, but CAN bid higher
        const floorPrice = symbol.floorPrice ? Number(symbol.floorPrice) : Number(symbol.basePrice);
        if (dto.price < floorPrice) {
            throw new BadRequestException(
                `Bid price cannot be below floor price of रू${floorPrice.toFixed(2)}. You can bid at or above this price.`
            );
        }

        // 6. Check user balance (Total Cost = Price * Quantity)
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

        // 7. Place Bid (Transaction)
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
            const floorPrice = sym?.floorPrice ? parseFloat(sym.floorPrice) : parseFloat(sym?.basePrice || '0');
            return {
                ...bid,
                symbolSymbol: sym?.symbol,
                price: parseFloat(bid.price),
                total: parseFloat(bid.price) * bid.quantity,
                floorPrice: floorPrice,
                companyName: sym?.companyName,
            };
        }));

        return bidData;
    }

    // Admin: Allocate Bids with PRICE PRIORITY
    // Higher price bids get filled first until supply runs out
    async processBids(competitionId: string) {
        // 1. Get all pending bids sorted by price (highest first), then by time (earliest first)
        const bids = await this.db.query.bids.findMany({
            where: and(
                eq(schema.bids.competitionId, competitionId),
                eq(schema.bids.status, 'pending'),
            ),
            orderBy: [desc(schema.bids.price), schema.bids.createdAt],
        });

        if (bids.length === 0) {
            return { message: 'No pending bids to process', allocated: 0, rejected: 0 };
        }

        // 2. Group bids by symbol and track available supply
        const symbolSupply = new Map<string, number>();
        const symbolIds = [...new Set(bids.map((b: any) => b.symbolId))];

        for (const symbolId of symbolIds as string[]) {
            const symbol = await this.db.query.symbols.findFirst({
                where: eq(schema.symbols.id, symbolId),
            });

            // Get current holdings for this symbol in this competition
            const holdings = await this.db.select({
                totalQty: schema.holdings.quantity,
            })
                .from(schema.holdings)
                .where(and(
                    eq(schema.holdings.competitionId, competitionId),
                    eq(schema.holdings.symbolId, symbolId),
                ));

            const heldQty = holdings.reduce((sum: number, h: any) => sum + h.totalQty, 0);
            const availableQty = (symbol?.listedShares || 0) - heldQty;
            symbolSupply.set(symbolId as string, Math.max(0, availableQty));
        }

        let allocatedCount = 0;
        let rejectedCount = 0;
        let partialCount = 0;

        await this.db.transaction(async (tx: any) => {
            for (const bid of bids) {
                const available = symbolSupply.get(bid.symbolId) || 0;

                if (available <= 0) {
                    // No shares available - REJECT bid and refund
                    const refundAmount = Number(bid.price) * bid.quantity;

                    // Refund cash to portfolio
                    const portfolio = await tx.query.portfolios.findFirst({
                        where: and(
                            eq(schema.portfolios.userId, bid.userId),
                            eq(schema.portfolios.competitionId, bid.competitionId),
                        ),
                    });

                    if (portfolio) {
                        await tx.update(schema.portfolios)
                            .set({
                                cash: (Number(portfolio.cash) + refundAmount).toString(),
                                updatedAt: new Date(),
                            })
                            .where(eq(schema.portfolios.id, portfolio.id));

                        // Create refund ledger entry
                        await tx.insert(schema.ledgerEntries).values({
                            userId: bid.userId,
                            competitionId: bid.competitionId,
                            type: 'bid_refund',
                            amount: refundAmount.toString(),
                            balanceAfter: (Number(portfolio.cash) + refundAmount).toString(),
                            description: `Bid rejected - no shares available`,
                        });
                    }

                    // Mark bid as rejected
                    await tx.update(schema.bids)
                        .set({
                            status: 'rejected',
                            allocatedQuantity: 0,
                            updatedAt: new Date(),
                        })
                        .where(eq(schema.bids.id, bid.id));

                    rejectedCount++;
                    continue;
                }

                // Get the symbol's base price for reference
                const bidSymbol = await tx.query.symbols.findFirst({
                    where: eq(schema.symbols.id, bid.symbolId),
                });
                const bidPrice = Number(bid.price);

                // Calculate allocation (full or partial)
                const allocatedQty = Math.min(bid.quantity, available);
                const isPartial = allocatedQty < bid.quantity;
                // Shares are allocated at BID PRICE (what the user actually paid)
                const allocatedCost = bidPrice * allocatedQty;
                const refundQty = bid.quantity - allocatedQty;

                // Refund only for unallocated shares (partial fill)
                const refundForUnallocated = bidPrice * refundQty;

                // Update available supply
                symbolSupply.set(bid.symbolId, available - allocatedQty);

                // Create/Update holding at BID PRICE (actual cost paid)
                const existingHolding = await tx.query.holdings.findFirst({
                    where: and(
                        eq(schema.holdings.userId, bid.userId),
                        eq(schema.holdings.competitionId, bid.competitionId),
                        eq(schema.holdings.symbolId, bid.symbolId),
                    ),
                });

                if (existingHolding) {
                    const currentQty = existingHolding.quantity;
                    const currentCost = Number(existingHolding.totalCost);
                    const newQty = currentQty + allocatedQty;
                    const newCost = currentCost + allocatedCost;
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
                        quantity: allocatedQty,
                        avgPrice: bidPrice.toString(),
                        totalCost: allocatedCost.toString(),
                    });
                }

                // Refund only for unallocated shares (partial fill)
                if (refundForUnallocated > 0) {
                    const portfolio = await tx.query.portfolios.findFirst({
                        where: and(
                            eq(schema.portfolios.userId, bid.userId),
                            eq(schema.portfolios.competitionId, bid.competitionId),
                        ),
                    });

                    if (portfolio) {
                        await tx.update(schema.portfolios)
                            .set({
                                cash: (Number(portfolio.cash) + refundForUnallocated).toString(),
                                updatedAt: new Date(),
                            })
                            .where(eq(schema.portfolios.id, portfolio.id));

                        await tx.insert(schema.ledgerEntries).values({
                            userId: bid.userId,
                            competitionId: bid.competitionId,
                            type: 'bid_partial_refund',
                            amount: refundForUnallocated.toString(),
                            balanceAfter: (Number(portfolio.cash) + refundForUnallocated).toString(),
                            description: `Partial allocation - ${allocatedQty}/${bid.quantity} shares at bid price रू${bidPrice.toFixed(2)}, unallocated refunded`,
                        });
                    }
                    partialCount++;
                } else if (isPartial) {
                    partialCount++;
                }

                // Mark bid as processed
                await tx.update(schema.bids)
                    .set({
                        status: 'processed',
                        allocatedQuantity: allocatedQty,
                        updatedAt: new Date(),
                    })
                    .where(eq(schema.bids.id, bid.id));

                // Record as a Trade at BID PRICE (actual cost paid)
                await tx.insert(schema.trades).values({
                    userId: bid.userId,
                    competitionId: bid.competitionId,
                    symbolId: bid.symbolId,
                    side: 'buy',
                    quantity: allocatedQty,
                    price: bidPrice.toString(),
                    total: allocatedCost.toString(),
                    commission: '0',
                    executedAt: new Date(),
                });

                allocatedCount++;
            }

            // Mark all symbols that received bids as tradeable (went through bidding)
            for (const symbolId of symbolIds as string[]) {
                await tx.update(schema.symbols)
                    .set({
                        wentThroughBidding: true,
                        isTradeable: true,
                        updatedAt: new Date(),
                    })
                    .where(eq(schema.symbols.id, symbolId));
            }
        });

        return {
            success: true,
            message: `Bids processed: ${allocatedCount} allocated, ${partialCount} partial, ${rejectedCount} rejected`,
            allocated: allocatedCount,
            partial: partialCount,
            rejected: rejectedCount,
        };
    }
}
