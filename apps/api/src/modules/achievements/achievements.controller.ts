import { Controller, Get, Post, UseGuards, Request, Param, Inject } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/auth.guards';
import { AchievementsService } from './achievements.service';
import { DATABASE_CONNECTION } from '../../database/database.module';
import { eq } from 'drizzle-orm';
import * as schema from '../../database/schema';

@Controller('achievements')
export class AchievementsController {
    constructor(
        private readonly achievementsService: AchievementsService,
        @Inject(DATABASE_CONNECTION) private readonly db: any,
    ) { }

    // Get all achievement definitions
    @Get('definitions')
    async getDefinitions() {
        return this.achievementsService.getAllDefinitions();
    }

    // Get current user's achievements
    @UseGuards(JwtAuthGuard)
    @Get()
    async getMyAchievements(@Request() req: any) {
        return this.achievementsService.getUserAchievements(req.user.id);
    }

    // Get current user's achievements for a specific competition
    @UseGuards(JwtAuthGuard)
    @Get('competition/:competitionId')
    async getMyCompetitionAchievements(
        @Request() req: any,
        @Param('competitionId') competitionId: string,
    ) {
        return this.achievementsService.getUserAchievements(req.user.id, competitionId);
    }

    // Get current user's achievement stats
    @UseGuards(JwtAuthGuard)
    @Get('stats')
    async getMyStats(@Request() req: any) {
        return this.achievementsService.getUserStats(req.user.id);
    }

    // Manually trigger achievement check (for existing trades)
    @UseGuards(JwtAuthGuard)
    @Post('check')
    async checkAchievements(@Request() req: any) {
        // Get user's active competition
        const competition = await this.db.query.competitions.findFirst({
            where: eq(schema.competitions.status, 'active'),
        });

        if (!competition) {
            return { message: 'No active competition', awarded: [] };
        }

        // Check trade achievements
        const tradeAchievements = await this.achievementsService.checkTradeAchievements({
            userId: req.user.id,
            competitionId: competition.id,
            type: 'trade',
        });

        // Check portfolio achievements
        const portfolioAchievements = await this.achievementsService.checkPortfolioAchievements(
            req.user.id,
            competition.id,
        );

        return {
            message: 'Achievement check completed',
            awarded: [...tradeAchievements, ...portfolioAchievements],
        };
    }

    // Get another user's achievements (public)
    @Get('user/:userId')
    async getUserAchievements(@Param('userId') userId: string) {
        return this.achievementsService.getUserAchievements(userId);
    }

    // Get another user's stats (public)
    @Get('user/:userId/stats')
    async getUserStats(@Param('userId') userId: string) {
        return this.achievementsService.getUserStats(userId);
    }
}
