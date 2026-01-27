// ============================================================
// Bullish Clash - Competition Controller
// ============================================================

import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CompetitionService } from './competition.service';
import { CreateCompetitionDto, UpdateCompetitionDto } from './competition.dto';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '../auth/auth.guards';

@ApiTags('competition')
@Controller('competition')
export class CompetitionController {
    constructor(private readonly competitionService: CompetitionService) { }

    @Get('active')
    @ApiOperation({ summary: 'Get active competition' })
    @ApiResponse({ status: 200, description: 'Active competition details' })
    async getActiveCompetition() {
        const competition = await this.competitionService.getActiveCompetition();
        if (competition) {
            return this.competitionService.getCompetition(competition.id);
        }
        return null;
    }

    @Get('active/stats')
    @ApiOperation({ summary: 'Get active competition stats' })
    @ApiResponse({ status: 200, description: 'Competition statistics' })
    async getActiveCompetitionStats() {
        const competition = await this.competitionService.getActiveCompetition();
        if (competition) {
            return this.competitionService.getCompetitionStats(competition.id);
        }
        return null;
    }

    @Get('active/settings')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get active competition settings (admin only)' })
    @ApiResponse({ status: 200, description: 'Competition settings' })
    async getActiveCompetitionSettings() {
        const competition = await this.competitionService.getActiveCompetition();
        if (competition) {
            return this.competitionService.getCompetition(competition.id);
        }
        return null;
    }

    @Patch('active/settings')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update active competition settings (admin only)' })
    @ApiResponse({ status: 200, description: 'Competition settings updated' })
    async updateActiveCompetitionSettings(@Body() dto: UpdateCompetitionDto) {
        const competition = await this.competitionService.getActiveCompetition();
        if (competition) {
            return this.competitionService.updateCompetition(competition.id, dto);
        }
        return null;
    }

    @Post('active/start')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Start active competition (admin only)' })
    @ApiResponse({ status: 200, description: 'Competition started' })
    async startActiveCompetition() {
        const competition = await this.competitionService.getActiveCompetition();
        if (competition) {
            return this.competitionService.updateStatus(competition.id, 'active');
        }
        return null;
    }

    @Post('active/pause')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Pause active competition (admin only)' })
    @ApiResponse({ status: 200, description: 'Competition paused' })
    async pauseActiveCompetition() {
        const competition = await this.competitionService.getActiveCompetition();
        if (competition) {
            return this.competitionService.updateStatus(competition.id, 'paused');
        }
        return null;
    }

    @Post('active/end')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'End active competition (admin only)' })
    @ApiResponse({ status: 200, description: 'Competition ended' })
    async endActiveCompetition() {
        const competition = await this.competitionService.getActiveCompetition();
        if (competition) {
            return this.competitionService.updateStatus(competition.id, 'ended');
        }
        return null;
    }

    @Post('active/reset')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Reset active competition (admin only)' })
    @ApiResponse({ status: 200, description: 'Competition reset' })
    async resetActiveCompetition() {
        const competition = await this.competitionService.getActiveCompetition();
        if (competition) {
            return this.competitionService.resetCompetition(competition.id);
        }
        return null;
    }

    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get all competitions (admin only)' })
    @ApiResponse({ status: 200, description: 'List of competitions' })
    async getAllCompetitions() {
        return this.competitionService.getAllCompetitions();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get competition by ID' })
    @ApiResponse({ status: 200, description: 'Competition details' })
    async getCompetition(@Param('id') id: string) {
        return this.competitionService.getCompetition(id);
    }

    @Get(':id/stats')
    @ApiOperation({ summary: 'Get competition stats' })
    @ApiResponse({ status: 200, description: 'Competition statistics' })
    async getCompetitionStats(@Param('id') id: string) {
        return this.competitionService.getCompetitionStats(id);
    }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create new competition (admin only)' })
    @ApiResponse({ status: 201, description: 'Competition created' })
    async createCompetition(@Body() dto: CreateCompetitionDto) {
        return this.competitionService.createCompetition(dto);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update competition (admin only)' })
    @ApiResponse({ status: 200, description: 'Competition updated' })
    async updateCompetition(@Param('id') id: string, @Body() dto: UpdateCompetitionDto) {
        return this.competitionService.updateCompetition(id, dto);
    }

    @Post(':id/status/:status')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update competition status (admin only)' })
    @ApiResponse({ status: 200, description: 'Status updated' })
    async updateStatus(
        @Param('id') id: string,
        @Param('status') status: 'draft' | 'scheduled' | 'active' | 'paused' | 'ended',
    ) {
        return this.competitionService.updateStatus(id, status);
    }

    @Post(':id/join')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Join competition' })
    @ApiResponse({ status: 200, description: 'Successfully joined' })
    async joinCompetition(
        @CurrentUser('id') userId: string,
        @Param('id') competitionId: string,
    ) {
        return this.competitionService.joinCompetition(userId, competitionId);
    }
}
