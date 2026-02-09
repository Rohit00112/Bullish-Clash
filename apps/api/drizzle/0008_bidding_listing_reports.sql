-- ============================================================
-- Migration: Add bidding floor price, listing status, quarterly reports, and news impacts
-- ============================================================

-- Add floor price and listing status to symbols table
ALTER TABLE "symbols" ADD COLUMN IF NOT EXISTS "floor_price" numeric(15, 2);
ALTER TABLE "symbols" ADD COLUMN IF NOT EXISTS "is_tradeable" boolean DEFAULT false NOT NULL;
ALTER TABLE "symbols" ADD COLUMN IF NOT EXISTS "went_through_bidding" boolean DEFAULT false NOT NULL;

-- Add per-symbol impacts to market events
ALTER TABLE "market_events" ADD COLUMN IF NOT EXISTS "symbol_impacts" jsonb DEFAULT '{}';

-- Create quarter enum
DO $$ BEGIN
    CREATE TYPE "quarter" AS ENUM('Q1', 'Q2', 'Q3', 'Q4');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create bank quarterly reports table
CREATE TABLE IF NOT EXISTS "bank_quarterly_reports" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "symbol_id" uuid NOT NULL REFERENCES "symbols"("id") ON DELETE CASCADE,
    "fiscal_year" varchar(10) NOT NULL,
    "quarter" "quarter" NOT NULL,
    "return_on_equity" numeric(8, 4),
    "non_performing_loan" numeric(8, 4),
    "net_interest_margin" numeric(8, 4),
    "return_on_assets" numeric(8, 4),
    "revenue" numeric(20, 2),
    "gross_profit" numeric(20, 2),
    "net_profit" numeric(20, 2),
    "earnings_per_share" numeric(15, 2),
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "bank_reports_symbol_quarter_idx" ON "bank_quarterly_reports" ("symbol_id", "fiscal_year", "quarter");

-- Create hydropower quarterly reports table
CREATE TABLE IF NOT EXISTS "hydropower_quarterly_reports" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "symbol_id" uuid NOT NULL REFERENCES "symbols"("id") ON DELETE CASCADE,
    "fiscal_year" varchar(10) NOT NULL,
    "quarter" "quarter" NOT NULL,
    "earnings_per_share" numeric(15, 2),
    "capacity_utilization" numeric(8, 4),
    "debt_to_equity" numeric(8, 4),
    "ebitda_margin" numeric(8, 4),
    "revenue" numeric(20, 2),
    "gross_profit" numeric(20, 2),
    "net_profit" numeric(20, 2),
    "generation_mwh" numeric(15, 2),
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "hydropower_reports_symbol_quarter_idx" ON "hydropower_quarterly_reports" ("symbol_id", "fiscal_year", "quarter");

-- Create generic quarterly reports table for other sectors
CREATE TABLE IF NOT EXISTS "quarterly_reports" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "symbol_id" uuid NOT NULL REFERENCES "symbols"("id") ON DELETE CASCADE,
    "fiscal_year" varchar(10) NOT NULL,
    "quarter" "quarter" NOT NULL,
    "revenue" numeric(20, 2),
    "gross_profit" numeric(20, 2),
    "net_profit" numeric(20, 2),
    "earnings_per_share" numeric(15, 2),
    "gross_profit_margin" numeric(8, 4),
    "net_profit_margin" numeric(8, 4),
    "return_on_equity" numeric(8, 4),
    "return_on_assets" numeric(8, 4),
    "debt_to_equity" numeric(8, 4),
    "current_ratio" numeric(8, 4),
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "quarterly_reports_symbol_quarter_idx" ON "quarterly_reports" ("symbol_id", "fiscal_year", "quarter");
