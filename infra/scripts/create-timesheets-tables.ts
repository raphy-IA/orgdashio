import 'dotenv/config';
import { Pool } from 'pg';

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }

  const pool = new Pool({ connectionString });
  const client = await pool.connect();

  try {
    console.log('--- Creating Timesheets & HR Analytic Allocation tables ---');
    await client.query(`
      CREATE TABLE IF NOT EXISTS "user_hr_profile" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "user_id" uuid NOT NULL REFERENCES "user_account"("id") ON DELETE CASCADE,
        "employee_number" text,
        "job_title" text,
        "department" text,
        "contract_type" text NOT NULL DEFAULT 'full_time',
        "standard_weekly_hours" numeric(6, 2) NOT NULL DEFAULT '35.00',
        "default_hourly_rate" numeric(10, 2) NOT NULL DEFAULT '30.00',
        "volunteer_imputed_rate" numeric(10, 2) NOT NULL DEFAULT '25.00',
        "active" boolean NOT NULL DEFAULT true,
        "created_at" timestamp with time zone NOT NULL DEFAULT now(),
        "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
        CONSTRAINT "user_hr_profile_tenant_id_id_unique" UNIQUE ("tenant_id", "id"),
        CONSTRAINT "user_hr_profile_tenant_id_user_id_unique" UNIQUE ("tenant_id", "user_id")
      );

      CREATE TABLE IF NOT EXISTS "timesheet" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "user_id" uuid NOT NULL REFERENCES "user_account"("id") ON DELETE CASCADE,
        "period_start_date" date NOT NULL,
        "period_end_date" date NOT NULL,
        "status" text NOT NULL DEFAULT 'draft',
        "total_hours" numeric(10, 2) NOT NULL DEFAULT '0',
        "total_cost" numeric(19, 4) NOT NULL DEFAULT '0',
        "submitted_at" timestamp with time zone,
        "reviewed_by_user_id" uuid REFERENCES "user_account"("id") ON DELETE SET NULL,
        "reviewed_at" timestamp with time zone,
        "review_notes" text,
        "created_at" timestamp with time zone NOT NULL DEFAULT now(),
        "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
        CONSTRAINT "timesheet_tenant_id_id_unique" UNIQUE ("tenant_id", "id"),
        CONSTRAINT "timesheet_tenant_id_user_period_unique" UNIQUE ("tenant_id", "user_id", "period_start_date")
      );

      CREATE TABLE IF NOT EXISTS "timesheet_entry" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "timesheet_id" uuid NOT NULL,
        "project_id" uuid,
        "grant_id" uuid,
        "plan_item_id" uuid,
        "activity_type" text NOT NULL DEFAULT 'direct_program',
        "entry_date" date NOT NULL,
        "hours" numeric(6, 2) NOT NULL,
        "hourly_rate" numeric(10, 2) NOT NULL DEFAULT '0',
        "calculated_cost" numeric(19, 4) NOT NULL DEFAULT '0',
        "description" text,
        "is_billable" boolean NOT NULL DEFAULT true,
        "created_at" timestamp with time zone NOT NULL DEFAULT now(),
        "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
        CONSTRAINT "timesheet_entry_timesheet_fk" FOREIGN KEY ("tenant_id", "timesheet_id")
          REFERENCES "timesheet"("tenant_id", "id") ON DELETE CASCADE,
        CONSTRAINT "timesheet_entry_project_fk" FOREIGN KEY ("tenant_id", "project_id")
          REFERENCES "project"("tenant_id", "id") ON DELETE SET NULL,
        CONSTRAINT "timesheet_entry_grant_fk" FOREIGN KEY ("tenant_id", "grant_id")
          REFERENCES "grant_record"("tenant_id", "id") ON DELETE SET NULL,
        CONSTRAINT "timesheet_entry_tenant_id_id_unique" UNIQUE ("tenant_id", "id")
      );

      ALTER TABLE "user_hr_profile" ENABLE ROW LEVEL SECURITY;
      ALTER TABLE "timesheet" ENABLE ROW LEVEL SECURITY;
      ALTER TABLE "timesheet_entry" ENABLE ROW LEVEL SECURITY;

      DROP POLICY IF EXISTS tenant_isolation_policy ON "user_hr_profile";
      CREATE POLICY tenant_isolation_policy ON "user_hr_profile"
        FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

      DROP POLICY IF EXISTS tenant_isolation_policy ON "timesheet";
      CREATE POLICY tenant_isolation_policy ON "timesheet"
        FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

      DROP POLICY IF EXISTS tenant_isolation_policy ON "timesheet_entry";
      CREATE POLICY tenant_isolation_policy ON "timesheet_entry"
        FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
    `);

    console.log('✅ Timesheets tables and RLS created successfully!');
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
