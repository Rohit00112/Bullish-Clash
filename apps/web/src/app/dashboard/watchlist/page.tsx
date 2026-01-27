'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Star,
    TrendingUp,
    TrendingDown,
    Search,
    Plus,
    Trash2,
    Loader2,
    Eye,
    ShoppingCart,
} from 'lucide-react';
import { watchlistApi, symbolsApi } from '@/lib/api';
import { formatCurrency, formatNumber, formatPercent, getPriceChangeClass } from '@/lib/utils';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

interface WatchlistItem {
    id: string;
    symbolId: string;
    symbol: string;
    companyName: string;
    sector: string;
    price: number;
    change: number;
    changePercent: number;
    high: number;
    low: number;
    volume: number;
    addedAt: string;
}

interface Symbol {
    id: string;
    symbol: string;
    companyName: string;
    sector: string;
}

export default function WatchlistPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [symbolSearch, setSymbolSearch] = useState('');
    const queryClient = useQueryClient();
    const { toast } = useToast();

    // Fetch watchlist
    const { data: watchlist, isLoading } = useQuery({
        queryKey: ['watchlist'],
        queryFn: async () => {
            const res = await watchlistApi.get();
            return res.data as WatchlistItem[];
        },
        refetchInterval: 10000, // Refresh every 10 seconds
    });

    // Fetch all symbols for adding
    const { data: allSymbols } = useQuery({
        queryKey: ['symbols'],
        queryFn: async () => {
            const res = await symbolsApi.getAll();
            return res.data as Symbol[];
        },
        enabled: showAddModal,
    });

    // Add to watchlist mutation
    const addMutation = useMutation({
        mutationFn: (symbolId: string) => watchlistApi.add(symbolId),
        onSuccess: (_, symbolId) => {
            queryClient.invalidateQueries({ queryKey: ['watchlist'] });
            setShowAddModal(false);
            setSymbolSearch('');
            toast({
                title: 'Added to watchlist',
                description: 'Symbol has been added to your watchlist',
            });
        },
        onError: (error: any) => {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to add to watchlist',
                variant: 'destructive',
            });
        },
    });

    // Remove from watchlist mutation
    const removeMutation = useMutation({
        mutationFn: (symbolId: string) => watchlistApi.remove(symbolId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['watchlist'] });
            toast({
                title: 'Removed from watchlist',
                description: 'Symbol has been removed from your watchlist',
            });
        },
        onError: (error: any) => {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to remove from watchlist',
                variant: 'destructive',
            });
        },
    });

    // Filter watchlist
    const filteredWatchlist = watchlist?.filter((item) => {
        if (!item.symbol || !item.companyName) return false;
        const query = searchQuery.toLowerCase();
        return (
            item.symbol.toLowerCase().includes(query) ||
            item.companyName.toLowerCase().includes(query)
        );
    });

    // Filter available symbols (not already in watchlist)
    const watchlistSymbolIds = new Set(watchlist?.map((w) => w.symbolId) || []);
    const availableSymbols = allSymbols?.filter((s) => {
        if (watchlistSymbolIds.has(s.id)) return false;
        const query = symbolSearch.toLowerCase();
        return (
            s.symbol.toLowerCase().includes(query) ||
            s.companyName.toLowerCase().includes(query)
        );
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Star className="h-6 w-6 text-yellow-500" />
                        Watchlist
                    </h1>
                    <p className="text-muted-foreground">
                        Track your favorite stocks ({watchlist?.length || 0}/50)
                    </p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="btn-primary flex items-center gap-2"
                >
                    <Plus className="h-4 w-4" />
                    Add Symbol
                </button>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="Search watchlist..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input pl-10 w-full"
                />
            </div>

            {/* Watchlist Table */}
            <div className="card">
                {filteredWatchlist && filteredWatchlist.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-sm text-muted-foreground border-b border-border">
                                    <th className="text-left py-3 px-4">Symbol</th>
                                    <th className="text-right py-3 px-4">Price</th>
                                    <th className="text-right py-3 px-4">Change</th>
                                    <th className="text-right py-3 px-4">High</th>
                                    <th className="text-right py-3 px-4">Low</th>
                                    <th className="text-right py-3 px-4">Volume</th>
                                    <th className="text-center py-3 px-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredWatchlist.map((item) => (
                                    <tr
                                        key={item.id}
                                        className="border-b border-border hover:bg-secondary/30 transition-colors"
                                    >
                                        <td className="py-4 px-4">
                                            <div>
                                                <p className="font-medium">{item.symbol}</p>
                                                <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                                    {item.companyName}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="text-right py-4 px-4 font-mono font-medium">
                                            {formatCurrency(item.price)}
                                        </td>
                                        <td className={`text-right py-4 px-4 font-mono ${getPriceChangeClass(item.change)}`}>
                                            <div className="flex items-center justify-end gap-1">
                                                {item.change >= 0 ? (
                                                    <TrendingUp className="h-4 w-4" />
                                                ) : (
                                                    <TrendingDown className="h-4 w-4" />
                                                )}
                                                <span>
                                                    {item.change >= 0 ? '+' : ''}
                                                    {formatPercent(item.changePercent)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="text-right py-4 px-4 font-mono text-green-500">
                                            {formatCurrency(item.high)}
                                        </td>
                                        <td className="text-right py-4 px-4 font-mono text-red-500">
                                            {formatCurrency(item.low)}
                                        </td>
                                        <td className="text-right py-4 px-4 font-mono text-muted-foreground">
                                            {formatNumber(item.volume)}
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <Link
                                                    href={`/dashboard/trade?symbol=${item.symbolId}`}
                                                    className="p-2 hover:bg-primary/20 rounded-lg transition-colors"
                                                    title="Trade"
                                                >
                                                    <ShoppingCart className="h-4 w-4 text-primary" />
                                                </Link>
                                                <button
                                                    onClick={() => removeMutation.mutate(item.symbolId)}
                                                    disabled={removeMutation.isPending}
                                                    className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                                                    title="Remove from watchlist"
                                                >
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-12 text-muted-foreground">
                        <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg">Your watchlist is empty</p>
                        <p className="text-sm mb-4">Add stocks to track their performance</p>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="btn-primary"
                        >
                            Add Your First Stock
                        </button>
                    </div>
                )}
            </div>

            {/* Add Symbol Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="card max-w-lg w-full max-h-[80vh] flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold">Add to Watchlist</h2>
                            <button
                                onClick={() => {
                                    setShowAddModal(false);
                                    setSymbolSearch('');
                                }}
                                className="p-2 hover:bg-secondary rounded-lg"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search symbols..."
                                value={symbolSearch}
                                onChange={(e) => setSymbolSearch(e.target.value)}
                                className="input pl-10 w-full"
                                autoFocus
                            />
                        </div>

                        <div className="overflow-y-auto flex-1 min-h-0">
                            {availableSymbols && availableSymbols.length > 0 ? (
                                <div className="space-y-2">
                                    {availableSymbols.slice(0, 20).map((symbol) => (
                                        <button
                                            key={symbol.id}
                                            onClick={() => addMutation.mutate(symbol.id)}
                                            disabled={addMutation.isPending}
                                            className="w-full p-3 text-left hover:bg-secondary/50 rounded-lg transition-colors flex items-center justify-between"
                                        >
                                            <div>
                                                <p className="font-medium">{symbol.symbol}</p>
                                                <p className="text-xs text-muted-foreground truncate max-w-[300px]">
                                                    {symbol.companyName}
                                                </p>
                                            </div>
                                            <Plus className="h-5 w-5 text-primary" />
                                        </button>
                                    ))}
                                    {availableSymbols.length > 20 && (
                                        <p className="text-center text-sm text-muted-foreground py-2">
                                            Showing 20 of {availableSymbols.length} results. Refine your search.
                                        </p>
                                    )}
                                </div>
                            ) : symbolSearch ? (
                                <p className="text-center text-muted-foreground py-8">
                                    No symbols found matching "{symbolSearch}"
                                </p>
                            ) : (
                                <p className="text-center text-muted-foreground py-8">
                                    Type to search for symbols
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
