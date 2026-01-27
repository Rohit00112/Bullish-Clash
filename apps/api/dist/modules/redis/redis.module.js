"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisModule = exports.REDIS_SUBSCRIBER = exports.REDIS_PUBLISHER = exports.REDIS_CLIENT = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ioredis_1 = require("ioredis");
exports.REDIS_CLIENT = 'REDIS_CLIENT';
exports.REDIS_PUBLISHER = 'REDIS_PUBLISHER';
exports.REDIS_SUBSCRIBER = 'REDIS_SUBSCRIBER';
let RedisModule = class RedisModule {
};
exports.RedisModule = RedisModule;
exports.RedisModule = RedisModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        providers: [
            {
                provide: exports.REDIS_CLIENT,
                inject: [config_1.ConfigService],
                useFactory: (configService) => {
                    return new ioredis_1.default({
                        host: configService.get('REDIS_HOST') || 'localhost',
                        port: configService.get('REDIS_PORT') || 6379,
                        password: configService.get('REDIS_PASSWORD') || undefined,
                        db: 0,
                    });
                },
            },
            {
                provide: exports.REDIS_PUBLISHER,
                inject: [config_1.ConfigService],
                useFactory: (configService) => {
                    return new ioredis_1.default({
                        host: configService.get('REDIS_HOST') || 'localhost',
                        port: configService.get('REDIS_PORT') || 6379,
                        password: configService.get('REDIS_PASSWORD') || undefined,
                        db: 0,
                    });
                },
            },
            {
                provide: exports.REDIS_SUBSCRIBER,
                inject: [config_1.ConfigService],
                useFactory: (configService) => {
                    return new ioredis_1.default({
                        host: configService.get('REDIS_HOST') || 'localhost',
                        port: configService.get('REDIS_PORT') || 6379,
                        password: configService.get('REDIS_PASSWORD') || undefined,
                        db: 0,
                    });
                },
            },
        ],
        exports: [exports.REDIS_CLIENT, exports.REDIS_PUBLISHER, exports.REDIS_SUBSCRIBER],
    })
], RedisModule);
//# sourceMappingURL=redis.module.js.map