export declare class CreateSymbolDto {
    symbol: string;
    companyName: string;
    sector: string;
    basePrice: number;
    listedShares?: number;
    logoUrl?: string;
}
export declare class UpdateSymbolDto {
    companyName?: string;
    sector?: string;
    listedShares?: number;
    logoUrl?: string;
    isActive?: boolean;
}
