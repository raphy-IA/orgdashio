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
  const [collapsedContainers, setCollapsedContainers] = useState<Record<string, boolean>>({});
  const [filterCritical, setFilterCritical] = useState(false);

  const taskMap = useMemo(() => new Map(tasks.map((t) => [t.id, t])), [tasks]);

  // Compute CPM data for actionable tasks
  const cpmData = useMemo(() => {
    const parentIds = new Set(tasks.map((t) => t.parentId).filter(Boolean));
    const actionableTasks = tasks.filter((t) => {
      if (t.type === 'task' || t.type === 'milestone' || t.type === 'deliverable') return true;
      if (!parentIds.has(t.id)) return true;
      return false;
    });

    const cpmTasks: CPMTaskInput[] = actionableTasks.map((t) => ({
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

  // Compute bounding date range for container elements (Phases / Activities)
  const getContainerSpan = useMemo(() => {
    return (containerId: string) => {
      const collectChildTasks = (pId: string): any[] => {
        const direct = tasks.filter((t) => t.parentId === pId);
        let list: any[] = [];
        for (const d of direct) {
          if (d.type === 'task' || d.type === 'milestone' || d.type === 'deliverable') {
            list.push(d);
          } else {
            list = list.concat(collectChildTasks(d.id));
          }
        }
        return list;
      };

      const children = collectChildTasks(containerId);
      if (children.length === 0) return null;

      let minStart: number = Infinity;
      let maxEnd: number = -Infinity;

      for (const ct of children) {
        const cNode = cpmData.nodes.get(ct.id);
        const sStr = (cNode && cNode.earlyStartDate) || ct.startDate;
        const eStr = (cNode && cNode.earlyFinishDate) || ct.endDate || sStr;

        if (sStr) {
          const sTs = new Date(sStr + 'T00:00:00Z').getTime();
          if (sTs < minStart) minStart = sTs;
        }
        if (eStr) {
          const eTs = new Date(eStr + 'T00:00:00Z').getTime();
          if (eTs > maxEnd) maxEnd = eTs;
        }
      }

      if (minStart === Infinity || maxEnd === -Infinity) return null;
      return { minStartTs: minStart, maxEndTs: maxEnd };
    };
  }, [tasks, cpmData]);

  // Project timeline bounds
  const { startTs, endTs, totalDays, datesArray } = useMemo(() => {
    let s = cpmData.projectEarlyStartDate ? new Date(cpmData.projectEarlyStartDate + 'T00:00:00Z').getTime() : 0;
    let e = cpmData.projectEarlyFinishDate ? new Date(cpmData.projectEarlyFinishDate + 'T00:00:00Z').getTime() : 0;

    // Check container spans as well
    tasks.forEach((t) => {
      if (t.startDate) {
        const ts = new Date(t.startDate + 'T00:00:00Z').getTime();
        if (!s || ts < s) s = ts;
      }
      if (t.endDate) {
        const te = new Date(t.endDate + 'T00:00:00Z').getTime();
        if (!e || te > e) e = te;
      }
    });

    if (!s) s = new Date().getTime();
    if (!e || e <= s) e = s + 15 * 86400000;

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
  }, [cpmData, tasks]);

  // Check if any ancestor is collapsed
  const isAncestorCollapsed = (taskId: string): boolean => {
    let curr = taskMap.get(taskId);
    while (curr && curr.parentId) {
      if (collapsedContainers[curr.parentId]) return true;
      curr = taskMap.get(curr.parentId);
    }
    return false;
  };

  // Hierarchical list of sorted tasks
  const sortedDisplayTasks = useMemo(() => {
    const sorted = [...tasks].sort((a, b) => a.wbs.localeCompare(b.wbs, undefined, { numeric: true }));
    return sorted.filter((t) => {
      if (filterCritical) {
        const cNode = cpmData.nodes.get(t.id);
        if (t.type === 'task' || t.type === 'milestone') {
          if (!cNode?.isCritical) return false;
        }
      }

      if (isAncestorCollapsed(t.id)) {
        return false;
      }
      return true;
    });
  }, [tasks, filterCritical, cpmData, collapsedContainers]);

  const toggleContainer = (id: string) => {
    setCollapsedContainers((prev) => ({ ...prev, [id]: !prev[id] }));
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
              const isActivity = t.type === 'activity';
              const isMilestone = t.type === 'milestone';
              const isContainer = isPhase || isActivity;
              const isCollapsed = collapsedContainers[t.id];
              const cpmNode = cpmData.nodes.get(t.id);
              const isCritical = cpmNode?.isCritical;

              return (
                <div
                  key={t.id}
                  onClick={() => onSelectTask?.(t)}
                  style={{ paddingLeft: `${Math.max(12, depth * 16 + 8)}px` }}
                  className={`flex h-11 items-center justify-between pr-3 text-xs cursor-pointer transition hover:bg-slate-50 ${
                    isPhase
                      ? 'bg-slate-100/70 font-bold text-slate-900 border-l-4 border-l-slate-700'
                      : isActivity
                      ? 'bg-indigo-50/40 font-semibold text-indigo-950'
                      : 'text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    {isContainer ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleContainer(t.id);
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
                const isActivity = t.type === 'activity';
                const isContainer = isPhase || isActivity;
                const cpmNode = cpmData.nodes.get(t.id);
                const isCritical = cpmNode?.isCritical;

                // Determine start and duration offsets
                let taskStartOffset = 0;
                let taskDuration = 1;

                if (isContainer) {
                  const span = getContainerSpan(t.id);
                  if (span) {
                    taskStartOffset = Math.max(0, Math.round((span.minStartTs - startTs) / (1000 * 60 * 60 * 24)));
                    taskDuration = Math.max(1, Math.round((span.maxEndTs - span.minStartTs) / (1000 * 60 * 60 * 24)));
                  } else if (t.startDate) {
                    taskStartOffset = Math.max(0, Math.round((new Date(t.startDate + 'T00:00:00Z').getTime() - startTs) / (1000 * 60 * 60 * 24)));
                    if (t.endDate) {
                      taskDuration = Math.max(1, Math.round((new Date(t.endDate + 'T00:00:00Z').getTime() - new Date(t.startDate + 'T00:00:00Z').getTime()) / (1000 * 60 * 60 * 24)));
                    }
                  }
                } else if (cpmNode) {
                  taskStartOffset = cpmNode.earlyStart;
                  taskDuration = cpmNode.duration;
                } else if (t.startDate) {
                  taskStartOffset = Math.max(0, Math.round((new Date(t.startDate + 'T00:00:00Z').getTime() - startTs) / (1000 * 60 * 60 * 24)));
                  if (t.endDate) {
                    taskDuration = Math.max(1, Math.round((new Date(t.endDate + 'T00:00:00Z').getTime() - new Date(t.startDate + 'T00:00:00Z').getTime()) / (1000 * 60 * 60 * 24)));
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
                        title={`${t.wbs} — ${t.title} (Jalon)`}
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
                    ) : isPhase ? (
                      /* Phase Summary Bracket (MS Project style) */
                      <div
                        style={{ left: `${barLeftPx}px`, width: `${barWidthPx}px` }}
                        className="absolute z-10 h-3 bg-slate-800 rounded-xs shadow-xs"
                        title={`Phase ${t.wbs} : ${t.title} (${taskDuration}j, ${pct}% global)`}
                      >
                        {/* Downward triangle brackets at both ends */}
                        <div className="absolute -left-1 top-0 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[8px] border-t-slate-800" />
                        <div className="absolute -right-1 top-0 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[8px] border-t-slate-800" />
                        {/* Progress fill */}
                        <div
                          style={{ width: `${pct}%` }}
                          className="h-full bg-slate-950 rounded-xs"
                        />
                      </div>
                    ) : isActivity ? (
                      /* Activity Summary Bracket */
                      <div
                        style={{ left: `${barLeftPx}px`, width: `${barWidthPx}px` }}
                        className="absolute z-10 h-2.5 bg-indigo-700 rounded-xs shadow-xs"
                        title={`Activité ${t.wbs} : ${t.title} (${taskDuration}j, ${pct}% global)`}
                      >
                        <div className="absolute -left-0.5 top-0 w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-t-[6px] border-t-indigo-700" />
                        <div className="absolute -right-0.5 top-0 w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-t-[6px] border-t-indigo-700" />
                        <div
                          style={{ width: `${pct}%` }}
                          className="h-full bg-indigo-950 rounded-xs"
                        />
                      </div>
                    ) : (
                      /* Operational Task Progress Bar */
                      <div
                        style={{ left: `${barLeftPx}px`, width: `${barWidthPx}px` }}
                        className={`absolute z-10 h-5 rounded-md shadow-xs overflow-hidden transition-all duration-200 border ${
                          isCritical
                            ? 'bg-red-500 border-red-700 ring-1 ring-red-300'
                            : 'bg-indigo-500 border-indigo-700'
                        }`}
                        title={`${t.wbs} — ${t.title} (${taskDuration}j, ${pct}% réalisé)`}
                      >
                        {/* Progress Fill */}
                        <div
                          style={{ width: `${pct}%` }}
                          className={`h-full transition-all duration-300 ${
                            isCritical ? 'bg-red-800' : 'bg-indigo-700'
                          }`}
                        />

                        {/* Text inside bar if wide enough */}
                        {barWidthPx > 60 && (
                          <span className="absolute inset-0 flex items-center px-2 text-[9px] font-bold text-white truncate pointer-events-none drop-shadow-xs">
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
