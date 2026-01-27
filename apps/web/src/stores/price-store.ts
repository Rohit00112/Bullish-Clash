import { create } from 'zustand';

export interface PriceData {
    symbolId: string;
    symbol: string;
    companyName: string;
    sector: string;
    price: number;
    previousClose: number;
    open: number;
    high: number;
    low: number;
    volume: number;
    change: number;
    changePercent: number;
    updatedAt: string;
    // Animation state
    flashDirection?: 'up' | 'down' | null;
}

interface PriceState {
    prices: Map<string, PriceData>;
    lastUpdated: Date | null;

    // Actions
    setPrices: (prices: PriceData[]) => void;
    updatePrice: (data: {
        symbolId: string;
        symbol: string;
        price: number;
        previousPrice: number;
        change: number;
        changePercent: number;
    }) => void;
    getPrice: (symbolId: string) => PriceData | undefined;
    getAllPrices: () => PriceData[];
}

export const usePriceStore = create<PriceState>((set, get) => ({
    prices: new Map(),
    lastUpdated: null,

    setPrices: (prices) => {
        const priceMap = new Map<string, PriceData>();
        prices.forEach((p) => {
            priceMap.set(p.symbolId, p);
        });
        set({ prices: priceMap, lastUpdated: new Date() });
    },

    updatePrice: (data) => {
        const prices = new Map(get().prices);
        const existing = prices.get(data.symbolId);

        if (existing) {
            const direction = data.price > existing.price ? 'up' : data.price < existing.price ? 'down' : null;

            prices.set(data.symbolId, {
                ...existing,
                price: data.price,
                change: data.change,
                changePercent: data.changePercent,
                high: Math.max(existing.high, data.price),
                low: Math.min(existing.low, data.price),
                updatedAt: new Date().toISOString(),
                flashDirection: direction,
            });

            // Clear flash after animation
            setTimeout(() => {
                const currentPrices = new Map(get().prices);
                const current = currentPrices.get(data.symbolId);
                if (current) {
                    currentPrices.set(data.symbolId, { ...current, flashDirection: null });
                    set({ prices: currentPrices });
                }
            }, 500);
        }

        set({ prices, lastUpdated: new Date() });
    },

    getPrice: (symbolId) => {
        return get().prices.get(symbolId);
    },

    getAllPrices: () => {
        return Array.from(get().prices.values());
    },
}));
