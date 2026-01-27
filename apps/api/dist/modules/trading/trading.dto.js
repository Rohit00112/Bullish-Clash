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
exports.OrderBookDto = exports.OrderResponseDto = exports.EditOrderDto = exports.CancelOrderDto = exports.PlaceOrderDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class PlaceOrderDto {
    symbolId;
    side;
    type;
    quantity;
    price;
}
exports.PlaceOrderDto = PlaceOrderDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Symbol ID to trade' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PlaceOrderDto.prototype, "symbolId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['buy', 'sell'] }),
    (0, class_validator_1.IsEnum)(['buy', 'sell']),
    __metadata("design:type", String)
], PlaceOrderDto.prototype, "side", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['market', 'limit'], default: 'market' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['market', 'limit']),
    __metadata("design:type", String)
], PlaceOrderDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 100, description: 'Number of shares' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(1000000),
    __metadata("design:type", Number)
], PlaceOrderDto.prototype, "quantity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1500.00, description: 'Limit price (required for limit orders)', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0.01),
    __metadata("design:type", Number)
], PlaceOrderDto.prototype, "price", void 0);
class CancelOrderDto {
    orderId;
}
exports.CancelOrderDto = CancelOrderDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Order ID to cancel' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CancelOrderDto.prototype, "orderId", void 0);
class EditOrderDto {
    orderId;
    price;
    quantity;
}
exports.EditOrderDto = EditOrderDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Order ID to edit' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EditOrderDto.prototype, "orderId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1500.00, description: 'New limit price', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0.01),
    __metadata("design:type", Number)
], EditOrderDto.prototype, "price", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 100, description: 'New quantity', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(1000000),
    __metadata("design:type", Number)
], EditOrderDto.prototype, "quantity", void 0);
class OrderResponseDto {
    order;
    trade;
    trades;
    message;
}
exports.OrderResponseDto = OrderResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Object)
], OrderResponseDto.prototype, "order", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Object)
], OrderResponseDto.prototype, "trade", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Array)
], OrderResponseDto.prototype, "trades", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], OrderResponseDto.prototype, "message", void 0);
class OrderBookDto {
    bids;
    asks;
    lastPrice;
    spread;
    spreadPercent;
}
exports.OrderBookDto = OrderBookDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Array)
], OrderBookDto.prototype, "bids", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Array)
], OrderBookDto.prototype, "asks", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], OrderBookDto.prototype, "lastPrice", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], OrderBookDto.prototype, "spread", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], OrderBookDto.prototype, "spreadPercent", void 0);
//# sourceMappingURL=trading.dto.js.map