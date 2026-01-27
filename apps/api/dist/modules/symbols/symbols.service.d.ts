import { CreateSymbolDto, UpdateSymbolDto } from './symbols.dto';
export declare class SymbolsService {
    private readonly db;
    constructor(db: any);
    findAll(options?: {
        sector?: string;
        search?: string;
        activeOnly?: boolean;
    }): Promise<any>;
    findById(id: string): Promise<any>;
    findBySymbol(symbolCode: string): Promise<any>;
    create(dto: CreateSymbolDto): Promise<any>;
    update(id: string, dto: UpdateSymbolDto): Promise<any>;
    delete(id: string): Promise<{
        success: boolean;
    }>;
    getSectors(): Promise<string[]>;
}
