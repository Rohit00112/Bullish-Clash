// ============================================================
// Bullish Clash - Trading DTOs
// ============================================================

import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsEnum, IsOptional, Min, Max } from 'class-validator';

export class PlaceOrderDto {
    @ApiProperty({ description: 'Symbol ID to trade' })
    @IsString()
    symbolId: string;

    @ApiProperty({ enum: ['buy', 'sell'] })
    @IsEnum(['buy', 'sell'])
    side: 'buy' | 'sell';

    @ApiProperty({ enum: ['market', 'limit'], default: 'market' })
    @IsOptional()
    @IsEnum(['market', 'limit'])
    type?: 'market' | 'limit';

    @ApiProperty({ example: 100, description: 'Number of shares' })
    @IsNumber()
    @Min(1)
    @Max(1000000)
    quantity: number;

    @ApiProperty({ example: 1500.00, description: 'Limit price (required for limit orders)', required: false })
    @IsOptional()
    @IsNumber()
    @Min(0.01)
    price?: number;
}

export class CancelOrderDto {
    @ApiProperty({ description: 'Order ID to cancel' })
    @IsString()
    orderId: string;
}

export class EditOrderDto {
    @ApiProperty({ description: 'Order ID to edit' })
    @IsString()
    orderId: string;

    @ApiProperty({ example: 1500.00, description: 'New limit price', required: false })
    @IsOptional()
    @IsNumber()
    @Min(0.01)
    price?: number;

    @ApiProperty({ example: 100, description: 'New quantity', required: false })
    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(1000000)
    quantity?: number;
}

export class OrderResponseDto {
    @ApiProperty()
    order: {
        id: string;
        symbolId: string;
        side: string;
        type: string;
        quantity: number;
        remainingQuantity: number;
        filledQuantity: number;
        avgFilledPrice: number | null;
        price: number | null;
        status: string;
        commission: number;
        createdAt: Date;
    };

    @ApiProperty()
    trade?: {
        id: string;
        symbol: string;
        side: string;
        quantity: number;
        price: number;
        total: number;
        commission: number;
        executedAt: Date;
    };

    @ApiProperty()
    trades?: Array<{
        id: string;
        symbol: string;
        side: string;
        quantity: number;
        price: number;
        total: number;
        commission: number;
        executedAt: Date;
    }>;

    @ApiProperty()
    message: string;
}

export class OrderBookDto {
    @ApiProperty()
    bids: Array<{
        price: number;
        quantity: number;
        orderCount: number;
    }>;

    @ApiProperty()
    asks: Array<{
        price: number;
        quantity: number;
        orderCount: number;
    }>;

    @ApiProperty()
    lastPrice: number;

    @ApiProperty()
    spread: number;

    @ApiProperty()
    spreadPercent: number;
}
