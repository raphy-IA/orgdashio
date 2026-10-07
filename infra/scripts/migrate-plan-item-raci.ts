import pg from 'pg';

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:Information%402025@127.0.0.1:5432/orgdashio';

async function migrate() {
  const client = new pg.Client({ connectionString });
  await client.connect();

  console.log('📦 Exécution de la migration : Table plan_item_raci et colonne party_id...');
  
  await client.query(`
    ALTER TABLE project_member ADD COLUMN IF NOT EXISTS party_id UUID;

    CREATE TABLE IF NOT EXISTS plan_item_raci (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL,
      project_id UUID NOT NULL REFERENCES project(id) ON DELETE CASCADE,
      plan_item_id UUID NOT NULL REFERENCES plan_item(id) ON DELETE CASCADE,
      project_member_id UUID NOT NULL REFERENCES project_member(id) ON DELETE CASCADE,
      raci_role TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT plan_item_raci_item_member_uk UNIQUE (tenant_id, plan_item_id, project_member_id)
    );
  `);

  console.log('✅ Migration terminée avec succès.');
  await client.end();
  process.exit(0);
}

migrate().catch((err) => {
  console.error('❌ Erreur lors de la migration:', err);
  process.exit(1);
});
