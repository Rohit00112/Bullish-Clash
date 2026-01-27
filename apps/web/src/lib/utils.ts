import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// Format number as NPR currency
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-NP', {
        style: 'currency',
        currency: 'NPR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount).replace('NPR', 'रू');
}

// Format number with commas
export function formatNumber(num: number, decimals = 2): string {
    return new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(num);
}

// Format percentage
export function formatPercent(value: number, includeSign = true): string {
    const formatted = Math.abs(value).toFixed(2);
    const sign = value >= 0 ? '+' : '-';
    return includeSign ? `${sign}${formatted}%` : `${formatted}%`;
}

// Format large numbers (K, L, Cr for Nepal)
export function formatCompact(num: number): string {
    if (num >= 10000000) {
        return `${(num / 10000000).toFixed(2)} Cr`;
    }
    if (num >= 100000) {
        return `${(num / 100000).toFixed(2)} L`;
    }
    if (num >= 1000) {
        return `${(num / 1000).toFixed(2)} K`;
    }
    return num.toFixed(2);
}

// Get price change color class
export function getPriceChangeClass(change: number): string {
    if (change > 0) return 'price-up';
    if (change < 0) return 'price-down';
    return 'price-neutral';
}

// Format date for Nepal timezone
export function formatDate(date: Date | string): string {
    const d = new Date(date);
    return new Intl.DateTimeFormat('en-NP', {
        timeZone: 'Asia/Kathmandu',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }).format(d);
}

// Format time for Nepal timezone
export function formatTime(date: Date | string): string {
    const d = new Date(date);
    return new Intl.DateTimeFormat('en-NP', {
        timeZone: 'Asia/Kathmandu',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    }).format(d);
}

// Format datetime for Nepal timezone
export function formatDateTime(date: Date | string): string {
    const d = new Date(date);
    return new Intl.DateTimeFormat('en-NP', {
        timeZone: 'Asia/Kathmandu',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(d);
}

// Calculate countdown
export function getCountdown(endTime: Date | string): {
    hours: number;
    minutes: number;
    seconds: number;
    total: number;
} {
    const end = new Date(endTime).getTime();
    const now = Date.now();
    const total = Math.max(0, end - now);

    return {
        hours: Math.floor(total / (1000 * 60 * 60)),
        minutes: Math.floor((total % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((total % (1000 * 60)) / 1000),
        total,
    };
}

// Debounce function
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}
