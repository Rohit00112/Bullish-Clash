// ============================================================
// Bullish Battle - WebSocket Trading Gateway
// Real-time updates for prices, trades, and leaderboard
// ============================================================

import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    ConnectedSocket,
    MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { LeaderboardService } from '../leaderboard/leaderboard.service';
import { CompetitionService } from '../competition/competition.service';

// WebSocket event types
export enum WsEvent {
    // Server -> Client
    PRICE_UPDATE = 'price_update',
    PRICE_BATCH_UPDATE = 'price_batch_update',
    TRADE_EXECUTED = 'trade_executed',
    LEADERBOARD_UPDATE = 'leaderboard_update',
    COMPETITION_STATUS = 'competition_status',
    MARKET_EVENT = 'market_event',
    PORTFOLIO_UPDATE = 'portfolio_update',
    ORDERBOOK_UPDATE = 'orderbook_update',
    ORDER_UPDATE = 'order_update',
    ACHIEVEMENT_UNLOCKED = 'achievement_unlocked',
    ERROR = 'error',

    // Client -> Server
    SUBSCRIBE_PRICES = 'subscribe_prices',
    UNSUBSCRIBE_PRICES = 'unsubscribe_prices',
    SUBSCRIBE_LEADERBOARD = 'subscribe_leaderboard',
    SUBSCRIBE_ORDERBOOK = 'subscribe_orderbook',
    UNSUBSCRIBE_ORDERBOOK = 'unsubscribe_orderbook',
    AUTHENTICATE = 'authenticate',
    PING = 'ping',
}

interface AuthenticatedSocket extends Socket {
    userId?: string;
    isAuthenticated?: boolean;
}

