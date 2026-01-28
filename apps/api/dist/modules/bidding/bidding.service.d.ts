import { PlaceBidDto } from './bidding.dto';
import { CompetitionService } from '../competition/competition.service';
export declare class BiddingService {
    private readonly db;
    private readonly competitionService;
    constructor(db: any, competitionService: CompetitionService);
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
