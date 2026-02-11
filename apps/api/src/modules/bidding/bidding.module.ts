import { Module, forwardRef } from '@nestjs/common';
import { BiddingService } from './bidding.service';
import { BiddingController } from './bidding.controller';
import { DatabaseModule } from '../../database/database.module';
import { CompetitionModule } from '../competition/competition.module';

@Module({
  imports: [DatabaseModule, forwardRef(() => CompetitionModule)],
  providers: [BiddingService],
  controllers: [BiddingController],
  exports: [BiddingService],
})
export class BiddingModule { }
