import pg from 'pg';

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:Information%402025@127.0.0.1:5432/orgdashio';

async function migrate() {
  const client = new pg.Client({ connectionString });
  await client.connect();

  console.log('📦 Application de la migration DDL pour les Programmes de Formation...');

  await client.query(`
    CREATE TABLE IF NOT EXISTS training_program (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES tenant_registry(id) ON DELETE CASCADE,
      code TEXT NOT NULL,
      title TEXT NOT NULL,
      objectives TEXT,
      prerequisites TEXT,
      target_audience TEXT,
      total_hours INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'published',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT training_program_tenant_id_id_uk UNIQUE (tenant_id, id),
      CONSTRAINT training_program_tenant_id_code_uk UNIQUE (tenant_id, code)
    );
  `);

  await client.query(`
    ALTER TABLE course 
    ADD COLUMN IF NOT EXISTS training_program_id UUID,
    ADD COLUMN IF NOT EXISTS objectives TEXT;
  `);

  console.log('✅ Migration DDL Programmes de formation exécutée avec succès.');
  await client.end();
}

migrate().catch((err) => {
  console.error('❌ Erreur migration:', err);
  process.exit(1);
});
