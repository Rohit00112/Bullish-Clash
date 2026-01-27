"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshTokens = exports.users = exports.userRoleEnum = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
exports.userRoleEnum = (0, pg_core_1.pgEnum)('user_role', ['admin', 'participant']);
exports.users = (0, pg_core_1.pgTable)('users', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    email: (0, pg_core_1.varchar)('email', { length: 255 }).notNull().unique(),
    username: (0, pg_core_1.varchar)('username', { length: 50 }).notNull().unique(),
    fullName: (0, pg_core_1.varchar)('full_name', { length: 255 }).notNull(),
    passwordHash: (0, pg_core_1.text)('password_hash').notNull(),
    role: (0, exports.userRoleEnum)('role').notNull().default('participant'),
    avatarUrl: (0, pg_core_1.text)('avatar_url'),
    phone: (0, pg_core_1.varchar)('phone', { length: 20 }),
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true),
    lastLoginAt: (0, pg_core_1.timestamp)('last_login_at', { withTimezone: true }),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
exports.refreshTokens = (0, pg_core_1.pgTable)('refresh_tokens', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    userId: (0, pg_core_1.uuid)('user_id')
        .notNull()
        .references(() => exports.users.id, { onDelete: 'cascade' }),
    token: (0, pg_core_1.text)('token').notNull().unique(),
    expiresAt: (0, pg_core_1.timestamp)('expires_at', { withTimezone: true }).notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
});
//# sourceMappingURL=users.js.map