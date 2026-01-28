import { BiddingService } from './bidding.service';
import { PlaceBidDto } from './bidding.dto';
export declare class BiddingController {
    private readonly biddingService;
    constructor(biddingService: BiddingService);
    placeBid(userId: string, dto: PlaceBidDto): Promise<{
        success: boolean;
        message: string;
    }>;
    getMyBids(userId: string): Promise<any[]>;
    processBids(competitionId: string): Promise<{
        message: string;
        success?: undefined;
        count?: undefined;
    } | {
        success: boolean;
        count: any;
        message: string;
    }>;
}
