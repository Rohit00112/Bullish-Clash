// ============================================================
// Bullish Clash - Leaderboard Controller
// ============================================================

import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { LeaderboardService } from './leaderboard.service';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '../auth/auth.guards';

@ApiTags('leaderboard')
@Controller('leaderboard')
export class LeaderboardController {
    constructor(private readonly leaderboardService: LeaderboardService) { }

    @Get()
    @ApiOperation({ summary: 'Get competition leaderboard' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of entries (default: 100)' })
    @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Offset for pagination' })
    @ApiResponse({ status: 200, description: 'Leaderboard entries' })
    async getLeaderboard(
        @CurrentUser('role') role: string,
        @Query('limit') limit?: number,
        @Query('offset') offset?: number,
    ) {
        const isAdmin = role === 'admin';
        return this.leaderboardService.getLeaderboard({ limit, offset, isAdmin });
    }

    @Get('my-rank')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get current user rank' })
    @ApiResponse({ status: 200, description: 'User rank info' })
    async getMyRank(
        @CurrentUser('id') userId: string,
        @CurrentUser('role') role: string
    ) {
        const isAdmin = role === 'admin';
        return this.leaderboardService.getUserRank(userId, isAdmin);
    }

    @Get('export')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Export leaderboard as CSV (admin only)' })
    @ApiResponse({ status: 200, description: 'CSV file' })
    async exportLeaderboard(@Res() res: Response) {
        const csv = await this.leaderboardService.exportLeaderboard();

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=leaderboard.csv');
        res.send(csv);
    }
}
