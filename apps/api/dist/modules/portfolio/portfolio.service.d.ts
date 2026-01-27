import { PricesService } from '../prices/prices.service';
import { CompetitionService } from '../competition/competition.service';
export declare class PortfolioService {
    private readonly db;
    private readonly pricesService;
    private readonly competitionService;
    constructor(db: any, pricesService: PricesService, competitionService: CompetitionService);
    getPortfolio(userId: string): Promise<{
        userId: string;
        competitionId: any;
        cash: number;
        investedValue: any;
        totalValue: any;
        positions: any;
        unrealizedPL: any;
        realizedPL: number;
        totalPL: any;
        totalPLPercent: number;
        tradeCount: any;
        startingCash: number;
        updatedAt: any;
    }>;
    getHoldings(userId: string): Promise<any>;
    getPortfolioSummary(userId: string): Promise<{
        userId: string;
        cash: number;
        investedValue: any;
        totalValue: any;
        totalPL: any;
        totalPLPercent: number;
        positionCount: any;
        tradeCount: any;
    }>;
    calculatePortfolioValue(userId: string, competitionId: string): Promise<number>;
}
