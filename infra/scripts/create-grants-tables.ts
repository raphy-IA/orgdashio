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
    console.log('--- Creating Grants & Funder Management tables ---');
    await client.query(`
      CREATE TABLE IF NOT EXISTS "grant_record" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "code" text NOT NULL,
        "title" text NOT NULL,
        "funder_name" text NOT NULL,
        "funder_type" text NOT NULL DEFAULT 'foundation',
        "program_name" text,
        "project_id" uuid,
        "status" text NOT NULL DEFAULT 'prospect',
        "requested_amount" numeric(19, 4) NOT NULL DEFAULT '0',
        "awarded_amount" numeric(19, 4) DEFAULT '0',
        "currency" text NOT NULL DEFAULT 'CAD',
        "submission_deadline" date,
        "submitted_at" date,
        "start_date" date,
        "end_date" date,
        "manager_user_id" uuid REFERENCES "user_account"("id") ON DELETE SET NULL,
        "notes" text,
        "contract_url" text,
        "created_at" timestamp with time zone NOT NULL DEFAULT now(),
        "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
        CONSTRAINT "grant_record_tenant_id_id_unique" UNIQUE ("tenant_id", "id"),
        CONSTRAINT "grant_record_tenant_id_code_unique" UNIQUE ("tenant_id", "code")
      );

      CREATE TABLE IF NOT EXISTS "grant_installment" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "grant_id" uuid NOT NULL,
        "installment_number" integer NOT NULL DEFAULT 1,
        "expected_date" date NOT NULL,
        "amount" numeric(19, 4) NOT NULL,
        "status" text NOT NULL DEFAULT 'scheduled',
        "received_at" date,
        "received_amount" numeric(19, 4),
        "conditions" text,
        "created_at" timestamp with time zone NOT NULL DEFAULT now(),
        CONSTRAINT "grant_installment_grant_fk" FOREIGN KEY ("tenant_id", "grant_id")
          REFERENCES "grant_record"("tenant_id", "id") ON DELETE CASCADE,
        CONSTRAINT "grant_installment_tenant_id_id_unique" UNIQUE ("tenant_id", "id")
      );

      CREATE TABLE IF NOT EXISTS "grant_deliverable" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "grant_id" uuid NOT NULL,
        "title" text NOT NULL,
        "deliverable_type" text NOT NULL DEFAULT 'narrative_report',
        "due_date" date NOT NULL,
        "status" text NOT NULL DEFAULT 'pending',
        "submitted_at" date,
        "notes" text,
        "file_url" text,
        "created_at" timestamp with time zone NOT NULL DEFAULT now(),
        CONSTRAINT "grant_deliverable_grant_fk" FOREIGN KEY ("tenant_id", "grant_id")
          REFERENCES "grant_record"("tenant_id", "id") ON DELETE CASCADE,
        CONSTRAINT "grant_deliverable_tenant_id_id_unique" UNIQUE ("tenant_id", "id")
      );

      ALTER TABLE "grant_record" ENABLE ROW LEVEL SECURITY;
      ALTER TABLE "grant_installment" ENABLE ROW LEVEL SECURITY;
      ALTER TABLE "grant_deliverable" ENABLE ROW LEVEL SECURITY;

      DROP POLICY IF EXISTS tenant_isolation_policy ON "grant_record";
      CREATE POLICY tenant_isolation_policy ON "grant_record"
        FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

      DROP POLICY IF EXISTS tenant_isolation_policy ON "grant_installment";
      CREATE POLICY tenant_isolation_policy ON "grant_installment"
        FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

      DROP POLICY IF EXISTS tenant_isolation_policy ON "grant_deliverable";
      CREATE POLICY tenant_isolation_policy ON "grant_deliverable"
        FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
    `);

    console.log('✅ Grants tables and RLS isolation created successfully!');
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
