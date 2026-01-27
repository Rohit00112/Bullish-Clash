// ============================================================
// Bullish Clash - Events Service (Admin Price Scripts)
// ============================================================

import { Injectable, Inject, NotFoundException, BadRequestException, forwardRef } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { eq, and, desc, lte, isNull } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';
import { DATABASE_CONNECTION } from '../../database/database.module';
import * as schema from '../../database/schema';
import { PricesService, PriceUpdate } from '../prices/prices.service';
import { SymbolsService } from '../symbols/symbols.service';
import { TradingGateway } from '../websocket/trading.gateway';
import { LeaderboardService } from '../leaderboard/leaderboard.service';
import { CreateEventDto, UpdateEventDto } from './events.dto';

@Injectable()
export class EventsService {
    constructor(
        @Inject(DATABASE_CONNECTION) private readonly db: any,
        @Inject(forwardRef(() => PricesService)) private readonly pricesService: PricesService,
        private readonly symbolsService: SymbolsService,
        @Inject(forwardRef(() => TradingGateway)) private readonly tradingGateway: TradingGateway,
        @Inject(forwardRef(() => LeaderboardService)) private readonly leaderboardService: LeaderboardService,
    ) { }

    // Create a new market event
    async createEvent(dto: CreateEventDto, adminId: string) {
        const eventId = uuid();

        // Validate affected symbols if specified
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

        // Log admin action
        await this.logAdminAction(adminId, 'CREATE_EVENT', 'market_events', eventId, {
            title: dto.title,
            magnitude: dto.magnitude,
            priceUpdateType: dto.priceUpdateType,
        });

        // Execute immediately if requested
        if (dto.executeNow) {
            return this.executeEvent(eventId, adminId);
        }

        return {
            ...event,
            magnitude: parseFloat(event.magnitude),
        };
    }

    // Execute a market event
    async executeEvent(eventId: string, adminId: string) {
        const event = await this.db.query.marketEvents.findFirst({
            where: eq(schema.marketEvents.id, eventId),
        });

        if (!event) {
            throw new NotFoundException('Event not found');
        }

        if (event.isExecuted) {
            throw new BadRequestException('Event has already been executed');
        }

        // Get symbols to update
        let symbolIds: string[];

        if (event.affectAllSymbols) {
            const allSymbols = await this.symbolsService.findAll({ activeOnly: true });
            symbolIds = allSymbols.map((s: any) => s.id);
        } else {
            symbolIds = event.affectedSymbols || [];
        }

        if (symbolIds.length === 0) {
            throw new BadRequestException('No symbols to update');
        }

        // Prepare price updates
        const priceUpdates: PriceUpdate[] = symbolIds.map(symbolId => ({
            symbolId,
            priceUpdateType: event.priceUpdateType,
            magnitude: parseFloat(event.magnitude),
            eventId,
        }));

        // Execute price updates
        const results = await this.pricesService.batchUpdatePrices(priceUpdates);

        // Record execution logs
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

        // Mark event as executed
        const [updatedEvent] = await this.db.update(schema.marketEvents)
            .set({
                isExecuted: true,
                executedAt: new Date(),
                executedBy: adminId,
                updatedAt: new Date(),
            })
            .where(eq(schema.marketEvents.id, eventId))
            .returning();

        // Log admin action
        await this.logAdminAction(adminId, 'EXECUTE_EVENT', 'market_events', eventId, {
            symbolsAffected: symbolIds.length,
            results: results.length,
        });

        // Broadcast market event notification
        this.tradingGateway.broadcastMarketEvent({
            eventId,
            title: event.title,
            description: event.description,
            impactType: event.impactType,
            symbolsAffected: symbolIds.length,
        });

        // Invalidate leaderboard cache
        await this.leaderboardService.invalidateCache();

        // Trigger leaderboard update
        this.tradingGateway.triggerLeaderboardUpdate();

        return {
            event: {
                ...updatedEvent,
                magnitude: parseFloat(updatedEvent.magnitude),
            },
            results,
            summary: {
                symbolsAffected: symbolIds.length,
                successful: results.filter((r: any) => !r.error).length,
                failed: results.filter((r: any) => r.error).length,
            },
        };
    }

    // Get all events
    async getEvents(options?: { executed?: boolean; limit?: number }) {
        let conditions: any[] = [];

        if (options?.executed !== undefined) {
            conditions.push(eq(schema.marketEvents.isExecuted, options.executed));
        }

        const events = await this.db.query.marketEvents.findMany({
            where: conditions.length > 0 ? and(...conditions) : undefined,
            orderBy: [desc(schema.marketEvents.createdAt)],
            limit: options?.limit || 50,
        });

        return events.map((e: any) => ({
            ...e,
            magnitude: parseFloat(e.magnitude),
        }));
    }

