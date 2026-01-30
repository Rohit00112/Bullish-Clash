'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    TrendingUp,
    TrendingDown,
    Search,
    ArrowUpDown,
    Loader2,
    ChevronDown,
    BarChart3,
    X,
    Star,
    AlertCircle,
} from 'lucide-react';
import { symbolsApi, tradingApi, pricesApi, portfolioApi, watchlistApi, competitionApi } from '@/lib/api';
import { formatCurrency, formatNumber, formatPercent, getPriceChangeClass } from '@/lib/utils';
import { usePriceStore } from '@/stores/price-store';
import { useToast } from '@/hooks/use-toast';
import { useNotifications } from '@/hooks/use-notifications';
import { TradingChart, generateSampleData } from '@/components/ui/trading-chart';
import { OrderBook } from '@/components/ui/order-book';
import { OpenOrders } from '@/components/ui/open-orders';
import { BiddingPanel } from '@/components/ui/bidding-panel';
import { Time } from 'lightweight-charts';

type OrderSide = 'buy' | 'sell';
type OrderType = 'market' | 'limit';

interface Symbol {
    id: string;
    symbol: string;
    companyName: string;
    sector: string;
    isActive: boolean;
    listedShares?: number;
    availableShares?: number;
}

interface Position {
    symbolId: string;
    symbol: string;
    quantity: number;
    avgPrice: number;
    marketValue: number;
    unrealizedPL: number;
    unrealizedPLPercent: number;
}

