// ============================================================
// Bullish Battle - Database Module
// ============================================================

import { Module, Global } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { ConfigService } from '@nestjs/config';
import * as schema from './schema';

export const DATABASE_CONNECTION = 'DATABASE_CONNECTION';

@Global()
@Module({
    providers: [
        {
            provide: DATABASE_CONNECTION,
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) => {
                const pool = new Pool({
                    connectionString: configService.get<string>('DATABASE_URL') ||
                        'postgresql://postgres:postgres@localhost:5433/bullish_clash',
                    max: 20,
                    idleTimeoutMillis: 30000,
                    connectionTimeoutMillis: 2000,
                });

                return drizzle(pool, { schema });
            },
        },
    ],
    exports: [DATABASE_CONNECTION],
})
export class DatabaseModule { }
