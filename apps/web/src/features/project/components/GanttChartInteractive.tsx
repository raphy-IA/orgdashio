import React, { useState, useMemo } from 'react';
import { calculateCPM, CPMTaskInput, CPMDependencyInput } from '@orgdashio/shared';
import { Button } from '@orgdashio/ui';
import {
  Calendar,
  Flag,
  Flame,
  ChevronRight,
  ChevronDown,
  Layers,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  CheckCircle2,
  Clock,
  PackageCheck,
  ArrowRight,
} from 'lucide-react';

interface GanttChartProps {
  tasks: any[];
  dependencies: any[];
  onSelectTask?: (task: any) => void;
}

export function GanttChartInteractive({ tasks, dependencies, onSelectTask }: GanttChartProps) {
  const [timeScale, setTimeScale] = useState<'days' | 'weeks' | 'months'>('weeks');
  const [collapsedPhases, setCollapsedPhases] = useState<Record<string, boolean>>({});
  const [filterCritical, setFilterCritical] = useState(false);

  // Compute CPM data for exact early/late schedules and critical path
  const cpmData = useMemo(() => {
    const cpmTasks: CPMTaskInput[] = tasks.map((t) => ({
      id: t.id,
      wbs: t.wbs,
      title: t.title,
      type: t.type,
      durationDays: t.durationDays,
      startDate: t.startDate,
      endDate: t.endDate,
      progressPct: t.progressPct,
      status: t.status,
      parentId: t.parentId,
      estimatedCost: t.estimatedCost,
      optimisticDays: t.optimisticDays,
      mostLikelyDays: t.mostLikelyDays,
      pessimisticDays: t.pessimisticDays,
    }));

    const cpmDeps: CPMDependencyInput[] = dependencies.map((d) => ({
      id: d.id,
      predecessorId: d.predecessorId,
      successorId: d.successorId,
      type: d.type || 'FS',
      lagDays: d.lagDays || 0,
    }));

    return calculateCPM(cpmTasks, cpmDeps);
  }, [tasks, dependencies]);

  // Project timeline bounds
  const { startTs, endTs, totalDays, datesArray } = useMemo(() => {
    const startStr = cpmData.projectEarlyStartDate || new Date().toISOString().split('T')[0];
    const endStr = cpmData.projectEarlyFinishDate || new Date().toISOString().split('T')[0];

    const s = new Date(startStr + 'T00:00:00Z').getTime();
    const e = new Date(endStr + 'T00:00:00Z').getTime();
    const days = Math.max(7, Math.round((e - s) / (1000 * 60 * 60 * 24)) + 5);

    const dates: Date[] = [];
    for (let i = 0; i <= days; i++) {
      const d = new Date(s);
      d.setUTCDate(d.getUTCDate() + i);
      dates.push(d);
    }

    return {
      startTs: s,
      endTs: e,
      totalDays: days,
      datesArray: dates,
    };
  }, [cpmData]);

  // Hierarchical list of sorted tasks
  const sortedDisplayTasks = useMemo(() => {
    const sorted = [...tasks].sort((a, b) => a.wbs.localeCompare(b.wbs, undefined, { numeric: true }));
    return sorted.filter((t) => {
      if (filterCritical) {
        const cNode = cpmData.nodes.get(t.id);
        if (!cNode?.isCritical) return false;
      }

      // Check if parent phase is collapsed
      if (t.parentId && collapsedPhases[t.parentId]) {
        return false;
      }
      return true;
    });
  }, [tasks, filterCritical, cpmData, collapsedPhases]);

  const togglePhase = (phaseId: string) => {
    setCollapsedPhases((prev) => ({ ...prev, [phaseId]: !prev[phaseId] }));
  };

  const dayWidthPx = timeScale === 'days' ? 36 : timeScale === 'weeks' ? 14 : 6;
  const totalChartWidthPx = totalDays * dayWidthPx;

  return (
    <div className="space-y-4">
      {/* ── Toolbar ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border bg-white p-4 shadow-sm">
        <div>
          <h3 className="font-bold text-slate-900 text-sm">Diagramme de Gantt Calendaire & Chemin Critique</h3>
          <p className="text-xs text-slate-500">
            Visualisation temporelle des phases, activités, jalons et liaisons de dépendances
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Timescale Selector */}
          <div className="flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-xs font-semibold">
            <button
              onClick={() => setTimeScale('days')}
              className={`rounded-md px-2.5 py-1 transition ${
                timeScale === 'days' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Jours
            </button>
            <button
              onClick={() => setTimeScale('weeks')}
              className={`rounded-md px-2.5 py-1 transition ${
                timeScale === 'weeks' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semaines
            </button>
            <button
              onClick={() => setTimeScale('months')}
              className={`rounded-md px-2.5 py-1 transition ${
                timeScale === 'months' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mois
            </button>
          </div>

          {/* Critical Filter Button */}
          <button
            onClick={() => setFilterCritical(!filterCritical)}
            className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold transition border ${
              filterCritical
                ? 'bg-red-600 text-white border-red-700 shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Flame className="h-3.5 w-3.5" />
            Chemin critique ({cpmData.criticalPath.length})
          </button>
        </div>
      </div>

      {/* ── Main Gantt Container ── */}
      <div className="overflow-hidden rounded-xl border bg-white shadow-sm flex flex-col">
        <div className="flex border-b bg-slate-50">
          {/* Left frozen columns Header */}
          <div className="w-80 shrink-0 border-r border-slate-200 p-3 font-bold text-xs text-slate-700">
            Structure WBS & Tâches ({sortedDisplayTasks.length})
          </div>

          {/* Right Scrollable Timeline Header */}
          <div className="flex-1 overflow-x-auto select-none" id="gantt-header-scroll">
            <div style={{ width: `${totalChartWidthPx}px` }} className="flex flex-col">
              {/* Header dates */}
              <div className="flex border-b border-slate-200 text-[10px] font-bold text-slate-500 py-1">
                {datesArray.map((date, idx) => {
                  const isMonday = date.getUTCDay() === 1;
                  const isFirstOfMonth = date.getUTCDate() === 1;

                  if (timeScale === 'months' && !isFirstOfMonth && idx !== 0) return null;
                  if (timeScale === 'weeks' && !isMonday && idx !== 0) return null;

                  return (
                    <div
                      key={idx}
                      style={{
                        width: timeScale === 'months' ? `${30 * dayWidthPx}px` : timeScale === 'weeks' ? `${7 * dayWidthPx}px` : `${dayWidthPx}px`,
                      }}
                      className="border-r border-slate-200 px-1 truncate text-slate-600"
                    >
                      {timeScale === 'months'
                        ? date.toLocaleDateString('fr-CA', { month: 'short', year: 'numeric' })
                        : timeScale === 'weeks'
                        ? `Sem. ${date.toLocaleDateString('fr-CA', { month: 'numeric', day: 'numeric' })}`
                        : date.getUTCDate()}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── Gantt Rows ── */}
        <div className="flex divide-x divide-slate-200 overflow-x-auto max-h-[600px] overflow-y-auto">
          {/* Left Task Tree Column */}
          <div className="w-80 shrink-0 divide-y divide-slate-100 bg-white">
            {sortedDisplayTasks.map((t) => {
              const depth = (t.wbs.match(/\./g) || []).length;
              const isPhase = t.type === 'phase';
              const isMilestone = t.type === 'milestone';
              const isCollapsed = collapsedPhases[t.id];
              const cpmNode = cpmData.nodes.get(t.id);
              const isCritical = cpmNode?.isCritical;

              return (
                <div
                  key={t.id}
                  onClick={() => onSelectTask?.(t)}
                  style={{ paddingLeft: `${Math.max(12, depth * 16 + 8)}px` }}
                  className={`flex h-11 items-center justify-between pr-3 text-xs cursor-pointer transition hover:bg-slate-50 ${
                    isPhase ? 'bg-slate-50/70 font-bold text-slate-900' : 'text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    {isPhase ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePhase(t.id);
                        }}
                        className="p-0.5 text-slate-500 hover:text-slate-800"
                      >
                        {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      </button>
                    ) : isMilestone ? (
                      <Flag className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-300 shrink-0" />
                    )}

                    <span className="font-mono text-[11px] font-semibold text-slate-400">{t.wbs}</span>
                    <span className="truncate font-medium" title={t.title}>
                      {t.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {isCritical && (
                      <span className="inline-flex items-center rounded bg-red-100 px-1 py-0.2 text-[9px] font-extrabold text-red-700">
                        CRITIQUE
                      </span>
                    )}
                    <span className="font-mono text-[10px] text-slate-400 font-semibold">{t.progressPct || 0}%</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Gantt Chart Bars Canvas */}
          <div className="flex-1 overflow-x-auto bg-slate-50/30">
            <div style={{ width: `${totalChartWidthPx}px` }} className="relative divide-y divide-slate-100">
              {/* Today line marker */}
              {(() => {
                const todayTs = new Date().getTime();
                if (todayTs >= startTs && todayTs <= endTs + 5 * 86400000) {
                  const todayOffsetDays = (todayTs - startTs) / (1000 * 60 * 60 * 24);
                  const todayLeftPx = todayOffsetDays * dayWidthPx;
                  return (
                    <div
                      style={{ left: `${todayLeftPx}px` }}
                      className="absolute top-0 bottom-0 z-20 w-0.5 bg-red-500 pointer-events-none"
                    >
                      <span className="absolute -top-1 -left-5 rounded bg-red-600 px-1 py-0.5 text-[8px] font-bold text-white uppercase">
                        Aujourd'hui
                      </span>
                    </div>
                  );
                }
                return null;
              })()}

              {sortedDisplayTasks.map((t) => {
                const isMilestone = t.type === 'milestone';
                const isPhase = t.type === 'phase';
                const cpmNode = cpmData.nodes.get(t.id);
                const isCritical = cpmNode?.isCritical;

                // Determine start and duration offsets
                let taskStartOffset = cpmNode ? cpmNode.earlyStart : 0;
                let taskDuration = cpmNode ? cpmNode.duration : t.durationDays || 1;

                if (t.startDate) {
                  const manualOffset = Math.max(
                    0,
                    Math.round(
                      (new Date(t.startDate + 'T00:00:00Z').getTime() - startTs) / (1000 * 60 * 60 * 24)
                    )
                  );
                  if (manualOffset > 0 && (!cpmNode || cpmNode.predecessorIds.length === 0)) {
                    taskStartOffset = manualOffset;
                  }
                }

                const barLeftPx = taskStartOffset * dayWidthPx;
                const barWidthPx = Math.max(dayWidthPx, taskDuration * dayWidthPx);
                const pct = Math.min(100, Math.max(0, t.progressPct || 0));

                return (
                  <div
                    key={t.id}
                    onClick={() => onSelectTask?.(t)}
                    className="relative h-11 flex items-center px-1 cursor-pointer transition hover:bg-indigo-50/30 group"
                  >
                    {isMilestone ? (
                      /* Milestone Diamond */
                      <div
                        style={{ left: `${barLeftPx}px` }}
                        className="absolute z-10 flex items-center justify-center transition-transform group-hover:scale-125"
                        title={`${t.wbs} — ${t.title} (Jalon le ${cpmNode?.earlyStartDate})`}
                      >
                        <div
                          className={`h-4 w-4 rotate-45 border shadow-sm ${
                            isCritical ? 'bg-red-500 border-red-700' : 'bg-amber-400 border-amber-600'
                          }`}
                        />
                        <span className="ml-6 text-[10px] font-bold text-slate-700 whitespace-nowrap">
                          {t.title}
                        </span>
                      </div>
                    ) : (
                      /* Standard / Phase Bar */
                      <div
                        style={{ left: `${barLeftPx}px`, width: `${barWidthPx}px` }}
                        className={`absolute z-10 h-6 rounded-md shadow-xs overflow-hidden transition-all duration-200 border ${
                          isPhase
                            ? 'bg-slate-700 border-slate-900'
                            : isCritical
                            ? 'bg-red-500 border-red-700 ring-1 ring-red-300'
                            : 'bg-indigo-500 border-indigo-700'
                        }`}
                        title={`${t.wbs} — ${t.title} (${taskDuration}j, ${pct}% réalisé) | Début: ${cpmNode?.earlyStartDate} - Fin: ${cpmNode?.earlyFinishDate}`}
                      >
                        {/* Progress Fill */}
                        <div
                          style={{ width: `${pct}%` }}
                          className={`h-full transition-all duration-300 ${
                            isPhase ? 'bg-slate-900' : isCritical ? 'bg-red-800' : 'bg-indigo-700'
                          }`}
                        />

                        {/* Text inside bar if wide enough */}
                        {barWidthPx > 60 && (
                          <span className="absolute inset-0 flex items-center px-2 text-[10px] font-bold text-white truncate pointer-events-none drop-shadow-xs">
                            {t.title} ({pct}%)
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
