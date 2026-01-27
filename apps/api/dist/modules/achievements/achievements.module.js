"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AchievementsModule = void 0;
const common_1 = require("@nestjs/common");
const achievements_controller_1 = require("./achievements.controller");
const achievements_service_1 = require("./achievements.service");
const database_module_1 = require("../../database/database.module");
const websocket_module_1 = require("../websocket/websocket.module");
let AchievementsModule = class AchievementsModule {
    achievementsService;
    constructor(achievementsService) {
        this.achievementsService = achievementsService;
    }
    async onModuleInit() {
        await this.achievementsService.seedAchievements();
    }
};
exports.AchievementsModule = AchievementsModule;
exports.AchievementsModule = AchievementsModule = __decorate([
    (0, common_1.Module)({
        imports: [database_module_1.DatabaseModule, (0, common_1.forwardRef)(() => websocket_module_1.WebSocketModule)],
        controllers: [achievements_controller_1.AchievementsController],
        providers: [achievements_service_1.AchievementsService],
        exports: [achievements_service_1.AchievementsService],
    }),
    __metadata("design:paramtypes", [achievements_service_1.AchievementsService])
], AchievementsModule);
//# sourceMappingURL=achievements.module.js.map