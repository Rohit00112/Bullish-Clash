"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bids = exports.bidStatusEnum = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const users_1 = require("./users");
const symbols_1 = require("./symbols");
const competitions_1 = require("./competitions");
exports.bidStatusEnum = (0, pg_core_1.pgEnum)('bid_status', [
    'pending',
    'accepted',
    'getting_ready',
    'processed',
    'rejected',
]);
exports.bids = (0, pg_core_1.pgTable)('bids', {
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
    quantity: (0, pg_core_1.integer)('quantity').notNull(),
    price: (0, pg_core_1.numeric)('price', { precision: 15, scale: 2 }).notNull(),
    allocatedQuantity: (0, pg_core_1.integer)('allocated_quantity').default(0),
    status: (0, exports.bidStatusEnum)('status').notNull().default('pending'),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
    userIdIdx: (0, pg_core_1.index)('bids_user_id_idx').on(table.userId),
    competitionIdIdx: (0, pg_core_1.index)('bids_competition_id_idx').on(table.competitionId),
    statusIdx: (0, pg_core_1.index)('bids_status_idx').on(table.status),
    userCompetitionIdx: (0, pg_core_1.index)('bids_user_competition_idx').on(table.userId, table.competitionId),
}));
//# sourceMappingURL=bids.js.map