// ============================================================
// Bullish Clash - Competition Service
// ============================================================

import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { eq, and, or, desc } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';
import { DATABASE_CONNECTION } from '../../database/database.module';
import * as schema from '../../database/schema';
import { CreateCompetitionDto, UpdateCompetitionDto } from './competition.dto';

@Injectable()
export class CompetitionService {
    constructor(
        @Inject(DATABASE_CONNECTION) private readonly db: any,
    ) { }

    // Get active competition (default or latest active)
    async getActiveCompetition() {
        // Try to find the default competition first
        let competition = await this.db.query.competitions.findFirst({
            where: eq(schema.competitions.isDefault, true),
        });

        if (!competition) {
            // Find any active competition
            competition = await this.db.query.competitions.findFirst({
                where: or(
                    eq(schema.competitions.status, 'active'),
                    eq(schema.competitions.status, 'scheduled'),
                    eq(schema.competitions.status, 'bidding'),
                ),
                orderBy: [desc(schema.competitions.startTime)],
            });
        }

        return competition;
    }

    // Get competition by ID
    async getCompetition(id: string) {
        const competition = await this.db.query.competitions.findFirst({
            where: eq(schema.competitions.id, id),
        });

        if (!competition) {
            throw new NotFoundException('Competition not found');
        }

        // Get participant count
        const participants = await this.db.query.competitionParticipants.findMany({
            where: and(
                eq(schema.competitionParticipants.competitionId, id),
                eq(schema.competitionParticipants.isActive, true),
            ),
        });

        return {
            ...competition,
            participantCount: participants.length,
            startingCash: parseFloat(competition.startingCash),
            commissionRate: parseFloat(competition.commissionRate),
            maxPositionSize: competition.maxPositionSize ? parseFloat(competition.maxPositionSize) : null,
        };
    }

    // Get all competitions
    async getAllCompetitions() {
        const competitions = await this.db.query.competitions.findMany({
            orderBy: [desc(schema.competitions.createdAt)],
        });

        return competitions.map((c: any) => ({
            ...c,
            startingCash: parseFloat(c.startingCash),
            commissionRate: parseFloat(c.commissionRate),
            maxPositionSize: c.maxPositionSize ? parseFloat(c.maxPositionSize) : null,
        }));
    }

    // Create new competition
    async createCompetition(dto: CreateCompetitionDto) {
        const competitionId = uuid();

        const [competition] = await this.db.insert(schema.competitions).values({
            id: competitionId,
            name: dto.name,
            description: dto.description,
            status: 'draft',
            startingCash: dto.startingCash.toString(),
            commissionRate: dto.commissionRate.toString(),
            maxPositionSize: dto.maxPositionSize?.toString(),
            maxDailyTrades: dto.maxDailyTrades,
            allowShortSelling: dto.allowShortSelling ?? false,
            allowMargin: dto.allowMargin ?? false,
            startTime: new Date(dto.startTime),
            endTime: new Date(dto.endTime),
            tradingHoursStart: dto.tradingHoursStart ?? '11:00',
            tradingHoursEnd: dto.tradingHoursEnd ?? '15:00',
            biddingHoursStart: dto.biddingHoursStart ?? '09:00',
            biddingHoursEnd: dto.biddingHoursEnd ?? '11:00',
            isDefault: dto.isDefault ?? false,
        }).returning();

        return {
            ...competition,
            startingCash: parseFloat(competition.startingCash),
            commissionRate: parseFloat(competition.commissionRate),
        };
    }

    // Update competition
    async updateCompetition(id: string, dto: UpdateCompetitionDto) {
        await this.getCompetition(id); // Verify exists

        const updateData: any = { updatedAt: new Date() };

        if (dto.name) updateData.name = dto.name;
        if (dto.description !== undefined) updateData.description = dto.description;
        if (dto.status) updateData.status = dto.status;
        if (dto.startingCash) updateData.startingCash = dto.startingCash.toString();
        if (dto.commissionRate !== undefined) updateData.commissionRate = dto.commissionRate.toString();
        if (dto.maxPositionSize !== undefined) updateData.maxPositionSize = dto.maxPositionSize?.toString();
        if (dto.maxDailyTrades !== undefined) updateData.maxDailyTrades = dto.maxDailyTrades;
        if (dto.allowShortSelling !== undefined) updateData.allowShortSelling = dto.allowShortSelling;
        if (dto.allowMargin !== undefined) updateData.allowMargin = dto.allowMargin;
        if (dto.startTime) updateData.startTime = new Date(dto.startTime);
        if (dto.endTime) updateData.endTime = new Date(dto.endTime);
        if (dto.tradingHoursStart !== undefined) updateData.tradingHoursStart = dto.tradingHoursStart;
        if (dto.tradingHoursEnd !== undefined) updateData.tradingHoursEnd = dto.tradingHoursEnd;
        if (dto.biddingHoursStart !== undefined) updateData.biddingHoursStart = dto.biddingHoursStart;
        if (dto.biddingHoursEnd !== undefined) updateData.biddingHoursEnd = dto.biddingHoursEnd;
        if (dto.isDefault !== undefined) updateData.isDefault = dto.isDefault;

        const [updated] = await this.db.update(schema.competitions)
            .set(updateData)
            .where(eq(schema.competitions.id, id))
            .returning();

        return {
            ...updated,
            startingCash: parseFloat(updated.startingCash),
            commissionRate: parseFloat(updated.commissionRate),
        };
    }

