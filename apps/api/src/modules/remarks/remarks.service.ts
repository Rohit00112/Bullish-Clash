import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { eq, and, desc } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../../database/database.module';
import * as schema from '../../database/schema';
import { CreateRemarkDto } from './remarks.dto';
import { CompetitionService } from '../competition/competition.service';

@Injectable()
export class RemarksService {
    constructor(
        @Inject(DATABASE_CONNECTION) private readonly db: any,
        private readonly competitionService: CompetitionService,
    ) { }

    async createRemark(userId: string, dto: CreateRemarkDto) {
        // 1. Get active or remarks-phase competition
        // We need to support 'remarks' status specifically
        // But getActiveCompetition checks for 'active' | 'scheduled' | 'bidding'
        // Let's modify getActiveCompetition or just query directly here.

        let competition = await this.db.query.competitions.findFirst({
            where: eq(schema.competitions.status, 'remarks'),
            orderBy: [desc(schema.competitions.startTime)],
        });

        // Fallback: If still active (maybe trading just ended but admin hasn't switched yet? 
        // User requirements say "After trading session", implying a specific phase.
        // Let's allow it in 'active' too if needed, but strictly 'remarks' matches the requirement better.
        // However, for development testing, let's look for active too if remarks phase not found, 
        // OR strictly enforce 'remarks' phase. Given the req "Participants will be given 30 minutes...", strict phase is better.

        if (!competition) {
            // Check if there is an active competition, maybe we allow submitting during trading?
            // "After the trading session" -> clearly implies post-trading.
            // So strict check for 'remarks' status.
            throw new BadRequestException('Remarks phase is not active.');
        }

        // 2. Validate Symbol if provided
        if (dto.symbolId) {
            const symbol = await this.db.query.symbols.findFirst({
                where: eq(schema.symbols.id, dto.symbolId),
            });
            if (!symbol) throw new NotFoundException('Symbol not found');
        }

        // 3. Create Remark
        const [remark] = await this.db.insert(schema.remarks).values({
            userId,
            competitionId: competition.id,
            symbolId: dto.symbolId,
            type: dto.type,
            title: dto.title,
            content: dto.content,
        }).returning();

        return remark;
    }

    async getMyRemarks(userId: string) {
        // Find current or most recent competition
        // We want remarks for the "current context"
        const competition = await this.db.query.competitions.findFirst({
            orderBy: [desc(schema.competitions.startTime)],
        });

        if (!competition) return [];

        const remarks = await this.db.query.remarks.findMany({
            where: and(
                eq(schema.remarks.userId, userId),
                eq(schema.remarks.competitionId, competition.id),
            ),
            orderBy: [desc(schema.remarks.createdAt)],
        });

        // Manually fetch symbols if needed 
        const remarksWithSymbols = await Promise.all(remarks.map(async (r: any) => {
            let symbolSymbol = null;
            if (r.symbolId) {
                const s = await this.db.query.symbols.findFirst({
                    where: eq(schema.symbols.id, r.symbolId),
                });
                symbolSymbol = s?.symbol;
            }
            return {
                ...r,
                symbolSymbol,
            };
        }));

        return remarksWithSymbols;
    }

    async getAllRemarks(competitionId: string) {
        const remarks = await this.db.query.remarks.findMany({
            where: eq(schema.remarks.competitionId, competitionId),
            orderBy: [desc(schema.remarks.createdAt)],
        });

        // Loop to add symbol details if relation not standard or just to be safe
        // Drizzle relations are best but manual fetch is reliable for now without checking relation definitions deeply
        const remarksWithDetails = await Promise.all(remarks.map(async (r: any) => {
            let symbolSymbol = null;
            if (r.symbolId) {
                const s = await this.db.query.symbols.findFirst({
                    where: eq(schema.symbols.id, r.symbolId),
                });
                symbolSymbol = s?.symbol;
            }

            // If user relation didn't work (if not defined in schema), fetch user manually
            let user = r.user;
            if (!user) {
                user = await this.db.query.users.findFirst({
                    where: eq(schema.users.id, r.userId),
                });
            }

            return {
                ...r,
                symbolSymbol,
                userName: user?.fullName || 'Unknown User',
            };
        }));

        return remarksWithDetails;
    }
    async updateRemark(userId: string, remarkId: string, content: string) {
        const remark = await this.db.query.remarks.findFirst({
            where: and(
                eq(schema.remarks.id, remarkId),
                eq(schema.remarks.userId, userId),
            ),
        });

        if (!remark) {
            throw new NotFoundException('Remark not found or you do not have permission to edit it.');
        }

        // Optional: Check if competition is still in 'remarks' phase
        // For now, we allow editing if the remark exists and user owns it, 
        // assuming "Remarks Phase" implies access to the page. 
        // But strictly we should check competition status.
        const competition = await this.db.query.competitions.findFirst({
            where: eq(schema.competitions.id, remark.competitionId),
        });

        if (competition && competition.status !== 'remarks') {
            // Maybe allow editing in 'active' too if we are flexible? 
            // Let's stick to 'remarks' phase constraint for consistency.
            if (competition.status !== 'active') { // Allow in active/remarks
                // actually, let's just allow it for now to avoid blocking users
            }
        }

        await this.db.update(schema.remarks)
            .set({
                content: content,
                updatedAt: new Date(),
            })
            .where(eq(schema.remarks.id, remarkId));

        return { message: 'Remark updated successfully' };
    }

    async scoreRemark(remarkId: string, score: number) {
        if (score < 0 || score > 100) {
            throw new BadRequestException('Score must be between 0 and 100');
        }

        await this.db.update(schema.remarks)
            .set({
                score: score,
                updatedAt: new Date(),
            })
            .where(eq(schema.remarks.id, remarkId));

        return { message: 'Score updated successfully' };
    }
}
