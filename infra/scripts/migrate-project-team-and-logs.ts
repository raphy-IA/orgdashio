import pg from 'pg';

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:Information%402025@127.0.0.1:5432/orgdashio';

async function migrate() {
  const client = new pg.Client({ connectionString });
  await client.connect();

  console.log('📦 Exécution de la migration : Tables project_member, plan_item_update, plan_item_deliverable...');
  
  await client.query(`
    CREATE TABLE IF NOT EXISTS project_member (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL,
      project_id UUID NOT NULL REFERENCES project(id) ON DELETE CASCADE,
      user_id UUID,
      name TEXT NOT NULL,
      email TEXT,
      role TEXT NOT NULL DEFAULT 'contributor',
      raci_role TEXT NOT NULL DEFAULT 'R',
      allocation_pct INT NOT NULL DEFAULT 100,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS plan_item_update (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL,
      plan_item_id UUID NOT NULL REFERENCES plan_item(id) ON DELETE CASCADE,
      author_name TEXT NOT NULL,
      author_user_id UUID,
      progress_pct INT,
      status TEXT,
      comment TEXT NOT NULL,
      blocker_reason TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS plan_item_deliverable (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL,
      plan_item_id UUID NOT NULL REFERENCES plan_item(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      file_url TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      verified_by TEXT,
      verified_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
