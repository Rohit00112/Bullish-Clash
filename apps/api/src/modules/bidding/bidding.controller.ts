import { Controller, Post, Get, Body, UseGuards, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BiddingService } from './bidding.service';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '../auth/auth.guards';
import { PlaceBidDto, BidResponseDto } from './bidding.dto';

@ApiTags('bidding')
@Controller('bidding')
export class BiddingController {
    constructor(private readonly biddingService: BiddingService) { }

    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Place a bid (during Bidding Phase)' })
    @ApiResponse({ status: 201, description: 'Bid placed successfully' })
    async placeBid(
        @CurrentUser('id') userId: string,
        @Body() dto: PlaceBidDto,
    ) {
        return this.biddingService.placeBid(userId, dto);
    }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get my bids' })
    @ApiResponse({ status: 200, type: [BidResponseDto] })
    async getMyBids(@CurrentUser('id') userId: string) {
        return this.biddingService.getMyBids(userId);
    }

    @Post('process/:competitionId')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Process bids and allocate holdings (Admin only)' })
    @ApiResponse({ status: 201, description: 'Bids processed' })
    async processBids(@Param('competitionId') competitionId: string) {
        return this.biddingService.processBids(competitionId);
    }
}
