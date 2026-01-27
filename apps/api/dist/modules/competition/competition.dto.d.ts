export declare class CreateCompetitionDto {
    name: string;
    description?: string;
    startingCash: number;
    commissionRate: number;
    maxPositionSize?: number;
    maxDailyTrades?: number;
    allowShortSelling?: boolean;
    allowMargin?: boolean;
    startTime: string;
    endTime: string;
    tradingHoursStart?: string;
    tradingHoursEnd?: string;
    isDefault?: boolean;
}
export declare class UpdateCompetitionDto {
    name?: string;
    description?: string;
    status?: 'draft' | 'scheduled' | 'active' | 'paused' | 'ended';
    startingCash?: number;
    commissionRate?: number;
    maxPositionSize?: number;
    maxDailyTrades?: number;
    allowShortSelling?: boolean;
    allowMargin?: boolean;
    startTime?: string;
    endTime?: string;
    tradingHoursStart?: string;
    tradingHoursEnd?: string;
    isDefault?: boolean;
}
