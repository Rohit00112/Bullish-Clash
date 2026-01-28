export declare class CreateSymbolDto {
    symbol: string;
    companyName: string;
    sector: string;
    basePrice: number;
    listedShares?: number;
    logoUrl?: string;
}
export declare class UpdateSymbolDto {
    symbol?: string;
    companyName?: string;
    sector?: string;
    basePrice?: number;
    listedShares?: number;
    logoUrl?: string;
    isActive?: boolean;
}
