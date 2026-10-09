import React, { useState, useMemo, useRef, useLayoutEffect, useEffect } from 'react';
import { calculateCPM, CPMTaskInput, CPMDependencyInput, CPMNodeResult } from '@orgdashio/shared';
import { Button } from '@orgdashio/ui';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Flame,
  ShieldCheck,
  Flag,
  ArrowRight,
  Info,
  Calendar,
  Layers,
  Sparkles,
  GitBranch,
  TableProperties,
  Eye,
  CheckCircle2,
  ListTodo,
} from 'lucide-react';

interface PertNetworkDiagramProps {
  tasks: any[];
  dependencies: any[];
  onSelectTask?: (task: any) => void;
}

interface SvgConnection {
  id: string;
  fromId: string;
  toId: string;
  type: string;
  lag: number;
  isCritical: boolean;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export function PertNetworkDiagram({ tasks, dependencies, onSelectTask }: PertNetworkDiagramProps) {
  const [zoom, setZoom] = useState(1);
  const [selectedPhaseFilter, setSelectedPhaseFilter] = useState<string>('all');
  const [showCriticalOnly, setShowCriticalOnly] = useState(false);
  const [showConnections, setShowConnections] = useState(true);
  const [showCalendarDates, setShowCalendarDates] = useState(true);
  const [viewMode, setViewMode] = useState<'diagram' | 'table'>('diagram');
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const contentWrapperRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [connections, setConnections] = useState<SvgConnection[]>([]);

  // Phases for filtering
  const rootPhases = useMemo(() => tasks.filter((t) => t.type === 'phase'), [tasks]);
  const taskMap = useMemo(() => new Map(tasks.map((t) => [t.id, t])), [tasks]);

  const getAncestorPhase = useMemo(() => {
    return (taskId: string) => {
      let curr = taskMap.get(taskId);
      while (curr) {
        if (curr.type === 'phase') return curr;
        if (!curr.parentId) break;
        curr = taskMap.get(curr.parentId);
      }
      return null;
    };
  }, [taskMap]);

  const getParentActivity = useMemo(() => {
    return (taskId: string) => {
      const task = taskMap.get(taskId);
      if (!task || !task.parentId) return null;
      const parent = taskMap.get(task.parentId);
      if (parent && parent.type === 'activity') return parent;
      return null;
    };
  }, [taskMap]);

  // Compute CPM network strictly on actionable tasks and milestones
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

  // Group nodes by topological level for PERT columns layout
  const levelColumns = useMemo(() => {
    const columns: CPMNodeResult[][] = [];
    cpmData.nodeList.forEach((node) => {
      if (selectedPhaseFilter !== 'all') {
        const rootP = getAncestorPhase(node.id);
        if (!rootP || rootP.id !== selectedPhaseFilter) {
          return;
        }
      }

      if (showCriticalOnly && !node.isCritical) return;

      const lvl = node.topologicalLevel || 0;
      if (!columns[lvl]) columns[lvl] = [];
      columns[lvl].push(node);
    });
    return columns.filter((col) => col && col.length > 0);
  }, [cpmData, selectedPhaseFilter, showCriticalOnly, getAncestorPhase]);

  // Calculate SVG curve coordinates between node cards
  const updateConnections = () => {
    if (!contentWrapperRef.current) return;
    const wrapperRect = contentWrapperRef.current.getBoundingClientRect();

    const newConns: SvgConnection[] = [];
    dependencies.forEach((dep) => {
      const fromEl = nodeRefs.current.get(dep.predecessorId);
      const toEl = nodeRefs.current.get(dep.successorId);
      if (!fromEl || !toEl) return;

      const fromRect = fromEl.getBoundingClientRect();
      const toRect = toEl.getBoundingClientRect();

      // Scaled coordinates relative to the contentWrapper container
      const startX = (fromRect.right - wrapperRect.left) / zoom;
      const startY = (fromRect.top + fromRect.height / 2 - wrapperRect.top) / zoom;
      const endX = (toRect.left - wrapperRect.left) / zoom;
      const endY = (toRect.top + toRect.height / 2 - wrapperRect.top) / zoom;

      const fromNode = cpmData.nodes.get(dep.predecessorId);
      const toNode = cpmData.nodes.get(dep.successorId);
      const isCritical = Boolean(fromNode?.isCritical && toNode?.isCritical);

      newConns.push({
        id: dep.id || `${dep.predecessorId}-${dep.successorId}`,
        fromId: dep.predecessorId,
        toId: dep.successorId,
        type: dep.type || 'FS',
        lag: dep.lagDays || 0,
        isCritical,
        startX,
        startY,
        endX,
        endY,
      });
    });

    setConnections(newConns);
  };

  useLayoutEffect(() => {
    updateConnections();
  }, [levelColumns, zoom, dependencies, viewMode]);

  useEffect(() => {
    const handleResize = () => updateConnections();
    window.addEventListener('resize', handleResize);
    const timer = setTimeout(updateConnections, 100);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, [levelColumns, zoom, dependencies]);

  // Active highlighted nodes & links
  const activeFocusId = hoveredNodeId || selectedNodeId;

  return (
    <div className="space-y-6">
      {/* ── Top Toolbar & KPI Summary ── */}
      <div className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 text-red-600 font-bold">
                <Flame className="h-4 w-4" />
              </span>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Réseau Logique PERT & Chemin Critique (CPM)</h3>
                <p className="text-xs text-slate-500">
                  Precedence Diagramming Method (PDM) avec calcul des marges, dates au plus tôt / tard et liaisons vectorielles
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Toggle: Diagram vs Table */}
            <div className="flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setViewMode('diagram')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition ${
                  viewMode === 'diagram' ? 'bg-white text-indigo-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <GitBranch className="h-3.5 w-3.5" />
                Diagramme Réseau
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition ${
                  viewMode === 'table' ? 'bg-white text-indigo-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <TableProperties className="h-3.5 w-3.5" />
                Matrice CPM Détaillée
              </button>
            </div>

            {/* Phase filter */}
            <select
              value={selectedPhaseFilter}
              onChange={(e) => setSelectedPhaseFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs"
            >
              <option value="all">Toutes les phases ({cpmData.nodeList.length} tâches & jalons)</option>
              {rootPhases.map((p) => {
                const countInPhase = cpmData.nodeList.filter((n) => getAncestorPhase(n.id)?.id === p.id).length;
                return (
                  <option key={p.id} value={p.id}>
                    Phase {p.wbs} — {p.title} ({countInPhase} tâches)
                  </option>
                );
              })}
            </select>

            {/* Critical only toggle */}
            <button
              onClick={() => setShowCriticalOnly(!showCriticalOnly)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition border ${
                showCriticalOnly
                  ? 'bg-red-600 text-white border-red-700 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Flame className="h-3.5 w-3.5" />
              Chemin critique ({cpmData.criticalPath.length})
            </button>

            {/* Toggle Connections visibility */}
            {viewMode === 'diagram' && (
              <button
                onClick={() => setShowConnections(!showConnections)}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition border ${
                  showConnections ? 'bg-indigo-50 text-indigo-700 border-indigo-200 font-bold' : 'bg-white text-slate-600 border-slate-200'
                }`}
                title="Afficher / Masquer les flèches de liaison"
              >
                <GitBranch className="h-3.5 w-3.5" />
                Liaisons {showConnections ? 'ON' : 'OFF'}
              </button>
            )}

            {/* Toggle Calendar Dates */}
            <button
              onClick={() => setShowCalendarDates(!showCalendarDates)}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition border ${
                showCalendarDates ? 'bg-indigo-50 text-indigo-700 border-indigo-200 font-bold' : 'bg-white text-slate-600 border-slate-200'
              }`}
              title="Afficher les dates calendaires (JJ/MM/AAAA) en plus des jours relatifs (J+x)"
            >
              <Calendar className="h-3.5 w-3.5" />
              Dates {showCalendarDates ? 'ON' : 'OFF'}
            </button>

            {/* Zoom Controls (Diagram view) */}
            {viewMode === 'diagram' && (
              <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5 shadow-xs">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 text-slate-600"
                  onClick={() => setZoom((z) => Math.max(0.6, Math.round((z - 0.1) * 10) / 10))}
                  title="Dézoomer"
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </Button>
                <span className="px-2 font-mono text-xs font-bold text-slate-600">{Math.round(zoom * 100)}%</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 text-slate-600"
                  onClick={() => setZoom((z) => Math.min(1.4, Math.round((z + 0.1) * 10) / 10))}
                  title="Zoomer"
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 text-slate-600"
                  onClick={() => setZoom(1)}
                  title="Réinitialiser"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* CPM Metrics Strip */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 border-t border-slate-100 pt-3">
          <div className="rounded-lg bg-slate-50 p-3 border border-slate-200/60">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Durée Incompressible</span>
            <p className="mt-0.5 text-xl font-extrabold text-slate-900">
              {cpmData.projectDurationDays} <span className="text-xs font-normal text-slate-500">jours ouvrés</span>
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
              Du {cpmData.projectEarlyStartDate} au {cpmData.projectEarlyFinishDate}
            </p>
          </div>

          <div className="rounded-lg bg-red-50/80 p-3 border border-red-200">
            <span className="text-[11px] font-bold text-red-700 uppercase tracking-wider flex items-center gap-1">
              <Flame className="h-3 w-3" />
              Chemin Critique (0 Marge)
            </span>
            <p className="mt-0.5 text-xl font-extrabold text-red-700">
              {cpmData.criticalPath.length} <span className="text-xs font-semibold text-red-600">tâche(s) clé(s)</span>
            </p>
            <p className="text-[10px] text-red-600/80 mt-0.5 font-mono font-bold truncate">
              {cpmData.criticalPathWbs.join(' → ') || 'Aucune tâche critique'}
            </p>
          </div>

          <div className="rounded-lg bg-indigo-50/70 p-3 border border-indigo-200">
            <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Incertitude PERT (95%)
            </span>
            <p className="mt-0.5 text-xl font-extrabold text-indigo-900">
              ± {cpmData.pertStatistics.criticalPathStdDev} <span className="text-xs font-normal text-indigo-700">j (σ)</span>
            </p>
            <p className="text-[10px] text-indigo-600 mt-0.5 font-medium">
              Intervalle : {cpmData.pertStatistics.confidenceInterval95.minDays} à {cpmData.pertStatistics.confidenceInterval95.maxDays} jours
            </p>
          </div>

          <div className="rounded-lg bg-emerald-50/70 p-3 border border-emerald-200">
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" />
              Liaisons Actives
            </span>
            <p className="mt-0.5 text-xl font-extrabold text-emerald-900">{dependencies.length}</p>
            <p className="text-[10px] text-emerald-600 mt-0.5 font-medium">Contraintes de précédence PDM</p>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* VUE 1 : DIAGRAMME DE RÉSEAU FLÉCHÉ PERT / PDM                   */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {viewMode === 'diagram' && (
        <div
          ref={containerRef}
          className="relative overflow-x-auto rounded-xl border border-slate-200 bg-slate-900/5 p-8 shadow-inner min-h-[550px]"
        >
          <div
            ref={contentWrapperRef}
            style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
            className="relative transition-transform duration-150 inline-block min-w-full pb-16"
          >
            {/* SVG Connecting Lines Overlay */}
            {showConnections && connections.length > 0 && (
              <svg
                className="pointer-events-none absolute inset-0 h-full w-full overflow-visible z-10"
                style={{ minWidth: '100%', minHeight: '100%' }}
              >
                <defs>
                  {/* Arrow markers */}
                  <marker
                    id="arrow-normal"
                    viewBox="0 0 10 10"
                    refX="9"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#6366f1" />
                  </marker>
                  <marker
                    id="arrow-critical"
                    viewBox="0 0 10 10"
                    refX="9"
                    refY="5"
                    markerWidth="7"
                    markerHeight="7"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444" />
                  </marker>
                  <marker
                    id="arrow-dimmed"
                    viewBox="0 0 10 10"
                    refX="9"
                    refY="5"
                    markerWidth="5"
                    markerHeight="5"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#cbd5e1" />
                  </marker>
                </defs>

                {connections.map((conn) => {
                  const isFocused =
                    activeFocusId === conn.fromId || activeFocusId === conn.toId;
                  const isDimmed = activeFocusId && !isFocused;

                  const isCriticalConn = conn.isCritical;
                  const strokeColor = isDimmed
                    ? '#cbd5e1'
                    : isCriticalConn
                    ? '#ef4444'
                    : isFocused
                    ? '#4f46e5'
                    : '#818cf8';

                  const strokeWidth = isDimmed ? 1 : isCriticalConn ? 2.5 : isFocused ? 2.5 : 1.75;
                  const markerId = isDimmed
                    ? 'url(#arrow-dimmed)'
                    : isCriticalConn
                    ? 'url(#arrow-critical)'
                    : 'url(#arrow-normal)';

                  // Cubic Bezier curve path
                  const dx = Math.max(35, Math.abs(conn.endX - conn.startX) * 0.45);
                  let pathD = '';

                  if (conn.endX >= conn.startX + 20) {
                    pathD = `M ${conn.startX} ${conn.startY} C ${conn.startX + dx} ${conn.startY}, ${conn.endX - dx} ${conn.endY}, ${conn.endX} ${conn.endY}`;
                  } else {
                    // Loop curve if successor is on previous/same column
                    pathD = `M ${conn.startX} ${conn.startY} C ${conn.startX + 40} ${conn.startY}, ${conn.startX + 40} ${conn.startY + 40}, ${(conn.startX + conn.endX) / 2} ${conn.startY + 40} C ${conn.endX - 40} ${conn.startY + 40}, ${conn.endX - 40} ${conn.endY}, ${conn.endX} ${conn.endY}`;
                  }

                  const midX = (conn.startX + conn.endX) / 2;
                  const midY = (conn.startY + conn.endY) / 2;

                  return (
                    <g key={conn.id} className="transition-opacity duration-200">
                      {/* Drop shadow / glow on critical or focused paths */}
                      {(isCriticalConn || isFocused) && !isDimmed && (
                        <path
                          d={pathD}
                          fill="none"
                          stroke={isCriticalConn ? '#fecaca' : '#c7d2fe'}
                          strokeWidth={strokeWidth + 4}
                          strokeLinecap="round"
                          opacity={0.6}
                        />
                      )}

                      {/* Main connection line */}
                      <path
                        d={pathD}
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth={strokeWidth}
                        strokeDasharray={conn.type !== 'FS' ? '4 3' : undefined}
                        markerEnd={markerId}
                        strokeLinecap="round"
                      />

                      {/* Connection pill label */}
                      {!isDimmed && (
                        <g transform={`translate(${midX}, ${midY})`}>
                          <rect
                            x="-22"
                            y="-9"
                            width="44"
                            height="18"
                            rx="5"
                            fill="white"
                            stroke={strokeColor}
                            strokeWidth={isCriticalConn || isFocused ? '1.5' : '1'}
                            className="shadow-2xs"
                          />
                          <text
                            x="0"
                            y="3.5"
                            textAnchor="middle"
                            fontSize="9"
                            fontFamily="monospace"
                            fontWeight="bold"
                            fill={isCriticalConn ? '#b91c1c' : '#3730a3'}
                          >
                            {conn.type}{conn.lag ? `+${conn.lag}j` : ''}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </svg>
            )}

            {levelColumns.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
                <Flame className="mx-auto mb-3 h-10 w-10 text-slate-300" />
                <p className="font-bold text-slate-700">Aucun élément à afficher dans ce filtre.</p>
                <p className="text-xs text-slate-400 mt-1">
                  Ajoutez des tâches et des dépendances pour générer automatiquement le graphe PERT.
                </p>
              </div>
            ) : (
              <div className="flex items-start gap-16 relative z-20">
                {levelColumns.map((column, colIdx) => (
                  <div key={colIdx} className="flex flex-col gap-8 min-w-[270px] max-w-[290px]">
                    <div className="border-b-2 border-slate-300/80 pb-1 text-center font-mono text-xs font-extrabold uppercase text-slate-600 bg-slate-200/50 rounded-t py-1">
                      Étape / Niveau {colIdx + 1}
                    </div>

                    {column.map((node) => {
                      const isMilestone = node.type === 'milestone';
                      const hasPert = !!node.pertEstimate;
                      const originalTask = tasks.find((t) => t.id === node.id);
                      const isFocused = activeFocusId === node.id;
                      const isDimmed = activeFocusId && !isFocused && !node.predecessorIds.includes(activeFocusId) && !node.successorIds.includes(activeFocusId);

                      return (
                        <div
                          key={node.id}
                          ref={(el) => {
                            if (el) nodeRefs.current.set(node.id, el);
                            else nodeRefs.current.delete(node.id);
                          }}
                          onMouseEnter={() => setHoveredNodeId(node.id)}
                          onMouseLeave={() => setHoveredNodeId(null)}
                          onClick={() => {
                            setSelectedNodeId(selectedNodeId === node.id ? null : node.id);
                            onSelectTask?.(originalTask || node);
                          }}
                          className={`group cursor-pointer rounded-xl border-2 bg-white shadow-md transition-all duration-150 hover:-translate-y-1 hover:shadow-xl relative ${
                            isDimmed ? 'opacity-40 grayscale-[30%]' : 'opacity-100'
                          } ${
                            node.isCritical
                              ? 'border-red-500 ring-2 ring-red-200'
                              : isFocused
                              ? 'border-indigo-600 ring-4 ring-indigo-100 shadow-xl'
                              : 'border-slate-300 hover:border-indigo-500'
                          }`}
                        >
                          {/* Cell 1 : Header Row (ES | Durée | EF) */}
                          <div
                            className={`grid grid-cols-3 border-b text-center text-xs font-bold py-1.5 px-2 rounded-t-lg ${
                              node.isCritical
                                ? 'bg-red-50 text-red-900 border-red-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            <div title={`Date au plus tôt de début (ES) : Jour ${node.earlyStart} (${node.earlyStartDate})`}>
                              <span className="block text-[9px] text-slate-400 font-normal">ES</span>
                              <span className="font-mono">J+{node.earlyStart}</span>
                              {showCalendarDates && (
                                <span className="block text-[9px] text-slate-500 font-mono font-normal truncate">
                                  {node.earlyStartDate.slice(5)}
                                </span>
                              )}
                            </div>
                            <div
                              className="border-x border-slate-200/80 px-1"
                              title={`Durée retenue : ${node.duration} jours`}
                            >
                              <span className="block text-[9px] text-slate-400 font-normal">Durée</span>
                              <span className="font-mono text-indigo-700 font-extrabold">{node.duration} j</span>
                            </div>
                            <div title={`Date au plus tôt de fin (EF) : Jour ${node.earlyFinish} (${node.earlyFinishDate})`}>
                              <span className="block text-[9px] text-slate-400 font-normal">EF</span>
                              <span className="font-mono">J+{node.earlyFinish}</span>
                              {showCalendarDates && (
                                <span className="block text-[9px] text-slate-500 font-mono font-normal truncate">
                                  {node.earlyFinishDate.slice(5)}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Cell 2 : Body (WBS + Titre + Badges) */}
                          <div className="p-3">
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                                {node.wbs}
                              </span>
                              <div className="flex items-center gap-1">
                                {node.isCritical && (
                                  <span className="inline-flex items-center gap-0.5 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
                                    <Flame className="h-3 w-3" /> Critique
                                  </span>
                                )}
                                {isMilestone && (
                                  <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                                    <Flag className="h-3 w-3" /> Jalon
                                  </span>
                                )}
                              </div>
                            </div>

                            {(() => {
                              const rootP = getAncestorPhase(node.id);
                              const parentAct = getParentActivity(node.id);
                              if (!rootP && !parentAct) return null;
                              return (
                                <div className="mb-1 flex items-center gap-1 text-[10px] text-indigo-700/90 font-semibold truncate">
                                  <Layers className="h-2.5 w-2.5 shrink-0 text-indigo-500" />
                                  <span className="truncate">
                                    {rootP ? rootP.title : ''}{parentAct ? ` › ${parentAct.title}` : ''}
                                  </span>
                                </div>
                              );
                            })()}

                            <h4 className="font-bold text-slate-900 text-xs line-clamp-2 leading-tight">
                              {node.title}
                            </h4>

                            {/* Predecessors / Successors summary */}
                            <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-100 pt-2">
                              <span>⏮️ Amont : <strong className="font-bold text-slate-700">{node.predecessorIds.length}</strong></span>
                              <span>⏭️ Aval : <strong className="font-bold text-slate-700">{node.successorIds.length}</strong></span>
                              {hasPert && (
                                <span className="font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded" title={`PERT 3-Points (O:${node.pertEstimate?.optimistic} / M:${node.pertEstimate?.mostLikely} / P:${node.pertEstimate?.pessimistic})`}>
                                  🎯 PERT
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Cell 3 : Footer Row (LS | Marge Totale | LF) */}
                          <div
                            className={`grid grid-cols-3 border-t text-center text-xs font-bold py-1.5 px-2 rounded-b-lg ${
                              node.isCritical
                                ? 'bg-red-50 text-red-900 border-red-200'
                                : 'bg-slate-50 text-slate-600 border-slate-200'
                            }`}
                          >
                            <div title={`Date au plus tard de début (LS) : Jour ${node.lateStart} (${node.lateStartDate})`}>
                              <span className="block text-[9px] text-slate-400 font-normal">LS</span>
                              <span className="font-mono">J+{node.lateStart}</span>
                              {showCalendarDates && (
                                <span className="block text-[9px] text-slate-500 font-mono font-normal truncate">
                                  {node.lateStartDate.slice(5)}
                                </span>
                              )}
                            </div>
                            <div
                              className={`border-x border-slate-200/80 px-1 ${
                                node.isCritical ? 'text-red-600 font-extrabold' : 'text-emerald-700'
                              }`}
                              title={`Marge Totale (TF = LS - ES) : ${node.totalFloat} j | Marge Libre : ${node.freeFloat} j`}
                            >
                              <span className="block text-[9px] text-slate-400 font-normal">Marge</span>
                              <span className="font-mono font-extrabold">{node.totalFloat} j</span>
                            </div>
                            <div title={`Date au plus tard de fin (LF) : Jour ${node.lateFinish} (${node.lateFinishDate})`}>
                              <span className="block text-[9px] text-slate-400 font-normal">LF</span>
                              <span className="font-mono">J+{node.lateFinish}</span>
                              {showCalendarDates && (
                                <span className="block text-[9px] text-slate-500 font-mono font-normal truncate">
                                  {node.lateFinishDate.slice(5)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* VUE 2 : TABLEAU / MATRICE CPM SYNTHÉTIQUE                       */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {viewMode === 'table' && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b bg-slate-50 flex items-center justify-between">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <TableProperties className="h-4 w-4 text-indigo-600" />
              Matrice de Calcul CPM & Ordonnancement Logique
            </h4>
            <span className="text-xs text-slate-500 font-medium font-mono">
              {cpmData.nodeList.length} éléments ordonnancés
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 font-mono">WBS</th>
                  <th className="px-4 py-3">Tâche / Livrable</th>
                  <th className="px-3 py-3 text-center">Durée</th>
                  <th className="px-3 py-3 text-center">Niveau</th>
                  <th className="px-3 py-3">Prédécesseurs</th>
                  <th className="px-3 py-3 text-center bg-indigo-50/60 text-indigo-900">ES (Au plus tôt)</th>
                  <th className="px-3 py-3 text-center bg-indigo-50/60 text-indigo-900">EF (Au plus tôt)</th>
                  <th className="px-3 py-3 text-center bg-slate-200/60 text-slate-800">LS (Au plus tard)</th>
                  <th className="px-3 py-3 text-center bg-slate-200/60 text-slate-800">LF (Au plus tard)</th>
                  <th className="px-3 py-3 text-center">Marge Totale</th>
                  <th className="px-3 py-3 text-center">Marge Libre</th>
                  <th className="px-4 py-3 text-center">Chemin Critique</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {cpmData.nodeList.map((node) => {
                  const originalTask = tasks.find((t) => t.id === node.id);
                  const predDeps = dependencies.filter((d) => d.successorId === node.id);

                  return (
                    <tr
                      key={node.id}
                      onClick={() => onSelectTask?.(originalTask || node)}
                      className={`hover:bg-indigo-50/40 cursor-pointer transition ${
                        node.isCritical ? 'bg-red-50/40 font-semibold' : ''
                      }`}
                    >
                      <td className="px-4 py-3 font-mono font-bold text-slate-600">{node.wbs}</td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{node.title}</div>
                        {showCalendarDates && (
                          <div className="text-[11px] text-slate-400 font-medium">
                            {node.earlyStartDate} → {node.earlyFinishDate}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center font-mono font-bold text-indigo-700">
                        {node.duration} j
                      </td>
                      <td className="px-3 py-3 text-center font-mono text-slate-500 font-bold">
                        {node.topologicalLevel + 1}
                      </td>
                      <td className="px-3 py-3">
                        {predDeps.length === 0 ? (
                          <span className="text-emerald-700 font-bold text-[11px]">T₀ (Début projet)</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {predDeps.map((p) => {
                              const predTask = tasks.find((t) => t.id === p.predecessorId);
                              return (
                                <span
                                  key={p.id}
                                  className="font-mono bg-violet-50 text-violet-800 border border-violet-200 rounded px-1.5 py-0.5 text-[10px] font-bold"
                                >
                                  {predTask?.wbs || '?'}:{p.type}{p.lagDays ? `+${p.lagDays}j` : ''}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center font-mono bg-indigo-50/40 font-bold text-indigo-950">
                        J+{node.earlyStart}
                      </td>
                      <td className="px-3 py-3 text-center font-mono bg-indigo-50/40 font-bold text-indigo-950">
                        J+{node.earlyFinish}
                      </td>
                      <td className="px-3 py-3 text-center font-mono bg-slate-100/60 text-slate-800">
                        J+{node.lateStart}
                      </td>
                      <td className="px-3 py-3 text-center font-mono bg-slate-100/60 text-slate-800">
                        J+{node.lateFinish}
                      </td>
                      <td className={`px-3 py-3 text-center font-mono font-extrabold ${node.isCritical ? 'text-red-600' : 'text-emerald-700'}`}>
                        {node.totalFloat} j
                      </td>
                      <td className="px-3 py-3 text-center font-mono font-semibold text-slate-600">
                        {node.freeFloat} j
                      </td>
                      <td className="px-4 py-3 text-center">
                        {node.isCritical ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-[11px] font-extrabold text-red-700 border border-red-200">
                            <Flame className="h-3 w-3" /> Critique
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-400 text-[11px]">
                            —
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── PERT Legend & Best Practices ── */}
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <h4 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
          <Info className="h-4 w-4 text-indigo-600" />
          Légende & Guide de Lecture du Réseau PERT / PDM
        </h4>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 text-xs text-slate-600">
          <div className="rounded-lg border bg-slate-50 p-3 space-y-1.5">
            <strong className="text-slate-800 block">Structure du Nœud PERT :</strong>
            <p>• <strong>ES (Early Start)</strong> : Date de début au plus tôt</p>
            <p>• <strong>Durée</strong> : Durée retenue (ou Te selon formule PERT 3-points)</p>
            <p>• <strong>EF (Early Finish)</strong> : Date de fin au plus tôt (ES + Durée)</p>
            <p>• <strong>LS (Late Start)</strong> : Date de début au plus tard</p>
            <p>• <strong>Marge Totale</strong> : Marge admissible (LS - ES). Si 0 = Tâche critique</p>
            <p>• <strong>LF (Late Finish)</strong> : Date de fin au plus tard</p>
          </div>

          <div className="rounded-lg border bg-red-50/60 p-3 space-y-1.5 border-red-200">
            <strong className="text-red-900 block flex items-center gap-1">
              <Flame className="h-3.5 w-3.5 text-red-600" />
              Chemin Critique (Critical Path) :
            </strong>
            <p>
              Séquence de tâches dont la <strong>marge totale est nulle</strong>. Les liaisons critiques apparaissent en rouge vif. Tout retard d'un jour sur ce chemin repousse l'échéance finale du projet.
            </p>
            <p className="text-[11px] text-red-700 font-semibold">
              💡 Concentrez les ressources et le pilotage sur ces activités clés.
            </p>
          </div>

          <div className="rounded-lg border bg-indigo-50/60 p-3 space-y-1.5 border-indigo-200">
            <strong className="text-indigo-900 block flex items-center gap-1">
              <GitBranch className="h-3.5 w-3.5 text-indigo-600" />
              Types de Liaisons de Précédence :
            </strong>
            <p>• <strong>FS (Fin à Début)</strong> : Le prédécesseur doit finir pour démarrer le successeur</p>
            <p>• <strong>SS (Début à Début)</strong> : Démarrent en parallèle avec éventuel décalage (lag)</p>
            <p>• <strong>FF (Fin à Fin)</strong> : Fin synchronisée avec décalage</p>
            <p>• <strong>SF (Début à Fin)</strong> : Relation inversée</p>
          </div>
        </div>
      </div>
    </div>
  );
}
