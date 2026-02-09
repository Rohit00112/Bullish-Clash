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

    @ApiProperty({ required: false, example: 100, description: 'Floor price for bidding - participants cannot bid below this' })
    @IsOptional()
    @IsNumber()
    @Min(0.01)
    floorPrice?: number;

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

    @ApiProperty({ required: false, description: 'Floor price for bidding' })
    @IsOptional()
    @IsNumber()
    @Min(0.01)
    floorPrice?: number;

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

    @ApiProperty({ required: false, description: 'Whether symbol is tradeable (admin can list symbols manually)' })
    @IsOptional()
    @IsBoolean()
    isTradeable?: boolean;
}

// DTO for admin to manually list/delist symbols
export class ListSymbolDto {
    @ApiProperty({ example: true, description: 'Whether to list (true) or delist (false) the symbol' })
    @IsBoolean()
    isTradeable: boolean;
}
