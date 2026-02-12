// ============================================================
// Bullish Battle - Events Module (Admin Price Scripts)
// ============================================================

import { Module, forwardRef } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { PricesModule } from '../prices/prices.module';
import { SymbolsModule } from '../symbols/symbols.module';
import { WebSocketModule } from '../websocket/websocket.module';
import { LeaderboardModule } from '../leaderboard/leaderboard.module';

@Module({
    imports: [
        ScheduleModule,
        forwardRef(() => PricesModule),
        SymbolsModule,
        forwardRef(() => WebSocketModule),
        forwardRef(() => LeaderboardModule),
    ],
    controllers: [EventsController],
    providers: [EventsService],
    exports: [EventsService],
})
export class EventsModule { }
