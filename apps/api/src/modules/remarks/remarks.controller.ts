import { Controller, Get, Post, Patch, Body, UseGuards, Req, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RemarksService } from './remarks.service';
import { CreateRemarkDto } from './remarks.dto';
import { JwtAuthGuard, CurrentUser } from '../auth/auth.guards';

@ApiTags('Remarks')
@Controller('remarks')
export class RemarksController {
    constructor(private readonly remarksService: RemarksService) { }

    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Submit a remark/justification' })
    async createRemark(
        @CurrentUser('id') userId: string,
        @Body() dto: CreateRemarkDto,
    ) {
        return this.remarksService.createRemark(userId, dto);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update a remark (User)' })
    async updateRemark(
        @CurrentUser('id') userId: string,
        @Param('id') remarkId: string,
        @Body() body: { content: string },
    ) {
        return this.remarksService.updateRemark(userId, remarkId, body.content);
    }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get my remarks for current competition' })
    async getMyRemarks(@CurrentUser('id') userId: string) {
        return this.remarksService.getMyRemarks(userId);
    }
    @Get('competition/:id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get all remarks for a competition (Admin)' })
    async getAllRemarks(@Param('id') competitionId: string) {
        return this.remarksService.getAllRemarks(competitionId);
    }

    @Patch(':id/score')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Score a remark (Admin)' })
    async scoreRemark(
        @Param('id') remarkId: string,
        @Body() body: { score: number },
    ) {
        return this.remarksService.scoreRemark(remarkId, body.score);
    }
}
