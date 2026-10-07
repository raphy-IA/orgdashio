import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import {
  project,
  planItem,
  budget,
  budgetLine,
  expense,
  fundingSource,
} from '@orgdashio/shared';

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:Information%402025@127.0.0.1:5432/orgdashio';

async function testFindAll() {
  const client = new pg.Client({ connectionString });
  await client.connect();

  const db = drizzle(client);

  const { rows: prjRow } = await client.query(`SELECT tenant_id FROM project WHERE code = 'PRJ-NUM-2026' LIMIT 1`);
  const tenantId = prjRow[0].tenant_id;

  console.log('Testing for tenantId of PRJ-NUM-2026:', tenantId);

  // Set RLS context
  await client.query(`SELECT set_config('app.tenant_id', $1, false)`, [tenantId]);

  const projectsList = await db.select().from(project).where(eq(project.tenantId, tenantId));
  const allPlanItems = await db.select().from(planItem).where(eq(planItem.tenantId, tenantId));
  const allBudgets = await db.select().from(budget).where(eq(budget.tenantId, tenantId));
  const allBudgetLines = await db.select().from(budgetLine).where(eq(budgetLine.tenantId, tenantId));
  const allExpenses = await db.select().from(expense).where(eq(expense.tenantId, tenantId));
  const allFunding = await db.select().from(fundingSource).where(eq(fundingSource.tenantId, tenantId));

  console.log('Projects count:', projectsList.length);
  console.log('Plan items count:', allPlanItems.length);
  console.log('Budgets count:', allBudgets.length);
  console.log('Budget lines count:', allBudgetLines.length);
  console.log('Funding count:', allFunding.length);

  const enriched = projectsList.map((p) => {
    const pPlanItems = allPlanItems.filter((i) => i.projectId === p.id);
    const pBudgets = allBudgets.filter((b) => b.projectId === p.id);
    const pBudgetIds = new Set(pBudgets.map((b) => b.id));
    const pBudgetLines = allBudgetLines.filter((bl) => pBudgetIds.has(bl.budgetId));
    const pExpenses = allExpenses.filter((e) => e.projectId === p.id);
    const pFunding = allFunding.filter((f) => f.projectId === p.id);

    const totalTasks = pPlanItems.length;
    const completedTasks = pPlanItems.filter((i) => (i.progressPct ?? 0) === 100 || i.status === 'completed').length;
    const inProgressTasks = pPlanItems.filter((i) => (i.progressPct ?? 0) > 0 && (i.progressPct ?? 0) < 100).length;
    const todoTasks = pPlanItems.filter((i) => (i.progressPct ?? 0) === 0 && i.status !== 'completed').length;
    const blockedTasks = pPlanItems.filter((i) => i.status === 'blocked').length;
    const overallProgress = totalTasks > 0
      ? Math.round(pPlanItems.reduce((acc, i) => acc + (i.progressPct || 0), 0) / totalTasks)
      : 0;

    const totalBudgetLines = pBudgetLines.reduce((acc, bl) => acc + (parseFloat(bl.amount as any) || 0), 0);
    const totalFunding = pFunding.reduce((acc, f) => acc + (parseFloat(f.amount as any) || 0), 0);
    const totalBudget = totalBudgetLines > 0 ? totalBudgetLines : totalFunding;
    const totalExpenses = pExpenses.reduce((acc, exp) => acc + (parseFloat(exp.amount as any) || 0), 0);

    return {
      code: p.code,
      name: p.name,
      status: p.status,
      metrics: {
        totalTasks,
        completedTasks,
        inProgressTasks,
        todoTasks,
        blockedTasks,
        overallProgress,
        totalBudget,
        totalBudgetLines,
        totalFunding,
        totalExpenses,
      },
    };
  });

  console.log('Enriched PRJ-NUM-2026:', JSON.stringify(enriched.find(p => p.code === 'PRJ-NUM-2026'), null, 2));

  await client.end();
}

testFindAll().catch(console.error);
