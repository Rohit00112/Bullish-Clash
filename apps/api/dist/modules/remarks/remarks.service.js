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
exports.RemarksService = void 0;
const common_1 = require("@nestjs/common");
const drizzle_orm_1 = require("drizzle-orm");
const database_module_1 = require("../../database/database.module");
const schema = require("../../database/schema");
const competition_service_1 = require("../competition/competition.service");
let RemarksService = class RemarksService {
    db;
    competitionService;
    constructor(db, competitionService) {
        this.db = db;
        this.competitionService = competitionService;
    }
    async createRemark(userId, dto) {
        let competition = await this.db.query.competitions.findFirst({
            where: (0, drizzle_orm_1.eq)(schema.competitions.status, 'remarks'),
            orderBy: [(0, drizzle_orm_1.desc)(schema.competitions.startTime)],
        });
        if (!competition) {
            throw new common_1.BadRequestException('Remarks phase is not active.');
        }
        if (dto.symbolId) {
            const symbol = await this.db.query.symbols.findFirst({
                where: (0, drizzle_orm_1.eq)(schema.symbols.id, dto.symbolId),
            });
            if (!symbol)
                throw new common_1.NotFoundException('Symbol not found');
        }
        const existingWhere = [
            (0, drizzle_orm_1.eq)(schema.remarks.userId, userId),
            (0, drizzle_orm_1.eq)(schema.remarks.competitionId, competition.id),
            (0, drizzle_orm_1.eq)(schema.remarks.type, dto.type)
        ];
        if (dto.symbolId) {
            existingWhere.push((0, drizzle_orm_1.eq)(schema.remarks.symbolId, dto.symbolId));
        }
        const existingRemark = await this.db.query.remarks.findFirst({
            where: (0, drizzle_orm_1.and)(...existingWhere),
        });
        if (existingRemark) {
            throw new common_1.BadRequestException(`You have already submitted a ${dto.type.replace('_', ' ')} for this context. Please edit your existing remark instead.`);
        }
        const [remark] = await this.db.insert(schema.remarks).values({
            userId,
            competitionId: competition.id,
            symbolId: dto.symbolId,
            type: dto.type,
            title: dto.title,
            content: dto.content,
        }).returning();
        return remark;
    }
    async getMyRemarks(userId) {
        const competition = await this.db.query.competitions.findFirst({
            orderBy: [(0, drizzle_orm_1.desc)(schema.competitions.startTime)],
        });
        if (!competition)
            return [];
        const remarks = await this.db.query.remarks.findMany({
            where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.remarks.userId, userId), (0, drizzle_orm_1.eq)(schema.remarks.competitionId, competition.id)),
            orderBy: [(0, drizzle_orm_1.desc)(schema.remarks.createdAt)],
        });
        const remarksWithSymbols = await Promise.all(remarks.map(async (r) => {
            let symbolSymbol = null;
            if (r.symbolId) {
                const s = await this.db.query.symbols.findFirst({
                    where: (0, drizzle_orm_1.eq)(schema.symbols.id, r.symbolId),
                });
                symbolSymbol = s?.symbol;
            }
            return {
                ...r,
                symbolSymbol,
            };
        }));
        return remarksWithSymbols;
    }
    async getAllRemarks(competitionId) {
        const remarks = await this.db.query.remarks.findMany({
            where: (0, drizzle_orm_1.eq)(schema.remarks.competitionId, competitionId),
            orderBy: [(0, drizzle_orm_1.desc)(schema.remarks.createdAt)],
        });
        const remarksWithDetails = await Promise.all(remarks.map(async (r) => {
            let symbolSymbol = null;
            if (r.symbolId) {
                const s = await this.db.query.symbols.findFirst({
                    where: (0, drizzle_orm_1.eq)(schema.symbols.id, r.symbolId),
                });
                symbolSymbol = s?.symbol;
            }
            let user = r.user;
            if (!user) {
                user = await this.db.query.users.findFirst({
                    where: (0, drizzle_orm_1.eq)(schema.users.id, r.userId),
                });
            }
            return {
                ...r,
                symbolSymbol,
                userName: user?.fullName || 'Unknown User',
            };
        }));
        return remarksWithDetails;
    }
    async updateRemark(userId, remarkId, content) {
        const remark = await this.db.query.remarks.findFirst({
            where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.remarks.id, remarkId), (0, drizzle_orm_1.eq)(schema.remarks.userId, userId)),
        });
        if (!remark) {
            throw new common_1.NotFoundException('Remark not found or you do not have permission to edit it.');
        }
        const competition = await this.db.query.competitions.findFirst({
            where: (0, drizzle_orm_1.eq)(schema.competitions.id, remark.competitionId),
        });
        if (competition && competition.status !== 'remarks') {
            if (competition.status !== 'active') {
            }
        }
        await this.db.update(schema.remarks)
            .set({
            content: content,
            updatedAt: new Date(),
        })
            .where((0, drizzle_orm_1.eq)(schema.remarks.id, remarkId));
        return { message: 'Remark updated successfully' };
    }
    async scoreRemark(remarkId, score) {
        if (score < 0 || score > 100) {
            throw new common_1.BadRequestException('Score must be between 0 and 100');
        }
        await this.db.update(schema.remarks)
            .set({
            score: score,
            updatedAt: new Date(),
        })
            .where((0, drizzle_orm_1.eq)(schema.remarks.id, remarkId));
        return { message: 'Score updated successfully' };
    }
};
exports.RemarksService = RemarksService;
exports.RemarksService = RemarksService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(database_module_1.DATABASE_CONNECTION)),
    __metadata("design:paramtypes", [Object, competition_service_1.CompetitionService])
], RemarksService);
//# sourceMappingURL=remarks.service.js.map