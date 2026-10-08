/**
 * CPM & PERT Calculation Engine (Critical Path Method & Precedence Diagramming Method)
 * Standardized for Project Management (PMI / PMBOK).
 */

export interface CPMTaskInput {
  id: string;
  wbs: string;
  title: string;
  type: 'phase' | 'activity' | 'task' | 'milestone' | 'deliverable';
  durationDays?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  progressPct?: number | null;
  status?: string | null;
  parentId?: string | null;
  estimatedCost?: number | string | null;
  optimisticDays?: number | null;
  mostLikelyDays?: number | null;
  pessimisticDays?: number | null;
}

export interface CPMDependencyInput {
  id?: string;
  predecessorId: string;
  successorId: string;
  type: 'FS' | 'SS' | 'FF' | 'SF';
  lagDays?: number | null;
}

export interface CPMNodeResult {
  id: string;
  wbs: string;
  title: string;
  type: 'phase' | 'activity' | 'task' | 'milestone' | 'deliverable';
  duration: number; // Durée retenue
  pertEstimate: {
    optimistic?: number;
    mostLikely?: number;
    pessimistic?: number;
    expectedDuration: number; // Te = (O + 4M + P) / 6
    variance: number; // Var = ((P - O) / 6)^2
    stdDev: number; // Sigma = (P - O) / 6
  } | null;
  earlyStart: number; // ES (Jour offset relatif 0-indexed)
  earlyFinish: number; // EF
  lateStart: number; // LS
  lateFinish: number; // LF
  totalFloat: number; // TF = LS - ES (Marge Totale)
  freeFloat: number; // FF (Marge Libre)
  isCritical: boolean; // TF <= 0
  earlyStartDate: string; // Date ISO YYYY-MM-DD
  earlyFinishDate: string; // Date ISO YYYY-MM-DD
  lateStartDate: string; // Date ISO YYYY-MM-DD
  lateFinishDate: string; // Date ISO YYYY-MM-DD
  predecessorIds: string[];
  successorIds: string[];
  topologicalLevel: number; // Niveau d'ordonnancement pour rendu PERT en colonnes
  estimatedCost: number;
}

export interface CPMProjectResult {
  nodes: Map<string, CPMNodeResult>;
  nodeList: CPMNodeResult[];
  criticalPath: string[]; // Liste ordonnée des IDs de tâches sur le chemin critique
  criticalPathWbs: string[];
  projectDurationDays: number;
  projectEarlyStartDate: string;
  projectEarlyFinishDate: string;
  projectLateFinishDate: string;
  pertStatistics: {
    criticalPathVariance: number;
    criticalPathStdDev: number;
    confidenceInterval95: { minDays: number; maxDays: number };
  };
}

