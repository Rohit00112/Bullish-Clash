// ============================================================
// Bullish Battle - Quarterly Reports Service
// ============================================================

import { Injectable, Inject, NotFoundException, BadRequestException, forwardRef } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { eq, and, desc, lte } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../database/schema';
import { CreateQuarterlyReportDto } from './quarterly-reports.dto';
import { PricesService, PriceUpdate } from '../prices/prices.service';
import { TradingGateway } from '../websocket/trading.gateway';
import { LeaderboardService } from '../leaderboard/leaderboard.service';

// Map sectors to report types
const SECTOR_REPORT_TYPE: Record<string, 'bank' | 'hydropower' | 'generic'> = {
    'Commercial Bank': 'bank',
    'Development Bank': 'bank',
    'Hydropower': 'hydropower',
    // Everything else is 'generic'
};

@Injectable()
export class QuarterlyReportsService {
    constructor(
        @Inject('DATABASE_CONNECTION')
        private db: NodePgDatabase<typeof schema>,
        @Inject(forwardRef(() => PricesService)) private readonly pricesService: PricesService,
        @Inject(forwardRef(() => TradingGateway)) private readonly tradingGateway: TradingGateway,
        @Inject(forwardRef(() => LeaderboardService)) private readonly leaderboardService: LeaderboardService,
    ) { }

    /**
     * Determine the correct report type for a symbol based on its sector
     */
    getReportTypeForSector(sector: string): 'bank' | 'hydropower' | 'generic' {
        return SECTOR_REPORT_TYPE[sector] || 'generic';
    }

    /**
     * Create a quarterly report (admin only)
     */
    async createReport(dto: CreateQuarterlyReportDto) {
        // Verify symbol exists
        const symbol = await this.db.query.symbols.findFirst({
            where: eq(schema.symbols.id, dto.symbolId),
        });
        if (!symbol) {
            throw new NotFoundException('Symbol not found');
        }

        // Auto-detect report type from sector if not explicitly set
        const reportType = dto.reportType || this.getReportTypeForSector(symbol.sector);

        let report: any;
        switch (reportType) {
            case 'bank':
                report = await this.createBankReport(dto);
                break;
            case 'hydropower':
                report = await this.createHydropowerReport(dto);
                break;
            default:
                report = await this.createGenericReport(dto);
                break;
        }

        // Execute market impact immediately if requested
        if (dto.executeNow && dto.impactMagnitude) {
            return this.executeReportImpact(report.reportType, report.id);
        }

        return report;
    }

    private async createBankReport(dto: CreateQuarterlyReportDto) {
        // Check for duplicates
        const existing = await this.db.query.bankQuarterlyReports.findFirst({
            where: and(
                eq(schema.bankQuarterlyReports.symbolId, dto.symbolId),
                eq(schema.bankQuarterlyReports.fiscalYear, dto.fiscalYear),
                eq(schema.bankQuarterlyReports.quarter, dto.quarter),
            ),
        });
        if (existing) {
            throw new BadRequestException(`Report for ${dto.fiscalYear} ${dto.quarter} already exists for this symbol`);
        }

        const [report] = await this.db.insert(schema.bankQuarterlyReports).values({
            symbolId: dto.symbolId,
            fiscalYear: dto.fiscalYear,
            quarter: dto.quarter,
            returnOnEquity: dto.returnOnEquity?.toString(),
            nonPerformingLoan: dto.nonPerformingLoan?.toString(),
            netInterestMargin: dto.netInterestMargin?.toString(),
            returnOnAssets: dto.returnOnAssets?.toString(),
            revenue: dto.revenue?.toString(),
            grossProfit: dto.grossProfit?.toString(),
            netProfit: dto.netProfit?.toString(),
            earningsPerShare: dto.earningsPerShare?.toString(),
            impactMagnitude: dto.impactMagnitude?.toString(),
            impactType: dto.impactType as any,
            priceUpdateType: dto.priceUpdateType as any,
            scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
        }).returning();

        return { ...report, reportType: 'bank' };
    }

