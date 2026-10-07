import pg from 'pg';

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:Information%402025@127.0.0.1:5432/orgdashio';

async function migrate() {
  const client = new pg.Client({ connectionString });
  await client.connect();

  console.log('📦 Application de la migration DDL N-N Program-Course & Sessions Dates...');

  await client.query(`
    CREATE TABLE IF NOT EXISTS training_program_course (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES tenant_registry(id) ON DELETE CASCADE,
      training_program_id UUID NOT NULL REFERENCES training_program(id) ON DELETE CASCADE,
      course_id UUID NOT NULL REFERENCES course(id) ON DELETE CASCADE,
      sort_order INTEGER NOT NULL DEFAULT 0,
      CONSTRAINT tpc_tenant_program_course_uk UNIQUE (tenant_id, training_program_id, course_id),
      CONSTRAINT tpc_tenant_id_id_uk UNIQUE (tenant_id, id)
    );
  `);

  await client.query(`
    ALTER TABLE training_session
    ADD COLUMN IF NOT EXISTS training_program_id UUID REFERENCES training_program(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS start_date DATE,
    ADD COLUMN IF NOT EXISTS end_date DATE;
  `);

  await client.query(`
    ALTER TABLE training_session
    ALTER COLUMN course_id DROP NOT NULL;
  `);

  console.log('✅ Migration DDL N-N et Sessions exécutée avec succès.');
  await client.end();
}

migrate().catch((err) => {
  console.error('❌ Erreur migration:', err);
  process.exit(1);
});
