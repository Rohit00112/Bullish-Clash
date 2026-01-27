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
exports.TradingController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const trading_service_1 = require("./trading.service");
const trading_dto_1 = require("./trading.dto");
const auth_guards_1 = require("../auth/auth.guards");
const throttler_1 = require("@nestjs/throttler");
let TradingController = class TradingController {
    tradingService;
    constructor(tradingService) {
        this.tradingService = tradingService;
    }
    async placeOrder(userId, dto) {
        return this.tradingService.placeOrder(userId, dto);
    }
    async cancelOrder(userId, dto) {
        return this.tradingService.cancelOrder(userId, dto);
    }
    async editOrder(userId, dto) {
        return this.tradingService.editOrder(userId, dto);
    }
    async getOrderBook(symbolId) {
        return this.tradingService.getOrderBook(symbolId);
    }
    async getOpenOrders(userId) {
        return this.tradingService.getOpenOrders(userId);
    }
    async getOrders(userId, status, limit) {
        return this.tradingService.getOrders(userId, { status, limit });
    }
    async getTrades(userId, limit) {
        return this.tradingService.getTrades(userId, { limit: limit ? Number(limit) : 100 });
    }
    async getTradesDebug(userId) {
        return this.tradingService.getTradesRaw(userId);
    }
};
exports.TradingController = TradingController;
__decorate([
    (0, common_1.Post)('order'),
    (0, common_1.UseGuards)(auth_guards_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, throttler_1.Throttle)({ default: { limit: 30, ttl: 60000 } }),
    (0, swagger_1.ApiOperation)({ summary: 'Place a market or limit order' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Order executed or placed', type: trading_dto_1.OrderResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Validation error or insufficient funds/shares' }),
    __param(0, (0, auth_guards_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, trading_dto_1.PlaceOrderDto]),
    __metadata("design:returntype", Promise)
], TradingController.prototype, "placeOrder", null);
__decorate([
    (0, common_1.Post)('order/cancel'),
    (0, common_1.UseGuards)(auth_guards_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Cancel an open order' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Order cancelled' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Order not found or cannot be cancelled' }),
    __param(0, (0, auth_guards_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, trading_dto_1.CancelOrderDto]),
    __metadata("design:returntype", Promise)
], TradingController.prototype, "cancelOrder", null);
__decorate([
    (0, common_1.Post)('order/edit'),
    (0, common_1.UseGuards)(auth_guards_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, throttler_1.Throttle)({ default: { limit: 30, ttl: 60000 } }),
    (0, swagger_1.ApiOperation)({ summary: 'Edit an open limit order' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Order updated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Order not found or cannot be edited' }),
    __param(0, (0, auth_guards_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, trading_dto_1.EditOrderDto]),
    __metadata("design:returntype", Promise)
], TradingController.prototype, "editOrder", null);
__decorate([
    (0, common_1.Get)('orderbook/:symbolId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get order book for a symbol' }),
    (0, swagger_1.ApiParam)({ name: 'symbolId', description: 'Symbol ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Order book with bids and asks', type: trading_dto_1.OrderBookDto }),
    __param(0, (0, common_1.Param)('symbolId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TradingController.prototype, "getOrderBook", null);
__decorate([
    (0, common_1.Get)('orders/open'),
    (0, common_1.UseGuards)(auth_guards_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get user open orders' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of open orders' }),
    __param(0, (0, auth_guards_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TradingController.prototype, "getOpenOrders", null);
__decorate([
    (0, common_1.Get)('orders'),
    (0, common_1.UseGuards)(auth_guards_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get user orders' }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, enum: ['pending', 'open', 'filled', 'partial', 'cancelled', 'rejected', 'expired'] }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of orders' }),
    __param(0, (0, auth_guards_1.CurrentUser)('id')),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number]),
    __metadata("design:returntype", Promise)
], TradingController.prototype, "getOrders", null);
__decorate([
    (0, common_1.Get)('trades'),
    (0, common_1.UseGuards)(auth_guards_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get user trade history' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of trades' }),
    __param(0, (0, auth_guards_1.CurrentUser)('id')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], TradingController.prototype, "getTrades", null);
__decorate([
    (0, common_1.Get)('trades/debug'),
    (0, common_1.UseGuards)(auth_guards_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Debug: Get raw trade history' }),
    __param(0, (0, auth_guards_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TradingController.prototype, "getTradesDebug", null);
exports.TradingController = TradingController = __decorate([
    (0, swagger_1.ApiTags)('trading'),
    (0, common_1.Controller)('trading'),
    __metadata("design:paramtypes", [trading_service_1.TradingService])
], TradingController);
//# sourceMappingURL=trading.controller.js.map