// ============================================================
// Bullish Clash - Symbols DTOs
// ============================================================

import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsBoolean, Min, Max, IsEnum } from 'class-validator';

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
] as const;

export class CreateSymbolDto {
    @ApiProperty({ example: 'NABIL' })
    @IsString()
    symbol: string;

    @ApiProperty({ example: 'Nabil Bank Limited' })
    @IsString()
    companyName: string;

    @ApiProperty({ example: 'Commercial Bank', enum: SECTORS })
    @IsString()
    sector: string;

    @ApiProperty({ example: 1000, description: 'Base/initial price' })
    @IsNumber()
    @Min(0.01)
    basePrice: number;

    @ApiProperty({ required: false, example: 80000000 })
    @IsOptional()
    @IsNumber()
    listedShares?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    logoUrl?: string;
}

export class UpdateSymbolDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    symbol?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    companyName?: string;

    @ApiProperty({ required: false, enum: SECTORS })
    @IsOptional()
    @IsString()
    sector?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    @Min(0.01)
    basePrice?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    listedShares?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    logoUrl?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
