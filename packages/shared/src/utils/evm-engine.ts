/**
 * EVM (Earned Value Management / Gestion de la Valeur Acquise) & S-Curve Engine
 * Standardized for Project Performance (PMI / ANSI / EIA-748).
 */

export interface EVMTaskInput {
  id: string;
  wbs: string;
  title: string;
  startDate?: string | null;
  endDate?: string | null;
  durationDays?: number | null;
  progressPct?: number | null;
  estimatedCost?: number | string | null;
  status?: string | null;
}

export interface EVMExpenseInput {
  id: string;
  date: string;
  amount: number | string;
  status: string; // 'submitted' | 'approved' | 'paid'
}

export interface EVMTimeSeriesPoint {
  date: string; // YYYY-MM-DD
  label: string; // "Semaine 1", "Mois 1", etc.
  plannedValue: number; // PV (Cumul)
  earnedValue: number; // EV (Cumul)
  actualCost: number; // AC (Cumul)
}

export interface EVMProjectResult {
  bac: number; // Budget at Completion (Budget total planifié)
  pv: number; // Planned Value à date (Valeur planifiée)
  ev: number; // Earned Value à date (Valeur acquise = % avancement x Budget tâche)
  ac: number; // Actual Cost à date (Dépenses réelles approuvées)
  cv: number; // Cost Variance = EV - AC (>0 sous budget, <0 dépassement)
  sv: number; // Schedule Variance = EV - PV (>0 en avance, <0 en retard)
  cpi: number; // Cost Performance Index = EV / AC (>1 efficace, <1 surcoût)
  spi: number; // Schedule Performance Index = EV / PV (>1 rapide, <1 retard)
  eac: number; // Estimate at Completion = BAC / CPI (Coût final prévisionnel)
  etc: number; // Estimate to Complete = EAC - AC (Reste à dépenser)
  vac: number; // Variance at Completion = BAC - EAC (Écart final prévu)
  tcpi: number; // To-Complete Performance Index = (BAC - EV) / (BAC - AC)
  statusCost: 'under_budget' | 'on_budget' | 'over_budget';
  statusSchedule: 'ahead' | 'on_track' | 'behind';
  timeSeries: EVMTimeSeriesPoint[];
}

function parseNum(val: any): number {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (!val) return 0;
  const p = parseFloat(val);
  return isNaN(p) ? 0 : p;
}

/**
 * Calcule l'ensemble des indicateurs de la Valeur Acquise (EVM) et génère les points de la courbe en S
 */
