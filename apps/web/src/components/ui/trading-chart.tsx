'use client';

import { useEffect, useRef, useState } from 'react';
import {
    createChart,
    ColorType,
    IChartApi,
    ISeriesApi,
    CandlestickData,
    LineData,
    Time,
} from 'lightweight-charts';

interface ChartProps {
    symbolId: string;
    symbol: string;
    companyName: string;
    currentPrice?: number;
    priceChange?: number;
    changePercent?: number;
    height?: number;
    data?: CandlestickData<Time>[];
    interval?: string;
    onIntervalChange?: (interval: string) => void;
}

const INTERVALS = [
    { label: '1m', value: '1m' },
    { label: '5m', value: '5m' },
    { label: '15m', value: '15m' },
    { label: '1H', value: '1h' },
    { label: '4H', value: '4h' },
    { label: '1D', value: '1d' },
];

export function TradingChart({
    symbolId,
    symbol,
    companyName,
    currentPrice = 0,
    priceChange = 0,
    changePercent = 0,
    height = 400,
    data = [],
    interval = '1m',
    onIntervalChange,
}: ChartProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
    const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
    const isDisposedRef = useRef(false);
    const [selectedInterval, setSelectedInterval] = useState(interval);
    const [chartType, setChartType] = useState<'candle' | 'line'>('candle');

    // Sync selectedInterval when interval prop changes
    useEffect(() => {
        setSelectedInterval(interval);
    }, [interval]);

    // Initialize chart
    useEffect(() => {
        if (!chartContainerRef.current) return;

        // Reset disposed flag
        isDisposedRef.current = false;

        // Clear previous chart safely
        if (chartRef.current) {
            try {
                chartRef.current.remove();
            } catch (e) {
                // Chart already disposed, ignore
            }
            chartRef.current = null;
            candlestickSeriesRef.current = null;
            volumeSeriesRef.current = null;
        }

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: 'transparent' },
                textColor: '#9ca3af',
            },
            grid: {
                vertLines: { color: 'rgba(42, 46, 57, 0.5)' },
                horzLines: { color: 'rgba(42, 46, 57, 0.5)' },
            },
            width: chartContainerRef.current.clientWidth,
            height: height,
            crosshair: {
                mode: 1,
                vertLine: {
                    width: 1,
                    color: 'rgba(224, 227, 235, 0.4)',
                    style: 0,
                },
                horzLine: {
                    width: 1,
                    color: 'rgba(224, 227, 235, 0.4)',
                    style: 0,
                },
            },
            rightPriceScale: {
                borderColor: 'rgba(42, 46, 57, 0.5)',
                scaleMargins: {
                    top: 0.1,
                    bottom: 0.2,
                },
            },
            timeScale: {
                borderColor: 'rgba(42, 46, 57, 0.5)',
                timeVisible: true,
                secondsVisible: false,
            },
        });

        chartRef.current = chart;

        // Add candlestick series
        const candlestickSeries = chart.addCandlestickSeries({
            upColor: '#22c55e',
            downColor: '#ef4444',
            borderDownColor: '#ef4444',
            borderUpColor: '#22c55e',
            wickDownColor: '#ef4444',
            wickUpColor: '#22c55e',
        });

        candlestickSeriesRef.current = candlestickSeries;

        // Add volume series
        const volumeSeries = chart.addHistogramSeries({
            color: '#26a69a',
            priceFormat: {
                type: 'volume',
            },
            priceScaleId: '',
        });

        volumeSeries.priceScale().applyOptions({
            scaleMargins: {
                top: 0.8,
                bottom: 0,
            },
        });

        volumeSeriesRef.current = volumeSeries;

        // Handle resize
        const handleResize = () => {
            if (chartContainerRef.current && chartRef.current && !isDisposedRef.current) {
                try {
                    chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
                } catch (e) {
                    // Chart disposed, ignore
                }
            }
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            isDisposedRef.current = true;
            if (chartRef.current) {
                try {
                    chartRef.current.remove();
                } catch (e) {
                    // Already disposed, ignore
                }
                chartRef.current = null;
                candlestickSeriesRef.current = null;
                volumeSeriesRef.current = null;
            }
        };
    }, [height]);

    // Update data when it changes
    useEffect(() => {
        if (!candlestickSeriesRef.current || !volumeSeriesRef.current || isDisposedRef.current) return;

        if (data.length > 0) {
            try {
                // Set candlestick data
                candlestickSeriesRef.current.setData(data);

                // Set volume data
                const volumeData = data.map((d: any) => ({
                    time: d.time,
                    value: d.volume || 0,
                    color: d.close >= d.open ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)',
                }));
                volumeSeriesRef.current.setData(volumeData);

                // Fit content
                chartRef.current?.timeScale().fitContent();
            } catch (e) {
                // Chart disposed, ignore
            }
        }
    }, [data]);

    // Update last candle in real-time
    useEffect(() => {
        if (!candlestickSeriesRef.current || !currentPrice || data.length === 0 || isDisposedRef.current) return;

        const lastCandle = data[data.length - 1];
        if (lastCandle) {
            try {
                const updatedCandle: CandlestickData<Time> = {
                    time: lastCandle.time,
                    open: lastCandle.open,
                    high: Math.max(lastCandle.high, currentPrice),
                    low: Math.min(lastCandle.low, currentPrice),
                    close: currentPrice,
                };
                candlestickSeriesRef.current.update(updatedCandle);
            } catch (e) {
                // Chart disposed, ignore
            }
        }
    }, [currentPrice, data]);

    const handleIntervalChange = (interval: string) => {
        setSelectedInterval(interval);
        onIntervalChange?.(interval);
    };

    const isPositive = changePercent >= 0;

    return (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
            {/* Chart Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <div className="flex items-center gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-lg">{symbol}</h3>
                            <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                                NEPSE
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{companyName}</p>
                    </div>
                    <div className="pl-4 border-l border-border">
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold font-mono">
                                Rs {currentPrice?.toLocaleString('en-NP', { minimumFractionDigits: 2 })}
                            </span>
                            <span
                                className={`text-sm font-medium ${isPositive ? 'text-green-500' : 'text-red-500'
                                    }`}
                            >
                                {isPositive ? '+' : ''}
                                {priceChange?.toFixed(2)} ({isPositive ? '+' : ''}
                                {changePercent?.toFixed(2)}%)
                            </span>
                        </div>
                    </div>
                </div>

                {/* Interval Selector */}
                <div className="flex items-center gap-1 bg-secondary/50 rounded-lg p-1 mr-10">
                    {INTERVALS.map((interval) => (
                        <button
                            key={interval.value}
                            onClick={() => handleIntervalChange(interval.value)}
                            className={`px-3 py-1 text-sm rounded-md transition-colors ${selectedInterval === interval.value
                                ? 'bg-primary text-primary-foreground'
                                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                                }`}
                        >
                            {interval.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Chart OHLC Info */}
            {data.length > 0 && (
                <div className="flex items-center gap-6 px-4 py-2 text-sm border-b border-border bg-secondary/20">
                    <div>
                        <span className="text-muted-foreground">O </span>
                        <span className="font-mono">{data[data.length - 1]?.open.toFixed(2)}</span>
                    </div>
                    <div>
                        <span className="text-muted-foreground">H </span>
                        <span className="font-mono text-green-500">
                            {data[data.length - 1]?.high.toFixed(2)}
                        </span>
                    </div>
                    <div>
                        <span className="text-muted-foreground">L </span>
                        <span className="font-mono text-red-500">
                            {data[data.length - 1]?.low.toFixed(2)}
                        </span>
                    </div>
                    <div>
                        <span className="text-muted-foreground">C </span>
                        <span className="font-mono">{currentPrice?.toFixed(2)}</span>
                    </div>
                    <div>
                        <span className="text-muted-foreground">Vol </span>
                        <span className="font-mono">
                            {((data[data.length - 1] as any)?.volume || 0).toLocaleString()}
                        </span>
                    </div>
                </div>
            )}

            {/* Chart Container */}
            <div ref={chartContainerRef} className="w-full" />

            {/* No Data State */}
            {data.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-card/80">
                    <div className="text-center">
                        <p className="text-muted-foreground">No chart data available</p>
                        <p className="text-sm text-muted-foreground">
                            Trade this stock to see price history
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

// Simple seeded random number generator for consistent data
function seededRandom(seed: number) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

// Generate sample data for testing/demo - now with seed for consistency
export function generateSampleData(basePrice: number, count = 100, symbolSeed = 0): CandlestickData<Time>[] {
    const data: CandlestickData<Time>[] = [];
    let currentPrice = basePrice;

    // Use today's date at midnight as base time for consistency
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let time = Math.floor(today.getTime() / 1000);

    // Create a consistent seed based on symbol and day
    const daySeed = Math.floor(today.getTime() / 86400000); // Day number
    let seed = symbolSeed + daySeed;

    for (let i = 0; i < count; i++) {
        seed++;
        const random1 = seededRandom(seed);
        const random2 = seededRandom(seed + 1000);
        const random3 = seededRandom(seed + 2000);
        const random4 = seededRandom(seed + 3000);

        const volatility = currentPrice * 0.02; // 2% volatility
        const open = currentPrice;
        const change = (random1 - 0.48) * volatility; // Slight upward bias
        const close = open + change;
        const high = Math.max(open, close) + random2 * volatility * 0.5;
        const low = Math.min(open, close) - random3 * volatility * 0.5;
        const volume = Math.floor(random4 * 100000) + 10000;

        data.push({
            time: time as Time,
            open: parseFloat(open.toFixed(2)),
            high: parseFloat(high.toFixed(2)),
            low: parseFloat(low.toFixed(2)),
            close: parseFloat(close.toFixed(2)),
            // @ts-ignore - volume is not in CandlestickData but we need it
            volume,
        });

        currentPrice = close;
        time += 60; // 1 minute interval
    }

    return data;
}
