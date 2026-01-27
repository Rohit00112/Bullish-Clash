"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventsModule = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const events_controller_1 = require("./events.controller");
const events_service_1 = require("./events.service");
const prices_module_1 = require("../prices/prices.module");
const symbols_module_1 = require("../symbols/symbols.module");
const websocket_module_1 = require("../websocket/websocket.module");
const leaderboard_module_1 = require("../leaderboard/leaderboard.module");
let EventsModule = class EventsModule {
};
exports.EventsModule = EventsModule;
exports.EventsModule = EventsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            schedule_1.ScheduleModule,
            (0, common_1.forwardRef)(() => prices_module_1.PricesModule),
            symbols_module_1.SymbolsModule,
            (0, common_1.forwardRef)(() => websocket_module_1.WebSocketModule),
            (0, common_1.forwardRef)(() => leaderboard_module_1.LeaderboardModule),
        ],
        controllers: [events_controller_1.EventsController],
        providers: [events_service_1.EventsService],
        exports: [events_service_1.EventsService],
    })
], EventsModule);
//# sourceMappingURL=events.module.js.map