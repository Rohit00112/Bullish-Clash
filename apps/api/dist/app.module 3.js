"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const schedule_1 = require("@nestjs/schedule");
const database_module_1 = require("./database/database.module");
const auth_module_1 = require("./modules/auth/auth.module");
const users_module_1 = require("./modules/users/users.module");
const symbols_module_1 = require("./modules/symbols/symbols.module");
const prices_module_1 = require("./modules/prices/prices.module");
const trading_module_1 = require("./modules/trading/trading.module");
const portfolio_module_1 = require("./modules/portfolio/portfolio.module");
const leaderboard_module_1 = require("./modules/leaderboard/leaderboard.module");
const events_module_1 = require("./modules/events/events.module");
const competition_module_1 = require("./modules/competition/competition.module");
const websocket_module_1 = require("./modules/websocket/websocket.module");
const redis_module_1 = require("./modules/redis/redis.module");
const email_module_1 = require("./modules/email/email.module");
const watchlist_module_1 = require("./modules/watchlist/watchlist.module");
const achievements_module_1 = require("./modules/achievements/achievements.module");
const bidding_module_1 = require("./modules/bidding/bidding.module");
const remarks_module_1 = require("./modules/remarks/remarks.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: ['../../.env', '.env'],
            }),
            throttler_1.ThrottlerModule.forRoot([
                {
                    name: 'short',
                    ttl: 1000,
                    limit: 10,
                },
                {
                    name: 'medium',
                    ttl: 10000,
                    limit: 50,
                },
                {
                    name: 'long',
                    ttl: 60000,
                    limit: 100,
                },
            ]),
            schedule_1.ScheduleModule.forRoot(),
            database_module_1.DatabaseModule,
            redis_module_1.RedisModule,
            websocket_module_1.WebSocketModule,
            email_module_1.EmailModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            symbols_module_1.SymbolsModule,
            prices_module_1.PricesModule,
            trading_module_1.TradingModule,
            portfolio_module_1.PortfolioModule,
            leaderboard_module_1.LeaderboardModule,
            events_module_1.EventsModule,
            competition_module_1.CompetitionModule,
            watchlist_module_1.WatchlistModule,
            achievements_module_1.AchievementsModule,
            bidding_module_1.BiddingModule,
            remarks_module_1.RemarksModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map