// ============================================================
// Bullish Clash - Trading Module
// ============================================================

import { Module, forwardRef } from '@nestjs/common';
import { TradingController } from './trading.controller';
import { TradingService } from './trading.service';
import { PricesModule } from '../prices/prices.module';
import { PortfolioModule } from '../portfolio/portfolio.module';
import { CompetitionModule } from '../competition/competition.module';
import { WebSocketModule } from '../websocket/websocket.module';
import { AchievementsModule } from '../achievements/achievements.module';


@Module({
    imports: [
        forwardRef(() => PricesModule),
        forwardRef(() => PortfolioModule),
        forwardRef(() => CompetitionModule),
        forwardRef(() => WebSocketModule),

        AchievementsModule,
    ],
    controllers: [TradingController],
    providers: [TradingService],
    exports: [TradingService],
})
export class TradingModule { }

