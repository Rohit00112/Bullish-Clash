import { Module } from '@nestjs/common';
import { RemarksService } from './remarks.service';
import { RemarksController } from './remarks.controller';
import { DatabaseModule } from '../../database/database.module';
import { CompetitionModule } from '../competition/competition.module';

@Module({
    imports: [DatabaseModule, CompetitionModule],
    controllers: [RemarksController],
    providers: [RemarksService],
    exports: [RemarksService],
})
export class RemarksModule { }
