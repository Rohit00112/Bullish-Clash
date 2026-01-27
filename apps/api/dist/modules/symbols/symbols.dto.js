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
exports.UpdateSymbolDto = exports.CreateSymbolDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const SECTORS = [
    'Commercial Bank',
    'Development Bank',
    'Finance',
    'Microfinance',
    'Life Insurance',
    'Non Life Insurance',
    'Hydropower',
    'Manufacturing',
    'Hotel',
    'Trading',
    'Others',
];
class CreateSymbolDto {
    symbol;
    companyName;
    sector;
    basePrice;
    listedShares;
    logoUrl;
}
exports.CreateSymbolDto = CreateSymbolDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'NABIL' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSymbolDto.prototype, "symbol", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Nabil Bank Limited' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSymbolDto.prototype, "companyName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Commercial Bank', enum: SECTORS }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSymbolDto.prototype, "sector", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1000, description: 'Base/initial price' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0.01),
    __metadata("design:type", Number)
], CreateSymbolDto.prototype, "basePrice", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: 80000000 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateSymbolDto.prototype, "listedShares", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSymbolDto.prototype, "logoUrl", void 0);
class UpdateSymbolDto {
    companyName;
    sector;
    listedShares;
    logoUrl;
    isActive;
}
exports.UpdateSymbolDto = UpdateSymbolDto;
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateSymbolDto.prototype, "companyName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, enum: SECTORS }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateSymbolDto.prototype, "sector", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateSymbolDto.prototype, "listedShares", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateSymbolDto.prototype, "logoUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateSymbolDto.prototype, "isActive", void 0);
//# sourceMappingURL=symbols.dto.js.map