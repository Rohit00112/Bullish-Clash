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
exports.EventExampleDto = exports.UpdateEventDto = exports.CreateEventDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateEventDto {
    title;
    description;
    impactType;
    priceUpdateType;
    magnitude;
    affectedSymbols;
    affectAllSymbols;
    scheduledAt;
    executeNow;
}
exports.CreateEventDto = CreateEventDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'NABIL Q3 Earnings Beat Expectations' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateEventDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: 'NABIL reported 25% growth in net profit...' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateEventDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['positive', 'negative', 'neutral'] }),
    (0, class_validator_1.IsEnum)(['positive', 'negative', 'neutral']),
    __metadata("design:type", String)
], CreateEventDto.prototype, "impactType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: ['percentage', 'absolute', 'override'],
        description: 'How to apply the magnitude: percentage change, absolute change, or override price'
    }),
    (0, class_validator_1.IsEnum)(['percentage', 'absolute', 'override']),
    __metadata("design:type", String)
], CreateEventDto.prototype, "priceUpdateType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 5.0,
        description: 'The magnitude of change (e.g., 5.0 for +5% or +5 NPR depending on type)'
    }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateEventDto.prototype, "magnitude", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        description: 'Array of symbol IDs to affect',
        type: [String]
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateEventDto.prototype, "affectedSymbols", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        default: false,
        description: 'If true, affects all active symbols (market-wide event)'
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateEventDto.prototype, "affectAllSymbols", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        description: 'Schedule execution for a future time (ISO string)'
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateEventDto.prototype, "scheduledAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        default: false,
        description: 'Execute immediately upon creation'
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateEventDto.prototype, "executeNow", void 0);
class UpdateEventDto {
    title;
    description;
    impactType;
    priceUpdateType;
    magnitude;
    affectedSymbols;
    affectAllSymbols;
    scheduledAt;
}
exports.UpdateEventDto = UpdateEventDto;
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: 'NABIL Q3 Earnings Beat Expectations' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateEventDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: 'NABIL reported 25% growth in net profit...' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateEventDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, enum: ['positive', 'negative', 'neutral'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['positive', 'negative', 'neutral']),
    __metadata("design:type", String)
], UpdateEventDto.prototype, "impactType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        enum: ['percentage', 'absolute', 'override'],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['percentage', 'absolute', 'override']),
    __metadata("design:type", String)
], UpdateEventDto.prototype, "priceUpdateType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: 5.0 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateEventDto.prototype, "magnitude", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, type: [String] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], UpdateEventDto.prototype, "affectedSymbols", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateEventDto.prototype, "affectAllSymbols", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpdateEventDto.prototype, "scheduledAt", void 0);
class EventExampleDto {
    example;
    title;
    description;
    request;
}
exports.EventExampleDto = EventExampleDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], EventExampleDto.prototype, "example", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], EventExampleDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], EventExampleDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", CreateEventDto)
], EventExampleDto.prototype, "request", void 0);
//# sourceMappingURL=events.dto.js.map