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
exports.TradingGateway = exports.WsEvent = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const leaderboard_service_1 = require("../leaderboard/leaderboard.service");
const competition_service_1 = require("../competition/competition.service");
var WsEvent;
(function (WsEvent) {
    WsEvent["PRICE_UPDATE"] = "price_update";
    WsEvent["PRICE_BATCH_UPDATE"] = "price_batch_update";
    WsEvent["TRADE_EXECUTED"] = "trade_executed";
    WsEvent["LEADERBOARD_UPDATE"] = "leaderboard_update";
    WsEvent["COMPETITION_STATUS"] = "competition_status";
    WsEvent["MARKET_EVENT"] = "market_event";
    WsEvent["PORTFOLIO_UPDATE"] = "portfolio_update";
    WsEvent["ORDERBOOK_UPDATE"] = "orderbook_update";
    WsEvent["ORDER_UPDATE"] = "order_update";
    WsEvent["ACHIEVEMENT_UNLOCKED"] = "achievement_unlocked";
    WsEvent["ERROR"] = "error";
    WsEvent["SUBSCRIBE_PRICES"] = "subscribe_prices";
    WsEvent["UNSUBSCRIBE_PRICES"] = "unsubscribe_prices";
    WsEvent["SUBSCRIBE_LEADERBOARD"] = "subscribe_leaderboard";
    WsEvent["SUBSCRIBE_ORDERBOOK"] = "subscribe_orderbook";
    WsEvent["UNSUBSCRIBE_ORDERBOOK"] = "unsubscribe_orderbook";
    WsEvent["AUTHENTICATE"] = "authenticate";
    WsEvent["PING"] = "ping";
})(WsEvent || (exports.WsEvent = WsEvent = {}));
let TradingGateway = class TradingGateway {
    jwtService;
    configService;
    leaderboardService;
    competitionService;
    server;
    connectedClients = new Map();
    priceSubscribers = new Set();
    leaderboardSubscribers = new Set();
    orderbookSubscribers = new Map();
    userSockets = new Map();
    constructor(jwtService, configService, leaderboardService, competitionService) {
        this.jwtService = jwtService;
        this.configService = configService;
        this.leaderboardService = leaderboardService;
        this.competitionService = competitionService;
    }
    async handleConnection(client) {
        console.log(`Client connected: ${client.id}`);
        this.connectedClients.set(client.id, client);
        client.emit('connected', {
            socketId: client.id,
            timestamp: new Date(),
            message: 'Connected to Bullish Clash trading server',
        });
    }
    handleDisconnect(client) {
        console.log(`Client disconnected: ${client.id}`);
        this.priceSubscribers.delete(client.id);
        this.leaderboardSubscribers.delete(client.id);
        this.connectedClients.delete(client.id);
        for (const [symbolId, subscribers] of this.orderbookSubscribers) {
            subscribers.delete(client.id);
            if (subscribers.size === 0) {
                this.orderbookSubscribers.delete(symbolId);
            }
        }
        if (client.userId) {
            const userSocketSet = this.userSockets.get(client.userId);
            if (userSocketSet) {
                userSocketSet.delete(client.id);
                if (userSocketSet.size === 0) {
                    this.userSockets.delete(client.userId);
                }
            }
        }
    }
    async handleAuthenticate(client, data) {
        try {
            const secret = this.configService.get('JWT_SECRET') || 'bullish-clash-secret-key-change-in-production';
            const payload = this.jwtService.verify(data.token, { secret });
            client.userId = payload.sub;
            client.isAuthenticated = true;
            if (!this.userSockets.has(payload.sub)) {
                this.userSockets.set(payload.sub, new Set());
            }
            this.userSockets.get(payload.sub).add(client.id);
            return {
                success: true,
                userId: payload.sub,
                message: 'Authenticated successfully',
            };
        }
        catch (error) {
            client.emit(WsEvent.ERROR, {
                code: 'AUTH_FAILED',
                message: 'Invalid token',
            });
            return { success: false, message: 'Authentication failed' };
        }
    }
    handleSubscribePrices(client) {
        this.priceSubscribers.add(client.id);
        return { success: true, message: 'Subscribed to price updates' };
    }
    handleUnsubscribePrices(client) {
        this.priceSubscribers.delete(client.id);
        return { success: true, message: 'Unsubscribed from price updates' };
    }
    handleSubscribeLeaderboard(client) {
        this.leaderboardSubscribers.add(client.id);
        return { success: true, message: 'Subscribed to leaderboard updates' };
    }
    handleSubscribeOrderbook(client, data) {
        if (!data?.symbolId) {
            return { success: false, message: 'Symbol ID required' };
        }
        if (!this.orderbookSubscribers.has(data.symbolId)) {
            this.orderbookSubscribers.set(data.symbolId, new Set());
        }
        this.orderbookSubscribers.get(data.symbolId).add(client.id);
        return { success: true, message: `Subscribed to orderbook for ${data.symbolId}` };
    }
    handleUnsubscribeOrderbook(client, data) {
        if (data?.symbolId && this.orderbookSubscribers.has(data.symbolId)) {
            this.orderbookSubscribers.get(data.symbolId).delete(client.id);
        }
        return { success: true, message: 'Unsubscribed from orderbook updates' };
    }
    handlePing(client) {
        return { event: 'pong', timestamp: new Date() };
    }
    broadcastPriceUpdate(data) {
        const message = {
            event: WsEvent.PRICE_UPDATE,
            data,
            timestamp: new Date(),
        };
        for (const socketId of this.priceSubscribers) {
            const client = this.connectedClients.get(socketId);
            if (client) {
                client.emit(WsEvent.PRICE_UPDATE, message);
            }
        }
    }
    broadcastPriceBatchUpdate(updates) {
        const message = {
            event: WsEvent.PRICE_BATCH_UPDATE,
            data: updates,
            timestamp: new Date(),
        };
        for (const socketId of this.priceSubscribers) {
            const client = this.connectedClients.get(socketId);
            if (client) {
                client.emit(WsEvent.PRICE_BATCH_UPDATE, message);
            }
        }
    }
    sendTradeExecuted(userId, data) {
        const userSocketSet = this.userSockets.get(userId);
        if (userSocketSet) {
            const message = {
                event: WsEvent.TRADE_EXECUTED,
                data,
                timestamp: new Date(),
            };
            for (const socketId of userSocketSet) {
                const client = this.connectedClients.get(socketId);
                if (client) {
                    client.emit(WsEvent.TRADE_EXECUTED, message);
                }
            }
        }
    }
    sendOrderUpdate(userId, data) {
        const userSocketSet = this.userSockets.get(userId);
        if (userSocketSet) {
            const message = {
                event: WsEvent.ORDER_UPDATE,
                data,
                timestamp: new Date(),
            };
            for (const socketId of userSocketSet) {
                const client = this.connectedClients.get(socketId);
                if (client) {
                    client.emit(WsEvent.ORDER_UPDATE, message);
                }
            }
        }
    }
    sendAchievementUnlocked(userId, achievement) {
        const userSocketSet = this.userSockets.get(userId);
        if (userSocketSet) {
            const message = {
                event: WsEvent.ACHIEVEMENT_UNLOCKED,
                data: achievement,
                timestamp: new Date(),
            };
            for (const socketId of userSocketSet) {
                const client = this.connectedClients.get(socketId);
                if (client) {
                    client.emit(WsEvent.ACHIEVEMENT_UNLOCKED, message);
                }
            }
        }
    }
    broadcastOrderBookUpdate(symbolId) {
        const subscribers = this.orderbookSubscribers.get(symbolId);
        if (!subscribers || subscribers.size === 0)
            return;
        const message = {
            event: WsEvent.ORDERBOOK_UPDATE,
            data: { symbolId },
            timestamp: new Date(),
        };
        for (const socketId of subscribers) {
            const client = this.connectedClients.get(socketId);
            if (client) {
                client.emit(WsEvent.ORDERBOOK_UPDATE, message);
            }
        }
    }
    async broadcastLeaderboardUpdate() {
        try {
            const leaderboard = await this.leaderboardService.getLeaderboard({ limit: 100 });
            const message = {
                event: WsEvent.LEADERBOARD_UPDATE,
                data: leaderboard,
                timestamp: new Date(),
            };
            for (const socketId of this.leaderboardSubscribers) {
                const client = this.connectedClients.get(socketId);
                if (client) {
                    client.emit(WsEvent.LEADERBOARD_UPDATE, message);
                }
            }
        }
        catch (error) {
            console.error('Failed to broadcast leaderboard update:', error);
        }
    }
    leaderboardUpdateTimeout = null;
    triggerLeaderboardUpdate() {
        if (this.leaderboardUpdateTimeout) {
            clearTimeout(this.leaderboardUpdateTimeout);
        }
        this.leaderboardUpdateTimeout = setTimeout(() => {
            this.broadcastLeaderboardUpdate();
        }, 500);
    }
    broadcastMarketEvent(data) {
        const message = {
            event: WsEvent.MARKET_EVENT,
            data,
            timestamp: new Date(),
        };
        this.server.emit(WsEvent.MARKET_EVENT, message);
    }
    async broadcastCompetitionStatus(status, message) {
        const competition = await this.competitionService.getActiveCompetition();
        const payload = {
            event: WsEvent.COMPETITION_STATUS,
            data: {
                status,
                message,
                competitionId: competition?.id,
                remainingTime: competition ?
                    Math.max(0, new Date(competition.endTime).getTime() - Date.now()) : 0,
            },
            timestamp: new Date(),
        };
        this.server.emit(WsEvent.COMPETITION_STATUS, payload);
    }
    getStats() {
        return {
            totalConnections: this.connectedClients.size,
            authenticatedUsers: this.userSockets.size,
            priceSubscribers: this.priceSubscribers.size,
            leaderboardSubscribers: this.leaderboardSubscribers.size,
        };
    }
};
exports.TradingGateway = TradingGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], TradingGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)(WsEvent.AUTHENTICATE),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TradingGateway.prototype, "handleAuthenticate", null);
__decorate([
    (0, websockets_1.SubscribeMessage)(WsEvent.SUBSCRIBE_PRICES),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TradingGateway.prototype, "handleSubscribePrices", null);
__decorate([
    (0, websockets_1.SubscribeMessage)(WsEvent.UNSUBSCRIBE_PRICES),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TradingGateway.prototype, "handleUnsubscribePrices", null);
__decorate([
    (0, websockets_1.SubscribeMessage)(WsEvent.SUBSCRIBE_LEADERBOARD),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TradingGateway.prototype, "handleSubscribeLeaderboard", null);
__decorate([
    (0, websockets_1.SubscribeMessage)(WsEvent.SUBSCRIBE_ORDERBOOK),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TradingGateway.prototype, "handleSubscribeOrderbook", null);
__decorate([
    (0, websockets_1.SubscribeMessage)(WsEvent.UNSUBSCRIBE_ORDERBOOK),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TradingGateway.prototype, "handleUnsubscribeOrderbook", null);
__decorate([
    (0, websockets_1.SubscribeMessage)(WsEvent.PING),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TradingGateway.prototype, "handlePing", null);
exports.TradingGateway = TradingGateway = __decorate([
    (0, common_1.Injectable)(),
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:3000',
            credentials: true,
        },
        namespace: '/trading',
    }),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => leaderboard_service_1.LeaderboardService))),
    __param(3, (0, common_1.Inject)((0, common_1.forwardRef)(() => competition_service_1.CompetitionService))),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        config_1.ConfigService,
        leaderboard_service_1.LeaderboardService,
        competition_service_1.CompetitionService])
], TradingGateway);
//# sourceMappingURL=trading.gateway.js.map