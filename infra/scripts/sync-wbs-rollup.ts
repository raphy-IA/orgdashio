import pg from 'pg';

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:Information%402025@127.0.0.1:5432/orgdashio';

async function sync() {
  const client = new pg.Client({ connectionString });
  await client.connect();
  const { rows: projects } = await client.query('SELECT id, tenant_id FROM project');
  
  for (const p of projects) {
    const { rows: items } = await client.query(
      'SELECT id, parent_id, duration_days, progress_pct, status FROM plan_item WHERE project_id = $1',
      [p.id]
    );
    if (items.length === 0) continue;

    const itemMap = new Map(items.map((i: any) => [i.id, { ...i }]));
    const childrenMap = new Map<string, string[]>();
    items.forEach((i: any) => {
      if (i.parent_id) {
        if (!childrenMap.has(i.parent_id)) childrenMap.set(i.parent_id, []);
        childrenMap.get(i.parent_id)!.push(i.id);
      }
    });

    const getDepth = (id: string): number => {
      const it = itemMap.get(id);
      if (!it || !it.parent_id) return 0;
      return 1 + getDepth(it.parent_id);
    };

    const sorted = [...items].sort((a: any, b: any) => getDepth(b.id) - getDepth(a.id));

    for (const it of sorted) {
      const cids = childrenMap.get(it.id);
      if (cids && cids.length > 0) {
        const children = cids.map((cid: string) => itemMap.get(cid)!);
        const totalWeight = children.reduce((acc: number, c: any) => acc + (c.duration_days || 1), 0);
        const weighted = children.reduce((acc: number, c: any) => acc + (c.progress_pct || 0) * (c.duration_days || 1), 0);
        const pct = totalWeight > 0 ? Math.round(weighted / totalWeight) : 0;
        let st = 'todo';
        const allComp = children.every((c: any) => c.status === 'completed' || c.progress_pct === 100);
        const anyBlk = children.some((c: any) => c.status === 'blocked');
        const anyInProg = children.some((c: any) => (c.progress_pct || 0) > 0 || c.status === 'in_progress');
        if (allComp && pct === 100) st = 'completed';
        else if (anyBlk) st = 'blocked';
        else if (anyInProg || pct > 0) st = 'in_progress';

        await client.query('UPDATE plan_item SET progress_pct = $1, status = $2 WHERE id = $3', [pct, st, it.id]);
        const curr = itemMap.get(it.id)!;
        curr.progress_pct = pct;
        curr.status = st;
      }
    }
  }

  console.log('Sync WBS Rollup completed successfully!');
  await client.end();
}

sync().catch(console.error);
