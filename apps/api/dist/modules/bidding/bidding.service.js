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
exports.BiddingService = void 0;
const common_1 = require("@nestjs/common");
const drizzle_orm_1 = require("drizzle-orm");
const database_module_1 = require("../../database/database.module");
const schema = require("../../database/schema");
const competition_service_1 = require("../competition/competition.service");
let BiddingService = class BiddingService {
    db;
    competitionService;
    constructor(db, competitionService) {
        this.db = db;
        this.competitionService = competitionService;
    }
    async placeBid(userId, dto) {
        const competition = await this.competitionService.getActiveCompetition();
        if (!competition) {
            throw new common_1.NotFoundException('No active competition found');
        }
        if (competition.status !== 'bidding') {
            throw new common_1.BadRequestException(`Bidding is not active (Status: ${competition.status})`);
        }
        const symbol = await this.db.query.symbols.findFirst({
            where: (0, drizzle_orm_1.eq)(schema.symbols.id, dto.symbolId),
        });
        if (!symbol) {
            throw new common_1.NotFoundException('Symbol not found');
        }
        const totalCost = dto.price * dto.quantity;
        const portfolio = await this.db.query.portfolios.findFirst({
            where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.portfolios.userId, userId), (0, drizzle_orm_1.eq)(schema.portfolios.competitionId, competition.id)),
        });
        if (!portfolio) {
            throw new common_1.BadRequestException('You need to join the competition first');
        }
        if (Number(portfolio.cash) < totalCost) {
            throw new common_1.BadRequestException('Insufficient cash balance');
        }
        await this.db.transaction(async (tx) => {
            await tx.update(schema.portfolios)
                .set({
                cash: (Number(portfolio.cash) - totalCost).toString(),
                updatedAt: new Date(),
            })
                .where((0, drizzle_orm_1.eq)(schema.portfolios.id, portfolio.id));
            await tx.insert(schema.ledgerEntries).values({
                userId,
                competitionId: competition.id,
                type: 'bid_freeze',
                amount: (-totalCost).toString(),
                balanceAfter: (Number(portfolio.cash) - totalCost).toString(),
                description: `Bid placed for ${dto.quantity} ${symbol.symbol} @ ${dto.price}`,
            });
            await tx.insert(schema.bids).values({
                userId,
                competitionId: competition.id,
                symbolId: dto.symbolId,
                quantity: dto.quantity,
                price: dto.price.toString(),
                status: 'pending',
            });
        });
        return { success: true, message: 'Bid placed successfully' };
    }
    async getMyBids(userId) {
        const competition = await this.competitionService.getActiveCompetition();
        if (!competition) {
            return [];
        }
        const bids = await this.db.query.bids.findMany({
            where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.bids.userId, userId), (0, drizzle_orm_1.eq)(schema.bids.competitionId, competition.id)),
            orderBy: [(0, drizzle_orm_1.desc)(schema.bids.createdAt)],
        });
        const bidData = await Promise.all(bids.map(async (bid) => {
            const sym = await this.db.query.symbols.findFirst({
                where: (0, drizzle_orm_1.eq)(schema.symbols.id, bid.symbolId),
            });
            return {
                ...bid,
                symbolSymbol: sym?.symbol,
                price: parseFloat(bid.price),
                total: parseFloat(bid.price) * bid.quantity,
            };
        }));
        return bidData;
    }
    async processBids(competitionId) {
        const bids = await this.db.query.bids.findMany({
            where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.bids.competitionId, competitionId), (0, drizzle_orm_1.eq)(schema.bids.status, 'pending')),
        });
        if (bids.length === 0) {
            return { message: 'No pending bids to process' };
        }
        await this.db.transaction(async (tx) => {
            for (const bid of bids) {
                const existingHolding = await tx.query.holdings.findFirst({
                    where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.holdings.userId, bid.userId), (0, drizzle_orm_1.eq)(schema.holdings.competitionId, bid.competitionId), (0, drizzle_orm_1.eq)(schema.holdings.symbolId, bid.symbolId)),
                });
                const totalCost = Number(bid.price) * bid.quantity;
                if (existingHolding) {
                    const currentQty = existingHolding.quantity;
                    const currentCost = Number(existingHolding.totalCost);
                    const newQty = currentQty + bid.quantity;
                    const newCost = currentCost + totalCost;
                    const newAvg = newCost / newQty;
                    await tx.update(schema.holdings)
                        .set({
                        quantity: newQty,
                        totalCost: newCost.toString(),
                        avgPrice: newAvg.toString(),
                        updatedAt: new Date(),
                    })
                        .where((0, drizzle_orm_1.eq)(schema.holdings.id, existingHolding.id));
                }
                else {
                    await tx.insert(schema.holdings).values({
                        userId: bid.userId,
                        competitionId: bid.competitionId,
                        symbolId: bid.symbolId,
                        quantity: bid.quantity,
                        avgPrice: bid.price,
                        totalCost: totalCost.toString(),
                    });
                }
                await tx.update(schema.bids)
                    .set({
                    status: 'processed',
                    allocatedQuantity: bid.quantity,
                    updatedAt: new Date(),
                })
                    .where((0, drizzle_orm_1.eq)(schema.bids.id, bid.id));
            }
        });
        return { success: true, count: bids.length, message: 'Bids processed and allocated' };
    }
};
exports.BiddingService = BiddingService;
exports.BiddingService = BiddingService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(database_module_1.DATABASE_CONNECTION)),
    __metadata("design:paramtypes", [Object, competition_service_1.CompetitionService])
], BiddingService);
//# sourceMappingURL=bidding.service.js.map