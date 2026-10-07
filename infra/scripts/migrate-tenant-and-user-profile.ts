import pg from 'pg';

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:Information%402025@127.0.0.1:5432/orgdashio';

async function migrate() {
  const client = new pg.Client({ connectionString });
  await client.connect();

  console.log('📦 Exécution de la migration : Champs profil organisme et profil utilisateur...');
  
  await client.query(`
    -- Tenant Registry additions
    ALTER TABLE tenant_registry ADD COLUMN IF NOT EXISTS logo_url TEXT;
    ALTER TABLE tenant_registry ADD COLUMN IF NOT EXISTS acronym TEXT;
    ALTER TABLE tenant_registry ADD COLUMN IF NOT EXISTS description TEXT;
    ALTER TABLE tenant_registry ADD COLUMN IF NOT EXISTS org_type TEXT DEFAULT 'OBNL / NPO (Organisme à but non lucratif)';
    ALTER TABLE tenant_registry ADD COLUMN IF NOT EXISTS neq_number TEXT;
    ALTER TABLE tenant_registry ADD COLUMN IF NOT EXISTS address TEXT;
    ALTER TABLE tenant_registry ADD COLUMN IF NOT EXISTS phone TEXT;
    ALTER TABLE tenant_registry ADD COLUMN IF NOT EXISTS email TEXT;
    ALTER TABLE tenant_registry ADD COLUMN IF NOT EXISTS website TEXT;
    ALTER TABLE tenant_registry ADD COLUMN IF NOT EXISTS privacy_officer_name TEXT;
    ALTER TABLE tenant_registry ADD COLUMN IF NOT EXISTS privacy_officer_email TEXT;
    ALTER TABLE tenant_registry ADD COLUMN IF NOT EXISTS data_retention_months INTEGER DEFAULT 60;

    -- User Account additions
    ALTER TABLE user_account ADD COLUMN IF NOT EXISTS first_name TEXT;
    ALTER TABLE user_account ADD COLUMN IF NOT EXISTS last_name TEXT;
    ALTER TABLE user_account ADD COLUMN IF NOT EXISTS avatar_url TEXT;
    ALTER TABLE user_account ADD COLUMN IF NOT EXISTS phone TEXT;
    ALTER TABLE user_account ADD COLUMN IF NOT EXISTS job_title TEXT;
  `);

  console.log('✅ Migration des profils terminée avec succès.');
  await client.end();
  process.exit(0);
}

migrate().catch((err) => {
  console.error('❌ Erreur lors de la migration:', err);
  process.exit(1);
});
