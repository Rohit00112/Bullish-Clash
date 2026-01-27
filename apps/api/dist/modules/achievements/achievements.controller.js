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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AchievementsController = void 0;
const common_1 = require("@nestjs/common");
const auth_guards_1 = require("../auth/auth.guards");
const achievements_service_1 = require("./achievements.service");
const database_module_1 = require("../../database/database.module");
const drizzle_orm_1 = require("drizzle-orm");
const schema = require("../../database/schema");
let AchievementsController = class AchievementsController {
    achievementsService;
    db;
    constructor(achievementsService, db) {
        this.achievementsService = achievementsService;
        this.db = db;
    }
    async getDefinitions() {
        return this.achievementsService.getAllDefinitions();
    }
    async getMyAchievements(req) {
        return this.achievementsService.getUserAchievements(req.user.id);
    }
    async getMyCompetitionAchievements(req, competitionId) {
        return this.achievementsService.getUserAchievements(req.user.id, competitionId);
    }
    async getMyStats(req) {
        return this.achievementsService.getUserStats(req.user.id);
    }
    async checkAchievements(req) {
        const competition = await this.db.query.competitions.findFirst({
            where: (0, drizzle_orm_1.eq)(schema.competitions.status, 'active'),
        });
        if (!competition) {
            return { message: 'No active competition', awarded: [] };
        }
        const tradeAchievements = await this.achievementsService.checkTradeAchievements({
            userId: req.user.id,
            competitionId: competition.id,
            type: 'trade',
        });
        const portfolioAchievements = await this.achievementsService.checkPortfolioAchievements(req.user.id, competition.id);
        return {
            message: 'Achievement check completed',
            awarded: [...tradeAchievements, ...portfolioAchievements],
        };
    }
    async getUserAchievements(userId) {
        return this.achievementsService.getUserAchievements(userId);
    }
    async getUserStats(userId) {
        return this.achievementsService.getUserStats(userId);
    }
};
exports.AchievementsController = AchievementsController;
__decorate([
    (0, common_1.Get)('definitions'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AchievementsController.prototype, "getDefinitions", null);
__decorate([
    (0, common_1.UseGuards)(auth_guards_1.JwtAuthGuard),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AchievementsController.prototype, "getMyAchievements", null);
__decorate([
    (0, common_1.UseGuards)(auth_guards_1.JwtAuthGuard),
    (0, common_1.Get)('competition/:competitionId'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('competitionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AchievementsController.prototype, "getMyCompetitionAchievements", null);
__decorate([
    (0, common_1.UseGuards)(auth_guards_1.JwtAuthGuard),
    (0, common_1.Get)('stats'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AchievementsController.prototype, "getMyStats", null);
__decorate([
    (0, common_1.UseGuards)(auth_guards_1.JwtAuthGuard),
    (0, common_1.Post)('check'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AchievementsController.prototype, "checkAchievements", null);
__decorate([
    (0, common_1.Get)('user/:userId'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AchievementsController.prototype, "getUserAchievements", null);
__decorate([
    (0, common_1.Get)('user/:userId/stats'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AchievementsController.prototype, "getUserStats", null);
exports.AchievementsController = AchievementsController = __decorate([
    (0, common_1.Controller)('achievements'),
    __param(1, (0, common_1.Inject)(database_module_1.DATABASE_CONNECTION)),
    __metadata("design:paramtypes", [achievements_service_1.AchievementsService, Object])
], AchievementsController);
//# sourceMappingURL=achievements.controller.js.map