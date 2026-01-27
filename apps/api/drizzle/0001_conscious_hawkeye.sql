ALTER TYPE "order_status" ADD VALUE 'open';--> statement-breakpoint
ALTER TYPE "order_status" ADD VALUE 'expired';--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "remaining_quantity" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "priority" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "expires_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_order_book_idx" ON "orders" ("symbol_id","side","status","price");