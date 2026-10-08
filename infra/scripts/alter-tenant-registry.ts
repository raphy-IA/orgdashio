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
    console.log('--- Altering tenant_registry table with enhanced organization settings ---');
    await client.query(`
      ALTER TABLE "tenant_registry"
      ADD COLUMN IF NOT EXISTS "charity_registration_number" text,
      ADD COLUMN IF NOT EXISTS "authorized_signer_name" text,
      ADD COLUMN IF NOT EXISTS "authorized_signer_title" text,
      ADD COLUMN IF NOT EXISTS "currency" text DEFAULT 'CAD',
      ADD COLUMN IF NOT EXISTS "fiscal_year_end" text DEFAULT '12-31',
      ADD COLUMN IF NOT EXISTS "timezone" text DEFAULT 'America/Toronto';
    `);

    console.log('--- Alterations completed successfully ---');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