    // Update competition status
    async updateStatus(id: string, status: 'draft' | 'scheduled' | 'active' | 'paused' | 'ended') {
        const competition = await this.getCompetition(id);

        // Validate status transitions
        const validTransitions: Record<string, string[]> = {
            draft: ['scheduled', 'bidding', 'active'],
            scheduled: ['bidding', 'active', 'draft'],
            bidding: ['active', 'paused', 'ended'],
            active: ['paused', 'remarks', 'ended'],
            paused: ['active', 'ended'],
            remarks: ['ended'],
            ended: [],
        };

        if (!validTransitions[competition.status]?.includes(status)) {
            throw new BadRequestException(
                `Cannot transition from ${competition.status} to ${status}`
            );
        }

        return this.updateCompetition(id, { status });
    }

    // Join competition
    async joinCompetition(userId: string, competitionId: string) {
        const competition = await this.getCompetition(competitionId);

        // Check if already joined
        const existing = await this.db.query.competitionParticipants.findFirst({
            where: and(
                eq(schema.competitionParticipants.userId, userId),
                eq(schema.competitionParticipants.competitionId, competitionId),
            ),
        });

        if (existing) {
            if (existing.isActive) {
                throw new BadRequestException('Already joined this competition');
            }

            // Reactivate participation
            await this.db.update(schema.competitionParticipants)
                .set({ isActive: true })
                .where(eq(schema.competitionParticipants.id, existing.id));
        } else {
            // Create participant entry
            await this.db.insert(schema.competitionParticipants).values({
                competitionId,
                userId,
                isActive: true,
            });
        }

        // Initialize portfolio if not exists
        const portfolio = await this.db.query.portfolios.findFirst({
            where: and(
                eq(schema.portfolios.userId, userId),
                eq(schema.portfolios.competitionId, competitionId),
            ),
        });

        if (!portfolio) {
            await this.db.insert(schema.portfolios).values({
                userId,
                competitionId,
                cash: competition.startingCash.toString(),
                realizedPL: '0',
                tradeCount: 0,
            });

            // Create initial ledger entry
            await this.db.insert(schema.ledgerEntries).values({
                userId,
                competitionId,
                type: 'initial',
                amount: competition.startingCash.toString(),
                balanceAfter: competition.startingCash.toString(),
                description: 'Initial competition balance',
            });
        }

        return { success: true, message: 'Successfully joined competition' };
    }

    // Get competition stats
    async getCompetitionStats(competitionId: string) {
        const competition = await this.getCompetition(competitionId);

        // Get participant count
        const participants = await this.db.query.competitionParticipants.findMany({
            where: and(
                eq(schema.competitionParticipants.competitionId, competitionId),
                eq(schema.competitionParticipants.isActive, true),
            ),
        });

        // Get total trades
        const trades = await this.db.query.trades.findMany({
            where: eq(schema.trades.competitionId, competitionId),
        });

        // Calculate total volume
        const totalVolume = trades.reduce((sum: number, t: any) => sum + parseFloat(t.total), 0);

        // Calculate remaining time
        const now = new Date();
        const endTime = new Date(competition.endTime);
        const remainingMs = Math.max(0, endTime.getTime() - now.getTime());

        return {
            competitionId,
            name: competition.name,
            status: competition.status,
            participantCount: participants.length,
            totalTrades: trades.length,
            totalVolume,
            startTime: competition.startTime,
            endTime: competition.endTime,
            tradingHoursStart: competition.tradingHoursStart || '11:00',
            tradingHoursEnd: competition.tradingHoursEnd || '15:00',
            biddingHoursStart: competition.biddingHoursStart || '09:00',
            biddingHoursEnd: competition.biddingHoursEnd || '11:00',
            remainingTimeMs: remainingMs,
            remainingTimeFormatted: this.formatRemainingTime(remainingMs),
        };
    }