    // Get event by ID
    async getEvent(id: string) {
        const event = await this.db.query.marketEvents.findFirst({
            where: eq(schema.marketEvents.id, id),
        });

        if (!event) {
            throw new NotFoundException('Event not found');
        }

        // Get execution logs if executed
        let executionLogs: any[] = [];
        if (event.isExecuted) {
            executionLogs = await this.db.query.eventExecutionLogs.findMany({
                where: eq(schema.eventExecutionLogs.eventId, id),
            });
        }

        return {
            ...event,
            magnitude: parseFloat(event.magnitude),
            executionLogs: executionLogs.map((l: any) => ({
                ...l,
                previousPrice: parseFloat(l.previousPrice),
                newPrice: parseFloat(l.newPrice),
                change: parseFloat(l.change),
                changePercent: parseFloat(l.changePercent),
            })),
        };
    }

    // Delete event (only if not executed)
    async deleteEvent(id: string, adminId: string) {
        const event = await this.getEvent(id);

        if (event.isExecuted) {
            throw new BadRequestException('Cannot delete an executed event');
        }

        await this.db.delete(schema.marketEvents)
            .where(eq(schema.marketEvents.id, id));

        await this.logAdminAction(adminId, 'DELETE_EVENT', 'market_events', id, {
            title: event.title,
        });

        return { success: true };
    }

    // Update event (only if not executed)
    async updateEvent(id: string, dto: UpdateEventDto, adminId: string) {
        const event = await this.db.query.marketEvents.findFirst({
            where: eq(schema.marketEvents.id, id),
        });

        if (!event) {
            throw new NotFoundException('Event not found');
        }

        if (event.isExecuted) {
            throw new BadRequestException('Cannot update an executed event');
        }

        // Validate affected symbols if specified
        if (dto.affectedSymbols && dto.affectedSymbols.length > 0) {
            for (const symbolId of dto.affectedSymbols) {
                await this.symbolsService.findById(symbolId);
            }
        }

        const updateData: any = {
            updatedAt: new Date(),
        };

        if (dto.title !== undefined) updateData.title = dto.title;
        if (dto.description !== undefined) updateData.description = dto.description;
        if (dto.impactType !== undefined) updateData.impactType = dto.impactType;
        if (dto.priceUpdateType !== undefined) updateData.priceUpdateType = dto.priceUpdateType;
        if (dto.magnitude !== undefined) updateData.magnitude = dto.magnitude.toString();
        if (dto.affectedSymbols !== undefined) updateData.affectedSymbols = dto.affectedSymbols;
        if (dto.affectAllSymbols !== undefined) updateData.affectAllSymbols = dto.affectAllSymbols;
        if (dto.scheduledAt !== undefined) updateData.scheduledAt = dto.scheduledAt ? new Date(dto.scheduledAt) : null;

        const [updatedEvent] = await this.db.update(schema.marketEvents)
            .set(updateData)
            .where(eq(schema.marketEvents.id, id))
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

    // Check for scheduled events and execute them
    @Cron(CronExpression.EVERY_10_SECONDS)
    async processScheduledEvents() {
        const now = new Date();

        const scheduledEvents = await this.db.query.marketEvents.findMany({
            where: and(
                eq(schema.marketEvents.isExecuted, false),
                lte(schema.marketEvents.scheduledAt, now),
            ),
        });

        for (const event of scheduledEvents) {
            try {
                console.log(`Executing scheduled event: ${event.title}`);
                await this.executeEvent(event.id, event.createdBy);
            } catch (error) {
                console.error(`Failed to execute scheduled event ${event.id}:`, error);
            }
        }
    }

    // Log admin action
    private async logAdminAction(
        adminId: string,
        action: string,
        resource: string,
        resourceId: string,
        details: any,
    ) {
        await this.db.insert(schema.adminAuditLogs).values({
            adminId,
            action,
            resource,
            resourceId,
            details,
        });
    }

    // Get admin audit logs
    async getAuditLogs(options?: { adminId?: string; action?: string; limit?: number }) {
        let conditions: any[] = [];

        if (options?.adminId) {
            conditions.push(eq(schema.adminAuditLogs.adminId, options.adminId));
        }

        if (options?.action) {
            conditions.push(eq(schema.adminAuditLogs.action, options.action));
        }

        return this.db.query.adminAuditLogs.findMany({
            where: conditions.length > 0 ? and(...conditions) : undefined,
            orderBy: [desc(schema.adminAuditLogs.createdAt)],
            limit: options?.limit || 100,
        });
    }
}
