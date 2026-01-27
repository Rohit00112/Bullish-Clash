import { SymbolsService } from './symbols.service';
import { CreateSymbolDto, UpdateSymbolDto } from './symbols.dto';
export declare class SymbolsController {
    private readonly symbolsService;
    constructor(symbolsService: SymbolsService);
    findAll(sector?: string, search?: string, activeOnly?: boolean): Promise<any>;
    getSectors(): Promise<string[]>;
    findOne(id: string): Promise<any>;
    create(dto: CreateSymbolDto): Promise<any>;
    update(id: string, dto: UpdateSymbolDto): Promise<any>;
    delete(id: string): Promise<{
        success: boolean;
    }>;
}
