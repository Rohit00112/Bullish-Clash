// ============================================================
// Bullish Clash - Database Schema (Drizzle ORM)
// Bidding Schema
// ============================================================

import {
    pgTable,
    uuid,
    integer,
    numeric,
    timestamp,
    pgEnum,
    index,
} from 'drizzle-orm/pg-core';
import { users } from './users';
import { symbols } from './symbols';
import { competitions } from './competitions';

// Bid status enum
export const bidStatusEnum = pgEnum('bid_status', [
    'pending',
    'accepted',
    'getting_ready', // Calculated/Allocated but not yet distributed
    'processed',     // Distributed to holdings
    'rejected',
]);

// Bids table
export const bids = pgTable('bids', {
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

    quantity: integer('quantity').notNull(),
    price: numeric('price', { precision: 15, scale: 2 }).notNull(), // Bid price (or fixed IPO price)

    // For allocation
    allocatedQuantity: integer('allocated_quantity').default(0),

    status: bidStatusEnum('status').notNull().default('pending'),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
    userIdIdx: index('bids_user_id_idx').on(table.userId),
    competitionIdIdx: index('bids_competition_id_idx').on(table.competitionId),
    statusIdx: index('bids_status_idx').on(table.status),
    userCompetitionIdx: index('bids_user_competition_idx').on(table.userId, table.competitionId),
}));

export type Bid = typeof bids.$inferSelect;
export type NewBid = typeof bids.$inferInsert;
