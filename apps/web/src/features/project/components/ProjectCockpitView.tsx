import React from 'react';
import { Button } from '@orgdashio/ui';
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  FileCheck,
  Flame,
  Layers,
  Scale,
  ShieldAlert,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';
import { calculateEVM, EVMTaskInput, EVMExpenseInput } from '@orgdashio/shared';

interface ProjectCockpitViewProps {
  project: any;
  planItems: any[];
  expenses: any[];
  members: any[];
  deliverables: any[];
  updates: any[];
  raidItems: any[];
  onSelectTask?: (task: any) => void;
  onNavigateTab?: (tab: string, subTab?: string) => void;
}

export function ProjectCockpitView({
  project,
  planItems,
  expenses,
  members,
  deliverables,
  updates,
  raidItems,
  onSelectTask,
  onNavigateTab,
}: ProjectCockpitViewProps) {
  const totalBudget = parseFloat(project?.budgetTotal || '0') || 0;

  // 1. Calculate EVM metrics
  const evmData = React.useMemo(() => {
    const evmTasks: EVMTaskInput[] = planItems.map((t) => ({
      id: t.id,
      wbs: t.wbs,
      title: t.title,
      startDate: t.startDate,
      endDate: t.endDate,
      durationDays: t.durationDays,
      progressPct: t.progressPct,
      estimatedCost: t.estimatedCost,
      status: t.status,
    }));

    const evmExpenses: EVMExpenseInput[] = expenses.map((e) => ({
      id: e.id,
      date: e.date,
      amount: e.amount,
      status: e.status,
    }));

    return calculateEVM(evmTasks, evmExpenses, totalBudget);
  }, [planItems, expenses, totalBudget]);

  const fmt = (val: number) =>
    new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(val);

  // 2. Project Task Counts & Progress
  const tasksOnly = planItems.filter((p) => p.type === 'task' || !p.type);
  const milestones = planItems.filter((p) => p.type === 'milestone');
  const phases = planItems.filter((p) => p.type === 'phase');
  const totalTasks = tasksOnly.length;
  const completedTasks = tasksOnly.filter((p) => p.status === 'completed').length;
  const reviewTasks = tasksOnly.filter((p) => p.status === 'review');
  const inProgressTasks = tasksOnly.filter((p) => p.status === 'in_progress');
  const blockedTasks = tasksOnly.filter((p) => p.status === 'blocked');
  const todoTasks = tasksOnly.filter((p) => p.status === 'todo');

  const completedMilestones = milestones.filter((m) => m.status === 'completed').length;
  const milestoneOnTimeRate = milestones.length > 0
    ? Math.round((completedMilestones / milestones.length) * 100)
    : 100;

  // 3. Time elapsed calculation
  const projectStartDate = project.startDate || (planItems.length > 0 ? planItems.find((p) => p.startDate)?.startDate : null);
  const projectEndDate = project.endDate || (planItems.length > 0 ? planItems.find((p) => p.endDate)?.endDate : null);
  
  let timeElapsedPct = 0;
  if (projectStartDate && projectEndDate) {
    const startTs = new Date(projectStartDate).getTime();
    const endTs = new Date(projectEndDate).getTime();
    const nowTs = new Date().getTime();
    if (endTs > startTs) {
      timeElapsedPct = Math.min(100, Math.max(0, Math.round(((nowTs - startTs) / (endTs - startTs)) * 100)));
    }
  }

  // Physical EV % and Budget AC %
  const physicalProgressPct = evmData.bac > 0 ? Math.min(100, Math.round((evmData.ev / evmData.bac) * 100)) : 0;
  const budgetBurnPct = evmData.bac > 0 ? Math.min(100, Math.round((evmData.ac / evmData.bac) * 100)) : 0;

  // 4. Global Health Score (0-100)
  const healthScore = React.useMemo(() => {
    let score = 100;
    // SPI penalty
    if (evmData.spi < 0.95) score -= Math.min(30, Math.round((0.95 - evmData.spi) * 100));
    // CPI penalty
    if (evmData.cpi < 0.95) score -= Math.min(30, Math.round((0.95 - evmData.cpi) * 100));
    // Blocked tasks penalty
    score -= blockedTasks.length * 10;
    // Critical RAID risks penalty
    const criticalRisks = raidItems.filter((r) => (r.probability || 1) * (r.impact || 1) >= 15);
    score -= criticalRisks.length * 5;

    return Math.max(10, Math.min(100, score));
  }, [evmData, blockedTasks.length, raidItems]);

  const getHealthBadge = (score: number) => {
    if (score >= 80) {
      return {
        label: 'Excellente Maîtrise',
        subtext: 'Projet conforme aux prévisions de coûts et de délais',
        bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        ring: 'text-emerald-500',
        color: 'emerald',
      };
    }
    if (score >= 60) {
      return {
        label: 'Vigilance Modérée',
        subtext: 'Légères dérives de délais ou de budget nécessitant un suivi',
        bg: 'bg-amber-50 text-amber-800 border-amber-200',
        ring: 'text-amber-500',
        color: 'amber',
      };
    }
    return {
      label: 'Risque Critique',
      subtext: 'Dérives importantes et blocages impactant la trajectoire du projet',
      bg: 'bg-red-50 text-red-800 border-red-200',
      ring: 'text-red-500',
      color: 'red',
    };
  };

  const healthCfg = getHealthBadge(healthScore);

  // Pending deliverables count
  const pendingDeliverables = deliverables.filter((d) => d.status === 'pending');

  return (
    <div className="space-y-6">
      {/* ── 1. Top Executive Banner: Health Score & 3D Triple Progress ── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Project Health Index Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-indigo-600" />
              <h3 className="font-bold text-slate-900 text-sm">Score de Santé Global</h3>
            </div>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${healthCfg.bg}`}>
              {healthCfg.label}
            </span>
          </div>

          <div className="my-4 flex items-center gap-5">
            <div className="relative flex h-24 w-24 items-center justify-center shrink-0">
              <svg className="h-full w-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-100"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={healthCfg.ring}
                  strokeDasharray={`${healthScore}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-2xl font-black text-slate-900 font-mono">{healthScore}</span>
                <span className="text-[10px] text-slate-400 block font-bold">/100</span>
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <p className="font-medium text-slate-700 leading-snug">{healthCfg.subtext}</p>
              <div className="pt-2 flex flex-wrap gap-1.5 text-[11px]">
                <span className="font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  SPI: <strong>{evmData.spi.toFixed(2)}</strong>
                </span>
                <span className="font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  CPI: <strong>{evmData.cpi.toFixed(2)}</strong>
                </span>
                {blockedTasks.length > 0 && (
                  <span className="font-mono text-red-700 bg-red-100 px-2 py-0.5 rounded font-bold">
                    {blockedTasks.length} bloqué(s)
                  </span>
                )}
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 border-t border-slate-100 pt-2">
            Index calculé en temps réel selon les normes PMI (Délais, Coûts et Risques opérationnels).
          </p>
        </div>

        {/* 3D Triple Progress Comparator */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs lg:col-span-2 space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Scale className="h-5 w-5 text-indigo-600" />
                Comparateur Triangulaire : Réalisation vs Dépenses vs Calendrier
              </h3>
              <p className="text-xs text-slate-500">
                Alignement entre l'avancement physique accompli (EV), le budget dépensé (AC) et le temps consommé.
              </p>
            </div>
          </div>

          <div className="space-y-3.5">
            {/* 1. Physical Progress */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="flex items-center gap-1.5 text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  1. Avancement Physique Réel (Valeur Acquise - EV)
                </span>
                <span className="font-mono font-bold text-emerald-800">{physicalProgressPct}% ({fmt(evmData.ev)})</span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                <div
                  className="h-2.5 bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${physicalProgressPct}%` }}
                />
              </div>
            </div>

            {/* 2. Budget Burn Rate */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="flex items-center gap-1.5 text-violet-700">
                  <DollarSign className="h-3.5 w-3.5" />
                  2. Consommation Budgétaire (Coûts Réels - AC)
                </span>
                <span className="font-mono font-bold text-violet-800">{budgetBurnPct}% ({fmt(evmData.ac)} / {fmt(evmData.bac)})</span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                <div
                  className={`h-2.5 rounded-full transition-all duration-500 ${
                    budgetBurnPct > physicalProgressPct + 10 ? 'bg-amber-500' : 'bg-violet-500'
                  }`}
                  style={{ width: `${budgetBurnPct}%` }}
                />
              </div>
            </div>

            {/* 3. Time Elapsed */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="flex items-center gap-1.5 text-sky-700">
                  <Calendar className="h-3.5 w-3.5" />
                  3. Temps Calendrier Écoulé
                </span>
                <span className="font-mono font-bold text-sky-800">{timeElapsedPct}%</span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                <div
                  className="h-2.5 bg-sky-500 rounded-full transition-all duration-500"
                  style={{ width: `${timeElapsedPct}%` }}
                />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-500">
            <span>
              Diagnostic :{' '}
              <strong className={physicalProgressPct >= budgetBurnPct ? 'text-emerald-700' : 'text-amber-700'}>
                {physicalProgressPct >= budgetBurnPct
                  ? '✅ Rendement budgétaire optimal (Travail produit supérieur aux dépenses)'
                  : '⚠️ Consommation budgétaire plus rapide que le travail physique produit'}
              </strong>
            </span>
            <button
              onClick={() => onNavigateTab?.('monitoring', 'evm')}
              className="font-bold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
            >
              Voir Courbe en S <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. Primary Executive KPI Tiles ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {/* CPI */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Indice Coût (CPI)</span>
            <span className={`p-1.5 rounded-lg ${evmData.cpi >= 1 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
              {evmData.cpi >= 1 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            </span>
          </div>
          <p className={`text-2xl font-black font-mono ${evmData.cpi >= 1 ? 'text-emerald-600' : 'text-red-600'}`}>
            {evmData.cpi.toFixed(2)}
          </p>
          <p className="text-[11px] text-slate-500">
            {evmData.cpi >= 1 ? 'Efficience positive sur chaque dollar dépensé' : 'Surcoût par rapport au travail produit'}
          </p>
        </div>

        {/* SPI */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Indice Délais (SPI)</span>
            <span className={`p-1.5 rounded-lg ${evmData.spi >= 1 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
              <Clock className="h-4 w-4" />
            </span>
          </div>
          <p className={`text-2xl font-black font-mono ${evmData.spi >= 1 ? 'text-emerald-600' : 'text-amber-600'}`}>
            {evmData.spi.toFixed(2)}
          </p>
          <p className="text-[11px] text-slate-500">
            {evmData.spi >= 1 ? 'Cadence respectée ou en avance' : 'Rythme en deçà du calendrier initial'}
          </p>
        </div>

        {/* Forecast EAC & VAC */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Atterrissage (EAC)</span>
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <DollarSign className="h-4 w-4" />
            </span>
          </div>
          <p className="text-2xl font-black font-mono text-slate-900">{fmt(evmData.eac)}</p>
          <p className="text-[11px] text-slate-500">
            Écart final (VAC) :{' '}
            <strong className={evmData.vac >= 0 ? 'text-emerald-600 font-mono' : 'text-red-600 font-mono'}>
              {evmData.vac >= 0 ? `+${fmt(evmData.vac)}` : fmt(evmData.vac)}
            </strong>
          </p>
        </div>

        {/* Milestone Rate */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Jalons Clés Atteints</span>
            <span className="p-1.5 rounded-lg bg-sky-50 text-sky-600">
              <Sparkles className="h-4 w-4" />
            </span>
          </div>
          <p className="text-2xl font-black font-mono text-sky-900">
            {completedMilestones} / {milestones.length}
          </p>
          <p className="text-[11px] text-slate-500">
            Taux d'accomplissement des jalons : <strong>{milestoneOnTimeRate}%</strong>
          </p>
        </div>
      </div>

      {/* ── 3. Operational Pulse & Urgencies ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Task Distribution Strip */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-indigo-600" />
              Répartition Opérationnelle
            </h3>
            <span className="text-xs font-semibold text-slate-400">{totalTasks} tâches</span>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-100">
              <span className="flex items-center gap-2 text-xs font-bold">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Terminées (Visées RACI)
              </span>
              <span className="font-mono font-bold text-emerald-900 text-sm">{completedTasks}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-100">
              <span className="flex items-center gap-2 text-xs font-bold">
                <FileCheck className="h-4 w-4 text-amber-600" />
                En attente de visa (Revue)
              </span>
              <span className="font-mono font-bold text-amber-900 text-sm">{reviewTasks.length}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-sky-50 text-sky-900 border border-sky-100">
              <span className="flex items-center gap-2 text-xs font-bold">
                <Clock className="h-4 w-4 text-sky-600" />
                En cours de réalisation
              </span>
              <span className="font-mono font-bold text-sky-900 text-sm">{inProgressTasks.length}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-red-50 text-red-900 border border-red-100">
              <span className="flex items-center gap-2 text-xs font-bold">
                <Flame className="h-4 w-4 text-red-600" />
                Bloquées / Alertes
              </span>
              <span className="font-mono font-bold text-red-900 text-sm">{blockedTasks.length}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 text-slate-700 border border-slate-200">
              <span className="flex items-center gap-2 text-xs font-bold">
                <Clock className="h-4 w-4 text-slate-400" />
                À démarrer (Backlog)
              </span>
              <span className="font-mono font-bold text-slate-800 text-sm">{todoTasks.length}</span>
            </div>
          </div>
        </div>

        {/* Action Highlights & Focus Copil */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              Points d'Attention & Actions Urgentes
            </h3>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
              {blockedTasks.length + reviewTasks.length + pendingDeliverables.length} action(s) requise(s)
            </span>
          </div>

          {blockedTasks.length === 0 && reviewTasks.length === 0 && pendingDeliverables.length === 0 ? (
            <div className="py-10 text-center text-slate-400 space-y-2">
              <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-400" />
              <p className="text-xs font-medium text-slate-600">Aucun blocage ni visa en attente. Le projet tourne à plein régime !</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {/* Blocked tasks */}
              {blockedTasks.map((task) => {
                const taskUpdates = updates.filter((u) => u.planItemId === task.id && u.blockerReason);
                const blockerText = taskUpdates[taskUpdates.length - 1]?.blockerReason || 'Blocage opérationnel signalé';
                return (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-red-200 bg-red-50/70 hover:bg-red-50 transition"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-red-800 bg-red-100 px-1.5 py-0.5 rounded">
                          {task.wbs}
                        </span>
                        <span className="font-bold text-xs text-slate-900">{task.title}</span>
                        <span className="text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                          BLOQUÉ
                        </span>
                      </div>
                      <p className="text-xs text-red-700 font-medium">🛑 {blockerText}</p>
                    </div>
                    {onSelectTask && (
                      <Button
                        size="sm"
                        onClick={() => onSelectTask(task)}
                        className="text-xs bg-red-600 hover:bg-red-700 text-white shrink-0 ml-3"
                      >
                        Intervenir
                      </Button>
                    )}
                  </div>
                );
              })}

              {/* Tasks in review */}
              {reviewTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-amber-200 bg-amber-50/70 hover:bg-amber-50 transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                        {task.wbs}
                      </span>
                      <span className="font-bold text-xs text-slate-900">{task.title}</span>
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                        VISA REQUIS (100%)
                      </span>
                    </div>
                    <p className="text-xs text-amber-800">
                      L'exécutant a déclaré l'achèvement à 100%. Visa de conformité requis par le responsable RACI (A).
                    </p>
                  </div>
                  {onSelectTask && (
                    <Button
                      size="sm"
                      onClick={() => onSelectTask(task)}
                      className="text-xs bg-amber-600 hover:bg-amber-700 text-white shrink-0 ml-3"
                    >
                      Délivrer Visa
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
