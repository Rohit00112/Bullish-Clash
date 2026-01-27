import { PricesService } from './prices.service';
export declare class PricesController {
    private readonly pricesService;
    constructor(pricesService: PricesService);
    getAllLatestPrices(): Promise<any>;
    getLatestPrice(symbolId: string): Promise<any>;
    getPriceHistory(symbolId: string, from?: string, to?: string, limit?: number): Promise<any>;
    getCandles(symbolId: string, interval?: string, limit?: number): Promise<any>;
    updatePrice(body: {
        symbolId: string;
        change: number;
        type: 'PERCENTAGE' | 'ABSOLUTE';
    }): Promise<any>;
}
