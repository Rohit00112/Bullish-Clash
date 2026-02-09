// ============================================================
// Bullish Clash - Database Schema (Drizzle ORM)
// Quarterly Financial Reports Schema
// ============================================================

import {
    pgTable,
    uuid,
    varchar,
    numeric,
    timestamp,
    pgEnum,
    index,
    integer,
} from 'drizzle-orm/pg-core';
import { symbols } from './symbols';

// Quarter enum
export const quarterEnum = pgEnum('quarter', ['Q1', 'Q2', 'Q3', 'Q4']);

// Fiscal year type
export const fiscalYearEnum = pgEnum('fiscal_year', [
    '2079/80', '2080/81', '2081/82', '2082/83', '2083/84', '2084/85'
]);

// Quarterly reports for Commercial Banks
// Key Indicators: Net Interest Margin (NIM), Non-Performing Loan (NPL), Return on Equity (ROE)
export const bankQuarterlyReports = pgTable('bank_quarterly_reports', {
    id: uuid('id').defaultRandom().primaryKey(),
    symbolId: uuid('symbol_id')
        .notNull()
        .references(() => symbols.id, { onDelete: 'cascade' }),

    // Time period
    fiscalYear: varchar('fiscal_year', { length: 10 }).notNull(), // e.g., '2082/83'
    quarter: quarterEnum('quarter').notNull(),

    // Key Indicators for Commercial Banks
    returnOnEquity: numeric('return_on_equity', { precision: 8, scale: 4 }), // ROE in %
    nonPerformingLoan: numeric('non_performing_loan', { precision: 8, scale: 4 }), // NPL in %
    netInterestMargin: numeric('net_interest_margin', { precision: 8, scale: 4 }), // NIM in %
    returnOnAssets: numeric('return_on_assets', { precision: 8, scale: 4 }), // ROA in %

    // Additional metrics
    revenue: numeric('revenue', { precision: 20, scale: 2 }),
    grossProfit: numeric('gross_profit', { precision: 20, scale: 2 }),
    netProfit: numeric('net_profit', { precision: 20, scale: 2 }),
    earningsPerShare: numeric('earnings_per_share', { precision: 15, scale: 2 }),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
    symbolQuarterIdx: index('bank_reports_symbol_quarter_idx')
        .on(table.symbolId, table.fiscalYear, table.quarter),
}));

// Quarterly reports for Hydropower Companies
// Key Indicators: Capacity Utilization, EPS, Debt-to-Equity, Operating (EBITDA) Margin
export const hydropowerQuarterlyReports = pgTable('hydropower_quarterly_reports', {
    id: uuid('id').defaultRandom().primaryKey(),
    symbolId: uuid('symbol_id')
        .notNull()
        .references(() => symbols.id, { onDelete: 'cascade' }),

    // Time period
    fiscalYear: varchar('fiscal_year', { length: 10 }).notNull(),
    quarter: quarterEnum('quarter').notNull(),

    // Key Indicators for Hydropower
    earningsPerShare: numeric('earnings_per_share', { precision: 15, scale: 2 }), // EPS in NPR
    capacityUtilization: numeric('capacity_utilization', { precision: 8, scale: 4 }), // in %
    debtToEquity: numeric('debt_to_equity', { precision: 8, scale: 4 }), // D/E ratio
    ebitdaMargin: numeric('ebitda_margin', { precision: 8, scale: 4 }), // Operating margin in %

    // Additional metrics
    revenue: numeric('revenue', { precision: 20, scale: 2 }),
    grossProfit: numeric('gross_profit', { precision: 20, scale: 2 }),
    netProfit: numeric('net_profit', { precision: 20, scale: 2 }),
    generationMWh: numeric('generation_mwh', { precision: 15, scale: 2 }), // Power generation

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
    symbolQuarterIdx: index('hydropower_reports_symbol_quarter_idx')
        .on(table.symbolId, table.fiscalYear, table.quarter),
}));

// Generic quarterly reports for other sectors (Insurance, Finance, etc.)
export const quarterlyReports = pgTable('quarterly_reports', {
    id: uuid('id').defaultRandom().primaryKey(),
    symbolId: uuid('symbol_id')
        .notNull()
        .references(() => symbols.id, { onDelete: 'cascade' }),

    // Time period
    fiscalYear: varchar('fiscal_year', { length: 10 }).notNull(),
    quarter: quarterEnum('quarter').notNull(),

    // Common financial metrics
    revenue: numeric('revenue', { precision: 20, scale: 2 }),
    grossProfit: numeric('gross_profit', { precision: 20, scale: 2 }),
    netProfit: numeric('net_profit', { precision: 20, scale: 2 }),
    earningsPerShare: numeric('earnings_per_share', { precision: 15, scale: 2 }),

    // Profitability ratios
    grossProfitMargin: numeric('gross_profit_margin', { precision: 8, scale: 4 }),
    netProfitMargin: numeric('net_profit_margin', { precision: 8, scale: 4 }),
    returnOnEquity: numeric('return_on_equity', { precision: 8, scale: 4 }),
    returnOnAssets: numeric('return_on_assets', { precision: 8, scale: 4 }),

    // Leverage ratios
    debtToEquity: numeric('debt_to_equity', { precision: 8, scale: 4 }),
    currentRatio: numeric('current_ratio', { precision: 8, scale: 4 }),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
    symbolQuarterIdx: index('quarterly_reports_symbol_quarter_idx')
        .on(table.symbolId, table.fiscalYear, table.quarter),
}));

// Type exports
export type BankQuarterlyReport = typeof bankQuarterlyReports.$inferSelect;
export type NewBankQuarterlyReport = typeof bankQuarterlyReports.$inferInsert;
export type HydropowerQuarterlyReport = typeof hydropowerQuarterlyReports.$inferSelect;
export type NewHydropowerQuarterlyReport = typeof hydropowerQuarterlyReports.$inferInsert;
export type QuarterlyReport = typeof quarterlyReports.$inferSelect;
export type NewQuarterlyReport = typeof quarterlyReports.$inferInsert;
