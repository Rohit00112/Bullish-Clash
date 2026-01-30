import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, TrendingUp, TrendingDown, DollarSign, Wallet, History, AlertCircle } from 'lucide-react';
import { biddingApi, symbolsApi, portfolioApi } from '@/lib/api';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface Symbol {
    id: string;
    symbol: string;
    companyName: string;
    sector: string;
    isActive: boolean;
    listedShares?: number;
    availableShares?: number;
}

export function BiddingPanel() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [selectedSymbol, setSelectedSymbol] = useState<Symbol | null>(null);
    const [bidQuantity, setBidQuantity] = useState('');
    const [bidPrice, setBidPrice] = useState('');

    // Fetch Symbols (IPO stocks)
    const { data: symbolsData, isLoading: symbolsLoading } = useQuery({
        queryKey: ['symbols'],
        queryFn: async () => {
            const res = await symbolsApi.getAll();
            return res.data;
        },
    });

    // Fetch User Portfolio (for Cash Balance)
    const { data: portfolio } = useQuery({
        queryKey: ['portfolio'],
        queryFn: async () => {
            const res = await portfolioApi.get();
            return res.data;
        },
    });

    // Fetch My Bids
    const { data: myBids, isLoading: bidsLoading } = useQuery({
        queryKey: ['my-bids'],
        queryFn: async () => {
            const res = await biddingApi.getMyBids();
            return res.data;
        },
        refetchInterval: 5000,
    });

    // Place Bid Mutation
    const placeBidMutation = useMutation({
        mutationFn: async (data: { symbolId: string; quantity: number; price: number }) => {
            await biddingApi.placeBid(data);
        },
        onSuccess: () => {
            toast({
                title: 'Bid Placed',
                description: `Successfully placed bid for ${selectedSymbol?.symbol}`,
            });
            setBidQuantity('');
            setBidPrice('');
            queryClient.invalidateQueries({ queryKey: ['my-bids'] });
            queryClient.invalidateQueries({ queryKey: ['portfolio'] });
        },
        onError: (error: any) => {
            toast({
                title: 'Bid Failed',
                description: error.response?.data?.message || 'Failed to place bid',
                variant: 'destructive',
            });
        },
    });

    const handlePlaceBid = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSymbol || !bidQuantity || !bidPrice) return;

        placeBidMutation.mutate({
            symbolId: selectedSymbol.id,
            quantity: parseInt(bidQuantity),
            price: parseFloat(bidPrice),
        });
    };

    const totalCost = (parseInt(bidQuantity) || 0) * (parseFloat(bidPrice) || 0);

    if (symbolsLoading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-muted-foreground" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="card border-blue-500/20 bg-blue-500/5">
                <div className="flex items-start gap-4">
                    <AlertCircle className="h-6 w-6 text-blue-500 mt-1" />
                    <div>
                        <h2 className="text-xl font-bold text-blue-500">IPO Bidding Phase</h2>
                        <p className="text-muted-foreground mt-1">
                            The competition is currently in the bidding phase. You can place bids for stocks before trading begins.
                            Successful bids will be allocated to your portfolio when trading starts.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Symbol List */}
                <div className="lg:col-span-2 card">
                    <h3 className="font-semibold mb-4 text-lg">Available Symbols</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-secondary/50 text-muted-foreground">
                                <tr>
                                    <th className="p-3">Symbol</th>
                                    <th className="p-3">Company</th>
                                    <th className="p-3">Sector</th>
                                    <th className="p-3 text-right">Available Qty</th>
                                    <th className="p-3 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {symbolsData?.filter((s: Symbol) => s.isActive).map((symbol: Symbol) => (
                                    <tr
                                        key={symbol.id}
                                        className={`hover:bg-secondary/20 transition-colors ${selectedSymbol?.id === symbol.id ? 'bg-primary/5' : ''}`}
                                        onClick={() => setSelectedSymbol(symbol)}
                                    >
                                        <td className="p-3 font-semibold text-primary cursor-pointer">{symbol.symbol}</td>
                                        <td className="p-3 text-muted-foreground">{symbol.companyName}</td>
                                        <td className="p-3 text-muted-foreground">{symbol.sector}</td>
                                        <td className="p-3 text-right font-mono">
                                            {symbol.availableShares !== undefined ? formatNumber(symbol.availableShares) : symbol.listedShares ? formatNumber(symbol.listedShares) : '-'}
                                        </td>
                                        <td className="p-3 text-right">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedSymbol(symbol);
                                                }}
                                                className="btn-secondary text-xs py-1 px-3"
                                            >
                                                Bid
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Place Bid Form */}
                <div className="space-y-6">
                    <div className="card">
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-primary" />
                            Place Bid
                        </h3>

                        {selectedSymbol ? (
                            <form onSubmit={handlePlaceBid} className="space-y-4">
                                <div className="bg-secondary/30 p-3 rounded-lg">
                                    <p className="font-bold text-lg">{selectedSymbol.symbol}</p>
                                    <p className="text-sm text-muted-foreground">{selectedSymbol.companyName}</p>
                                </div>

                                <div>
                                    <label className="label">Quantity</label>
                                    <input
                                        type="number"
                                        min="10"
                                        placeholder="Min 10"
                                        className="input w-full"
                                        value={bidQuantity}
                                        onChange={(e) => setBidQuantity(e.target.value)}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="label">Bid Price</label>
                                    <input
                                        type="number"
                                        min="1"
                                        step="0.01"
                                        placeholder="Price per share"
                                        className="input w-full"
                                        value={bidPrice}
                                        onChange={(e) => setBidPrice(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="bg-secondary/20 p-3 rounded-lg space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Cash Available:</span>
                                        <span className="font-medium">{formatCurrency(portfolio?.cash || 0)}</span>
                                    </div>
                                    <div className="flex justify-between border-t border-border pt-2">
                                        <span className="text-muted-foreground">Total Cost:</span>
                                        <span className="font-bold text-primary">{formatCurrency(totalCost)}</span>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="btn-primary w-full"
                                    disabled={placeBidMutation.isPending || totalCost > (parseFloat(portfolio?.cash) || 0) || totalCost === 0}
                                >
                                    {placeBidMutation.isPending ? <Loader2 className="animate-spin h-4 w-4 mx-auto" /> : 'Submit Bid'}
                                </button>
                            </form>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground bg-secondary/10 rounded-lg border border-dashed border-border">
                                <p>Select a symbol to place a bid</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* My Bids */}
            <div className="card">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <History className="h-5 w-5 text-primary" />
                    My Bids History
                </h3>

                {bidsLoading ? (
                    <div className="flex justify-center py-4"><Loader2 className="animate-spin text-muted-foreground" /></div>
                ) : myBids?.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-secondary/50 text-muted-foreground">
                                <tr>
                                    <th className="p-3">Time</th>
                                    <th className="p-3">Symbol</th>
                                    <th className="p-3">Type</th>
                                    <th className="p-3 text-right">Quantity</th>
                                    <th className="p-3 text-right">Price</th>
                                    <th className="p-3 text-right">Total</th>
                                    <th className="p-3 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {myBids.map((bid: any) => (
                                    <tr key={bid.id} className="hover:bg-secondary/10">
                                        <td className="p-3 text-muted-foreground">{new Date(bid.createdAt).toLocaleTimeString()}</td>
                                        <td className="p-3 font-medium">{bid.symbolSymbol || 'UNKNOWN'}</td>
                                        <td className="p-3"><span className="badge bg-blue-500/20 text-blue-500">IPO Bid</span></td>
                                        <td className="p-3 text-right">{formatNumber(bid.quantity)}</td>
                                        <td className="p-3 text-right">{formatCurrency(bid.price)}</td>
                                        <td className="p-3 text-right font-mono">{formatCurrency(bid.price * bid.quantity)}</td>
                                        <td className="p-3 text-center">
                                            <span className={`px-2 py-1 rounded text-xs font-medium 
                                                ${bid.status === 'processed' ? 'bg-green-500/20 text-green-500' :
                                                    bid.status === 'rejected' ? 'bg-red-500/20 text-red-500' :
                                                        'bg-yellow-500/20 text-yellow-500'}`}
                                            >
                                                {bid.status.toUpperCase()}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-center text-muted-foreground py-8">No bids placed yet.</p>
                )}
            </div>
        </div>
    );
}
