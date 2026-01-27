// ============================================================
// Bullish Clash - Prices Controller
// ============================================================

import { Controller, Get, Post, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { PricesService } from './prices.service';
import { JwtAuthGuard, RolesGuard, Roles } from '../auth/auth.guards';

@ApiTags('prices')
@Controller('prices')
export class PricesController {
    constructor(private readonly pricesService: PricesService) { }

    @Get()
    @ApiOperation({ summary: 'Get all latest prices' })
    @ApiResponse({ status: 200, description: 'List of latest prices for all symbols' })
    async getAllLatestPrices() {
        return this.pricesService.getAllLatestPrices();
    }

    @Get(':symbolId')
    @ApiOperation({ summary: 'Get latest price for a symbol' })
    @ApiResponse({ status: 200, description: 'Latest price data' })
    async getLatestPrice(@Param('symbolId') symbolId: string) {
        return this.pricesService.getLatestPrice(symbolId);
    }

    @Get(':symbolId/history')
    @ApiOperation({ summary: 'Get price history for a symbol' })
    @ApiQuery({ name: 'from', required: false, type: String, description: 'Start date (ISO string)' })
    @ApiQuery({ name: 'to', required: false, type: String, description: 'End date (ISO string)' })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiResponse({ status: 200, description: 'Price tick history' })
    async getPriceHistory(
        @Param('symbolId') symbolId: string,
        @Query('from') from?: string,
        @Query('to') to?: string,
        @Query('limit') limit?: number,
    ) {
        return this.pricesService.getPriceHistory(symbolId, {
            from: from ? new Date(from) : undefined,
            to: to ? new Date(to) : undefined,
            limit,
        });
    }

    @Get(':symbolId/candles')
    @ApiOperation({ summary: 'Get OHLCV candles for a symbol' })
    @ApiQuery({ name: 'interval', required: false, description: 'Candle interval (1m, 5m, 15m, 1h, 1d)' })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiResponse({ status: 200, description: 'OHLCV candles' })
    async getCandles(
        @Param('symbolId') symbolId: string,
        @Query('interval') interval?: string,
        @Query('limit') limit?: number,
    ) {
        return this.pricesService.getCandles(symbolId, interval || '1m', limit || 100);
    }

    @Post('update')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update price for a symbol (admin only)' })
    @ApiResponse({ status: 200, description: 'Price updated' })
    async updatePrice(
        @Body() body: { symbolId: string; change: number; type: 'PERCENTAGE' | 'ABSOLUTE' },
    ) {
        return this.pricesService.updatePrice({
            symbolId: body.symbolId,
            priceUpdateType: body.type.toLowerCase() as 'percentage' | 'absolute',
            magnitude: body.change,
        });
    }
}
