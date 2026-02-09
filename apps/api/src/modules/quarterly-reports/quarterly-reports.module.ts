// ============================================================
// Bullish Clash - Quarterly Reports Module
// ============================================================

import { Module } from '@nestjs/common';
import { QuarterlyReportsController } from './quarterly-reports.controller';
import { QuarterlyReportsService } from './quarterly-reports.service';

@Module({
    controllers: [QuarterlyReportsController],
    providers: [QuarterlyReportsService],
    exports: [QuarterlyReportsService],
})
export class QuarterlyReportsModule { }
