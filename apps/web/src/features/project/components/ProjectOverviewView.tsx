import React from 'react';
import { Button } from '@orgdashio/ui';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  FileCheck,
  FileSpreadsheet,
  FileText,
  Flame,
  FolderKanban,
  GitBranch,
  HandCoins,
  Layers,
  ListTodo,
  Network,
  PieChart,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-react';
import { calculateEVM, EVMTaskInput, EVMExpenseInput } from '@orgdashio/shared';

interface ProjectOverviewViewProps {
  project: any;
  planItems: any[];
  expenses: any[];
  members: any[];
  deliverables: any[];
  updates: any[];
  raidItems: any[];
  fundingSources: any[];
  resultNodes: any[];
  dependencies: any[];
  budget: any;
  onNavigateTab: (tab: 'overview' | 'strategy' | 'planning' | 'execution' | 'monitoring', subTab?: string) => void;
  onSelectTask?: (task: any) => void;
}

export function ProjectOverviewView({
  project,
  planItems,
  expenses,
  members,
  deliverables,
  updates,
  raidItems,
  fundingSources,
  resultNodes,
  dependencies,
  budget,
  onNavigateTab,
  onSelectTask,
}: ProjectOverviewViewProps) {
  const totalBudget = (budget?.lines || []).reduce((s: number, l: any) => s + parseFloat(l.amount || '0'), 0) || parseFloat(project.budgetTotal || '0') || 0;
  
  const totalApprovedExpenses = expenses
    .filter((e: any) => e.status === 'approved' || e.status === 'paid')
    .reduce((s: number, e: any) => s + parseFloat(e.amount || '0'), 0);
  
  const totalPendingExpenses = expenses
    .filter((e: any) => e.status === 'submitted')
    .reduce((s: number, e: any) => s + parseFloat(e.amount || '0'), 0);

  const totalFunding = fundingSources.reduce((s: number, f: any) => s + parseFloat(f.amount || '0'), 0);
  const remaining = totalBudget - totalApprovedExpenses;
  const fundingCoveragePct = totalBudget > 0 ? Math.min(100, Math.round((totalFunding / totalBudget) * 100)) : 100;
  const budgetConsumptionPct = totalBudget > 0 ? Math.min(100, Math.round((totalApprovedExpenses / totalBudget) * 100)) : 0;

  // EVM
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

  const fmt = (val: number, cur = 'CAD') =>
    new Intl.NumberFormat('fr-CA', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(val);

  // Task & Milestone stats
  const tasksOnly = planItems.filter((p) => p.type === 'task' || !p.type);
  const milestones = planItems.filter((p) => p.type === 'milestone');
  const phases = planItems.filter((p) => p.type === 'phase');
  const rootPlanItems = planItems.filter((p) => !p.parentId);

  const totalTasks = tasksOnly.length;
  const completedTasks = tasksOnly.filter((p) => p.status === 'completed' || (p.progressPct ?? 0) === 100).length;
  const inProgressTasks = tasksOnly.filter((p) => (p.progressPct ?? 0) > 0 && (p.progressPct ?? 0) < 100 && p.status !== 'blocked').length;
  const reviewTasks = tasksOnly.filter((p) => p.status === 'review');
  const blockedTasks = tasksOnly.filter((p) => p.status === 'blocked');
  const todoTasks = tasksOnly.filter((p) => (p.progressPct ?? 0) === 0 && p.status === 'todo');

  // Overall WBS progress
  const totalRootWeight = rootPlanItems.reduce((s: number, p: any) => s + (p.durationDays || 1), 0);
  const overallProgress =
    rootPlanItems.length > 0 && totalRootWeight > 0
      ? Math.round(
          rootPlanItems.reduce((s: number, p: any) => s + (p.progressPct || 0) * (p.durationDays || 1), 0) /
            totalRootWeight
        )
      : planItems.length > 0
        ? Math.round(planItems.reduce((s: number, p: any) => s + (p.progressPct || 0), 0) / planItems.length)
        : 0;

  // Calendar Timeline calculation
  const today = new Date().toISOString().split('T')[0];
  const projectStartDate = project.startDate || (planItems.length > 0 ? planItems.find((p) => p.startDate)?.startDate : null);
  const projectEndDate = project.endDate || (planItems.length > 0 ? planItems.find((p) => p.endDate)?.endDate : null);
  
  let timeElapsedPct = 0;
  let daysRemaining = 0;
  let totalDays = 0;
  if (projectStartDate && projectEndDate) {
    const startTs = new Date(projectStartDate).getTime();
    const endTs = new Date(projectEndDate).getTime();
    const nowTs = new Date().getTime();
    totalDays = Math.max(1, Math.round((endTs - startTs) / (1000 * 60 * 60 * 24)));
    if (endTs > startTs) {
      timeElapsedPct = Math.min(100, Math.max(0, Math.round(((nowTs - startTs) / (endTs - startTs)) * 100)));
      daysRemaining = Math.max(0, Math.round((endTs - nowTs) / (1000 * 60 * 60 * 24)));
    }
  }

  // Health calculation
  const isDelayed = evmData.spi < 0.9 || blockedTasks.length > 0;
  const isOverBudget = evmData.cpi < 0.9;
  const healthStatus = isDelayed && isOverBudget
    ? { label: 'Critique : Dérives Coûts & Délais', color: 'bg-red-50 text-red-700 border-red-200' }
    : isDelayed
    ? { label: 'Vigilance : Délais sous tension', color: 'bg-amber-50 text-amber-800 border-amber-200' }
    : isOverBudget
    ? { label: 'Vigilance : Dépassement budgétaire', color: 'bg-amber-50 text-amber-800 border-amber-200' }
    : { label: '🟢 Projet conforme aux objectifs', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' };

  // Upcoming milestones (sorted by date)
  const upcomingMilestones = milestones
    .filter((m) => m.status !== 'completed')
    .sort((a, b) => new Date(a.startDate || a.endDate || '9999').getTime() - new Date(b.startDate || b.endDate || '9999').getTime())
    .slice(0, 4);

  // Top critical risks
  const criticalRaidItems = raidItems
    .filter((r) => (r.probability || 1) * (r.impact || 1) >= 10)
    .sort((a, b) => (b.probability || 1) * (b.impact || 1) - (a.probability || 1) * (a.impact || 1))
    .slice(0, 3);

  // Logframe summary counts
  const impactCount = resultNodes.filter((r) => r.level === 'impact').length;
  const outcomeCount = resultNodes.filter((r) => r.level === 'outcome').length;
  const outputCount = resultNodes.filter((r) => r.level === 'output').length;

  return (
    <div className="space-y-6">
      {/* ── 1. Hero Executive Project Card ── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-black bg-indigo-600 text-white px-2.5 py-0.5 rounded-md shadow-2xs">
                {project.code}
              </span>
              <span className={`inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-bold border ${healthStatus.color}`}>
                <CheckCircle2 className="h-3.5 w-3.5" />
                {healthStatus.label}
              </span>
              {project.programName && (
                <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full font-medium">
                  Programme : {project.programName}
                </span>
              )}
            </div>
            <h2 className="text-xl font-black text-slate-900">{project.name}</h2>
            {project.description && (
              <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">{project.description}</p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button
              size="sm"
              onClick={() => onNavigateTab('execution')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs"
            >
              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
              Exécuter les tâches
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onNavigateTab('monitoring', 'report')}
              className="border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold"
            >
              <FileText className="mr-1.5 h-3.5 w-3.5 text-indigo-600" />
              Rapport COPIL
            </Button>
          </div>
        </div>

        {/* Timeline & Calendar Progress Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-1 text-xs">
          <div className="md:col-span-3 space-y-1.5 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200">
            <div className="flex justify-between font-semibold">
              <span className="flex items-center gap-1.5 text-slate-700">
                <Calendar className="h-4 w-4 text-indigo-600" />
                Calendrier d'exécution :{' '}
                <strong className="text-slate-900 font-mono">
                  {projectStartDate ? new Date(projectStartDate).toLocaleDateString('fr-CA') : '—'}
                </strong>{' '}
                →{' '}
                <strong className="text-slate-900 font-mono">
                  {projectEndDate ? new Date(projectEndDate).toLocaleDateString('fr-CA') : '—'}
                </strong>
              </span>
              <span className="font-mono text-indigo-700 font-bold">
                {timeElapsedPct}% consommé ({daysRemaining}j restants)
              </span>
            </div>
            <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-2 bg-gradient-to-r from-indigo-500 to-indigo-700 rounded-full transition-all duration-500"
                style={{ width: `${timeElapsedPct}%` }}
              />
            </div>
          </div>

          <div className="bg-indigo-50/60 p-3.5 rounded-xl border border-indigo-100 flex flex-col justify-center">
            <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">Couverture Financière</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-lg font-black font-mono text-indigo-950">{fundingCoveragePct}%</span>
              <span className="text-[11px] text-indigo-800 font-medium">{fundingSources.length} bailleur(s)</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Top 4 High-Impact KPI Tiles ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {/* 1. Global WBS Progress */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Avancement WBS</span>
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <BarChart3 className="h-4 w-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-black font-mono text-indigo-700">{overallProgress}%</p>
            <span className="text-xs text-slate-400 font-medium">réalisé</span>
          </div>
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-1.5 bg-indigo-600 rounded-full" style={{ width: `${overallProgress}%` }} />
          </div>
          <p className="text-[10px] text-slate-400">Pondéré sur la durée des tâches racines</p>
        </div>

        {/* 2. Budget & Actual Costs */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Budget Engagé</span>
            <span className="p-1.5 rounded-lg bg-violet-50 text-violet-600">
              <DollarSign className="h-4 w-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-black font-mono text-violet-900">{fmt(totalApprovedExpenses)}</p>
            <span className="text-xs text-slate-400 font-medium">/ {fmt(totalBudget)}</span>
          </div>
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-1.5 rounded-full ${budgetConsumptionPct > overallProgress + 10 ? 'bg-amber-500' : 'bg-violet-600'}`}
              style={{ width: `${budgetConsumptionPct}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400">Solde restant : <strong>{fmt(remaining)}</strong></p>
        </div>

        {/* 3. CPI & Cost Efficiency */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Efficience (CPI)</span>
            <span className={`p-1.5 rounded-lg ${evmData.cpi >= 1 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
              {evmData.cpi >= 1 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <p className={`text-2xl font-black font-mono ${evmData.cpi >= 1 ? 'text-emerald-600' : 'text-red-600'}`}>
              {evmData.cpi.toFixed(2)}
            </p>
            <span className="text-xs font-bold text-slate-500 font-mono">SPI: {evmData.spi.toFixed(2)}</span>
          </div>
          <p className="text-[11px] text-slate-500">
            {evmData.cpi >= 1 ? '✅ Rendement positif par dollar' : '⚠️ Surcoût par dollar dépensé'}
          </p>
        </div>

        {/* 4. Quality & Deliverables */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Visas Qualité & RACI</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <FileCheck className="h-4 w-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-black font-mono text-slate-900">
              {deliverables.filter((d) => d.status === 'approved').length}
            </p>
            <span className="text-xs text-slate-400 font-medium">/ {deliverables.length} livrables visés</span>
          </div>
          <p className="text-[11px] text-slate-500">
            {reviewTasks.length > 0 ? (
              <span className="text-amber-700 font-bold">⚠️ {reviewTasks.length} tâche(s) en attente de visa</span>
            ) : (
              <span className="text-emerald-700 font-medium">Tous les livrables à jour</span>
            )}
          </p>
        </div>
      </div>

      {/* ── 3. The 4 Structural Pillars Navigation Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pilier 1 */}
        <div
          onClick={() => onNavigateTab('strategy')}
          className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs hover:border-indigo-500 hover:shadow-md transition space-y-3 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition">
                <Target className="h-5 w-5" />
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pilier 1</span>
            </div>
            <h3 className="font-bold text-slate-900 text-sm mt-3 group-hover:text-indigo-600 transition">
              1. Cadrage & Stratégie
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Cadre logique, financements ({fundingSources.length} bailleurs) et gouvernance RACI ({members.length} membres).
            </p>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-600">
            <span>Explorer le cadrage</span>
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition" />
          </div>
        </div>

        {/* Pilier 2 */}
        <div
          onClick={() => onNavigateTab('planning')}
          className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs hover:border-indigo-500 hover:shadow-md transition space-y-3 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition">
                <ListTodo className="h-5 w-5" />
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pilier 2</span>
            </div>
            <h3 className="font-bold text-slate-900 text-sm mt-3 group-hover:text-blue-600 transition">
              2. Planification
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Structure WBS, Réseau PERT/CPM ({dependencies.length} liens), Diagramme de Gantt et Budget CBS.
            </p>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600">
            <span>Ouvrir la planification</span>
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition" />
          </div>
        </div>

        {/* Pilier 3 */}
        <div
          onClick={() => onNavigateTab('execution')}
          className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs hover:border-emerald-500 hover:shadow-md transition space-y-3 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition">
                <CheckCircle2 className="h-5 w-5" />
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pilier 3</span>
            </div>
            <h3 className="font-bold text-slate-900 text-sm mt-3 group-hover:text-emerald-600 transition">
              3. Exécution & Opérations
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Tableau Kanban, suivi de l'avancement, levée de blocages ({blockedTasks.length}) et visas de livrables.
            </p>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-600">
            <span>Accéder aux opérations</span>
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition" />
          </div>
        </div>

        {/* Pilier 4 */}
        <div
          onClick={() => onNavigateTab('monitoring')}
          className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs hover:border-violet-500 hover:shadow-md transition space-y-3 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-xl bg-violet-50 text-violet-600 group-hover:bg-violet-600 group-hover:text-white transition">
                <BarChart3 className="h-5 w-5" />
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pilier 4</span>
            </div>
            <h3 className="font-bold text-slate-900 text-sm mt-3 group-hover:text-violet-600 transition">
              4. Suivi & Performance
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Cockpit 360°, EVM & Courbe en S, Matrice RAID 5×5 ({raidItems.length}) et Rapport Flash COPIL.
            </p>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-violet-600">
            <span>Piloter la performance</span>
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition" />
          </div>
        </div>
      </div>

      {/* ── 4. Main Section: WBS Phases Map & Operational Pulse ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* WBS Phases Map */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Layers className="h-4 w-4 text-indigo-600" />
                Cartographie d'Avancement des Phases (WBS)
              </h3>
              <p className="text-xs text-slate-500">
                Suivi de la cadence de complétion, des délais et du volume de travail par phase
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-400 font-mono">
              {phases.length} phase(s)
            </span>
          </div>

          {phases.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">
              Aucune phase WBS configurée. Définissez des phases dans l'onglet Planification.
            </div>
          ) : (
            <div className="space-y-3">
              {phases.map((phase) => {
                const childTasks = planItems.filter((item) => item.parentId === phase.id);
                const completedChildCount = childTasks.filter(
                  (c) => c.status === 'completed' || (c.progressPct ?? 0) === 100
                ).length;
                const blockedChildCount = childTasks.filter((c) => c.status === 'blocked').length;
                const pct = phase.progressPct || 0;

                return (
                  <div
                    key={phase.id}
                    className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-2.5 hover:border-indigo-300 transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-indigo-100 px-2 py-0.5 font-mono text-[11px] font-bold text-indigo-800 shrink-0">
                          {phase.wbs}
                        </span>
                        <span className="font-bold text-slate-900 text-sm">{phase.title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {blockedChildCount > 0 && (
                          <span className="text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                            {blockedChildCount} bloqué(s)
                          </span>
                        )}
                        <span className="text-xs font-bold text-indigo-700 font-mono w-10 text-right">
                          {pct}%
                        </span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          pct === 100 ? 'bg-emerald-500' : blockedChildCount > 0 ? 'bg-red-500' : 'bg-indigo-600'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 pt-1">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-slate-400" />
                          {phase.startDate ? new Date(phase.startDate).toLocaleDateString('fr-CA') : '—'} au{' '}
                          {phase.endDate ? new Date(phase.endDate).toLocaleDateString('fr-CA') : '—'}
                        </span>
                        {phase.durationDays && (
                          <span className="font-mono text-slate-400">({phase.durationDays}j)</span>
                        )}
                      </div>
                      <span className="font-medium text-slate-700">
                        {completedChildCount} / {childTasks.length} tâche(s) achevée(s)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Operational Pulse: Upcoming Milestones & Risks */}
        <div className="space-y-6">
          {/* Upcoming Milestones */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-indigo-600" />
                Prochains Jalons Clés
              </h3>
              <button
                type="button"
                onClick={() => onNavigateTab('monitoring', 'milestones')}
                className="text-[11px] font-bold text-indigo-600 hover:underline"
              >
                Tous ({milestones.length})
              </button>
            </div>

            {upcomingMilestones.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">Aucun jalon à venir.</p>
            ) : (
              <div className="space-y-2">
                {upcomingMilestones.map((m) => (
                  <div key={m.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-purple-700 font-bold bg-purple-100 px-1.5 py-0.5 rounded text-[10px]">
                        {m.wbs}
                      </span>
                      <span className="font-medium text-slate-900 truncate max-w-[130px]">{m.title}</span>
                    </div>
                    <span className="font-mono text-[11px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {m.startDate || m.endDate || 'À planifier'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Critical RAID Alerts */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                Risques Prioritaires ({criticalRaidItems.length})
              </h3>
              <button
                type="button"
                onClick={() => onNavigateTab('monitoring', 'raid')}
                className="text-[11px] font-bold text-indigo-600 hover:underline"
              >
                Matrice RAID
              </button>
            </div>

            {criticalRaidItems.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-400">
                <CheckCircle2 className="mx-auto h-5 w-5 text-emerald-400 mb-1" />
                <span>Aucun risque majeur non mitigé.</span>
              </div>
            ) : (
              <div className="space-y-2">
                {criticalRaidItems.map((r) => {
                  const score = (r.probability || 1) * (r.impact || 1);
                  return (
                    <div key={r.id} className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/70 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-950 truncate max-w-[160px]">{r.title}</span>
                        <span className="font-mono text-[10px] font-extrabold text-red-700 bg-red-100 px-1.5 py-0.5 rounded">
                          {score}/25
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-800">
                        Pilote : <strong>{r.ownerName || 'Non assigné'}</strong>
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
