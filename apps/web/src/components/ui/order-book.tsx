'use client';

import { useQuery } from '@tanstack/react-query';
import { tradingApi } from '@/lib/api';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface OrderLevel {
    price: number;
    quantity: number;
    orderCount: number;
}

interface OrderBookProps {
    symbolId: string;
    symbol: string;
    onPriceClick?: (price: number) => void;
}

export function OrderBook({ symbolId, symbol, onPriceClick }: OrderBookProps) {
    const { data: orderBook, isLoading } = useQuery({
        queryKey: ['orderbook', symbolId],
        queryFn: async () => {
            const res = await tradingApi.getOrderBook(symbolId);
            return res.data;
        },
        refetchInterval: 2000, // Refresh every 2 seconds
        enabled: !!symbolId,
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const bids: OrderLevel[] = orderBook?.bids || [];
    const asks: OrderLevel[] = orderBook?.asks || [];
    const spread = orderBook?.spread || 0;
    const spreadPercent = orderBook?.spreadPercent || 0;
    const lastPrice = orderBook?.lastPrice || 0;

    // Calculate max quantity for visualization
    const maxBidQty = Math.max(...bids.map(b => b.quantity), 1);
    const maxAskQty = Math.max(...asks.map(a => a.quantity), 1);
    const maxQty = Math.max(maxBidQty, maxAskQty);

    return (
        <div className="bg-secondary/30 rounded-lg overflow-hidden">
            {/* Header */}
            <div className="px-3 py-2 border-b border-border bg-secondary/50">
                <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Order Book</span>
                    <span className="text-xs text-muted-foreground">{symbol}</span>
                </div>
            </div>

            {/* Column Headers */}
            <div className="grid grid-cols-3 gap-2 px-3 py-1.5 text-xs text-muted-foreground border-b border-border">
                <span>Price</span>
                <span className="text-right">Quantity</span>
                <span className="text-right">Orders</span>
            </div>

            {/* Asks (Sell orders) - Show in reverse order (lowest at bottom) */}
            <div className="max-h-40 overflow-y-auto">
                {asks.slice().reverse().map((ask, i) => (
                    <div
                        key={`ask-${i}`}
                        className="grid grid-cols-3 gap-2 px-3 py-1 text-sm relative cursor-pointer hover:bg-red-500/10 transition-colors"
                        onClick={() => onPriceClick?.(ask.price)}
                        title={`Click to set limit price to ${formatCurrency(ask.price)}`}
                    >
                        {/* Background bar */}
                        <div
                            className="absolute right-0 top-0 bottom-0 bg-red-500/10"
                            style={{ width: `${(ask.quantity / maxQty) * 100}%` }}
                        />
                        <span className="text-red-500 font-mono relative z-10">
                            {formatCurrency(ask.price)}
                        </span>
                        <span className="text-right font-mono relative z-10">
                            {formatNumber(ask.quantity)}
                        </span>
                        <span className="text-right text-muted-foreground relative z-10">
                            {ask.orderCount}
                        </span>
                    </div>
                ))}
                {asks.length === 0 && (
                    <div className="text-center py-3 text-xs text-muted-foreground">
                        No sell orders
                    </div>
                )}
            </div>

            {/* Spread Indicator */}
            <div className="px-3 py-2 bg-secondary/50 border-y border-border">
                <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Spread</span>
                    <span className="font-mono">
                        {formatCurrency(spread)} ({spreadPercent.toFixed(2)}%)
                    </span>
                </div>
                {lastPrice > 0 && (
                    <div className="flex justify-between items-center text-xs mt-1">
                        <span className="text-muted-foreground">Last Trade</span>
                        <span className="font-mono font-medium">{formatCurrency(lastPrice)}</span>
                    </div>
                )}
            </div>

            {/* Bids (Buy orders) */}
            <div className="max-h-40 overflow-y-auto">
                {bids.map((bid, i) => (
                    <div
                        key={`bid-${i}`}
                        className="grid grid-cols-3 gap-2 px-3 py-1 text-sm relative cursor-pointer hover:bg-green-500/10 transition-colors"
                        onClick={() => onPriceClick?.(bid.price)}
                        title={`Click to set limit price to ${formatCurrency(bid.price)}`}
                    >
                        {/* Background bar */}
                        <div
                            className="absolute right-0 top-0 bottom-0 bg-green-500/10"
                            style={{ width: `${(bid.quantity / maxQty) * 100}%` }}
                        />
                        <span className="text-green-500 font-mono relative z-10">
                            {formatCurrency(bid.price)}
                        </span>
                        <span className="text-right font-mono relative z-10">
                            {formatNumber(bid.quantity)}
                        </span>
                        <span className="text-right text-muted-foreground relative z-10">
                            {bid.orderCount}
                        </span>
                    </div>
                ))}
                {bids.length === 0 && (
                    <div className="text-center py-3 text-xs text-muted-foreground">
                        No buy orders
                    </div>
                )}
            </div>

            {/* Footer hint */}
            {(bids.length > 0 || asks.length > 0) && (
                <div className="px-3 py-1.5 text-xs text-muted-foreground text-center border-t border-border">
                    Click a price to use it for limit order
                </div>
            )}
        </div>
    );
}
