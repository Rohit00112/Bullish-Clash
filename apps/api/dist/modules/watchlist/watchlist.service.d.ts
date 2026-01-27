import { PricesService } from '../prices/prices.service';
export declare class WatchlistService {
    private readonly db;
    private readonly pricesService;
    constructor(db: any, pricesService: PricesService);
    getWatchlist(userId: string): Promise<any>;
    addToWatchlist(userId: string, symbolId: string): Promise<{
        success: boolean;
        message: string;
        item: {
            id: any;
            symbolId: any;
            symbol: any;
            companyName: any;
        };
    }>;
    removeFromWatchlist(userId: string, symbolId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    isInWatchlist(userId: string, symbolId: string): Promise<boolean>;
}
