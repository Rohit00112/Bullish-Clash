import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { LeaderboardService } from '../leaderboard/leaderboard.service';
import { CompetitionService } from '../competition/competition.service';
export declare enum WsEvent {
    PRICE_UPDATE = "price_update",
    PRICE_BATCH_UPDATE = "price_batch_update",
    TRADE_EXECUTED = "trade_executed",
    LEADERBOARD_UPDATE = "leaderboard_update",
    COMPETITION_STATUS = "competition_status",
    MARKET_EVENT = "market_event",
    PORTFOLIO_UPDATE = "portfolio_update",
    ORDERBOOK_UPDATE = "orderbook_update",
    ORDER_UPDATE = "order_update",
    ACHIEVEMENT_UNLOCKED = "achievement_unlocked",
    ERROR = "error",
    SUBSCRIBE_PRICES = "subscribe_prices",
    UNSUBSCRIBE_PRICES = "unsubscribe_prices",
    SUBSCRIBE_LEADERBOARD = "subscribe_leaderboard",
    SUBSCRIBE_ORDERBOOK = "subscribe_orderbook",
    UNSUBSCRIBE_ORDERBOOK = "unsubscribe_orderbook",
    AUTHENTICATE = "authenticate",
    PING = "ping"
}
interface AuthenticatedSocket extends Socket {
    userId?: string;
    isAuthenticated?: boolean;
}
export declare class TradingGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly jwtService;
    private readonly configService;
    private readonly leaderboardService;
    private readonly competitionService;
    server: Server;
    private connectedClients;
    private priceSubscribers;
    private leaderboardSubscribers;
    private orderbookSubscribers;
    private userSockets;
    constructor(jwtService: JwtService, configService: ConfigService, leaderboardService: LeaderboardService, competitionService: CompetitionService);
    handleConnection(client: AuthenticatedSocket): Promise<void>;
    handleDisconnect(client: AuthenticatedSocket): void;
    handleAuthenticate(client: AuthenticatedSocket, data: {
        token: string;
    }): Promise<{
        success: boolean;
        userId: any;
        message: string;
    } | {
        success: boolean;
        message: string;
        userId?: undefined;
    }>;
    handleSubscribePrices(client: AuthenticatedSocket): {
        success: boolean;
        message: string;
    };
    handleUnsubscribePrices(client: AuthenticatedSocket): {
        success: boolean;
        message: string;
    };
    handleSubscribeLeaderboard(client: AuthenticatedSocket): {
        success: boolean;
        message: string;
    };
    handleSubscribeOrderbook(client: AuthenticatedSocket, data: {
        symbolId: string;
    }): {
        success: boolean;
        message: string;
    };
    handleUnsubscribeOrderbook(client: AuthenticatedSocket, data: {
        symbolId: string;
    }): {
        success: boolean;
        message: string;
    };
    handlePing(client: AuthenticatedSocket): {
        event: string;
        timestamp: Date;
    };
    broadcastPriceUpdate(data: {
        symbolId: string;
        symbol: string;
        price: number;
        previousPrice: number;
        change: number;
        changePercent: number;
        eventId?: string;
    }): void;
    broadcastPriceBatchUpdate(updates: Array<{
        symbolId: string;
        symbol: string;
        price: number;
        previousPrice: number;
        change: number;
        changePercent: number;
    }>): void;
    sendTradeExecuted(userId: string, data: any): void;
    sendOrderUpdate(userId: string, data: any): void;
    sendAchievementUnlocked(userId: string, achievement: any): void;
    broadcastOrderBookUpdate(symbolId: string): void;
    broadcastLeaderboardUpdate(): Promise<void>;
    private leaderboardUpdateTimeout;
    triggerLeaderboardUpdate(): void;
    broadcastMarketEvent(data: {
        eventId: string;
        title: string;
        description?: string;
        impactType: string;
        symbolsAffected: number;
    }): void;
    broadcastCompetitionStatus(status: string, message?: string): Promise<void>;
    getStats(): {
        totalConnections: number;
        authenticatedUsers: number;
        priceSubscribers: number;
        leaderboardSubscribers: number;
    };
}
export {};
