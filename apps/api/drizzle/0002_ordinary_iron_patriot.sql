DO $$ BEGIN
 CREATE TYPE "achievement_type" AS ENUM('first_trade', 'profit_10', 'profit_25', 'profit_50', 'profit_100', 'diamond_hands', 'day_trader', 'diversified', 'market_master', 'early_bird', 'night_owl', 'comeback_king', 'winning_streak', 'volume_trader', 'top_10', 'top_3', 'champion');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "bid_status" AS ENUM('pending', 'filled', 'partial', 'rejected');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "competition_phase" AS ENUM('registration', 'bidding', 'trading', 'remarks', 'ended');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "achievement_definitions" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"icon" text NOT NULL,
	"category" text NOT NULL,
	"points" integer DEFAULT 10 NOT NULL,
	"rarity" text DEFAULT 'common' NOT NULL,
	"is_secret" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_achievements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"competition_id" uuid,
	"achievement_id" text NOT NULL,
	"earned_at" timestamp DEFAULT now() NOT NULL,
	"metadata" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bids" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"competition_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"symbol_id" uuid NOT NULL,
	"bid_price" numeric(15, 2) NOT NULL,
	"quantity" integer NOT NULL,
	"status" "bid_status" DEFAULT 'pending' NOT NULL,
	"allocated_quantity" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "trade_remarks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"competition_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"content" text NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "competitions" ADD COLUMN "current_phase" "competition_phase" DEFAULT 'registration' NOT NULL;--> statement-breakpoint
ALTER TABLE "competitions" ADD COLUMN "current_cycle" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "competitions" ADD COLUMN "total_cycles" integer DEFAULT 10 NOT NULL;--> statement-breakpoint
ALTER TABLE "competitions" ADD COLUMN "cycle_duration" integer DEFAULT 15 NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bids_competition_id_idx" ON "bids" ("competition_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bids_user_id_idx" ON "bids" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bids_symbol_id_idx" ON "bids" ("symbol_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bids_competition_symbol_idx" ON "bids" ("competition_id","symbol_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "trade_remarks_competition_id_idx" ON "trade_remarks" ("competition_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "trade_remarks_user_id_idx" ON "trade_remarks" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "trade_remarks_unique_idx" ON "trade_remarks" ("competition_id","user_id");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_competition_id_competitions_id_fk" FOREIGN KEY ("competition_id") REFERENCES "competitions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_achievement_id_achievement_definitions_id_fk" FOREIGN KEY ("achievement_id") REFERENCES "achievement_definitions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bids" ADD CONSTRAINT "bids_competition_id_competitions_id_fk" FOREIGN KEY ("competition_id") REFERENCES "competitions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bids" ADD CONSTRAINT "bids_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bids" ADD CONSTRAINT "bids_symbol_id_symbols_id_fk" FOREIGN KEY ("symbol_id") REFERENCES "symbols"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "trade_remarks" ADD CONSTRAINT "trade_remarks_competition_id_competitions_id_fk" FOREIGN KEY ("competition_id") REFERENCES "competitions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "trade_remarks" ADD CONSTRAINT "trade_remarks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
