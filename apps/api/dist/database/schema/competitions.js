"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.competitionParticipants = exports.competitions = exports.competitionStatusEnum = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
exports.competitionStatusEnum = (0, pg_core_1.pgEnum)('competition_status', [
    'draft',
    'scheduled',
    'active',
    'paused',
    'ended',
]);
exports.competitions = (0, pg_core_1.pgTable)('competitions', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    description: (0, pg_core_1.text)('description'),
    status: (0, exports.competitionStatusEnum)('status').notNull().default('draft'),
    startingCash: (0, pg_core_1.numeric)('starting_cash', { precision: 15, scale: 2 }).notNull().default('1000000'),
    commissionRate: (0, pg_core_1.numeric)('commission_rate', { precision: 8, scale: 6 }).notNull().default('0.004'),
    maxPositionSize: (0, pg_core_1.numeric)('max_position_size', { precision: 15, scale: 2 }),
    maxDailyTrades: (0, pg_core_1.integer)('max_daily_trades'),
    allowShortSelling: (0, pg_core_1.boolean)('allow_short_selling').notNull().default(false),
    allowMargin: (0, pg_core_1.boolean)('allow_margin').notNull().default(false),
    startTime: (0, pg_core_1.timestamp)('start_time', { withTimezone: true }).notNull(),
    endTime: (0, pg_core_1.timestamp)('end_time', { withTimezone: true }).notNull(),
    tradingHoursStart: (0, pg_core_1.varchar)('trading_hours_start', { length: 10 }).default('11:00'),
    tradingHoursEnd: (0, pg_core_1.varchar)('trading_hours_end', { length: 10 }).default('15:00'),
    isDefault: (0, pg_core_1.boolean)('is_default').notNull().default(false),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
exports.competitionParticipants = (0, pg_core_1.pgTable)('competition_participants', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    competitionId: (0, pg_core_1.uuid)('competition_id')
        .notNull()
        .references(() => exports.competitions.id, { onDelete: 'cascade' }),
    userId: (0, pg_core_1.uuid)('user_id').notNull(),
    joinedAt: (0, pg_core_1.timestamp)('joined_at', { withTimezone: true }).notNull().defaultNow(),
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true),
});
//# sourceMappingURL=competitions.js.map