"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketModule = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const trading_gateway_1 = require("./trading.gateway");
const leaderboard_module_1 = require("../leaderboard/leaderboard.module");
const competition_module_1 = require("../competition/competition.module");
let WebSocketModule = class WebSocketModule {
};
exports.WebSocketModule = WebSocketModule;
exports.WebSocketModule = WebSocketModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule,
            jwt_1.JwtModule.registerAsync({
                imports: [config_1.ConfigModule],
                useFactory: async (configService) => ({
                    secret: configService.get('JWT_SECRET') || 'bullish-clash-secret-key-change-in-production',
                    signOptions: { expiresIn: configService.get('JWT_EXPIRES_IN') || '7d' },
                }),
                inject: [config_1.ConfigService],
            }),
            (0, common_1.forwardRef)(() => leaderboard_module_1.LeaderboardModule),
            (0, common_1.forwardRef)(() => competition_module_1.CompetitionModule),
        ],
        providers: [trading_gateway_1.TradingGateway],
        exports: [trading_gateway_1.TradingGateway],
    })
], WebSocketModule);
//# sourceMappingURL=websocket.module.js.map