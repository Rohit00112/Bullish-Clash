// ============================================================
// Bullish Clash - Database Schema (Drizzle ORM)
// Watchlist Schema
// ============================================================

import {
    pgTable,
    uuid,
    timestamp,
    primaryKey,
} from 'drizzle-orm/pg-core';
import { users } from './users';
import { symbols } from './symbols';

// User watchlist table - stores which symbols a user is watching
export const watchlist = pgTable('watchlist', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    symbolId: uuid('symbol_id')
        .notNull()
        .references(() => symbols.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
    // Ensure a user can only add a symbol once
    uniqueUserSymbol: {
        name: 'watchlist_user_symbol_unique',
        columns: [table.userId, table.symbolId],
    },
}));

// Type exports for TypeScript
export type Watchlist = typeof watchlist.$inferSelect;
export type NewWatchlist = typeof watchlist.$inferInsert;
