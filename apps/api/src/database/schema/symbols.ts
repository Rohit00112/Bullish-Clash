// ============================================================
// Bullish Battle - Database Schema (Drizzle ORM)
// Symbols & Market Data Schema
// ============================================================

import {
    pgTable,
    uuid,
    varchar,
    text,
    boolean,
    timestamp,
    numeric,
    bigint,
    pgEnum,
    index,
} from 'drizzle-orm/pg-core';

// Sector enum for NEPSE companies
export const sectorEnum = pgEnum('sector', [
    'Commercial Bank',
    'Development Bank',
    'Finance',
    'Microfinance',
    'Life Insurance',
    'Non Life Insurance',
    'Hydropower',
    'Manufacturing',
    'Hotel',
    'Trading',
    'Others',
]);

// Symbols (NEPSE listed companies)
export const symbols = pgTable('symbols', {
    id: uuid('id').defaultRandom().primaryKey(),
    symbol: varchar('symbol', { length: 20 }).notNull().unique(),
    companyName: varchar('company_name', { length: 255 }).notNull(),
    sector: sectorEnum('sector').notNull(),
    listedShares: bigint('listed_shares', { mode: 'number' }),
    logoUrl: text('logo_url'),
    basePrice: numeric('base_price', { precision: 15, scale: 2 }).notNull(),

    // Bidding floor price - participants cannot bid below this price
    floorPrice: numeric('floor_price', { precision: 15, scale: 2 }),

    // Listing status - controls whether symbol appears in trading
    isTradeable: boolean('is_tradeable').notNull().default(false),
    wentThroughBidding: boolean('went_through_bidding').notNull().default(false),

    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Latest prices (denormalized for fast access)
export const latestPrices = pgTable('latest_prices', {
    id: uuid('id').defaultRandom().primaryKey(),
    symbolId: uuid('symbol_id')
        .notNull()
        .references(() => symbols.id, { onDelete: 'cascade' })
        .unique(),
    price: numeric('price', { precision: 15, scale: 2 }).notNull(),
    previousClose: numeric('previous_close', { precision: 15, scale: 2 }).notNull(),
    open: numeric('open', { precision: 15, scale: 2 }).notNull(),
    high: numeric('high', { precision: 15, scale: 2 }).notNull(),
    low: numeric('low', { precision: 15, scale: 2 }).notNull(),
    volume: bigint('volume', { mode: 'number' }).notNull().default(0),
    change: numeric('change', { precision: 15, scale: 2 }).notNull().default('0'),
    changePercent: numeric('change_percent', { precision: 8, scale: 4 }).notNull().default('0'),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
    symbolIdIdx: index('latest_prices_symbol_id_idx').on(table.symbolId),
}));

// Price tick history (every price change)
export const priceTicks = pgTable('price_ticks', {
    id: uuid('id').defaultRandom().primaryKey(),
    symbolId: uuid('symbol_id')
        .notNull()
        .references(() => symbols.id, { onDelete: 'cascade' }),
    price: numeric('price', { precision: 15, scale: 2 }).notNull(),
    previousPrice: numeric('previous_price', { precision: 15, scale: 2 }).notNull(),
    change: numeric('change', { precision: 15, scale: 2 }).notNull(),
    changePercent: numeric('change_percent', { precision: 8, scale: 4 }).notNull(),
    volume: bigint('volume', { mode: 'number' }).notNull().default(0),
    eventId: uuid('event_id'),
    timestamp: timestamp('timestamp', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
    symbolIdIdx: index('price_ticks_symbol_id_idx').on(table.symbolId),
    timestampIdx: index('price_ticks_timestamp_idx').on(table.timestamp),
    symbolTimestampIdx: index('price_ticks_symbol_timestamp_idx').on(table.symbolId, table.timestamp),
}));

// Price candles (OHLCV aggregated data)
export const priceCandles = pgTable('price_candles', {
    id: uuid('id').defaultRandom().primaryKey(),
    symbolId: uuid('symbol_id')
        .notNull()
        .references(() => symbols.id, { onDelete: 'cascade' }),
    interval: varchar('interval', { length: 10 }).notNull(), // '1m', '5m', '15m', '1h', '1d'
    timestamp: timestamp('timestamp', { withTimezone: true }).notNull(),
    open: numeric('open', { precision: 15, scale: 2 }).notNull(),
    high: numeric('high', { precision: 15, scale: 2 }).notNull(),
    low: numeric('low', { precision: 15, scale: 2 }).notNull(),
    close: numeric('close', { precision: 15, scale: 2 }).notNull(),
    volume: bigint('volume', { mode: 'number' }).notNull().default(0),
}, (table) => ({
    symbolIntervalTimestampIdx: index('price_candles_symbol_interval_timestamp_idx')
        .on(table.symbolId, table.interval, table.timestamp),
}));

// Type exports
export type Symbol = typeof symbols.$inferSelect;
export type NewSymbol = typeof symbols.$inferInsert;
export type LatestPrice = typeof latestPrices.$inferSelect;
export type NewLatestPrice = typeof latestPrices.$inferInsert;
export type PriceTick = typeof priceTicks.$inferSelect;
export type NewPriceTick = typeof priceTicks.$inferInsert;
export type PriceCandle = typeof priceCandles.$inferSelect;
export type NewPriceCandle = typeof priceCandles.$inferInsert;
