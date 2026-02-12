// ============================================================
// Bullish Battle - Quarterly Reports DTOs
// ============================================================

import { IsString, IsOptional, IsNumber, IsEnum, IsBoolean, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBankReportDto {
    @ApiProperty() @IsString() symbolId: string;
    @ApiProperty() @IsString() fiscalYear: string;
    @ApiProperty({ enum: ['Q1', 'Q2', 'Q3', 'Q4'] }) @IsEnum(['Q1', 'Q2', 'Q3', 'Q4']) quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';

    // Key Indicators
    @ApiPropertyOptional() @IsOptional() @IsNumber() returnOnEquity?: number;
    @ApiPropertyOptional() @IsOptional() @IsNumber() nonPerformingLoan?: number;
    @ApiPropertyOptional() @IsOptional() @IsNumber() netInterestMargin?: number;
    @ApiPropertyOptional() @IsOptional() @IsNumber() returnOnAssets?: number;

    // Financial
    @ApiPropertyOptional() @IsOptional() @IsNumber() revenue?: number;
    @ApiPropertyOptional() @IsOptional() @IsNumber() grossProfit?: number;
    @ApiPropertyOptional() @IsOptional() @IsNumber() netProfit?: number;
    @ApiPropertyOptional() @IsOptional() @IsNumber() earningsPerShare?: number;
}

export class CreateHydropowerReportDto {
    @ApiProperty() @IsString() symbolId: string;
    @ApiProperty() @IsString() fiscalYear: string;
    @ApiProperty({ enum: ['Q1', 'Q2', 'Q3', 'Q4'] }) @IsEnum(['Q1', 'Q2', 'Q3', 'Q4']) quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';

    // Key Indicators
    @ApiPropertyOptional() @IsOptional() @IsNumber() earningsPerShare?: number;
    @ApiPropertyOptional() @IsOptional() @IsNumber() capacityUtilization?: number;
    @ApiPropertyOptional() @IsOptional() @IsNumber() debtToEquity?: number;
    @ApiPropertyOptional() @IsOptional() @IsNumber() ebitdaMargin?: number;

    // Financial
    @ApiPropertyOptional() @IsOptional() @IsNumber() revenue?: number;
    @ApiPropertyOptional() @IsOptional() @IsNumber() grossProfit?: number;
    @ApiPropertyOptional() @IsOptional() @IsNumber() netProfit?: number;
    @ApiPropertyOptional() @IsOptional() @IsNumber() generationMWh?: number;
}

export class CreateGenericReportDto {
    @ApiProperty() @IsString() symbolId: string;
    @ApiProperty() @IsString() fiscalYear: string;
    @ApiProperty({ enum: ['Q1', 'Q2', 'Q3', 'Q4'] }) @IsEnum(['Q1', 'Q2', 'Q3', 'Q4']) quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';

    // Financial
    @ApiPropertyOptional() @IsOptional() @IsNumber() revenue?: number;
    @ApiPropertyOptional() @IsOptional() @IsNumber() grossProfit?: number;
    @ApiPropertyOptional() @IsOptional() @IsNumber() netProfit?: number;
    @ApiPropertyOptional() @IsOptional() @IsNumber() earningsPerShare?: number;

    // Ratios
    @ApiPropertyOptional() @IsOptional() @IsNumber() grossProfitMargin?: number;
    @ApiPropertyOptional() @IsOptional() @IsNumber() netProfitMargin?: number;
    @ApiPropertyOptional() @IsOptional() @IsNumber() returnOnEquity?: number;
    @ApiPropertyOptional() @IsOptional() @IsNumber() returnOnAssets?: number;
    @ApiPropertyOptional() @IsOptional() @IsNumber() debtToEquity?: number;
    @ApiPropertyOptional() @IsOptional() @IsNumber() currentRatio?: number;
}

// Unified DTO that wraps all three types
export class CreateQuarterlyReportDto {
    @ApiProperty({ enum: ['bank', 'hydropower', 'generic'] })
    @IsString()
    reportType: 'bank' | 'hydropower' | 'generic';

    @ApiProperty() @IsString() symbolId: string;
    @ApiProperty() @IsString() fiscalYear: string;
    @ApiProperty({ enum: ['Q1', 'Q2', 'Q3', 'Q4'] })
    @IsEnum(['Q1', 'Q2', 'Q3', 'Q4'])
    quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';

    // Common fields
    @ApiPropertyOptional() @IsOptional() @IsNumber() revenue?: number;
    @ApiPropertyOptional() @IsOptional() @IsNumber() grossProfit?: number;
    @ApiPropertyOptional() @IsOptional() @IsNumber() netProfit?: number;
    @ApiPropertyOptional() @IsOptional() @IsNumber() earningsPerShare?: number;

    // Bank-specific
    @ApiPropertyOptional() @IsOptional() @IsNumber() returnOnEquity?: number;
    @ApiPropertyOptional() @IsOptional() @IsNumber() nonPerformingLoan?: number;
    @ApiPropertyOptional() @IsOptional() @IsNumber() netInterestMargin?: number;
    @ApiPropertyOptional() @IsOptional() @IsNumber() returnOnAssets?: number;

    // Hydropower-specific
    @ApiPropertyOptional() @IsOptional() @IsNumber() capacityUtilization?: number;
    @ApiPropertyOptional() @IsOptional() @IsNumber() debtToEquity?: number;
    @ApiPropertyOptional() @IsOptional() @IsNumber() ebitdaMargin?: number;
    @ApiPropertyOptional() @IsOptional() @IsNumber() generationMWh?: number;

    // Generic-specific
    @ApiPropertyOptional() @IsOptional() @IsNumber() grossProfitMargin?: number;
    @ApiPropertyOptional() @IsOptional() @IsNumber() netProfitMargin?: number;
    @ApiPropertyOptional() @IsOptional() @IsNumber() currentRatio?: number;

    // Market Impact - works like events system
    @ApiPropertyOptional({ description: 'Price impact magnitude (e.g., 5.0 for +5%)' })
    @IsOptional() @IsNumber() impactMagnitude?: number;

    @ApiPropertyOptional({ enum: ['positive', 'negative', 'neutral'], description: 'Impact direction' })
    @IsOptional() @IsEnum(['positive', 'negative', 'neutral']) impactType?: 'positive' | 'negative' | 'neutral';

    @ApiPropertyOptional({ enum: ['percentage', 'absolute'], description: 'How to apply impact' })
    @IsOptional() @IsEnum(['percentage', 'absolute']) priceUpdateType?: 'percentage' | 'absolute';

    @ApiPropertyOptional({ description: 'Execute impact immediately on publish' })
    @IsOptional() @IsBoolean() executeNow?: boolean;

    @ApiPropertyOptional({ description: 'Schedule impact for later (ISO date string)' })
    @IsOptional() @IsDateString() scheduledAt?: string;
}
