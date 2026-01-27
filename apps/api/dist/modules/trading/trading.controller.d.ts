import { TradingService } from './trading.service';
import { PlaceOrderDto, CancelOrderDto, EditOrderDto } from './trading.dto';
export declare class TradingController {
    private readonly tradingService;
    constructor(tradingService: TradingService);
    placeOrder(userId: string, dto: PlaceOrderDto): Promise<{
        order: any;
        trades: any[];
        message: string;
    }>;
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
    getOrderBook(symbolId: string): Promise<{
        bids: any;
        asks: any;
        lastPrice: number;
        spread: number;
        spreadPercent: number;
    }>;
    getOpenOrders(userId: string): Promise<any>;
    getOrders(userId: string, status?: string, limit?: number): Promise<any>;
    getTrades(userId: string, limit?: number): Promise<any>;
    getTradesDebug(userId: string): Promise<{
        count: any;
        trades: any;
    }>;
}
