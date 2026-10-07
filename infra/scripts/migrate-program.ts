import pg from 'pg';

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:Information%402025@127.0.0.1:5432/orgdashio';

async function migrate() {
  const client = new pg.Client({ connectionString });
  await client.connect();

  console.log('📦 Application de la migration DDL pour les Programmes...');

  await client.query(`
    CREATE TABLE IF NOT EXISTS program (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES tenant_registry(id) ON DELETE CASCADE,
      code TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT program_tenant_id_id_uk UNIQUE (tenant_id, id),
      CONSTRAINT program_tenant_id_code_uk UNIQUE (tenant_id, code)
    );
  `);

  await client.query(`
    ALTER TABLE project 
    ADD COLUMN IF NOT EXISTS program_id UUID;
  `);

  console.log('✅ Migration DDL exécutée avec succès.');
  await client.end();
}

migrate().catch((err) => {
  console.error('❌ Erreur migration:', err);
  process.exit(1);
});
