'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    BarChart3,
    Plus,
    Edit2,
    Trash2,
    Check,
    X,
    Loader2,
    Search,
    Building2,
} from 'lucide-react';
import { symbolsApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface Symbol {
    id: string;
    symbol: string;
    companyName: string;
    sector: string;
    basePrice: number;
    currentPrice: number;
    isActive: boolean;
    createdAt: string;
}

const SECTORS = [
    'Commercial Banks',
    'Development Banks',
    'Finance',
    'Microfinance',
    'Life Insurance',
    'Non-Life Insurance',
    'Hydropower',
    'Manufacturing',
    'Hotels & Tourism',
    'Others',
];

export default function AdminSymbolsPage() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    // State
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSymbol, setEditingSymbol] = useState<Symbol | null>(null);

    // Form state
    const [symbolCode, setSymbolCode] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [sector, setSector] = useState('');
    const [basePrice, setBasePrice] = useState('');

    // Fetch symbols
    const { data: symbols, isLoading } = useQuery({
        queryKey: ['admin-symbols'],
        queryFn: async () => {
            const res = await symbolsApi.getAll();
            return res.data;
        },
    });

    // Create symbol mutation
    const createSymbolMutation = useMutation({
        mutationFn: async (data: { symbol: string; companyName: string; sector: string; basePrice: number }) => {
            const res = await symbolsApi.create(data);
            return res.data;
        },
        onSuccess: () => {
            toast({ title: 'Symbol Created' });
            queryClient.invalidateQueries({ queryKey: ['admin-symbols'] });
            closeModal();
        },
        onError: (error: any) => {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to create symbol',
                variant: 'destructive',
            });
        },
    });

    // Update symbol mutation
    const updateSymbolMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<Symbol> }) => {
            const res = await symbolsApi.update(id, data);
            return res.data;
        },
        onSuccess: () => {
            toast({ title: 'Symbol Updated' });
            queryClient.invalidateQueries({ queryKey: ['admin-symbols'] });
            closeModal();
        },
        onError: (error: any) => {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to update symbol',
                variant: 'destructive',
            });
        },
    });

    // Toggle active mutation
    const toggleActiveMutation = useMutation({
        mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
            const res = await symbolsApi.update(id, { isActive });
            return res.data;
        },
        onSuccess: (_, variables) => {
            toast({ title: variables.isActive ? 'Symbol Activated' : 'Symbol Deactivated' });
            queryClient.invalidateQueries({ queryKey: ['admin-symbols'] });
        },
    });

    // Delete symbol mutation
    const deleteSymbolMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await symbolsApi.delete(id);
            return res.data;
        },
        onSuccess: () => {
            toast({ title: 'Symbol Deleted' });
            queryClient.invalidateQueries({ queryKey: ['admin-symbols'] });
        },
    });

    // Open modal for new symbol
    const openNewModal = () => {
        setEditingSymbol(null);
        setSymbolCode('');
        setCompanyName('');
        setSector('');
        setBasePrice('');
        setIsModalOpen(true);
    };

    // Open modal for editing
    const openEditModal = (symbol: Symbol) => {
        setEditingSymbol(symbol);
        setSymbolCode(symbol.symbol);
        setCompanyName(symbol.companyName);
        setSector(symbol.sector);
        setBasePrice(symbol.basePrice.toString());
        setIsModalOpen(true);
    };

    // Close modal
    const closeModal = () => {
        setIsModalOpen(false);
        setEditingSymbol(null);
    };

    // Handle form submit
    const handleSubmit = () => {
        if (!symbolCode || !companyName || !sector || !basePrice) {
            toast({ title: 'Please fill in all fields', variant: 'destructive' });
            return;
        }

        if (editingSymbol) {
            updateSymbolMutation.mutate({
                id: editingSymbol.id,
                data: {
                    symbol: symbolCode.toUpperCase(),
                    companyName,
                    sector,
                    basePrice: parseFloat(basePrice),
                },
            });
        } else {
            createSymbolMutation.mutate({
                symbol: symbolCode.toUpperCase(),
                companyName,
                sector,
                basePrice: parseFloat(basePrice),
            });
        }
    };

    // Filter symbols
    const filteredSymbols = symbols?.filter((s: Symbol) => {
        const query = searchQuery.toLowerCase();
        return (
            s.symbol.toLowerCase().includes(query) ||
            s.companyName.toLowerCase().includes(query) ||
            s.sector.toLowerCase().includes(query)
        );
    });

    // Group by sector
    const symbolsBySector = filteredSymbols?.reduce((acc: Record<string, Symbol[]>, symbol: Symbol) => {
        if (!acc[symbol.sector]) {
            acc[symbol.sector] = [];
        }
        acc[symbol.sector].push(symbol);
        return acc;
    }, {});

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <BarChart3 className="h-6 w-6" />
                        Manage Symbols
                    </h1>
                    <p className="text-muted-foreground">Add and manage NEPSE listed companies</p>
                </div>
                <button onClick={openNewModal} className="btn-primary flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add Symbol
                </button>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="Search symbols..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input pl-10 w-full"
                />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="card">
                    <p className="text-sm text-muted-foreground">Total Symbols</p>
                    <p className="text-2xl font-bold">{symbols?.length || 0}</p>
                </div>
                <div className="card">
                    <p className="text-sm text-muted-foreground">Active</p>
                    <p className="text-2xl font-bold text-green-500">
                        {symbols?.filter((s: Symbol) => s.isActive).length || 0}
                    </p>
                </div>
                <div className="card">
                    <p className="text-sm text-muted-foreground">Inactive</p>
                    <p className="text-2xl font-bold text-red-500">
                        {symbols?.filter((s: Symbol) => !s.isActive).length || 0}
                    </p>
                </div>
            </div>

            {/* Symbols by Sector */}
            {symbolsBySector && Object.keys(symbolsBySector).length > 0 ? (
                Object.entries(symbolsBySector).map(([sector, sectorSymbols]) => (
                    <div key={sector} className="card">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-muted-foreground" />
                            {sector}
                            <span className="text-sm text-muted-foreground font-normal">
                                ({(sectorSymbols as Symbol[]).length})
                            </span>
                        </h3>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-sm text-muted-foreground border-b border-border">
                                        <th className="text-left py-2 px-4">Ticker</th>
                                        <th className="text-left py-2 px-4">Name</th>
                                        <th className="text-right py-2 px-4">Base Price</th>
                                        <th className="text-right py-2 px-4">Current Price</th>
                                        <th className="text-center py-2 px-4">Status</th>
                                        <th className="text-right py-2 px-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(sectorSymbols as Symbol[]).map((symbol) => (
                                        <tr
                                            key={symbol.id}
                                            className="border-b border-border hover:bg-secondary/30"
                                        >
                                            <td className="py-3 px-4 font-medium">{symbol.symbol}</td>
                                            <td className="py-3 px-4 text-muted-foreground">{symbol.companyName}</td>
                                            <td className="py-3 px-4 text-right font-mono">
                                                {formatCurrency(symbol.basePrice)}
                                            </td>
                                            <td className="py-3 px-4 text-right font-mono">
                                                {formatCurrency(symbol.currentPrice)}
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <button
                                                    onClick={() =>
                                                        toggleActiveMutation.mutate({
                                                            id: symbol.id,
                                                            isActive: !symbol.isActive,
                                                        })
                                                    }
                                                    className={`px-2 py-1 rounded text-xs font-medium ${symbol.isActive
                                                        ? 'bg-green-500/20 text-green-500'
                                                        : 'bg-red-500/20 text-red-500'
                                                        }`}
                                                >
                                                    {symbol.isActive ? 'Active' : 'Inactive'}
                                                </button>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => openEditModal(symbol)}
                                                        className="p-1 hover:bg-secondary rounded"
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            if (confirm(`Delete ${symbol.symbol}?`)) {
                                                                deleteSymbolMutation.mutate(symbol.id);
                                                            }
                                                        }}
                                                        className="p-1 hover:bg-red-500/20 rounded text-red-500"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))
            ) : (
                <div className="card text-center py-12 text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">No symbols found</p>
                    <p className="text-sm">Add your first stock symbol to get started</p>
                </div>
            )}

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-card border border-border rounded-xl max-w-md w-full">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold">
                                    {editingSymbol ? 'Edit Symbol' : 'Add Symbol'}
                                </h2>
                                <button onClick={closeModal} className="p-2 hover:bg-secondary rounded-lg">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="label">Ticker Symbol *</label>
                                    <input
                                        type="text"
                                        value={symbolCode}
                                        onChange={(e) => setSymbolCode(e.target.value.toUpperCase())}
                                        placeholder="e.g., NABIL"
                                        className="input w-full"
                                        maxLength={10}
                                    />
                                </div>

                                <div>
                                    <label className="label">Company Name *</label>
                                    <input
                                        type="text"
                                        value={companyName}
                                        onChange={(e) => setCompanyName(e.target.value)}
                                        placeholder="e.g., Nabil Bank Limited"
                                        className="input w-full"
                                    />
                                </div>

                                <div>
                                    <label className="label">Sector *</label>
                                    <select
                                        value={sector}
                                        onChange={(e) => setSector(e.target.value)}
                                        className="input w-full"
                                    >
                                        <option value="">Select sector...</option>
                                        {SECTORS.map((s) => (
                                            <option key={s} value={s}>
                                                {s}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="label">Base Price (Rs.) *</label>
                                    <input
                                        type="number"
                                        value={basePrice}
                                        onChange={(e) => setBasePrice(e.target.value)}
                                        placeholder="e.g., 1200"
                                        className="input w-full"
                                        min="0"
                                        step="0.01"
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button onClick={closeModal} className="btn-secondary flex-1">
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSubmit}
                                        disabled={createSymbolMutation.isPending || updateSymbolMutation.isPending}
                                        className="btn-primary flex-1 flex items-center justify-center gap-2"
                                    >
                                        {(createSymbolMutation.isPending || updateSymbolMutation.isPending) ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : editingSymbol ? (
                                            <Check className="h-4 w-4" />
                                        ) : (
                                            <Plus className="h-4 w-4" />
                                        )}
                                        {editingSymbol ? 'Update' : 'Add Symbol'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
