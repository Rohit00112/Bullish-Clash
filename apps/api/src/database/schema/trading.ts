// ============================================================
// Bullish Battle - Database Schema (Drizzle ORM)
// Trading Schema (Orders, Trades, Portfolios)
// ============================================================

import {
    pgTable,
    uuid,
    varchar,
    numeric,
    integer,
    timestamp,
    pgEnum,
    index,
} from 'drizzle-orm/pg-core';
import { users } from './users';
import { symbols } from './symbols';
import { competitions } from './competitions';

// Order side enum
export const orderSideEnum = pgEnum('order_side', ['buy', 'sell']);

// Order type enum
export const orderTypeEnum = pgEnum('order_type', ['market', 'limit']);

// Order status enum
export const orderStatusEnum = pgEnum('order_status', [
    'pending',      // Limit order waiting in order book
    'open',         // Order is active in the order book
    'filled',       // Completely filled
    'partial',      // Partially filled
    'cancelled',    // Cancelled by user
    'rejected',     // Rejected by system
    'expired',      // Expired (end of day)
]);

// Orders table
export const orders = pgTable('orders', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    competitionId: uuid('competition_id')
        .notNull()
        .references(() => competitions.id, { onDelete: 'cascade' }),
    symbolId: uuid('symbol_id')
        .notNull()
        .references(() => symbols.id, { onDelete: 'cascade' }),

    side: orderSideEnum('side').notNull(),
    type: orderTypeEnum('type').notNull().default('market'),

    quantity: integer('quantity').notNull(),
    price: numeric('price', { precision: 15, scale: 2 }), // For limit orders (bid/ask price)

    // Remaining quantity for partial fills
    remainingQuantity: integer('remaining_quantity').notNull().default(0),
    filledQuantity: integer('filled_quantity').notNull().default(0),
    avgFilledPrice: numeric('avg_filled_price', { precision: 15, scale: 2 }),

    status: orderStatusEnum('status').notNull().default('pending'),
    commission: numeric('commission', { precision: 15, scale: 2 }).notNull().default('0'),

    rejectionReason: varchar('rejection_reason', { length: 255 }),

    // For order book priority (price-time priority)
    priority: timestamp('priority', { withTimezone: true }).notNull().defaultNow(),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }), // For day orders
}, (table) => ({
    userIdIdx: index('orders_user_id_idx').on(table.userId),
    symbolIdIdx: index('orders_symbol_id_idx').on(table.symbolId),
    statusIdx: index('orders_status_idx').on(table.status),
    createdAtIdx: index('orders_created_at_idx').on(table.createdAt),
    // Index for order book queries (bids and asks)
    orderBookIdx: index('orders_order_book_idx').on(table.symbolId, table.side, table.status, table.price),
}));

// Trades table (executed orders)
export const trades = pgTable('trades', {
    id: uuid('id').defaultRandom().primaryKey(),
    orderId: uuid('order_id')
        .references(() => orders.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    competitionId: uuid('competition_id')
        .notNull()
        .references(() => competitions.id, { onDelete: 'cascade' }),
    symbolId: uuid('symbol_id')
        .notNull()
        .references(() => symbols.id, { onDelete: 'cascade' }),

    side: orderSideEnum('side').notNull(),
    quantity: integer('quantity').notNull(),
    price: numeric('price', { precision: 15, scale: 2 }).notNull(),
    total: numeric('total', { precision: 15, scale: 2 }).notNull(),
    commission: numeric('commission', { precision: 15, scale: 2 }).notNull(),

    executedAt: timestamp('executed_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
    userIdIdx: index('trades_user_id_idx').on(table.userId),
    symbolIdIdx: index('trades_symbol_id_idx').on(table.symbolId),
    executedAtIdx: index('trades_executed_at_idx').on(table.executedAt),
}));

// Portfolio holdings (current positions)
export const holdings = pgTable('holdings', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    competitionId: uuid('competition_id')
        .notNull()
        .references(() => competitions.id, { onDelete: 'cascade' }),
    symbolId: uuid('symbol_id')
        .notNull()
        .references(() => symbols.id, { onDelete: 'cascade' }),

    quantity: integer('quantity').notNull().default(0),
    avgPrice: numeric('avg_price', { precision: 15, scale: 2 }).notNull(),
    totalCost: numeric('total_cost', { precision: 15, scale: 2 }).notNull(),

    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
    userCompetitionSymbolIdx: index('holdings_user_competition_symbol_idx')
        .on(table.userId, table.competitionId, table.symbolId),
}));

// Portfolio cash balance
export const portfolios = pgTable('portfolios', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    competitionId: uuid('competition_id')
        .notNull()
        .references(() => competitions.id, { onDelete: 'cascade' }),

    cash: numeric('cash', { precision: 15, scale: 2 }).notNull(),
    realizedPL: numeric('realized_pl', { precision: 15, scale: 2 }).notNull().default('0'),
    tradeCount: integer('trade_count').notNull().default(0),

    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
    userCompetitionIdx: index('portfolios_user_competition_idx')
        .on(table.userId, table.competitionId),
}));

// Ledger for tracking all cash movements
export const ledgerEntries = pgTable('ledger_entries', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    competitionId: uuid('competition_id')
        .notNull()
        .references(() => competitions.id, { onDelete: 'cascade' }),

    type: varchar('type', { length: 50 }).notNull(), // 'initial', 'buy', 'sell', 'commission'
    amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
    balanceAfter: numeric('balance_after', { precision: 15, scale: 2 }).notNull(),

    referenceId: uuid('reference_id'), // Order or trade ID
    description: varchar('description', { length: 255 }),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
    userIdIdx: index('ledger_entries_user_id_idx').on(table.userId),
    createdAtIdx: index('ledger_entries_created_at_idx').on(table.createdAt),
}));

// Type exports
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type Trade = typeof trades.$inferSelect;
export type NewTrade = typeof trades.$inferInsert;
export type Holding = typeof holdings.$inferSelect;
export type NewHolding = typeof holdings.$inferInsert;
export type Portfolio = typeof portfolios.$inferSelect;
export type NewPortfolio = typeof portfolios.$inferInsert;
export type LedgerEntry = typeof ledgerEntries.$inferSelect;
export type NewLedgerEntry = typeof ledgerEntries.$inferInsert;