    // Reset competition - clears all trades and portfolios
    async resetCompetition(competitionId: string) {
        const competition = await this.getCompetition(competitionId);

        // Delete all trades for this competition
        await this.db.delete(schema.trades)
            .where(eq(schema.trades.competitionId, competitionId));

        // Delete all holdings (positions) for this competition
        await this.db.delete(schema.holdings)
            .where(eq(schema.holdings.competitionId, competitionId));

        // Delete all ledger entries for this competition
        await this.db.delete(schema.ledgerEntries)
            .where(eq(schema.ledgerEntries.competitionId, competitionId));

        // Delete all orders for this competition
        await this.db.delete(schema.orders)
            .where(eq(schema.orders.competitionId, competitionId));

        // Reset all portfolios to starting cash
        // Only get participants whose user still exists
        const participants = await this.db.query.competitionParticipants.findMany({
            where: and(
                eq(schema.competitionParticipants.competitionId, competitionId),
                eq(schema.competitionParticipants.isActive, true),
            ),
        });

        for (const participant of participants) {
            // Check if user still exists before creating ledger entry
            const user = await this.db.query.users.findFirst({
                where: eq(schema.users.id, participant.userId),
            });

            if (!user) {
                // User was deleted, skip this participant
                continue;
            }
            await this.db.update(schema.portfolios)
                .set({
                    cash: competition.startingCash.toString(),
                    realizedPL: '0',
                    tradeCount: 0,
                    updatedAt: new Date(),
                })
                .where(and(
                    eq(schema.portfolios.userId, participant.userId),
                    eq(schema.portfolios.competitionId, competitionId),
                ));

            // Create new initial ledger entry
            await this.db.insert(schema.ledgerEntries).values({
                userId: participant.userId,
                competitionId,
                type: 'initial',
                amount: competition.startingCash.toString(),
                balanceAfter: competition.startingCash.toString(),
                description: 'Competition reset - initial balance restored',
            });
        }

        // Reset competition status to scheduled
        await this.db.update(schema.competitions)
            .set({ status: 'scheduled', updatedAt: new Date() })
            .where(eq(schema.competitions.id, competitionId));

        return { success: true, message: 'Competition reset successfully' };
    }

    private formatRemainingTime(ms: number): string {
        if (ms <= 0) return '00:00:00';

        const hours = Math.floor(ms / (1000 * 60 * 60));
        const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((ms % (1000 * 60)) / 1000);

        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    async generateCompetitionReport(competitionId: string) {
        const competition = await this.getCompetition(competitionId);

        // Fetch all participants with their portfolios and user details
        const participants = await this.db.query.competitionParticipants.findMany({
            where: and(
                eq(schema.competitionParticipants.competitionId, competitionId),
                eq(schema.competitionParticipants.isActive, true),
            ),
        });

        const reportData = await Promise.all(participants.map(async (p: any) => {
            const user = await this.db.query.users.findFirst({
                where: eq(schema.users.id, p.userId),
            });

            const portfolio = await this.db.query.portfolios.findFirst({
                where: and(
                    eq(schema.portfolios.userId, p.userId),
                    eq(schema.portfolios.competitionId, competitionId),
                ),
            });

            const remarks = await this.db.query.remarks.findMany({
                where: and(
                    eq(schema.remarks.userId, p.userId),
                    eq(schema.remarks.competitionId, competitionId),
                ),
            });

            // Calculate aggregate score if multiple remarks scored? 
            // Or just list them. Let's do a summary line per user.
            const totalScore = remarks.reduce((sum: number, r: any) => sum + (r.score || 0), 0);
            const strategyRemark = remarks.find((r: any) => r.type === 'strategy')?.content || '';
            const riskRemark = remarks.find((r: any) => r.type === 'risk_assessment')?.content || '';
            const tradeJustificationsCount = remarks.filter((r: any) => r.type === 'trade_justification').length;

            return {
                userId: p.userId,
                name: user?.fullName || 'Unknown',
                email: user?.email || 'Unknown',
                totalTrades: portfolio?.tradeCount || 0,
                realizedPL: portfolio?.realizedPL || 0,
                cash: portfolio?.cash || 0,
                remarksScore: totalScore,
                tradeJustificationsCount,
                strategyRemark: strategyRemark.replace(/"/g, '""'), // Escape CSV quotes
                riskRemark: riskRemark.replace(/"/g, '""'),
            };
        }));

        // Generate CSV Header
        const header = [
            'User ID',
            'Name',
            'Email',
            'Total Trades',
            'Realized P/L',
            'Cash Balance',
            'Total Score',
            'Justifications Count',
            'Strategy Remark',
            'Risk Remark'
        ].join(',');

        // Generate Rows
        const rows = reportData.map(d => [
            d.userId,
            `"${d.name}"`,
            d.email,
            d.totalTrades,
            d.realizedPL,
            d.cash,
            d.remarksScore,
            d.tradeJustificationsCount,
            `"${d.strategyRemark}"`,
            `"${d.riskRemark}"`
        ].join(','));

        return [header, ...rows].join('\n');
    }
}
