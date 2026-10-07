import pg from 'pg';

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:Information%402025@127.0.0.1:5432/orgdashio';

interface PlanItemRow {
  id: string;
  parent_id: string | null;
  wbs: string;
  title: string;
  progress_pct: number;
  status: string;
  duration_days: number;
}

function calculateWbsRollup(items: PlanItemRow[]) {
  const itemMap = new Map<string, PlanItemRow>(items.map((i) => [i.id, { ...i }]));
  const childrenMap = new Map<string, string[]>();

  items.forEach((i) => {
    if (i.parent_id) {
      if (!childrenMap.has(i.parent_id)) childrenMap.set(i.parent_id, []);
      childrenMap.get(i.parent_id)!.push(i.id);
    }
  });

  // Determine depths
  function getDepth(id: string): number {
    const item = itemMap.get(id);
    if (!item || !item.parent_id) return 0;
    return 1 + getDepth(item.parent_id);
  }

  // Sort items by depth descending (deepest children first)
  const sortedItems = [...items].sort((a, b) => getDepth(b.id) - getDepth(a.id));

  // Recalculate each item if it has children
  for (const item of sortedItems) {
    const childIds = childrenMap.get(item.id);
    if (childIds && childIds.length > 0) {
      const children = childIds.map((cid) => itemMap.get(cid)!);
      
      const totalWeight = children.reduce((acc, c) => acc + (c.duration_days || 1), 0);
      const weightedProgress = children.reduce(
        (acc, c) => acc + c.progress_pct * (c.duration_days || 1),
        0
      );
      const computedPct = totalWeight > 0 ? Math.round(weightedProgress / totalWeight) : 0;

      let computedStatus = 'todo';
      const allCompleted = children.every((c) => c.status === 'completed' || c.progress_pct === 100);
      const anyBlocked = children.some((c) => c.status === 'blocked');
      const anyInProgress = children.some((c) => c.progress_pct > 0 || c.status === 'in_progress');

      if (allCompleted && computedPct === 100) {
        computedStatus = 'completed';
      } else if (anyBlocked) {
        computedStatus = 'blocked';
      } else if (anyInProgress || computedPct > 0) {
        computedStatus = 'in_progress';
      }

      const current = itemMap.get(item.id)!;
      current.progress_pct = computedPct;
      current.status = computedStatus;
    }
  }

  // Top level items (roots)
  const rootItems = items.filter((i) => !i.parent_id).map((i) => itemMap.get(i.id)!);
  const overallProjectProgress =
    rootItems.length > 0
      ? Math.round(rootItems.reduce((acc, r) => acc + r.progress_pct, 0) / rootItems.length)
      : 0;

  return {
    updatedItems: Array.from(itemMap.values()),
    overallProjectProgress,
  };
}

async function runTest() {
  const client = new pg.Client({ connectionString });
  await client.connect();

  const { rows: items } = await client.query(`
    SELECT id, parent_id, wbs, title, progress_pct, status, duration_days 
    FROM plan_item 
    WHERE project_id = (SELECT id FROM project WHERE code = 'PRJ-NUM-2026')
    ORDER BY wbs ASC
  `);

  console.log('BEFORE ROLLUP:');
  console.table(items);

  const result = calculateWbsRollup(items);

  console.log('AFTER ROLLUP:');
  console.table(result.updatedItems);
  console.log('OVERALL PROJECT PROGRESS:', result.overallProjectProgress, '%');

  await client.end();
}

runTest().catch(console.error);
