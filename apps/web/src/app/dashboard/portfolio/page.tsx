'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    TrendingUp,
    TrendingDown,
    Wallet,
    PieChart,
    History,
    ArrowUpRight,
    ArrowDownRight,
} from 'lucide-react';
import { portfolioApi, tradingApi } from '@/lib/api';
import { formatCurrency, formatNumber, formatPercent, formatDate, getPriceChangeClass } from '@/lib/utils';

interface Position {
    symbolId: string;
    symbol: string;
    name: string;
    quantity: number;
    avgPrice: number;
    currentPrice: number;
    marketValue: number;
    costBasis: number;
    unrealizedPL: number;
    unrealizedPLPercent: number;
}

interface Trade {
    id: string;
    symbol: string;
    side: 'buy' | 'sell';
    quantity: number;
    price: number;
    total: number;
    commission: number;
    realizedPL: number | null;
    avgCost: number | null;
    executedAt: string;
}

export default function PortfolioPage() {
    const [activeTab, setActiveTab] = useState<'positions' | 'history'>('positions');

    // Fetch portfolio
    const { data: portfolio, isLoading: portfolioLoading } = useQuery({
        queryKey: ['portfolio'],
        queryFn: async () => {
            const res = await portfolioApi.get();
            return res.data;
        },
        refetchInterval: 10000,
    });

    // Fetch trade history
    const { data: trades } = useQuery({
        queryKey: ['trade-history'],
        queryFn: async () => {
            const res = await tradingApi.getTrades({ limit: 100 });
            return res.data;
        },
        refetchInterval: 30000,
    });

    const positions: Position[] = portfolio?.positions || [];
    const tradeHistory: Trade[] = trades || [];

    // Calculate allocation percentages
    const totalEquityValue = positions.reduce((sum, p) => sum + p.marketValue, 0);

    return (
        <div className="space-y-6">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Portfolio Value */}
                <div className="card">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Portfolio Value</span>
                        <Wallet className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-2xl font-bold">{formatCurrency(portfolio?.totalValue || 0)}</p>
                    <div className="flex items-center gap-2 mt-1">
                        {(portfolio?.totalPL || 0) >= 0 ? (
                            <ArrowUpRight className="h-4 w-4 text-green-500" />
                        ) : (
                            <ArrowDownRight className="h-4 w-4 text-red-500" />
                        )}
                        <span className={getPriceChangeClass(portfolio?.totalPL || 0)}>
                            {formatCurrency(Math.abs(portfolio?.totalPL || 0))} ({formatPercent(portfolio?.totalPLPercent || 0)})
                        </span>
                    </div>
                </div>

                {/* Cash Balance */}
                <div className="card">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Cash Balance</span>
                        <PieChart className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-2xl font-bold">{formatCurrency(portfolio?.cash || 0)}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                        {portfolio?.totalValue ? ((portfolio.cash / portfolio.totalValue) * 100).toFixed(1) : 0}% of portfolio
                    </p>
                </div>

                {/* Equity Value */}
                <div className="card">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Equity Value</span>
                        <TrendingUp className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-2xl font-bold">{formatCurrency(totalEquityValue)}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                        {positions.length} position{positions.length !== 1 ? 's' : ''}
                    </p>
                </div>

                {/* Unrealized P/L */}
                <div className="card">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Unrealized P/L</span>
                        {(portfolio?.unrealizedPL || 0) >= 0 ? (
                            <TrendingUp className="h-5 w-5 text-green-500" />
                        ) : (
                            <TrendingDown className="h-5 w-5 text-red-500" />
                        )}
                    </div>
                    <p className={`text-2xl font-bold ${getPriceChangeClass(portfolio?.unrealizedPL || 0)}`}>
                        {formatCurrency(portfolio?.unrealizedPL || 0)}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                        Realized: {formatCurrency(portfolio?.realizedPL || 0)}
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="card">
                <div className="flex border-b border-border mb-4">
                    <button
                        onClick={() => setActiveTab('positions')}
                        className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${activeTab === 'positions'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        Positions ({positions.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${activeTab === 'history'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        Trade History
                    </button>
                </div>

                {/* Positions Tab */}
                {activeTab === 'positions' && (
                    <>
                        {positions.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="text-sm text-muted-foreground border-b border-border">
                                            <th className="text-left py-3 px-4">Symbol</th>
                                            <th className="text-right py-3 px-4">Shares</th>
                                            <th className="text-right py-3 px-4">Avg Cost</th>
                                            <th className="text-right py-3 px-4">Current Price</th>
                                            <th className="text-right py-3 px-4">Market Value</th>
                                            <th className="text-right py-3 px-4">P/L</th>
                                            <th className="text-right py-3 px-4">P/L %</th>
                                            <th className="text-right py-3 px-4">Allocation</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {positions.map((position) => (
                                            <tr
                                                key={position.symbolId}
                                                className="border-b border-border hover:bg-secondary/30 transition-colors"
                                            >
                                                <td className="py-3 px-4">
                                                    <div>
                                                        <p className="font-medium">{position.symbol}</p>
                                                        <p className="text-xs text-muted-foreground">{position.name}</p>
                                                    </div>
                                                </td>
                                                <td className="text-right py-3 px-4 font-mono">
                                                    {formatNumber(position.quantity)}
                                                </td>
                                                <td className="text-right py-3 px-4 font-mono">
                                                    {formatCurrency(position.avgPrice)}
                                                </td>
                                                <td className="text-right py-3 px-4 font-mono">
                                                    {formatCurrency(position.currentPrice)}
                                                </td>
                                                <td className="text-right py-3 px-4 font-mono font-medium">
                                                    {formatCurrency(position.marketValue)}
                                                </td>
                                                <td className={`text-right py-3 px-4 font-mono ${getPriceChangeClass(position.unrealizedPL)}`}>
                                                    {formatCurrency(position.unrealizedPL)}
                                                </td>
                                                <td className={`text-right py-3 px-4 font-mono ${getPriceChangeClass(position.unrealizedPLPercent)}`}>
                                                    <span className="flex items-center justify-end gap-1">
                                                        {position.unrealizedPLPercent >= 0 ? (
                                                            <ArrowUpRight className="h-3 w-3" />
                                                        ) : (
                                                            <ArrowDownRight className="h-3 w-3" />
                                                        )}
                                                        {formatPercent(position.unrealizedPLPercent)}
                                                    </span>
                                                </td>
                                                <td className="text-right py-3 px-4 font-mono text-muted-foreground">
                                                    {totalEquityValue > 0
                                                        ? ((position.marketValue / totalEquityValue) * 100).toFixed(1)
                                                        : 0}%
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="font-medium bg-secondary/30">
                                            <td className="py-3 px-4">Total</td>
                                            <td className="text-right py-3 px-4"></td>
                                            <td className="text-right py-3 px-4"></td>
                                            <td className="text-right py-3 px-4"></td>
                                            <td className="text-right py-3 px-4 font-mono">
                                                {formatCurrency(totalEquityValue)}
                                            </td>
                                            <td className={`text-right py-3 px-4 font-mono ${getPriceChangeClass(portfolio?.unrealizedPL || 0)}`}>
                                                {formatCurrency(portfolio?.unrealizedPL || 0)}
                                            </td>
                                            <td className="text-right py-3 px-4"></td>
                                            <td className="text-right py-3 px-4">100%</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-12 text-muted-foreground">
                                <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>No positions yet</p>
                                <p className="text-sm">Start trading to build your portfolio</p>
                            </div>
                        )}
                    </>
                )}

                {/* Trade History Tab */}
                {activeTab === 'history' && (
                    <>
                        {tradeHistory.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="text-sm text-muted-foreground border-b border-border">
                                            <th className="text-left py-3 px-4">Time</th>
                                            <th className="text-left py-3 px-4">Symbol</th>
                                            <th className="text-center py-3 px-4">Side</th>
                                            <th className="text-right py-3 px-4">Qty</th>
                                            <th className="text-right py-3 px-4">Buy Price</th>
                                            <th className="text-right py-3 px-4">Sell Price</th>
                                            <th className="text-right py-3 px-4">Total</th>
                                            <th className="text-right py-3 px-4">Commission</th>
                                            <th className="text-right py-3 px-4">P/L</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tradeHistory.map((trade) => (
                                            <tr
                                                key={trade.id}
                                                className="border-b border-border hover:bg-secondary/30 transition-colors"
                                            >
                                                <td className="py-3 px-4 text-sm text-muted-foreground">
                                                    {formatDate(trade.executedAt)}
                                                </td>
                                                <td className="py-3 px-4 font-medium">{trade.symbol}</td>
                                                <td className="text-center py-3 px-4">
                                                    <span
                                                        className={`px-2 py-1 rounded text-xs font-medium ${trade.side === 'buy'
                                                            ? 'bg-green-500/20 text-green-500'
                                                            : 'bg-red-500/20 text-red-500'
                                                            }`}
                                                    >
                                                        {trade.side.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="text-right py-3 px-4 font-mono">
                                                    {formatNumber(trade.quantity)}
                                                </td>
                                                <td className="text-right py-3 px-4 font-mono text-green-500">
                                                    {trade.side === 'buy'
                                                        ? formatCurrency(trade.price)
                                                        : trade.avgCost && trade.avgCost > 0
                                                            ? formatCurrency(trade.avgCost)
                                                            : '-'
                                                    }
                                                </td>
                                                <td className="text-right py-3 px-4 font-mono text-red-500">
                                                    {trade.side === 'sell'
                                                        ? formatCurrency(trade.price)
                                                        : '-'
                                                    }
                                                </td>
                                                <td className="text-right py-3 px-4 font-mono font-medium">
                                                    {formatCurrency(trade.total)}
                                                </td>
                                                <td className="text-right py-3 px-4 font-mono text-muted-foreground">
                                                    {formatCurrency(trade.commission)}
                                                </td>
                                                <td className={`text-right py-3 px-4 font-mono font-medium ${trade.realizedPL === null || trade.realizedPL === undefined
                                                    ? 'text-muted-foreground'
                                                    : trade.realizedPL >= 0
                                                        ? 'text-green-500'
                                                        : 'text-red-500'
                                                    }`}>
                                                    {trade.realizedPL === null || trade.realizedPL === undefined
                                                        ? '-'
                                                        : `${trade.realizedPL >= 0 ? '+' : ''}${formatCurrency(trade.realizedPL)}`
                                                    }
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-12 text-muted-foreground">
                                <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>No trades yet</p>
                                <p className="text-sm">Your trade history will appear here</p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