export default function TradePage() {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const { notifyTrade } = useNotifications();
    const { setPrices, getAllPrices, getPrice } = usePriceStore();

    // State - with localStorage persistence for key UI states
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSymbol, setSelectedSymbol] = useState<Symbol | null>(null);
    const [orderSide, setOrderSide] = useState<OrderSide>('buy');
    const [orderType, setOrderType] = useState<OrderType>('market');
    const [quantity, setQuantity] = useState('');
    const [limitPrice, setLimitPrice] = useState('');
    const [sortBy, setSortBy] = useState<'symbol' | 'change'>('symbol');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [showChart, setShowChart] = useState(false);
    const [chartInterval, setChartInterval] = useState('1m');
    const [showWatchlistOnly, setShowWatchlistOnly] = useState(false);
    const restoredRef = useRef(false);

    // Fetch competition status
    const { data: competition, isLoading: competitionLoading } = useQuery({
        queryKey: ['competition-active'],
        queryFn: async () => {
            const res = await competitionApi.getActive();
            return res.data;
        },
        refetchInterval: 30000, // Check every 30 seconds
    });

    const isCompetitionActive = competition?.status === 'active';

    // Fetch symbols first so we can restore state
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
                const savedState = localStorage.getItem('trade-page-state');
                if (savedState) {
                    const parsed = JSON.parse(savedState);
                    if (parsed.showChart !== undefined) setShowChart(parsed.showChart);
                    if (parsed.chartInterval) setChartInterval(parsed.chartInterval);
                    if (parsed.selectedSymbolId) {
                        const symbol = symbolsData.find((s: Symbol) => s.id === parsed.selectedSymbolId);
                        if (symbol) {
                            setSelectedSymbol(symbol);
                            return;
                        }
                    }
                }
                // Fallback: select first active symbol
                const firstActive = symbolsData.find((s: Symbol) => s.isActive);
                if (firstActive) setSelectedSymbol(firstActive);
            } catch (e) {
                console.error('Failed to restore trade page state:', e);
                const firstActive = symbolsData.find((s: Symbol) => s.isActive);
                if (firstActive) setSelectedSymbol(firstActive);
            }
        }
    }, [symbolsData]);

    // Save state to localStorage when it changes
    useEffect(() => {
        if (restoredRef.current && selectedSymbol) {
            localStorage.setItem('trade-page-state', JSON.stringify({
                selectedSymbolId: selectedSymbol.id,
                showChart,
                chartInterval,
            }));
        }
    }, [selectedSymbol, showChart, chartInterval]);

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

    // Fetch portfolio for positions
    const { data: portfolio } = useQuery({
        queryKey: ['portfolio'],
        queryFn: async () => {
            const res = await portfolioApi.get();
            return res.data;
        },
        refetchInterval: 5000,
    });

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
                // If no real data, generate consistent sample data
                const currentPrice = getPrice(selectedSymbol.id)?.price || 1000;
                return generateSampleData(currentPrice, 100, getSymbolSeed(selectedSymbol.id));
            }
        },
        enabled: !!selectedSymbol?.id && showChart,
        refetchInterval: showChart ? 5000 : false,
    });

    // Transform candle data for chart
    const chartData = useMemo(() => {
        if (!candleData || candleData.length === 0) {
            // Generate consistent sample data if no candle data available
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

    // Update price store
    useEffect(() => {
        if (pricesData) {
            setPrices(pricesData);
        }
    }, [pricesData, setPrices]);

    // Place order mutation
    const placeOrderMutation = useMutation({
        mutationFn: async (orderData: {
            symbolId: string;
            side: 'buy' | 'sell';
            quantity: number;
            type?: 'market' | 'limit';
            price?: number;
        }) => {
            const res = await tradingApi.placeOrder(orderData);
            return res.data;
        },
        onSuccess: (data) => {
            // Use notification system which respects user preferences
            notifyTrade({
                side: orderSide,
                symbol: selectedSymbol?.symbol || '',
                quantity: parseInt(quantity),
                price: data.trade?.price || data.order?.avgFilledPrice || parseFloat(limitPrice) || 0,
            });
            queryClient.invalidateQueries({ queryKey: ['portfolio'] });
            queryClient.invalidateQueries({ queryKey: ['open-orders'] });
            queryClient.invalidateQueries({ queryKey: ['orderbook', selectedSymbol?.id] });
            setQuantity('');
            setLimitPrice('');

            // Show message for limit orders that weren't fully filled
            if (orderType === 'limit' && data.order?.status !== 'filled') {
                toast({
                    title: 'Limit Order Placed',
                    description: data.message,
                });
            }
        },
        onError: (error: any) => {
            toast({
                title: 'Order Failed',
                description: error.response?.data?.message || 'Failed to place order',
                variant: 'destructive',
            });
        },
    });

    // Filter and sort symbols
    const prices = getAllPrices();

    const toggleWatchlist = (symbolId: string) => {
        if (watchlist.includes(symbolId)) {
            removeFromWatchlistMutation.mutate(symbolId);
        } else {
            addToWatchlistMutation.mutate(symbolId);
        }
    };

    const filteredSymbols = useMemo(() => {
        let symbols = symbolsData?.filter((s: Symbol) => s.isActive) || [];

        // Filter by watchlist if enabled
        if (showWatchlistOnly) {
            symbols = symbols.filter((s: Symbol) => watchlist.includes(s.id));
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            symbols = symbols.filter(
                (s: Symbol) =>
                    s.symbol.toLowerCase().includes(query) ||
                    s.companyName.toLowerCase().includes(query) ||
                    s.sector.toLowerCase().includes(query)
            );
        }

        // Sort with prices
        symbols = symbols.map((s: Symbol) => {
            const price = prices.find((p) => p.symbolId === s.id);
            return { ...s, price };
        });

        symbols.sort((a: any, b: any) => {
            if (sortBy === 'symbol') {
                const aSymbol = a.symbol || '';
                const bSymbol = b.symbol || '';
                return sortOrder === 'asc'
                    ? aSymbol.localeCompare(bSymbol)
                    : bSymbol.localeCompare(aSymbol);
            } else {
                const aChange = a.price?.changePercent || 0;
                const bChange = b.price?.changePercent || 0;
                return sortOrder === 'asc' ? aChange - bChange : bChange - aChange;
            }
        });

        return symbols;
    }, [symbolsData, searchQuery, prices, sortBy, sortOrder, showWatchlistOnly, watchlist]);

    // Get selected symbol price
    const selectedPrice = selectedSymbol ? getPrice(selectedSymbol.id) : null;

    // Get position for selected symbol
    const selectedPosition = portfolio?.positions?.find(
        (p: Position) => p.symbolId === selectedSymbol?.id
    );

    // Calculate order total
    const orderQuantity = parseInt(quantity) || 0;
    const orderPrice = orderType === 'limit' ? parseFloat(limitPrice) || 0 : selectedPrice?.price || 0;
    const orderTotal = orderQuantity * orderPrice;
    const commission = orderTotal * 0.004; // 0.4% commission

    // Check if order is valid
    const isOrderValid = () => {
        if (!selectedSymbol || orderQuantity <= 0) return false;
        if (orderType === 'limit' && parseFloat(limitPrice) <= 0) return false;
        if (orderSide === 'buy' && orderTotal + commission > (portfolio?.cash || 0)) return false;
        if (orderSide === 'sell' && orderQuantity > (selectedPosition?.quantity || 0)) return false;
        return true;
    };

    // Handle place order
    const handlePlaceOrder = () => {
        if (!selectedSymbol || !isOrderValid()) return;

        const orderData: {
            symbolId: string;
            side: 'buy' | 'sell';
            quantity: number;
            type?: 'market' | 'limit';
            price?: number;
        } = {
            symbolId: selectedSymbol.id,
            side: orderSide,
            quantity: orderQuantity,
            type: orderType,
        };

        if (orderType === 'limit') {
            orderData.price = parseFloat(limitPrice);
        }

        placeOrderMutation.mutate(orderData);
    };

    // Handle clicking on orderbook price
    const handleOrderBookPriceClick = (price: number) => {
        setOrderType('limit');
        setLimitPrice(price.toString());
    };

    // Toggle sort
    const toggleSort = (field: 'symbol' | 'change') => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('asc');
        }
    };

    // Show loading while checking competition status
    if (competitionLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    // Show Bidding Panel if status is 'bidding'
    if (competition?.status === 'bidding') {
        return <BiddingPanel />;
    }

    // Show blocked message when competition is not active and NOT in bidding
    if (!isCompetitionActive) {
        const statusMessage = competition?.status === 'ended'
            ? 'The competition has ended. Thank you for participating!'
            : competition?.status === 'paused'
                ? 'The competition is currently paused. Trading will resume soon.'
                : competition?.status === 'scheduled'
                    ? 'The competition has not started yet. Please wait for the competition to begin.'
                    : 'No active competition found.';

        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
                <div className="card max-w-md p-8">
                    <AlertCircle className={`h-16 w-16 mx-auto mb-4 ${competition?.status === 'ended' ? 'text-red-500' :
                        competition?.status === 'paused' ? 'text-yellow-500' :
                            'text-muted-foreground'
                        }`} />
                    <h2 className="text-xl font-bold mb-2">Trading Unavailable</h2>
                    <p className="text-muted-foreground mb-4">{statusMessage}</p>
                    {competition?.status === 'ended' && (
                        <a
                            href="/dashboard/leaderboard"
                            className="btn-primary inline-flex items-center gap-2"
                        >
                            View Final Leaderboard
                        </a>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            {/* TradingView Chart */}
            {showChart && selectedSymbol && (
                <div className="relative">
                    <button
                        onClick={() => setShowChart(false)}
                        className="absolute top-3 right-3 z-20 p-2 bg-secondary/80 rounded-full hover:bg-secondary transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                    <TradingChart
                        symbolId={selectedSymbol.id}
                        symbol={selectedSymbol.symbol}
                        companyName={selectedSymbol.companyName}
                        currentPrice={selectedPrice?.price}
                        priceChange={selectedPrice?.change}
                        changePercent={selectedPrice?.changePercent}
                        height={400}
                        data={chartData}
                        interval={chartInterval}
                        onIntervalChange={setChartInterval}
                    />
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
                {/* Market Watch */}
                <div className="lg:col-span-2 card flex flex-col max-h-full">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <h2 className="text-lg font-semibold">Market Watch</h2>
                            <button
                                onClick={() => setShowWatchlistOnly(!showWatchlistOnly)}
                                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-sm transition-colors ${showWatchlistOnly
                                    ? 'bg-yellow-500/20 text-yellow-500'
                                    : 'bg-secondary text-muted-foreground hover:text-foreground'
                                    }`}
                                title={showWatchlistOnly ? 'Show all stocks' : 'Show watchlist only'}
                            >
                                <Star className={`h-4 w-4 ${showWatchlistOnly ? 'fill-current' : ''}`} />
                                {showWatchlistOnly ? 'Watchlist' : 'All'}
                            </button>
                        </div>
                        <div className="flex items-center gap-3">
                            {selectedSymbol && (
                                <button
                                    onClick={() => setShowChart(!showChart)}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${showChart
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-secondary text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    <BarChart3 className="h-4 w-4" />
                                    Chart
                                </button>
                            )}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Search stocks..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="input pl-9 w-64"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Table Header */}
                    <div className="grid grid-cols-7 gap-4 px-4 py-2 text-sm font-medium text-muted-foreground border-b border-border">
                        <span></span>
                        <button
                            onClick={() => toggleSort('symbol')}
                            className="flex items-center gap-1 hover:text-foreground text-left"
                        >
                            Symbol
                            {sortBy === 'symbol' && (
                                <ArrowUpDown className="h-3 w-3" />
                            )}
                        </button>
                        <span className="col-span-2">Name</span>
                        <span className="text-right">Price</span>
                        <button
                            onClick={() => toggleSort('change')}
                            className="flex items-center justify-end gap-1 hover:text-foreground"
                        >
                            Change
                            {sortBy === 'change' && (
                                <ArrowUpDown className="h-3 w-3" />
                            )}
                        </button>
                        <span className="text-right">Action</span>
                    </div>

                    {/* Stock List */}
                    <div className="flex-1 overflow-y-auto">
                        {filteredSymbols.map((symbol: any) => {
                            const price = symbol.price;
                            const isSelected = selectedSymbol?.id === symbol.id;
                            const isInWatchlist = watchlist.includes(symbol.id);

                            return (
                                <div
                                    key={symbol.id}
                                    className={`grid grid-cols-7 gap-4 px-4 py-3 border-b border-border hover:bg-secondary/30 transition-colors ${isSelected ? 'bg-primary/10' : ''
                                        }`}
                                >
                                    <button
                                        onClick={() => toggleWatchlist(symbol.id)}
                                        className={`p-1 rounded transition-colors ${isInWatchlist
                                            ? 'text-yellow-500'
                                            : 'text-muted-foreground hover:text-yellow-500'
                                            }`}
                                        title={isInWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
                                    >
                                        <Star className={`h-4 w-4 ${isInWatchlist ? 'fill-current' : ''}`} />
                                    </button>
                                    <span className="font-medium">{symbol.symbol}</span>
                                    <span className="col-span-2 text-sm text-muted-foreground truncate">
                                        {symbol.companyName}
                                    </span>
                                    <span className="text-right font-mono">
                                        {price ? formatCurrency(price.price) : '-'}
                                    </span>
                                    <span
                                        className={`text-right font-mono ${getPriceChangeClass(
                                            price?.changePercent || 0
                                        )}`}
                                    >
                                        {price ? (
                                            <span className="flex items-center justify-end gap-1">
                                                {price.changePercent >= 0 ? (
                                                    <TrendingUp className="h-3 w-3" />
                                                ) : (
                                                    <TrendingDown className="h-3 w-3" />
                                                )}
                                                {formatPercent(price.changePercent)}
                                            </span>
                                        ) : (
                                            '-'
                                        )}
                                    </span>
                                    <div className="flex justify-end gap-1">
                                        <button
                                            onClick={() => {
                                                setSelectedSymbol(symbol);
                                                setShowChart(true);
                                            }}
                                            className="p-1 text-xs bg-secondary text-muted-foreground rounded hover:bg-secondary/80 hover:text-foreground"
                                            title="View Chart"
                                        >
                                            <BarChart3 className="h-3 w-3" />
                                        </button>
                                        <button
                                            onClick={() => {
                                                setSelectedSymbol(symbol);
                                                setOrderSide('buy');
                                            }}
                                            className="px-2 py-1 text-xs bg-green-500/20 text-green-500 rounded hover:bg-green-500/30"
                                        >
                                            Buy
                                        </button>
                                        <button
                                            onClick={() => {
                                                setSelectedSymbol(symbol);
                                                setOrderSide('sell');
                                            }}
                                            className="px-2 py-1 text-xs bg-red-500/20 text-red-500 rounded hover:bg-red-500/30"
                                        >
                                            Sell
                                        </button>
                                    </div>
                                </div>
                            );
                        })}

                        {filteredSymbols.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground">
                                {showWatchlistOnly
                                    ? 'No stocks in watchlist. Click the star icon to add stocks.'
                                    : 'No stocks found'}
                            </div>
                        )}
                    </div>
                </div>

                {/* Order Panel */}
                <div className="card flex flex-col overflow-y-auto">
                    <h2 className="text-lg font-semibold mb-4">Place Order</h2>

                    {selectedSymbol ? (
                        <>
                            {/* Selected Stock Info */}
                            <div className="bg-secondary/30 rounded-lg p-4 mb-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-xl">{selectedSymbol.symbol}</h3>
                                        <p className="text-sm text-muted-foreground">{selectedSymbol.companyName}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-mono text-xl font-bold">
                                            {selectedPrice ? formatCurrency(selectedPrice.price) : '-'}
                                        </p>
                                        {selectedPrice && (
                                            <p className={`text-sm ${getPriceChangeClass(selectedPrice.changePercent)}`}>
                                                {formatPercent(selectedPrice.changePercent)} today
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {selectedPosition && (
                                    <div className="mt-3 pt-3 border-t border-border">
                                        <p className="text-sm text-muted-foreground">
                                            Position: {formatNumber(selectedPosition.quantity)} shares @{' '}
                                            {formatCurrency(selectedPosition.avgPrice)}
                                        </p>
                                    </div>
                                )}

                                {selectedSymbol.availableShares !== undefined && (
                                    <div className="mt-3 pt-3 border-t border-border">
                                        <p className="text-sm text-muted-foreground">
                                            Available Status: {formatNumber(selectedSymbol.availableShares)} / {formatNumber(selectedSymbol.listedShares || 0)} shares
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Order Book */}
                            <div className="mb-4">
                                <OrderBook
                                    symbolId={selectedSymbol.id}
                                    symbol={selectedSymbol.symbol}
                                    onPriceClick={handleOrderBookPriceClick}
                                />
                            </div>

                            {/* Order Side Toggle */}
                            <div className="grid grid-cols-2 gap-2 mb-4">
                                <button
                                    onClick={() => setOrderSide('buy')}
                                    className={`py-2 rounded-lg font-medium transition-colors ${orderSide === 'buy'
                                        ? 'bg-green-500 text-white'
                                        : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                                        }`}
                                >
                                    Buy
                                </button>
                                <button
                                    onClick={() => setOrderSide('sell')}
                                    className={`py-2 rounded-lg font-medium transition-colors ${orderSide === 'sell'
                                        ? 'bg-red-500 text-white'
                                        : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                                        }`}
                                >
                                    Sell
                                </button>
                            </div>

                            {/* Order Type */}
                            <div className="mb-4">
                                <label className="label">Order Type</label>
                                <div className="relative">
                                    <select
                                        value={orderType}
                                        onChange={(e) => setOrderType(e.target.value as OrderType)}
                                        className="input w-full appearance-none cursor-pointer"
                                    >
                                        <option value="market">Market Order</option>
                                        <option value="limit">Limit Order</option>
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {orderType === 'market'
                                        ? 'Executes immediately at current price'
                                        : 'Executes when price reaches your limit'}
                                </p>
                            </div>

                            {/* Quantity */}
                            <div className="mb-4">
                                <label className="label">Quantity</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    placeholder="Enter quantity"
                                    className="input w-full"
                                />
                                {orderSide === 'sell' && selectedPosition && (
                                    <button
                                        onClick={() => setQuantity(selectedPosition.quantity.toString())}
                                        className="text-xs text-primary mt-1 hover:underline"
                                    >
                                        Sell all ({selectedPosition.quantity} shares)
                                    </button>
                                )}
                            </div>

                            {/* Limit Price */}
                            {orderType === 'limit' && (
                                <div className="mb-4">
                                    <label className="label">Limit Price</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={limitPrice}
                                        onChange={(e) => setLimitPrice(e.target.value)}
                                        placeholder="Enter limit price"
                                        className="input w-full"
                                    />
                                    {selectedPrice && (
                                        <div className="mt-2">
                                            <input
                                                type="range"
                                                min="-2"
                                                max="2"
                                                step="0.5"
                                                defaultValue="0"
                                                onChange={(e) => {
                                                    const percent = parseFloat(e.target.value) * 2.5 / 100;
                                                    setLimitPrice((selectedPrice.price * (1 + percent)).toFixed(2));
                                                }}
                                                className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                                            />
                                            <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                                <span>-5%</span>
                                                <button
                                                    onClick={() => setLimitPrice(selectedPrice.price.toFixed(2))}
                                                    className="text-primary hover:underline font-medium"
                                                >
                                                    Current
                                                </button>
                                                <span>+5%</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}                            {/* Order Summary */}
                            <div className="bg-secondary/30 rounded-lg p-4 mb-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        {orderQuantity} × {formatCurrency(orderPrice)}
                                    </span>
                                    <span>{formatCurrency(orderTotal)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Commission (0.4%)</span>
                                    <span>{formatCurrency(commission)}</span>
                                </div>
                                <div className="flex justify-between font-medium pt-2 border-t border-border">
                                    <span>Total</span>
                                    <span>{formatCurrency(orderTotal + (orderSide === 'buy' ? commission : -commission))}</span>
                                </div>
                            </div>

                            {/* Cash Available */}
                            <p className="text-base font-semibold text-foreground mb-4">
                                Available: {formatCurrency(portfolio?.cash || 0)}
                            </p>

                            {/* Place Order Button */}
                            <button
                                onClick={handlePlaceOrder}
                                disabled={!isOrderValid() || placeOrderMutation.isPending}
                                className={`w-full py-3 rounded-lg font-medium transition-colors ${orderSide === 'buy'
                                    ? 'bg-green-500 hover:bg-green-600 text-white'
                                    : 'bg-red-500 hover:bg-red-600 text-white'
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                {placeOrderMutation.isPending ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Processing...
                                    </span>
                                ) : (
                                    `${orderType === 'limit' ? 'PLACE LIMIT ' : ''}${orderSide.toUpperCase()} ${selectedSymbol.symbol}`
                                )}
                            </button>

                            {/* Error Messages */}
                            {orderSide === 'buy' && orderTotal + commission > (portfolio?.cash || 0) && (
                                <p className="text-red-500 text-sm mt-2">Insufficient funds</p>
                            )}
                            {orderSide === 'sell' && orderQuantity > (selectedPosition?.quantity || 0) && (
                                <p className="text-red-500 text-sm mt-2">
                                    Not enough shares (have {selectedPosition?.quantity || 0})
                                </p>
                            )}

                            {/* Open Orders Section */}
                            <div className="mt-6 pt-4 border-t border-border">
                                <OpenOrders />
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-muted-foreground">
                            <p>Select a stock to trade</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
