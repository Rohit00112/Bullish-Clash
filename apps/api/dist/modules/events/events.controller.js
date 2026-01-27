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
exports.EventsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const events_service_1 = require("./events.service");
const events_dto_1 = require("./events.dto");
const auth_guards_1 = require("../auth/auth.guards");
let EventsController = class EventsController {
    eventsService;
    constructor(eventsService) {
        this.eventsService = eventsService;
    }
    async getEvents(executed, limit, role) {
        if (role !== 'admin') {
            return this.eventsService.getEvents({ executed: true, limit });
        }
        return this.eventsService.getEvents({ executed, limit });
    }
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
    async getAuditLogs(adminId, action, limit) {
        return this.eventsService.getAuditLogs({ adminId, action, limit });
    }
    async getEvent(id) {
        return this.eventsService.getEvent(id);
    }
    async createEvent(dto, adminId) {
        return this.eventsService.createEvent(dto, adminId);
    }
    async executeEvent(id, adminId) {
        return this.eventsService.executeEvent(id, adminId);
    }
    async updateEvent(id, dto, adminId) {
        return this.eventsService.updateEvent(id, dto, adminId);
    }
    async deleteEvent(id, adminId) {
        return this.eventsService.deleteEvent(id, adminId);
    }
};
exports.EventsController = EventsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all market events (admin gets all, users get executed only)' }),
    (0, swagger_1.ApiQuery)({ name: 'executed', required: false, type: Boolean }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of events' }),
    __param(0, (0, common_1.Query)('executed')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, auth_guards_1.CurrentUser)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Boolean, Number, String]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "getEvents", null);
__decorate([
    (0, common_1.Get)('examples'),
    (0, auth_guards_1.Roles)('admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Get example event scripts' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Example events' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], EventsController.prototype, "getExamples", null);
__decorate([
    (0, common_1.Get)('audit-logs'),
    (0, auth_guards_1.Roles)('admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Get admin audit logs' }),
    (0, swagger_1.ApiQuery)({ name: 'adminId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'action', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Audit logs' }),
    __param(0, (0, common_1.Query)('adminId')),
    __param(1, (0, common_1.Query)('action')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "getAuditLogs", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, auth_guards_1.Roles)('admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Get event by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Event details with execution logs' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "getEvent", null);
__decorate([
    (0, common_1.Post)(),
    (0, auth_guards_1.Roles)('admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new market event' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Event created' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, auth_guards_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [events_dto_1.CreateEventDto, String]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "createEvent", null);
__decorate([
    (0, common_1.Post)(':id/execute'),
    (0, auth_guards_1.Roles)('admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Execute a pending event' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Event executed' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, auth_guards_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "executeEvent", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, auth_guards_1.Roles)('admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Update a pending event' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Event updated' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, auth_guards_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, events_dto_1.UpdateEventDto, String]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "updateEvent", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, auth_guards_1.Roles)('admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a pending event' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Event deleted' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, auth_guards_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "deleteEvent", null);
exports.EventsController = EventsController = __decorate([
    (0, swagger_1.ApiTags)('events'),
    (0, common_1.Controller)('events'),
    (0, common_1.UseGuards)(auth_guards_1.JwtAuthGuard, auth_guards_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [events_service_1.EventsService])
], EventsController);
//# sourceMappingURL=events.controller.js.map