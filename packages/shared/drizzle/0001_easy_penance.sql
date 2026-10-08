CREATE TABLE IF NOT EXISTS "case_referral" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"case_file_id" uuid NOT NULL,
	"organization_name" text NOT NULL,
	"service_type" text NOT NULL,
	"contact_person" text,
	"contact_phone" text,
	"contact_email" text,
	"reason" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"referred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"outcome_notes" text,
	CONSTRAINT "case_referral_tenant_id_id_unique" UNIQUE("tenant_id","id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "donation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"donor_id" uuid NOT NULL,
	"campaign_id" uuid,
	"project_id" uuid,
	"donation_number" text NOT NULL,
	"donation_date" timestamp with time zone DEFAULT now() NOT NULL,
	"gross_amount" numeric(19, 4) NOT NULL,
	"advantage_amount" numeric(19, 4) DEFAULT '0' NOT NULL,
	"eligible_amount" numeric(19, 4) NOT NULL,
	"currency" text DEFAULT 'CAD' NOT NULL,
	"payment_method" text DEFAULT 'interac' NOT NULL,
	"payment_reference" text,
	"recurrence" text DEFAULT 'one_time' NOT NULL,
	"status" text DEFAULT 'received' NOT NULL,
	"is_tax_receipt_eligible" boolean DEFAULT true NOT NULL,
	"tax_receipt_id" uuid,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "donation_tenant_id_id_unique" UNIQUE("tenant_id","id"),
	CONSTRAINT "donation_tenant_id_donation_number_unique" UNIQUE("tenant_id","donation_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "donation_campaign" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"target_amount" numeric(19, 4),
	"collected_amount" numeric(19, 4) DEFAULT '0' NOT NULL,
	"start_date" date,
	"end_date" date,
	"status" text DEFAULT 'active' NOT NULL,
	"project_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "donation_campaign_tenant_id_id_unique" UNIQUE("tenant_id","id"),
	CONSTRAINT "donation_campaign_tenant_id_code_unique" UNIQUE("tenant_id","code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "donor" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"party_id" uuid,
	"type" text DEFAULT 'individual' NOT NULL,
	"first_name" text,
	"last_name" text,
	"company_name" text,
	"email" text,
	"phone" text,
	"tax_address" text,
	"tax_city" text,
	"tax_state_province" text DEFAULT 'QC',
	"tax_postal_code" text,
	"tax_country" text DEFAULT 'Canada',
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "donor_tenant_id_id_unique" UNIQUE("tenant_id","id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "funder_organization" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"type" text DEFAULT 'foundation' NOT NULL,
	"contact_person" text,
	"contact_email" text,
	"contact_phone" text,
	"website" text,
	"address" text,
	"city" text,
	"state_province" text DEFAULT 'QC',
	"postal_code" text,
	"country" text DEFAULT 'Canada',
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "funder_organization_tenant_id_id_unique" UNIQUE("tenant_id","id"),
	CONSTRAINT "funder_organization_tenant_id_code_unique" UNIQUE("tenant_id","code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "grant_deliverable" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"grant_id" uuid NOT NULL,
	"title" text NOT NULL,
	"deliverable_type" text DEFAULT 'narrative_report' NOT NULL,
	"due_date" date NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"submitted_at" date,
	"notes" text,
	"file_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "grant_deliverable_tenant_id_id_unique" UNIQUE("tenant_id","id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "grant_installment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"grant_id" uuid NOT NULL,
	"installment_number" integer DEFAULT 1 NOT NULL,
	"expected_date" date NOT NULL,
	"amount" numeric(19, 4) NOT NULL,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"received_at" date,
	"received_amount" numeric(19, 4),
	"conditions" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "grant_installment_tenant_id_id_unique" UNIQUE("tenant_id","id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "grant_record" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"funder_id" uuid,
	"code" text NOT NULL,
	"title" text NOT NULL,
	"funder_name" text NOT NULL,
	"funder_type" text DEFAULT 'foundation' NOT NULL,
	"program_name" text,
	"project_id" uuid,
	"status" text DEFAULT 'prospect' NOT NULL,
	"requested_amount" numeric(19, 4) DEFAULT '0' NOT NULL,
	"awarded_amount" numeric(19, 4) DEFAULT '0',
	"currency" text DEFAULT 'CAD' NOT NULL,
	"submission_deadline" date,
	"submitted_at" date,
	"start_date" date,
	"end_date" date,
	"manager_user_id" uuid,
	"notes" text,
	"contract_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "grant_record_tenant_id_id_unique" UNIQUE("tenant_id","id"),
	CONSTRAINT "grant_record_tenant_id_code_unique" UNIQUE("tenant_id","code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "intervention_goal" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"plan_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"target_date" date,
	"status" text DEFAULT 'in_progress' NOT NULL,
	"achieved_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "intervention_goal_tenant_id_id_unique" UNIQUE("tenant_id","id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "intervention_plan" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"case_file_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'active' NOT NULL,
	"start_date" date,
	"review_date" date,
	"created_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "intervention_plan_tenant_id_id_unique" UNIQUE("tenant_id","id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subscription_plan" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"price_monthly" numeric(19, 4) DEFAULT '0' NOT NULL,
	"price_annual" numeric(19, 4) DEFAULT '0' NOT NULL,
	"max_users" integer DEFAULT 5 NOT NULL,
	"max_storage_gb" integer DEFAULT 5 NOT NULL,
	"max_projects" integer DEFAULT 5 NOT NULL,
	"features" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subscription_plan_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tax_receipt" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"receipt_number" text NOT NULL,
	"donor_id" uuid NOT NULL,
	"type" text DEFAULT 'single_donation' NOT NULL,
	"tax_year" integer NOT NULL,
	"issue_date" date NOT NULL,
	"location_issued" text DEFAULT 'Montréal, QC' NOT NULL,
	"total_received_amount" numeric(19, 4) NOT NULL,
	"total_advantage_amount" numeric(19, 4) DEFAULT '0' NOT NULL,
	"total_eligible_amount" numeric(19, 4) NOT NULL,
	"charity_registration_number" text NOT NULL,
	"status" text DEFAULT 'issued' NOT NULL,
	"replaced_by_receipt_id" uuid,
	"replacement_reason" text,
	"authorized_signatory_name" text NOT NULL,
	"donor_snapshot" jsonb,
	"pdf_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tax_receipt_tenant_id_id_unique" UNIQUE("tenant_id","id"),
	CONSTRAINT "tax_receipt_tenant_id_receipt_number_unique" UNIQUE("tenant_id","receipt_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tenant_invoice" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"invoice_number" text NOT NULL,
	"plan_name" text NOT NULL,
	"billing_cycle" text DEFAULT 'monthly' NOT NULL,
	"subtotal" numeric(19, 4) NOT NULL,
	"tax_tps" numeric(19, 4) DEFAULT '0' NOT NULL,
	"tax_tvq" numeric(19, 4) DEFAULT '0' NOT NULL,
	"total" numeric(19, 4) NOT NULL,
	"currency" text DEFAULT 'CAD' NOT NULL,
	"status" text DEFAULT 'paid' NOT NULL,
	"paid_at" timestamp with time zone,
	"period_start" timestamp with time zone DEFAULT now() NOT NULL,
	"period_end" timestamp with time zone DEFAULT now() NOT NULL,
	"pdf_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tenant_invoice_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tenant_subscription" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"plan_code" text DEFAULT 'starter' NOT NULL,
	"billing_cycle" text DEFAULT 'monthly' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"seat_count" integer DEFAULT 5 NOT NULL,
	"current_period_start" timestamp with time zone DEFAULT now() NOT NULL,
	"current_period_end" timestamp with time zone,
	"trial_ends_at" timestamp with time zone,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"payment_method_last4" text,
	"payment_method_brand" text,
	"billing_email" text,
	"billing_address" text,
	"neq_number" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tenant_subscription_tenant_id_unique" UNIQUE("tenant_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "timesheet" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"period_start_date" date NOT NULL,
	"period_end_date" date NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"total_hours" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total_cost" numeric(19, 4) DEFAULT '0' NOT NULL,
	"submitted_at" timestamp with time zone,
	"reviewed_by_user_id" uuid,
	"reviewed_at" timestamp with time zone,
	"review_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "timesheet_tenant_id_id_unique" UNIQUE("tenant_id","id"),
	CONSTRAINT "timesheet_tenant_id_user_id_period_start_date_unique" UNIQUE("tenant_id","user_id","period_start_date")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "timesheet_entry" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"timesheet_id" uuid NOT NULL,
	"project_id" uuid,
	"grant_id" uuid,
	"plan_item_id" uuid,
	"activity_type" text DEFAULT 'direct_program' NOT NULL,
	"entry_date" date NOT NULL,
	"hours" numeric(6, 2) NOT NULL,
	"hourly_rate" numeric(10, 2) DEFAULT '0' NOT NULL,
	"calculated_cost" numeric(19, 4) DEFAULT '0' NOT NULL,
	"description" text,
	"is_billable" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "timesheet_entry_tenant_id_id_unique" UNIQUE("tenant_id","id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_hr_profile" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"employee_number" text,
	"job_title" text,
	"department" text,
	"contract_type" text DEFAULT 'full_time' NOT NULL,
	"standard_weekly_hours" numeric(6, 2) DEFAULT '35.00' NOT NULL,
	"default_hourly_rate" numeric(10, 2) DEFAULT '30.00' NOT NULL,
	"volunteer_imputed_rate" numeric(10, 2) DEFAULT '25.00' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_hr_profile_tenant_id_id_unique" UNIQUE("tenant_id","id"),
	CONSTRAINT "user_hr_profile_tenant_id_user_id_unique" UNIQUE("tenant_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "indicator" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "indicator" ADD COLUMN "means_of_verification" text;--> statement-breakpoint
ALTER TABLE "indicator" ADD COLUMN "disaggregation_dimensions" jsonb;--> statement-breakpoint
ALTER TABLE "indicator" ADD COLUMN "status" text DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "indicator" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "indicator_observation" ADD COLUMN "disaggregation_data" jsonb;--> statement-breakpoint
ALTER TABLE "indicator_observation" ADD COLUMN "source_file_url" text;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "start_date" date;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "end_date" date;--> statement-breakpoint
ALTER TABLE "tenant_registry" ADD COLUMN "charity_registration_number" text;--> statement-breakpoint
ALTER TABLE "tenant_registry" ADD COLUMN "authorized_signer_name" text;--> statement-breakpoint
ALTER TABLE "tenant_registry" ADD COLUMN "authorized_signer_title" text;--> statement-breakpoint
ALTER TABLE "tenant_registry" ADD COLUMN "currency" text DEFAULT 'CAD';--> statement-breakpoint
ALTER TABLE "tenant_registry" ADD COLUMN "fiscal_year_end" text DEFAULT '12-31';--> statement-breakpoint
ALTER TABLE "tenant_registry" ADD COLUMN "timezone" text DEFAULT 'America/Toronto';--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "case_referral" ADD CONSTRAINT "case_referral_tenant_id_case_file_id_case_file_tenant_id_id_fk" FOREIGN KEY ("tenant_id","case_file_id") REFERENCES "public"."case_file"("tenant_id","id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "donation" ADD CONSTRAINT "donation_tenant_id_donor_id_donor_tenant_id_id_fk" FOREIGN KEY ("tenant_id","donor_id") REFERENCES "public"."donor"("tenant_id","id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "donation" ADD CONSTRAINT "donation_tenant_id_campaign_id_donation_campaign_tenant_id_id_fk" FOREIGN KEY ("tenant_id","campaign_id") REFERENCES "public"."donation_campaign"("tenant_id","id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "donation" ADD CONSTRAINT "donation_tenant_id_project_id_project_tenant_id_id_fk" FOREIGN KEY ("tenant_id","project_id") REFERENCES "public"."project"("tenant_id","id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "donation_campaign" ADD CONSTRAINT "donation_campaign_tenant_id_project_id_project_tenant_id_id_fk" FOREIGN KEY ("tenant_id","project_id") REFERENCES "public"."project"("tenant_id","id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "funder_organization" ADD CONSTRAINT "funder_organization_tenant_id_tenant_registry_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant_registry"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "grant_deliverable" ADD CONSTRAINT "grant_deliverable_tenant_id_grant_id_grant_record_tenant_id_id_fk" FOREIGN KEY ("tenant_id","grant_id") REFERENCES "public"."grant_record"("tenant_id","id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "grant_installment" ADD CONSTRAINT "grant_installment_tenant_id_grant_id_grant_record_tenant_id_id_fk" FOREIGN KEY ("tenant_id","grant_id") REFERENCES "public"."grant_record"("tenant_id","id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "grant_record" ADD CONSTRAINT "grant_record_manager_user_id_user_account_id_fk" FOREIGN KEY ("manager_user_id") REFERENCES "public"."user_account"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "grant_record" ADD CONSTRAINT "grant_record_tenant_id_funder_id_funder_organization_tenant_id_id_fk" FOREIGN KEY ("tenant_id","funder_id") REFERENCES "public"."funder_organization"("tenant_id","id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "grant_record" ADD CONSTRAINT "grant_record_tenant_id_project_id_project_tenant_id_id_fk" FOREIGN KEY ("tenant_id","project_id") REFERENCES "public"."project"("tenant_id","id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "intervention_goal" ADD CONSTRAINT "intervention_goal_tenant_id_plan_id_intervention_plan_tenant_id_id_fk" FOREIGN KEY ("tenant_id","plan_id") REFERENCES "public"."intervention_plan"("tenant_id","id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "intervention_plan" ADD CONSTRAINT "intervention_plan_created_by_user_id_user_account_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "intervention_plan" ADD CONSTRAINT "intervention_plan_tenant_id_case_file_id_case_file_tenant_id_id_fk" FOREIGN KEY ("tenant_id","case_file_id") REFERENCES "public"."case_file"("tenant_id","id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tax_receipt" ADD CONSTRAINT "tax_receipt_tenant_id_donor_id_donor_tenant_id_id_fk" FOREIGN KEY ("tenant_id","donor_id") REFERENCES "public"."donor"("tenant_id","id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tenant_invoice" ADD CONSTRAINT "tenant_invoice_tenant_id_tenant_registry_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant_registry"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tenant_subscription" ADD CONSTRAINT "tenant_subscription_tenant_id_tenant_registry_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant_registry"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "timesheet" ADD CONSTRAINT "timesheet_user_id_user_account_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_account"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "timesheet" ADD CONSTRAINT "timesheet_reviewed_by_user_id_user_account_id_fk" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "public"."user_account"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "timesheet_entry" ADD CONSTRAINT "timesheet_entry_tenant_id_timesheet_id_timesheet_tenant_id_id_fk" FOREIGN KEY ("tenant_id","timesheet_id") REFERENCES "public"."timesheet"("tenant_id","id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "timesheet_entry" ADD CONSTRAINT "timesheet_entry_tenant_id_project_id_project_tenant_id_id_fk" FOREIGN KEY ("tenant_id","project_id") REFERENCES "public"."project"("tenant_id","id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "timesheet_entry" ADD CONSTRAINT "timesheet_entry_tenant_id_grant_id_grant_record_tenant_id_id_fk" FOREIGN KEY ("tenant_id","grant_id") REFERENCES "public"."grant_record"("tenant_id","id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_hr_profile" ADD CONSTRAINT "user_hr_profile_user_id_user_account_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_account"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
