import { Module } from '@nestjs/common';
import { BiddingService } from './bidding.service';
import { BiddingController } from './bidding.controller';
import { DatabaseModule } from '../../database/database.module';
import { CompetitionModule } from '../competition/competition.module';

@Module({
  imports: [DatabaseModule, CompetitionModule],
  providers: [BiddingService],
  controllers: [BiddingController]
})
export class BiddingModule { }
