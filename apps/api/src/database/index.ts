// ============================================================
// Bullish Clash - Database Connection & Drizzle Instance
// ============================================================

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

// Create PostgreSQL connection pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/bullish_clash',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Create Drizzle instance with schema
export const db = drizzle(pool, { schema });

// Export pool for raw queries if needed
export { pool };

// Export schema for use in modules
export { schema };

// Type for the database instance
export type Database = typeof db;
