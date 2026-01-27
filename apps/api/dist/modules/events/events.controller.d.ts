import { EventsService } from './events.service';
import { CreateEventDto, UpdateEventDto } from './events.dto';
export declare class EventsController {
    private readonly eventsService;
    constructor(eventsService: EventsService);
    getEvents(executed?: boolean, limit?: number, role?: string): Promise<any>;
    getExamples(): {
        examples: ({
            name: string;
            description: string;
            request: {
                title: string;
                description: string;
                impactType: string;
                priceUpdateType: string;
                magnitude: number;
                affectAllSymbols: boolean;
                executeNow: boolean;
                affectedSymbols?: undefined;
                scheduledAt?: undefined;
            };
        } | {
            name: string;
            description: string;
            request: {
                title: string;
                description: string;
                impactType: string;
                priceUpdateType: string;
                magnitude: number;
                affectedSymbols: string[];
                executeNow: boolean;
                affectAllSymbols?: undefined;
                scheduledAt?: undefined;
            };
        } | {
            name: string;
            description: string;
            request: {
                title: string;
                description: string;
                impactType: string;
                priceUpdateType: string;
                magnitude: number;
                affectedSymbols: string[];
                executeNow: boolean;
                scheduledAt: string;
                affectAllSymbols?: undefined;
            };
        })[];
    };
    getAuditLogs(adminId?: string, action?: string, limit?: number): Promise<any>;
    getEvent(id: string): Promise<any>;
    createEvent(dto: CreateEventDto, adminId: string): Promise<any>;
    executeEvent(id: string, adminId: string): Promise<{
        event: any;
        results: any[];
        summary: {
            symbolsAffected: number;
            successful: number;
            failed: number;
        };
    }>;
    updateEvent(id: string, dto: UpdateEventDto, adminId: string): Promise<any>;
    deleteEvent(id: string, adminId: string): Promise<{
        success: boolean;
    }>;
}
