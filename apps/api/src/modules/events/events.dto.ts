// ============================================================
// Bullish Battle - Events DTOs
// ============================================================

import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsBoolean, IsOptional, IsArray, IsEnum, IsDateString, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

// Per-symbol impact definition
export class SymbolImpactDto {
    @ApiProperty({ example: 'symbol-uuid', description: 'Symbol ID' })
    @IsString()
    symbolId: string;

    @ApiProperty({ example: 12, description: 'Expected impact percentage for this symbol' })
    @IsNumber()
    expectedImpact: number;
}

export class CreateEventDto {
    @ApiProperty({ example: 'Government Infrastructure & Banking Reform Policy' })
    @IsString()
    title: string;

    @ApiProperty({ required: false, example: 'Strongly positive for Commercial Banks...' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ enum: ['positive', 'negative', 'neutral'] })
    @IsEnum(['positive', 'negative', 'neutral'])
    impactType: 'positive' | 'negative' | 'neutral';

    @ApiProperty({
        enum: ['percentage', 'absolute', 'override'],
        description: 'How to apply the magnitude: percentage change, absolute change, or override price'
    })
    @IsEnum(['percentage', 'absolute', 'override'])
    priceUpdateType: 'percentage' | 'absolute' | 'override';

    @ApiProperty({
        example: 5.0,
        description: 'Default magnitude of change (used when symbolImpacts not specified)'
    })
    @IsNumber()
    magnitude: number;

    @ApiProperty({
        required: false,
        description: 'Array of symbol IDs to affect',
        type: [String]
    })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    affectedSymbols?: string[];

    @ApiProperty({
        required: false,
        description: 'Per-symbol expected impact percentages (e.g., HUBL: +12%, EPBL: +10%)',
        example: { 'symbol-uuid-1': 12, 'symbol-uuid-2': 10, 'symbol-uuid-3': 8 }
    })
    @IsOptional()
    @IsObject()
    symbolImpacts?: Record<string, number>;

    @ApiProperty({
        required: false,
        default: false,
        description: 'If true, affects all active symbols (market-wide event)'
    })
    @IsOptional()
    @IsBoolean()
    affectAllSymbols?: boolean;

    @ApiProperty({
        required: false,
        description: 'Schedule execution for a future time (ISO string)'
    })
    @IsOptional()
    @IsDateString()
    scheduledAt?: string;

    @ApiProperty({
        required: false,
        default: false,
        description: 'Execute immediately upon creation'
    })
    @IsOptional()
    @IsBoolean()
    executeNow?: boolean;
}

export class UpdateEventDto {
    @ApiProperty({ required: false, example: 'Government Infrastructure & Banking Reform Policy' })
    @IsOptional()
    @IsString()
    title?: string;

    @ApiProperty({ required: false, example: 'Strongly positive for Commercial Banks...' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ required: false, enum: ['positive', 'negative', 'neutral'] })
    @IsOptional()
    @IsEnum(['positive', 'negative', 'neutral'])
    impactType?: 'positive' | 'negative' | 'neutral';

    @ApiProperty({
        required: false,
        enum: ['percentage', 'absolute', 'override'],
    })
    @IsOptional()
    @IsEnum(['percentage', 'absolute', 'override'])
    priceUpdateType?: 'percentage' | 'absolute' | 'override';

    @ApiProperty({ required: false, example: 5.0 })
    @IsOptional()
    @IsNumber()
    magnitude?: number;

    @ApiProperty({ required: false, type: [String] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    affectedSymbols?: string[];

    @ApiProperty({
        required: false,
        description: 'Per-symbol expected impact percentages',
        example: { 'symbol-uuid-1': 12, 'symbol-uuid-2': 10 }
    })
    @IsOptional()
    @IsObject()
    symbolImpacts?: Record<string, number>;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsBoolean()
    affectAllSymbols?: boolean;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsDateString()
    scheduledAt?: string;
}

export class EventExampleDto {
    @ApiProperty()
    example: string;

    @ApiProperty()
    title: string;

    @ApiProperty()
    description: string;

    @ApiProperty()
    request: CreateEventDto;
}
