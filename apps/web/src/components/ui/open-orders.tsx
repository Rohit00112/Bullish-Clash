'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tradingApi } from '@/lib/api';
import { formatCurrency, formatNumber, cn } from '@/lib/utils';
import { Loader2, X, Clock, Pencil } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface OpenOrder {
    id: string;
    symbol: string;
    companyName: string;
    side: 'buy' | 'sell';
    type: 'market' | 'limit';
    quantity: number;
    price: number;
    filledQuantity: number;
    remainingQuantity: number;
    status: string;
    createdAt: string;
    expiresAt?: string;
}

export function OpenOrders() {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [editingOrder, setEditingOrder] = useState<OpenOrder | null>(null);
    const [editPrice, setEditPrice] = useState('');
    const [editQuantity, setEditQuantity] = useState('');

    const { data: orders, isLoading } = useQuery({
        queryKey: ['open-orders'],
        queryFn: async () => {
            const res = await tradingApi.getOpenOrders();
            return res.data as OpenOrder[];
        },
        refetchInterval: 5000,
    });

    const cancelMutation = useMutation({
        mutationFn: async (orderId: string) => {
            await tradingApi.cancelOrder(orderId);
        },
        onSuccess: () => {
            toast({
                title: 'Order Cancelled',
                description: 'Your order has been cancelled successfully.',
            });
            queryClient.invalidateQueries({ queryKey: ['open-orders'] });
            queryClient.invalidateQueries({ queryKey: ['portfolio'] });
        },
        onError: (error: any) => {
            toast({
                title: 'Cancel Failed',
                description: error.response?.data?.message || 'Failed to cancel order',
                variant: 'destructive',
            });
        },
    });

    const editMutation = useMutation({
        mutationFn: async ({ orderId, price, quantity }: { orderId: string; price?: number; quantity?: number }) => {
            await tradingApi.editOrder(orderId, { price, quantity });
        },
        onSuccess: () => {
            toast({
                title: 'Order Updated',
                description: 'Your order has been updated successfully.',
            });
            setEditingOrder(null);
            queryClient.invalidateQueries({ queryKey: ['open-orders'] });
            queryClient.invalidateQueries({ queryKey: ['portfolio'] });
            queryClient.invalidateQueries({ queryKey: ['order-book'] });
        },
        onError: (error: any) => {
            toast({
                title: 'Edit Failed',
                description: error.response?.data?.message || 'Failed to edit order',
                variant: 'destructive',
            });
        },
    });

    const openEditModal = (order: OpenOrder) => {
        setEditingOrder(order);
        setEditPrice(order.price.toString());
        setEditQuantity(order.remainingQuantity.toString());
    };

    const handleEditSubmit = () => {
        if (!editingOrder) return;
        const newPrice = parseFloat(editPrice);
        const newQuantity = parseInt(editQuantity);

        const updates: { price?: number; quantity?: number } = {};
        if (newPrice !== editingOrder.price) updates.price = newPrice;
        if (newQuantity !== editingOrder.remainingQuantity) updates.quantity = newQuantity;

        if (Object.keys(updates).length === 0) {
            setEditingOrder(null);
            return;
        }

        editMutation.mutate({ orderId: editingOrder.id, ...updates });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!orders || orders.length === 0) {
        return (
            <div className="text-center py-4 text-sm text-muted-foreground">
                No open orders
            </div>
        );
    }

    const getTimeRemaining = (expiresAt?: string) => {
        if (!expiresAt) return null;
        const remaining = new Date(expiresAt).getTime() - Date.now();
        if (remaining <= 0) return 'Expiring...';
        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    };

    return (
        <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Open Orders</h4>
            {orders.map((order) => {
                const displayPrice = order.price;

                return (
                    <div
                        key={order.id}
                        className="bg-secondary/30 rounded-lg p-3 text-sm"
                    >
                        <div className="flex items-start justify-between mb-2">
                            <div>
                                <span className="font-medium">{order.symbol}</span>
                                <span
                                    className={cn(
                                        'ml-2 px-1.5 py-0.5 rounded text-xs',
                                        order.side === 'buy'
                                            ? 'bg-green-500/20 text-green-500'
                                            : 'bg-red-500/20 text-red-500'
                                    )}
                                >
                                    {order.side.toUpperCase()}
                                </span>
                                <span className="ml-2 px-1.5 py-0.5 rounded text-xs bg-secondary text-muted-foreground">
                                    {order.type.toUpperCase()}
                                </span>
                            </div>
                            <div className="flex items-center gap-1">
                                {order.type === 'limit' && (
                                    <button
                                        onClick={() => openEditModal(order)}
                                        className="p-1 text-muted-foreground hover:text-blue-500 transition-colors"
                                        title="Edit order"
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </button>
                                )}
                                <button
                                    onClick={() => cancelMutation.mutate(order.id)}
                                    disabled={cancelMutation.isPending}
                                    className="p-1 text-muted-foreground hover:text-red-500 transition-colors"
                                    title="Cancel order"
                                >
                                    {cancelMutation.isPending ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <X className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                            <div className="text-muted-foreground">Price</div>
                            <div className="text-right font-mono">{formatCurrency(displayPrice)}</div>

                            <div className="text-muted-foreground">Quantity</div>
                            <div className="text-right font-mono">
                                {order.filledQuantity > 0
                                    ? `${formatNumber(order.filledQuantity)}/${formatNumber(order.quantity)}`
                                    : formatNumber(order.quantity)
                                }
                            </div>

                            <div className="text-muted-foreground">Status</div>
                            <div className="text-right">
                                <span
                                    className={cn(
                                        'px-1.5 py-0.5 rounded text-xs',
                                        order.status === 'open'
                                            ? 'bg-blue-500/20 text-blue-500'
                                            : 'bg-yellow-500/20 text-yellow-500'
                                    )}
                                >
                                    {order.status === 'partial' ? 'PARTIAL' : 'OPEN'}
                                </span>
                            </div>

                            {order.expiresAt && (
                                <>
                                    <div className="text-muted-foreground flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        Expires
                                    </div>
                                    <div className="text-right font-mono text-muted-foreground">
                                        {getTimeRemaining(order.expiresAt)}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                );
            })}

            {/* Edit Modal */}
            {editingOrder && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-background border border-border rounded-lg p-4 w-full max-w-sm mx-4">
                        <h3 className="text-lg font-semibold mb-4">Edit Order</h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span className="font-medium text-foreground">{editingOrder.symbol}</span>
                                <span
                                    className={cn(
                                        'px-1.5 py-0.5 rounded text-xs',
                                        editingOrder.side === 'buy'
                                            ? 'bg-green-500/20 text-green-500'
                                            : 'bg-red-500/20 text-red-500'
                                    )}
                                >
                                    {editingOrder.side.toUpperCase()}
                                </span>
                            </div>

                            <div>
                                <label className="text-sm text-muted-foreground block mb-1">Price (रू)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    value={editPrice}
                                    onChange={(e) => setEditPrice(e.target.value)}
                                    className="w-full bg-secondary border border-border rounded px-3 py-2 text-sm font-mono"
                                />
                            </div>

                            <div>
                                <label className="text-sm text-muted-foreground block mb-1">
                                    Quantity (Remaining: {editingOrder.remainingQuantity})
                                </label>
                                <input
                                    type="number"
                                    step="1"
                                    min="1"
                                    value={editQuantity}
                                    onChange={(e) => setEditQuantity(e.target.value)}
                                    className="w-full bg-secondary border border-border rounded px-3 py-2 text-sm font-mono"
                                />
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => setEditingOrder(null)}
                                    className="flex-1 px-4 py-2 bg-secondary text-foreground rounded hover:bg-secondary/80 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleEditSubmit}
                                    disabled={editMutation.isPending}
                                    className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors disabled:opacity-50"
                                >
                                    {editMutation.isPending ? (
                                        <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                                    ) : (
                                        'Save Changes'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
