import pg from 'pg';

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:Information%402025@127.0.0.1:5432/orgdashio';

async function check() {
  const client = new pg.Client({ connectionString });
  await client.connect();

  const { rows: projects } = await client.query(`SELECT id, code, name, status, tenant_id FROM project`);
  console.log('PROJECTS IN DB:', projects);

  for (const p of projects) {
    const { rows: planItems } = await client.query(`SELECT id, wbs, title, progress_pct, status FROM plan_item WHERE project_id = $1`, [p.id]);
    console.log(`PLAN ITEMS FOR ${p.code}:`, planItems);

    const { rows: budgets } = await client.query(`SELECT id, project_id FROM budget WHERE project_id = $1`, [p.id]);
    console.log(`BUDGETS FOR ${p.code}:`, budgets);

    const { rows: budgetLines } = await client.query(`SELECT id, budget_id, amount FROM budget_line WHERE budget_id IN (SELECT id FROM budget WHERE project_id = $1)`, [p.id]);
    console.log(`BUDGET LINES FOR ${p.code}:`, budgetLines);

    const { rows: funding } = await client.query(`SELECT id, donor_name, amount FROM funding_source WHERE project_id = $1`, [p.id]);
    console.log(`FUNDING FOR ${p.code}:`, funding);
  }

  await client.end();
}

check().catch(console.error);
