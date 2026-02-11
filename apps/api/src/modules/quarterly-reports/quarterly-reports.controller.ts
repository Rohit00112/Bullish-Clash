// ============================================================
// Bullish Clash - Quarterly Reports Controller
// ============================================================

import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { QuarterlyReportsService } from './quarterly-reports.service';
import { CreateQuarterlyReportDto } from './quarterly-reports.dto';
import { JwtAuthGuard, RolesGuard, Roles } from '../auth/auth.guards';

@ApiTags('quarterly-reports')
@Controller('quarterly-reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class QuarterlyReportsController {
    constructor(private readonly reportsService: QuarterlyReportsService) { }

    @Get()
    @ApiOperation({ summary: 'Get all published quarterly reports' })
    @ApiQuery({ name: 'fiscalYear', required: false, type: String })
    @ApiQuery({ name: 'quarter', required: false, type: String })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiResponse({ status: 200, description: 'List of reports' })
    async getAllReports(
        @Query('fiscalYear') fiscalYear?: string,
        @Query('quarter') quarter?: string,
        @Query('limit') limit?: number,
    ) {
        return this.reportsService.getAllReports({ fiscalYear, quarter, limit });
    }

    @Get('symbol/:symbolId')
    @ApiOperation({ summary: 'Get quarterly reports for a specific symbol' })
    @ApiResponse({ status: 200, description: 'Symbol reports with metadata' })
    async getReportsBySymbol(@Param('symbolId') symbolId: string) {
        return this.reportsService.getReportsBySymbol(symbolId);
    }

    @Post()
    @Roles('admin')
    @ApiOperation({ summary: 'Create/publish a quarterly report (admin only)' })
    @ApiResponse({ status: 201, description: 'Report created' })
    async createReport(@Body() dto: CreateQuarterlyReportDto) {
        return this.reportsService.createReport(dto);
    }

    @Patch(':reportType/:id')
    @Roles('admin')
    @ApiOperation({ summary: 'Update a quarterly report (admin only)' })
    @ApiResponse({ status: 200, description: 'Report updated' })
    async updateReport(
        @Param('reportType') reportType: string,
        @Param('id') id: string,
        @Body() data: Partial<CreateQuarterlyReportDto>,
    ) {
        return this.reportsService.updateReport(reportType, id, data);
    }

    @Delete(':reportType/:id')
    @Roles('admin')
    @ApiOperation({ summary: 'Delete a quarterly report (admin only)' })
    @ApiResponse({ status: 200, description: 'Report deleted' })
    async deleteReport(
        @Param('reportType') reportType: string,
        @Param('id') id: string,
    ) {
        return this.reportsService.deleteReport(reportType, id);
    }

    @Post(':reportType/:id/execute')
    @Roles('admin')
    @ApiOperation({ summary: 'Execute market impact of a quarterly report (admin only)' })
    @ApiResponse({ status: 200, description: 'Market impact executed' })
    async executeReportImpact(
        @Param('reportType') reportType: string,
        @Param('id') id: string,
    ) {
        return this.reportsService.executeReportImpact(reportType, id);
    }
}
