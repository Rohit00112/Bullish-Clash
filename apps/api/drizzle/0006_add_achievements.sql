DO $$ BEGIN
 CREATE TYPE "achievement_type" AS ENUM('first_trade', 'profit_10', 'profit_25', 'profit_50', 'profit_100', 'diamond_hands', 'day_trader', 'diversified', 'market_master', 'early_bird', 'night_owl', 'comeback_king', 'winning_streak', 'volume_trader', 'top_10', 'top_3', 'champion');
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
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid () NOT NULL,
    "user_id" uuid NOT NULL,
    "competition_id" uuid,
    "achievement_id" text NOT NULL,
    "earned_at" timestamp DEFAULT now() NOT NULL,
    "metadata" text
);
--> statement-breakpoint
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