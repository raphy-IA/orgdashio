import React, { useMemo } from 'react';
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
} from 'lucide-react';

interface EVMViewProps {
  tasks: any[];
  expenses: any[];
  budgetTotal?: number;
}

export function EarnedValueManagementView({ tasks, expenses, budgetTotal }: EVMViewProps) {
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

  // S-Curve SVG Path calculations
  const chartHeight = 220;
  const chartWidth = 700;
  const padding = 40;

  const maxVal = Math.max(
    evmData.bac * 1.15,
    evmData.eac * 1.15,
    ...evmData.timeSeries.map((p) => Math.max(p.plannedValue, p.earnedValue, p.actualCost)),
    1000
  );

  const getSvgY = (val: number) =>
    chartHeight - padding - (val / maxVal) * (chartHeight - padding * 2);

  const getSvgX = (idx: number, total: number) =>
    padding + (idx / Math.max(1, total - 1)) * (chartWidth - padding * 2);

  const pvPoints = evmData.timeSeries.map((p, i) => `${getSvgX(i, evmData.timeSeries.length)},${getSvgY(p.plannedValue)}`).join(' ');
  const evPoints = evmData.timeSeries.map((p, i) => `${getSvgX(i, evmData.timeSeries.length)},${getSvgY(p.earnedValue)}`).join(' ');
  const acPoints = evmData.timeSeries.map((p, i) => `${getSvgX(i, evmData.timeSeries.length)},${getSvgY(p.actualCost)}`).join(' ');

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Scale className="h-5 w-5 text-indigo-600" />
              Gestion de la Valeur Acquise (EVM) & Courbe en S
            </h3>
            <p className="text-xs text-slate-500">
              Pilotage triangulaire Coût / Délais / Réalisation physique selon les standards PMI & ANSI/EIA-748
            </p>
          </div>

          <div className="flex items-center gap-2">
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
          <div className="rounded-xl border bg-slate-50/80 p-4">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">BAC (Budget Total)</span>
            <p className="mt-1 text-2xl font-black text-slate-900">{fmt(evmData.bac)}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Budget Initial Alloué</p>
          </div>

          <div className="rounded-xl border bg-blue-50/60 p-4 border-blue-200/80">
            <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">PV (Valeur Planifiée)</span>
            <p className="mt-1 text-2xl font-black text-blue-900">{fmt(evmData.pv)}</p>
            <p className="text-[10px] text-blue-600 mt-0.5">Ce qui devait être fait à date</p>
          </div>

          <div className="rounded-xl border bg-emerald-50/60 p-4 border-emerald-200/80">
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">EV (Valeur Acquise)</span>
            <p className="mt-1 text-2xl font-black text-emerald-900">{fmt(evmData.ev)}</p>
            <p className="text-[10px] text-emerald-600 mt-0.5">Valeur du travail réellement accompli</p>
          </div>

          <div className="rounded-xl border bg-violet-50/60 p-4 border-violet-200/80">
            <span className="text-[11px] font-bold text-violet-700 uppercase tracking-wider">AC (Coût Réel Dépensé)</span>
            <p className="mt-1 text-2xl font-black text-violet-900">{fmt(evmData.ac)}</p>
            <p className="text-[10px] text-violet-600 mt-0.5">Dépenses engagées et approuvées</p>
          </div>
        </div>

        {/* EVM Performance Indices & Forecasts Strip */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 pt-1">
          <div className="rounded-lg bg-white border p-3 shadow-2xs">
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
            <p className="text-[10px] text-slate-400 mt-1">
              {evmData.cpi >= 1
                ? `1 $ dépensé produit ${(evmData.cpi).toFixed(2)} $ de valeur (Efficient)`
                : `1 $ dépensé ne produit que ${(evmData.cpi).toFixed(2)} $ de valeur (Surcoût)`}
            </p>
          </div>

          <div className="rounded-lg bg-white border p-3 shadow-2xs">
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
            <p className="text-[10px] text-slate-400 mt-1">
              {evmData.spi >= 1 ? 'Progression physique plus rapide que prévu' : 'Retard sur le rythme théorique planifié'}
            </p>
          </div>

          <div className="rounded-lg bg-white border p-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Coût Final Estimé (EAC)</span>
              <span className="font-mono font-extrabold text-sm text-slate-900">{fmt(evmData.eac)}</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Écart final prévu (VAC) :{' '}
              <strong className={evmData.vac >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                {evmData.vac >= 0 ? `+${fmt(evmData.vac)}` : fmt(evmData.vac)}
              </strong>
            </p>
          </div>

          <div className="rounded-lg bg-white border p-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Écart Délais (SV)</span>
              <span
                className={`font-mono font-extrabold text-sm ${
                  evmData.sv >= 0 ? 'text-emerald-600' : 'text-amber-600'
                }`}
              >
                {evmData.sv >= 0 ? `+${fmt(evmData.sv)}` : fmt(evmData.sv)}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Écart monétaire d'avancement physique</p>
          </div>
        </div>
      </div>

      {/* ── Courbe en S (S-Curve Graphical Chart) ── */}
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Courbe en S Prévisionnelle vs Réalisée</h4>
            <p className="text-xs text-slate-500">Trajectoires cumulées de la Valeur Planifiée (PV), Acquise (EV) et Coûts Réels (AC)</p>
          </div>

          <div className="flex items-center gap-4 text-xs font-bold">
            <span className="flex items-center gap-1.5 text-blue-600">
              <span className="h-3 w-3 rounded-full bg-blue-500" />
              PV (Planifié)
            </span>
            <span className="flex items-center gap-1.5 text-emerald-600">
              <span className="h-3 w-3 rounded-full bg-emerald-500" />
              EV (Valeur Acquise)
            </span>
            <span className="flex items-center gap-1.5 text-violet-600">
              <span className="h-3 w-3 rounded-full bg-violet-500" />
              AC (Coût Réel)
            </span>
          </div>
        </div>

        {/* SVG Curve Container */}
        <div className="overflow-x-auto">
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full max-h-[300px] overflow-visible">
            {/* Grid background lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
              const y = chartHeight - padding - ratio * (chartHeight - padding * 2);
              return (
                <g key={idx}>
                  <line x1={padding} y1={y} x2={chartWidth - padding} y2={y} stroke="#e2e8f0" strokeDasharray="3 3" />
                  <text x={padding - 8} y={y + 3} textAnchor="end" fontSize="9" fill="#94a3b8" fontWeight="600">
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

            {/* Data Dots & Tooltips */}
            {evmData.timeSeries.map((pt, i) => {
              const x = getSvgX(i, evmData.timeSeries.length);
              const yEV = getSvgY(pt.earnedValue);
              const yAC = getSvgY(pt.actualCost);
              return (
                <g key={i}>
                  <circle cx={x} cy={yEV} r="4.5" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
                  <circle cx={x} cy={yAC} r="4" fill="#8b5cf6" stroke="#ffffff" strokeWidth="2" />
                  <text x={x} y={chartHeight - 12} textAnchor="middle" fontSize="10" fill="#64748b" fontWeight="600">
                    {pt.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}
