import pg from 'pg';

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:Information%402025@127.0.0.1:5432/orgdashio';

async function migrate() {
  const client = new pg.Client({ connectionString });
  await client.connect();

  console.log('📦 Exécution de la migration : Table staff_profile...');
  
  await client.query(`
    CREATE TABLE IF NOT EXISTS staff_profile (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL,
      party_id UUID NOT NULL REFERENCES party(id) ON DELETE CASCADE,
      user_id UUID REFERENCES user_account(id) ON DELETE SET NULL,
      job_title TEXT NOT NULL,
      department_id UUID REFERENCES org_unit(id) ON DELETE SET NULL,
      employment_type TEXT NOT NULL DEFAULT 'employee',
      status TEXT NOT NULL DEFAULT 'active',
      hire_date DATE,
      emergency_contact TEXT,
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT staff_profile_tenant_party_uk UNIQUE (tenant_id, party_id)
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
