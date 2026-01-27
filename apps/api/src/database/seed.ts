// ============================================================
// Bullish Clash - Database Seed Script
// Seeds initial data: Admin user, NEPSE symbols, Competition
// ============================================================

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import { v4 as uuid } from 'uuid';
import * as schema from './schema';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/bullish_clash',
});

const db = drizzle(pool, { schema });

// NEPSE Listed Companies - Seed Data
const nepseSymbols = [
    // Commercial Banks
    { symbol: 'NABIL', companyName: 'Nabil Bank Limited', sector: 'Commercial Bank', basePrice: 1250 },
    { symbol: 'NICA', companyName: 'NIC Asia Bank Limited', sector: 'Commercial Bank', basePrice: 850 },
    { symbol: 'GBIME', companyName: 'Global IME Bank Limited', sector: 'Commercial Bank', basePrice: 320 },
    { symbol: 'SBL', companyName: 'Siddhartha Bank Limited', sector: 'Commercial Bank', basePrice: 380 },
    { symbol: 'NBL', companyName: 'Nepal Bank Limited', sector: 'Commercial Bank', basePrice: 420 },
    { symbol: 'ADBL', companyName: 'Agricultural Development Bank Limited', sector: 'Commercial Bank', basePrice: 480 },
    { symbol: 'EBL', companyName: 'Everest Bank Limited', sector: 'Commercial Bank', basePrice: 750 },
    { symbol: 'HBL', companyName: 'Himalayan Bank Limited', sector: 'Commercial Bank', basePrice: 550 },
    { symbol: 'PRVU', companyName: 'Prabhu Bank Limited', sector: 'Commercial Bank', basePrice: 290 },
    { symbol: 'SCB', companyName: 'Standard Chartered Bank Nepal Limited', sector: 'Commercial Bank', basePrice: 680 },
    { symbol: 'KBL', companyName: 'Kumari Bank Limited', sector: 'Commercial Bank', basePrice: 240 },
    { symbol: 'CZBIL', companyName: 'Citizens Bank International Limited', sector: 'Commercial Bank', basePrice: 310 },
    { symbol: 'SANIMA', companyName: 'Sanima Bank Limited', sector: 'Commercial Bank', basePrice: 400 },
    { symbol: 'MEGA', companyName: 'Mega Bank Nepal Limited', sector: 'Commercial Bank', basePrice: 270 },
    { symbol: 'NIMB', companyName: 'Nepal Investment Mega Bank Limited', sector: 'Commercial Bank', basePrice: 350 },

    // Development Banks
    { symbol: 'MNBBL', companyName: 'Muktinath Bikas Bank Limited', sector: 'Development Bank', basePrice: 520 },
    { symbol: 'JBBL', companyName: 'Jyoti Bikas Bank Limited', sector: 'Development Bank', basePrice: 310 },
    { symbol: 'LBBL', companyName: 'Lumbini Bikas Bank Limited', sector: 'Development Bank', basePrice: 380 },
    { symbol: 'GBBL', companyName: 'Garima Bikas Bank Limited', sector: 'Development Bank', basePrice: 290 },
    { symbol: 'EDBL', companyName: 'Excel Development Bank Limited', sector: 'Development Bank', basePrice: 350 },

    // Finance Companies
    { symbol: 'CFCL', companyName: 'Central Finance Company Limited', sector: 'Finance', basePrice: 200 },
    { symbol: 'GUFL', companyName: 'Goodwill Finance Company Limited', sector: 'Finance', basePrice: 280 },
    { symbol: 'ICFC', companyName: 'ICFC Finance Limited', sector: 'Finance', basePrice: 350 },
    { symbol: 'MFIL', companyName: 'Manjushree Finance Limited', sector: 'Finance', basePrice: 180 },
    { symbol: 'PFL', companyName: 'Pokhara Finance Limited', sector: 'Finance', basePrice: 220 },

    // Microfinance
    { symbol: 'NMBMF', companyName: 'NMB Microfinance Bittiya Sanstha Limited', sector: 'Microfinance', basePrice: 2100 },
    { symbol: 'CBBL', companyName: 'Chhimek Laghubitta Bittiya Sanstha Limited', sector: 'Microfinance', basePrice: 1850 },
    { symbol: 'DDBL', companyName: 'Deprosc Laghubitta Bittiya Sanstha Limited', sector: 'Microfinance', basePrice: 1650 },
    { symbol: 'FOWAD', companyName: 'Forward Community Microfinance Bittiya Sanstha Limited', sector: 'Microfinance', basePrice: 1200 },
    { symbol: 'MLBBL', companyName: 'Mithila Laghubitta Bittiya Sanstha Limited', sector: 'Microfinance', basePrice: 1350 },

    // Life Insurance
    { symbol: 'NLIC', companyName: 'Nepal Life Insurance Company Limited', sector: 'Life Insurance', basePrice: 1150 },
    { symbol: 'ALICL', companyName: 'Asian Life Insurance Company Limited', sector: 'Life Insurance', basePrice: 680 },
    { symbol: 'SJLIC', companyName: 'Surya Jyoti Life Insurance Company Limited', sector: 'Life Insurance', basePrice: 560 },
    { symbol: 'NLICL', companyName: 'National Life Insurance Company Limited', sector: 'Life Insurance', basePrice: 750 },
    { symbol: 'LICN', companyName: 'Life Insurance Corporation Nepal', sector: 'Life Insurance', basePrice: 890 },

    // Non-Life Insurance
    { symbol: 'NICL', companyName: 'Nepal Insurance Company Limited', sector: 'Non Life Insurance', basePrice: 920 },
    { symbol: 'SICL', companyName: 'Sagarmatha Insurance Company Limited', sector: 'Non Life Insurance', basePrice: 780 },
    { symbol: 'SIC', companyName: 'Shikhar Insurance Company Limited', sector: 'Non Life Insurance', basePrice: 680 },
    { symbol: 'HGI', companyName: 'Himalayan General Insurance Company Limited', sector: 'Non Life Insurance', basePrice: 560 },
    { symbol: 'PRIN', companyName: 'Prime Life Insurance Company Limited', sector: 'Non Life Insurance', basePrice: 650 },

    // Hydropower
    { symbol: 'NHPC', companyName: 'National Hydro Power Company Limited', sector: 'Hydropower', basePrice: 780 },
    { symbol: 'CHCL', companyName: 'Chilime Hydropower Company Limited', sector: 'Hydropower', basePrice: 650 },
    { symbol: 'BPCL', companyName: 'Butwal Power Company Limited', sector: 'Hydropower', basePrice: 480 },
    { symbol: 'AKPL', companyName: 'Arun Kabeli Power Limited', sector: 'Hydropower', basePrice: 320 },
    { symbol: 'API', companyName: 'Api Power Company Limited', sector: 'Hydropower', basePrice: 410 },
    { symbol: 'RURU', companyName: 'Ruru Jalvidhyut Pariyojana Limited', sector: 'Hydropower', basePrice: 380 },
    { symbol: 'UNHPL', companyName: 'United Nuwakot Hydropower Limited', sector: 'Hydropower', basePrice: 520 },
    { symbol: 'KPCL', companyName: 'Karnali Development Bank Limited', sector: 'Hydropower', basePrice: 290 },
    { symbol: 'UPPER', companyName: 'Upper Tamakoshi Hydropower Limited', sector: 'Hydropower', basePrice: 580 },
    { symbol: 'SHPC', companyName: 'Sanjen Jalavidhyut Company Limited', sector: 'Hydropower', basePrice: 350 },

    // Manufacturing & Processing
    { symbol: 'SHIVM', companyName: 'Shivam Cements Limited', sector: 'Manufacturing', basePrice: 450 },
    { symbol: 'BNT', companyName: 'Bottlers Nepal (Terai) Limited', sector: 'Manufacturing', basePrice: 1850 },
    { symbol: 'UNL', companyName: 'Unilever Nepal Limited', sector: 'Manufacturing', basePrice: 15200 },
    { symbol: 'NTC', companyName: 'Nepal Telecom', sector: 'Manufacturing', basePrice: 920 },
    { symbol: 'NLG', companyName: 'NLG Insurance Company Limited', sector: 'Manufacturing', basePrice: 680 },

    // Hotels
    { symbol: 'OHL', companyName: 'Oriental Hotels Limited', sector: 'Hotel', basePrice: 680 },
    { symbol: 'SHL', companyName: 'Soaltee Hotel Limited', sector: 'Hotel', basePrice: 450 },
    { symbol: 'TRH', companyName: 'Taragaon Regency Hotel Limited', sector: 'Hotel', basePrice: 520 },

    // Trading
    { symbol: 'BBC', companyName: 'Bishal Bazaar Company Limited', sector: 'Trading', basePrice: 380 },
    { symbol: 'STC', companyName: 'Salt Trading Corporation Limited', sector: 'Trading', basePrice: 780 },

    // Others
    { symbol: 'NRIC', companyName: 'Nepal Reinsurance Company Limited', sector: 'Others', basePrice: 1250 },
    { symbol: 'CGH', companyName: 'Chandragiri Hills Limited', sector: 'Others', basePrice: 450 },
];

