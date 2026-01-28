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
    { symbol: 'NABIL', companyName: 'Nabil Bank Limited', sector: 'Commercial Bank', basePrice: 1250, listedShares: 10000 },
    { symbol: 'NICA', companyName: 'NIC Asia Bank Limited', sector: 'Commercial Bank', basePrice: 850, listedShares: 10000 },
    { symbol: 'GBIME', companyName: 'Global IME Bank Limited', sector: 'Commercial Bank', basePrice: 320, listedShares: 10000 },
    { symbol: 'SBL', companyName: 'Siddhartha Bank Limited', sector: 'Commercial Bank', basePrice: 380, listedShares: 10000 },
    { symbol: 'NBL', companyName: 'Nepal Bank Limited', sector: 'Commercial Bank', basePrice: 420, listedShares: 10000 },
    { symbol: 'ADBL', companyName: 'Agricultural Development Bank Limited', sector: 'Commercial Bank', basePrice: 480, listedShares: 10000 },
    { symbol: 'EBL', companyName: 'Everest Bank Limited', sector: 'Commercial Bank', basePrice: 750, listedShares: 10000 },
    { symbol: 'HBL', companyName: 'Himalayan Bank Limited', sector: 'Commercial Bank', basePrice: 550, listedShares: 10000 },
    { symbol: 'PRVU', companyName: 'Prabhu Bank Limited', sector: 'Commercial Bank', basePrice: 290, listedShares: 10000 },
    { symbol: 'SCB', companyName: 'Standard Chartered Bank Nepal Limited', sector: 'Commercial Bank', basePrice: 680, listedShares: 10000 },
    { symbol: 'KBL', companyName: 'Kumari Bank Limited', sector: 'Commercial Bank', basePrice: 240, listedShares: 10000 },
    { symbol: 'CZBIL', companyName: 'Citizens Bank International Limited', sector: 'Commercial Bank', basePrice: 310, listedShares: 10000 },
    { symbol: 'SANIMA', companyName: 'Sanima Bank Limited', sector: 'Commercial Bank', basePrice: 400, listedShares: 10000 },
    { symbol: 'MEGA', companyName: 'Mega Bank Nepal Limited', sector: 'Commercial Bank', basePrice: 270, listedShares: 10000 },
    { symbol: 'NIMB', companyName: 'Nepal Investment Mega Bank Limited', sector: 'Commercial Bank', basePrice: 350, listedShares: 10000 },

    // Development Banks
    { symbol: 'MNBBL', companyName: 'Muktinath Bikas Bank Limited', sector: 'Development Bank', basePrice: 520, listedShares: 10000 },
    { symbol: 'JBBL', companyName: 'Jyoti Bikas Bank Limited', sector: 'Development Bank', basePrice: 310, listedShares: 10000 },
    { symbol: 'LBBL', companyName: 'Lumbini Bikas Bank Limited', sector: 'Development Bank', basePrice: 380, listedShares: 10000 },
    { symbol: 'GBBL', companyName: 'Garima Bikas Bank Limited', sector: 'Development Bank', basePrice: 290, listedShares: 10000 },
    { symbol: 'EDBL', companyName: 'Excel Development Bank Limited', sector: 'Development Bank', basePrice: 350, listedShares: 10000 },

    // Finance Companies
    { symbol: 'CFCL', companyName: 'Central Finance Company Limited', sector: 'Finance', basePrice: 200, listedShares: 10000 },
    { symbol: 'GUFL', companyName: 'Goodwill Finance Company Limited', sector: 'Finance', basePrice: 280, listedShares: 10000 },
    { symbol: 'ICFC', companyName: 'ICFC Finance Limited', sector: 'Finance', basePrice: 350, listedShares: 10000 },
    { symbol: 'MFIL', companyName: 'Manjushree Finance Limited', sector: 'Finance', basePrice: 180, listedShares: 10000 },
    { symbol: 'PFL', companyName: 'Pokhara Finance Limited', sector: 'Finance', basePrice: 220, listedShares: 10000 },

    // Microfinance
    { symbol: 'NMBMF', companyName: 'NMB Microfinance Bittiya Sanstha Limited', sector: 'Microfinance', basePrice: 2100, listedShares: 10000 },
    { symbol: 'CBBL', companyName: 'Chhimek Laghubitta Bittiya Sanstha Limited', sector: 'Microfinance', basePrice: 1850, listedShares: 10000 },
    { symbol: 'DDBL', companyName: 'Deprosc Laghubitta Bittiya Sanstha Limited', sector: 'Microfinance', basePrice: 1650, listedShares: 10000 },
    { symbol: 'FOWAD', companyName: 'Forward Community Microfinance Bittiya Sanstha Limited', sector: 'Microfinance', basePrice: 1200, listedShares: 10000 },
    { symbol: 'MLBBL', companyName: 'Mithila Laghubitta Bittiya Sanstha Limited', sector: 'Microfinance', basePrice: 1350, listedShares: 10000 },

    // Life Insurance
    { symbol: 'NLIC', companyName: 'Nepal Life Insurance Company Limited', sector: 'Life Insurance', basePrice: 1150, listedShares: 10000 },
    { symbol: 'ALICL', companyName: 'Asian Life Insurance Company Limited', sector: 'Life Insurance', basePrice: 680, listedShares: 10000 },
    { symbol: 'SJLIC', companyName: 'Surya Jyoti Life Insurance Company Limited', sector: 'Life Insurance', basePrice: 560, listedShares: 10000 },
    { symbol: 'NLICL', companyName: 'National Life Insurance Company Limited', sector: 'Life Insurance', basePrice: 750, listedShares: 10000 },
    { symbol: 'LICN', companyName: 'Life Insurance Corporation Nepal', sector: 'Life Insurance', basePrice: 890, listedShares: 10000 },

    // Non-Life Insurance
    { symbol: 'NICL', companyName: 'Nepal Insurance Company Limited', sector: 'Non Life Insurance', basePrice: 920, listedShares: 10000 },
    { symbol: 'SICL', companyName: 'Sagarmatha Insurance Company Limited', sector: 'Non Life Insurance', basePrice: 780, listedShares: 10000 },
    { symbol: 'SIC', companyName: 'Shikhar Insurance Company Limited', sector: 'Non Life Insurance', basePrice: 680, listedShares: 10000 },
    { symbol: 'HGI', companyName: 'Himalayan General Insurance Company Limited', sector: 'Non Life Insurance', basePrice: 560, listedShares: 10000 },
    { symbol: 'PRIN', companyName: 'Prime Life Insurance Company Limited', sector: 'Non Life Insurance', basePrice: 650, listedShares: 10000 },

    // Hydropower
    { symbol: 'NHPC', companyName: 'National Hydro Power Company Limited', sector: 'Hydropower', basePrice: 780, listedShares: 10000 },
    { symbol: 'CHCL', companyName: 'Chilime Hydropower Company Limited', sector: 'Hydropower', basePrice: 650, listedShares: 10000 },
    { symbol: 'BPCL', companyName: 'Butwal Power Company Limited', sector: 'Hydropower', basePrice: 480, listedShares: 10000 },
    { symbol: 'AKPL', companyName: 'Arun Kabeli Power Limited', sector: 'Hydropower', basePrice: 320, listedShares: 10000 },
    { symbol: 'API', companyName: 'Api Power Company Limited', sector: 'Hydropower', basePrice: 410, listedShares: 10000 },
    { symbol: 'RURU', companyName: 'Ruru Jalvidhyut Pariyojana Limited', sector: 'Hydropower', basePrice: 380, listedShares: 10000 },
    { symbol: 'UNHPL', companyName: 'United Nuwakot Hydropower Limited', sector: 'Hydropower', basePrice: 520, listedShares: 10000 },
    { symbol: 'KPCL', companyName: 'Karnali Development Bank Limited', sector: 'Hydropower', basePrice: 290, listedShares: 10000 },
    { symbol: 'UPPER', companyName: 'Upper Tamakoshi Hydropower Limited', sector: 'Hydropower', basePrice: 580, listedShares: 10000 },
    { symbol: 'SHPC', companyName: 'Sanjen Jalavidhyut Company Limited', sector: 'Hydropower', basePrice: 350, listedShares: 10000 },

    // Manufacturing & Processing
    { symbol: 'SHIVM', companyName: 'Shivam Cements Limited', sector: 'Manufacturing', basePrice: 450, listedShares: 10000 },
    { symbol: 'BNT', companyName: 'Bottlers Nepal (Terai) Limited', sector: 'Manufacturing', basePrice: 1850, listedShares: 10000 },
    { symbol: 'UNL', companyName: 'Unilever Nepal Limited', sector: 'Manufacturing', basePrice: 15200, listedShares: 10000 },
    { symbol: 'NTC', companyName: 'Nepal Telecom', sector: 'Manufacturing', basePrice: 920, listedShares: 10000 },
    { symbol: 'NLG', companyName: 'NLG Insurance Company Limited', sector: 'Manufacturing', basePrice: 680, listedShares: 10000 },

    // Hotels
    { symbol: 'OHL', companyName: 'Oriental Hotels Limited', sector: 'Hotel', basePrice: 680, listedShares: 10000 },
    { symbol: 'SHL', companyName: 'Soaltee Hotel Limited', sector: 'Hotel', basePrice: 450, listedShares: 10000 },
    { symbol: 'TRH', companyName: 'Taragaon Regency Hotel Limited', sector: 'Hotel', basePrice: 520, listedShares: 10000 },

    // Trading
    { symbol: 'BBC', companyName: 'Bishal Bazaar Company Limited', sector: 'Trading', basePrice: 380, listedShares: 10000 },
    { symbol: 'STC', companyName: 'Salt Trading Corporation Limited', sector: 'Trading', basePrice: 780, listedShares: 10000 },

    // Others
    { symbol: 'NRIC', companyName: 'Nepal Reinsurance Company Limited', sector: 'Others', basePrice: 1250, listedShares: 10000 },
    { symbol: 'CGH', companyName: 'Chandragiri Hills Limited', sector: 'Others', basePrice: 450, listedShares: 10000 },
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
                listedShares: sym.listedShares,
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
