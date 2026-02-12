// ============================================================
// Bullish Battle - Trading Controller
// ============================================================

import { Controller, Get, Post, Body, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { TradingService } from './trading.service';
import { PlaceOrderDto, CancelOrderDto, EditOrderDto, OrderResponseDto, OrderBookDto } from './trading.dto';
import { JwtAuthGuard, CurrentUser } from '../auth/auth.guards';
import { Throttle } from '@nestjs/throttler';

@ApiTags('trading')
@Controller('trading')
export class TradingController {
    constructor(private readonly tradingService: TradingService) { }

    @Post('order')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Throttle({ default: { limit: 30, ttl: 60000 } })
    @ApiOperation({ summary: 'Place a market or limit order' })
    @ApiResponse({ status: 201, description: 'Order executed or placed', type: OrderResponseDto })
    @ApiResponse({ status: 400, description: 'Validation error or insufficient funds/shares' })
    async placeOrder(
        @CurrentUser('id') userId: string,
        @Body() dto: PlaceOrderDto,
    ) {
        return this.tradingService.placeOrder(userId, dto);
    }

    @Post('order/cancel')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Cancel an open order' })
    @ApiResponse({ status: 200, description: 'Order cancelled' })
    @ApiResponse({ status: 400, description: 'Order not found or cannot be cancelled' })
    async cancelOrder(
        @CurrentUser('id') userId: string,
        @Body() dto: CancelOrderDto,
    ) {
        return this.tradingService.cancelOrder(userId, dto);
    }

    @Post('order/edit')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Throttle({ default: { limit: 30, ttl: 60000 } })
    @ApiOperation({ summary: 'Edit an open limit order' })
    @ApiResponse({ status: 200, description: 'Order updated successfully' })
    @ApiResponse({ status: 400, description: 'Order not found or cannot be edited' })
    async editOrder(
        @CurrentUser('id') userId: string,
        @Body() dto: EditOrderDto,
    ) {
        return this.tradingService.editOrder(userId, dto);
    }

    @Get('orderbook/:symbolId')
    @ApiOperation({ summary: 'Get order book for a symbol' })
    @ApiParam({ name: 'symbolId', description: 'Symbol ID' })
    @ApiResponse({ status: 200, description: 'Order book with bids and asks', type: OrderBookDto })
    async getOrderBook(
        @Param('symbolId') symbolId: string,
    ) {
        return this.tradingService.getOrderBook(symbolId);
    }

    @Get('orders/open')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get user open orders' })
    @ApiResponse({ status: 200, description: 'List of open orders' })
    async getOpenOrders(
        @CurrentUser('id') userId: string,
    ) {
        return this.tradingService.getOpenOrders(userId);
    }

    @Get('orders')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get user orders' })
    @ApiQuery({ name: 'status', required: false, enum: ['pending', 'open', 'filled', 'partial', 'cancelled', 'rejected', 'expired'] })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiResponse({ status: 200, description: 'List of orders' })
    async getOrders(
        @CurrentUser('id') userId: string,
        @Query('status') status?: string,
        @Query('limit') limit?: number,
    ) {
        return this.tradingService.getOrders(userId, { status, limit });
    }

    @Get('trades')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get user trade history' })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiResponse({ status: 200, description: 'List of trades' })
    async getTrades(
        @CurrentUser('id') userId: string,
        @Query('limit') limit?: number,
    ) {
        return this.tradingService.getTrades(userId, { limit: limit ? Number(limit) : 100 });
    }

    @Get('trades/debug')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Debug: Get raw trade history' })
    async getTradesDebug(
        @CurrentUser('id') userId: string,
    ) {
        return this.tradingService.getTradesRaw(userId);
    }
}
