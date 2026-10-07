import pg from 'pg';

async function enableRlsAll() {
  const connectionString =
    process.env.DATABASE_URL ||
    'postgres://postgres:Information%402025@127.0.0.1:5432/orgdashio';

  const client = new pg.Client({ connectionString });

  try {
    await client.connect();
    console.log('🔒 Activation et forçage de RLS sur toutes les tables métiers...');

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

      // Add policy if not exists
      const policyName = `tenant_isolation_policy_${tableName}`;
      const checkPolicy = await client.query(
        `SELECT policyname FROM pg_policies WHERE tablename = $1 AND policyname = $2`,
        [tableName, policyName]
      );

      if (checkPolicy.rows.length === 0) {
        await client.query(`
          CREATE POLICY "${policyName}" ON "${tableName}"
          USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
          WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
        `);
      }

      console.log(`✅ Table '${tableName}' : RLS activée, forcée et politique d'isolation appliquée.`);
    }

    console.log('\n🎉 RLS configuré avec succès sur toutes les 38 tables métiers !');
  } catch (err) {
    console.error('Erreur lors de l’activation de RLS :', err);
  } finally {
    await client.end();
  }
}

enableRlsAll();