    private async createHydropowerReport(dto: CreateQuarterlyReportDto) {
        const existing = await this.db.query.hydropowerQuarterlyReports.findFirst({
            where: and(
                eq(schema.hydropowerQuarterlyReports.symbolId, dto.symbolId),
                eq(schema.hydropowerQuarterlyReports.fiscalYear, dto.fiscalYear),
                eq(schema.hydropowerQuarterlyReports.quarter, dto.quarter),
            ),
        });
        if (existing) {
            throw new BadRequestException(`Report for ${dto.fiscalYear} ${dto.quarter} already exists for this symbol`);
        }

        const [report] = await this.db.insert(schema.hydropowerQuarterlyReports).values({
            symbolId: dto.symbolId,
            fiscalYear: dto.fiscalYear,
            quarter: dto.quarter,
            earningsPerShare: dto.earningsPerShare?.toString(),
            capacityUtilization: dto.capacityUtilization?.toString(),
            debtToEquity: dto.debtToEquity?.toString(),
            ebitdaMargin: dto.ebitdaMargin?.toString(),
            revenue: dto.revenue?.toString(),
            grossProfit: dto.grossProfit?.toString(),
            netProfit: dto.netProfit?.toString(),
            generationMWh: dto.generationMWh?.toString(),
            impactMagnitude: dto.impactMagnitude?.toString(),
            impactType: dto.impactType as any,
            priceUpdateType: dto.priceUpdateType as any,
            scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
        }).returning();

        return { ...report, reportType: 'hydropower' };
    }

    private async createGenericReport(dto: CreateQuarterlyReportDto) {
        const existing = await this.db.query.quarterlyReports.findFirst({
            where: and(
                eq(schema.quarterlyReports.symbolId, dto.symbolId),
                eq(schema.quarterlyReports.fiscalYear, dto.fiscalYear),
                eq(schema.quarterlyReports.quarter, dto.quarter),
            ),
        });
        if (existing) {
            throw new BadRequestException(`Report for ${dto.fiscalYear} ${dto.quarter} already exists for this symbol`);
        }

        const [report] = await this.db.insert(schema.quarterlyReports).values({
            symbolId: dto.symbolId,
            fiscalYear: dto.fiscalYear,
            quarter: dto.quarter,
            revenue: dto.revenue?.toString(),
            grossProfit: dto.grossProfit?.toString(),
            netProfit: dto.netProfit?.toString(),
            earningsPerShare: dto.earningsPerShare?.toString(),
            grossProfitMargin: dto.grossProfitMargin?.toString(),
            netProfitMargin: dto.netProfitMargin?.toString(),
            returnOnEquity: dto.returnOnEquity?.toString(),
            returnOnAssets: dto.returnOnAssets?.toString(),
            debtToEquity: dto.debtToEquity?.toString(),
            currentRatio: dto.currentRatio?.toString(),
            impactMagnitude: dto.impactMagnitude?.toString(),
            impactType: dto.impactType as any,
            priceUpdateType: dto.priceUpdateType as any,
            scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
        }).returning();

        return { ...report, reportType: 'generic' };
    }

    /**
     * Get all reports for a specific symbol (all quarters)
     */
    async getReportsBySymbol(symbolId: string) {
        const symbol = await this.db.query.symbols.findFirst({
            where: eq(schema.symbols.id, symbolId),
        });
        if (!symbol) {
            throw new NotFoundException('Symbol not found');
        }

        const reportType = this.getReportTypeForSector(symbol.sector);

        let reports: any[] = [];
        switch (reportType) {
            case 'bank':
                reports = await this.db.query.bankQuarterlyReports.findMany({
                    where: eq(schema.bankQuarterlyReports.symbolId, symbolId),
                    orderBy: [desc(schema.bankQuarterlyReports.fiscalYear), desc(schema.bankQuarterlyReports.quarter)],
                });
                break;
            case 'hydropower':
                reports = await this.db.query.hydropowerQuarterlyReports.findMany({
                    where: eq(schema.hydropowerQuarterlyReports.symbolId, symbolId),
                    orderBy: [desc(schema.hydropowerQuarterlyReports.fiscalYear), desc(schema.hydropowerQuarterlyReports.quarter)],
                });
                break;
            default:
                reports = await this.db.query.quarterlyReports.findMany({
                    where: eq(schema.quarterlyReports.symbolId, symbolId),
                    orderBy: [desc(schema.quarterlyReports.fiscalYear), desc(schema.quarterlyReports.quarter)],
                });
                break;
        }

        return {
            symbol: {
                id: symbol.id,
                symbol: symbol.symbol,
                companyName: symbol.companyName,
                sector: symbol.sector,
            },
            reportType,
            reports,
        };
    }

