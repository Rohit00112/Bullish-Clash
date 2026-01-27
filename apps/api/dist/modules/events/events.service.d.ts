import { PricesService } from '../prices/prices.service';
import { SymbolsService } from '../symbols/symbols.service';
import { TradingGateway } from '../websocket/trading.gateway';
import { LeaderboardService } from '../leaderboard/leaderboard.service';
import { CreateEventDto, UpdateEventDto } from './events.dto';
export declare class EventsService {
    private readonly db;
    private readonly pricesService;
    private readonly symbolsService;
    private readonly tradingGateway;
    private readonly leaderboardService;
    constructor(db: any, pricesService: PricesService, symbolsService: SymbolsService, tradingGateway: TradingGateway, leaderboardService: LeaderboardService);
    createEvent(dto: CreateEventDto, adminId: string): Promise<any>;
    executeEvent(eventId: string, adminId: string): Promise<{
        event: any;
        results: any[];
        summary: {
            symbolsAffected: number;
            successful: number;
            failed: number;
        };
    }>;
    getEvents(options?: {
        executed?: boolean;
        limit?: number;
    }): Promise<any>;
    getEvent(id: string): Promise<any>;
    deleteEvent(id: string, adminId: string): Promise<{
        success: boolean;
    }>;
    updateEvent(id: string, dto: UpdateEventDto, adminId: string): Promise<any>;
    processScheduledEvents(): Promise<void>;
    private logAdminAction;
    getAuditLogs(options?: {
        adminId?: string;
        action?: string;
        limit?: number;
    }): Promise<any>;
}
