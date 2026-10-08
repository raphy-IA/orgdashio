import pg from 'pg';
import * as fs from 'fs';
import * as path from 'path';

async function resetAndSyncDatabase() {
  const connectionString =
    process.env.DATABASE_URL ||
    'postgres://postgres:Information%402025@127.0.0.1:5432/orgdashio';

  const client = new pg.Client({ connectionString });
  await client.connect();

  console.log('🔄 ==========================================');
  console.log('🔄 Réinitialisation & Synchronisation Complète');
  console.log('🔄 ==========================================');

  try {
    // 1. Drop & Recreate Public Schema
    console.log('1️⃣ Nettoyage complet du schéma public...');
    await client.query(`
      DROP SCHEMA IF EXISTS public CASCADE;
      CREATE SCHEMA public;
      GRANT ALL ON SCHEMA public TO public;
    `);
    console.log('✅ Schéma public réinitialisé à neuf.');

    // 2. Apply Full Migration DDLs
    let drizzleDir = path.resolve(process.cwd(), 'packages/shared/drizzle');
    if (!fs.existsSync(drizzleDir)) {
      drizzleDir = path.resolve(__dirname, '../../packages/shared/drizzle');
    }
    if (!fs.existsSync(drizzleDir)) {
      throw new Error(`Dossier de migration DDL introuvable : ${drizzleDir}`);
    }

    const migrationFiles = fs
      .readdirSync(drizzleDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    console.log(`2️⃣ Application des migrations DDL (${migrationFiles.length} fichier(s))...`);
    for (const file of migrationFiles) {
      const fullPath = path.join(drizzleDir, file);
      console.log(`   ➜ Exécution de ${file}...`);
      const ddlSql = fs.readFileSync(fullPath, 'utf-8');
      const statements = ddlSql.split('--> statement-breakpoint');
      for (const stmt of statements) {
        const trimmed = stmt.trim();
        if (trimmed) {
          await client.query(trimmed);
        }
      }
    }
    console.log('✅ Tables, clés étrangères et contraintes créées avec succès.');

    // 3. Inject Seed Data
    let seedFile = path.resolve(process.cwd(), 'infra/seeds/test-database-seed.sql');
    if (!fs.existsSync(seedFile)) {
      seedFile = path.resolve(__dirname, '../seeds/test-database-seed.sql');
    }
    if (fs.existsSync(seedFile)) {
      console.log('3️⃣ Injection des données de référence (Seed Data)...');
      const seedSql = fs.readFileSync(seedFile, 'utf-8');
      await client.query(seedSql);
      console.log('✅ Données de référence injectées avec succès.');
    }

    // 4. Activate & Force RLS on all tenant tables
    console.log('4️⃣ Activation et Forçage de la sécurité RLS...');
    const tablesQuery = `
      SELECT c.table_name
      FROM information_schema.columns c
      JOIN information_schema.tables t ON c.table_name = t.table_name
      WHERE c.column_name = 'tenant_id'
        AND c.table_schema = 'public'
        AND t.table_type = 'BASE TABLE';
    `;
    const res = await client.query(tablesQuery);
    const tenantTables: string[] = res.rows.map((r) => r.table_name);

    for (const tableName of tenantTables) {
      await client.query(`ALTER TABLE "${tableName}" ENABLE ROW LEVEL SECURITY;`);
      await client.query(`ALTER TABLE "${tableName}" FORCE ROW LEVEL SECURITY;`);
      await client.query(`DROP POLICY IF EXISTS tenant_isolation_policy ON "${tableName}";`);
      await client.query(`
        CREATE POLICY tenant_isolation_policy ON "${tableName}"
        FOR ALL
        USING (
          tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
        )
        WITH CHECK (
          tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
        );
      `);
    }
    console.log(`✅ RLS activée et forcée sur l'ensemble des ${tenantTables.length} tables multi-tenants.`);

    console.log('\n🎉 Base de données initialisée et synchronisée à 100% avec succès !');
  } catch (error) {
    console.error('❌ Erreur lors de la réinitialisation :', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

resetAndSyncDatabase();
