// ============================================================
// Bullish Clash - Redis Module
// ============================================================

import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const REDIS_CLIENT = 'REDIS_CLIENT';
export const REDIS_PUBLISHER = 'REDIS_PUBLISHER';
export const REDIS_SUBSCRIBER = 'REDIS_SUBSCRIBER';

@Global()
@Module({
    providers: [
        {
            provide: REDIS_CLIENT,
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => {
                return new Redis({
                    host: configService.get<string>('REDIS_HOST') || 'localhost',
                    port: configService.get<number>('REDIS_PORT') || 6379,
                    password: configService.get<string>('REDIS_PASSWORD') || undefined,
                    db: 0,
                });
            },
        },
        {
            provide: REDIS_PUBLISHER,
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => {
                return new Redis({
                    host: configService.get<string>('REDIS_HOST') || 'localhost',
                    port: configService.get<number>('REDIS_PORT') || 6379,
                    password: configService.get<string>('REDIS_PASSWORD') || undefined,
                    db: 0,
                });
            },
        },
        {
            provide: REDIS_SUBSCRIBER,
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => {
                return new Redis({
                    host: configService.get<string>('REDIS_HOST') || 'localhost',
                    port: configService.get<number>('REDIS_PORT') || 6379,
                    password: configService.get<string>('REDIS_PASSWORD') || undefined,
                    db: 0,
                });
            },
        },
    ],
    exports: [REDIS_CLIENT, REDIS_PUBLISHER, REDIS_SUBSCRIBER],
})
export class RedisModule { }
