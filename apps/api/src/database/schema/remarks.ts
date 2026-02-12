// ============================================================
// Bullish Battle - Database Schema (Drizzle ORM)
// Remarks & Justifications Schema
// ============================================================

import {
    pgTable,
    uuid,
    varchar,
    text,
    timestamp,
    pgEnum,
    index,
    integer,
} from 'drizzle-orm/pg-core';
import { users } from './users';
import { competitions } from './competitions';
import { symbols } from './symbols';

// Remark type enum
export const remarkTypeEnum = pgEnum('remark_type', [
    'trade_justification', // Specific to a trade/symbol
    'strategy',            // General strategy
    'risk_assessment',     // General risk
    'market_sentiment',    // Overall market view
]);

// Remarks table
export const remarks = pgTable('remarks', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    competitionId: uuid('competition_id')
        .notNull()
        .references(() => competitions.id, { onDelete: 'cascade' }),

    // Optional: Link to specific symbol if justification is about a stock
    symbolId: uuid('symbol_id')
        .references(() => symbols.id, { onDelete: 'set null' }),

    type: remarkTypeEnum('type').notNull().default('trade_justification'),

    score: integer('score'),  // Admin score (0-100)

    title: varchar('title', { length: 255 }), // Optional summary
    content: text('content').notNull(),       // The actual remark/justification

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
    userCompetitionIdx: index('remarks_user_competition_idx').on(table.userId, table.competitionId),
    userCompetitionSymbolIdx: index('remarks_user_competition_symbol_idx').on(table.userId, table.competitionId, table.symbolId),
}));

export type Remark = typeof remarks.$inferSelect;
export type NewRemark = typeof remarks.$inferInsert;
