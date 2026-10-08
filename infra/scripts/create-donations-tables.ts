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
    console.log('--- Creating Donations & CRA Tax Receipts tables ---');
    await client.query(`
      CREATE TABLE IF NOT EXISTS "donor" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "party_id" uuid,
        "type" text NOT NULL DEFAULT 'individual',
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
        "created_at" timestamp with time zone NOT NULL DEFAULT now(),
        "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
        CONSTRAINT "donor_tenant_id_id_unique" UNIQUE ("tenant_id", "id")
      );

      CREATE TABLE IF NOT EXISTS "donation_campaign" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "code" text NOT NULL,
        "name" text NOT NULL,
        "description" text,
        "target_amount" numeric(19, 4),
        "collected_amount" numeric(19, 4) NOT NULL DEFAULT '0',
        "startDate" date,
        "endDate" date,
        "status" text NOT NULL DEFAULT 'active',
        "project_id" uuid,
        "created_at" timestamp with time zone NOT NULL DEFAULT now(),
        "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
        CONSTRAINT "donation_campaign_project_fk" FOREIGN KEY ("tenant_id", "project_id")
          REFERENCES "project"("tenant_id", "id") ON DELETE SET NULL,
        CONSTRAINT "donation_campaign_tenant_id_id_unique" UNIQUE ("tenant_id", "id"),
        CONSTRAINT "donation_campaign_tenant_id_code_unique" UNIQUE ("tenant_id", "code")
      );

      CREATE TABLE IF NOT EXISTS "donation" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "donor_id" uuid NOT NULL,
        "campaign_id" uuid,
        "project_id" uuid,
        "donation_number" text NOT NULL,
        "donation_date" timestamp with time zone NOT NULL DEFAULT now(),
        "gross_amount" numeric(19, 4) NOT NULL,
        "advantage_amount" numeric(19, 4) NOT NULL DEFAULT '0',
        "eligible_amount" numeric(19, 4) NOT NULL,
        "currency" text NOT NULL DEFAULT 'CAD',
        "payment_method" text NOT NULL DEFAULT 'interac',
        "payment_reference" text,
        "recurrence" text NOT NULL DEFAULT 'one_time',
        "status" text NOT NULL DEFAULT 'received',
        "is_tax_receipt_eligible" boolean NOT NULL DEFAULT true,
        "tax_receipt_id" uuid,
        "notes" text,
        "created_at" timestamp with time zone NOT NULL DEFAULT now(),
        "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
        CONSTRAINT "donation_donor_fk" FOREIGN KEY ("tenant_id", "donor_id")
          REFERENCES "donor"("tenant_id", "id") ON DELETE CASCADE,
        CONSTRAINT "donation_campaign_fk" FOREIGN KEY ("tenant_id", "campaign_id")
          REFERENCES "donation_campaign"("tenant_id", "id") ON DELETE SET NULL,
        CONSTRAINT "donation_project_fk" FOREIGN KEY ("tenant_id", "project_id")
          REFERENCES "project"("tenant_id", "id") ON DELETE SET NULL,
        CONSTRAINT "donation_tenant_id_id_unique" UNIQUE ("tenant_id", "id"),
        CONSTRAINT "donation_tenant_id_don_num_unique" UNIQUE ("tenant_id", "donation_number")
      );

      CREATE TABLE IF NOT EXISTS "tax_receipt" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "receipt_number" text NOT NULL,
        "donor_id" uuid NOT NULL,
        "type" text NOT NULL DEFAULT 'single_donation',
        "tax_year" integer NOT NULL,
        "issue_date" date NOT NULL,
        "location_issued" text NOT NULL DEFAULT 'Montréal, QC',
        "total_received_amount" numeric(19, 4) NOT NULL,
        "total_advantage_amount" numeric(19, 4) NOT NULL DEFAULT '0',
        "total_eligible_amount" numeric(19, 4) NOT NULL,
        "charity_registration_number" text NOT NULL,
        "status" text NOT NULL DEFAULT 'issued',
        "replaced_by_receipt_id" uuid,
        "replacement_reason" text,
        "authorized_signatory_name" text NOT NULL,
        "donor_snapshot" jsonb,
        "pdf_url" text,
        "created_at" timestamp with time zone NOT NULL DEFAULT now(),
        "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
        CONSTRAINT "tax_receipt_donor_fk" FOREIGN KEY ("tenant_id", "donor_id")
          REFERENCES "donor"("tenant_id", "id") ON DELETE CASCADE,
        CONSTRAINT "tax_receipt_tenant_id_id_unique" UNIQUE ("tenant_id", "id"),
        CONSTRAINT "tax_receipt_tenant_id_receipt_num_unique" UNIQUE ("tenant_id", "receipt_number")
      );

      ALTER TABLE "donor" ENABLE ROW LEVEL SECURITY;
      ALTER TABLE "donation_campaign" ENABLE ROW LEVEL SECURITY;
      ALTER TABLE "donation" ENABLE ROW LEVEL SECURITY;
      ALTER TABLE "tax_receipt" ENABLE ROW LEVEL SECURITY;

      DROP POLICY IF EXISTS tenant_isolation_policy ON "donor";
      CREATE POLICY tenant_isolation_policy ON "donor"
        FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

      DROP POLICY IF EXISTS tenant_isolation_policy ON "donation_campaign";
      CREATE POLICY tenant_isolation_policy ON "donation_campaign"
        FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

      DROP POLICY IF EXISTS tenant_isolation_policy ON "donation";
      CREATE POLICY tenant_isolation_policy ON "donation"
        FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

      DROP POLICY IF EXISTS tenant_isolation_policy ON "tax_receipt";
      CREATE POLICY tenant_isolation_policy ON "tax_receipt"
        FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
    `);

    console.log('✅ Donations & CRA Tax Receipts tables and RLS created successfully!');
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
