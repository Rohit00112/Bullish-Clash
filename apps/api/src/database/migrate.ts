
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import * as path from 'path';

async function main() {
    console.log('🔄 Starting database migrations...');

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
    });

    // Test connection
    try {
        await pool.query('SELECT NOW()');
        console.log('✅ Connected to database');
    } catch (err) {
        console.error('❌ Database connection failed:', err);
        process.exit(1);
    }

    const db = drizzle(pool);

    try {
        const migrationsFolder = path.resolve(__dirname, '../../drizzle');
        console.log(`📁 Running migrations from: ${migrationsFolder}`);

        await migrate(db, { migrationsFolder });
        console.log('✅ Migrations completed successfully');
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

main();
