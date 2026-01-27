// ============================================================
// Bullish Clash - Portfolio Module
// ============================================================

import { Module, forwardRef } from '@nestjs/common';
import { PortfolioController } from './portfolio.controller';
import { PortfolioService } from './portfolio.service';
import { PricesModule } from '../prices/prices.module';
import { CompetitionModule } from '../competition/competition.module';

@Module({
    imports: [
        forwardRef(() => PricesModule),
        forwardRef(() => CompetitionModule),
    ],
    controllers: [PortfolioController],
    providers: [PortfolioService],
    exports: [PortfolioService],
})
export class PortfolioModule { }
