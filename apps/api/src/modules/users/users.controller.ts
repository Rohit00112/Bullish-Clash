// ============================================================
// Bullish Battle - Users Controller
// ============================================================

import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '../auth/auth.guards';

@ApiTags('users')
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get current user profile' })
    @ApiResponse({ status: 200, description: 'User profile' })
    async getMe(@CurrentUser('id') userId: string) {
        return this.usersService.findById(userId);
    }

    @Patch('me')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update current user profile' })
    @ApiResponse({ status: 200, description: 'Updated profile' })
    async updateMe(
        @CurrentUser('id') userId: string,
        @Body() body: { fullName?: string; phone?: string; avatarUrl?: string },
    ) {
        return this.usersService.updateProfile(userId, body);
    }

    // ==================== WATCHLIST ====================

    @Get('me/watchlist')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get user watchlist' })
    @ApiResponse({ status: 200, description: 'Array of symbol IDs in watchlist' })
    async getWatchlist(@CurrentUser('id') userId: string) {
        const symbolIds = await this.usersService.getWatchlist(userId);
        return { symbolIds };
    }

    @Post('me/watchlist')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Add symbol to watchlist' })
    @ApiResponse({ status: 201, description: 'Symbol added to watchlist' })
    async addToWatchlist(
        @CurrentUser('id') userId: string,
        @Body() body: { symbolId: string },
    ) {
        return this.usersService.addToWatchlist(userId, body.symbolId);
    }

    @Patch('me/watchlist')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update entire watchlist (replace all)' })
    @ApiResponse({ status: 200, description: 'Watchlist updated' })
    async updateWatchlist(
        @CurrentUser('id') userId: string,
        @Body() body: { symbolIds: string[] },
    ) {
        return this.usersService.updateWatchlist(userId, body.symbolIds);
    }

    @Delete('me/watchlist/:symbolId')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Remove symbol from watchlist' })
    @ApiResponse({ status: 200, description: 'Symbol removed from watchlist' })
    async removeFromWatchlist(
        @CurrentUser('id') userId: string,
        @Param('symbolId') symbolId: string,
    ) {
        return this.usersService.removeFromWatchlist(userId, symbolId);
    }

    // ==================== ADMIN ====================

    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'List all users (admin only)' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiResponse({ status: 200, description: 'Paginated user list' })
    async findAll(@Query('page') page = 1, @Query('limit') limit = 20) {
        return this.usersService.findAll(page, limit);
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get user by ID (admin only)' })
    @ApiResponse({ status: 200, description: 'User details' })
    @ApiResponse({ status: 404, description: 'User not found' })
    async findOne(@Param('id') id: string) {
        return this.usersService.findById(id);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete user (admin only)' })
    @ApiResponse({ status: 200, description: 'User deleted' })
    @ApiResponse({ status: 404, description: 'User not found' })
    async deleteUser(@Param('id') id: string) {
        return this.usersService.deleteUser(id);
    }
}
