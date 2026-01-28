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
exports.BiddingController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const bidding_service_1 = require("./bidding.service");
const auth_guards_1 = require("../auth/auth.guards");
const bidding_dto_1 = require("./bidding.dto");
let BiddingController = class BiddingController {
    biddingService;
    constructor(biddingService) {
        this.biddingService = biddingService;
    }
    async placeBid(userId, dto) {
        return this.biddingService.placeBid(userId, dto);
    }
    async getMyBids(userId) {
        return this.biddingService.getMyBids(userId);
    }
    async processBids(competitionId) {
        return this.biddingService.processBids(competitionId);
    }
};
exports.BiddingController = BiddingController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(auth_guards_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Place a bid (during Bidding Phase)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Bid placed successfully' }),
    __param(0, (0, auth_guards_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, bidding_dto_1.PlaceBidDto]),
    __metadata("design:returntype", Promise)
], BiddingController.prototype, "placeBid", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, common_1.UseGuards)(auth_guards_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get my bids' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: [bidding_dto_1.BidResponseDto] }),
    __param(0, (0, auth_guards_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BiddingController.prototype, "getMyBids", null);
__decorate([
    (0, common_1.Post)('process/:competitionId'),
    (0, common_1.UseGuards)(auth_guards_1.JwtAuthGuard, auth_guards_1.RolesGuard),
    (0, auth_guards_1.Roles)('admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Process bids and allocate holdings (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Bids processed' }),
    __param(0, (0, common_1.Param)('competitionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BiddingController.prototype, "processBids", null);
exports.BiddingController = BiddingController = __decorate([
    (0, swagger_1.ApiTags)('bidding'),
    (0, common_1.Controller)('bidding'),
    __metadata("design:paramtypes", [bidding_service_1.BiddingService])
], BiddingController);
//# sourceMappingURL=bidding.controller.js.map