function addDaysToDate(baseDateStr: string, days: number): string {
  const d = new Date(baseDateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split('T')[0];
}

function daysDiff(startStr: string, endStr: string): number {
  const s = new Date(startStr + 'T00:00:00Z').getTime();
  const e = new Date(endStr + 'T00:00:00Z').getTime();
  return Math.max(0, Math.round((e - s) / (1000 * 60 * 60 * 24)));
}

/**
 * Calcule le Réseau PERT / PDM et la Méthode du Chemin Critique (CPM)
 */
export function calculateCPM(
  tasks: CPMTaskInput[],
  dependencies: CPMDependencyInput[],
  projectStartStr?: string
): CPMProjectResult {
  // 1. Filtrer uniquement les tâches opérationnelles, jalons et livrables (Work Packages)
  // Les conteneurs WBS (Phases / Activités parentes) sont des conteneurs logiques et ne doivent pas polluer le réseau PERT
  const parentIds = new Set(tasks.map((t) => t.parentId).filter(Boolean));
  const actionableTasks = tasks.filter((t) => {
    if (t.type === 'task' || t.type === 'milestone' || t.type === 'deliverable') return true;
    if (!parentIds.has(t.id)) return true;
    return false;
  });

  const taskMap = new Map<string, CPMTaskInput>();
  actionableTasks.forEach((t) => taskMap.set(t.id, t));

  // 2. Déterminer la date de démarrage du projet
  let earliestDate = projectStartStr;
  if (!earliestDate) {
    const dates = actionableTasks.map((t) => t.startDate).filter((d): d is string => !!d);
    earliestDate = dates.length > 0 ? dates.sort()[0] : new Date().toISOString().split('T')[0];
  }

  // 3. Initialiser les nœuds avec calcul PERT 3-points
  const nodes = new Map<string, CPMNodeResult>();
  const inDegree = new Map<string, number>();
  const successorsMap = new Map<string, { succId: string; type: 'FS' | 'SS' | 'FF' | 'SF'; lag: number }[]>();
  const predecessorsMap = new Map<string, { predId: string; type: 'FS' | 'SS' | 'FF' | 'SF'; lag: number }[]>();

  actionableTasks.forEach((t) => {
    inDegree.set(t.id, 0);
    successorsMap.set(t.id, []);
    predecessorsMap.set(t.id, []);

    let duration = t.durationDays && t.durationDays > 0 ? t.durationDays : 1;
    if (t.type === 'milestone') duration = 0;

    let pertEstimate = null;
    if (t.optimisticDays && t.mostLikelyDays && t.pessimisticDays) {
      const o = t.optimisticDays;
      const m = t.mostLikelyDays;
      const p = t.pessimisticDays;
      const te = Math.round(((o + 4 * m + p) / 6) * 10) / 10;
      const stdDev = Math.round(((p - o) / 6) * 100) / 100;
      const variance = Math.round(stdDev * stdDev * 100) / 100;
      pertEstimate = {
        optimistic: o,
        mostLikely: m,
        pessimistic: p,
        expectedDuration: te,
        variance,
        stdDev,
      };
      // Utiliser l'estimation moyenne attendue si définie
      duration = Math.max(1, Math.round(te));
    } else if (t.startDate && t.endDate && !t.durationDays) {
      const diff = daysDiff(t.startDate, t.endDate);
      duration = Math.max(1, diff);
    }

    const estimatedCost = typeof t.estimatedCost === 'number'
      ? t.estimatedCost
      : parseFloat(t.estimatedCost as any) || 0;

    nodes.set(t.id, {
      id: t.id,
      wbs: t.wbs,
      title: t.title,
      type: t.type,
      duration,
      pertEstimate,
      earlyStart: 0,
      earlyFinish: duration,
      lateStart: 0,
      lateFinish: duration,
      totalFloat: 0,
      freeFloat: 0,
      isCritical: false,
      earlyStartDate: earliestDate!,
      earlyFinishDate: addDaysToDate(earliestDate!, duration),
      lateStartDate: earliestDate!,
      lateFinishDate: addDaysToDate(earliestDate!, duration),
      predecessorIds: [],
      successorIds: [],
      topologicalLevel: 0,
      estimatedCost,
    });
  });

  // 3. Enregistrer les dépendances valides
  dependencies.forEach((dep) => {
    if (nodes.has(dep.predecessorId) && nodes.has(dep.successorId)) {
      const lag = dep.lagDays || 0;
      successorsMap.get(dep.predecessorId)!.push({ succId: dep.successorId, type: dep.type || 'FS', lag });
      predecessorsMap.get(dep.successorId)!.push({ predId: dep.predecessorId, type: dep.type || 'FS', lag });
      inDegree.set(dep.successorId, (inDegree.get(dep.successorId) || 0) + 1);

      nodes.get(dep.predecessorId)!.successorIds.push(dep.successorId);
      nodes.get(dep.successorId)!.predecessorIds.push(dep.predecessorId);
    }
  });

  // 4. Tri topologique (Kahn's algorithm)
  const queue: string[] = [];
  const inDegreeCopy = new Map(inDegree);
  inDegreeCopy.forEach((deg, id) => {
    if (deg === 0) queue.push(id);
  });

  const topoOrder: string[] = [];
  while (queue.length > 0) {
    const currentId = queue.shift()!;
    topoOrder.push(currentId);

    const succs = successorsMap.get(currentId) || [];
    for (const s of succs) {
      const newDeg = (inDegreeCopy.get(s.succId) || 1) - 1;
      inDegreeCopy.set(s.succId, newDeg);
      if (newDeg === 0) {
        queue.push(s.succId);
      }
    }
  }

  // Si des nœuds ne sont pas dans le tri topologique (ex: cycles résiduels), les ajouter à la fin
  tasks.forEach((t) => {
    if (!topoOrder.includes(t.id)) topoOrder.push(t.id);
  });

  // 5. PASSE AVANT (Forward Pass : Calcul des Dates au Plus Tôt - ES & EF)
  topoOrder.forEach((id) => {
    const node = nodes.get(id)!;
    const preds = predecessorsMap.get(id) || [];

    let maxES = 0;
    let maxLevel = 0;

    for (const p of preds) {
      const predNode = nodes.get(p.predId);
      if (!predNode) continue;

      maxLevel = Math.max(maxLevel, predNode.topologicalLevel + 1);

      let candidateES = 0;
      if (p.type === 'FS') {
        candidateES = predNode.earlyFinish + p.lag;
      } else if (p.type === 'SS') {
        candidateES = predNode.earlyStart + p.lag;
      } else if (p.type === 'FF') {
        candidateES = predNode.earlyFinish + p.lag - node.duration;
      } else if (p.type === 'SF') {
        candidateES = predNode.earlyStart + p.lag - node.duration;
      }
      maxES = Math.max(maxES, candidateES);
    }

    // Si la tâche a une date de début fixée manuellement qui est ultérieure
    const taskInput = taskMap.get(id);
    if (taskInput?.startDate) {
      const manualOffset = daysDiff(earliestDate!, taskInput.startDate);
      if (manualOffset > maxES && preds.length === 0) {
        maxES = manualOffset;
      }
    }

    node.earlyStart = Math.max(0, maxES);
    node.earlyFinish = node.earlyStart + node.duration;
    node.topologicalLevel = maxLevel;
  });

  // 6. Durée totale du projet = max(EF de tous les nœuds)
  let projectDurationDays = 0;
  nodes.forEach((n) => {
    projectDurationDays = Math.max(projectDurationDays, n.earlyFinish);
  });

  // 7. PASSE ARRIÈRE (Backward Pass : Calcul des Dates au Plus Tard - LS & LF)
  // Initialiser LF pour tous les nœuds terminaux avec projectDurationDays
  nodes.forEach((node) => {
    node.lateFinish = projectDurationDays;
    node.lateStart = node.lateFinish - node.duration;
  });

  // Parcourir dans l'ordre topologique inverse
  for (let i = topoOrder.length - 1; i >= 0; i--) {
    const id = topoOrder[i];
    const node = nodes.get(id)!;
    const succs = successorsMap.get(id) || [];

    if (succs.length > 0) {
      let minLF = Infinity;

      for (const s of succs) {
        const succNode = nodes.get(s.succId);
        if (!succNode) continue;

        let candidateLF = Infinity;
        if (s.type === 'FS') {
          candidateLF = succNode.lateStart - s.lag;
        } else if (s.type === 'SS') {
          candidateLF = succNode.lateStart - s.lag + node.duration;
        } else if (s.type === 'FF') {
          candidateLF = succNode.lateFinish - s.lag;
        } else if (s.type === 'SF') {
          candidateLF = succNode.lateFinish - s.lag + node.duration;
        }
        minLF = Math.min(minLF, candidateLF);
      }

      node.lateFinish = minLF === Infinity ? projectDurationDays : minLF;
      node.lateStart = node.lateFinish - node.duration;
    }
  }

  // 8. Calcul des Marges (Marges Totales & Marges Libres) et Marquage Critique
  const criticalPath: string[] = [];
  let criticalPathVariance = 0;

  nodes.forEach((node) => {
    node.totalFloat = Math.round((node.lateStart - node.earlyStart) * 10) / 10;

    // Calcul marge libre : min(ES_succ - lag) - EF
    const succs = successorsMap.get(node.id) || [];
    if (succs.length === 0) {
      node.freeFloat = node.totalFloat;
    } else {
      let minSuccStart = Infinity;
      succs.forEach((s) => {
        const succNode = nodes.get(s.succId);
        if (succNode) {
          minSuccStart = Math.min(minSuccStart, succNode.earlyStart - s.lag);
        }
      });
      node.freeFloat = minSuccStart === Infinity ? 0 : Math.max(0, minSuccStart - node.earlyFinish);
    }

    node.isCritical = Math.abs(node.totalFloat) < 0.001;

    // Traduction en dates calendaires réelles
    node.earlyStartDate = addDaysToDate(earliestDate!, node.earlyStart);
    node.earlyFinishDate = addDaysToDate(earliestDate!, node.earlyFinish);
    node.lateStartDate = addDaysToDate(earliestDate!, node.lateStart);
    node.lateFinishDate = addDaysToDate(earliestDate!, node.lateFinish);

    if (node.isCritical) {
      criticalPath.push(node.id);
      if (node.pertEstimate) {
        criticalPathVariance += node.pertEstimate.variance;
      }
    }
  });

  // Ordonner le chemin critique par EarlyStart
  criticalPath.sort((a, b) => (nodes.get(a)?.earlyStart || 0) - (nodes.get(b)?.earlyStart || 0));
  const criticalPathWbs = criticalPath.map((id) => nodes.get(id)?.wbs || id);

  const criticalPathStdDev = Math.round(Math.sqrt(criticalPathVariance) * 100) / 100;
  const confidenceInterval95 = {
    minDays: Math.max(1, Math.round(projectDurationDays - 1.96 * criticalPathStdDev)),
    maxDays: Math.round(projectDurationDays + 1.96 * criticalPathStdDev),
  };

  const projectEarlyStartDate = earliestDate!;
  const projectEarlyFinishDate = addDaysToDate(earliestDate!, projectDurationDays);
  const projectLateFinishDate = projectEarlyFinishDate;

  return {
    nodes,
    nodeList: Array.from(nodes.values()).sort((a, b) => a.earlyStart - b.earlyStart || a.wbs.localeCompare(b.wbs, undefined, { numeric: true })),
    criticalPath,
    criticalPathWbs,
    projectDurationDays,
    projectEarlyStartDate,
    projectEarlyFinishDate,
    projectLateFinishDate,
    pertStatistics: {
      criticalPathVariance: Math.round(criticalPathVariance * 100) / 100,
      criticalPathStdDev,
      confidenceInterval95,
    },
  };
}
