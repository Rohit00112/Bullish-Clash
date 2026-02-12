// ============================================================
// Bullish Battle - Portfolio Controller
// ============================================================

import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PortfolioService } from './portfolio.service';
import { JwtAuthGuard, CurrentUser } from '../auth/auth.guards';

@ApiTags('portfolio')
@Controller('portfolio')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PortfolioController {
    constructor(private readonly portfolioService: PortfolioService) { }

    @Get()
    @ApiOperation({ summary: 'Get complete portfolio with positions' })
    @ApiResponse({ status: 200, description: 'Portfolio details with all positions' })
    async getPortfolio(@CurrentUser('id') userId: string) {
        return this.portfolioService.getPortfolio(userId);
    }

    @Get('summary')
    @ApiOperation({ summary: 'Get portfolio summary' })
    @ApiResponse({ status: 200, description: 'Quick portfolio overview' })
    async getPortfolioSummary(@CurrentUser('id') userId: string) {
        return this.portfolioService.getPortfolioSummary(userId);
    }

    @Get('holdings')
    @ApiOperation({ summary: 'Get current holdings/positions' })
    @ApiResponse({ status: 200, description: 'List of current positions' })
    async getHoldings(@CurrentUser('id') userId: string) {
        return this.portfolioService.getHoldings(userId);
    }
}
