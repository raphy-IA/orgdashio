import pg from 'pg';

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:Information%402025@127.0.0.1:5432/orgdashio';

async function migrate() {
  const client = new pg.Client({ connectionString });
  await client.connect();

  console.log('📦 Application de la migration DDL N-N Program-Project...');

  await client.query(`
    CREATE TABLE IF NOT EXISTS program_project (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES tenant_registry(id) ON DELETE CASCADE,
      program_id UUID NOT NULL REFERENCES program(id) ON DELETE CASCADE,
      project_id UUID NOT NULL REFERENCES project(id) ON DELETE CASCADE,
      CONSTRAINT pp_tenant_program_project_uk UNIQUE (tenant_id, program_id, project_id),
      CONSTRAINT pp_tenant_id_id_uk UNIQUE (tenant_id, id)
    );
  `);

  console.log('✅ Migration DDL N-N Program-Project exécutée avec succès.');
  await client.end();
}

migrate().catch((err) => {
  console.error('❌ Erreur migration:', err);
  process.exit(1);
});
