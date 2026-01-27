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
exports.PortfolioController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const portfolio_service_1 = require("./portfolio.service");
const auth_guards_1 = require("../auth/auth.guards");
let PortfolioController = class PortfolioController {
    portfolioService;
    constructor(portfolioService) {
        this.portfolioService = portfolioService;
    }
    async getPortfolio(userId) {
        return this.portfolioService.getPortfolio(userId);
    }
    async getPortfolioSummary(userId) {
        return this.portfolioService.getPortfolioSummary(userId);
    }
    async getHoldings(userId) {
        return this.portfolioService.getHoldings(userId);
    }
};
exports.PortfolioController = PortfolioController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get complete portfolio with positions' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Portfolio details with all positions' }),
    __param(0, (0, auth_guards_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PortfolioController.prototype, "getPortfolio", null);
__decorate([
    (0, common_1.Get)('summary'),
    (0, swagger_1.ApiOperation)({ summary: 'Get portfolio summary' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Quick portfolio overview' }),
    __param(0, (0, auth_guards_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PortfolioController.prototype, "getPortfolioSummary", null);
__decorate([
    (0, common_1.Get)('holdings'),
    (0, swagger_1.ApiOperation)({ summary: 'Get current holdings/positions' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of current positions' }),
    __param(0, (0, auth_guards_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PortfolioController.prototype, "getHoldings", null);
exports.PortfolioController = PortfolioController = __decorate([
    (0, swagger_1.ApiTags)('portfolio'),
    (0, common_1.Controller)('portfolio'),
    (0, common_1.UseGuards)(auth_guards_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [portfolio_service_1.PortfolioService])
], PortfolioController);
//# sourceMappingURL=portfolio.controller.js.map