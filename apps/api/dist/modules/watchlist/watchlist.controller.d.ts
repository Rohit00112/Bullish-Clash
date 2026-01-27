import { WatchlistService } from './watchlist.service';
declare class AddToWatchlistDto {
    symbolId: string;
}
export declare class WatchlistController {
    private readonly watchlistService;
    constructor(watchlistService: WatchlistService);
    getWatchlist(userId: string): Promise<any>;
    addToWatchlist(userId: string, dto: AddToWatchlistDto): Promise<{
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
    isInWatchlist(userId: string, symbolId: string): Promise<{
        inWatchlist: boolean;
    }>;
}
export {};
