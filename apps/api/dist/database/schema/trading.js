"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ledgerEntries = exports.portfolios = exports.holdings = exports.trades = exports.orders = exports.orderStatusEnum = exports.orderTypeEnum = exports.orderSideEnum = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const users_1 = require("./users");
const symbols_1 = require("./symbols");
const competitions_1 = require("./competitions");
exports.orderSideEnum = (0, pg_core_1.pgEnum)('order_side', ['buy', 'sell']);
exports.orderTypeEnum = (0, pg_core_1.pgEnum)('order_type', ['market', 'limit']);
exports.orderStatusEnum = (0, pg_core_1.pgEnum)('order_status', [
    'pending',
    'open',
    'filled',
    'partial',
    'cancelled',
    'rejected',
    'expired',
]);
exports.orders = (0, pg_core_1.pgTable)('orders', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    userId: (0, pg_core_1.uuid)('user_id')
        .notNull()
        .references(() => users_1.users.id, { onDelete: 'cascade' }),
    competitionId: (0, pg_core_1.uuid)('competition_id')
        .notNull()
        .references(() => competitions_1.competitions.id, { onDelete: 'cascade' }),
    symbolId: (0, pg_core_1.uuid)('symbol_id')
        .notNull()
        .references(() => symbols_1.symbols.id, { onDelete: 'cascade' }),
    side: (0, exports.orderSideEnum)('side').notNull(),
    type: (0, exports.orderTypeEnum)('type').notNull().default('market'),
    quantity: (0, pg_core_1.integer)('quantity').notNull(),
    price: (0, pg_core_1.numeric)('price', { precision: 15, scale: 2 }),
    remainingQuantity: (0, pg_core_1.integer)('remaining_quantity').notNull().default(0),
    filledQuantity: (0, pg_core_1.integer)('filled_quantity').notNull().default(0),
    avgFilledPrice: (0, pg_core_1.numeric)('avg_filled_price', { precision: 15, scale: 2 }),
    status: (0, exports.orderStatusEnum)('status').notNull().default('pending'),
    commission: (0, pg_core_1.numeric)('commission', { precision: 15, scale: 2 }).notNull().default('0'),
    rejectionReason: (0, pg_core_1.varchar)('rejection_reason', { length: 255 }),
    priority: (0, pg_core_1.timestamp)('priority', { withTimezone: true }).notNull().defaultNow(),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).notNull().defaultNow(),
    expiresAt: (0, pg_core_1.timestamp)('expires_at', { withTimezone: true }),
}, (table) => ({
    userIdIdx: (0, pg_core_1.index)('orders_user_id_idx').on(table.userId),
    symbolIdIdx: (0, pg_core_1.index)('orders_symbol_id_idx').on(table.symbolId),
    statusIdx: (0, pg_core_1.index)('orders_status_idx').on(table.status),
    createdAtIdx: (0, pg_core_1.index)('orders_created_at_idx').on(table.createdAt),
    orderBookIdx: (0, pg_core_1.index)('orders_order_book_idx').on(table.symbolId, table.side, table.status, table.price),
}));
exports.trades = (0, pg_core_1.pgTable)('trades', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    orderId: (0, pg_core_1.uuid)('order_id')
        .notNull()
        .references(() => exports.orders.id, { onDelete: 'cascade' }),
    userId: (0, pg_core_1.uuid)('user_id')
        .notNull()
        .references(() => users_1.users.id, { onDelete: 'cascade' }),
    competitionId: (0, pg_core_1.uuid)('competition_id')
        .notNull()
        .references(() => competitions_1.competitions.id, { onDelete: 'cascade' }),
    symbolId: (0, pg_core_1.uuid)('symbol_id')
        .notNull()
        .references(() => symbols_1.symbols.id, { onDelete: 'cascade' }),
    side: (0, exports.orderSideEnum)('side').notNull(),
    quantity: (0, pg_core_1.integer)('quantity').notNull(),
    price: (0, pg_core_1.numeric)('price', { precision: 15, scale: 2 }).notNull(),
    total: (0, pg_core_1.numeric)('total', { precision: 15, scale: 2 }).notNull(),
    commission: (0, pg_core_1.numeric)('commission', { precision: 15, scale: 2 }).notNull(),
    executedAt: (0, pg_core_1.timestamp)('executed_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
    userIdIdx: (0, pg_core_1.index)('trades_user_id_idx').on(table.userId),
    symbolIdIdx: (0, pg_core_1.index)('trades_symbol_id_idx').on(table.symbolId),
    executedAtIdx: (0, pg_core_1.index)('trades_executed_at_idx').on(table.executedAt),
}));
exports.holdings = (0, pg_core_1.pgTable)('holdings', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    userId: (0, pg_core_1.uuid)('user_id')
        .notNull()
        .references(() => users_1.users.id, { onDelete: 'cascade' }),
    competitionId: (0, pg_core_1.uuid)('competition_id')
        .notNull()
        .references(() => competitions_1.competitions.id, { onDelete: 'cascade' }),
    symbolId: (0, pg_core_1.uuid)('symbol_id')
        .notNull()
        .references(() => symbols_1.symbols.id, { onDelete: 'cascade' }),
    quantity: (0, pg_core_1.integer)('quantity').notNull().default(0),
    avgPrice: (0, pg_core_1.numeric)('avg_price', { precision: 15, scale: 2 }).notNull(),
    totalCost: (0, pg_core_1.numeric)('total_cost', { precision: 15, scale: 2 }).notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
    userCompetitionSymbolIdx: (0, pg_core_1.index)('holdings_user_competition_symbol_idx')
        .on(table.userId, table.competitionId, table.symbolId),
}));
exports.portfolios = (0, pg_core_1.pgTable)('portfolios', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    userId: (0, pg_core_1.uuid)('user_id')
        .notNull()
        .references(() => users_1.users.id, { onDelete: 'cascade' }),
    competitionId: (0, pg_core_1.uuid)('competition_id')
        .notNull()
        .references(() => competitions_1.competitions.id, { onDelete: 'cascade' }),
    cash: (0, pg_core_1.numeric)('cash', { precision: 15, scale: 2 }).notNull(),
    realizedPL: (0, pg_core_1.numeric)('realized_pl', { precision: 15, scale: 2 }).notNull().default('0'),
    tradeCount: (0, pg_core_1.integer)('trade_count').notNull().default(0),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
    userCompetitionIdx: (0, pg_core_1.index)('portfolios_user_competition_idx')
        .on(table.userId, table.competitionId),
}));
exports.ledgerEntries = (0, pg_core_1.pgTable)('ledger_entries', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    userId: (0, pg_core_1.uuid)('user_id')
        .notNull()
        .references(() => users_1.users.id, { onDelete: 'cascade' }),
    competitionId: (0, pg_core_1.uuid)('competition_id')
        .notNull()
        .references(() => competitions_1.competitions.id, { onDelete: 'cascade' }),
    type: (0, pg_core_1.varchar)('type', { length: 50 }).notNull(),
    amount: (0, pg_core_1.numeric)('amount', { precision: 15, scale: 2 }).notNull(),
    balanceAfter: (0, pg_core_1.numeric)('balance_after', { precision: 15, scale: 2 }).notNull(),
    referenceId: (0, pg_core_1.uuid)('reference_id'),
    description: (0, pg_core_1.varchar)('description', { length: 255 }),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
    userIdIdx: (0, pg_core_1.index)('ledger_entries_user_id_idx').on(table.userId),
    createdAtIdx: (0, pg_core_1.index)('ledger_entries_created_at_idx').on(table.createdAt),
}));
//# sourceMappingURL=trading.js.map