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
exports.WatchlistController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const watchlist_service_1 = require("./watchlist.service");
const auth_guards_1 = require("../auth/auth.guards");
const class_validator_1 = require("class-validator");
const swagger_2 = require("@nestjs/swagger");
class AddToWatchlistDto {
    symbolId;
}
__decorate([
    (0, swagger_2.ApiProperty)({ description: 'Symbol ID to add to watchlist' }),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], AddToWatchlistDto.prototype, "symbolId", void 0);
let WatchlistController = class WatchlistController {
    watchlistService;
    constructor(watchlistService) {
        this.watchlistService = watchlistService;
    }
    async getWatchlist(userId) {
        return this.watchlistService.getWatchlist(userId);
    }
    async addToWatchlist(userId, dto) {
        return this.watchlistService.addToWatchlist(userId, dto.symbolId);
    }
    async removeFromWatchlist(userId, symbolId) {
        return this.watchlistService.removeFromWatchlist(userId, symbolId);
    }
    async isInWatchlist(userId, symbolId) {
        const inWatchlist = await this.watchlistService.isInWatchlist(userId, symbolId);
        return { inWatchlist };
    }
};
exports.WatchlistController = WatchlistController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(auth_guards_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get user watchlist' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User watchlist with current prices' }),
    __param(0, (0, auth_guards_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WatchlistController.prototype, "getWatchlist", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(auth_guards_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Add symbol to watchlist' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Symbol added to watchlist' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Symbol not found or already in watchlist' }),
    __param(0, (0, auth_guards_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, AddToWatchlistDto]),
    __metadata("design:returntype", Promise)
], WatchlistController.prototype, "addToWatchlist", null);
__decorate([
    (0, common_1.Delete)(':symbolId'),
    (0, common_1.UseGuards)(auth_guards_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Remove symbol from watchlist' }),
    (0, swagger_1.ApiParam)({ name: 'symbolId', description: 'Symbol ID to remove' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Symbol removed from watchlist' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Symbol not in watchlist' }),
    __param(0, (0, auth_guards_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('symbolId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], WatchlistController.prototype, "removeFromWatchlist", null);
__decorate([
    (0, common_1.Get)(':symbolId/check'),
    (0, common_1.UseGuards)(auth_guards_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Check if symbol is in watchlist' }),
    (0, swagger_1.ApiParam)({ name: 'symbolId', description: 'Symbol ID to check' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Returns whether symbol is in watchlist' }),
    __param(0, (0, auth_guards_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('symbolId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], WatchlistController.prototype, "isInWatchlist", null);
exports.WatchlistController = WatchlistController = __decorate([
    (0, swagger_1.ApiTags)('watchlist'),
    (0, common_1.Controller)('watchlist'),
    __metadata("design:paramtypes", [watchlist_service_1.WatchlistService])
], WatchlistController);
//# sourceMappingURL=watchlist.controller.js.map