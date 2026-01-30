DO $$ BEGIN
 CREATE TYPE "remark_type" AS ENUM('trade_justification', 'strategy', 'risk_assessment', 'market_sentiment');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN ALTER TYPE "bid_status" ADD VALUE 'accepted'; EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN ALTER TYPE "bid_status" ADD VALUE 'getting_ready'; EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN ALTER TYPE "bid_status" ADD VALUE 'processed'; EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN ALTER TYPE "competition_status" ADD VALUE 'bidding'; EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN ALTER TYPE "competition_status" ADD VALUE 'remarks'; EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "trade_remarks" RENAME TO "remarks"; EXCEPTION WHEN undefined_table THEN null; WHEN duplicate_table THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "bids" RENAME COLUMN "bid_price" TO "price"; EXCEPTION WHEN undefined_column THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "remarks" DROP CONSTRAINT "trade_remarks_competition_id_competitions_id_fk"; EXCEPTION WHEN undefined_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "remarks" DROP CONSTRAINT "trade_remarks_user_id_users_id_fk"; EXCEPTION WHEN undefined_object THEN null; END $$;
--> statement-breakpoint
DROP INDEX IF EXISTS "bids_symbol_id_idx";
--> statement-breakpoint
DROP INDEX IF EXISTS "bids_competition_symbol_idx";
--> statement-breakpoint
DROP INDEX IF EXISTS "trade_remarks_competition_id_idx";
--> statement-breakpoint
DROP INDEX IF EXISTS "trade_remarks_user_id_idx";
--> statement-breakpoint
DROP INDEX IF EXISTS "trade_remarks_unique_idx";
--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "bids" ALTER COLUMN "allocated_quantity" DROP NOT NULL; EXCEPTION WHEN undefined_column THEN null; END $$;
--> statement-breakpoint
ALTER TABLE "competitions"
ADD COLUMN IF NOT EXISTS "is_leaderboard_hidden" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "must_change_password" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "remarks" ADD COLUMN IF NOT EXISTS "symbol_id" uuid;
--> statement-breakpoint
ALTER TABLE "remarks"
ADD COLUMN IF NOT EXISTS "type" "remark_type" DEFAULT 'trade_justification' NOT NULL;
--> statement-breakpoint
ALTER TABLE "remarks" ADD COLUMN IF NOT EXISTS "score" integer;
--> statement-breakpoint
ALTER TABLE "remarks" ADD COLUMN IF NOT EXISTS "title" varchar(255);
--> statement-breakpoint
ALTER TABLE "remarks"
ADD COLUMN IF NOT EXISTS "created_at" timestamp
with
    time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bids_status_idx" ON "bids" ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bids_user_competition_idx" ON "bids" ("user_id", "competition_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "remarks_user_competition_idx" ON "remarks" ("user_id", "competition_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "remarks_user_competition_symbol_idx" ON "remarks" (
    "user_id",
    "competition_id",
    "symbol_id"
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "remarks" ADD CONSTRAINT "remarks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;

EXCEPTION WHEN duplicate_object THEN null;

END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "remarks" ADD CONSTRAINT "remarks_competition_id_competitions_id_fk" FOREIGN KEY ("competition_id") REFERENCES "competitions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "remarks" ADD CONSTRAINT "remarks_symbol_id_symbols_id_fk" FOREIGN KEY ("symbol_id") REFERENCES "symbols"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "competitions" DROP COLUMN IF EXISTS "current_phase";
--> statement-breakpoint
ALTER TABLE "competitions" DROP COLUMN IF EXISTS "current_cycle";
--> statement-breakpoint
ALTER TABLE "competitions" DROP COLUMN IF EXISTS "total_cycles";
--> statement-breakpoint
ALTER TABLE "competitions" DROP COLUMN IF EXISTS "cycle_duration";
--> statement-breakpoint
ALTER TABLE "symbols" DROP COLUMN IF EXISTS "total_quantity";
--> statement-breakpoint
ALTER TABLE "remarks" DROP COLUMN IF EXISTS "submitted_at";