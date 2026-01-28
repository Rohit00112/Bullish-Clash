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
exports.UpdateCompetitionDto = exports.CreateCompetitionDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateCompetitionDto {
    name;
    description;
    startingCash;
    commissionRate;
    maxPositionSize;
    maxDailyTrades;
    allowShortSelling;
    allowMargin;
    startTime;
    endTime;
    tradingHoursStart;
    tradingHoursEnd;
    isDefault;
    isLeaderboardHidden;
}
exports.CreateCompetitionDto = CreateCompetitionDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Bullish Clash Championship 2026' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCompetitionDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCompetitionDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1000000, description: 'Starting cash in NPR' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1000),
    __metadata("design:type", Number)
], CreateCompetitionDto.prototype, "startingCash", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0.004, description: 'Commission rate (0.004 = 0.4%)' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(0.1),
    __metadata("design:type", Number)
], CreateCompetitionDto.prototype, "commissionRate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: 'Maximum position size per stock (NPR)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateCompetitionDto.prototype, "maxPositionSize", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: 'Maximum trades per day' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateCompetitionDto.prototype, "maxDailyTrades", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, default: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateCompetitionDto.prototype, "allowShortSelling", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, default: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateCompetitionDto.prototype, "allowMargin", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-01-21T10:00:00+05:45' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateCompetitionDto.prototype, "startTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-01-28T16:00:00+05:45' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateCompetitionDto.prototype, "endTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: '11:00', description: 'Trading hours start time (HH:mm)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCompetitionDto.prototype, "tradingHoursStart", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: '15:00', description: 'Trading hours end time (HH:mm)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCompetitionDto.prototype, "tradingHoursEnd", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, default: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateCompetitionDto.prototype, "isDefault", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, default: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateCompetitionDto.prototype, "isLeaderboardHidden", void 0);
class UpdateCompetitionDto {
    name;
    description;
    status;
    startingCash;
    commissionRate;
    maxPositionSize;
    maxDailyTrades;
    allowShortSelling;
    allowMargin;
    startTime;
    endTime;
    tradingHoursStart;
    tradingHoursEnd;
    isDefault;
    isLeaderboardHidden;
}
exports.UpdateCompetitionDto = UpdateCompetitionDto;
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateCompetitionDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateCompetitionDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, enum: ['draft', 'scheduled', 'active', 'paused', 'ended', 'remarks'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['draft', 'scheduled', 'active', 'paused', 'ended', 'remarks']),
    __metadata("design:type", String)
], UpdateCompetitionDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateCompetitionDto.prototype, "startingCash", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateCompetitionDto.prototype, "commissionRate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateCompetitionDto.prototype, "maxPositionSize", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateCompetitionDto.prototype, "maxDailyTrades", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateCompetitionDto.prototype, "allowShortSelling", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateCompetitionDto.prototype, "allowMargin", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpdateCompetitionDto.prototype, "startTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpdateCompetitionDto.prototype, "endTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: '11:00', description: 'Trading hours start time (HH:mm)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateCompetitionDto.prototype, "tradingHoursStart", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: '15:00', description: 'Trading hours end time (HH:mm)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateCompetitionDto.prototype, "tradingHoursEnd", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateCompetitionDto.prototype, "isDefault", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateCompetitionDto.prototype, "isLeaderboardHidden", void 0);
//# sourceMappingURL=competition.dto.js.map