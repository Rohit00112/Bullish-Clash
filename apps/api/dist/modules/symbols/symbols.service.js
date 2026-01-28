"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SymbolsService = void 0;
const common_1 = require("@nestjs/common");
const drizzle_orm_1 = require("drizzle-orm");
const uuid_1 = require("uuid");
const database_module_1 = require("../../database/database.module");
const schema = require("../../database/schema");
let SymbolsService = class SymbolsService {
    db;
    constructor(db) {
        this.db = db;
    }
    async findAll(options) {
        let conditions = [];
        if (options?.activeOnly !== false) {
            conditions.push((0, drizzle_orm_1.eq)(schema.symbols.isActive, true));
        }
        if (options?.sector) {
            conditions.push((0, drizzle_orm_1.eq)(schema.symbols.sector, options.sector));
        }
        if (options?.search) {
        }
        const symbols = await this.db.query.symbols.findMany({
            where: conditions.length > 0 ? (0, drizzle_orm_1.and)(...conditions) : undefined,
            orderBy: [schema.symbols.symbol],
        });
        const latestPrices = await this.db.query.latestPrices.findMany();
        const priceMap = new Map(latestPrices.map((p) => [p.symbolId, p]));
        const symbolsWithPrices = symbols.map((s) => {
            const latestPrice = priceMap.get(s.id);
            return {
                ...s,
                currentPrice: latestPrice ? parseFloat(latestPrice.price) : parseFloat(s.basePrice),
                change: latestPrice ? parseFloat(latestPrice.change) : 0,
                changePercent: latestPrice ? parseFloat(latestPrice.changePercent) : 0,
            };
        });
        let filtered = symbolsWithPrices;
        if (options?.search) {
            const searchLower = options.search.toLowerCase();
            filtered = symbolsWithPrices.filter((s) => s.symbol.toLowerCase().includes(searchLower) ||
                s.companyName.toLowerCase().includes(searchLower));
        }
        return filtered;
    }
    async findById(id) {
        const symbol = await this.db.query.symbols.findFirst({
            where: (0, drizzle_orm_1.eq)(schema.symbols.id, id),
        });
        if (!symbol) {
            throw new common_1.NotFoundException('Symbol not found');
        }
        return symbol;
    }
    async findBySymbol(symbolCode) {
        const symbol = await this.db.query.symbols.findFirst({
            where: (0, drizzle_orm_1.eq)(schema.symbols.symbol, symbolCode.toUpperCase()),
        });
        return symbol;
    }
    async create(dto) {
        const existing = await this.findBySymbol(dto.symbol);
        if (existing) {
            throw new common_1.ConflictException('Symbol already exists');
        }
        const symbolId = (0, uuid_1.v4)();
        const [symbol] = await this.db.insert(schema.symbols).values({
            id: symbolId,
            symbol: dto.symbol.toUpperCase(),
            companyName: dto.companyName,
            sector: dto.sector,
            listedShares: dto.listedShares,
            logoUrl: dto.logoUrl,
            basePrice: dto.basePrice.toString(),
            isActive: true,
        }).returning();
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
    async update(id, dto) {
        await this.findById(id);
        const [updated] = await this.db.update(schema.symbols)
            .set({
            ...(dto.symbol && { symbol: dto.symbol.toUpperCase() }),
            ...(dto.companyName && { companyName: dto.companyName }),
            ...(dto.sector && { sector: dto.sector }),
            ...(dto.basePrice && { basePrice: dto.basePrice.toString() }),
            ...(dto.sector && { sector: dto.sector }),
            ...(dto.listedShares !== undefined && { listedShares: dto.listedShares }),
            ...(dto.logoUrl !== undefined && { logoUrl: dto.logoUrl }),
            ...(dto.isActive !== undefined && { isActive: dto.isActive }),
            updatedAt: new Date(),
        })
            .where((0, drizzle_orm_1.eq)(schema.symbols.id, id))
            .returning();
        return updated;
    }
    async delete(id) {
        const [updated] = await this.db.update(schema.symbols)
            .set({
            isActive: false,
            updatedAt: new Date(),
        })
            .where((0, drizzle_orm_1.eq)(schema.symbols.id, id))
            .returning();
        if (!updated) {
            throw new common_1.NotFoundException('Symbol not found');
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
};
exports.SymbolsService = SymbolsService;
exports.SymbolsService = SymbolsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(database_module_1.DATABASE_CONNECTION)),
    __metadata("design:paramtypes", [Object])
], SymbolsService);
//# sourceMappingURL=symbols.service.js.map