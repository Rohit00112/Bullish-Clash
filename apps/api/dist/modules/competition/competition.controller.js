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
exports.CompetitionController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const competition_service_1 = require("./competition.service");
const competition_dto_1 = require("./competition.dto");
const auth_guards_1 = require("../auth/auth.guards");
let CompetitionController = class CompetitionController {
    competitionService;
    constructor(competitionService) {
        this.competitionService = competitionService;
    }
    async getActiveCompetition() {
        const competition = await this.competitionService.getActiveCompetition();
        if (competition) {
            return this.competitionService.getCompetition(competition.id);
        }
        return null;
    }
    async getActiveCompetitionStats() {
        const competition = await this.competitionService.getActiveCompetition();
        if (competition) {
            return this.competitionService.getCompetitionStats(competition.id);
        }
        return null;
    }
    async getActiveCompetitionSettings() {
        const competition = await this.competitionService.getActiveCompetition();
        if (competition) {
            return this.competitionService.getCompetition(competition.id);
        }
        return null;
    }
    async updateActiveCompetitionSettings(dto) {
        const competition = await this.competitionService.getActiveCompetition();
        if (competition) {
            return this.competitionService.updateCompetition(competition.id, dto);
        }
        return null;
    }
    async startActiveCompetition() {
        const competition = await this.competitionService.getActiveCompetition();
        if (competition) {
            return this.competitionService.updateStatus(competition.id, 'active');
        }
        return null;
    }
    async pauseActiveCompetition() {
        const competition = await this.competitionService.getActiveCompetition();
        if (competition) {
            return this.competitionService.updateStatus(competition.id, 'paused');
        }
        return null;
    }
    async endActiveCompetition() {
        const competition = await this.competitionService.getActiveCompetition();
        if (competition) {
            return this.competitionService.updateStatus(competition.id, 'ended');
        }
        return null;
    }
    async resetActiveCompetition() {
        const competition = await this.competitionService.getActiveCompetition();
        if (competition) {
            return this.competitionService.resetCompetition(competition.id);
        }
        return null;
    }
    async getAllCompetitions() {
        return this.competitionService.getAllCompetitions();
    }
    async getCompetition(id) {
        return this.competitionService.getCompetition(id);
    }
    async getCompetitionStats(id) {
        return this.competitionService.getCompetitionStats(id);
    }
    async createCompetition(dto) {
        return this.competitionService.createCompetition(dto);
    }
    async updateCompetition(id, dto) {
        return this.competitionService.updateCompetition(id, dto);
    }
    async updateStatus(id, status) {
        return this.competitionService.updateStatus(id, status);
    }
    async joinCompetition(userId, competitionId) {
        return this.competitionService.joinCompetition(userId, competitionId);
    }
};
exports.CompetitionController = CompetitionController;
__decorate([
    (0, common_1.Get)('active'),
    (0, swagger_1.ApiOperation)({ summary: 'Get active competition' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Active competition details' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CompetitionController.prototype, "getActiveCompetition", null);
__decorate([
    (0, common_1.Get)('active/stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Get active competition stats' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Competition statistics' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CompetitionController.prototype, "getActiveCompetitionStats", null);
__decorate([
    (0, common_1.Get)('active/settings'),
    (0, common_1.UseGuards)(auth_guards_1.JwtAuthGuard, auth_guards_1.RolesGuard),
    (0, auth_guards_1.Roles)('admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get active competition settings (admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Competition settings' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CompetitionController.prototype, "getActiveCompetitionSettings", null);
__decorate([
    (0, common_1.Patch)('active/settings'),
    (0, common_1.UseGuards)(auth_guards_1.JwtAuthGuard, auth_guards_1.RolesGuard),
    (0, auth_guards_1.Roles)('admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update active competition settings (admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Competition settings updated' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [competition_dto_1.UpdateCompetitionDto]),
    __metadata("design:returntype", Promise)
], CompetitionController.prototype, "updateActiveCompetitionSettings", null);
__decorate([
    (0, common_1.Post)('active/start'),
    (0, common_1.UseGuards)(auth_guards_1.JwtAuthGuard, auth_guards_1.RolesGuard),
    (0, auth_guards_1.Roles)('admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Start active competition (admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Competition started' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CompetitionController.prototype, "startActiveCompetition", null);
__decorate([
    (0, common_1.Post)('active/pause'),
    (0, common_1.UseGuards)(auth_guards_1.JwtAuthGuard, auth_guards_1.RolesGuard),
    (0, auth_guards_1.Roles)('admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Pause active competition (admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Competition paused' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CompetitionController.prototype, "pauseActiveCompetition", null);
__decorate([
    (0, common_1.Post)('active/end'),
    (0, common_1.UseGuards)(auth_guards_1.JwtAuthGuard, auth_guards_1.RolesGuard),
    (0, auth_guards_1.Roles)('admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'End active competition (admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Competition ended' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CompetitionController.prototype, "endActiveCompetition", null);
__decorate([
    (0, common_1.Post)('active/reset'),
    (0, common_1.UseGuards)(auth_guards_1.JwtAuthGuard, auth_guards_1.RolesGuard),
    (0, auth_guards_1.Roles)('admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Reset active competition (admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Competition reset' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CompetitionController.prototype, "resetActiveCompetition", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(auth_guards_1.JwtAuthGuard, auth_guards_1.RolesGuard),
    (0, auth_guards_1.Roles)('admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all competitions (admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of competitions' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CompetitionController.prototype, "getAllCompetitions", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get competition by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Competition details' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CompetitionController.prototype, "getCompetition", null);
__decorate([
    (0, common_1.Get)(':id/stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Get competition stats' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Competition statistics' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CompetitionController.prototype, "getCompetitionStats", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(auth_guards_1.JwtAuthGuard, auth_guards_1.RolesGuard),
    (0, auth_guards_1.Roles)('admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create new competition (admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Competition created' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [competition_dto_1.CreateCompetitionDto]),
    __metadata("design:returntype", Promise)
], CompetitionController.prototype, "createCompetition", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(auth_guards_1.JwtAuthGuard, auth_guards_1.RolesGuard),
    (0, auth_guards_1.Roles)('admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update competition (admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Competition updated' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, competition_dto_1.UpdateCompetitionDto]),
    __metadata("design:returntype", Promise)
], CompetitionController.prototype, "updateCompetition", null);
__decorate([
    (0, common_1.Post)(':id/status/:status'),
    (0, common_1.UseGuards)(auth_guards_1.JwtAuthGuard, auth_guards_1.RolesGuard),
    (0, auth_guards_1.Roles)('admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update competition status (admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Status updated' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CompetitionController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Post)(':id/join'),
    (0, common_1.UseGuards)(auth_guards_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Join competition' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Successfully joined' }),
    __param(0, (0, auth_guards_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CompetitionController.prototype, "joinCompetition", null);
exports.CompetitionController = CompetitionController = __decorate([
    (0, swagger_1.ApiTags)('competition'),
    (0, common_1.Controller)('competition'),
    __metadata("design:paramtypes", [competition_service_1.CompetitionService])
], CompetitionController);
//# sourceMappingURL=competition.controller.js.map