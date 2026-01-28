import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsPositive, Min } from 'class-validator';

export class PlaceBidDto {
    @ApiProperty({ example: 'symbol-uuid' })
    @IsString()
    symbolId: string;

    @ApiProperty({ example: 100 })
    @IsNumber()
    @IsPositive()
    @Min(10)
    quantity: number;

    @ApiProperty({ example: 100.00 })
    @IsNumber()
    @IsPositive()
    price: number;
}

export class BidResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    symbolId: string;

    @ApiProperty()
    symbolSymbol: string;

    @ApiProperty()
    quantity: number;

    @ApiProperty()
    price: number;

    @ApiProperty()
    status: string;

    @ApiProperty()
    total: number;

    @ApiProperty()
    createdAt: Date;
}
