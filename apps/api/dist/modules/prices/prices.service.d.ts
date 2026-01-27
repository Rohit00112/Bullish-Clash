import { TradingGateway } from '../websocket/trading.gateway';
import Redis from 'ioredis';
export interface PriceUpdate {
    symbolId: string;
    priceUpdateType: 'percentage' | 'absolute' | 'override';
    magnitude: number;
    eventId?: string;
}
export interface TradeImpact {
    symbolId: string;
    side: 'buy' | 'sell';
    quantity: number;
    tradeValue: number;
    executionPrice?: number;
}
export declare class PricesService {
    private readonly db;
    private readonly redis;
    private readonly tradingGateway;
    constructor(db: any, redis: Redis, tradingGateway: TradingGateway);
    getAllLatestPrices(): Promise<any>;
    getLatestPrice(symbolId: string): Promise<any>;
    getPriceHistory(symbolId: string, options?: {
        from?: Date;
        to?: Date;
        limit?: number;
    }): Promise<any>;
    getCandles(symbolId: string, interval?: string, limit?: number): Promise<any>;
    updatePrice(update: PriceUpdate): Promise<any>;
    batchUpdatePrices(updates: PriceUpdate[]): Promise<any[]>;
    resetDayPrices(): Promise<{
        success: boolean;
        symbolsReset: any;
    }>;
    applyTradeImpact(impact: TradeImpact): Promise<any>;
}
