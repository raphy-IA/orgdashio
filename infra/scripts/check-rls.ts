import pg from 'pg';

async function checkRls() {
  const connectionString =
    process.env.DATABASE_URL ||
    'postgres://postgres:Information%402025@127.0.0.1:5432/orgdashio';

  const client = new pg.Client({ connectionString });

  try {
    await client.connect();
    console.log('🔍 Exécution du contrôle de sécurité RLS (Row-Level Security)...');

    // Find all public tables with a tenant_id column
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

    if (tenantTables.length === 0) {
      console.warn('⚠️  Aucune table avec tenant_id trouvée dans la base.');
      return;
    }

    console.log(`📋 Tables métier détectées avec tenant_id (${tenantTables.length}) :`, tenantTables.join(', '));

    let failedCount = 0;

    for (const tableName of tenantTables) {
      // Check relrowsecurity and relforcerowsecurity in pg_class
      const secQuery = `
        SELECT relrowsecurity, relforcerowsecurity
        FROM pg_class
        WHERE relname = $1 AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
      `;
      const secRes = await client.query(secQuery, [tableName]);
      if (secRes.rows.length === 0) {
        console.error(`❌ Table '${tableName}' non trouvée dans pg_class.`);
        failedCount++;
        continue;
      }

      const { relrowsecurity, relforcerowsecurity } = secRes.rows[0];

      if (!relrowsecurity) {
        console.error(`❌ RLS non activée sur la table '${tableName}' ! (ENABLE ROW LEVEL SECURITY requis)`);
        failedCount++;
      } else if (!relforcerowsecurity) {
        console.error(`❌ RLS non forcée sur la table '${tableName}' ! (FORCE ROW LEVEL SECURITY requis)`);
        failedCount++;
      } else {
        console.log(`✅ Table '${tableName}' : RLS activée et forcée avec succès.`);
      }
    }

    if (failedCount > 0) {
      console.error(`\n❌ Échec du contrôle RLS : ${failedCount} violation(s) détectée(s).`);
      process.exit(1);
    } else {
      console.log('\n🎉 Contrôle RLS réussi : 100% des tables métiers sont isolées et sécurisées.');
    }
  } catch (err) {
    console.error('⚠️  Impossible de se connecter à la base pour vérifier RLS (Vérifier si PostgreSQL tourne localement) :', (err as Error).message);
    // In CI without active PG instance, skip or fail depending on env
    if (process.env.CI_REQUIRE_DB === 'true') {
      process.exit(1);
    }
  } finally {
    await client.end();
  }
}

checkRls();
