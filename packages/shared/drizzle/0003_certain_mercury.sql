CREATE TABLE IF NOT EXISTS "security_incident" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"severity" text DEFAULT 'high' NOT NULL,
	"status" text DEFAULT 'investigating' NOT NULL,
	"impacted_users_count" integer DEFAULT 0 NOT NULL,
	"containment_steps" text,
	"notified_cai" boolean DEFAULT false NOT NULL,
	"cai_reference_number" text,
	"notified_at" timestamp with time zone,
	"resolved_at" timestamp with time zone,
	"reported_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "system_announcement" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"severity" text DEFAULT 'info' NOT NULL,
	"target_tenant_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tenant_feature_flag" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"target_tenant_id" uuid,
	"feature_key" text NOT NULL,
	"is_enabled" boolean DEFAULT false NOT NULL,
	"description" text,
	"config" jsonb,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "indicator" ADD COLUMN "program_id" uuid;--> statement-breakpoint
ALTER TABLE "program" ADD COLUMN "thematic_pillar" text;--> statement-breakpoint
ALTER TABLE "program" ADD COLUMN "lead_manager_name" text;--> statement-breakpoint
ALTER TABLE "program" ADD COLUMN "lead_manager_email" text;--> statement-breakpoint
ALTER TABLE "program" ADD COLUMN "strategic_objectives" text;--> statement-breakpoint
ALTER TABLE "program" ADD COLUMN "start_date" date;--> statement-breakpoint
ALTER TABLE "program" ADD COLUMN "end_date" date;--> statement-breakpoint
ALTER TABLE "program" ADD COLUMN "target_budget" numeric(19, 4) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "program" ADD COLUMN "target_beneficiaries_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "program" ADD COLUMN "primary_donor_name" text;--> statement-breakpoint
ALTER TABLE "program" ADD COLUMN "review_cadence" text DEFAULT 'quarterly';--> statement-breakpoint
ALTER TABLE "tenant_registry" ADD COLUMN "max_users_override" integer;--> statement-breakpoint
ALTER TABLE "tenant_registry" ADD COLUMN "max_storage_gb_override" integer;--> statement-breakpoint
ALTER TABLE "tenant_registry" ADD COLUMN "max_projects_override" integer;--> statement-breakpoint
ALTER TABLE "tenant_registry" ADD COLUMN "allowed_modules" jsonb;--> statement-breakpoint
ALTER TABLE "tenant_registry" ADD COLUMN "health_score" integer DEFAULT 100;--> statement-breakpoint
ALTER TABLE "tenant_registry" ADD COLUMN "billing_contact_name" text;--> statement-breakpoint
ALTER TABLE "tenant_registry" ADD COLUMN "billing_contact_phone" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "security_incident" ADD CONSTRAINT "security_incident_tenant_id_tenant_registry_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant_registry"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "security_incident" ADD CONSTRAINT "security_incident_reported_by_user_id_user_account_id_fk" FOREIGN KEY ("reported_by_user_id") REFERENCES "public"."user_account"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "system_announcement" ADD CONSTRAINT "system_announcement_target_tenant_id_tenant_registry_id_fk" FOREIGN KEY ("target_tenant_id") REFERENCES "public"."tenant_registry"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tenant_feature_flag" ADD CONSTRAINT "tenant_feature_flag_target_tenant_id_tenant_registry_id_fk" FOREIGN KEY ("target_tenant_id") REFERENCES "public"."tenant_registry"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "indicator" ADD CONSTRAINT "indicator_tenant_id_program_id_program_tenant_id_id_fk" FOREIGN KEY ("tenant_id","program_id") REFERENCES "public"."program"("tenant_id","id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
