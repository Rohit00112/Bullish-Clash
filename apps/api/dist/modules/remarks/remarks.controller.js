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
exports.RemarksController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const remarks_service_1 = require("./remarks.service");
const remarks_dto_1 = require("./remarks.dto");
const auth_guards_1 = require("../auth/auth.guards");
let RemarksController = class RemarksController {
    remarksService;
    constructor(remarksService) {
        this.remarksService = remarksService;
    }
    async createRemark(userId, dto) {
        return this.remarksService.createRemark(userId, dto);
    }
    async updateRemark(userId, remarkId, body) {
        return this.remarksService.updateRemark(userId, remarkId, body.content);
    }
    async getMyRemarks(userId) {
        return this.remarksService.getMyRemarks(userId);
    }
    async getAllRemarks(competitionId) {
        return this.remarksService.getAllRemarks(competitionId);
    }
    async scoreRemark(remarkId, body) {
        return this.remarksService.scoreRemark(remarkId, body.score);
    }
};
exports.RemarksController = RemarksController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(auth_guards_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Submit a remark/justification' }),
    __param(0, (0, auth_guards_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, remarks_dto_1.CreateRemarkDto]),
    __metadata("design:returntype", Promise)
], RemarksController.prototype, "createRemark", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(auth_guards_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update a remark (User)' }),
    __param(0, (0, auth_guards_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], RemarksController.prototype, "updateRemark", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, common_1.UseGuards)(auth_guards_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get my remarks for current competition' }),
    __param(0, (0, auth_guards_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RemarksController.prototype, "getMyRemarks", null);
__decorate([
    (0, common_1.Get)('competition/:id'),
    (0, common_1.UseGuards)(auth_guards_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all remarks for a competition (Admin)' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RemarksController.prototype, "getAllRemarks", null);
__decorate([
    (0, common_1.Patch)(':id/score'),
    (0, common_1.UseGuards)(auth_guards_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Score a remark (Admin)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RemarksController.prototype, "scoreRemark", null);
exports.RemarksController = RemarksController = __decorate([
    (0, swagger_1.ApiTags)('Remarks'),
    (0, common_1.Controller)('remarks'),
    __metadata("design:paramtypes", [remarks_service_1.RemarksService])
], RemarksController);
//# sourceMappingURL=remarks.controller.js.map