DO $$ BEGIN
 CREATE TYPE "competition_status" AS ENUM('draft', 'scheduled', 'active', 'paused', 'ended');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "event_impact_type" AS ENUM('positive', 'negative', 'neutral');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "price_update_type" AS ENUM('percentage', 'absolute', 'override');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "user_role" AS ENUM('admin', 'participant');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "sector" AS ENUM('Commercial Bank', 'Development Bank', 'Finance', 'Microfinance', 'Life Insurance', 'Non Life Insurance', 'Hydropower', 'Manufacturing', 'Hotel', 'Trading', 'Others');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "order_side" AS ENUM('buy', 'sell');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "order_status" AS ENUM('pending', 'filled', 'partial', 'cancelled', 'rejected');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "order_type" AS ENUM('market', 'limit');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "competition_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"competition_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "competitions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"status" "competition_status" DEFAULT 'draft' NOT NULL,
	"starting_cash" numeric(15, 2) DEFAULT '1000000' NOT NULL,
	"commission_rate" numeric(8, 6) DEFAULT '0.004' NOT NULL,
	"max_position_size" numeric(15, 2),
	"max_daily_trades" integer,
	"allow_short_selling" boolean DEFAULT false NOT NULL,
	"allow_margin" boolean DEFAULT false NOT NULL,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone NOT NULL,
	"trading_hours_start" varchar(10) DEFAULT '11:00',
	"trading_hours_end" varchar(10) DEFAULT '15:00',
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "admin_audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_id" uuid NOT NULL,
	"action" varchar(100) NOT NULL,
	"resource" varchar(100) NOT NULL,
	"resource_id" uuid,
	"details" jsonb,
	"ip_address" varchar(45),
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "event_execution_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"symbol_id" uuid NOT NULL,
	"previous_price" numeric(15, 2) NOT NULL,
	"new_price" numeric(15, 2) NOT NULL,
	"change" numeric(15, 2) NOT NULL,
	"change_percent" numeric(8, 4) NOT NULL,
	"executed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "market_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"impact_type" "event_impact_type" NOT NULL,
	"price_update_type" "price_update_type" NOT NULL,
	"magnitude" numeric(15, 4) NOT NULL,
	"affected_symbols" jsonb DEFAULT '[]'::jsonb,
	"affect_all_symbols" boolean DEFAULT false NOT NULL,
	"is_executed" boolean DEFAULT false NOT NULL,
	"scheduled_at" timestamp with time zone,
	"executed_at" timestamp with time zone,
	"created_by" uuid NOT NULL,
	"executed_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "refresh_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "refresh_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"username" varchar(50) NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"role" "user_role" DEFAULT 'participant' NOT NULL,
	"avatar_url" text,
	"phone" varchar(20),
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "latest_prices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"symbol_id" uuid NOT NULL,
	"price" numeric(15, 2) NOT NULL,
	"previous_close" numeric(15, 2) NOT NULL,
	"open" numeric(15, 2) NOT NULL,
	"high" numeric(15, 2) NOT NULL,
	"low" numeric(15, 2) NOT NULL,
	"volume" bigint DEFAULT 0 NOT NULL,
	"change" numeric(15, 2) DEFAULT '0' NOT NULL,
	"change_percent" numeric(8, 4) DEFAULT '0' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "latest_prices_symbol_id_unique" UNIQUE("symbol_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "price_candles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"symbol_id" uuid NOT NULL,
	"interval" varchar(10) NOT NULL,
	"timestamp" timestamp with time zone NOT NULL,
	"open" numeric(15, 2) NOT NULL,
	"high" numeric(15, 2) NOT NULL,
	"low" numeric(15, 2) NOT NULL,
	"close" numeric(15, 2) NOT NULL,
	"volume" bigint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "price_ticks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"symbol_id" uuid NOT NULL,
	"price" numeric(15, 2) NOT NULL,
	"previous_price" numeric(15, 2) NOT NULL,
	"change" numeric(15, 2) NOT NULL,
	"change_percent" numeric(8, 4) NOT NULL,
	"volume" bigint DEFAULT 0 NOT NULL,
	"event_id" uuid,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "symbols" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"symbol" varchar(20) NOT NULL,
	"company_name" varchar(255) NOT NULL,
	"sector" "sector" NOT NULL,
	"listed_shares" bigint,
	"logo_url" text,
	"base_price" numeric(15, 2) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "symbols_symbol_unique" UNIQUE("symbol")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "holdings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"competition_id" uuid NOT NULL,
	"symbol_id" uuid NOT NULL,
	"quantity" integer DEFAULT 0 NOT NULL,
	"avg_price" numeric(15, 2) NOT NULL,
	"total_cost" numeric(15, 2) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ledger_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"competition_id" uuid NOT NULL,
	"type" varchar(50) NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"balance_after" numeric(15, 2) NOT NULL,
	"reference_id" uuid,
	"description" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"competition_id" uuid NOT NULL,
	"symbol_id" uuid NOT NULL,
	"side" "order_side" NOT NULL,
	"type" "order_type" DEFAULT 'market' NOT NULL,
	"quantity" integer NOT NULL,
	"price" numeric(15, 2),
	"filled_quantity" integer DEFAULT 0 NOT NULL,
	"avg_filled_price" numeric(15, 2),
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"commission" numeric(15, 2) DEFAULT '0' NOT NULL,
	"rejection_reason" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "portfolios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"competition_id" uuid NOT NULL,
	"cash" numeric(15, 2) NOT NULL,
	"realized_pl" numeric(15, 2) DEFAULT '0' NOT NULL,
	"trade_count" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "trades" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"competition_id" uuid NOT NULL,
	"symbol_id" uuid NOT NULL,
	"side" "order_side" NOT NULL,
	"quantity" integer NOT NULL,
	"price" numeric(15, 2) NOT NULL,
	"total" numeric(15, 2) NOT NULL,
	"commission" numeric(15, 2) NOT NULL,
	"executed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "watchlist" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"symbol_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "admin_audit_logs_admin_id_idx" ON "admin_audit_logs" ("admin_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "admin_audit_logs_action_idx" ON "admin_audit_logs" ("action");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "admin_audit_logs_created_at_idx" ON "admin_audit_logs" ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "event_execution_logs_event_id_idx" ON "event_execution_logs" ("event_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "event_execution_logs_symbol_id_idx" ON "event_execution_logs" ("symbol_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "market_events_is_executed_idx" ON "market_events" ("is_executed");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "market_events_scheduled_at_idx" ON "market_events" ("scheduled_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "market_events_created_at_idx" ON "market_events" ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "latest_prices_symbol_id_idx" ON "latest_prices" ("symbol_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "price_candles_symbol_interval_timestamp_idx" ON "price_candles" ("symbol_id","interval","timestamp");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "price_ticks_symbol_id_idx" ON "price_ticks" ("symbol_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "price_ticks_timestamp_idx" ON "price_ticks" ("timestamp");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "price_ticks_symbol_timestamp_idx" ON "price_ticks" ("symbol_id","timestamp");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "holdings_user_competition_symbol_idx" ON "holdings" ("user_id","competition_id","symbol_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ledger_entries_user_id_idx" ON "ledger_entries" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ledger_entries_created_at_idx" ON "ledger_entries" ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_user_id_idx" ON "orders" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_symbol_id_idx" ON "orders" ("symbol_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_status_idx" ON "orders" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_created_at_idx" ON "orders" ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "portfolios_user_competition_idx" ON "portfolios" ("user_id","competition_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "trades_user_id_idx" ON "trades" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "trades_symbol_id_idx" ON "trades" ("symbol_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "trades_executed_at_idx" ON "trades" ("executed_at");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "competition_participants" ADD CONSTRAINT "competition_participants_competition_id_competitions_id_fk" FOREIGN KEY ("competition_id") REFERENCES "competitions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "admin_audit_logs" ADD CONSTRAINT "admin_audit_logs_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "event_execution_logs" ADD CONSTRAINT "event_execution_logs_event_id_market_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "market_events"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "market_events" ADD CONSTRAINT "market_events_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "market_events" ADD CONSTRAINT "market_events_executed_by_users_id_fk" FOREIGN KEY ("executed_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "latest_prices" ADD CONSTRAINT "latest_prices_symbol_id_symbols_id_fk" FOREIGN KEY ("symbol_id") REFERENCES "symbols"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "price_candles" ADD CONSTRAINT "price_candles_symbol_id_symbols_id_fk" FOREIGN KEY ("symbol_id") REFERENCES "symbols"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "price_ticks" ADD CONSTRAINT "price_ticks_symbol_id_symbols_id_fk" FOREIGN KEY ("symbol_id") REFERENCES "symbols"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "holdings" ADD CONSTRAINT "holdings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "holdings" ADD CONSTRAINT "holdings_competition_id_competitions_id_fk" FOREIGN KEY ("competition_id") REFERENCES "competitions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "holdings" ADD CONSTRAINT "holdings_symbol_id_symbols_id_fk" FOREIGN KEY ("symbol_id") REFERENCES "symbols"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_competition_id_competitions_id_fk" FOREIGN KEY ("competition_id") REFERENCES "competitions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "orders" ADD CONSTRAINT "orders_competition_id_competitions_id_fk" FOREIGN KEY ("competition_id") REFERENCES "competitions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "orders" ADD CONSTRAINT "orders_symbol_id_symbols_id_fk" FOREIGN KEY ("symbol_id") REFERENCES "symbols"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "portfolios" ADD CONSTRAINT "portfolios_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "portfolios" ADD CONSTRAINT "portfolios_competition_id_competitions_id_fk" FOREIGN KEY ("competition_id") REFERENCES "competitions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "trades" ADD CONSTRAINT "trades_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "trades" ADD CONSTRAINT "trades_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "trades" ADD CONSTRAINT "trades_competition_id_competitions_id_fk" FOREIGN KEY ("competition_id") REFERENCES "competitions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "trades" ADD CONSTRAINT "trades_symbol_id_symbols_id_fk" FOREIGN KEY ("symbol_id") REFERENCES "symbols"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "watchlist" ADD CONSTRAINT "watchlist_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "watchlist" ADD CONSTRAINT "watchlist_symbol_id_symbols_id_fk" FOREIGN KEY ("symbol_id") REFERENCES "symbols"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
