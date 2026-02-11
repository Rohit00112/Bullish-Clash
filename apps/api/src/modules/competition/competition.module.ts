// ============================================================
// Bullish Clash - Competition Module
// ============================================================

import { Module, forwardRef } from '@nestjs/common';
import { CompetitionController } from './competition.controller';
import { CompetitionService } from './competition.service';
import { CompetitionScheduler } from './competition.scheduler';
import { WebSocketModule } from '../websocket/websocket.module';
import { BiddingModule } from '../bidding/bidding.module';

@Module({
    imports: [
        forwardRef(() => WebSocketModule),
        forwardRef(() => BiddingModule),
    ],
    controllers: [CompetitionController],
    providers: [CompetitionService, CompetitionScheduler],
    exports: [CompetitionService],
})
export class CompetitionModule { }
