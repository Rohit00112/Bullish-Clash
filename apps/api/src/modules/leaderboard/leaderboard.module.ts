// ============================================================
// Bullish Clash - Leaderboard Module
// ============================================================

import { Module, forwardRef } from '@nestjs/common';
import { LeaderboardController } from './leaderboard.controller';
import { LeaderboardService } from './leaderboard.service';
import { PortfolioModule } from '../portfolio/portfolio.module';
import { CompetitionModule } from '../competition/competition.module';

@Module({
    imports: [
        forwardRef(() => PortfolioModule),
        forwardRef(() => CompetitionModule),
    ],
    controllers: [LeaderboardController],
    providers: [LeaderboardService],
    exports: [LeaderboardService],
})
export class LeaderboardModule { }
