"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.remarks = exports.remarkTypeEnum = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const users_1 = require("./users");
const competitions_1 = require("./competitions");
const symbols_1 = require("./symbols");
exports.remarkTypeEnum = (0, pg_core_1.pgEnum)('remark_type', [
    'trade_justification',
    'strategy',
    'risk_assessment',
    'market_sentiment',
]);
exports.remarks = (0, pg_core_1.pgTable)('remarks', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    userId: (0, pg_core_1.uuid)('user_id')
        .notNull()
        .references(() => users_1.users.id, { onDelete: 'cascade' }),
    competitionId: (0, pg_core_1.uuid)('competition_id')
        .notNull()
        .references(() => competitions_1.competitions.id, { onDelete: 'cascade' }),
    symbolId: (0, pg_core_1.uuid)('symbol_id')
        .references(() => symbols_1.symbols.id, { onDelete: 'set null' }),
    type: (0, exports.remarkTypeEnum)('type').notNull().default('trade_justification'),
    score: (0, pg_core_1.integer)('score'),
    title: (0, pg_core_1.varchar)('title', { length: 255 }),
    content: (0, pg_core_1.text)('content').notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
    userCompetitionIdx: (0, pg_core_1.index)('remarks_user_competition_idx').on(table.userId, table.competitionId),
    userCompetitionSymbolIdx: (0, pg_core_1.index)('remarks_user_competition_symbol_idx').on(table.userId, table.competitionId, table.symbolId),
}));
//# sourceMappingURL=remarks.js.map