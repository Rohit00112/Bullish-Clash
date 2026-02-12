// ============================================================
// Bullish Battle - Database Schema (Drizzle ORM)
// Users & Authentication Schema
// ============================================================

import {
    pgTable,
    uuid,
    varchar,
    text,
    boolean,
    timestamp,
    pgEnum,
} from 'drizzle-orm/pg-core';

// User role enum
export const userRoleEnum = pgEnum('user_role', ['admin', 'participant']);

// Users table
export const users = pgTable('users', {
    id: uuid('id').defaultRandom().primaryKey(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    username: varchar('username', { length: 50 }).notNull().unique(),
    fullName: varchar('full_name', { length: 255 }).notNull(),
    passwordHash: text('password_hash').notNull(),
    role: userRoleEnum('role').notNull().default('participant'),
    avatarUrl: text('avatar_url'),
    phone: varchar('phone', { length: 20 }),
    isActive: boolean('is_active').notNull().default(true),
    mustChangePassword: boolean('must_change_password').notNull().default(false),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Refresh tokens for JWT
export const refreshTokens = pgTable('refresh_tokens', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    token: text('token').notNull().unique(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Type exports for TypeScript
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type RefreshToken = typeof refreshTokens.$inferSelect;
export type NewRefreshToken = typeof refreshTokens.$inferInsert;
