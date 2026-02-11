'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    FileBarChart,
    Plus,
    Trash2,
    Loader2,
    Building2,
    Droplets,
    Briefcase,
    ChevronDown,
    ChevronUp,
    Zap,
    Clock,
    CheckCircle2,
} from 'lucide-react';
import { quarterlyReportsApi, symbolsApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'] as const;
const FISCAL_YEARS = ['2079/80', '2080/81', '2081/82', '2082/83', '2083/84', '2084/85'];

// Map sectors to report types
const SECTOR_TO_REPORT_TYPE: Record<string, 'bank' | 'hydropower' | 'generic'> = {
    'Commercial Bank': 'bank',
    'Development Bank': 'bank',
    'Hydropower': 'hydropower',
};

const REPORT_TYPE_ICONS = {
    bank: Building2,
    hydropower: Droplets,
    generic: Briefcase,
};

const REPORT_TYPE_LABELS = {
    bank: 'Commercial Bank',
    hydropower: 'Hydropower',
    generic: 'General',
};

// Field definitions per report type
const BANK_FIELDS = [
    { key: 'returnOnEquity', label: 'ROE (%)', placeholder: '11.5' },
    { key: 'nonPerformingLoan', label: 'NPL (%)', placeholder: '3.2' },
    { key: 'netInterestMargin', label: 'NIM (%)', placeholder: '3.1' },
    { key: 'returnOnAssets', label: 'ROA (%)', placeholder: '1.2' },
    { key: 'revenue', label: 'Revenue (Rs)', placeholder: '5000000000' },
    { key: 'grossProfit', label: 'Gross Profit (Rs)', placeholder: '3000000000' },
    { key: 'netProfit', label: 'Net Profit (Rs)', placeholder: '1500000000' },
    { key: 'earningsPerShare', label: 'EPS (Rs)', placeholder: '25.5' },
];

const HYDROPOWER_FIELDS = [
    { key: 'earningsPerShare', label: 'EPS (NPR)', placeholder: '6.2' },
    { key: 'capacityUtilization', label: 'Capacity (%)', placeholder: '68' },
    { key: 'debtToEquity', label: 'D/E Ratio', placeholder: '1.9' },
    { key: 'ebitdaMargin', label: 'EBITDA Margin (%)', placeholder: '45.5' },
    { key: 'revenue', label: 'Revenue (Rs)', placeholder: '500000000' },
    { key: 'grossProfit', label: 'Gross Profit (Rs)', placeholder: '300000000' },
    { key: 'netProfit', label: 'Net Profit (Rs)', placeholder: '150000000' },
    { key: 'generationMWh', label: 'Generation (MWh)', placeholder: '25000' },
];

const GENERIC_FIELDS = [
    { key: 'revenue', label: 'Revenue (Rs)', placeholder: '1000000000' },
    { key: 'grossProfit', label: 'Gross Profit (Rs)', placeholder: '500000000' },
    { key: 'netProfit', label: 'Net Profit (Rs)', placeholder: '200000000' },
    { key: 'earningsPerShare', label: 'EPS (Rs)', placeholder: '15.0' },
    { key: 'grossProfitMargin', label: 'Gross Margin (%)', placeholder: '50.0' },
    { key: 'netProfitMargin', label: 'Net Margin (%)', placeholder: '20.0' },
    { key: 'returnOnEquity', label: 'ROE (%)', placeholder: '12.0' },
    { key: 'returnOnAssets', label: 'ROA (%)', placeholder: '4.0' },
    { key: 'debtToEquity', label: 'D/E Ratio', placeholder: '1.5' },
    { key: 'currentRatio', label: 'Current Ratio', placeholder: '1.8' },
];

function getFieldsForType(type: string) {
    switch (type) {
        case 'bank': return BANK_FIELDS;
        case 'hydropower': return HYDROPOWER_FIELDS;
        default: return GENERIC_FIELDS;
    }
}

// Key indicator labels for display
function getKeyIndicators(report: any) {
    switch (report.reportType) {
        case 'bank':
            return [
                { label: 'ROE', value: report.returnOnEquity ? `${report.returnOnEquity}%` : '-' },
                { label: 'NPL', value: report.nonPerformingLoan ? `${report.nonPerformingLoan}%` : '-' },
                { label: 'NIM', value: report.netInterestMargin ? `${report.netInterestMargin}%` : '-' },
                { label: 'ROA', value: report.returnOnAssets ? `${report.returnOnAssets}%` : '-' },
            ];
        case 'hydropower':
            return [
                { label: 'EPS', value: report.earningsPerShare ? `रू${report.earningsPerShare}` : '-' },
                { label: 'Capacity', value: report.capacityUtilization ? `${report.capacityUtilization}%` : '-' },
                { label: 'D/E', value: report.debtToEquity || '-' },
                { label: 'EBITDA', value: report.ebitdaMargin ? `${report.ebitdaMargin}%` : '-' },
            ];
        default:
            return [
                { label: 'EPS', value: report.earningsPerShare ? `रू${report.earningsPerShare}` : '-' },
                { label: 'ROE', value: report.returnOnEquity ? `${report.returnOnEquity}%` : '-' },
                { label: 'D/E', value: report.debtToEquity || '-' },
                { label: 'Margin', value: report.netProfitMargin ? `${report.netProfitMargin}%` : '-' },
            ];
    }
}

function formatLargeNumber(value: string | null | undefined) {
    if (!value) return '-';
    const num = parseFloat(value);
    if (num >= 1e9) return `रू${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e7) return `रू${(num / 1e7).toFixed(2)}Cr`;
    if (num >= 1e5) return `रू${(num / 1e5).toFixed(2)}L`;
    return `रू${num.toLocaleString()}`;
}

export default function AdminReportsPage() {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [showForm, setShowForm] = useState(false);
    const [selectedSymbolId, setSelectedSymbolId] = useState('');
    const [fiscalYear, setFiscalYear] = useState(FISCAL_YEARS[FISCAL_YEARS.length - 1]);
    const [quarter, setQuarter] = useState<typeof QUARTERS[number]>('Q1');
    const [formData, setFormData] = useState<Record<string, string>>({});
    const [expandedReport, setExpandedReport] = useState<string | null>(null);
    const [impactMagnitude, setImpactMagnitude] = useState('');
    const [impactType, setImpactType] = useState<'positive' | 'negative' | 'neutral'>('positive');
    const [priceUpdateType, setPriceUpdateType] = useState<'percentage' | 'absolute'>('percentage');
    const [executeNow, setExecuteNow] = useState(false);
    const [scheduledAt, setScheduledAt] = useState('');

    // Fetch symbols
    const { data: symbols } = useQuery({
        queryKey: ['admin-symbols'],
        queryFn: async () => {
            const res = await symbolsApi.getAll();
            return res.data;
        },
    });

    // Fetch all reports
    const { data: reports, isLoading: reportsLoading } = useQuery({
        queryKey: ['admin-quarterly-reports'],
        queryFn: async () => {
            const res = await quarterlyReportsApi.getAll();
            return res.data;
        },
    });

    // Determine report type from selected symbol
    const selectedSymbol = symbols?.find((s: any) => s.id === selectedSymbolId);
    const reportType = selectedSymbol
        ? (SECTOR_TO_REPORT_TYPE[selectedSymbol.sector] || 'generic')
        : 'generic';
    const fields = getFieldsForType(reportType);

    // Create report
    const createMutation = useMutation({
        mutationFn: async () => {
            const payload: any = {
                reportType,
                symbolId: selectedSymbolId,
                fiscalYear,
                quarter,
            };
            for (const field of fields) {
                if (formData[field.key]) {
                    payload[field.key] = parseFloat(formData[field.key]);
                }
            }
            // Market impact fields
            if (impactMagnitude) {
                payload.impactMagnitude = parseFloat(impactMagnitude);
                payload.impactType = impactType;
                payload.priceUpdateType = priceUpdateType;
                payload.executeNow = executeNow;
                if (scheduledAt) payload.scheduledAt = scheduledAt;
            }
            return quarterlyReportsApi.create(payload);
        },
        onSuccess: () => {
            toast({ title: 'Report Published', description: `${fiscalYear} ${quarter} report created successfully` });
            queryClient.invalidateQueries({ queryKey: ['admin-quarterly-reports'] });
            setShowForm(false);
            setFormData({});
            setSelectedSymbolId('');
            setImpactMagnitude('');
            setExecuteNow(false);
            setScheduledAt('');
        },
        onError: (err: any) => {
            toast({
                title: 'Failed to publish report',
                description: err.response?.data?.message || err.message,
                variant: 'destructive',
            });
        },
    });

    // Delete report
    const deleteMutation = useMutation({
        mutationFn: async ({ reportType, id }: { reportType: string; id: string }) => {
            return quarterlyReportsApi.delete(reportType, id);
        },
        onSuccess: () => {
            toast({ title: 'Report Deleted' });
            queryClient.invalidateQueries({ queryKey: ['admin-quarterly-reports'] });
        },
        onError: (err: any) => {
            toast({
                title: 'Failed to delete',
                description: err.response?.data?.message || err.message,
                variant: 'destructive',
            });
        },
    });

    // Execute market impact
    const executeMutation = useMutation({
        mutationFn: async ({ reportType, id }: { reportType: string; id: string }) => {
            return quarterlyReportsApi.execute(reportType, id);
        },
        onSuccess: (res: any) => {
            const summary = res.data?.summary;
            toast({
                title: 'Market Impact Executed',
                description: summary ? `${summary.symbol}: ${summary.previousPrice} → ${summary.newPrice}` : 'Price updated',
            });
            queryClient.invalidateQueries({ queryKey: ['admin-quarterly-reports'] });
        },
        onError: (err: any) => {
            toast({
                title: 'Failed to execute impact',
                description: err.response?.data?.message || err.message,
                variant: 'destructive',
            });
        },
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <FileBarChart className="h-6 w-6" />
                        Quarterly Reports
                    </h1>
                    <p className="text-muted-foreground">
                        Publish quarter-wise financial reports for listed companies
                    </p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="btn-primary flex items-center gap-2"
                >
                    <Plus className="h-4 w-4" />
                    Publish Report
                </button>
            </div>

            {/* Create Report Form */}
            {showForm && (
                <div className="card border border-primary/30">
                    <h3 className="text-lg font-semibold mb-4">Publish Quarterly Report</h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        {/* Symbol Selection */}
                        <div>
                            <label className="label">Company</label>
                            <select
                                value={selectedSymbolId}
                                onChange={(e) => {
                                    setSelectedSymbolId(e.target.value);
                                    setFormData({});
                                }}
                                className="input w-full"
                            >
                                <option value="">Select company...</option>
                                {symbols?.filter((s: any) => s.isActive).map((s: any) => (
                                    <option key={s.id} value={s.id}>
                                        {s.symbol} - {s.companyName} ({s.sector})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Fiscal Year */}
                        <div>
                            <label className="label">Fiscal Year</label>
                            <select
                                value={fiscalYear}
                                onChange={(e) => setFiscalYear(e.target.value)}
                                className="input w-full"
                            >
                                {FISCAL_YEARS.map(fy => (
                                    <option key={fy} value={fy}>{fy}</option>
                                ))}
                            </select>
                        </div>

                        {/* Quarter */}
                        <div>
                            <label className="label">Quarter</label>
                            <select
                                value={quarter}
                                onChange={(e) => setQuarter(e.target.value as any)}
                                className="input w-full"
                            >
                                {QUARTERS.map(q => (
                                    <option key={q} value={q}>{q}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {selectedSymbolId && (
                        <>
                            {/* Report type indicator */}
                            <div className="flex items-center gap-2 mb-4 text-sm">
                                {(() => {
                                    const Icon = REPORT_TYPE_ICONS[reportType];
                                    return <Icon className="h-4 w-4 text-primary" />;
                                })()}
                                <span className="text-muted-foreground">
                                    Report type: <span className="font-medium text-foreground">{REPORT_TYPE_LABELS[reportType]}</span>
                                    {' '}(auto-detected from sector: {selectedSymbol?.sector})
                                </span>
                            </div>

                            {/* Dynamic Fields */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                {fields.map((field) => (
                                    <div key={field.key}>
                                        <label className="label">{field.label}</label>
                                        <input
                                            type="number"
                                            step="any"
                                            value={formData[field.key] || ''}
                                            onChange={(e) =>
                                                setFormData(prev => ({ ...prev, [field.key]: e.target.value }))
                                            }
                                            placeholder={field.placeholder}
                                            className="input w-full"
                                        />
                                    </div>
                                ))}
                            </div>

                            {/* Market Impact Section */}
                            <div className="border border-border rounded-lg p-4 mb-4 bg-secondary/20">
                                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                    <Zap className="h-4 w-4 text-yellow-500" />
                                    Market Impact (Optional)
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                        <label className="label">Impact Magnitude</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={impactMagnitude}
                                            onChange={(e) => setImpactMagnitude(e.target.value)}
                                            placeholder="e.g. 5.0"
                                            className="input w-full"
                                        />
                                    </div>
                                    <div>
                                        <label className="label">Impact Type</label>
                                        <select
                                            value={impactType}
                                            onChange={(e) => setImpactType(e.target.value as any)}
                                            className="input w-full"
                                        >
                                            <option value="positive">Positive (↑)</option>
                                            <option value="negative">Negative (↓)</option>
                                            <option value="neutral">Neutral</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="label">Update Type</label>
                                        <select
                                            value={priceUpdateType}
                                            onChange={(e) => setPriceUpdateType(e.target.value as any)}
                                            className="input w-full"
                                        >
                                            <option value="percentage">Percentage (%)</option>
                                            <option value="absolute">Absolute (Rs)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="label">Schedule For</label>
                                        <input
                                            type="datetime-local"
                                            value={scheduledAt}
                                            onChange={(e) => setScheduledAt(e.target.value)}
                                            className="input w-full"
                                        />
                                    </div>
                                </div>
                                {impactMagnitude && (
                                    <label className="flex items-center gap-2 mt-3 text-sm cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={executeNow}
                                            onChange={(e) => setExecuteNow(e.target.checked)}
                                            className="rounded"
                                        />
                                        Execute impact immediately on publish
                                    </label>
                                )}
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => createMutation.mutate()}
                                    disabled={!selectedSymbolId || createMutation.isPending}
                                    className="btn-primary flex items-center gap-2"
                                >
                                    {createMutation.isPending ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <FileBarChart className="h-4 w-4" />
                                    )}
                                    Publish Report
                                </button>
                                <button
                                    onClick={() => { setShowForm(false); setFormData({}); setSelectedSymbolId(''); }}
                                    className="btn-secondary"
                                >
                                    Cancel
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Published Reports List */}
            {reportsLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : reports && reports.length > 0 ? (
                <div className="space-y-3">
                    {reports.map((report: any) => {
                        const Icon = REPORT_TYPE_ICONS[report.reportType as keyof typeof REPORT_TYPE_ICONS] || Briefcase;
                        const indicators = getKeyIndicators(report);
                        const isExpanded = expandedReport === report.id;

                        return (
                            <div key={report.id} className="card">
                                <div
                                    className="flex items-center justify-between cursor-pointer"
                                    onClick={() => setExpandedReport(isExpanded ? null : report.id)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-primary/10">
                                            <Icon className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <div className="font-semibold">
                                                {report.symbol?.symbol || 'Unknown'}{' '}
                                                <span className="text-muted-foreground font-normal">
                                                    — {report.symbol?.companyName}
                                                </span>
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                {report.fiscalYear} • {report.quarter} •{' '}
                                                <span className="capitalize">{REPORT_TYPE_LABELS[report.reportType as keyof typeof REPORT_TYPE_LABELS] || report.reportType}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        {/* Key indicators preview */}
                                        <div className="hidden md:flex items-center gap-4">
                                            {indicators.map((ind, i) => (
                                                <div key={i} className="text-center">
                                                    <p className="text-[10px] text-muted-foreground uppercase">{ind.label}</p>
                                                    <p className="text-sm font-mono font-medium">{ind.value}</p>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Execution status badge */}
                                        {report.impactMagnitude && (
                                            report.isExecuted ? (
                                                <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-500">
                                                    <CheckCircle2 className="h-3 w-3" />
                                                    Executed
                                                </span>
                                            ) : report.scheduledAt ? (
                                                <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-blue-500/10 text-blue-500">
                                                    <Clock className="h-3 w-3" />
                                                    Scheduled
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-500">
                                                    <Zap className="h-3 w-3" />
                                                    Pending
                                                </span>
                                            )
                                        )}

                                        <div className="flex items-center gap-2">
                                            {/* Execute button for unexecuted reports with impact */}
                                            {report.impactMagnitude && !report.isExecuted && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (confirm('Execute market impact for this report?')) {
                                                            executeMutation.mutate({
                                                                reportType: report.reportType,
                                                                id: report.id,
                                                            });
                                                        }
                                                    }}
                                                    disabled={executeMutation.isPending}
                                                    className="p-1.5 rounded hover:bg-yellow-500/10 text-yellow-500"
                                                    title="Execute market impact"
                                                >
                                                    <Zap className="h-4 w-4" />
                                                </button>
                                            )}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (confirm('Delete this report?')) {
                                                        deleteMutation.mutate({
                                                            reportType: report.reportType,
                                                            id: report.id,
                                                        });
                                                    }
                                                }}
                                                className="p-1.5 rounded hover:bg-red-500/10 text-red-500"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                            {isExpanded ? (
                                                <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                            ) : (
                                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Details */}
                                {isExpanded && (
                                    <div className="mt-4 pt-4 border-t border-border">
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {report.revenue && (
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Revenue</p>
                                                    <p className="font-medium">{formatLargeNumber(report.revenue)}</p>
                                                </div>
                                            )}
                                            {report.grossProfit && (
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Gross Profit</p>
                                                    <p className="font-medium">{formatLargeNumber(report.grossProfit)}</p>
                                                </div>
                                            )}
                                            {report.netProfit && (
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Net Profit</p>
                                                    <p className="font-medium">{formatLargeNumber(report.netProfit)}</p>
                                                </div>
                                            )}
                                            {report.earningsPerShare && (
                                                <div>
                                                    <p className="text-xs text-muted-foreground">EPS</p>
                                                    <p className="font-medium">रू{report.earningsPerShare}</p>
                                                </div>
                                            )}
                                            {report.generationMWh && (
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Generation</p>
                                                    <p className="font-medium">{parseFloat(report.generationMWh).toLocaleString()} MWh</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Key indicators on mobile */}
                                        <div className="md:hidden grid grid-cols-4 gap-4 mt-3 pt-3 border-t border-border/50">
                                            {indicators.map((ind, i) => (
                                                <div key={i} className="text-center">
                                                    <p className="text-[10px] text-muted-foreground uppercase">{ind.label}</p>
                                                    <p className="text-sm font-mono font-medium">{ind.value}</p>
                                                </div>
                                            ))}
                                        </div>

                                        <p className="text-xs text-muted-foreground mt-3">
                                            Published: {new Date(report.createdAt).toLocaleDateString('en-US', {
                                                year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                            })}
                                        </p>

                                        {/* Market Impact Info */}
                                        {report.impactMagnitude && (
                                            <div className="mt-3 pt-3 border-t border-border/50">
                                                <p className="text-xs text-muted-foreground mb-2 font-semibold uppercase">Market Impact</p>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">Magnitude</p>
                                                        <p className="font-medium">
                                                            {report.impactType === 'negative' ? '-' : '+'}{report.impactMagnitude}
                                                            {report.priceUpdateType === 'percentage' ? '%' : ' Rs'}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">Direction</p>
                                                        <p className={`font-medium capitalize ${report.impactType === 'positive' ? 'text-green-500' : report.impactType === 'negative' ? 'text-red-500' : ''}`}>
                                                            {report.impactType}
                                                        </p>
                                                    </div>
                                                    {report.isExecuted && report.previousPrice && (
                                                        <>
                                                            <div>
                                                                <p className="text-xs text-muted-foreground">Previous Price</p>
                                                                <p className="font-medium font-mono">रू{parseFloat(report.previousPrice).toLocaleString()}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-muted-foreground">New Price</p>
                                                                <p className="font-medium font-mono">रू{parseFloat(report.newPrice).toLocaleString()}</p>
                                                            </div>
                                                        </>
                                                    )}
                                                    {report.scheduledAt && !report.isExecuted && (
                                                        <div>
                                                            <p className="text-xs text-muted-foreground">Scheduled At</p>
                                                            <p className="font-medium">{new Date(report.scheduledAt).toLocaleString()}</p>
                                                        </div>
                                                    )}
                                                    {report.executedAt && (
                                                        <div>
                                                            <p className="text-xs text-muted-foreground">Executed At</p>
                                                            <p className="font-medium">{new Date(report.executedAt).toLocaleString()}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="card flex flex-col items-center justify-center py-16 text-center">
                    <FileBarChart className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold">No Reports Published</h3>
                    <p className="text-muted-foreground mt-1">
                        Click &quot;Publish Report&quot; to create quarterly financial reports
                    </p>
                </div>
            )}
        </div>
    );
}
