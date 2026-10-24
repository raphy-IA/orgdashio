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
    console.log('--- 1. Checking columns in tenant_registry ---');
    const colsRes = await client.query(`
      SELECT column_name FROM information_schema.columns WHERE table_name = 'tenant_registry'
    `);
    const existingCols = colsRes.rows.map((r: any) => r.column_name);
    console.log('Existing columns in tenant_registry:', existingCols);

    console.log('--- 2. Applying missing columns to tenant_registry ---');
    await client.query(`
      ALTER TABLE "tenant_registry"
      ADD COLUMN IF NOT EXISTS "max_users_override" integer,
      ADD COLUMN IF NOT EXISTS "max_storage_gb_override" integer,
      ADD COLUMN IF NOT EXISTS "max_projects_override" integer,
      ADD COLUMN IF NOT EXISTS "allowed_modules" jsonb,
      ADD COLUMN IF NOT EXISTS "health_score" integer DEFAULT 100,
      ADD COLUMN IF NOT EXISTS "billing_contact_name" text,
      ADD COLUMN IF NOT EXISTS "billing_contact_phone" text;
    `);

    console.log('--- 3. Creating system_announcement, security_incident, tenant_feature_flag if not existing ---');
    await client.query(`
      CREATE TABLE IF NOT EXISTS "system_announcement" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "title" text NOT NULL,
        "message" text NOT NULL,
        "severity" text NOT NULL DEFAULT 'info',
        "target_tenant_id" uuid REFERENCES "tenant_registry"("id") ON DELETE CASCADE,
        "is_active" boolean NOT NULL DEFAULT true,
        "starts_at" timestamp with time zone,
        "ends_at" timestamp with time zone,
        "created_at" timestamp with time zone NOT NULL DEFAULT now(),
        "updated_at" timestamp with time zone NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS "security_incident" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid REFERENCES "tenant_registry"("id") ON DELETE SET NULL,
        "title" text NOT NULL,
        "description" text NOT NULL,
        "severity" text NOT NULL DEFAULT 'high',
        "status" text NOT NULL DEFAULT 'investigating',
        "impacted_users_count" integer NOT NULL DEFAULT 0,
        "containment_steps" text,
        "notified_cai" boolean NOT NULL DEFAULT false,
        "cai_reference_number" text,
        "notified_at" timestamp with time zone,
        "resolved_at" timestamp with time zone,
        "reported_by_user_id" uuid REFERENCES "user_account"("id") ON DELETE SET NULL,
        "created_at" timestamp with time zone NOT NULL DEFAULT now(),
        "updated_at" timestamp with time zone NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS "tenant_feature_flag" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "target_tenant_id" uuid REFERENCES "tenant_registry"("id") ON DELETE CASCADE,
        "feature_key" text NOT NULL,
        "is_enabled" boolean NOT NULL DEFAULT false,
        "description" text,
        "config" jsonb,
        "updated_at" timestamp with time zone NOT NULL DEFAULT now()
      );
    `);

    console.log('--- 4. Checking user direction@centre-espoir.ca ---');
    const userRes = await client.query(`
      SELECT u.id, u.email, u.status, u.is_platform_admin, c.secret_hash
      FROM user_account u
      LEFT JOIN user_credential c ON c.user_id = u.id
      WHERE u.email ILIKE '%centre-espoir%'
    `);
    console.log('Found user accounts:', userRes.rows);

    const allUsers = await client.query(`SELECT id, email, status, is_platform_admin FROM user_account`);
    console.log('All users:', allUsers.rows);

    const allTenants = await client.query(`SELECT id, name, slug, email, status FROM tenant_registry`);
    console.log('All tenants:', allTenants.rows);

    console.log('--- Migration & Inspection completed successfully ---');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
