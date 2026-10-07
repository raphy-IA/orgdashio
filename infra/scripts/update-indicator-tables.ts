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
    console.log('--- Updating indicator & indicator_observation columns ---');
    await client.query(`
      ALTER TABLE "indicator" 
        ADD COLUMN IF NOT EXISTS "description" text,
        ADD COLUMN IF NOT EXISTS "means_of_verification" text,
        ADD COLUMN IF NOT EXISTS "disaggregation_dimensions" jsonb,
        ADD COLUMN IF NOT EXISTS "status" text NOT NULL DEFAULT 'active',
        ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone NOT NULL DEFAULT now();

      ALTER TABLE "indicator_observation"
        ADD COLUMN IF NOT EXISTS "disaggregation_data" jsonb,
        ADD COLUMN IF NOT EXISTS "source_file_url" text;
    `);
    console.log('✅ Indicator tables updated successfully!');
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
