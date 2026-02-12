// ============================================================
// Bullish Battle - Events Controller (Admin Price Scripts)
// ============================================================

import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { EventsService } from './events.service';
import { CreateEventDto, UpdateEventDto } from './events.dto';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '../auth/auth.guards';

@ApiTags('events')
@Controller('events')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class EventsController {
    constructor(private readonly eventsService: EventsService) { }

    @Get()
    @ApiOperation({ summary: 'Get all market events (admin gets all, users get executed only)' })
    @ApiQuery({ name: 'executed', required: false, type: Boolean })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiResponse({ status: 200, description: 'List of events' })
    async getEvents(
        @Query('executed') executed?: boolean,
        @Query('limit') limit?: number,
        @CurrentUser('role') role?: string,
    ) {
        // Non-admin users can only see executed events
        if (role !== 'admin') {
            return this.eventsService.getEvents({ executed: true, limit });
        }
        return this.eventsService.getEvents({ executed, limit });
    }

    @Get('examples')
    @Roles('admin')
    @ApiOperation({ summary: 'Get example event scripts' })
    @ApiResponse({ status: 200, description: 'Example events' })
    getExamples() {
        return {
            examples: [
                {
                    name: 'Market-wide Negative Sentiment (-2%)',
                    description: 'Apply a -2% drop to all stocks (e.g., global market correction news)',
                    request: {
                        title: 'Global Market Correction - Risk-Off Sentiment',
                        description: 'International markets declined following Fed rate hike concerns...',
                        impactType: 'negative',
                        priceUpdateType: 'percentage',
                        magnitude: -2.0,
                        affectAllSymbols: true,
                        executeNow: true,
                    },
                },
                {
                    name: 'Single Stock Earnings Beat (+5%)',
                    description: 'NABIL beats earnings expectations, stock rises 5%',
                    request: {
                        title: 'NABIL Q3 Earnings Beat - Strong Growth',
                        description: 'Nabil Bank reported 25% YoY growth in net profit, exceeding analyst expectations...',
                        impactType: 'positive',
                        priceUpdateType: 'percentage',
                        magnitude: 5.0,
                        affectedSymbols: ['<NABIL_SYMBOL_ID>'],
                        executeNow: true,
                    },
                },
                {
                    name: 'Sector Rotation - Banking Sector Rally',
                    description: 'Banking sector rallies on NRB policy announcement',
                    request: {
                        title: 'NRB Loosens CCD Ratio - Banks Rally',
                        description: 'Nepal Rastra Bank announced relaxation in CCD ratio requirements...',
                        impactType: 'positive',
                        priceUpdateType: 'percentage',
                        magnitude: 3.5,
                        affectedSymbols: ['<BANK_SYMBOL_IDS>'],
                        executeNow: true,
                    },
                },
                {
                    name: 'Hydropower Sector Decline',
                    description: 'Hydropower stocks fall on dry season concerns',
                    request: {
                        title: 'Dry Season Impact on Hydropower Generation',
                        description: 'Water levels at major rivers reach critical lows...',
                        impactType: 'negative',
                        priceUpdateType: 'percentage',
                        magnitude: -4.0,
                        affectedSymbols: ['<HYDROPOWER_SYMBOL_IDS>'],
                        executeNow: false,
                        scheduledAt: '2026-01-22T10:00:00+05:45',
                    },
                },
                {
                    name: 'IPO Listing - Price Override',
                    description: 'Set initial trading price for new listing',
                    request: {
                        title: 'New Company Lists at Premium',
                        description: 'XYZ Company shares begin trading...',
                        impactType: 'neutral',
                        priceUpdateType: 'override',
                        magnitude: 500,
                        affectedSymbols: ['<NEW_SYMBOL_ID>'],
                        executeNow: true,
                    },
                },
            ],
        };
    }

    @Get('audit-logs')
    @Roles('admin')
    @ApiOperation({ summary: 'Get admin audit logs' })
    @ApiQuery({ name: 'adminId', required: false })
    @ApiQuery({ name: 'action', required: false })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiResponse({ status: 200, description: 'Audit logs' })
    async getAuditLogs(
        @Query('adminId') adminId?: string,
        @Query('action') action?: string,
        @Query('limit') limit?: number,
    ) {
        return this.eventsService.getAuditLogs({ adminId, action, limit });
    }

    @Get(':id')
    @Roles('admin')
    @ApiOperation({ summary: 'Get event by ID' })
    @ApiResponse({ status: 200, description: 'Event details with execution logs' })
    async getEvent(@Param('id') id: string) {
        return this.eventsService.getEvent(id);
    }

    @Post()
    @Roles('admin')
    @ApiOperation({ summary: 'Create a new market event' })
    @ApiResponse({ status: 201, description: 'Event created' })
    async createEvent(
        @Body() dto: CreateEventDto,
        @CurrentUser('id') adminId: string,
    ) {
        return this.eventsService.createEvent(dto, adminId);
    }

    @Post(':id/execute')
    @Roles('admin')
    @ApiOperation({ summary: 'Execute a pending event' })
    @ApiResponse({ status: 200, description: 'Event executed' })
    async executeEvent(
        @Param('id') id: string,
        @CurrentUser('id') adminId: string,
    ) {
        return this.eventsService.executeEvent(id, adminId);
    }

    @Put(':id')
    @Roles('admin')
    @ApiOperation({ summary: 'Update a pending event' })
    @ApiResponse({ status: 200, description: 'Event updated' })
    async updateEvent(
        @Param('id') id: string,
        @Body() dto: UpdateEventDto,
        @CurrentUser('id') adminId: string,
    ) {
        return this.eventsService.updateEvent(id, dto, adminId);
    }

    @Delete(':id')
    @Roles('admin')
    @ApiOperation({ summary: 'Delete a pending event' })
    @ApiResponse({ status: 200, description: 'Event deleted' })
    async deleteEvent(
        @Param('id') id: string,
        @CurrentUser('id') adminId: string,
    ) {
        return this.eventsService.deleteEvent(id, adminId);
    }
}
