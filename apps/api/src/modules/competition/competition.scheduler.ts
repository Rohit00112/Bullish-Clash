// ============================================================
// Bullish Clash - Competition Scheduler
// Auto-transitions bidding/trading status based on configured hours
// ============================================================

import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { eq } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../../database/database.module';
import * as schema from '../../database/schema';
import { CompetitionService } from './competition.service';
import { TradingGateway } from '../websocket/trading.gateway';
import { BiddingService } from '../bidding/bidding.service';

@Injectable()
export class CompetitionScheduler {
    constructor(
        @Inject(DATABASE_CONNECTION) private readonly db: any,
        private readonly competitionService: CompetitionService,
        @Inject(forwardRef(() => TradingGateway)) private readonly tradingGateway: TradingGateway,
        @Inject(forwardRef(() => BiddingService)) private readonly biddingService: BiddingService,
    ) { }

    // Get current time in Nepal timezone as HH:mm string
    private getNepaliTime(): string {
        const now = new Date();
        return now.toLocaleTimeString('en-US', {
            timeZone: 'Asia/Kathmandu',
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
        });
    }

    // Parse HH:mm to minutes since midnight for comparison
    private timeToMinutes(time: string): number {
        const [h, m] = time.split(':').map(Number);
        return h * 60 + m;
    }

    @Cron(CronExpression.EVERY_10_SECONDS)
    async checkScheduledTransitions() {
        const competition = await this.competitionService.getActiveCompetition();
        if (!competition) return;

        const currentTime = this.getNepaliTime();
        const currentMinutes = this.timeToMinutes(currentTime);

        // --- BIDDING AUTO-STOP ---
        if (competition.status === 'bidding') {
            const biddingEnd = competition.biddingHoursEnd || '11:00';
            const biddingEndMinutes = this.timeToMinutes(biddingEnd);

            if (currentMinutes >= biddingEndMinutes) {
                console.log(`[Scheduler] Bidding time ended (${currentTime} >= ${biddingEnd}). Auto-processing bids and transitioning to active.`);

                try {
                    // Process all pending bids before transitioning
                    await this.biddingService.processBids(competition.id);

                    // Transition to active
                    await this.db.update(schema.competitions)
                        .set({ status: 'active', updatedAt: new Date() })
                        .where(eq(schema.competitions.id, competition.id));

                    await this.tradingGateway.broadcastCompetitionStatus('active', 'Bidding phase has ended. Trading is now open!');
                } catch (error) {
                    console.error('[Scheduler] Failed to auto-transition from bidding to active:', error);
                }
            }
        }

        // --- TRADING AUTO-STOP ---
        if (competition.status === 'active') {
            const tradingEnd = competition.tradingHoursEnd || '15:00';
            const tradingEndMinutes = this.timeToMinutes(tradingEnd);

            if (currentMinutes >= tradingEndMinutes) {
                console.log(`[Scheduler] Trading time ended (${currentTime} >= ${tradingEnd}). Auto-pausing trading.`);

                try {
                    await this.db.update(schema.competitions)
                        .set({ status: 'paused', updatedAt: new Date() })
                        .where(eq(schema.competitions.id, competition.id));

                    await this.tradingGateway.broadcastCompetitionStatus('paused', 'Trading hours have ended. Trading is paused until next session.');
                } catch (error) {
                    console.error('[Scheduler] Failed to auto-pause trading:', error);
                }
            }
        }
    }
}
