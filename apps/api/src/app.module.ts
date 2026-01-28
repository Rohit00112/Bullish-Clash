// ============================================================
// Bullish Clash - Root Application Module
// ============================================================

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';

import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { SymbolsModule } from './modules/symbols/symbols.module';
import { PricesModule } from './modules/prices/prices.module';
import { TradingModule } from './modules/trading/trading.module';
import { PortfolioModule } from './modules/portfolio/portfolio.module';
import { LeaderboardModule } from './modules/leaderboard/leaderboard.module';
import { EventsModule } from './modules/events/events.module';
import { CompetitionModule } from './modules/competition/competition.module';
import { WebSocketModule } from './modules/websocket/websocket.module';
import { RedisModule } from './modules/redis/redis.module';
import { EmailModule } from './modules/email/email.module';
import { WatchlistModule } from './modules/watchlist/watchlist.module';
import { AchievementsModule } from './modules/achievements/achievements.module';
import { BiddingModule } from './modules/bidding/bidding.module';
import { RemarksModule } from './modules/remarks/remarks.module';

@Module({
    imports: [
        // Config
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ['../../.env', '.env'],
        }),

        // Rate limiting
        ThrottlerModule.forRoot([
            {
                name: 'short',
                ttl: 1000,
                limit: 10,
            },
            {
                name: 'medium',
                ttl: 10000,
                limit: 50,
            },
            {
                name: 'long',
                ttl: 60000,
                limit: 100,
            },
        ]),

        // Scheduled tasks
        ScheduleModule.forRoot(),

        // Core modules
        DatabaseModule,
        RedisModule,
        WebSocketModule,
        EmailModule,

        // Feature modules
        AuthModule,
        UsersModule,
        SymbolsModule,
        PricesModule,
        TradingModule,
        PortfolioModule,
        LeaderboardModule,
        EventsModule,
        CompetitionModule,
        WatchlistModule,
        AchievementsModule,
        BiddingModule,
        RemarksModule,
    ],
})
export class AppModule { }
