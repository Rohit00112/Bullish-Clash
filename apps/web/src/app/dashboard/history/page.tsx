'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    History,
    ArrowUpRight,
    ArrowDownRight,
    Filter,
    Download,
    Search,
    Calendar,
    Loader2,
    TrendingUp,
    TrendingDown,
    DollarSign,
} from 'lucide-react';
import { tradingApi } from '@/lib/api';
import { formatCurrency, formatDate, formatNumber } from '@/lib/utils';

interface Trade {
    id: string;
    symbolId: string;
    symbol: {
        symbol: string;
        companyName: string;
    };
    side: 'buy' | 'sell';
    quantity: number;
    price: number;
    total: number;
    commission: number;
    executedAt: string;
}

export default function HistoryPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [sideFilter, setSideFilter] = useState<'all' | 'buy' | 'sell'>('all');
    const [sortBy, setSortBy] = useState<'date' | 'total' | 'symbol'>('date');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    // Fetch trade history
    const { data: trades, isLoading, error } = useQuery({
        queryKey: ['trade-history'],
        queryFn: async () => {
            const res = await tradingApi.getTrades({ limit: 100 });
            return res.data;
        },
    });

    // Calculate statistics
    const stats = trades?.reduce(
        (acc: any, trade: Trade) => {
            acc.totalTrades += 1;
            acc.totalVolume += trade.total;
            acc.totalCommission += trade.commission;
            if (trade.side === 'buy') {
                acc.buyCount += 1;
                acc.buyVolume += trade.total;
            } else {
                acc.sellCount += 1;
                acc.sellVolume += trade.total;
            }
            return acc;
        },
        {
            totalTrades: 0,
            totalVolume: 0,
            totalCommission: 0,
            buyCount: 0,
            sellCount: 0,
            buyVolume: 0,
            sellVolume: 0,
        }
    ) || {
        totalTrades: 0,
        totalVolume: 0,
        totalCommission: 0,
        buyCount: 0,
        sellCount: 0,
        buyVolume: 0,
        sellVolume: 0,
    };

    // Filter and sort trades
    const filteredTrades = trades
        ?.filter((trade: Trade) => {
            // Search filter
            const query = searchQuery.toLowerCase();
            const matchesSearch =
                !query ||
                trade.symbol?.symbol?.toLowerCase().includes(query) ||
                trade.symbol?.companyName?.toLowerCase().includes(query);

            // Side filter
            const matchesSide = sideFilter === 'all' || trade.side === sideFilter;

            return matchesSearch && matchesSide;
        })
        ?.sort((a: Trade, b: Trade) => {
            let comparison = 0;
            if (sortBy === 'date') {
                comparison = new Date(a.executedAt).getTime() - new Date(b.executedAt).getTime();
            } else if (sortBy === 'total') {
                comparison = a.total - b.total;
            } else if (sortBy === 'symbol') {
                comparison = (a.symbol?.symbol || '').localeCompare(b.symbol?.symbol || '');
            }
            return sortOrder === 'asc' ? comparison : -comparison;
        });

    // Export to CSV
    const handleExport = () => {
        if (!filteredTrades?.length) return;

        const headers = ['Date', 'Symbol', 'Company', 'Side', 'Quantity', 'Price', 'Total', 'Commission'];
        const rows = filteredTrades.map((trade: Trade) => [
            formatDate(trade.executedAt),
            trade.symbol?.symbol || '-',
            trade.symbol?.companyName || '-',
            trade.side.toUpperCase(),
            trade.quantity,
            trade.price,
            trade.total,
            trade.commission,
        ]);

        const csv = [headers.join(','), ...rows.map((row: any) => row.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `trade-history-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

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
                        <History className="h-6 w-6" />
                        Trade History
                    </h1>
                    <p className="text-muted-foreground">View all your past trades</p>
                </div>
                <button
                    onClick={handleExport}
                    disabled={!filteredTrades?.length}
                    className="btn-secondary flex items-center gap-2"
                >
                    <Download className="h-4 w-4" />
                    Export CSV
                </button>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="card">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/20 rounded-lg">
                            <History className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Total Trades</p>
                            <p className="text-xl font-bold">{formatNumber(stats.totalTrades)}</p>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                            <DollarSign className="h-5 w-5 text-blue-500" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Total Volume</p>
                            <p className="text-xl font-bold">{formatCurrency(stats.totalVolume)}</p>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-500/20 rounded-lg">
                            <TrendingUp className="h-5 w-5 text-green-500" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Buy Orders</p>
                            <p className="text-xl font-bold text-green-500">{formatNumber(stats.buyCount)}</p>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-500/20 rounded-lg">
                            <TrendingDown className="h-5 w-5 text-red-500" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Sell Orders</p>
                            <p className="text-xl font-bold text-red-500">{formatNumber(stats.sellCount)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="card">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search by symbol or company..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="input pl-10 w-full"
                        />
                    </div>

                    {/* Side Filter */}
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <select
                            value={sideFilter}
                            onChange={(e) => setSideFilter(e.target.value as 'all' | 'buy' | 'sell')}
                            className="input"
                        >
                            <option value="all">All Trades</option>
                            <option value="buy">Buy Only</option>
                            <option value="sell">Sell Only</option>
                        </select>
                    </div>

                    {/* Sort */}
                    <div className="flex items-center gap-2">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as 'date' | 'total' | 'symbol')}
                            className="input"
                        >
                            <option value="date">Sort by Date</option>
                            <option value="total">Sort by Total</option>
                            <option value="symbol">Sort by Symbol</option>
                        </select>
                        <button
                            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                            className="btn-secondary px-3"
                        >
                            {sortOrder === 'asc' ? '↑' : '↓'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Trade List */}
            <div className="card">
                {filteredTrades && filteredTrades.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-sm text-muted-foreground border-b border-border">
                                    <th className="text-left py-3 px-4">Date</th>
                                    <th className="text-left py-3 px-4">Symbol</th>
                                    <th className="text-center py-3 px-4">Side</th>
                                    <th className="text-right py-3 px-4">Quantity</th>
                                    <th className="text-right py-3 px-4">Price</th>
                                    <th className="text-right py-3 px-4">Total</th>
                                    <th className="text-right py-3 px-4">Commission</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTrades.map((trade: Trade) => (
                                    <tr
                                        key={trade.id}
                                        className="border-b border-border hover:bg-secondary/30 transition-colors"
                                    >
                                        <td className="py-4 px-4">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm">{formatDate(trade.executedAt)}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <div>
                                                <p className="font-medium">{trade.symbol?.symbol || '-'}</p>
                                                <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                                    {trade.symbol?.companyName || '-'}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 text-center">
                                            <span
                                                className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${trade.side === 'buy'
                                                        ? 'bg-green-500/20 text-green-500'
                                                        : 'bg-red-500/20 text-red-500'
                                                    }`}
                                            >
                                                {trade.side === 'buy' ? (
                                                    <ArrowUpRight className="h-3 w-3" />
                                                ) : (
                                                    <ArrowDownRight className="h-3 w-3" />
                                                )}
                                                {trade.side.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 text-right font-mono">
                                            {formatNumber(trade.quantity)}
                                        </td>
                                        <td className="py-4 px-4 text-right font-mono">
                                            {formatCurrency(trade.price)}
                                        </td>
                                        <td className="py-4 px-4 text-right font-mono font-medium">
                                            {formatCurrency(trade.total)}
                                        </td>
                                        <td className="py-4 px-4 text-right font-mono text-muted-foreground">
                                            {formatCurrency(trade.commission)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-12 text-muted-foreground">
                        <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg">No trades yet</p>
                        <p className="text-sm">Start trading to see your history here</p>
                    </div>
                )}
            </div>

            {/* Summary */}
            {filteredTrades && filteredTrades.length > 0 && (
                <div className="card bg-secondary/30">
                    <div className="flex flex-wrap gap-6 justify-between text-sm">
                        <div>
                            <span className="text-muted-foreground">Showing: </span>
                            <span className="font-medium">{filteredTrades.length} trades</span>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Total Buy Volume: </span>
                            <span className="font-medium text-green-500">{formatCurrency(stats.buyVolume)}</span>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Total Sell Volume: </span>
                            <span className="font-medium text-red-500">{formatCurrency(stats.sellVolume)}</span>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Total Commission Paid: </span>
                            <span className="font-medium">{formatCurrency(stats.totalCommission)}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
