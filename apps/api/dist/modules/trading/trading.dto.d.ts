export declare class PlaceOrderDto {
    symbolId: string;
    side: 'buy' | 'sell';
    type?: 'market' | 'limit';
    quantity: number;
    price?: number;
}
export declare class CancelOrderDto {
    orderId: string;
}
export declare class EditOrderDto {
    orderId: string;
    price?: number;
    quantity?: number;
}
export declare class OrderResponseDto {
    order: {
        id: string;
        symbolId: string;
        side: string;
        type: string;
        quantity: number;
        remainingQuantity: number;
        filledQuantity: number;
        avgFilledPrice: number | null;
        price: number | null;
        status: string;
        commission: number;
        createdAt: Date;
    };
    trade?: {
        id: string;
        symbol: string;
        side: string;
        quantity: number;
        price: number;
        total: number;
        commission: number;
        executedAt: Date;
    };
    trades?: Array<{
        id: string;
        symbol: string;
        side: string;
        quantity: number;
        price: number;
        total: number;
        commission: number;
        executedAt: Date;
    }>;
    message: string;
}
export declare class OrderBookDto {
    bids: Array<{
        price: number;
        quantity: number;
        orderCount: number;
    }>;
    asks: Array<{
        price: number;
        quantity: number;
        orderCount: number;
    }>;
    lastPrice: number;
    spread: number;
    spreadPercent: number;
}
