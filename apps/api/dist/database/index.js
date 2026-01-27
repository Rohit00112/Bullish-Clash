"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.schema = exports.pool = exports.db = void 0;
const node_postgres_1 = require("drizzle-orm/node-postgres");
const pg_1 = require("pg");
const schema = require("./schema");
exports.schema = schema;
const pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/bullish_clash',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});
exports.pool = pool;
exports.db = (0, node_postgres_1.drizzle)(pool, { schema });
//# sourceMappingURL=index.js.map