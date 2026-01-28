"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompetitionService = void 0;
const common_1 = require("@nestjs/common");
const drizzle_orm_1 = require("drizzle-orm");
const uuid_1 = require("uuid");
const database_module_1 = require("../../database/database.module");
const schema = require("../../database/schema");
let CompetitionService = class CompetitionService {
    db;
    constructor(db) {
        this.db = db;
    }
    async getActiveCompetition() {
        let competition = await this.db.query.competitions.findFirst({
            where: (0, drizzle_orm_1.eq)(schema.competitions.isDefault, true),
        });
        if (!competition) {
            competition = await this.db.query.competitions.findFirst({
                where: (0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema.competitions.status, 'active'), (0, drizzle_orm_1.eq)(schema.competitions.status, 'scheduled'), (0, drizzle_orm_1.eq)(schema.competitions.status, 'bidding')),
                orderBy: [(0, drizzle_orm_1.desc)(schema.competitions.startTime)],
            });
        }
        return competition;
    }
    async getCompetition(id) {
        const competition = await this.db.query.competitions.findFirst({
            where: (0, drizzle_orm_1.eq)(schema.competitions.id, id),
        });
        if (!competition) {
            throw new common_1.NotFoundException('Competition not found');
        }
        const participants = await this.db.query.competitionParticipants.findMany({
            where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.competitionParticipants.competitionId, id), (0, drizzle_orm_1.eq)(schema.competitionParticipants.isActive, true)),
        });
        return {
            ...competition,
            participantCount: participants.length,
            startingCash: parseFloat(competition.startingCash),
            commissionRate: parseFloat(competition.commissionRate),
            maxPositionSize: competition.maxPositionSize ? parseFloat(competition.maxPositionSize) : null,
        };
    }
    async getAllCompetitions() {
        const competitions = await this.db.query.competitions.findMany({
            orderBy: [(0, drizzle_orm_1.desc)(schema.competitions.createdAt)],
        });
        return competitions.map((c) => ({
            ...c,
            startingCash: parseFloat(c.startingCash),
            commissionRate: parseFloat(c.commissionRate),
            maxPositionSize: c.maxPositionSize ? parseFloat(c.maxPositionSize) : null,
        }));
    }
    async createCompetition(dto) {
        const competitionId = (0, uuid_1.v4)();
        const [competition] = await this.db.insert(schema.competitions).values({
            id: competitionId,
            name: dto.name,
            description: dto.description,
            status: 'draft',
            startingCash: dto.startingCash.toString(),
            commissionRate: dto.commissionRate.toString(),
            maxPositionSize: dto.maxPositionSize?.toString(),
            maxDailyTrades: dto.maxDailyTrades,
            allowShortSelling: dto.allowShortSelling ?? false,
            allowMargin: dto.allowMargin ?? false,
            startTime: new Date(dto.startTime),
            endTime: new Date(dto.endTime),
            tradingHoursStart: dto.tradingHoursStart ?? '11:00',
            tradingHoursEnd: dto.tradingHoursEnd ?? '15:00',
            isDefault: dto.isDefault ?? false,
        }).returning();
        return {
            ...competition,
            startingCash: parseFloat(competition.startingCash),
            commissionRate: parseFloat(competition.commissionRate),
        };
    }
    async updateCompetition(id, dto) {
        await this.getCompetition(id);
        const updateData = { updatedAt: new Date() };
        if (dto.name)
            updateData.name = dto.name;
        if (dto.description !== undefined)
            updateData.description = dto.description;
        if (dto.status)
            updateData.status = dto.status;
        if (dto.startingCash)
            updateData.startingCash = dto.startingCash.toString();
        if (dto.commissionRate !== undefined)
            updateData.commissionRate = dto.commissionRate.toString();
        if (dto.maxPositionSize !== undefined)
            updateData.maxPositionSize = dto.maxPositionSize?.toString();
        if (dto.maxDailyTrades !== undefined)
            updateData.maxDailyTrades = dto.maxDailyTrades;
        if (dto.allowShortSelling !== undefined)
            updateData.allowShortSelling = dto.allowShortSelling;
        if (dto.allowMargin !== undefined)
            updateData.allowMargin = dto.allowMargin;
        if (dto.startTime)
            updateData.startTime = new Date(dto.startTime);
        if (dto.endTime)
            updateData.endTime = new Date(dto.endTime);
        if (dto.tradingHoursStart !== undefined)
            updateData.tradingHoursStart = dto.tradingHoursStart;
        if (dto.tradingHoursEnd !== undefined)
            updateData.tradingHoursEnd = dto.tradingHoursEnd;
        if (dto.isDefault !== undefined)
            updateData.isDefault = dto.isDefault;
        const [updated] = await this.db.update(schema.competitions)
            .set(updateData)
            .where((0, drizzle_orm_1.eq)(schema.competitions.id, id))
            .returning();
        return {
            ...updated,
            startingCash: parseFloat(updated.startingCash),
            commissionRate: parseFloat(updated.commissionRate),
        };
    }
    async updateStatus(id, status) {
        const competition = await this.getCompetition(id);
        const validTransitions = {
            draft: ['scheduled', 'bidding', 'active'],
            scheduled: ['bidding', 'active', 'draft'],
            bidding: ['active', 'paused', 'ended'],
            active: ['paused', 'remarks', 'ended'],
            paused: ['active', 'ended'],
            remarks: ['ended'],
            ended: [],
        };
        if (!validTransitions[competition.status]?.includes(status)) {
            throw new common_1.BadRequestException(`Cannot transition from ${competition.status} to ${status}`);
        }
        return this.updateCompetition(id, { status });
    }
    async joinCompetition(userId, competitionId) {
        const competition = await this.getCompetition(competitionId);
        const existing = await this.db.query.competitionParticipants.findFirst({
            where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.competitionParticipants.userId, userId), (0, drizzle_orm_1.eq)(schema.competitionParticipants.competitionId, competitionId)),
        });
        if (existing) {
            if (existing.isActive) {
                throw new common_1.BadRequestException('Already joined this competition');
            }
            await this.db.update(schema.competitionParticipants)
                .set({ isActive: true })
                .where((0, drizzle_orm_1.eq)(schema.competitionParticipants.id, existing.id));
        }
        else {
            await this.db.insert(schema.competitionParticipants).values({
                competitionId,
                userId,
                isActive: true,
            });
        }
        const portfolio = await this.db.query.portfolios.findFirst({
            where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.portfolios.userId, userId), (0, drizzle_orm_1.eq)(schema.portfolios.competitionId, competitionId)),
        });
        if (!portfolio) {
            await this.db.insert(schema.portfolios).values({
                userId,
                competitionId,
                cash: competition.startingCash.toString(),
                realizedPL: '0',
                tradeCount: 0,
            });
            await this.db.insert(schema.ledgerEntries).values({
                userId,
                competitionId,
                type: 'initial',
                amount: competition.startingCash.toString(),
                balanceAfter: competition.startingCash.toString(),
                description: 'Initial competition balance',
            });
        }
        return { success: true, message: 'Successfully joined competition' };
    }
    async getCompetitionStats(competitionId) {
        const competition = await this.getCompetition(competitionId);
        const participants = await this.db.query.competitionParticipants.findMany({
            where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.competitionParticipants.competitionId, competitionId), (0, drizzle_orm_1.eq)(schema.competitionParticipants.isActive, true)),
        });
        const trades = await this.db.query.trades.findMany({
            where: (0, drizzle_orm_1.eq)(schema.trades.competitionId, competitionId),
        });
        const totalVolume = trades.reduce((sum, t) => sum + parseFloat(t.total), 0);
        const now = new Date();
        const endTime = new Date(competition.endTime);
        const remainingMs = Math.max(0, endTime.getTime() - now.getTime());
        return {
            competitionId,
            name: competition.name,
            status: competition.status,
            participantCount: participants.length,
            totalTrades: trades.length,
            totalVolume,
            startTime: competition.startTime,
            endTime: competition.endTime,
            remainingTimeMs: remainingMs,
            remainingTimeFormatted: this.formatRemainingTime(remainingMs),
        };
    }
    async resetCompetition(competitionId) {
        const competition = await this.getCompetition(competitionId);
        await this.db.delete(schema.trades)
            .where((0, drizzle_orm_1.eq)(schema.trades.competitionId, competitionId));
        await this.db.delete(schema.holdings)
            .where((0, drizzle_orm_1.eq)(schema.holdings.competitionId, competitionId));
        await this.db.delete(schema.ledgerEntries)
            .where((0, drizzle_orm_1.eq)(schema.ledgerEntries.competitionId, competitionId));
        await this.db.delete(schema.orders)
            .where((0, drizzle_orm_1.eq)(schema.orders.competitionId, competitionId));
        const participants = await this.db.query.competitionParticipants.findMany({
            where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.competitionParticipants.competitionId, competitionId), (0, drizzle_orm_1.eq)(schema.competitionParticipants.isActive, true)),
        });
        for (const participant of participants) {
            const user = await this.db.query.users.findFirst({
                where: (0, drizzle_orm_1.eq)(schema.users.id, participant.userId),
            });
            if (!user) {
                continue;
            }
            await this.db.update(schema.portfolios)
                .set({
                cash: competition.startingCash.toString(),
                realizedPL: '0',
                tradeCount: 0,
                updatedAt: new Date(),
            })
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.portfolios.userId, participant.userId), (0, drizzle_orm_1.eq)(schema.portfolios.competitionId, competitionId)));
            await this.db.insert(schema.ledgerEntries).values({
                userId: participant.userId,
                competitionId,
                type: 'initial',
                amount: competition.startingCash.toString(),
                balanceAfter: competition.startingCash.toString(),
                description: 'Competition reset - initial balance restored',
            });
        }
        await this.db.update(schema.competitions)
            .set({ status: 'scheduled', updatedAt: new Date() })
            .where((0, drizzle_orm_1.eq)(schema.competitions.id, competitionId));
        return { success: true, message: 'Competition reset successfully' };
    }
    formatRemainingTime(ms) {
        if (ms <= 0)
            return '00:00:00';
        const hours = Math.floor(ms / (1000 * 60 * 60));
        const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((ms % (1000 * 60)) / 1000);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    async generateCompetitionReport(competitionId) {
        const competition = await this.getCompetition(competitionId);
        const participants = await this.db.query.competitionParticipants.findMany({
            where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.competitionParticipants.competitionId, competitionId), (0, drizzle_orm_1.eq)(schema.competitionParticipants.isActive, true)),
        });
        const reportData = await Promise.all(participants.map(async (p) => {
            const user = await this.db.query.users.findFirst({
                where: (0, drizzle_orm_1.eq)(schema.users.id, p.userId),
            });
            const portfolio = await this.db.query.portfolios.findFirst({
                where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.portfolios.userId, p.userId), (0, drizzle_orm_1.eq)(schema.portfolios.competitionId, competitionId)),
            });
            const remarks = await this.db.query.remarks.findMany({
                where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.remarks.userId, p.userId), (0, drizzle_orm_1.eq)(schema.remarks.competitionId, competitionId)),
            });
            const totalScore = remarks.reduce((sum, r) => sum + (r.score || 0), 0);
            const strategyRemark = remarks.find((r) => r.type === 'strategy')?.content || '';
            const riskRemark = remarks.find((r) => r.type === 'risk_assessment')?.content || '';
            const tradeJustificationsCount = remarks.filter((r) => r.type === 'trade_justification').length;
            return {
                userId: p.userId,
                name: user?.fullName || 'Unknown',
                email: user?.email || 'Unknown',
                totalTrades: portfolio?.tradeCount || 0,
                realizedPL: portfolio?.realizedPL || 0,
                cash: portfolio?.cash || 0,
                remarksScore: totalScore,
                tradeJustificationsCount,
                strategyRemark: strategyRemark.replace(/"/g, '""'),
                riskRemark: riskRemark.replace(/"/g, '""'),
            };
        }));
        const header = [
            'User ID',
            'Name',
            'Email',
            'Total Trades',
            'Realized P/L',
            'Cash Balance',
            'Total Score',
            'Justifications Count',
            'Strategy Remark',
            'Risk Remark'
        ].join(',');
        const rows = reportData.map(d => [
            d.userId,
            `"${d.name}"`,
            d.email,
            d.totalTrades,
            d.realizedPL,
            d.cash,
            d.remarksScore,
            d.tradeJustificationsCount,
            `"${d.strategyRemark}"`,
            `"${d.riskRemark}"`
        ].join(','));
        return [header, ...rows].join('\n');
    }
};
exports.CompetitionService = CompetitionService;
exports.CompetitionService = CompetitionService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(database_module_1.DATABASE_CONNECTION)),
    __metadata("design:paramtypes", [Object])
], CompetitionService);
//# sourceMappingURL=competition.service.js.map