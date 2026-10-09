ALTER TABLE "plan_item" ADD COLUMN IF NOT EXISTS "description" text;--> statement-breakpoint
ALTER TABLE "plan_item" ADD COLUMN IF NOT EXISTS "objectives" text;--> statement-breakpoint
ALTER TABLE "plan_item" ADD COLUMN IF NOT EXISTS "deliverables_expected" text;--> statement-breakpoint
ALTER TABLE "plan_item" ADD COLUMN IF NOT EXISTS "estimated_cost" numeric(19, 4) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "plan_item" ADD COLUMN IF NOT EXISTS "optimistic_days" integer;--> statement-breakpoint
ALTER TABLE "plan_item" ADD COLUMN IF NOT EXISTS "most_likely_days" integer;--> statement-breakpoint
ALTER TABLE "plan_item" ADD COLUMN IF NOT EXISTS "pessimistic_days" integer;--> statement-breakpoint
ALTER TABLE "plan_item_deliverable" ADD COLUMN IF NOT EXISTS "review_comment" text;--> statement-breakpoint
ALTER TABLE "plan_item_update" ADD COLUMN IF NOT EXISTS "attachment_url" text;