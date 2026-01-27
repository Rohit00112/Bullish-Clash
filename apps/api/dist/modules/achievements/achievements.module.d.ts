import { OnModuleInit } from '@nestjs/common';
import { AchievementsService } from './achievements.service';
export declare class AchievementsModule implements OnModuleInit {
    private readonly achievementsService;
    constructor(achievementsService: AchievementsService);
    onModuleInit(): Promise<void>;
}
