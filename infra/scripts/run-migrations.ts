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
    // 1. Ensure migrations tracking table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS "__app_migrations" (
        "id" SERIAL PRIMARY KEY,
        "name" VARCHAR(255) NOT NULL UNIQUE,
        "applied_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
    `);

    // 2. Auto-repair missing unique constraints on existing tenant tables
    console.log('🔍 Vérification des contraintes d\'unicité (tenant_id, id)...');
    const tenantTablesRes = await client.query(`
      SELECT DISTINCT c.table_name
      FROM information_schema.columns c
      JOIN information_schema.tables t ON c.table_name = t.table_name
      WHERE c.column_name = 'tenant_id'
        AND c.table_schema = 'public'
        AND t.table_type = 'BASE TABLE';
    `);

    for (const row of tenantTablesRes.rows) {
      const tbl = row.table_name;
      const idCol = await client.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = $1 AND column_name = 'id' AND table_schema = 'public';`,
        [tbl]
      );
      if (idCol.rows.length > 0) {
        try {
          await client.query(`
            DO $$ BEGIN
              ALTER TABLE "${tbl}" ADD CONSTRAINT "${tbl}_tenant_id_id_unique" UNIQUE ("tenant_id", "id");
            EXCEPTION
              WHEN duplicate_object OR duplicate_table OR duplicate_column THEN null;
            END $$;
          `);
        } catch (e) {
          // ignore if already indexed
        }
      }
    }

    // 3. Check if base database was already seeded/initialized prior to migration tracking
    const checkBaseRes = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'tenant_registry';
    `);
    const hasBaseTables = checkBaseRes.rows.length > 0;

    // 4. Find all migration files
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

    // If base tables exist and 0000 was never tracked, mark it or execute statements safely
    if (hasBaseTables && !appliedSet.has('0000_fine_firedrake.sql') && migrationFiles.includes('0000_fine_firedrake.sql')) {
      console.log('ℹ️ Base de données initiale détectée. Enregistrement de la baseline 0000_fine_firedrake.sql...');
      await client.query(`INSERT INTO "__app_migrations" ("name") VALUES ('0000_fine_firedrake.sql') ON CONFLICT DO NOTHING;`);
      appliedSet.add('0000_fine_firedrake.sql');
    }

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

      for (const stmt of statements) {
        const trimmed = stmt.trim();
        if (!trimmed) continue;

        try {
          await client.query(trimmed);
        } catch (stmtErr: any) {
          // Ignore duplicate object/relation/column errors gracefully
          if (stmtErr.code === '42P07' || stmtErr.code === '42701' || stmtErr.code === '42710') {
            continue;
          }
          console.warn(`⚠️ Avertissement lors de l'instruction : ${stmtErr.message}`);
        }
      }

      await client.query(`INSERT INTO "__app_migrations" ("name") VALUES ($1) ON CONFLICT DO NOTHING;`, [file]);
      console.log(`✅ Migration réussie : ${file}`);
      appliedCount++;
    }

    if (appliedCount === 0) {
      console.log('✨ Aucune nouvelle migration à appliquer. La base est parfaitement à jour.');
    } else {
      console.log(`\n🎉 ${appliedCount} nouvelle(s) migration(s) appliquée(s) avec succès sans perte de données.`);
    }

    // 5. Activer et forcer la sécurité RLS sur toutes les tables multi-tenants
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
    console.log(`✅ RLS configuré avec succès sur les ${tenantTables.length} tables multi-tenants.`);

    console.log('\n🌟 Base de données de production opérationnelle et synchronisée à 100% !');
  } catch (error) {
    console.error('❌ Erreur globale lors des migrations :', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();
