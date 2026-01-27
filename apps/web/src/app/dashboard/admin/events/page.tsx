'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Calendar,
    Plus,
    Trash2,
    Edit2,
    Send,
    Clock,
    CheckCircle,
    AlertCircle,
    Loader2,
    X,
} from 'lucide-react';
import { eventsApi, symbolsApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface AffectedSymbol {
    symbolId: string;
    ticker: string;
    priceChange: number;
}

interface MarketEvent {
    id: string;
    title: string;
    description: string;
    isExecuted: boolean;
    impactType: 'positive' | 'negative' | 'neutral';
    priceUpdateType: 'percentage' | 'absolute' | 'override';
    magnitude: number;
    affectedSymbols: string[];
    affectAllSymbols: boolean;
    scheduledAt?: string;
    executedAt?: string;
    createdAt: string;
}

export default function AdminEventsPage() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<MarketEvent | null>(null);

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [scheduledAt, setScheduledAt] = useState('');
    const [impactType, setImpactType] = useState<'positive' | 'negative' | 'neutral'>('positive');
    const [priceUpdateType, setPriceUpdateType] = useState<'percentage' | 'absolute' | 'override'>('percentage');
    const [magnitude, setMagnitude] = useState('');
    const [affectedSymbols, setAffectedSymbols] = useState<string[]>([]);
    const [selectedSymbolId, setSelectedSymbolId] = useState('');
    const [affectAllSymbols, setAffectAllSymbols] = useState(false);

    // Fetch events
    const { data: events, isLoading } = useQuery({
        queryKey: ['admin-events'],
        queryFn: async () => {
            const res = await eventsApi.getAll();
            return res.data;
        },
    });

    // Fetch symbols
    const { data: symbols } = useQuery({
        queryKey: ['admin-symbols'],
        queryFn: async () => {
            const res = await symbolsApi.getAll();
            return res.data;
        },
    });

    // Create event mutation
    const createEventMutation = useMutation({
        mutationFn: async (data: {
            title: string;
            description: string;
            impactType: 'positive' | 'negative' | 'neutral';
            priceUpdateType: 'percentage' | 'absolute' | 'override';
            magnitude: number;
            affectedSymbols?: string[];
            affectAllSymbols?: boolean;
            scheduledAt?: string;
        }) => {
            const res = await eventsApi.create(data);
            return res.data;
        },
        onSuccess: () => {
            toast({ title: 'Event Created' });
            queryClient.invalidateQueries({ queryKey: ['admin-events'] });
            closeModal();
        },
        onError: (error: any) => {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to create event',
                variant: 'destructive',
            });
        },
    });

    // Execute event mutation
    const executeEventMutation = useMutation({
        mutationFn: async (eventId: string) => {
            const res = await eventsApi.execute(eventId);
            return res.data;
        },
        onSuccess: () => {
            toast({ title: 'Event Executed', description: 'Prices have been updated' });
            queryClient.invalidateQueries({ queryKey: ['admin-events'] });
            queryClient.invalidateQueries({ queryKey: ['prices'] });
        },
        onError: (error: any) => {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to execute event',
                variant: 'destructive',
            });
        },
    });

    // Delete event mutation
    const deleteEventMutation = useMutation({
        mutationFn: async (eventId: string) => {
            const res = await eventsApi.delete(eventId);
            return res.data;
        },
        onSuccess: () => {
            toast({ title: 'Event Deleted' });
            queryClient.invalidateQueries({ queryKey: ['admin-events'] });
        },
    });

    // Update event mutation
    const updateEventMutation = useMutation({
        mutationFn: async ({ eventId, data }: { eventId: string; data: any }) => {
            const res = await eventsApi.update(eventId, data);
            return res.data;
        },
        onSuccess: () => {
            toast({ title: 'Event Updated' });
            queryClient.invalidateQueries({ queryKey: ['admin-events'] });
            closeModal();
        },
        onError: (error: any) => {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to update event',
                variant: 'destructive',
            });
        },
    });

    // Open modal for new event
    const openNewEventModal = () => {
        setEditingEvent(null);
        setTitle('');
        setDescription('');
        setScheduledAt('');
        setImpactType('positive');
        setPriceUpdateType('percentage');
        setMagnitude('');
        setAffectedSymbols([]);
        setAffectAllSymbols(false);
        setIsModalOpen(true);
    };

    // Open modal for editing existing event
    const openEditEventModal = (event: MarketEvent) => {
        setEditingEvent(event);
        setTitle(event.title);
        setDescription(event.description || '');
        setScheduledAt(event.scheduledAt ? new Date(event.scheduledAt).toISOString().slice(0, 16) : '');
        setImpactType(event.impactType);
        setPriceUpdateType(event.priceUpdateType);
        setMagnitude(event.magnitude.toString());
        setAffectedSymbols(event.affectedSymbols || []);
        setAffectAllSymbols(event.affectAllSymbols);
        setIsModalOpen(true);
    };

    // Close modal
    const closeModal = () => {
        setIsModalOpen(false);
        setEditingEvent(null);
    };

    // Add affected symbol
    const addAffectedSymbol = () => {
        if (!selectedSymbolId) return;

        // Check if already added
        if (affectedSymbols.includes(selectedSymbolId)) {
            toast({ title: 'Symbol already added', variant: 'destructive' });
            return;
        }

        setAffectedSymbols([...affectedSymbols, selectedSymbolId]);
        setSelectedSymbolId('');
    };

    // Remove affected symbol
    const removeAffectedSymbol = (symbolId: string) => {
        setAffectedSymbols(affectedSymbols.filter((s) => s !== symbolId));
    };

    // Get symbol ticker by ID
    const getSymbolTicker = (symbolId: string) => {
        const symbol = symbols?.find((s: any) => s.id === symbolId);
        return symbol?.symbol || symbolId;
    };

    // Handle form submit
    const handleSubmit = () => {
        if (!title || !description || !magnitude) {
            toast({ title: 'Please fill in all required fields', variant: 'destructive' });
            return;
        }

        if (!affectAllSymbols && affectedSymbols.length === 0) {
            toast({ title: 'Please select at least one symbol or check "Affect All Symbols"', variant: 'destructive' });
            return;
        }

        const eventData = {
            title,
            description,
            impactType,
            priceUpdateType,
            magnitude: parseFloat(magnitude),
            affectedSymbols: affectAllSymbols ? undefined : affectedSymbols,
            affectAllSymbols,
            scheduledAt: scheduledAt || undefined,
        };

        if (editingEvent) {
            updateEventMutation.mutate({ eventId: editingEvent.id, data: eventData });
        } else {
            createEventMutation.mutate(eventData);
        }
    };

    // Status badge component
    const StatusBadge = ({ isExecuted, scheduledAt }: { isExecuted: boolean; scheduledAt?: string }) => {
        let status: 'EXECUTED' | 'PENDING' | 'DRAFT';
        if (isExecuted) {
            status = 'EXECUTED';
        } else if (scheduledAt) {
            status = 'PENDING';
        } else {
            status = 'DRAFT';
        }

        const config = {
            DRAFT: { icon: Edit2, color: 'text-gray-400 bg-gray-400/20' },
            PENDING: { icon: Clock, color: 'text-yellow-500 bg-yellow-500/20' },
            EXECUTED: { icon: CheckCircle, color: 'text-green-500 bg-green-500/20' },
        };
        const { icon: Icon, color } = config[status];

        return (
            <span className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${color}`}>
                <Icon className="h-3 w-3" />
                {status}
            </span>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Calendar className="h-6 w-6" />
                        Market Events
                    </h1>
                    <p className="text-muted-foreground">Create and manage market news and price scripts</p>
                </div>
                <button onClick={openNewEventModal} className="btn-primary flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Create Event
                </button>
            </div>

            {/* Events List */}
            <div className="card">
                {events && events.length > 0 ? (
                    <div className="space-y-4">
                        {events.map((event: MarketEvent) => (
                            <div
                                key={event.id}
                                className="p-4 bg-secondary/30 rounded-lg border border-border"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="font-semibold text-lg">{event.title}</h3>
                                        <p className="text-sm text-muted-foreground">{event.description}</p>
                                    </div>
                                    <StatusBadge isExecuted={event.isExecuted} scheduledAt={event.scheduledAt} />
                                </div>

                                {/* Event Details */}
                                <div className="flex flex-wrap gap-2 my-3">
                                    <span className={`px-2 py-1 rounded text-sm font-medium ${event.impactType === 'positive' ? 'bg-green-500/20 text-green-500' :
                                        event.impactType === 'negative' ? 'bg-red-500/20 text-red-500' :
                                            'bg-gray-500/20 text-gray-400'
                                        }`}>
                                        {event.impactType.charAt(0).toUpperCase() + event.impactType.slice(1)}
                                    </span>
                                    <span className="px-2 py-1 rounded text-sm font-medium bg-blue-500/20 text-blue-500">
                                        {event.priceUpdateType === 'percentage' ? `${event.magnitude}%` :
                                            event.priceUpdateType === 'absolute' ? `Rs. ${event.magnitude}` :
                                                `Override: ${event.magnitude}`}
                                    </span>
                                    {event.affectAllSymbols ? (
                                        <span className="px-2 py-1 rounded text-sm font-medium bg-purple-500/20 text-purple-500">
                                            All Symbols
                                        </span>
                                    ) : event.affectedSymbols?.length > 0 ? (
                                        <span className="px-2 py-1 rounded text-sm font-medium bg-primary/20 text-primary">
                                            {event.affectedSymbols.length} symbol(s)
                                        </span>
                                    ) : null}
                                </div>

                                {/* Meta & Actions */}
                                <div className="flex justify-between items-center mt-3 pt-3 border-t border-border">
                                    <div className="text-xs text-muted-foreground">
                                        Created: {formatDate(event.createdAt)}
                                        {event.executedAt && ` • Executed: ${formatDate(event.executedAt)}`}
                                    </div>

                                    <div className="flex gap-2">
                                        {!event.isExecuted ? (
                                            <>
                                                <button
                                                    onClick={() => openEditEventModal(event)}
                                                    className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-500/20 text-blue-500 rounded hover:bg-blue-500/30"
                                                >
                                                    <Edit2 className="h-3 w-3" />
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => executeEventMutation.mutate(event.id)}
                                                    disabled={executeEventMutation.isPending}
                                                    className="flex items-center gap-1 px-3 py-1 text-sm bg-green-500/20 text-green-500 rounded hover:bg-green-500/30"
                                                >
                                                    {executeEventMutation.isPending ? (
                                                        <Loader2 className="h-3 w-3 animate-spin" />
                                                    ) : (
                                                        <Send className="h-3 w-3" />
                                                    )}
                                                    Execute
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (confirm('Delete this event?')) {
                                                            deleteEventMutation.mutate(event.id);
                                                        }
                                                    }}
                                                    className="flex items-center gap-1 px-3 py-1 text-sm bg-red-500/20 text-red-500 rounded hover:bg-red-500/30"
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                    Delete
                                                </button>
                                            </>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 text-muted-foreground">
                        <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg">No events yet</p>
                        <p className="text-sm">Create your first market event to affect stock prices</p>
                    </div>
                )}
            </div>

            {/* Create Event Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-card border border-border rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold">{editingEvent ? 'Edit Market Event' : 'Create Market Event'}</h2>
                                <button
                                    onClick={closeModal}
                                    className="p-2 hover:bg-secondary rounded-lg"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {/* Title */}
                                <div>
                                    <label className="label">Event Title *</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="e.g., NABIL Bank Q3 Earnings Beat Expectations"
                                        className="input w-full"
                                    />
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="label">Description *</label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Describe the market event and its expected impact..."
                                        rows={3}
                                        className="input w-full resize-none"
                                    />
                                </div>

                                {/* Impact Type */}
                                <div>
                                    <label className="label">Impact Type *</label>
                                    <select
                                        value={impactType}
                                        onChange={(e) => setImpactType(e.target.value as 'positive' | 'negative' | 'neutral')}
                                        className="input w-full"
                                    >
                                        <option value="positive">Positive (Price Increase)</option>
                                        <option value="negative">Negative (Price Decrease)</option>
                                        <option value="neutral">Neutral (Mixed Impact)</option>
                                    </select>
                                </div>

                                {/* Price Update Type & Magnitude */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="label">Price Update Type *</label>
                                        <select
                                            value={priceUpdateType}
                                            onChange={(e) => setPriceUpdateType(e.target.value as 'percentage' | 'absolute' | 'override')}
                                            className="input w-full"
                                        >
                                            <option value="percentage">Percentage Change</option>
                                            <option value="absolute">Absolute Change</option>
                                            <option value="override">Override Price</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="label">Magnitude *</label>
                                        <input
                                            type="number"
                                            value={magnitude}
                                            onChange={(e) => setMagnitude(e.target.value)}
                                            placeholder={priceUpdateType === 'percentage' ? 'e.g., 5 for 5%' : 'e.g., 100'}
                                            className="input w-full"
                                            step="0.01"
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {priceUpdateType === 'percentage' && 'Percentage change to apply'}
                                            {priceUpdateType === 'absolute' && 'Amount to add/subtract'}
                                            {priceUpdateType === 'override' && 'New price value'}
                                        </p>
                                    </div>
                                </div>

                                {/* Schedule (optional) */}
                                <div>
                                    <label className="label">Schedule (optional)</label>
                                    <input
                                        type="datetime-local"
                                        value={scheduledAt}
                                        onChange={(e) => setScheduledAt(e.target.value)}
                                        className="input w-full"
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Leave empty to execute manually
                                    </p>
                                </div>

                                {/* Affect All Symbols */}
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="affectAllSymbols"
                                        checked={affectAllSymbols}
                                        onChange={(e) => setAffectAllSymbols(e.target.checked)}
                                        className="w-4 h-4 rounded border-border"
                                    />
                                    <label htmlFor="affectAllSymbols" className="text-sm">
                                        Affect all symbols
                                    </label>
                                </div>

                                {/* Affected Symbols */}
                                {!affectAllSymbols && (
                                    <div>
                                        <label className="label">Affected Symbols</label>

                                        {/* Add symbol form */}
                                        <div className="flex gap-2 mb-3">
                                            <select
                                                value={selectedSymbolId}
                                                onChange={(e) => setSelectedSymbolId(e.target.value)}
                                                className="input flex-1"
                                            >
                                                <option value="">Select symbol...</option>
                                                {symbols?.filter((s: any) => s.isActive).map((symbol: any) => (
                                                    <option key={symbol.id} value={symbol.id}>
                                                        {symbol.symbol} - {symbol.companyName}
                                                    </option>
                                                ))}
                                            </select>
                                            <button
                                                onClick={addAffectedSymbol}
                                                disabled={!selectedSymbolId}
                                                className="btn-secondary"
                                            >
                                                <Plus className="h-4 w-4" />
                                            </button>
                                        </div>

                                        {/* Added symbols */}
                                        {affectedSymbols.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {affectedSymbols.map((symbolId) => (
                                                    <span
                                                        key={symbolId}
                                                        className="flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-primary/20 text-primary"
                                                    >
                                                        {getSymbolTicker(symbolId)}
                                                        <button
                                                            onClick={() => removeAffectedSymbol(symbolId)}
                                                            className="hover:opacity-75"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex gap-3 pt-4">
                                    <button onClick={closeModal} className="btn-secondary flex-1">
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSubmit}
                                        disabled={createEventMutation.isPending || updateEventMutation.isPending}
                                        className="btn-primary flex-1 flex items-center justify-center gap-2"
                                    >
                                        {(createEventMutation.isPending || updateEventMutation.isPending) ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : editingEvent ? (
                                            <Edit2 className="h-4 w-4" />
                                        ) : (
                                            <Plus className="h-4 w-4" />
                                        )}
                                        {editingEvent ? 'Update Event' : 'Create Event'}
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
