"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.priceCandles = exports.priceTicks = exports.latestPrices = exports.symbols = exports.sectorEnum = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
exports.sectorEnum = (0, pg_core_1.pgEnum)('sector', [
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
exports.symbols = (0, pg_core_1.pgTable)('symbols', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    symbol: (0, pg_core_1.varchar)('symbol', { length: 20 }).notNull().unique(),
    companyName: (0, pg_core_1.varchar)('company_name', { length: 255 }).notNull(),
    sector: (0, exports.sectorEnum)('sector').notNull(),
    listedShares: (0, pg_core_1.bigint)('listed_shares', { mode: 'number' }),
    logoUrl: (0, pg_core_1.text)('logo_url'),
    basePrice: (0, pg_core_1.numeric)('base_price', { precision: 15, scale: 2 }).notNull(),
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
exports.latestPrices = (0, pg_core_1.pgTable)('latest_prices', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    symbolId: (0, pg_core_1.uuid)('symbol_id')
        .notNull()
        .references(() => exports.symbols.id, { onDelete: 'cascade' })
        .unique(),
    price: (0, pg_core_1.numeric)('price', { precision: 15, scale: 2 }).notNull(),
    previousClose: (0, pg_core_1.numeric)('previous_close', { precision: 15, scale: 2 }).notNull(),
    open: (0, pg_core_1.numeric)('open', { precision: 15, scale: 2 }).notNull(),
    high: (0, pg_core_1.numeric)('high', { precision: 15, scale: 2 }).notNull(),
    low: (0, pg_core_1.numeric)('low', { precision: 15, scale: 2 }).notNull(),
    volume: (0, pg_core_1.bigint)('volume', { mode: 'number' }).notNull().default(0),
    change: (0, pg_core_1.numeric)('change', { precision: 15, scale: 2 }).notNull().default('0'),
    changePercent: (0, pg_core_1.numeric)('change_percent', { precision: 8, scale: 4 }).notNull().default('0'),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
    symbolIdIdx: (0, pg_core_1.index)('latest_prices_symbol_id_idx').on(table.symbolId),
}));
exports.priceTicks = (0, pg_core_1.pgTable)('price_ticks', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    symbolId: (0, pg_core_1.uuid)('symbol_id')
        .notNull()
        .references(() => exports.symbols.id, { onDelete: 'cascade' }),
    price: (0, pg_core_1.numeric)('price', { precision: 15, scale: 2 }).notNull(),
    previousPrice: (0, pg_core_1.numeric)('previous_price', { precision: 15, scale: 2 }).notNull(),
    change: (0, pg_core_1.numeric)('change', { precision: 15, scale: 2 }).notNull(),
    changePercent: (0, pg_core_1.numeric)('change_percent', { precision: 8, scale: 4 }).notNull(),
    volume: (0, pg_core_1.bigint)('volume', { mode: 'number' }).notNull().default(0),
    eventId: (0, pg_core_1.uuid)('event_id'),
    timestamp: (0, pg_core_1.timestamp)('timestamp', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
    symbolIdIdx: (0, pg_core_1.index)('price_ticks_symbol_id_idx').on(table.symbolId),
    timestampIdx: (0, pg_core_1.index)('price_ticks_timestamp_idx').on(table.timestamp),
    symbolTimestampIdx: (0, pg_core_1.index)('price_ticks_symbol_timestamp_idx').on(table.symbolId, table.timestamp),
}));
exports.priceCandles = (0, pg_core_1.pgTable)('price_candles', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    symbolId: (0, pg_core_1.uuid)('symbol_id')
        .notNull()
        .references(() => exports.symbols.id, { onDelete: 'cascade' }),
    interval: (0, pg_core_1.varchar)('interval', { length: 10 }).notNull(),
    timestamp: (0, pg_core_1.timestamp)('timestamp', { withTimezone: true }).notNull(),
    open: (0, pg_core_1.numeric)('open', { precision: 15, scale: 2 }).notNull(),
    high: (0, pg_core_1.numeric)('high', { precision: 15, scale: 2 }).notNull(),
    low: (0, pg_core_1.numeric)('low', { precision: 15, scale: 2 }).notNull(),
    close: (0, pg_core_1.numeric)('close', { precision: 15, scale: 2 }).notNull(),
    volume: (0, pg_core_1.bigint)('volume', { mode: 'number' }).notNull().default(0),
}, (table) => ({
    symbolIntervalTimestampIdx: (0, pg_core_1.index)('price_candles_symbol_interval_timestamp_idx')
        .on(table.symbolId, table.interval, table.timestamp),
}));
//# sourceMappingURL=symbols.js.map