@Injectable()
@WebSocketGateway({
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true,
    },
    namespace: '/trading',
})
export class TradingGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private connectedClients = new Map<string, AuthenticatedSocket>();
    private priceSubscribers = new Set<string>();
    private leaderboardSubscribers = new Set<string>();
    private orderbookSubscribers = new Map<string, Set<string>>(); // symbolId -> Set of socketIds
    private userSockets = new Map<string, Set<string>>(); // userId -> Set of socketIds

    constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        @Inject(forwardRef(() => LeaderboardService)) private readonly leaderboardService: LeaderboardService,
        @Inject(forwardRef(() => CompetitionService)) private readonly competitionService: CompetitionService,
    ) { }

    // Handle new connection
    async handleConnection(client: AuthenticatedSocket) {
        console.log(`Client connected: ${client.id}`);
        this.connectedClients.set(client.id, client);

        // Send connection acknowledgment
        client.emit('connected', {
            socketId: client.id,
            timestamp: new Date(),
            message: 'Connected to Bullish Battle trading server',
        });
    }

    // Handle disconnection
    handleDisconnect(client: AuthenticatedSocket) {
        console.log(`Client disconnected: ${client.id}`);

        // Clean up subscriptions
        this.priceSubscribers.delete(client.id);
        this.leaderboardSubscribers.delete(client.id);
        this.connectedClients.delete(client.id);

        // Clean up orderbook subscriptions
        for (const [symbolId, subscribers] of this.orderbookSubscribers) {
            subscribers.delete(client.id);
            if (subscribers.size === 0) {
                this.orderbookSubscribers.delete(symbolId);
            }
        }

        // Remove from user sockets
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

    // Authenticate socket connection
    @SubscribeMessage(WsEvent.AUTHENTICATE)
    async handleAuthenticate(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() data: { token: string },
    ) {
        try {
            const secret = this.configService.get<string>('JWT_SECRET') || 'bullish-clash-secret-key-change-in-production';
            const payload = this.jwtService.verify(data.token, { secret });

            client.userId = payload.sub;
            client.isAuthenticated = true;

            // Track user's sockets
            if (!this.userSockets.has(payload.sub)) {
                this.userSockets.set(payload.sub, new Set());
            }
            this.userSockets.get(payload.sub)!.add(client.id);

            return {
                success: true,
                userId: payload.sub,
                message: 'Authenticated successfully',
            };
        } catch (error) {
            client.emit(WsEvent.ERROR, {
                code: 'AUTH_FAILED',
                message: 'Invalid token',
            });
            return { success: false, message: 'Authentication failed' };
        }
    }

    // Subscribe to price updates
    @SubscribeMessage(WsEvent.SUBSCRIBE_PRICES)
    handleSubscribePrices(@ConnectedSocket() client: AuthenticatedSocket) {
        this.priceSubscribers.add(client.id);
        return { success: true, message: 'Subscribed to price updates' };
    }

    // Unsubscribe from price updates
    @SubscribeMessage(WsEvent.UNSUBSCRIBE_PRICES)
    handleUnsubscribePrices(@ConnectedSocket() client: AuthenticatedSocket) {
        this.priceSubscribers.delete(client.id);
        return { success: true, message: 'Unsubscribed from price updates' };
    }

    // Subscribe to leaderboard updates
    @SubscribeMessage(WsEvent.SUBSCRIBE_LEADERBOARD)
    handleSubscribeLeaderboard(@ConnectedSocket() client: AuthenticatedSocket) {
        this.leaderboardSubscribers.add(client.id);
        return { success: true, message: 'Subscribed to leaderboard updates' };
    }

    // Subscribe to orderbook updates for a specific symbol
    @SubscribeMessage(WsEvent.SUBSCRIBE_ORDERBOOK)
    handleSubscribeOrderbook(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() data: { symbolId: string },
    ) {
        if (!data?.symbolId) {
            return { success: false, message: 'Symbol ID required' };
        }
        if (!this.orderbookSubscribers.has(data.symbolId)) {
            this.orderbookSubscribers.set(data.symbolId, new Set());
        }
        this.orderbookSubscribers.get(data.symbolId)!.add(client.id);
        return { success: true, message: `Subscribed to orderbook for ${data.symbolId}` };
    }

    // Unsubscribe from orderbook updates
    @SubscribeMessage(WsEvent.UNSUBSCRIBE_ORDERBOOK)
    handleUnsubscribeOrderbook(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() data: { symbolId: string },
    ) {
        if (data?.symbolId && this.orderbookSubscribers.has(data.symbolId)) {
            this.orderbookSubscribers.get(data.symbolId)!.delete(client.id);
        }
        return { success: true, message: 'Unsubscribed from orderbook updates' };
    }

    // Handle ping (keep-alive)
    @SubscribeMessage(WsEvent.PING)
    handlePing(@ConnectedSocket() client: AuthenticatedSocket) {
        return { event: 'pong', timestamp: new Date() };
    }

    // ==================== BROADCAST METHODS ====================

    // Broadcast price update to all subscribers
    broadcastPriceUpdate(data: {
        symbolId: string;
        symbol: string;
        price: number;
        previousPrice: number;
        change: number;
        changePercent: number;
        eventId?: string;
    }) {
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

    // Broadcast batch price updates
    broadcastPriceBatchUpdate(updates: Array<{
        symbolId: string;
        symbol: string;
        price: number;
        previousPrice: number;
        change: number;
        changePercent: number;
    }>) {
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

    // Send trade executed notification to specific user
    sendTradeExecuted(userId: string, data: any) {
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

    // Send order update notification to specific user
    sendOrderUpdate(userId: string, data: any) {
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

    // Send achievement unlocked notification to specific user
    sendAchievementUnlocked(userId: string, achievement: any) {
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

    // Broadcast orderbook update for a symbol
    broadcastOrderBookUpdate(symbolId: string) {
        const subscribers = this.orderbookSubscribers.get(symbolId);
        if (!subscribers || subscribers.size === 0) return;

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

    // Broadcast leaderboard update
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
        } catch (error) {
            console.error('Failed to broadcast leaderboard update:', error);
        }
    }

    // Trigger leaderboard update (debounced)
    private leaderboardUpdateTimeout: NodeJS.Timeout | null = null;

    triggerLeaderboardUpdate() {
        if (this.leaderboardUpdateTimeout) {
            clearTimeout(this.leaderboardUpdateTimeout);
        }

        this.leaderboardUpdateTimeout = setTimeout(() => {
            this.broadcastLeaderboardUpdate();
        }, 500); // Debounce 500ms
    }

    // Broadcast market event notification
    broadcastMarketEvent(data: {
        eventId: string;
        title: string;
        description?: string;
        impactType: string;
        symbolsAffected: number;
    }) {
        const message = {
            event: WsEvent.MARKET_EVENT,
            data,
            timestamp: new Date(),
        };

        // Broadcast to all connected clients
        this.server.emit(WsEvent.MARKET_EVENT, message);
    }

    // Broadcast competition status change
    async broadcastCompetitionStatus(status: string, message?: string) {
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

        // Broadcast to all connected clients
        this.server.emit(WsEvent.COMPETITION_STATUS, payload);
    }

    // Get connection stats
    getStats() {
        return {
            totalConnections: this.connectedClients.size,
            authenticatedUsers: this.userSockets.size,
            priceSubscribers: this.priceSubscribers.size,
            leaderboardSubscribers: this.leaderboardSubscribers.size,
        };
    }
}