    /**
     * Get all published reports (recent, across all symbols)
     */
    async getAllReports(params?: { fiscalYear?: string; quarter?: string; limit?: number }) {
        const limit = params?.limit || 50;

        // Fetch from all three tables
        const [bankReports, hydroReports, genericReports] = await Promise.all([
            this.db.query.bankQuarterlyReports.findMany({
                orderBy: [desc(schema.bankQuarterlyReports.createdAt)],
                limit,
            }),
            this.db.query.hydropowerQuarterlyReports.findMany({
                orderBy: [desc(schema.hydropowerQuarterlyReports.createdAt)],
                limit,
            }),
            this.db.query.quarterlyReports.findMany({
                orderBy: [desc(schema.quarterlyReports.createdAt)],
                limit,
            }),
        ]);

        // Collect unique symbol IDs
        const symbolIds = new Set<string>();
        [...bankReports, ...hydroReports, ...genericReports].forEach((r: any) => symbolIds.add(r.symbolId));

        // Fetch symbol details
        const symbolsMap = new Map<string, any>();
        if (symbolIds.size > 0) {
            const symbolsList = await this.db.query.symbols.findMany();
            symbolsList.forEach(s => symbolsMap.set(s.id, s));
        }

        const enrichReport = (report: any, type: string) => ({
            ...report,
            reportType: type,
            symbol: symbolsMap.get(report.symbolId),
        });

        // Combine and sort by createdAt
        const allReports = [
            ...bankReports.map(r => enrichReport(r, 'bank')),
            ...hydroReports.map(r => enrichReport(r, 'hydropower')),
            ...genericReports.map(r => enrichReport(r, 'generic')),
        ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        // Apply filters
        let filtered = allReports;
        if (params?.fiscalYear) {
            filtered = filtered.filter(r => r.fiscalYear === params.fiscalYear);
        }
        if (params?.quarter) {
            filtered = filtered.filter(r => r.quarter === params.quarter);
        }

        return filtered.slice(0, limit);
    }

    /**
     * Update an existing report
     */
    async updateReport(reportType: string, reportId: string, data: Partial<CreateQuarterlyReportDto>) {
        const updateData: any = { updatedAt: new Date() };

        // Build update based on provided fields
        for (const [key, value] of Object.entries(data)) {
            if (value !== undefined && !['symbolId', 'fiscalYear', 'quarter', 'reportType'].includes(key)) {
                updateData[key] = value?.toString();
            }
        }

        switch (reportType) {
            case 'bank': {
                const [updated] = await this.db.update(schema.bankQuarterlyReports)
                    .set(updateData)
                    .where(eq(schema.bankQuarterlyReports.id, reportId))
                    .returning();
                if (!updated) throw new NotFoundException('Report not found');
                return { ...updated, reportType: 'bank' };
            }
            case 'hydropower': {
                const [updated] = await this.db.update(schema.hydropowerQuarterlyReports)
                    .set(updateData)
                    .where(eq(schema.hydropowerQuarterlyReports.id, reportId))
                    .returning();
                if (!updated) throw new NotFoundException('Report not found');
                return { ...updated, reportType: 'hydropower' };
            }
            default: {
                const [updated] = await this.db.update(schema.quarterlyReports)
                    .set(updateData)
                    .where(eq(schema.quarterlyReports.id, reportId))
                    .returning();
                if (!updated) throw new NotFoundException('Report not found');
                return { ...updated, reportType: 'generic' };
            }
        }
    }

    /**
     * Delete a report
     */
    async deleteReport(reportType: string, reportId: string) {
        switch (reportType) {
            case 'bank':
                await this.db.delete(schema.bankQuarterlyReports)
                    .where(eq(schema.bankQuarterlyReports.id, reportId));
                break;
            case 'hydropower':
                await this.db.delete(schema.hydropowerQuarterlyReports)
                    .where(eq(schema.hydropowerQuarterlyReports.id, reportId));
                break;
            default:
                await this.db.delete(schema.quarterlyReports)
                    .where(eq(schema.quarterlyReports.id, reportId));
                break;
        }
        return { success: true, message: 'Report deleted' };
    }

    /**
     * Execute market impact for a report (like events system)
     */
    async executeReportImpact(reportType: string, reportId: string) {
        // Find the report
        let report: any;
        let tableRef: any;
        switch (reportType) {
            case 'bank':
                report = await this.db.query.bankQuarterlyReports.findFirst({
                    where: eq(schema.bankQuarterlyReports.id, reportId),
                });
                tableRef = schema.bankQuarterlyReports;
                break;
            case 'hydropower':
                report = await this.db.query.hydropowerQuarterlyReports.findFirst({
                    where: eq(schema.hydropowerQuarterlyReports.id, reportId),
                });
                tableRef = schema.hydropowerQuarterlyReports;
                break;
            default:
                report = await this.db.query.quarterlyReports.findFirst({
                    where: eq(schema.quarterlyReports.id, reportId),
                });
                tableRef = schema.quarterlyReports;
                break;
        }

        if (!report) throw new NotFoundException('Report not found');
        if (report.isExecuted) throw new BadRequestException('Report impact already executed');
        if (!report.impactMagnitude) throw new BadRequestException('No market impact configured for this report');

        const magnitude = parseFloat(report.impactMagnitude);
        const priceUpdate: PriceUpdate = {
            symbolId: report.symbolId,
            priceUpdateType: report.priceUpdateType || 'percentage',
            magnitude: report.impactType === 'negative' ? -magnitude : magnitude,
        };

        const results = await this.pricesService.batchUpdatePrices([priceUpdate]);
        const result = results[0];

        // Update report with execution info
        const updateResult = await this.db.update(tableRef)
            .set({
                isExecuted: true,
                executedAt: new Date(),
                previousPrice: result?.previousPrice?.toString(),
                newPrice: result?.newPrice?.toString(),
                updatedAt: new Date(),
            })
            .where(eq(tableRef.id, reportId))
            .returning();
        const updated = (updateResult as any[])[0];

        // Fetch symbol for notifications
        const symbol = await this.db.query.symbols.findFirst({
            where: eq(schema.symbols.id, report.symbolId),
        });

        // Broadcast market event notification
        this.tradingGateway.broadcastMarketEvent({
            eventId: reportId,
            title: `Quarterly Report: ${symbol?.symbol || 'Unknown'} ${report.fiscalYear} ${report.quarter}`,
            description: `Report published with ${report.impactType} impact of ${magnitude}${report.priceUpdateType === 'percentage' ? '%' : ''}`,
            impactType: report.impactType,
            symbolsAffected: 1,
        });

        // Invalidate leaderboard
        await this.leaderboardService.invalidateCache();
        this.tradingGateway.triggerLeaderboardUpdate();

        return {
            report: { ...updated, reportType },
            result,
            summary: {
                symbol: symbol?.symbol,
                previousPrice: result?.previousPrice,
                newPrice: result?.newPrice,
                change: result?.change,
                changePercent: result?.changePercent,
            },
        };
    }

    /**
     * Cron: Auto-execute scheduled report impacts
     */
    @Cron(CronExpression.EVERY_10_SECONDS)
    async processScheduledReports() {
        const now = new Date();

        const tables = [
            { table: schema.bankQuarterlyReports, type: 'bank' },
            { table: schema.hydropowerQuarterlyReports, type: 'hydropower' },
            { table: schema.quarterlyReports, type: 'generic' },
        ];

        for (const { table, type } of tables) {
            const scheduled = await this.db.select().from(table).where(
                and(
                    eq(table.isExecuted, false),
                    lte(table.scheduledAt, now),
                ),
            );

            for (const report of scheduled) {
                if (!report.impactMagnitude) continue;
                try {
                    console.log(`Executing scheduled report impact: ${type}/${report.id}`);
                    await this.executeReportImpact(type, report.id);
                } catch (error) {
                    console.error(`Failed to execute scheduled report ${report.id}:`, error);
                }
            }
        }
    }
}
