// ============================================================
// Bullish Clash - Database Schema (Drizzle ORM)
// Competition & Settings Schema
// ============================================================

import {
    pgTable,
    uuid,
    varchar,
    text,
    boolean,
    timestamp,
    numeric,
    integer,
    pgEnum,
} from 'drizzle-orm/pg-core';

// Competition status enum
export const competitionStatusEnum = pgEnum('competition_status', [
    'draft',
    'scheduled',
    'bidding',
    'active',
    'remarks',
    'paused',
    'ended',
]);

// Competition table
export const competitions = pgTable('competitions', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    status: competitionStatusEnum('status').notNull().default('draft'),

    // Financial settings
    startingCash: numeric('starting_cash', { precision: 15, scale: 2 }).notNull().default('1000000'),
    commissionRate: numeric('commission_rate', { precision: 8, scale: 6 }).notNull().default('0.004'),

    // Constraints
    maxPositionSize: numeric('max_position_size', { precision: 15, scale: 2 }),
    maxDailyTrades: integer('max_daily_trades'),
    allowShortSelling: boolean('allow_short_selling').notNull().default(false),
    allowMargin: boolean('allow_margin').notNull().default(false),

    // Time window
    startTime: timestamp('start_time', { withTimezone: true }).notNull(),
    endTime: timestamp('end_time', { withTimezone: true }).notNull(),

    // Trading hours (e.g., '11:00', '15:00')
    tradingHoursStart: varchar('trading_hours_start', { length: 10 }).default('11:00'),
    tradingHoursEnd: varchar('trading_hours_end', { length: 10 }).default('15:00'),

    // Bidding hours (e.g., '09:00', '11:00')
    biddingHoursStart: varchar('bidding_hours_start', { length: 10 }).default('09:00'),
    biddingHoursEnd: varchar('bidding_hours_end', { length: 10 }).default('11:00'),

    // Metadata
    isDefault: boolean('is_default').notNull().default(false),
    isLeaderboardHidden: boolean('is_leaderboard_hidden').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Competition participants (links users to competitions)
export const competitionParticipants = pgTable('competition_participants', {
    id: uuid('id').defaultRandom().primaryKey(),
    competitionId: uuid('competition_id')
        .notNull()
        .references(() => competitions.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull(),
    joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
    isActive: boolean('is_active').notNull().default(true),
});

// Type exports
export type Competition = typeof competitions.$inferSelect;
export type NewCompetition = typeof competitions.$inferInsert;
export type CompetitionParticipant = typeof competitionParticipants.$inferSelect;
export type NewCompetitionParticipant = typeof competitionParticipants.$inferInsert;
