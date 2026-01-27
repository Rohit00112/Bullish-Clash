'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, TrendingUp, TrendingDown, Star, StarOff } from 'lucide-react';
import { symbolsApi, pricesApi, watchlistApi } from '@/lib/api';
import { formatCurrency, formatPercent, getPriceChangeClass } from '@/lib/utils';
import { usePriceStore } from '@/stores/price-store';
import { TradingChart, generateSampleData } from '@/components/ui/trading-chart';
import { Time } from 'lightweight-charts';

interface Symbol {
    id: string;
    symbol: string;
    companyName: string;
    sector: string;
    isActive: boolean;
}

export default function ChartPage() {
    const queryClient = useQueryClient();
    const { setPrices, getAllPrices, getPrice } = usePriceStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSymbol, setSelectedSymbol] = useState<Symbol | null>(null);
    const [chartInterval, setChartInterval] = useState('1m');
    const [showWatchlistOnly, setShowWatchlistOnly] = useState(false);
    const restoredRef = useRef(false);

    // Fetch symbols
    const { data: symbolsData } = useQuery({
        queryKey: ['symbols'],
        queryFn: async () => {
            const res = await symbolsApi.getAll();
            return res.data;
        },
    });

    // Restore state from localStorage once symbols are loaded
    useEffect(() => {
        if (symbolsData && symbolsData.length > 0 && !restoredRef.current) {
            restoredRef.current = true;
            try {
                const savedState = localStorage.getItem('chart-page-state');
                console.log('Restoring chart state:', savedState);
                if (savedState) {
                    const parsed = JSON.parse(savedState);
                    if (parsed.chartInterval) setChartInterval(parsed.chartInterval);
                    if (parsed.selectedSymbolId) {
                        const symbol = symbolsData.find((s: Symbol) => s.id === parsed.selectedSymbolId);
                        if (symbol) {
                            console.log('Restored symbol:', symbol.symbol);
                            setSelectedSymbol(symbol);
                            return;
                        }
                    }
                }
                // Fallback: select first symbol
                const firstActive = symbolsData.find((s: Symbol) => s.isActive);
                if (firstActive) setSelectedSymbol(firstActive);
            } catch (e) {
                console.error('Failed to restore chart page state:', e);
                const firstActive = symbolsData.find((s: Symbol) => s.isActive);
                if (firstActive) setSelectedSymbol(firstActive);
            }
        }
    }, [symbolsData]);

    // Save state to localStorage when it changes
    useEffect(() => {
        if (restoredRef.current && selectedSymbol) {
            const state = {
                selectedSymbolId: selectedSymbol.id,
                chartInterval,
            };
            console.log('Saving chart state:', state);
            localStorage.setItem('chart-page-state', JSON.stringify(state));
        }
    }, [selectedSymbol, chartInterval]);

    // Fetch watchlist from database
    const { data: watchlistData } = useQuery({
        queryKey: ['watchlist'],
        queryFn: async () => {
            const res = await watchlistApi.get();
            return (res.data as any[]).map((item: any) => item.symbolId);
        },
    });

    const watchlist = watchlistData || [];

    // Add to watchlist mutation
    const addToWatchlistMutation = useMutation({
        mutationFn: async (symbolId: string) => {
            await watchlistApi.add(symbolId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['watchlist'] });
        },
    });

    // Remove from watchlist mutation
    const removeFromWatchlistMutation = useMutation({
        mutationFn: async (symbolId: string) => {
            await watchlistApi.remove(symbolId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['watchlist'] });
        },
    });

    // Fetch prices
    const { data: pricesData } = useQuery({
        queryKey: ['prices'],
        queryFn: async () => {
            const res = await pricesApi.getAll();
            return res.data;
        },
        refetchInterval: 3000,
    });

    // Update price store
    useEffect(() => {
        if (pricesData) {
            setPrices(pricesData);
        }
    }, [pricesData, setPrices]);

    // Generate a consistent seed from symbol ID
    const getSymbolSeed = (symbolId: string) => {
        let hash = 0;
        for (let i = 0; i < symbolId.length; i++) {
            hash = ((hash << 5) - hash) + symbolId.charCodeAt(i);
            hash |= 0;
        }
        return Math.abs(hash);
    };

    // Fetch candle data for selected symbol
    const { data: candleData } = useQuery({
        queryKey: ['candles', selectedSymbol?.id, chartInterval],
        queryFn: async () => {
            if (!selectedSymbol?.id) return [];
            try {
                const res = await pricesApi.getCandles(selectedSymbol.id, {
                    interval: chartInterval,
                    limit: 100
                });
                return res.data;
            } catch (error) {
                const currentPrice = getPrice(selectedSymbol.id)?.price || 1000;
                return generateSampleData(currentPrice, 100, getSymbolSeed(selectedSymbol.id));
            }
        },
        enabled: !!selectedSymbol?.id,
        refetchInterval: 5000,
    });

    // Transform candle data for chart
    const chartData = useMemo(() => {
        if (!candleData || candleData.length === 0) {
            const currentPrice = selectedSymbol ? (getPrice(selectedSymbol.id)?.price || 1000) : 1000;
            const seed = selectedSymbol ? getSymbolSeed(selectedSymbol.id) : 0;
            return generateSampleData(currentPrice, 100, seed);
        }
        return candleData.map((c: any) => ({
            time: (new Date(c.timestamp).getTime() / 1000) as Time,
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close,
            volume: c.volume || 0,
        }));
    }, [candleData, selectedSymbol, getPrice]);

    const prices = getAllPrices();

    // Filter symbols
    const filteredSymbols = useMemo(() => {
        let symbols = symbolsData?.filter((s: Symbol) => s.isActive) || [];

        if (showWatchlistOnly) {
            symbols = symbols.filter((s: Symbol) => watchlist.includes(s.id));
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            symbols = symbols.filter(
                (s: Symbol) =>
                    s.symbol.toLowerCase().includes(query) ||
                    s.companyName.toLowerCase().includes(query)
            );
        }

        return symbols.map((s: Symbol) => {
            const price = prices.find((p) => p.symbolId === s.id);
            return { ...s, price };
        }).sort((a: any, b: any) => {
            // Sort by change percent (biggest movers first)
            const aChange = Math.abs(a.price?.changePercent || 0);
            const bChange = Math.abs(b.price?.changePercent || 0);
            return bChange - aChange;
        });
    }, [symbolsData, searchQuery, prices, showWatchlistOnly, watchlist]);

    const selectedPrice = selectedSymbol ? getPrice(selectedSymbol.id) : null;

    const toggleWatchlist = (symbolId: string) => {
        if (watchlist.includes(symbolId)) {
            removeFromWatchlistMutation.mutate(symbolId);
        } else {
            addToWatchlistMutation.mutate(symbolId);
        }
    };

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)]">
            {/* Symbol List Sidebar */}
            <div className="w-full lg:w-80 flex-shrink-0 card flex flex-col max-h-full">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Stocks</h2>
                    <button
                        onClick={() => setShowWatchlistOnly(!showWatchlistOnly)}
                        className={`p-2 rounded-lg transition-colors ${showWatchlistOnly
                            ? 'bg-yellow-500/20 text-yellow-500'
                            : 'bg-secondary text-muted-foreground hover:text-foreground'
                            }`}
                        title={showWatchlistOnly ? 'Show all' : 'Show watchlist only'}
                    >
                        <Star className="h-4 w-4" />
                    </button>
                </div>

                {/* Search */}
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search stocks..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="input pl-9 w-full"
                    />
                </div>

                {/* Stock List */}
                <div className="flex-1 overflow-y-auto space-y-1">
                    {filteredSymbols.map((symbol: any) => {
                        const isSelected = selectedSymbol?.id === symbol.id;
                        const isInWatchlist = watchlist.includes(symbol.id);
                        const price = symbol.price;

                        return (
                            <div
                                key={symbol.id}
                                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${isSelected
                                    ? 'bg-primary/10 border border-primary/30'
                                    : 'hover:bg-secondary/50 border border-transparent'
                                    }`}
                                onClick={() => setSelectedSymbol(symbol)}
                            >
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleWatchlist(symbol.id);
                                    }}
                                    className={`p-1 rounded transition-colors ${isInWatchlist
                                        ? 'text-yellow-500'
                                        : 'text-muted-foreground hover:text-yellow-500'
                                        }`}
                                >
                                    {isInWatchlist ? (
                                        <Star className="h-4 w-4 fill-current" />
                                    ) : (
                                        <StarOff className="h-4 w-4" />
                                    )}
                                </button>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">{symbol.symbol}</span>
                                        {price?.changePercent !== undefined && (
                                            price.changePercent >= 0 ? (
                                                <TrendingUp className="h-3 w-3 text-green-500" />
                                            ) : (
                                                <TrendingDown className="h-3 w-3 text-red-500" />
                                            )
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {symbol.companyName}
                                    </p>
                                </div>

                                <div className="text-right">
                                    <p className="font-mono text-sm">
                                        {price ? formatCurrency(price.price) : '-'}
                                    </p>
                                    <p
                                        className={`text-xs font-mono ${getPriceChangeClass(
                                            price?.changePercent || 0
                                        )}`}
                                    >
                                        {price ? formatPercent(price.changePercent) : '-'}
                                    </p>
                                </div>
                            </div>
                        );
                    })}

                    {filteredSymbols.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                            {showWatchlistOnly
                                ? 'No stocks in watchlist'
                                : 'No stocks found'}
                        </div>
                    )}
                </div>
            </div>

            {/* Chart Area */}
            <div className="flex-1 min-w-0">
                {selectedSymbol ? (
                    <TradingChart
                        symbolId={selectedSymbol.id}
                        symbol={selectedSymbol.symbol}
                        companyName={selectedSymbol.companyName}
                        currentPrice={selectedPrice?.price}
                        priceChange={selectedPrice?.change}
                        changePercent={selectedPrice?.changePercent}
                        height={600}
                        data={chartData}
                        interval={chartInterval}
                        onIntervalChange={setChartInterval}
                    />
                ) : (
                    <div className="card h-full flex items-center justify-center">
                        <div className="text-center text-muted-foreground">
                            <p className="text-lg">Select a stock to view chart</p>
                            <p className="text-sm mt-2">
                                Choose from the list on the left
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
