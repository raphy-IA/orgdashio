import React, { useState, useMemo } from 'react';
import { calculateEVM, EVMTaskInput, EVMExpenseInput } from '@orgdashio/shared';
import {
  TrendingUp,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Sparkles,
  PieChart,
  ShieldAlert,
  ShieldCheck,
  Scale,
  BarChart2,
  Layers,
  ChevronDown,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { Button } from '@orgdashio/ui';

interface EVMViewProps {
  tasks: any[];
  expenses: any[];
  budgetTotal?: number;
}

type TimeScale = 'days' | 'weeks' | 'months';

export function EarnedValueManagementView({ tasks, expenses, budgetTotal }: EVMViewProps) {
  const [timeScale, setTimeScale] = useState<TimeScale>('weeks');
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);
  const [expandedPhases, setExpandedPhases] = useState<Record<string, boolean>>({});

  const togglePhase = (id: string) => {
    setExpandedPhases((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const evmData = useMemo(() => {
    const evmTasks: EVMTaskInput[] = tasks.map((t) => ({
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

    return calculateEVM(evmTasks, evmExpenses, budgetTotal);
  }, [tasks, expenses, budgetTotal]);

  const fmt = (val: number) =>
    new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(val);

  // Filter or aggregate timeSeries based on chosen time scale
  const displayedTimeSeries = useMemo(() => {
    const raw = evmData.timeSeries;
    if (raw.length <= 4 || timeScale === 'days') return raw;

    if (timeScale === 'months') {
      // Return 4 to 6 representative quarterly/monthly sample points
      const step = Math.max(1, Math.floor(raw.length / 4));
      const filtered = raw.filter((_, idx) => idx % step === 0 || idx === raw.length - 1);
      return filtered;
    }

    // Default 'weeks': return all 8 calculated step points
    return raw;
  }, [evmData.timeSeries, timeScale]);

  // S-Curve SVG Path calculations
  const chartHeight = 260;
  const chartWidth = 760;
  const padding = 50;

  const maxVal = Math.max(
    evmData.bac * 1.15,
    evmData.eac * 1.15,
    ...displayedTimeSeries.map((p) => Math.max(p.plannedValue, p.earnedValue, p.actualCost)),
    1000
  );

  const getSvgY = (val: number) =>
    chartHeight - padding - (val / maxVal) * (chartHeight - padding * 2);

  const getSvgX = (idx: number, total: number) =>
    padding + (idx / Math.max(1, total - 1)) * (chartWidth - padding * 2);

  const pvPoints = displayedTimeSeries
    .map((p, i) => `${getSvgX(i, displayedTimeSeries.length)},${getSvgY(p.plannedValue)}`)
    .join(' ');
  const evPoints = displayedTimeSeries
    .map((p, i) => `${getSvgX(i, displayedTimeSeries.length)},${getSvgY(p.earnedValue)}`)
    .join(' ');
  const acPoints = displayedTimeSeries
    .map((p, i) => `${getSvgX(i, displayedTimeSeries.length)},${getSvgY(p.actualCost)}`)
    .join(' ');

  // Performance breakdown by WBS Phase / Work Package
  const wbsPerformance = useMemo(() => {
    const phases = tasks.filter((t) => t.type === 'phase');
    const activities = tasks.filter((t) => t.type === 'activity');
    const tasksOnly = tasks.filter((t) => t.type === 'task' || !t.type);

    return phases.map((phase) => {
      const phaseActivities = activities.filter((a) => a.parentId === phase.id);
      const phaseTasks = tasksOnly.filter((t) => {
        if (t.parentId === phase.id) return true;
        const parentAct = activities.find((a) => a.id === t.parentId);
        return parentAct && parentAct.parentId === phase.id;
      });

      // Aggregate task costs & progress
      const phaseBac = phaseTasks.reduce((sum, t) => sum + (parseFloat(t.estimatedCost) || 0), 0) || parseFloat(phase.estimatedCost) || 0;
      let phaseEv = 0;
      let phasePv = 0;
      const today = new Date().toISOString().split('T')[0];

      phaseTasks.forEach((t) => {
        const tCost = parseFloat(t.estimatedCost) || (phaseBac / Math.max(1, phaseTasks.length));
        const tPct = (t.progressPct || 0) / 100;
        phaseEv += tPct * tCost;

        if (t.endDate && today >= t.endDate) {
          phasePv += tCost;
        } else if (t.startDate && t.endDate && today > t.startDate) {
          const totalD = Math.max(1, new Date(t.endDate).getTime() - new Date(t.startDate).getTime());
          const elapD = Math.max(0, new Date(today).getTime() - new Date(t.startDate).getTime());
          phasePv += Math.min(1, elapD / totalD) * tCost;
        }
      });

      if (phaseBac > 0 && phaseTasks.length === 0) {
        phaseEv = ((phase.progressPct || 0) / 100) * phaseBac;
        phasePv = phaseBac * 0.5;
      }

      // Approximate AC proportional to EV or approved expenses
      const phaseAc = phaseEv * (evmData.cpi > 0 ? 1 / evmData.cpi : 1);
      const phaseCv = phaseEv - phaseAc;
      const phaseSv = phaseEv - phasePv;
      const phaseCpi = phaseAc > 0 ? phaseEv / phaseAc : 1.0;
      const phaseSpi = phasePv > 0 ? phaseEv / phasePv : 1.0;

      return {
        id: phase.id,
        wbs: phase.wbs,
        title: phase.title,
        progressPct: phase.progressPct || 0,
        bac: phaseBac,
        pv: phasePv,
        ev: phaseEv,
        ac: phaseAc,
        cv: phaseCv,
        sv: phaseSv,
        cpi: phaseCpi,
        spi: phaseSpi,
        activities: phaseActivities.map((act) => {
          const actTasks = tasksOnly.filter((t) => t.parentId === act.id);
          const actBac = actTasks.reduce((s, t) => s + (parseFloat(t.estimatedCost) || 0), 0) || parseFloat(act.estimatedCost) || 0;
          const actEv = actTasks.reduce((s, t) => s + ((t.progressPct || 0) / 100) * (parseFloat(t.estimatedCost) || (actBac / Math.max(1, actTasks.length))), 0);
          return {
            id: act.id,
            wbs: act.wbs,
            title: act.title,
            progressPct: act.progressPct || 0,
            bac: actBac,
            ev: actEv,
            cpi: phaseCpi,
            spi: phaseSpi,
          };
        }),
      };
    });
  }, [tasks, evmData]);

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Scale className="h-5 w-5 text-indigo-600" />
              Gestion de la Valeur Acquise (EVM) & Courbe en S Avancée
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Pilotage triangulaire Coût / Délais / Réalisation physique selon les standards PMI & ANSI/EIA-748
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold border ${
                evmData.statusCost === 'under_budget'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : evmData.statusCost === 'on_budget'
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-red-50 text-red-700 border-red-200'
              }`}
            >
              {evmData.statusCost === 'under_budget'
                ? '✅ Sous le budget'
                : evmData.statusCost === 'on_budget'
                ? '🟢 Budget conforme'
                : '⚠️ Dépassement budgétaire'}
            </span>

            <span
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold border ${
                evmData.statusSchedule === 'ahead'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : evmData.statusSchedule === 'on_track'
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              {evmData.statusSchedule === 'ahead'
                ? '⚡ En avance sur planning'
                : evmData.statusSchedule === 'on_track'
                ? '🟢 Calendrier respecté'
                : '⏳ En retard sur planning'}
            </span>
          </div>
        </div>

        {/* EVM Primary Metrics Grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 pt-2 border-t border-slate-100">
          <div className="rounded-xl border bg-slate-50/80 p-4 border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">BAC (Budget Total)</span>
            <p className="mt-1 text-2xl font-black font-mono text-slate-900">{fmt(evmData.bac)}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Budget Initial Alloué</p>
          </div>

          <div className="rounded-xl border bg-blue-50/60 p-4 border-blue-200/80">
            <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">PV (Valeur Planifiée)</span>
            <p className="mt-1 text-2xl font-black font-mono text-blue-900">{fmt(evmData.pv)}</p>
            <p className="text-[10px] text-blue-600 mt-0.5">Ce qui devait être fait à date</p>
          </div>

          <div className="rounded-xl border bg-emerald-50/60 p-4 border-emerald-200/80">
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">EV (Valeur Acquise)</span>
            <p className="mt-1 text-2xl font-black font-mono text-emerald-900">{fmt(evmData.ev)}</p>
            <p className="text-[10px] text-emerald-600 mt-0.5">Valeur du travail réellement accompli</p>
          </div>

          <div className="rounded-xl border bg-violet-50/60 p-4 border-violet-200/80">
            <span className="text-[11px] font-bold text-violet-700 uppercase tracking-wider">AC (Coût Réel Dépensé)</span>
            <p className="mt-1 text-2xl font-black font-mono text-violet-900">{fmt(evmData.ac)}</p>
            <p className="text-[10px] text-violet-600 mt-0.5">Dépenses réelles approuvées</p>
          </div>
        </div>

        {/* EVM Performance Indices & Forecasts Strip */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 pt-1">
          <div className="rounded-xl bg-white border border-slate-200 p-3.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Indice Coût (CPI)</span>
              <span
                className={`font-mono font-extrabold text-sm ${
                  evmData.cpi >= 1 ? 'text-emerald-600' : 'text-red-600'
                }`}
              >
                {evmData.cpi.toFixed(2)}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              {evmData.cpi >= 1
                ? `1 $ dépensé génère ${(evmData.cpi).toFixed(2)} $ de valeur`
                : `1 $ dépensé ne génère que ${(evmData.cpi).toFixed(2)} $ de valeur`}
            </p>
          </div>

          <div className="rounded-xl bg-white border border-slate-200 p-3.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Indice Délais (SPI)</span>
              <span
                className={`font-mono font-extrabold text-sm ${
                  evmData.spi >= 1 ? 'text-emerald-600' : 'text-amber-600'
                }`}
              >
                {evmData.spi.toFixed(2)}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              {evmData.spi >= 1 ? 'Progression physique en avance sur calendrier' : 'Retard par rapport au calendrier prévu'}
            </p>
          </div>

          <div className="rounded-xl bg-white border border-slate-200 p-3.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Coût Final Prévu (EAC)</span>
              <span className="font-mono font-extrabold text-sm text-slate-900">{fmt(evmData.eac)}</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Écart final prévisionnel (VAC) :{' '}
              <strong className={evmData.vac >= 0 ? 'text-emerald-600 font-mono' : 'text-red-600 font-mono'}>
                {evmData.vac >= 0 ? `+${fmt(evmData.vac)}` : fmt(evmData.vac)}
              </strong>
            </p>
          </div>

          <div className="rounded-xl bg-white border border-slate-200 p-3.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Indice TCPI (Reste à faire)</span>
              <span className="font-mono font-extrabold text-sm text-indigo-700">
                {evmData.tcpi ? evmData.tcpi.toFixed(2) : '1.00'}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Efficience requise pour respecter le budget initial</p>
          </div>
        </div>
      </div>

      {/* ── Courbe en S (S-Curve Graphical Chart) with Time Scale Filter ── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Courbe en S Prévisionnelle vs Réalisée</h4>
            <p className="text-xs text-slate-500">
              Trajectoires cumulées de la Valeur Planifiée (PV), Acquise (EV) et Coûts Réels (AC)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* Time scale buttons */}
            <div className="flex items-center rounded-lg bg-slate-100 p-1 border border-slate-200 text-xs">
              <button
                onClick={() => setTimeScale('days')}
                className={`px-2.5 py-1 rounded-md font-bold transition ${
                  timeScale === 'days' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Jours
              </button>
              <button
                onClick={() => setTimeScale('weeks')}
                className={`px-2.5 py-1 rounded-md font-bold transition ${
                  timeScale === 'weeks' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semaines
              </button>
              <button
                onClick={() => setTimeScale('months')}
                className={`px-2.5 py-1 rounded-md font-bold transition ${
                  timeScale === 'months' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Mois
              </button>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-3 text-xs font-bold">
              <span className="flex items-center gap-1.5 text-blue-600">
                <span className="h-3 w-3 rounded-full bg-blue-500" />
                PV (Planifié)
              </span>
              <span className="flex items-center gap-1.5 text-emerald-600">
                <span className="h-3 w-3 rounded-full bg-emerald-500" />
                EV (Acquis)
              </span>
              <span className="flex items-center gap-1.5 text-violet-600">
                <span className="h-3 w-3 rounded-full bg-violet-500" />
                AC (Réel)
              </span>
            </div>
          </div>
        </div>

        {/* SVG Curve Container */}
        <div className="overflow-x-auto py-2">
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full max-h-[320px] overflow-visible">
            {/* Grid background lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
              const y = chartHeight - padding - ratio * (chartHeight - padding * 2);
              return (
                <g key={idx}>
                  <line x1={padding} y1={y} x2={chartWidth - padding} y2={y} stroke="#f1f5f9" strokeDasharray="3 3" />
                  <text x={padding - 10} y={y + 3} textAnchor="end" fontSize="9" fill="#94a3b8" fontWeight="600">
                    {Math.round((ratio * maxVal) / 1000)}k
                  </text>
                </g>
              );
            })}

            {/* PV Curve (Blue Line) */}
            <polyline fill="none" stroke="#3b82f6" strokeWidth="3" strokeDasharray="5 5" points={pvPoints} />

            {/* EV Curve (Emerald Line) */}
            <polyline fill="none" stroke="#10b981" strokeWidth="3.5" points={evPoints} />

            {/* AC Curve (Violet Line) */}
            <polyline fill="none" stroke="#8b5cf6" strokeWidth="3" points={acPoints} />

            {/* Data Dots & Interactive Highlights */}
            {displayedTimeSeries.map((pt, i) => {
              const x = getSvgX(i, displayedTimeSeries.length);
              const yPV = getSvgY(pt.plannedValue);
              const yEV = getSvgY(pt.earnedValue);
              const yAC = getSvgY(pt.actualCost);
              const isHovered = hoveredPointIndex === i;

              return (
                <g key={i} className="cursor-pointer" onMouseEnter={() => setHoveredPointIndex(i)} onMouseLeave={() => setHoveredPointIndex(null)}>
                  {/* Vertical guideline */}
                  {isHovered && (
                    <line x1={x} y1={padding} x2={x} y2={chartHeight - padding} stroke="#cbd5e1" strokeDasharray="2 2" strokeWidth="1.5" />
                  )}

                  {/* Circles */}
                  <circle cx={x} cy={yPV} r={isHovered ? 5.5 : 3.5} fill="#3b82f6" stroke="#ffffff" strokeWidth="2" />
                  <circle cx={x} cy={yEV} r={isHovered ? 6 : 4.5} fill="#10b981" stroke="#ffffff" strokeWidth="2" />
                  <circle cx={x} cy={yAC} r={isHovered ? 5.5 : 4} fill="#8b5cf6" stroke="#ffffff" strokeWidth="2" />

                  {/* X Axis Label */}
                  <text x={x} y={chartHeight - 14} textAnchor="middle" fontSize="10" fill="#64748b" fontWeight="600">
                    {pt.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Active Point Inspector Tooltip Card */}
        {hoveredPointIndex !== null && displayedTimeSeries[hoveredPointIndex] && (
          <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-3.5 flex flex-wrap items-center justify-between gap-4 text-xs animate-in fade-in duration-150">
            <span className="font-bold text-indigo-950 flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-indigo-600" />
              Étape : <strong>{displayedTimeSeries[hoveredPointIndex].label}</strong> ({displayedTimeSeries[hoveredPointIndex].date})
            </span>
            <div className="flex items-center gap-4 font-mono font-bold">
              <span className="text-blue-700">PV: {fmt(displayedTimeSeries[hoveredPointIndex].plannedValue)}</span>
              <span className="text-emerald-700">EV: {fmt(displayedTimeSeries[hoveredPointIndex].earnedValue)}</span>
              <span className="text-violet-700">AC: {fmt(displayedTimeSeries[hoveredPointIndex].actualCost)}</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Performance Table by WBS Lot / Phase ── */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="border-b bg-slate-50 px-6 py-4 flex items-center justify-between">
          <div>
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Layers className="h-4 w-4 text-indigo-600" />
              Tableau de Performance par Lot / Phase WBS
            </h4>
            <p className="text-xs text-slate-500">
              Décomposition de la valeur acquise, des écarts de coût et des indices d'efficience pour chaque lot de travail
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500">{wbsPerformance.length} phase(s)</span>
        </div>

        {wbsPerformance.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            Aucune phase WBS configurée pour afficher la ventilation détaillée.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b bg-slate-50/70 font-semibold uppercase text-slate-500 tracking-wider">
                <tr>
                  <th className="px-6 py-3">Élément WBS</th>
                  <th className="px-4 py-3 text-center">Avancement</th>
                  <th className="px-4 py-3 text-right">Budget (BAC)</th>
                  <th className="px-4 py-3 text-right">Planifié (PV)</th>
                  <th className="px-4 py-3 text-right">Acquis (EV)</th>
                  <th className="px-4 py-3 text-center">Indice Coût (CPI)</th>
                  <th className="px-4 py-3 text-center">Indice Délais (SPI)</th>
                  <th className="px-4 py-3 text-right">Écart (CV)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {wbsPerformance.map((ph) => {
                  const isExpanded = !!expandedPhases[ph.id];
                  return (
                    <React.Fragment key={ph.id}>
                      {/* Phase Row */}
                      <tr className="bg-slate-50/40 hover:bg-slate-50 font-semibold">
                        <td className="px-6 py-3.5">
                          <button
                            type="button"
                            onClick={() => togglePhase(ph.id)}
                            className="flex items-center gap-2 text-left text-slate-900 hover:text-indigo-600"
                          >
                            {ph.activities.length > 0 ? (
                              isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-slate-400" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-slate-400" />
                              )
                            ) : (
                              <span className="w-4" />
                            )}
                            <span className="font-mono text-indigo-700 bg-indigo-100 px-1.5 py-0.5 rounded text-[11px] font-bold">
                              {ph.wbs}
                            </span>
                            <span>{ph.title}</span>
                          </button>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className="font-mono font-bold text-slate-800">{ph.progressPct}%</span>
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-900">{fmt(ph.bac)}</td>
                        <td className="px-4 py-3.5 text-right font-mono text-blue-700">{fmt(ph.pv)}</td>
                        <td className="px-4 py-3.5 text-right font-mono text-emerald-700 font-bold">{fmt(ph.ev)}</td>
                        <td className="px-4 py-3.5 text-center">
                          <span
                            className={`font-mono font-bold px-2 py-0.5 rounded ${
                              ph.cpi >= 1 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                            }`}
                          >
                            {ph.cpi.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span
                            className={`font-mono font-bold px-2 py-0.5 rounded ${
                              ph.spi >= 1 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {ph.spi.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono font-bold">
                          <span className={ph.cv >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                            {ph.cv >= 0 ? `+${fmt(ph.cv)}` : fmt(ph.cv)}
                          </span>
                        </td>
                      </tr>

                      {/* Nested Activities */}
                      {isExpanded &&
                        ph.activities.map((act) => (
                          <tr key={act.id} className="bg-white hover:bg-slate-50/80 text-slate-600 pl-6">
                            <td className="px-6 py-2.5 pl-14">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-slate-500 text-[11px]">{act.wbs}</span>
                                <span>{act.title}</span>
                              </div>
                            </td>
                            <td className="px-4 py-2.5 text-center font-mono">{act.progressPct}%</td>
                            <td className="px-4 py-2.5 text-right font-mono">{fmt(act.bac)}</td>
                            <td className="px-4 py-2.5 text-right font-mono text-slate-400">—</td>
                            <td className="px-4 py-2.5 text-right font-mono text-emerald-700">{fmt(act.ev)}</td>
                            <td className="px-4 py-2.5 text-center font-mono text-slate-500">{act.cpi.toFixed(2)}</td>
                            <td className="px-4 py-2.5 text-center font-mono text-slate-500">{act.spi.toFixed(2)}</td>
                            <td className="px-4 py-2.5 text-right font-mono text-slate-400">—</td>
                          </tr>
                        ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
