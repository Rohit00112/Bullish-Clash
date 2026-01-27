// ============================================================
// Bullish Clash - Events DTOs
// ============================================================

import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsBoolean, IsOptional, IsArray, IsEnum, IsDateString } from 'class-validator';

export class CreateEventDto {
    @ApiProperty({ example: 'NABIL Q3 Earnings Beat Expectations' })
    @IsString()
    title: string;

    @ApiProperty({ required: false, example: 'NABIL reported 25% growth in net profit...' })
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
        description: 'The magnitude of change (e.g., 5.0 for +5% or +5 NPR depending on type)'
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
    @ApiProperty({ required: false, example: 'NABIL Q3 Earnings Beat Expectations' })
    @IsOptional()
    @IsString()
    title?: string;

    @ApiProperty({ required: false, example: 'NABIL reported 25% growth in net profit...' })
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
