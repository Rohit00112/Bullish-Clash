import { PortfolioService } from './portfolio.service';
export declare class PortfolioController {
    private readonly portfolioService;
    constructor(portfolioService: PortfolioService);
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
    getHoldings(userId: string): Promise<any>;
}
