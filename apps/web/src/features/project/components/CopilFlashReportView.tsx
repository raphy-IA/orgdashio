import React from 'react';
import { Button } from '@orgdashio/ui';
import {
  Printer,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Calendar,
  DollarSign,
  TrendingUp,
  Sparkles,
  Layers,
  FileCheck,
  Building2,
  Clock,
} from 'lucide-react';
import { calculateEVM, EVMTaskInput, EVMExpenseInput } from '@orgdashio/shared';

interface CopilFlashReportViewProps {
  project: any;
  planItems: any[];
  expenses: any[];
  members: any[];
  deliverables: any[];
  updates: any[];
  raidItems: any[];
  fundingSources: any[];
}

export function CopilFlashReportView({
  project,
  planItems,
  expenses,
  members,
  deliverables,
  updates,
  raidItems,
  fundingSources,
}: CopilFlashReportViewProps) {
  const totalBudget = parseFloat(project?.budgetTotal || '0') || 0;

  // Calculate EVM
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

  const tasksOnly = planItems.filter((p) => p.type === 'task' || !p.type);
  const milestones = planItems.filter((p) => p.type === 'milestone');
  const phases = planItems.filter((p) => p.type === 'phase');
  const completedTasks = tasksOnly.filter((t) => t.status === 'completed');
  const blockedTasks = tasksOnly.filter((t) => t.status === 'blocked');
  const reviewTasks = tasksOnly.filter((t) => t.status === 'review');

  const topRisks = raidItems
    .filter((r) => r.type === 'risk' || r.type === 'issue')
    .sort((a, b) => (b.probability || 1) * (b.impact || 1) - (a.probability || 1) * (a.impact || 1))
    .slice(0, 4);

  const todayStr = new Date().toLocaleDateString('fr-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const physicalProgressPct = evmData.bac > 0 ? Math.min(100, Math.round((evmData.ev / evmData.bac) * 100)) : 0;
  const budgetBurnPct = evmData.bac > 0 ? Math.min(100, Math.round((evmData.ac / evmData.bac) * 100)) : 0;

  return (
    <div className="space-y-6">
      {/* ── Toolbar: Print & Export ── */}
      <div className="flex items-center justify-between no-print">
        <div>
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-indigo-600" />
            Rapport Flash Exécutif d'Avancement (Format COPIL / Bailleurs)
          </h3>
          <p className="text-xs text-slate-500">
            Synthèse 1-page pour les comités de pilotage, directoire et partenaires financiers
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => window.print()}
            className="text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5"
          >
            <Printer className="h-3.5 w-3.5" />
            Imprimer / Exporter PDF
          </Button>
        </div>
      </div>

      {/* ── 1-PAGE COPIL FLASH REPORT DOCUMENT ── */}
      <div className="rounded-2xl border border-slate-300 bg-white p-8 shadow-sm space-y-6 text-slate-900 print:border-none print:shadow-none print:p-0">
        {/* Document Header */}
        <div className="border-b-2 border-slate-900 pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-black bg-slate-900 text-white px-2.5 py-1 rounded">
                {project.code}
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Synthèse Périodique de Performance
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 mt-2">{project.name}</h1>
            <p className="text-xs text-slate-500 mt-1">
              Date d'édition du rapport : <strong>{todayStr}</strong>
            </p>
          </div>

          <div className="text-right sm:border-l sm:border-slate-200 sm:pl-6 space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Statut Projet</span>
            <span
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black border ${
                evmData.cpi >= 0.95 && evmData.spi >= 0.95
                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                  : 'bg-amber-100 text-amber-900 border-amber-300'
              }`}
            >
              {evmData.cpi >= 0.95 && evmData.spi >= 0.95 ? '🟢 PROJET CONFORME' : '⚠️ VIGILANCE COPIL'}
            </span>
            <p className="text-[11px] font-mono text-slate-500">
              {members.length} partie(s) prenante(s) affectée(s)
            </p>
          </div>
        </div>

        {/* Executive 4-Quadrant Metric Matrix */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">1. Budget Alloué (BAC)</span>
            <p className="text-xl font-black font-mono text-slate-900 mt-0.5">{fmt(evmData.bac)}</p>
            <p className="text-[10px] text-slate-400">Total contractualisé</p>
          </div>
          <div>
            <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">2. Valeur Planifiée (PV)</span>
            <p className="text-xl font-black font-mono text-blue-900 mt-0.5">{fmt(evmData.pv)}</p>
            <p className="text-[10px] text-blue-600">Objectif théorique à date</p>
          </div>
          <div>
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">3. Travail Réalisé (EV)</span>
            <p className="text-xl font-black font-mono text-emerald-900 mt-0.5">{fmt(evmData.ev)}</p>
            <p className="text-[10px] text-emerald-600">Avancement physique : {physicalProgressPct}%</p>
          </div>
          <div>
            <span className="text-[10px] font-bold text-violet-700 uppercase tracking-wider">4. Dépenses Réelles (AC)</span>
            <p className="text-xl font-black font-mono text-violet-900 mt-0.5">{fmt(evmData.ac)}</p>
            <p className="text-[10px] text-violet-600">Consommation : {budgetBurnPct}%</p>
          </div>
        </div>

        {/* Section 1: Indices EVM & Projections Finales */}
        <div className="space-y-3">
          <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider border-b border-slate-200 pb-1 flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-indigo-600" />
            1. Indices d'Efficience et Atterrissage Budgétaire
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-lg border border-slate-200 bg-white">
              <span className="text-slate-500 font-semibold block">Indice de Performance Coût (CPI)</span>
              <span className={`text-lg font-black font-mono ${evmData.cpi >= 1 ? 'text-emerald-600' : 'text-red-600'}`}>
                {evmData.cpi.toFixed(2)}
              </span>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {evmData.cpi >= 1 ? 'Efficience financière favorable' : 'Léger surcoût par dollar engagé'}
              </p>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 bg-white">
              <span className="text-slate-500 font-semibold block">Indice de Performance Délais (SPI)</span>
              <span className={`text-lg font-black font-mono ${evmData.spi >= 1 ? 'text-emerald-600' : 'text-amber-600'}`}>
                {evmData.spi.toFixed(2)}
              </span>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {evmData.spi >= 1 ? 'Cadence calendrier respectée' : 'Retard sur le rythme initial'}
              </p>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 bg-white">
              <span className="text-slate-500 font-semibold block">Coût Final Estimé (EAC)</span>
              <span className="text-lg font-black font-mono text-slate-900">{fmt(evmData.eac)}</span>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Écart prévisionnel (VAC) :{' '}
                <strong className={evmData.vac >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                  {evmData.vac >= 0 ? `+${fmt(evmData.vac)}` : fmt(evmData.vac)}
                </strong>
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Réalisations Clés & Avancement par Phase */}
        <div className="space-y-3">
          <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider border-b border-slate-200 pb-1 flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-indigo-600" />
            2. Avancement Consolidé par Phase WBS
          </h3>

          <div className="space-y-2">
            {phases.map((ph) => {
              const pct = ph.progressPct || 0;
              return (
                <div key={ph.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-indigo-700 font-bold bg-indigo-100 px-1.5 py-0.5 rounded text-[10px]">
                      {ph.wbs}
                    </span>
                    <span className="font-bold text-slate-900">{ph.title}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-2 bg-indigo-600 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="font-mono font-bold text-slate-800 w-10 text-right">{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 3: Jalons & Livrables */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Jalons Clés */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-1">
              <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
              Jalons Clés du Projet ({milestones.length})
            </h4>
            <div className="space-y-1.5">
              {milestones.map((m) => (
                <div key={m.id} className="flex items-center justify-between text-xs p-1.5 rounded bg-slate-50">
                  <span className="font-medium text-slate-800 truncate max-w-[200px]">{m.title}</span>
                  <span className={`font-mono font-bold text-[10px] px-2 py-0.5 rounded ${
                    m.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {m.status === 'completed' ? 'Atteint' : m.startDate || 'À venir'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Livrables & Visas */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-1">
              <FileCheck className="h-3.5 w-3.5 text-indigo-600" />
              Livrables Qualité & Visas RACI ({deliverables.length})
            </h4>
            <div className="space-y-1.5">
              {deliverables.slice(0, 5).map((d) => (
                <div key={d.id} className="flex items-center justify-between text-xs p-1.5 rounded bg-slate-50">
                  <span className="font-medium text-slate-800 truncate max-w-[200px]">{d.title}</span>
                  <span className={`font-bold text-[10px] px-2 py-0.5 rounded ${
                    d.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {d.status === 'approved' ? 'Visa Délivré' : 'En attente'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section 4: Risques Majeurs & Blocages Actifs */}
        <div className="space-y-2">
          <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider border-b border-slate-200 pb-1 flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
            4. Points d'Attention, Risques Prioritaires & Actions Requises
          </h3>

          {blockedTasks.length === 0 && topRisks.length === 0 ? (
            <p className="text-xs text-slate-500 italic">Aucun blocage ni risque critique à signaler pour cette période.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {blockedTasks.map((t) => (
                <div key={t.id} className="p-2.5 rounded-lg border border-red-200 bg-red-50 text-red-900">
                  <span className="font-bold block">🛑 Blocage : {t.wbs} — {t.title}</span>
                  <span className="text-[11px] text-red-700">Intervention requise par le chef de projet</span>
                </div>
              ))}
              {topRisks.map((r) => (
                <div key={r.id} className="p-2.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-900">
                  <span className="font-bold block">⚠️ Risque : {r.title}</span>
                  <span className="text-[11px] text-amber-800">
                    Sévérité : {(r.probability || 1) * (r.impact || 1)}/25 • Pilote : {r.ownerName || 'Direction'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
