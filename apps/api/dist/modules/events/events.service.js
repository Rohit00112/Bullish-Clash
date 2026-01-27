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
exports.EventsService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const drizzle_orm_1 = require("drizzle-orm");
const uuid_1 = require("uuid");
const database_module_1 = require("../../database/database.module");
const schema = require("../../database/schema");
const prices_service_1 = require("../prices/prices.service");
const symbols_service_1 = require("../symbols/symbols.service");
const trading_gateway_1 = require("../websocket/trading.gateway");
const leaderboard_service_1 = require("../leaderboard/leaderboard.service");
let EventsService = class EventsService {
    db;
    pricesService;
    symbolsService;
    tradingGateway;
    leaderboardService;
    constructor(db, pricesService, symbolsService, tradingGateway, leaderboardService) {
        this.db = db;
        this.pricesService = pricesService;
        this.symbolsService = symbolsService;
        this.tradingGateway = tradingGateway;
        this.leaderboardService = leaderboardService;
    }
    async createEvent(dto, adminId) {
        const eventId = (0, uuid_1.v4)();
        if (dto.affectedSymbols && dto.affectedSymbols.length > 0) {
            for (const symbolId of dto.affectedSymbols) {
                await this.symbolsService.findById(symbolId);
            }
        }
        const [event] = await this.db.insert(schema.marketEvents).values({
            id: eventId,
            title: dto.title,
            description: dto.description,
            impactType: dto.impactType,
            priceUpdateType: dto.priceUpdateType,
            magnitude: dto.magnitude.toString(),
            affectedSymbols: dto.affectedSymbols || [],
            affectAllSymbols: dto.affectAllSymbols ?? false,
            isExecuted: false,
            scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
            createdBy: adminId,
        }).returning();
        await this.logAdminAction(adminId, 'CREATE_EVENT', 'market_events', eventId, {
            title: dto.title,
            magnitude: dto.magnitude,
            priceUpdateType: dto.priceUpdateType,
        });
        if (dto.executeNow) {
            return this.executeEvent(eventId, adminId);
        }
        return {
            ...event,
            magnitude: parseFloat(event.magnitude),
        };
    }
    async executeEvent(eventId, adminId) {
        const event = await this.db.query.marketEvents.findFirst({
            where: (0, drizzle_orm_1.eq)(schema.marketEvents.id, eventId),
        });
        if (!event) {
            throw new common_1.NotFoundException('Event not found');
        }
        if (event.isExecuted) {
            throw new common_1.BadRequestException('Event has already been executed');
        }
        let symbolIds;
        if (event.affectAllSymbols) {
            const allSymbols = await this.symbolsService.findAll({ activeOnly: true });
            symbolIds = allSymbols.map((s) => s.id);
        }
        else {
            symbolIds = event.affectedSymbols || [];
        }
        if (symbolIds.length === 0) {
            throw new common_1.BadRequestException('No symbols to update');
        }
        const priceUpdates = symbolIds.map(symbolId => ({
            symbolId,
            priceUpdateType: event.priceUpdateType,
            magnitude: parseFloat(event.magnitude),
            eventId,
        }));
        const results = await this.pricesService.batchUpdatePrices(priceUpdates);
        for (const result of results) {
            if (!result.error) {
                await this.db.insert(schema.eventExecutionLogs).values({
                    eventId,
                    symbolId: result.symbolId,
                    previousPrice: result.previousPrice.toString(),
                    newPrice: result.newPrice.toString(),
                    change: result.change.toString(),
                    changePercent: result.changePercent.toString(),
                });
            }
        }
        const [updatedEvent] = await this.db.update(schema.marketEvents)
            .set({
            isExecuted: true,
            executedAt: new Date(),
            executedBy: adminId,
            updatedAt: new Date(),
        })
            .where((0, drizzle_orm_1.eq)(schema.marketEvents.id, eventId))
            .returning();
        await this.logAdminAction(adminId, 'EXECUTE_EVENT', 'market_events', eventId, {
            symbolsAffected: symbolIds.length,
            results: results.length,
        });
        this.tradingGateway.broadcastMarketEvent({
            eventId,
            title: event.title,
            description: event.description,
            impactType: event.impactType,
            symbolsAffected: symbolIds.length,
        });
        await this.leaderboardService.invalidateCache();
        this.tradingGateway.triggerLeaderboardUpdate();
        return {
            event: {
                ...updatedEvent,
                magnitude: parseFloat(updatedEvent.magnitude),
            },
            results,
            summary: {
                symbolsAffected: symbolIds.length,
                successful: results.filter((r) => !r.error).length,
                failed: results.filter((r) => r.error).length,
            },
        };
    }
    async getEvents(options) {
        let conditions = [];
        if (options?.executed !== undefined) {
            conditions.push((0, drizzle_orm_1.eq)(schema.marketEvents.isExecuted, options.executed));
        }
        const events = await this.db.query.marketEvents.findMany({
            where: conditions.length > 0 ? (0, drizzle_orm_1.and)(...conditions) : undefined,
            orderBy: [(0, drizzle_orm_1.desc)(schema.marketEvents.createdAt)],
            limit: options?.limit || 50,
        });
        return events.map((e) => ({
            ...e,
            magnitude: parseFloat(e.magnitude),
        }));
    }
    async getEvent(id) {
        const event = await this.db.query.marketEvents.findFirst({
            where: (0, drizzle_orm_1.eq)(schema.marketEvents.id, id),
        });
        if (!event) {
            throw new common_1.NotFoundException('Event not found');
        }
        let executionLogs = [];
        if (event.isExecuted) {
            executionLogs = await this.db.query.eventExecutionLogs.findMany({
                where: (0, drizzle_orm_1.eq)(schema.eventExecutionLogs.eventId, id),
            });
        }
        return {
            ...event,
            magnitude: parseFloat(event.magnitude),
            executionLogs: executionLogs.map((l) => ({
                ...l,
                previousPrice: parseFloat(l.previousPrice),
                newPrice: parseFloat(l.newPrice),
                change: parseFloat(l.change),
                changePercent: parseFloat(l.changePercent),
            })),
        };
    }
    async deleteEvent(id, adminId) {
        const event = await this.getEvent(id);
        if (event.isExecuted) {
            throw new common_1.BadRequestException('Cannot delete an executed event');
        }
        await this.db.delete(schema.marketEvents)
            .where((0, drizzle_orm_1.eq)(schema.marketEvents.id, id));
        await this.logAdminAction(adminId, 'DELETE_EVENT', 'market_events', id, {
            title: event.title,
        });
        return { success: true };
    }
    async updateEvent(id, dto, adminId) {
        const event = await this.db.query.marketEvents.findFirst({
            where: (0, drizzle_orm_1.eq)(schema.marketEvents.id, id),
        });
        if (!event) {
            throw new common_1.NotFoundException('Event not found');
        }
        if (event.isExecuted) {
            throw new common_1.BadRequestException('Cannot update an executed event');
        }
        if (dto.affectedSymbols && dto.affectedSymbols.length > 0) {
            for (const symbolId of dto.affectedSymbols) {
                await this.symbolsService.findById(symbolId);
            }
        }
        const updateData = {
            updatedAt: new Date(),
        };
        if (dto.title !== undefined)
            updateData.title = dto.title;
        if (dto.description !== undefined)
            updateData.description = dto.description;
        if (dto.impactType !== undefined)
            updateData.impactType = dto.impactType;
        if (dto.priceUpdateType !== undefined)
            updateData.priceUpdateType = dto.priceUpdateType;
        if (dto.magnitude !== undefined)
            updateData.magnitude = dto.magnitude.toString();
        if (dto.affectedSymbols !== undefined)
            updateData.affectedSymbols = dto.affectedSymbols;
        if (dto.affectAllSymbols !== undefined)
            updateData.affectAllSymbols = dto.affectAllSymbols;
        if (dto.scheduledAt !== undefined)
            updateData.scheduledAt = dto.scheduledAt ? new Date(dto.scheduledAt) : null;
        const [updatedEvent] = await this.db.update(schema.marketEvents)
            .set(updateData)
            .where((0, drizzle_orm_1.eq)(schema.marketEvents.id, id))
            .returning();
        await this.logAdminAction(adminId, 'UPDATE_EVENT', 'market_events', id, {
            title: updatedEvent.title,
            changes: Object.keys(updateData).filter(k => k !== 'updatedAt'),
        });
        return {
            ...updatedEvent,
            magnitude: parseFloat(updatedEvent.magnitude),
        };
    }
    async processScheduledEvents() {
        const now = new Date();
        const scheduledEvents = await this.db.query.marketEvents.findMany({
            where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.marketEvents.isExecuted, false), (0, drizzle_orm_1.lte)(schema.marketEvents.scheduledAt, now)),
        });
        for (const event of scheduledEvents) {
            try {
                console.log(`Executing scheduled event: ${event.title}`);
                await this.executeEvent(event.id, event.createdBy);
            }
            catch (error) {
                console.error(`Failed to execute scheduled event ${event.id}:`, error);
            }
        }
    }
    async logAdminAction(adminId, action, resource, resourceId, details) {
        await this.db.insert(schema.adminAuditLogs).values({
            adminId,
            action,
            resource,
            resourceId,
            details,
        });
    }
    async getAuditLogs(options) {
        let conditions = [];
        if (options?.adminId) {
            conditions.push((0, drizzle_orm_1.eq)(schema.adminAuditLogs.adminId, options.adminId));
        }
        if (options?.action) {
            conditions.push((0, drizzle_orm_1.eq)(schema.adminAuditLogs.action, options.action));
        }
        return this.db.query.adminAuditLogs.findMany({
            where: conditions.length > 0 ? (0, drizzle_orm_1.and)(...conditions) : undefined,
            orderBy: [(0, drizzle_orm_1.desc)(schema.adminAuditLogs.createdAt)],
            limit: options?.limit || 100,
        });
    }
};
exports.EventsService = EventsService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_10_SECONDS),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], EventsService.prototype, "processScheduledEvents", null);
exports.EventsService = EventsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(database_module_1.DATABASE_CONNECTION)),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => prices_service_1.PricesService))),
    __param(3, (0, common_1.Inject)((0, common_1.forwardRef)(() => trading_gateway_1.TradingGateway))),
    __param(4, (0, common_1.Inject)((0, common_1.forwardRef)(() => leaderboard_service_1.LeaderboardService))),
    __metadata("design:paramtypes", [Object, prices_service_1.PricesService,
        symbols_service_1.SymbolsService,
        trading_gateway_1.TradingGateway,
        leaderboard_service_1.LeaderboardService])
], EventsService);
//# sourceMappingURL=events.service.js.map