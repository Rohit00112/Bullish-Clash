// ============================================================
// Bullish Battle - Database Schema (Drizzle ORM)
// Events Schema (Admin Price Scripts)
// ============================================================

import {
    pgTable,
    uuid,
    varchar,
    text,
    boolean,
    timestamp,
    numeric,
    pgEnum,
    index,
    jsonb,
} from 'drizzle-orm/pg-core';
import { users } from './users';

// Event impact type enum
export const eventImpactTypeEnum = pgEnum('event_impact_type', [
    'positive',
    'negative',
    'neutral',
]);

// Price update type enum
export const priceUpdateTypeEnum = pgEnum('price_update_type', [
    'percentage',
    'absolute',
    'override',
]);

// Market events (admin-created price scripts)
export const marketEvents = pgTable('market_events', {
    id: uuid('id').defaultRandom().primaryKey(),

    // Event details
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),

    // Impact configuration
    impactType: eventImpactTypeEnum('impact_type').notNull(),
    priceUpdateType: priceUpdateTypeEnum('price_update_type').notNull(),
    magnitude: numeric('magnitude', { precision: 15, scale: 4 }).notNull(), // e.g., 5.0 for +5%

    // Affected symbols (JSON array of symbol IDs, or empty for all)
    affectedSymbols: jsonb('affected_symbols').$type<string[]>().default([]),
    affectAllSymbols: boolean('affect_all_symbols').notNull().default(false),

    // Per-symbol expected impact: { symbolId: expectedImpactPercent }
    // e.g., { "uuid-hubl": 12, "uuid-epbl": 10, "uuid-stbl": 8 }
    symbolImpacts: jsonb('symbol_impacts').$type<Record<string, number>>().default({}),

    // Execution status
    isExecuted: boolean('is_executed').notNull().default(false),
    scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
    executedAt: timestamp('executed_at', { withTimezone: true }),

    // Audit fields
    createdBy: uuid('created_by')
        .notNull()
        .references(() => users.id),
    executedBy: uuid('executed_by')
        .references(() => users.id),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
    isExecutedIdx: index('market_events_is_executed_idx').on(table.isExecuted),
    scheduledAtIdx: index('market_events_scheduled_at_idx').on(table.scheduledAt),
    createdAtIdx: index('market_events_created_at_idx').on(table.createdAt),
}));

// Event execution log (audit trail)
export const eventExecutionLogs = pgTable('event_execution_logs', {
    id: uuid('id').defaultRandom().primaryKey(),
    eventId: uuid('event_id')
        .notNull()
        .references(() => marketEvents.id, { onDelete: 'cascade' }),
    symbolId: uuid('symbol_id').notNull(),

    previousPrice: numeric('previous_price', { precision: 15, scale: 2 }).notNull(),
    newPrice: numeric('new_price', { precision: 15, scale: 2 }).notNull(),
    change: numeric('change', { precision: 15, scale: 2 }).notNull(),
    changePercent: numeric('change_percent', { precision: 8, scale: 4 }).notNull(),

    executedAt: timestamp('executed_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
    eventIdIdx: index('event_execution_logs_event_id_idx').on(table.eventId),
    symbolIdIdx: index('event_execution_logs_symbol_id_idx').on(table.symbolId),
}));

// Admin audit log
export const adminAuditLogs = pgTable('admin_audit_logs', {
    id: uuid('id').defaultRandom().primaryKey(),
    adminId: uuid('admin_id')
        .notNull()
        .references(() => users.id),

    action: varchar('action', { length: 100 }).notNull(),
    resource: varchar('resource', { length: 100 }).notNull(),
    resourceId: uuid('resource_id'),

    details: jsonb('details'),
    ipAddress: varchar('ip_address', { length: 45 }),
    userAgent: text('user_agent'),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
    adminIdIdx: index('admin_audit_logs_admin_id_idx').on(table.adminId),
    actionIdx: index('admin_audit_logs_action_idx').on(table.action),
    createdAtIdx: index('admin_audit_logs_created_at_idx').on(table.createdAt),
}));

// Type exports
export type MarketEvent = typeof marketEvents.$inferSelect;
export type NewMarketEvent = typeof marketEvents.$inferInsert;
export type EventExecutionLog = typeof eventExecutionLogs.$inferSelect;
export type NewEventExecutionLog = typeof eventExecutionLogs.$inferInsert;
export type AdminAuditLog = typeof adminAuditLogs.$inferSelect;
export type NewAdminAuditLog = typeof adminAuditLogs.$inferInsert;
