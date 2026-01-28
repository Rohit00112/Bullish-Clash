// ============================================================
// Bullish Clash - Competition DTOs
// ============================================================

import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsBoolean, IsOptional, IsDateString, IsEnum, Min, Max } from 'class-validator';

export class CreateCompetitionDto {
    @ApiProperty({ example: 'Bullish Clash Championship 2026' })
    @IsString()
    name: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ example: 1000000, description: 'Starting cash in NPR' })
    @IsNumber()
    @Min(1000)
    startingCash: number;

    @ApiProperty({ example: 0.004, description: 'Commission rate (0.004 = 0.4%)' })
    @IsNumber()
    @Min(0)
    @Max(0.1)
    commissionRate: number;

    @ApiProperty({ required: false, description: 'Maximum position size per stock (NPR)' })
    @IsOptional()
    @IsNumber()
    maxPositionSize?: number;

    @ApiProperty({ required: false, description: 'Maximum trades per day' })
    @IsOptional()
    @IsNumber()
    maxDailyTrades?: number;

    @ApiProperty({ required: false, default: false })
    @IsOptional()
    @IsBoolean()
    allowShortSelling?: boolean;

    @ApiProperty({ required: false, default: false })
    @IsOptional()
    @IsBoolean()
    allowMargin?: boolean;

    @ApiProperty({ example: '2026-01-21T10:00:00+05:45' })
    @IsDateString()
    startTime: string;

    @ApiProperty({ example: '2026-01-28T16:00:00+05:45' })
    @IsDateString()
    endTime: string;

    @ApiProperty({ required: false, example: '11:00', description: 'Trading hours start time (HH:mm)' })
    @IsOptional()
    @IsString()
    tradingHoursStart?: string;

    @ApiProperty({ required: false, example: '15:00', description: 'Trading hours end time (HH:mm)' })
    @IsOptional()
    @IsString()
    tradingHoursEnd?: string;

    @ApiProperty({ required: false, default: false })
    @IsOptional()
    @IsBoolean()
    isDefault?: boolean;

    @ApiProperty({ required: false, default: false })
    @IsOptional()
    @IsBoolean()
    isLeaderboardHidden?: boolean;
}

export class UpdateCompetitionDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ required: false, enum: ['draft', 'scheduled', 'active', 'paused', 'ended', 'remarks'] })
    @IsOptional()
    @IsEnum(['draft', 'scheduled', 'active', 'paused', 'ended', 'remarks'])
    status?: 'draft' | 'scheduled' | 'active' | 'paused' | 'ended' | 'remarks';

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    startingCash?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    commissionRate?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    maxPositionSize?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    maxDailyTrades?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsBoolean()
    allowShortSelling?: boolean;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsBoolean()
    allowMargin?: boolean;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsDateString()
    startTime?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsDateString()
    endTime?: string;

    @ApiProperty({ required: false, example: '11:00', description: 'Trading hours start time (HH:mm)' })
    @IsOptional()
    @IsString()
    tradingHoursStart?: string;

    @ApiProperty({ required: false, example: '15:00', description: 'Trading hours end time (HH:mm)' })
    @IsOptional()
    @IsString()
    tradingHoursEnd?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsBoolean()
    isDefault?: boolean;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsBoolean()
    isLeaderboardHidden?: boolean;
}
