'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    FileBarChart,
    Building2,
    Droplets,
    Briefcase,
    Search,
    RefreshCw,
    TrendingUp,
    TrendingDown,
    ChevronDown,
    ChevronUp,
    Filter,
} from 'lucide-react';
import { quarterlyReportsApi, symbolsApi } from '@/lib/api';

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'] as const;

const REPORT_TYPE_ICONS = {
    bank: Building2,
    hydropower: Droplets,
    generic: Briefcase,
};

const REPORT_TYPE_LABELS = {
    bank: 'Banking',
    hydropower: 'Hydropower',
    generic: 'General',
};

function formatLargeNumber(value: string | null | undefined) {
    if (!value) return '-';
    const num = parseFloat(value);
    if (num >= 1e9) return `रू${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e7) return `रू${(num / 1e7).toFixed(2)}Cr`;
    if (num >= 1e5) return `रू${(num / 1e5).toFixed(2)}L`;
    return `रू${num.toLocaleString()}`;
}

function getKeyIndicatorHeaders(reportType: string) {
    switch (reportType) {
        case 'bank':
            return ['ROE', 'NPL', 'NIM', 'ROA'];
        case 'hydropower':
            return ['EPS (NPR)', 'Capacity', 'D/E', 'EBITDA'];
        default:
            return ['EPS', 'ROE', 'D/E', 'Net Margin'];
    }
}

function getKeyIndicatorValues(report: any) {
    switch (report.reportType) {
        case 'bank':
            return [
                report.returnOnEquity ? `${report.returnOnEquity}%` : '-',
                report.nonPerformingLoan ? `${report.nonPerformingLoan}%` : '-',
                report.netInterestMargin ? `${report.netInterestMargin}%` : '-',
                report.returnOnAssets ? `${report.returnOnAssets}%` : '-',
            ];
        case 'hydropower':
            return [
                report.earningsPerShare ? `रू${report.earningsPerShare}` : '-',
                report.capacityUtilization ? `${report.capacityUtilization}%` : '-',
                report.debtToEquity || '-',
                report.ebitdaMargin ? `${report.ebitdaMargin}%` : '-',
            ];
        default:
            return [
                report.earningsPerShare ? `रू${report.earningsPerShare}` : '-',
                report.returnOnEquity ? `${report.returnOnEquity}%` : '-',
                report.debtToEquity || '-',
                report.netProfitMargin ? `${report.netProfitMargin}%` : '-',
            ];
    }
}

export default function ReportsPage() {
    const [selectedSymbolId, setSelectedSymbolId] = useState('');
    const [filterQuarter, setFilterQuarter] = useState('');
    const [expandedId, setExpandedId] = useState<string | null>(null);

    // Fetch symbols for the filter
    const { data: symbols } = useQuery({
        queryKey: ['symbols'],
        queryFn: async () => {
            const res = await symbolsApi.getAll();
            return res.data;
        },
    });

    // Fetch reports (all or per-symbol)
    const { data: reportData, isLoading, refetch } = useQuery({
        queryKey: ['quarterly-reports', selectedSymbolId, filterQuarter],
        queryFn: async () => {
            if (selectedSymbolId) {
                const res = await quarterlyReportsApi.getBySymbol(selectedSymbolId);
                // Transform per-symbol response to flat list
                const data = res.data;
                return (data.reports || []).map((r: any) => ({
                    ...r,
                    reportType: data.reportType,
                    symbol: data.symbol,
                }));
            }
            const res = await quarterlyReportsApi.getAll({ quarter: filterQuarter || undefined });
            return res.data;
        },
    });

    const reports = reportData || [];

    // Group reports by symbol for the table view
    const groupedByType = reports.reduce((acc: Record<string, any[]>, report: any) => {
        const type = report.reportType || 'generic';
        if (!acc[type]) acc[type] = [];
        acc[type].push(report);
        return acc;
    }, {});

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <FileBarChart className="h-6 w-6" />
                        Quarterly Financial Reports
                    </h1>
                    <p className="text-muted-foreground">
                        Quarter-wise financial reports and key indicators
                    </p>
                </div>
                <button
                    onClick={() => refetch()}
                    className="btn-secondary flex items-center gap-2"
                >
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                </button>
            </div>

            {/* Filters */}
            <div className="card">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Filter:</span>
                    </div>

                    <div className="flex-1 min-w-[200px]">
                        <select
                            value={selectedSymbolId}
                            onChange={(e) => setSelectedSymbolId(e.target.value)}
                            className="input w-full"
                        >
                            <option value="">All Companies</option>
                            {symbols?.filter((s: any) => s.isActive).map((s: any) => (
                                <option key={s.id} value={s.id}>
                                    {s.symbol} - {s.companyName}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="min-w-[120px]">
                        <select
                            value={filterQuarter}
                            onChange={(e) => setFilterQuarter(e.target.value)}
                            className="input w-full"
                        >
                            <option value="">All Quarters</option>
                            {QUARTERS.map(q => (
                                <option key={q} value={q}>{q}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Reports */}
            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : reports.length > 0 ? (
                Object.entries(groupedByType).map(([type, typeReports]: [string, any[]]) => {
                    const Icon = REPORT_TYPE_ICONS[type as keyof typeof REPORT_TYPE_ICONS] || Briefcase;
                    const label = REPORT_TYPE_LABELS[type as keyof typeof REPORT_TYPE_LABELS] || 'General';
                    const headers = getKeyIndicatorHeaders(type);

                    return (
                        <div key={type} className="space-y-2">
                            {/* Section Header */}
                            <div className="flex items-center gap-2 px-1">
                                <Icon className="h-5 w-5 text-primary" />
                                <h2 className="text-lg font-semibold">{label} – Key Indicators</h2>
                            </div>

                            {/* Table */}
                            <div className="card overflow-x-auto p-0">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-border text-left">
                                            <th className="px-4 py-3 text-sm font-medium text-muted-foreground">Company</th>
                                            <th className="px-4 py-3 text-sm font-medium text-muted-foreground">Period</th>
                                            {headers.map((h, i) => (
                                                <th key={i} className="px-4 py-3 text-sm font-medium text-muted-foreground text-right">{h}</th>
                                            ))}
                                            <th className="px-4 py-3 text-sm font-medium text-muted-foreground text-right">Revenue</th>
                                            <th className="px-4 py-3 text-sm font-medium text-muted-foreground text-right">Net Profit</th>
                                            <th className="px-4 py-3 w-8"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {typeReports.map((report: any) => {
                                            const values = getKeyIndicatorValues(report);
                                            const isExpanded = expandedId === report.id;

                                            return (
                                                <tr
                                                    key={report.id}
                                                    className="border-b border-border/50 hover:bg-secondary/30 cursor-pointer transition-colors"
                                                    onClick={() => setExpandedId(isExpanded ? null : report.id)}
                                                >
                                                    <td className="px-4 py-3">
                                                        <div className="font-medium">{report.symbol?.symbol || '—'}</div>
                                                        <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                                                            {report.symbol?.companyName}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="text-sm font-medium">{report.fiscalYear}</span>
                                                        <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary">{report.quarter}</span>
                                                    </td>
                                                    {values.map((v, i) => (
                                                        <td key={i} className="px-4 py-3 text-right font-mono text-sm">{v}</td>
                                                    ))}
                                                    <td className="px-4 py-3 text-right font-mono text-sm">
                                                        {formatLargeNumber(report.revenue)}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-mono text-sm">
                                                        {formatLargeNumber(report.netProfit)}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        {isExpanded ? (
                                                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                                        ) : (
                                                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    );
                })
            ) : (
                <div className="card flex flex-col items-center justify-center py-16 text-center">
                    <FileBarChart className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold">No Reports Available</h3>
                    <p className="text-muted-foreground mt-1">
                        Quarterly financial reports will appear here when published
                    </p>
                </div>
            )}
        </div>
    );
}
