// ============================================================
// Bullish Battle - Watchlist Module
// ============================================================

import { Module, forwardRef } from '@nestjs/common';
import { WatchlistService } from './watchlist.service';
import { WatchlistController } from './watchlist.controller';
import { DatabaseModule } from '../../database/database.module';
import { PricesModule } from '../prices/prices.module';

@Module({
    imports: [
        DatabaseModule,
        forwardRef(() => PricesModule),
    ],
    controllers: [WatchlistController],
    providers: [WatchlistService],
    exports: [WatchlistService],
})
export class WatchlistModule { }
