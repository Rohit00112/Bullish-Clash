"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseModule = exports.DATABASE_CONNECTION = void 0;
const common_1 = require("@nestjs/common");
const node_postgres_1 = require("drizzle-orm/node-postgres");
const pg_1 = require("pg");
const config_1 = require("@nestjs/config");
const schema = require("./schema");
exports.DATABASE_CONNECTION = 'DATABASE_CONNECTION';
let DatabaseModule = class DatabaseModule {
};
exports.DatabaseModule = DatabaseModule;
exports.DatabaseModule = DatabaseModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        providers: [
            {
                provide: exports.DATABASE_CONNECTION,
                inject: [config_1.ConfigService],
                useFactory: async (configService) => {
                    const pool = new pg_1.Pool({
                        connectionString: configService.get('DATABASE_URL') ||
                            'postgresql://postgres:postgres@localhost:5433/bullish_clash',
                        max: 20,
                        idleTimeoutMillis: 30000,
                        connectionTimeoutMillis: 2000,
                    });
                    return (0, node_postgres_1.drizzle)(pool, { schema });
                },
            },
        ],
        exports: [exports.DATABASE_CONNECTION],
    })
], DatabaseModule);
//# sourceMappingURL=database.module.js.map