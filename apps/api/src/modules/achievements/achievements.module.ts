import { Module, OnModuleInit, forwardRef } from '@nestjs/common';
import { AchievementsController } from './achievements.controller';
import { AchievementsService } from './achievements.service';
import { DatabaseModule } from '../../database/database.module';
import { WebSocketModule } from '../websocket/websocket.module';

@Module({
    imports: [DatabaseModule, forwardRef(() => WebSocketModule)],
    controllers: [AchievementsController],
    providers: [AchievementsService],
    exports: [AchievementsService],
})
export class AchievementsModule implements OnModuleInit {
    constructor(private readonly achievementsService: AchievementsService) { }

    async onModuleInit() {
        // Seed achievement definitions on startup
        await this.achievementsService.seedAchievements();
    }
}
