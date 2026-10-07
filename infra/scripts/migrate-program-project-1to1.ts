import pg from 'pg';

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:Information%402025@127.0.0.1:5432/orgdashio';

async function migrate() {
  const client = new pg.Client({ connectionString });
  await client.connect();

  console.log('📦 Mise à jour de la contrainte DDL : 1 Projet -> max 1 Programme...');

  // Clean duplicate project entries keeping the latest
  await client.query(`
    DELETE FROM program_project a
    USING program_project b
    WHERE a.id < b.id
      AND a.tenant_id = b.tenant_id
      AND a.project_id = b.project_id;
  `);

  // Drop old unique constraint if present
  await client.query(`
    ALTER TABLE program_project
    DROP CONSTRAINT IF EXISTS pp_tenant_program_project_uk;
  `);

  // Add new unique constraint on (tenant_id, project_id)
  await client.query(`
    ALTER TABLE program_project
    ADD CONSTRAINT pp_tenant_project_uk UNIQUE (tenant_id, project_id);
  `);

  console.log('✅ Contrainte d’unicité par projet appliquée avec succès (1 projet ➔ max 1 programme).');
  await client.end();
}

migrate().catch((err) => {
  console.error('❌ Erreur migration:', err);
  process.exit(1);
});
