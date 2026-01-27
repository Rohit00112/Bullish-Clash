"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminAuditLogs = exports.eventExecutionLogs = exports.marketEvents = exports.priceUpdateTypeEnum = exports.eventImpactTypeEnum = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const users_1 = require("./users");
exports.eventImpactTypeEnum = (0, pg_core_1.pgEnum)('event_impact_type', [
    'positive',
    'negative',
    'neutral',
]);
exports.priceUpdateTypeEnum = (0, pg_core_1.pgEnum)('price_update_type', [
    'percentage',
    'absolute',
    'override',
]);
exports.marketEvents = (0, pg_core_1.pgTable)('market_events', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    title: (0, pg_core_1.varchar)('title', { length: 255 }).notNull(),
    description: (0, pg_core_1.text)('description'),
    impactType: (0, exports.eventImpactTypeEnum)('impact_type').notNull(),
    priceUpdateType: (0, exports.priceUpdateTypeEnum)('price_update_type').notNull(),
    magnitude: (0, pg_core_1.numeric)('magnitude', { precision: 15, scale: 4 }).notNull(),
    affectedSymbols: (0, pg_core_1.jsonb)('affected_symbols').$type().default([]),
    affectAllSymbols: (0, pg_core_1.boolean)('affect_all_symbols').notNull().default(false),
    isExecuted: (0, pg_core_1.boolean)('is_executed').notNull().default(false),
    scheduledAt: (0, pg_core_1.timestamp)('scheduled_at', { withTimezone: true }),
    executedAt: (0, pg_core_1.timestamp)('executed_at', { withTimezone: true }),
    createdBy: (0, pg_core_1.uuid)('created_by')
        .notNull()
        .references(() => users_1.users.id),
    executedBy: (0, pg_core_1.uuid)('executed_by')
        .references(() => users_1.users.id),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
    isExecutedIdx: (0, pg_core_1.index)('market_events_is_executed_idx').on(table.isExecuted),
    scheduledAtIdx: (0, pg_core_1.index)('market_events_scheduled_at_idx').on(table.scheduledAt),
    createdAtIdx: (0, pg_core_1.index)('market_events_created_at_idx').on(table.createdAt),
}));
exports.eventExecutionLogs = (0, pg_core_1.pgTable)('event_execution_logs', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    eventId: (0, pg_core_1.uuid)('event_id')
        .notNull()
        .references(() => exports.marketEvents.id, { onDelete: 'cascade' }),
    symbolId: (0, pg_core_1.uuid)('symbol_id').notNull(),
    previousPrice: (0, pg_core_1.numeric)('previous_price', { precision: 15, scale: 2 }).notNull(),
    newPrice: (0, pg_core_1.numeric)('new_price', { precision: 15, scale: 2 }).notNull(),
    change: (0, pg_core_1.numeric)('change', { precision: 15, scale: 2 }).notNull(),
    changePercent: (0, pg_core_1.numeric)('change_percent', { precision: 8, scale: 4 }).notNull(),
    executedAt: (0, pg_core_1.timestamp)('executed_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
    eventIdIdx: (0, pg_core_1.index)('event_execution_logs_event_id_idx').on(table.eventId),
    symbolIdIdx: (0, pg_core_1.index)('event_execution_logs_symbol_id_idx').on(table.symbolId),
}));
exports.adminAuditLogs = (0, pg_core_1.pgTable)('admin_audit_logs', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    adminId: (0, pg_core_1.uuid)('admin_id')
        .notNull()
        .references(() => users_1.users.id),
    action: (0, pg_core_1.varchar)('action', { length: 100 }).notNull(),
    resource: (0, pg_core_1.varchar)('resource', { length: 100 }).notNull(),
    resourceId: (0, pg_core_1.uuid)('resource_id'),
    details: (0, pg_core_1.jsonb)('details'),
    ipAddress: (0, pg_core_1.varchar)('ip_address', { length: 45 }),
    userAgent: (0, pg_core_1.text)('user_agent'),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
    adminIdIdx: (0, pg_core_1.index)('admin_audit_logs_admin_id_idx').on(table.adminId),
    actionIdx: (0, pg_core_1.index)('admin_audit_logs_action_idx').on(table.action),
    createdAtIdx: (0, pg_core_1.index)('admin_audit_logs_created_at_idx').on(table.createdAt),
}));
//# sourceMappingURL=events.js.map