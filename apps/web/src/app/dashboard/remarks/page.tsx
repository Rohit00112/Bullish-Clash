'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Loader2, MessageSquare, AlertCircle, TrendingUp, CheckCircle, ShieldAlert, Trophy, Edit2, Save, X, Star } from 'lucide-react';
import { remarksApi, tradingApi, competitionApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export default function RemarksPage() {
    const { toast } = useToast();
    const router = useRouter();
    const [selectedTrade, setSelectedTrade] = useState<any>(null);
    const [justification, setJustification] = useState('');
    const [riskAssessment, setRiskAssessment] = useState('');
    const [strategy, setStrategy] = useState('');

    // State for editing existing remarks
    const [editingRemarkId, setEditingRemarkId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');

    // Fetch active competition to check status
    const { data: competition, isLoading: competitionLoading } = useQuery({
        queryKey: ['competition-active'],
        queryFn: async () => {
            const res = await competitionApi.getActive();
            return res.data;
        },
    });

    // Fetch user trades for the session
    const { data: trades, isLoading: tradesLoading } = useQuery({
        queryKey: ['my-trades'],
        queryFn: async () => {
            const res = await tradingApi.getTrades({ limit: 50 });
            return res.data;
        },
        enabled: !!competition
    });

    // Fetch my existing remarks
    const { data: myRemarks, isLoading: remarksLoading, refetch: refetchRemarks } = useQuery({
        queryKey: ['my-remarks'],
        queryFn: async () => {
            const res = await remarksApi.getMyRemarks();
            return res.data;
        },
        enabled: !!competition
    });

    const createRemarkMutation = useMutation({
        mutationFn: async (data: any) => {
            return remarksApi.create(data);
        },
        onSuccess: () => {
            toast({ title: 'Remark Submitted', description: 'Your input has been recorded.' });
            setJustification('');
            setSelectedTrade(null);
            refetchRemarks();
        },
        onError: (err: any) => {
            toast({
                title: 'Submission Failed',
                description: err.response?.data?.message || 'Failed to submit remark',
                variant: 'destructive'
            });
        }
    });

    const updateRemarkMutation = useMutation({
        mutationFn: async ({ id, content }: { id: string; content: string }) => {
            return remarksApi.update(id, content);
        },
        onSuccess: () => {
            toast({ title: 'Remark Updated', description: 'Your changes have been saved.' });
            setEditingRemarkId(null);
            refetchRemarks();
        },
        onError: (err: any) => {
            toast({
                title: 'Update Failed',
                description: err.response?.data?.message || 'Failed to update remark',
                variant: 'destructive'
            });
        }
    });

    const startEditing = (remark: any) => {
        setEditingRemarkId(remark.id);
        setEditContent(remark.content);
    };

    const cancelEdit = () => {
        setEditingRemarkId(null);
        setEditContent('');
    };

    const saveEdit = () => {
        if (!editingRemarkId || !editContent) return;
        updateRemarkMutation.mutate({ id: editingRemarkId, content: editContent });
    };

    const handleTradeJustification = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTrade || !justification) return;

        createRemarkMutation.mutate({
            type: 'trade_justification',
            content: justification,
            symbolId: selectedTrade.symbolId,
            title: `Justification for ${selectedTrade.side.toUpperCase()} ${selectedTrade.symbol}`
        });
    };

    const handleGeneralRemark = (type: 'strategy' | 'risk_assessment', content: string) => {
        if (!content) return;
        createRemarkMutation.mutate({
            type,
            content,
            title: type === 'strategy' ? 'Trading Strategy' : 'Risk Assessment'
        });
        if (type === 'strategy') setStrategy('');
        if (type === 'risk_assessment') setRiskAssessment('');
    };

    if (competitionLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    if (competition?.status !== 'remarks') {
        return (
            <div className="flex flex-col items-center justify-center p-8 space-y-4">
                <AlertCircle className="h-12 w-12 text-yellow-500" />
                <h2 className="text-xl font-semibold">Remarks Phase Not Active</h2>
                <p className="text-muted-foreground text-center max-w-md">
                    The competition is currently in <strong>{competition?.status || 'unknown'}</strong> phase.
                    Remarks can only be submitted during the designated Remarks phase after trading ends.
                </p>
                <button onClick={() => router.push('/dashboard')} className="btn-primary">
                    Go to Dashboard
                </button>
            </div>
        );
    }

    const hasRemark = (symbolId: string) => {
        return myRemarks?.some((r: any) => r.symbolId === symbolId && r.type === 'trade_justification');
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto p-4 md:p-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600/20 via-blue-600/20 to-primary/20 p-8 border border-white/10">
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Trade Remarks & Analysis</h1>
                        <p className="text-muted-foreground mt-1">Provide justifications for your trades and share your strategy.</p>
                    </div>

                    {competition?.status === 'remarks' && (
                        <div className="bg-primary/10 text-primary px-4 py-2 rounded-lg text-sm font-medium border border-primary/20 flex items-center gap-2 animate-pulse">
                            <MessageSquare className="h-4 w-4" />
                            Remarks Phase Active
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Trades to Justify */}
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-blue-500" />
                        Your Trades today
                    </h2>

                    <div className="space-y-4">
                        {tradesLoading ? (
                            <div className="flex justify-center p-12">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : trades?.length > 0 ? (
                            trades.map((trade: any) => (
                                <div key={trade.id}>
                                    <div
                                        className={`
                                            group relative overflow-hidden rounded-xl border transition-all duration-300
                                            ${selectedTrade?.id === trade.id ? 'border-primary shadow-lg bg-secondary/30' : 'bg-card border-white/5 hover:border-white/10 hover:bg-secondary/10'}
                                        `}
                                    >
                                        <div
                                            onClick={() => setSelectedTrade(selectedTrade?.id === trade.id ? null : trade)}
                                            className="p-5 flex items-center justify-between cursor-pointer"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`
                                                    w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg
                                                    ${trade.side === 'buy' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}
                                                `}>
                                                    {trade.symbol?.charAt(0)}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-base">{trade.symbol}</h3>
                                                    <p className="text-xs text-muted-foreground">{trade.side.toUpperCase()} ORDER</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-mono font-medium">{formatCurrency(trade.price)}</p>
                                                <p className="text-xs text-muted-foreground">{formatNumber(trade.quantity)} shares</p>
                                            </div>
                                        </div>

                                        {hasRemark(trade.symbolId) && (
                                            <div className="mt-2 py-1 px-2.5 bg-green-500/10 text-green-500 text-xs rounded-md inline-flex items-center gap-1.5 font-medium border border-green-500/10 absolute top-4 right-1/2 translate-x-1/2 md:translate-x-0 md:static md:ml-20 md:mt-0 lg:absolute lg:top-5 lg:right-[30%] xl:right-[25%] pointer-events-none">
                                                <CheckCircle className="h-3 w-3" /> Justification Submitted
                                            </div>
                                        )}
                                    </div>

                                    {selectedTrade?.id === trade.id && (
                                        <div className="mt-3 mb-4 pl-4 border-l-2 border-primary/20 ml-4 animate-in slide-in-from-top-2 fade-in duration-300">
                                            <form onSubmit={handleTradeJustification} className="bg-secondary/10 rounded-r-xl rounded-bl-xl p-5 border border-white/5 relative">
                                                <h4 className="text-sm font-medium text-primary mb-3 flex items-center gap-2">
                                                    <MessageSquare className="h-4 w-4" />
                                                    Why did you take this {trade.side.toUpperCase()} position?
                                                </h4>
                                                <textarea
                                                    className="textarea w-full h-32 bg-background/50 border-white/20 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 resize-none text-base p-4 rounded-lg transition-all shadow-sm"
                                                    placeholder="Discuss your analysis, market signals, or strategy..."
                                                    value={justification}
                                                    onChange={(e) => setJustification(e.target.value)}
                                                    required
                                                    autoFocus
                                                />
                                                <div className="flex justify-end mt-3 gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedTrade(null)}
                                                        className="btn-ghost text-xs"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        type="submit"
                                                        className="btn-primary py-1.5 px-4 text-sm shadow-lg shadow-primary/20"
                                                        disabled={createRemarkMutation.isPending}
                                                    >
                                                        {createRemarkMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : null}
                                                        Submit Justification
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground bg-secondary/10 rounded-xl border border-dashed border-white/10">
                                <div className="bg-secondary/30 p-4 rounded-full mb-4">
                                    <TrendingUp className="h-8 w-8 opacity-50" />
                                </div>
                                <p className="text-lg font-medium">No active trades found</p>
                                <p className="text-sm">Trades made during the session will appear here.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Submitted Remarks & Strategy */}
                <div className="space-y-6">
                    <div className="card bg-secondary/5 border-white/5 overflow-hidden">
                        <div className="p-4 border-b border-white/5 bg-secondary/10 flex justify-between items-center">
                            <h2 className="font-semibold flex items-center gap-2">
                                <ShieldAlert className="h-5 w-5 text-purple-500" />
                                Your Submissions
                            </h2>
                            <span className="text-xs bg-background/50 px-2 py-1 rounded-full border border-white/5">{myRemarks?.length || 0}</span>
                        </div>

                        <div className="max-h-[400px] overflow-y-auto p-2 space-y-2 custom-scrollbar">
                            {remarksLoading ? (
                                <div className="flex justify-center p-4">
                                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                </div>
                            ) : myRemarks?.length > 0 ? (
                                myRemarks.map((remark: any) => (
                                    <div key={remark.id} className="p-3 rounded-lg bg-background/50 border border-white/5 text-sm hover:border-white/10 transition-colors group">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                {remark.type === 'trade_justification' ? (
                                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                                ) : (
                                                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                                                )}
                                                <span className="font-medium text-xs uppercase tracking-wide opacity-70">
                                                    {remark.title || remark.type.replace('_', ' ')}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] text-muted-foreground">
                                                    {new Date(remark.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                {editingRemarkId !== remark.id && (
                                                    <button
                                                        onClick={() => startEditing(remark)}
                                                        className="text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                                                        title="Edit Remark"
                                                    >
                                                        <Edit2 className="h-3 w-3" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {editingRemarkId === remark.id ? (
                                            <div className="space-y-2 animate-in fade-in duration-200">
                                                <textarea
                                                    className="w-full h-20 bg-background border border-primary/50 rounded p-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                                    value={editContent}
                                                    onChange={(e) => setEditContent(e.target.value)}
                                                    autoFocus
                                                />
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={cancelEdit} className="p-1 text-muted-foreground hover:text-destructive transition-colors">
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                    <button onClick={saveEdit} className="p-1 text-primary hover:text-primary/80 transition-colors" disabled={updateRemarkMutation.isPending}>
                                                        {updateRemarkMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <p className="text-muted-foreground line-clamp-3 hover:line-clamp-none transition-all cursor-default">
                                                    {remark.content}
                                                </p>
                                                {remark.score !== null && (
                                                    <div className="pt-2 mt-2 border-t border-white/5 flex items-center justify-between">
                                                        <div className="flex items-center gap-1.5 text-yellow-500">
                                                            <Star className="h-3 w-3 fill-yellow-500" />
                                                            <span className="text-[10px] font-bold uppercase tracking-wider">Judged Score</span>
                                                        </div>
                                                        <span className="font-mono text-sm text-primary font-bold">{remark.score}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-2 opacity-50 p-8">
                                    <MessageSquare className="h-8 w-8" />
                                    <p className="text-sm">No remarks submitted yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="card border-white/5 bg-secondary/5 backdrop-blur-sm lg:col-span-3">
                    <div className="p-6 border-b border-white/5">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <ShieldAlert className="h-5 w-5 text-purple-400" />
                            Strategy & Risk Assessment
                        </h2>
                    </div>

                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                <h3 className="text-sm font-semibold text-blue-400 flex items-center gap-2 mb-2">
                                    <Trophy className="h-4 w-4" />
                                    Judging & Tie-Breaker Rules
                                </h3>
                                <ul className="space-y-2 text-sm text-foreground/80 list-disc list-inside">
                                    <li>Quality, logic, and clarity of remarks matter.</li>
                                    <li>Judges consider depth of reasoning and market alignment.</li>
                                </ul>
                            </div>

                            <div className="space-y-3">
                                <label className="text-sm font-medium">Trading Strategy Overview</label>
                                <textarea
                                    className="textarea w-full h-32 bg-secondary/10 border-white/10 p-4 rounded-lg"
                                    placeholder="Describe your overall strategy..."
                                    value={strategy}
                                    onChange={(e) => setStrategy(e.target.value)}
                                />
                                <button
                                    onClick={() => handleGeneralRemark('strategy', strategy)}
                                    className="btn-primary w-full"
                                    disabled={!strategy || createRemarkMutation.isPending}
                                >
                                    Submit Strategy
                                </button>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-sm font-medium">Risk Assessment</label>
                                <textarea
                                    className="textarea w-full h-32 bg-secondary/10 border-white/10 p-4 rounded-lg"
                                    placeholder="How did you manage risks?"
                                    value={riskAssessment}
                                    onChange={(e) => setRiskAssessment(e.target.value)}
                                />
                                <button
                                    onClick={() => handleGeneralRemark('risk_assessment', riskAssessment)}
                                    className="btn-secondary w-full"
                                    disabled={!riskAssessment || createRemarkMutation.isPending}
                                >
                                    Submit Risk Assessment
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
