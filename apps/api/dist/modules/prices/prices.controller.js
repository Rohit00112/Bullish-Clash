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
exports.PricesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const prices_service_1 = require("./prices.service");
const auth_guards_1 = require("../auth/auth.guards");
let PricesController = class PricesController {
    pricesService;
    constructor(pricesService) {
        this.pricesService = pricesService;
    }
    async getAllLatestPrices() {
        return this.pricesService.getAllLatestPrices();
    }
    async getLatestPrice(symbolId) {
        return this.pricesService.getLatestPrice(symbolId);
    }
    async getPriceHistory(symbolId, from, to, limit) {
        return this.pricesService.getPriceHistory(symbolId, {
            from: from ? new Date(from) : undefined,
            to: to ? new Date(to) : undefined,
            limit,
        });
    }
    async getCandles(symbolId, interval, limit) {
        return this.pricesService.getCandles(symbolId, interval || '1m', limit || 100);
    }
    async updatePrice(body) {
        return this.pricesService.updatePrice({
            symbolId: body.symbolId,
            priceUpdateType: body.type.toLowerCase(),
            magnitude: body.change,
        });
    }
};
exports.PricesController = PricesController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all latest prices' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of latest prices for all symbols' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PricesController.prototype, "getAllLatestPrices", null);
__decorate([
    (0, common_1.Get)(':symbolId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get latest price for a symbol' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Latest price data' }),
    __param(0, (0, common_1.Param)('symbolId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PricesController.prototype, "getLatestPrice", null);
__decorate([
    (0, common_1.Get)(':symbolId/history'),
    (0, swagger_1.ApiOperation)({ summary: 'Get price history for a symbol' }),
    (0, swagger_1.ApiQuery)({ name: 'from', required: false, type: String, description: 'Start date (ISO string)' }),
    (0, swagger_1.ApiQuery)({ name: 'to', required: false, type: String, description: 'End date (ISO string)' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Price tick history' }),
    __param(0, (0, common_1.Param)('symbolId')),
    __param(1, (0, common_1.Query)('from')),
    __param(2, (0, common_1.Query)('to')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Number]),
    __metadata("design:returntype", Promise)
], PricesController.prototype, "getPriceHistory", null);
__decorate([
    (0, common_1.Get)(':symbolId/candles'),
    (0, swagger_1.ApiOperation)({ summary: 'Get OHLCV candles for a symbol' }),
    (0, swagger_1.ApiQuery)({ name: 'interval', required: false, description: 'Candle interval (1m, 5m, 15m, 1h, 1d)' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'OHLCV candles' }),
    __param(0, (0, common_1.Param)('symbolId')),
    __param(1, (0, common_1.Query)('interval')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number]),
    __metadata("design:returntype", Promise)
], PricesController.prototype, "getCandles", null);
__decorate([
    (0, common_1.Post)('update'),
    (0, common_1.UseGuards)(auth_guards_1.JwtAuthGuard, auth_guards_1.RolesGuard),
    (0, auth_guards_1.Roles)('admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update price for a symbol (admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Price updated' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PricesController.prototype, "updatePrice", null);
exports.PricesController = PricesController = __decorate([
    (0, swagger_1.ApiTags)('prices'),
    (0, common_1.Controller)('prices'),
    __metadata("design:paramtypes", [prices_service_1.PricesService])
], PricesController);
//# sourceMappingURL=prices.controller.js.map