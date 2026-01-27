// ============================================================
// Bullish Clash - Watchlist Controller
// ============================================================

import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { WatchlistService } from './watchlist.service';
import { JwtAuthGuard, CurrentUser } from '../auth/auth.guards';
import { IsUUID, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class AddToWatchlistDto {
    @ApiProperty({ description: 'Symbol ID to add to watchlist' })
    @IsUUID()
    @IsNotEmpty()
    symbolId: string;
}

@ApiTags('watchlist')
@Controller('watchlist')
export class WatchlistController {
    constructor(private readonly watchlistService: WatchlistService) { }

    @Get()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get user watchlist' })
    @ApiResponse({ status: 200, description: 'User watchlist with current prices' })
    async getWatchlist(@CurrentUser('id') userId: string) {
        return this.watchlistService.getWatchlist(userId);
    }

    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Add symbol to watchlist' })
    @ApiResponse({ status: 201, description: 'Symbol added to watchlist' })
    @ApiResponse({ status: 400, description: 'Symbol not found or already in watchlist' })
    async addToWatchlist(
        @CurrentUser('id') userId: string,
        @Body() dto: AddToWatchlistDto,
    ) {
        return this.watchlistService.addToWatchlist(userId, dto.symbolId);
    }

    @Delete(':symbolId')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Remove symbol from watchlist' })
    @ApiParam({ name: 'symbolId', description: 'Symbol ID to remove' })
    @ApiResponse({ status: 200, description: 'Symbol removed from watchlist' })
    @ApiResponse({ status: 400, description: 'Symbol not in watchlist' })
    async removeFromWatchlist(
        @CurrentUser('id') userId: string,
        @Param('symbolId') symbolId: string,
    ) {
        return this.watchlistService.removeFromWatchlist(userId, symbolId);
    }

    @Get(':symbolId/check')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Check if symbol is in watchlist' })
    @ApiParam({ name: 'symbolId', description: 'Symbol ID to check' })
    @ApiResponse({ status: 200, description: 'Returns whether symbol is in watchlist' })
    async isInWatchlist(
        @CurrentUser('id') userId: string,
        @Param('symbolId') symbolId: string,
    ) {
        const inWatchlist = await this.watchlistService.isInWatchlist(userId, symbolId);
        return { inWatchlist };
    }
}