export function calculateEVM(
  tasks: EVMTaskInput[],
  expenses: EVMExpenseInput[],
  projectBudgetTotal?: number,
  asOfDateStr?: string
): EVMProjectResult {
  const asOfDate = asOfDateStr || new Date().toISOString().split('T')[0];

  // 1. Calcul du BAC (Budget at Completion)
  const taskCostsTotal = tasks.reduce((sum, t) => sum + parseNum(t.estimatedCost), 0);
  const bac = projectBudgetTotal && projectBudgetTotal > 0
    ? projectBudgetTotal
    : (taskCostsTotal > 0 ? taskCostsTotal : 100000); // Fallback standard si aucun budget

  // Répartir le budget par tâche si nécessaire
  const tasksWithBudget = tasks.map((t) => {
    let cost = parseNum(t.estimatedCost);
    if (cost === 0 && tasks.length > 0 && bac > 0) {
      // Répartition proportionnelle à la durée si non spécifié
      const dur = t.durationDays || 1;
      const totalDur = tasks.reduce((s, x) => s + (x.durationDays || 1), 0);
      cost = (dur / Math.max(1, totalDur)) * bac;
    }
    return { ...t, taskBudget: cost };
  });

  // 2. Calcul de EV (Earned Value)
  let ev = 0;
  tasksWithBudget.forEach((t) => {
    const pct = Math.min(100, Math.max(0, t.progressPct || 0)) / 100;
    ev += pct * t.taskBudget;
  });

  // 3. Calcul de PV (Planned Value) à la date 'asOfDate'
  let pv = 0;
  tasksWithBudget.forEach((t) => {
    if (!t.startDate || !t.endDate) {
      // Si pas de dates précises, estimer à 50%
      pv += 0.5 * t.taskBudget;
      return;
    }

    if (asOfDate >= t.endDate) {
      // La tâche aurait dû être 100% terminée
      pv += t.taskBudget;
    } else if (asOfDate <= t.startDate) {
      // La tâche n'est pas encore censée avoir commencé
      pv += 0;
    } else {
      // Tâche en cours selon le calendrier : calcul au prorata temporis
      const start = new Date(t.startDate).getTime();
      const end = new Date(t.endDate).getTime();
      const current = new Date(asOfDate).getTime();
      const totalDur = Math.max(1, end - start);
      const elapsed = Math.max(0, current - start);
      const plannedRatio = Math.min(1, elapsed / totalDur);
      pv += plannedRatio * t.taskBudget;
    }
  });

  // 4. Calcul de AC (Actual Cost)
  const approvedExpenses = expenses.filter(
    (e) => e.status === 'approved' || e.status === 'paid'
  );
  const ac = approvedExpenses.reduce((sum, e) => sum + parseNum(e.amount), 0);

  // 5. Variances & Indices
  const cv = Math.round((ev - ac) * 100) / 100;
  const sv = Math.round((ev - pv) * 100) / 100;

  const cpi = ac > 0 ? Math.round((ev / ac) * 100) / 100 : 1.0;
  const spi = pv > 0 ? Math.round((ev / pv) * 100) / 100 : 1.0;

  // 6. Prévisions à achèvement (Forecasts)
  const eac = cpi > 0 ? Math.round((bac / cpi) * 100) / 100 : bac;
  const etc = Math.max(0, Math.round((eac - ac) * 100) / 100);
  const vac = Math.round((bac - eac) * 100) / 100;

  const remainingBudget = bac - ac;
  const tcpi = remainingBudget > 0 && bac > ev
    ? Math.round(((bac - ev) / remainingBudget) * 100) / 100
    : 1.0;

  const statusCost: EVMProjectResult['statusCost'] =
    cpi >= 1.05 ? 'under_budget' : cpi >= 0.95 ? 'on_budget' : 'over_budget';

  const statusSchedule: EVMProjectResult['statusSchedule'] =
    spi >= 1.05 ? 'ahead' : spi >= 0.95 ? 'on_track' : 'behind';

  // 7. Génération de la Courbe en S (S-Curve Time Series)
  const allDates = [
    ...tasks.map((t) => t.startDate),
    ...tasks.map((t) => t.endDate),
    ...expenses.map((e) => e.date),
    asOfDate,
  ].filter((d): d is string => !!d).sort();

  const minDateStr = allDates.length > 0 ? allDates[0] : asOfDate;
  const maxDateStr = allDates.length > 0 ? allDates[allDates.length - 1] : asOfDate;

  // Créer 8 points d'étape réguliers entre minDate et maxDate pour la courbe
  const timeSeries: EVMTimeSeriesPoint[] = [];
  const startTs = new Date(minDateStr).getTime();
  const endTs = new Date(maxDateStr).getTime();
  const stepCount = 8;
  const stepDuration = Math.max(1, (endTs - startTs) / (stepCount - 1));

  for (let i = 0; i < stepCount; i++) {
    const ptDate = new Date(startTs + i * stepDuration).toISOString().split('T')[0];
    const isPastOrPresent = ptDate <= asOfDate;

    // Calcul PV au point ptDate
    let ptPV = 0;
    tasksWithBudget.forEach((t) => {
      if (!t.startDate || !t.endDate) return;
      if (ptDate >= t.endDate) ptPV += t.taskBudget;
      else if (ptDate > t.startDate) {
        const s = new Date(t.startDate).getTime();
        const e = new Date(t.endDate).getTime();
        const cur = new Date(ptDate).getTime();
        ptPV += Math.min(1, Math.max(0, (cur - s) / Math.max(1, e - s))) * t.taskBudget;
      }
    });

    // Calcul AC au point ptDate
    const ptAC = isPastOrPresent
      ? approvedExpenses
          .filter((e) => e.date <= ptDate)
          .reduce((sum, e) => sum + parseNum(e.amount), 0)
      : ac + ((i - stepCount / 2) / (stepCount / 2)) * Math.max(0, eac - ac);

    // Calcul EV au point ptDate
    let ptEV = 0;
    if (isPastOrPresent) {
      const timeRatio = Math.min(1, (new Date(ptDate).getTime() - startTs) / Math.max(1, new Date(asOfDate).getTime() - startTs));
      ptEV = timeRatio * ev;
    } else {
      ptEV = ev + ((new Date(ptDate).getTime() - new Date(asOfDate).getTime()) / Math.max(1, endTs - new Date(asOfDate).getTime())) * (bac - ev);
    }

    timeSeries.push({
      date: ptDate,
      label: new Date(ptDate).toLocaleDateString('fr-CA', { month: 'short', day: 'numeric' }),
      plannedValue: Math.round(ptPV),
      earnedValue: Math.round(ptEV),
      actualCost: Math.round(ptAC),
    });
  }

  return {
    bac: Math.round(bac),
    pv: Math.round(pv),
    ev: Math.round(ev),
    ac: Math.round(ac),
    cv,
    sv,
    cpi,
    spi,
    eac,
    etc,
    vac,
    tcpi,
    statusCost,
    statusSchedule,
    timeSeries,
  };
}
