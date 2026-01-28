import { IsString, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum RemarkType {
    TRADE_JUSTIFICATION = 'trade_justification',
    STRATEGY = 'strategy',
    RISK_ASSESSMENT = 'risk_assessment',
    MARKET_SENTIMENT = 'market_sentiment',
}

export class CreateRemarkDto {
    @ApiProperty({ description: 'Type of remark', enum: RemarkType })
    @IsEnum(RemarkType)
    type: RemarkType;

    @ApiProperty({ description: 'Content of the remark', example: 'I bought this because...' })
    @IsString()
    content: string;

    @ApiProperty({ description: 'Title or summary (optional)', required: false })
    @IsOptional()
    @IsString()
    title?: string;

    @ApiProperty({ description: 'Associated Symbol ID (optional)', required: false })
    @IsOptional()
    @IsUUID()
    symbolId?: string;
}

export class UpdateRemarkDto {
    @ApiProperty({ description: 'Content of the remark', required: false })
    @IsOptional()
    @IsString()
    content?: string;
}
