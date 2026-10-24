import pg from 'pg';

const connectionString =
  process.env.DATABASE_URL ||
  'postgres://postgres:Information%402025@127.0.0.1:5432/orgdashio';

async function migrate() {
  const client = new pg.Client({ connectionString });
  await client.connect();

  console.log('🚀 Application de la migration pour l\'enrichissement des Programmes et Indicateurs...');

  try {
    // 1. Enrich table program
    await client.query(`
      ALTER TABLE "program" 
      ADD COLUMN IF NOT EXISTS "thematic_pillar" TEXT,
      ADD COLUMN IF NOT EXISTS "lead_manager_name" TEXT,
      ADD COLUMN IF NOT EXISTS "lead_manager_email" TEXT,
      ADD COLUMN IF NOT EXISTS "strategic_objectives" TEXT,
      ADD COLUMN IF NOT EXISTS "start_date" DATE,
      ADD COLUMN IF NOT EXISTS "end_date" DATE,
      ADD COLUMN IF NOT EXISTS "target_budget" NUMERIC(19, 4) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "target_beneficiaries_count" INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "primary_donor_name" TEXT,
      ADD COLUMN IF NOT EXISTS "review_cadence" TEXT DEFAULT 'quarterly';
    `);
    console.log('✅ Colonnes ajoutées à la table "program".');

    // 2. Add program_id to indicator
    await client.query(`
      ALTER TABLE "indicator"
      ADD COLUMN IF NOT EXISTS "program_id" UUID;
    `);

    // Add Foreign key constraint on indicator.program_id if not exists
    await client.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'indicator_program_id_program_id_fk'
        ) THEN
          ALTER TABLE "indicator"
          ADD CONSTRAINT "indicator_program_id_program_id_fk"
          FOREIGN KEY ("tenant_id", "program_id")
          REFERENCES "program"("tenant_id", "id")
          ON DELETE CASCADE;
        END IF;
      END $$;
    `);
    console.log('✅ Colonnes et contraintes ajoutées à la table "indicator".');

    console.log('🎉 Migration DDL pour les Programmes terminée avec succès !');
  } catch (error) {
    console.error('❌ Erreur lors de la migration :', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();
