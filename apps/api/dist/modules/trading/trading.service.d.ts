import { PricesService } from '../prices/prices.service';
import { CompetitionService } from '../competition/competition.service';
import { TradingGateway } from '../websocket/trading.gateway';
import { AchievementsService } from '../achievements/achievements.service';
import { PlaceOrderDto, CancelOrderDto, EditOrderDto } from './trading.dto';
import Redis from 'ioredis';
export declare class TradingService {
    private readonly db;
    private readonly redis;
    private readonly pricesService;
    private readonly competitionService;
    private readonly tradingGateway;
    private readonly achievementsService;
    constructor(db: any, redis: Redis, pricesService: PricesService, competitionService: CompetitionService, tradingGateway: TradingGateway, achievementsService: AchievementsService);
    placeOrder(userId: string, dto: PlaceOrderDto): Promise<{
        order: any;
        trades: any[];
        message: string;
    }>;
    private executeMarketOrder;
    private placeLimitOrder;
    private matchMarketOrder;
    private matchLimitOrder;
    private updateMatchedOrder;
    private processTradeSettlement;
    private reserveCash;
    private releaseReservedCash;
    private getReservedShares;
    cancelOrder(userId: string, dto: CancelOrderDto): Promise<{
        message: string;
        orderId: string;
    }>;
    editOrder(userId: string, dto: EditOrderDto): Promise<{
        message: string;
        order: {
            id: any;
            symbolId: any;
            side: any;
            type: any;
            price: number;
            quantity: any;
            remainingQuantity: any;
            status: any;
            updatedAt: any;
        };
    }>;
    getOrderBook(symbolId: string, competitionId?: string): Promise<{
        bids: any;
        asks: any;
        lastPrice: number;
        spread: number;
        spreadPercent: number;
    }>;
    getOpenOrders(userId: string): Promise<any>;
    getOrders(userId: string, options?: {
        status?: string;
        limit?: number;
    }): Promise<any>;
    getTrades(userId: string, options?: {
        limit?: number;
    }): Promise<any>;
    getTradesRaw(userId: string): Promise<{
        count: any;
        trades: any;
    }>;
    expireOrders(): Promise<{
        expired: any;
    }>;
    private checkAchievementsAfterTrade;
}
