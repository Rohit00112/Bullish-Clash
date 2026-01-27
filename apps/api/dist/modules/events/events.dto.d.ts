export declare class CreateEventDto {
    title: string;
    description?: string;
    impactType: 'positive' | 'negative' | 'neutral';
    priceUpdateType: 'percentage' | 'absolute' | 'override';
    magnitude: number;
    affectedSymbols?: string[];
    affectAllSymbols?: boolean;
    scheduledAt?: string;
    executeNow?: boolean;
}
export declare class UpdateEventDto {
    title?: string;
    description?: string;
    impactType?: 'positive' | 'negative' | 'neutral';
    priceUpdateType?: 'percentage' | 'absolute' | 'override';
    magnitude?: number;
    affectedSymbols?: string[];
    affectAllSymbols?: boolean;
    scheduledAt?: string;
}
export declare class EventExampleDto {
    example: string;
    title: string;
    description: string;
    request: CreateEventDto;
}
