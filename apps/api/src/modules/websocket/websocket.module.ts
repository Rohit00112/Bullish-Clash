// ============================================================
// Bullish Battle - WebSocket Module
// ============================================================

import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TradingGateway } from './trading.gateway';
import { LeaderboardModule } from '../leaderboard/leaderboard.module';
import { CompetitionModule } from '../competition/competition.module';

@Module({
    imports: [
        ConfigModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET') || 'bullish-clash-secret-key-change-in-production',
                signOptions: { expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '7d' },
            }),
            inject: [ConfigService],
        }),
        forwardRef(() => LeaderboardModule),
        forwardRef(() => CompetitionModule),
    ],
    providers: [TradingGateway],
    exports: [TradingGateway],
})
export class WebSocketModule { }
