// ============================================================
// Bullish Clash - Quarterly Reports Module
// ============================================================

import { Module, forwardRef } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { QuarterlyReportsController } from './quarterly-reports.controller';
import { QuarterlyReportsService } from './quarterly-reports.service';
import { PricesModule } from '../prices/prices.module';
import { WebSocketModule } from '../websocket/websocket.module';
import { LeaderboardModule } from '../leaderboard/leaderboard.module';

@Module({
    imports: [
        ScheduleModule,
        forwardRef(() => PricesModule),
        forwardRef(() => WebSocketModule),
        forwardRef(() => LeaderboardModule),
    ],
    controllers: [QuarterlyReportsController],
    providers: [QuarterlyReportsService],
    exports: [QuarterlyReportsService],
})
export class QuarterlyReportsModule { }
