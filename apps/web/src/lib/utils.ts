import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// Format number with Nepali comma grouping (last 3, then groups of 2)
// e.g., 1000000 => 10,00,000
function formatNepaliNumber(num: number, decimals = 2): string {
    const isNegative = num < 0;
    const abs = Math.abs(num);
    const fixed = abs.toFixed(decimals);
    const [intPart, decPart] = fixed.split('.');

    if (intPart.length <= 3) {
        const formatted = decPart ? `${intPart}.${decPart}` : intPart;
        return isNegative ? `-${formatted}` : formatted;
    }

    // Last 3 digits
    const last3 = intPart.slice(-3);
    let remaining = intPart.slice(0, -3);

    // Group remaining digits in pairs from right
    const groups: string[] = [];
    while (remaining.length > 0) {
        groups.unshift(remaining.slice(-2));
        remaining = remaining.slice(0, -2);
    }

    const formatted = `${groups.join(',')},${last3}` + (decPart ? `.${decPart}` : '');
    return isNegative ? `-${formatted}` : formatted;
}

// Format number as NPR currency
export function formatCurrency(amount: number): string {
    return `रू ${formatNepaliNumber(amount, 2)}`;
}

// Format number with commas (Nepali grouping)
export function formatNumber(num: number, decimals = 2): string {
    return formatNepaliNumber(num, decimals);
}

// Format percentage
export function formatPercent(value: number, includeSign = true): string {
    const formatted = Math.abs(value).toFixed(2);
    const sign = value >= 0 ? '+' : '-';
    return includeSign ? `${sign}${formatted}%` : `${formatted}%`;
}

// Format large numbers (K, L, Cr for Nepal)
export function formatCompact(num: number): string {
    const abs = Math.abs(num);
    const sign = num < 0 ? '-' : '';
    if (abs >= 10000000) {
        return `${sign}${(abs / 10000000).toFixed(2)} Cr`;
    }
    if (abs >= 100000) {
        return `${sign}${(abs / 100000).toFixed(2)} L`;
    }
    if (abs >= 1000) {
        return `${sign}${(abs / 1000).toFixed(2)} K`;
    }
    return formatNepaliNumber(num, 2);
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
