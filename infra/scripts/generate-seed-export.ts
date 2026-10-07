import pg from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as schema from '../../packages/shared/src/db/schema';
import { getTableConfig, PgTable } from 'drizzle-orm/pg-core';

async function generateSeedExport() {
  const connectionString =
    process.env.DATABASE_URL ||
    'postgres://postgres:Information%402025@127.0.0.1:5432/orgdashio';

  const client = new pg.Client({ connectionString });
  await client.connect();

  console.log('📦 Extraction des données de la base de test locale...');

  // Map schema tables and their exact columns
  const schemaTableColumns = new Map<string, Set<string>>();
  for (const [_, tableObj] of Object.entries(schema) as [string, any][]) {
    if (tableObj instanceof PgTable) {
      const config = getTableConfig(tableObj);
      const tableName = config.name;
      const colNames = new Set(config.columns.map((c) => c.name));
      schemaTableColumns.set(tableName, colNames);
    }
  }

  // Ensure seeds directory exists
  const seedsDir = path.resolve(process.cwd(), 'infra/seeds');
  if (!fs.existsSync(seedsDir)) {
    fs.mkdirSync(seedsDir, { recursive: true });
  }

  const sqlFile = path.join(seedsDir, 'test-database-seed.sql');
  const jsonFile = path.join(seedsDir, 'test-database-seed.json');

  const fullData: Record<string, any[]> = {};
  const sqlStatements: string[] = [];

  sqlStatements.push('-- =================================================================');
  sqlStatements.push('-- OrgDashio Database Seed Dump (Test Data to Production/Staging)');
  sqlStatements.push(`-- Generated At: ${new Date().toISOString()}`);
  sqlStatements.push('-- =================================================================\n');
  sqlStatements.push('SET session_replication_role = \'replica\';\n');

  // Topological / Foreign Key order (Parents first)
  const orderedTables = [
    'tenant_registry',
    'user_account',
    'user_credential',
    'user_session',
    'role',
    'permission',
    'role_permission',
    'org_unit',
    'party',
    'staff_profile',
    'beneficiary_profile',
    'household',
    'household_member',
    'membership',
    'membership_role',
    'invitation',
    'program',
    'project',
    'program_project',
    'project_member',
    'funding_source',
    'budget',
    'budget_line',
    'expense',
    'plan_item',
    'plan_dependency',
    'plan_item_update',
    'plan_item_deliverable',
    'plan_item_raci',
    'raid_item',
    'result_node',
    'training_program',
    'course',
    'training_program_course',
    'training_session',
    'session_occurrence',
    'enrollment',
    'attendance',
    'certificate',
    'case_file',
    'case_assignment',
    'case_note',
    'break_glass_log',
    'consent_purpose',
    'consent_record',
    'service_delivery',
    'indicator',
    'indicator_observation',
    'document',
    'notification',
    'support_access_grant',
    'audit_log'
  ];

  // 1. Truncate in reverse order
  sqlStatements.push('-- 1. Nettoyage initial');
  for (const table of [...orderedTables].reverse()) {
    sqlStatements.push(`TRUNCATE TABLE "${table}" CASCADE;`);
  }
  sqlStatements.push('\n-- 2. Insertion des données ordonnées');

  for (const table of orderedTables) {
    const validCols = schemaTableColumns.get(table);
    if (!validCols) continue;

    const rowsRes = await client.query(`SELECT * FROM "${table}";`);
    const rows = rowsRes.rows;

    if (rows.length === 0) continue;

    // Only keep columns present in schema.ts
    const columns = Object.keys(rows[0]).filter((c) => validCols.has(c));
    if (columns.length === 0) continue;

    const filteredRows = rows.map((row) => {
      const filtered: Record<string, any> = {};
      for (const col of columns) {
        filtered[col] = row[col];
      }
      return filtered;
    });

    fullData[table] = filteredRows;
    console.log(`✓ Table "${table}": ${rows.length} lignes extraites (${columns.length} colonnes conformes au schéma).`);

    sqlStatements.push(`-- Table: ${table} (${rows.length} rows)`);

    const colsList = columns.map((c) => `"${c}"`).join(', ');

    for (const row of rows) {
      const valuesList = columns
        .map((c) => {
          const val = row[c];
          if (val === null || val === undefined) return 'NULL';
          if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
          if (typeof val === 'number') return val.toString();
          if (val instanceof Date) return `'${val.toISOString()}'`;
          if (typeof val === 'object') {
            const jsonStr = JSON.stringify(val).replace(/'/g, "''");
            return `'${jsonStr}'::jsonb`;
          }
          // String
          const escaped = String(val).replace(/'/g, "''");
          return `'${escaped}'`;
        })
        .join(', ');

      sqlStatements.push(`INSERT INTO "${table}" (${colsList}) VALUES (${valuesList}) ON CONFLICT DO NOTHING;`);
    }
    sqlStatements.push('');
  }

  sqlStatements.push('SET session_replication_role = \'origin\';\n');
  sqlStatements.push('-- Fin du dump de données');

  fs.writeFileSync(sqlFile, sqlStatements.join('\n'), 'utf-8');
  fs.writeFileSync(jsonFile, JSON.stringify(fullData, null, 2), 'utf-8');

  console.log(`\n🎉 Fichiers de seed générés avec succès :`);
  console.log(`- SQL: ${sqlFile}`);
  console.log(`- JSON: ${jsonFile}`);

  await client.end();
}

generateSeedExport().catch((err) => {
  console.error('Erreur lors de l\'exportation :', err);
  process.exit(1);
});
