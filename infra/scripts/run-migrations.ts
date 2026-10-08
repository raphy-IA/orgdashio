import pg from 'pg';
import * as fs from 'fs';
import * as path from 'path';

async function runMigrations() {
  const connectionString =
    process.env.DATABASE_URL ||
    'postgres://postgres:Information%402025@127.0.0.1:5432/orgdashio';

  const client = new pg.Client({ connectionString });
  await client.connect();

  console.log('🛡️ ========================================================');
  console.log('🛡️ Exécution des Migrations Non-Destructives (Production)');
  console.log('🛡️ ========================================================');

  try {
    // 1. Ensure migrations table exists to track applied migrations
    await client.query(`
      CREATE TABLE IF NOT EXISTS "__app_migrations" (
        "id" SERIAL PRIMARY KEY,
        "name" VARCHAR(255) NOT NULL UNIQUE,
        "applied_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
    `);

    // 2. Find all migration files
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

    // Check which migrations were already applied
    const appliedRes = await client.query(`SELECT name FROM "__app_migrations";`);
    const appliedSet = new Set(appliedRes.rows.map((r) => r.name));

    let appliedCount = 0;

    for (const file of migrationFiles) {
      if (appliedSet.has(file)) {
        console.log(`⏩ Migration déjà appliquée : ${file}`);
        continue;
      }

      console.log(`🚀 Application de la migration : ${file}...`);
      const fullPath = path.join(drizzleDir, file);
      const sqlContent = fs.readFileSync(fullPath, 'utf-8');
      const statements = sqlContent.split('--> statement-breakpoint');

      await client.query('BEGIN');
      try {
        for (const stmt of statements) {
          const trimmed = stmt.trim();
          if (trimmed) {
            await client.query(trimmed);
          }
        }
        await client.query(`INSERT INTO "__app_migrations" ("name") VALUES ($1);`, [file]);
        await client.query('COMMIT');
        console.log(`✅ Migration réussie : ${file}`);
        appliedCount++;
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`❌ Échec de la migration ${file} :`, err);
        throw err;
      }
    }

    if (appliedCount === 0) {
      console.log('✨ Aucune nouvelle migration à appliquer. La base est déjà à jour.');
    } else {
      console.log(`\n🎉 ${appliedCount} nouvelle(s) migration(s) appliquée(s) avec succès sans perte de données.`);
    }

    // 3. Activer RLS sur les tables multi-tenants existantes
    console.log('\n🔒 Vérification et activation de la sécurité RLS...');
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
    console.log(`✅ RLS configuré sur les ${tenantTables.length} tables multi-tenants.`);
  } catch (error) {
    console.error('❌ Erreur globale lors des migrations :', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();
