"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.watchlist = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const users_1 = require("./users");
const symbols_1 = require("./symbols");
exports.watchlist = (0, pg_core_1.pgTable)('watchlist', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    userId: (0, pg_core_1.uuid)('user_id')
        .notNull()
        .references(() => users_1.users.id, { onDelete: 'cascade' }),
    symbolId: (0, pg_core_1.uuid)('symbol_id')
        .notNull()
        .references(() => symbols_1.symbols.id, { onDelete: 'cascade' }),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
    uniqueUserSymbol: {
        name: 'watchlist_user_symbol_unique',
        columns: [table.userId, table.symbolId],
    },
}));
//# sourceMappingURL=watchlist.js.map