// ============================================================
// Bullish Clash - Symbols Service
// ============================================================

import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { eq, ilike, and, desc } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';
import { DATABASE_CONNECTION } from '../../database/database.module';
import * as schema from '../../database/schema';
import { CreateSymbolDto, UpdateSymbolDto } from './symbols.dto';

@Injectable()
export class SymbolsService {
    constructor(
        @Inject(DATABASE_CONNECTION) private readonly db: any,
    ) { }

    async findAll(options?: { sector?: string; search?: string; activeOnly?: boolean }) {
        let conditions: any[] = [];

        if (options?.activeOnly !== false) {
            conditions.push(eq(schema.symbols.isActive, true));
        }

        if (options?.sector) {
            conditions.push(eq(schema.symbols.sector, options.sector as any));
        }

        if (options?.search) {
            // We'll filter in memory for ILIKE functionality
        }

        const symbols = await this.db.query.symbols.findMany({
            where: conditions.length > 0 ? and(...conditions) : undefined,
            orderBy: [schema.symbols.symbol],
        });

        // Get latest prices for all symbols
        const latestPrices = await this.db.query.latestPrices.findMany();
        const priceMap = new Map(latestPrices.map((p: any) => [p.symbolId, p]));

        // Add current price to each symbol
        const symbolsWithPrices = symbols.map((s: any) => {
            const latestPrice = priceMap.get(s.id) as any;
            return {
                ...s,
                currentPrice: latestPrice ? parseFloat(latestPrice.price) : parseFloat(s.basePrice),
                change: latestPrice ? parseFloat(latestPrice.change) : 0,
                changePercent: latestPrice ? parseFloat(latestPrice.changePercent) : 0,
            };
        });

        // Filter by search if provided
        let filtered = symbolsWithPrices;
        if (options?.search) {
            const searchLower = options.search.toLowerCase();
            filtered = symbolsWithPrices.filter((s: any) =>
                s.symbol.toLowerCase().includes(searchLower) ||
                s.companyName.toLowerCase().includes(searchLower)
            );
        }

        return filtered;
    }

    async findById(id: string) {
        const symbol = await this.db.query.symbols.findFirst({
            where: eq(schema.symbols.id, id),
        });

        if (!symbol) {
            throw new NotFoundException('Symbol not found');
        }

        return symbol;
    }

    async findBySymbol(symbolCode: string) {
        const symbol = await this.db.query.symbols.findFirst({
            where: eq(schema.symbols.symbol, symbolCode.toUpperCase()),
        });

        return symbol;
    }

    async create(dto: CreateSymbolDto) {
        // Check if symbol already exists
        const existing = await this.findBySymbol(dto.symbol);
        if (existing) {
            throw new ConflictException('Symbol already exists');
        }

        const symbolId = uuid();

        // Create symbol
        const [symbol] = await this.db.insert(schema.symbols).values({
            id: symbolId,
            symbol: dto.symbol.toUpperCase(),
            companyName: dto.companyName,
            sector: dto.sector as any,
            listedShares: dto.listedShares,
            logoUrl: dto.logoUrl,
            basePrice: dto.basePrice.toString(),
            isActive: true,
        }).returning();

        // Initialize latest price
        await this.db.insert(schema.latestPrices).values({
            symbolId: symbol.id,
            price: dto.basePrice.toString(),
            previousClose: dto.basePrice.toString(),
            open: dto.basePrice.toString(),
            high: dto.basePrice.toString(),
            low: dto.basePrice.toString(),
            volume: 0,
            change: '0',
            changePercent: '0',
        });

        return symbol;
    }

    async update(id: string, dto: UpdateSymbolDto) {
        // Check if symbol exists
        await this.findById(id);

        const [updated] = await this.db.update(schema.symbols)
            .set({
                ...(dto.companyName && { companyName: dto.companyName }),
                ...(dto.sector && { sector: dto.sector as any }),
                ...(dto.listedShares !== undefined && { listedShares: dto.listedShares }),
                ...(dto.logoUrl !== undefined && { logoUrl: dto.logoUrl }),
                ...(dto.isActive !== undefined && { isActive: dto.isActive }),
                updatedAt: new Date(),
            })
            .where(eq(schema.symbols.id, id))
            .returning();

        return updated;
    }

    async delete(id: string) {
        // Soft delete - just deactivate
        const [updated] = await this.db.update(schema.symbols)
            .set({
                isActive: false,
                updatedAt: new Date(),
            })
            .where(eq(schema.symbols.id, id))
            .returning();

        if (!updated) {
            throw new NotFoundException('Symbol not found');
        }

        return { success: true };
    }

    async getSectors() {
        return [
            'Commercial Bank',
            'Development Bank',
            'Finance',
            'Microfinance',
            'Life Insurance',
            'Non Life Insurance',
            'Hydropower',
            'Manufacturing',
            'Hotel',
            'Trading',
            'Others',
        ];
    }
}
