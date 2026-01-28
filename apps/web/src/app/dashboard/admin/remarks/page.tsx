'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, ArrowLeft, Search, Filter, ShieldAlert, TrendingUp, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { remarksApi, competitionApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import { useToast } from '@/hooks/use-toast';

// Simple inline component for score input
const ScoreInput = ({ remarkId, initialScore, onScore, isPending }: { remarkId: string, initialScore: number | null, onScore: (id: string, s: number) => void, isPending: boolean }) => {
    const [score, setScore] = useState(initialScore?.toString() || '');
    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
        setScore(initialScore?.toString() || '');
        setIsDirty(false);
    }, [initialScore]);

    const handleSave = () => {
        const numScore = parseFloat(score);
        if (!isNaN(numScore) && numScore >= 0 && numScore <= 100) {
            onScore(remarkId, numScore);
            setIsDirty(false);
        }
    };

    return (
        <div className="flex items-center gap-1">
            <input
                type="number"
                min="0"
                max="100"
                className="w-16 h-8 text-sm p-1 rounded border border-input bg-background/50 text-center"
                value={score}
                onChange={(e) => {
                    setScore(e.target.value);
                    setIsDirty(true);
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                placeholder="-"
            />
            {isDirty && (
                <button
                    onClick={handleSave}
                    disabled={isPending}
                    className="p-1.5 bg-primary text-white rounded hover:bg-primary/90 transition-colors"
                >
                    {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                </button>
            )}
        </div>
    );
};

export default function AdminRemarksPage() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('ALL');

    const { data: competition } = useQuery({
        queryKey: ['admin-competition'],
        queryFn: async () => {
            const res = await competitionApi.getStats();
            return res.data;
        },
    });

    const { data: remarks, isLoading } = useQuery({
        queryKey: ['admin-remarks', competition?.competitionId],
        queryFn: async () => {
            if (!competition?.competitionId) return [];
            const res = await remarksApi.getAll(competition.competitionId);
            return res.data;
        },
        enabled: !!competition?.competitionId,
    });

    const scoreMutation = useMutation({
        mutationFn: ({ id, score }: { id: string; score: number }) => remarksApi.scoreRemark(id, score),
        onSuccess: () => {
            toast({
                title: 'Score updated',
                description: 'The remark score has been saved.',
                className: 'toast-success',
            });
            queryClient.invalidateQueries({ queryKey: ['admin-remarks'] });
        },
        onError: () => {
            toast({
                title: 'Error',
                description: 'Failed to update score.',
                className: 'toast-error',
            });
        },
    });

    const filteredRemarks = remarks?.filter((remark: any) => {
        const matchesSearch =
            remark.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            remark.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            remark.symbolSymbol?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesType = filterType === 'ALL' || remark.type === filterType;

        return matchesSearch && matchesType;
    });

    return (
        <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-8 animate-in fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-3">
                    <Link href="/dashboard/admin" className="p-2 hover:bg-secondary/50 rounded-full transition-colors">
                        <ArrowLeft className="h-6 w-6" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <MessageSquare className="h-6 w-6 text-primary" />
                            Review Remarks
                        </h1>
                        <p className="text-muted-foreground">
                            {remarks?.length || 0} submissions for {competition?.name}
                        </p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="card bg-card border border-border space-y-4 md:space-y-0 md:flex items-center justify-between p-4 shadow-sm">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search by user, symbol, or content..."
                        className="input pl-9 w-full bg-background border-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                    <Filter className="h-4 w-4 text-muted-foreground hidden md:block" />
                    <button
                        onClick={() => setFilterType('ALL')}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${filterType === 'ALL' ? 'bg-primary text-white' : 'bg-secondary hover:bg-secondary/80 text-foreground'}`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setFilterType('trade_justification')}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-1 ${filterType === 'trade_justification' ? 'bg-blue-500 text-white' : 'bg-secondary hover:bg-secondary/80 text-foreground'}`}
                    >
                        <TrendingUp className="h-3 w-3" /> Trades
                    </button>
                    <button
                        onClick={() => setFilterType('strategy')}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-1 ${filterType === 'strategy' ? 'bg-purple-500 text-white' : 'bg-secondary hover:bg-secondary/80 text-foreground'}`}
                    >
                        <ShieldAlert className="h-3 w-3" /> Strategy
                    </button>
                    <button
                        onClick={() => setFilterType('risk_assessment')}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-1 ${filterType === 'risk_assessment' ? 'bg-orange-500 text-white' : 'bg-secondary hover:bg-secondary/80 text-foreground'}`}
                    >
                        <ShieldAlert className="h-3 w-3" /> Risk
                    </button>
                </div>
            </div>

            {/* Remarks Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="card h-48 animate-pulse bg-secondary/20"></div>
                    ))}
                </div>
            ) : filteredRemarks?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredRemarks.map((remark: any) => (
                        <div key={remark.id} className="card bg-card border border-border hover:border-primary/30 hover:shadow-sm transition-all flex flex-col h-full">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-2">
                                    <div className={`p-1.5 rounded-lg ${remark.type === 'trade_justification' ? 'bg-blue-500/10 text-blue-500' :
                                        remark.type === 'strategy' ? 'bg-purple-500/10 text-purple-500' :
                                            'bg-orange-500/10 text-orange-500'
                                        }`}>
                                        {remark.type === 'trade_justification' ? <TrendingUp className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-sm">{remark.userName}</span>
                                        <span className="text-[10px] text-muted-foreground">{new Date(remark.createdAt).toLocaleString()}</span>
                                    </div>
                                </div>
                                {remark.symbolSymbol && (
                                    <span className="bg-secondary px-2 py-0.5 rounded text-xs font-mono border border-border">
                                        {remark.symbolSymbol}
                                    </span>
                                )}
                            </div>

                            <div className="flex-1 bg-secondary/30 p-3 rounded-lg border border-border/50 mb-3 text-sm text-foreground/90 whitespace-pre-wrap">
                                {remark.content}
                            </div>

                            <div className="flex justify-between items-center mt-auto pt-3 border-t border-border/50">
                                <span className="text-xs text-muted-foreground uppercase font-medium tracking-wider">
                                    {remark.type.replace('_', ' ')}
                                </span>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-muted-foreground">Score:</span>
                                    <ScoreInput
                                        remarkId={remark.id}
                                        initialScore={remark.score}
                                        onScore={(id, score) => scoreMutation.mutate({ id, score })}
                                        isPending={scoreMutation.isPending}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground bg-secondary/5 rounded-xl border border-dashed border-white/10">
                    <MessageSquare className="h-12 w-12 opacity-20 mb-4" />
                    <p className="text-lg font-medium">No remarks found</p>
                    <p className="text-sm">Try adjusting your filters or search terms.</p>
                </div>
            )}
        </div>
    );
}