async function seed() {
    console.log('🌱 Starting database seed...');

    try {
        // Clear existing data first (in correct order due to FK constraints)
        console.log('Clearing existing data...');
        await db.delete(schema.ledgerEntries);
        await db.delete(schema.holdings);
        await db.delete(schema.orders);
        await db.delete(schema.trades);
        await db.delete(schema.portfolios);
        await db.delete(schema.competitionParticipants);
        await db.delete(schema.priceTicks);
        await db.delete(schema.priceCandles);
        await db.delete(schema.latestPrices);
        await db.delete(schema.symbols);
        await db.delete(schema.eventExecutionLogs);
        await db.delete(schema.adminAuditLogs);
        await db.delete(schema.marketEvents);
        await db.delete(schema.competitions);
        await db.delete(schema.refreshTokens);
        await db.delete(schema.users);

        // 1. Create admin user
        console.log('Creating admin user...');
        const adminPasswordHash = await bcrypt.hash('admin123', 10);
        const adminId = uuid();

        await db.insert(schema.users).values({
            id: adminId,
            email: 'admin@bullishclash.com',
            username: 'admin',
            fullName: 'System Administrator',
            passwordHash: adminPasswordHash,
            role: 'admin',
            isActive: true,
        });

        // 2. Create demo participant
        console.log('Creating demo participant...');
        const demoPasswordHash = await bcrypt.hash('demo123', 10);
        const demoUserId = uuid();

        await db.insert(schema.users).values({
            id: demoUserId,
            email: 'demo@bullishclash.com',
            username: 'demo',
            fullName: 'Demo Trader',
            passwordHash: demoPasswordHash,
            role: 'participant',
            isActive: true,
        });

        // 3. Create symbols
        console.log('Creating NEPSE symbols...');
        const symbolIds: Record<string, string> = {};

        for (const sym of nepseSymbols) {
            const symbolId = uuid();
            symbolIds[sym.symbol] = symbolId;

            await db.insert(schema.symbols).values({
                id: symbolId,
                symbol: sym.symbol,
                companyName: sym.companyName,
                sector: sym.sector as any,
                basePrice: sym.basePrice.toString(),
                isActive: true,
            });
        }

        // 4. Initialize latest prices
        console.log('Initializing latest prices...');
        const allSymbols = await db.select().from(schema.symbols);

        for (const sym of allSymbols) {
            await db.insert(schema.latestPrices).values({
                symbolId: sym.id,
                price: sym.basePrice,
                previousClose: sym.basePrice,
                open: sym.basePrice,
                high: sym.basePrice,
                low: sym.basePrice,
                volume: 0,
                change: '0',
                changePercent: '0',
            });
        }

        // 5. Create default competition
        console.log('Creating default competition...');
        const competitionId = uuid();
        const now = new Date();
        const startTime = new Date(now.getTime() - 1000 * 60 * 60); // 1 hour ago
        const endTime = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 7); // 7 days from now

        await db.insert(schema.competitions).values({
            id: competitionId,
            name: 'Bullish Clash Championship 2026',
            description: 'The premier Nepal stock trading competition. Trade NEPSE stocks, compete for the top spot!',
            status: 'active',
            startingCash: '1000000',
            commissionRate: '0.004',
            allowShortSelling: false,
            allowMargin: false,
            startTime,
            endTime,
            isDefault: true,
        });

        // 6. Add demo user to competition
        console.log('Adding demo user to competition...');
        await db.insert(schema.competitionParticipants).values({
            competitionId,
            userId: demoUserId,
            isActive: true,
        });

        // 7. Initialize demo user portfolio
        console.log('Initializing demo user portfolio...');
        await db.insert(schema.portfolios).values({
            userId: demoUserId,
            competitionId,
            cash: '1000000',
            realizedPL: '0',
            tradeCount: 0,
        });

        // 8. Create initial ledger entry
        await db.insert(schema.ledgerEntries).values({
            userId: demoUserId,
            competitionId,
            type: 'initial',
            amount: '1000000',
            balanceAfter: '1000000',
            description: 'Initial competition balance',
        });

        console.log('✅ Database seed completed successfully!');
        console.log('');
        console.log('📋 Seed Summary:');
        console.log(`   - Admin user: admin@bullishclash.com / admin123`);
        console.log(`   - Demo user: demo@bullishclash.com / demo123`);
        console.log(`   - ${nepseSymbols.length} NEPSE symbols created`);
        console.log(`   - Default competition created (active)`);
        console.log('');

    } catch (error) {
        console.error('❌ Seed failed:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

seed();
