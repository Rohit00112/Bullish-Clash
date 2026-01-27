import type { Config } from 'drizzle-kit';

export default {
    schema: './src/database/schema/*.ts',
    out: './drizzle',
    driver: 'pg',
    dbCredentials: {
        connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/bullish_clash',
    },
} satisfies Config;
