-- Add market impact columns to all 3 quarterly report tables
-- Reuses existing event_impact_type and price_update_type enums from events schema

ALTER TABLE "bank_quarterly_reports" ADD COLUMN "impact_magnitude" numeric(15, 4);
ALTER TABLE "bank_quarterly_reports" ADD COLUMN "impact_type" "event_impact_type";
ALTER TABLE "bank_quarterly_reports" ADD COLUMN "price_update_type" "price_update_type";
ALTER TABLE "bank_quarterly_reports" ADD COLUMN "is_executed" boolean NOT NULL DEFAULT false;
ALTER TABLE "bank_quarterly_reports" ADD COLUMN "scheduled_at" timestamp with time zone;
ALTER TABLE "bank_quarterly_reports" ADD COLUMN "executed_at" timestamp with time zone;
ALTER TABLE "bank_quarterly_reports" ADD COLUMN "previous_price" numeric(15, 2);
ALTER TABLE "bank_quarterly_reports" ADD COLUMN "new_price" numeric(15, 2);

ALTER TABLE "hydropower_quarterly_reports" ADD COLUMN "impact_magnitude" numeric(15, 4);
ALTER TABLE "hydropower_quarterly_reports" ADD COLUMN "impact_type" "event_impact_type";
ALTER TABLE "hydropower_quarterly_reports" ADD COLUMN "price_update_type" "price_update_type";
ALTER TABLE "hydropower_quarterly_reports" ADD COLUMN "is_executed" boolean NOT NULL DEFAULT false;
ALTER TABLE "hydropower_quarterly_reports" ADD COLUMN "scheduled_at" timestamp with time zone;
ALTER TABLE "hydropower_quarterly_reports" ADD COLUMN "executed_at" timestamp with time zone;
ALTER TABLE "hydropower_quarterly_reports" ADD COLUMN "previous_price" numeric(15, 2);
ALTER TABLE "hydropower_quarterly_reports" ADD COLUMN "new_price" numeric(15, 2);

ALTER TABLE "quarterly_reports" ADD COLUMN "impact_magnitude" numeric(15, 4);
ALTER TABLE "quarterly_reports" ADD COLUMN "impact_type" "event_impact_type";
ALTER TABLE "quarterly_reports" ADD COLUMN "price_update_type" "price_update_type";
ALTER TABLE "quarterly_reports" ADD COLUMN "is_executed" boolean NOT NULL DEFAULT false;
ALTER TABLE "quarterly_reports" ADD COLUMN "scheduled_at" timestamp with time zone;
ALTER TABLE "quarterly_reports" ADD COLUMN "executed_at" timestamp with time zone;
ALTER TABLE "quarterly_reports" ADD COLUMN "previous_price" numeric(15, 2);
ALTER TABLE "quarterly_reports" ADD COLUMN "new_price" numeric(15, 2);
