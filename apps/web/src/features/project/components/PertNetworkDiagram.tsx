import React, { useState, useMemo } from 'react';
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
} from 'lucide-react';

interface PertNetworkDiagramProps {
  tasks: any[];
  dependencies: any[];
  onSelectTask?: (task: any) => void;
}

export function PertNetworkDiagram({ tasks, dependencies, onSelectTask }: PertNetworkDiagramProps) {
  const [zoom, setZoom] = useState(1);
  const [selectedPhaseFilter, setSelectedPhaseFilter] = useState<string>('all');
  const [showCriticalOnly, setShowCriticalOnly] = useState(false);

  // Phases for filtering
  const rootPhases = useMemo(() => tasks.filter((t) => t.type === 'phase'), [tasks]);

  // Compute CPM network
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

  // Group nodes by topological level for PERT columns layout
  const levelColumns = useMemo(() => {
    const columns: CPMNodeResult[][] = [];
    cpmData.nodeList.forEach((node) => {
      // Filter out root phases if they are only high-level groupings, or filter by phase
      if (selectedPhaseFilter !== 'all') {
        const taskObj = tasks.find((t) => t.id === node.id);
        if (taskObj?.parentId !== selectedPhaseFilter && taskObj?.id !== selectedPhaseFilter) {
          return;
        }
      }

      if (showCriticalOnly && !node.isCritical) return;

      const lvl = node.topologicalLevel || 0;
      if (!columns[lvl]) columns[lvl] = [];
      columns[lvl].push(node);
    });
    return columns.filter((col) => col && col.length > 0);
  }, [cpmData, selectedPhaseFilter, showCriticalOnly, tasks]);

  return (
    <div className="space-y-6">
      {/* ── Top Toolbar & KPI Summary ── */}
      <div className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 text-red-600 font-bold">
                <Flame className="h-4 w-4" />
              </span>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Réseau Logique PERT & Chemin Critique (CPM)</h3>
                <p className="text-xs text-slate-500">
                  Precedence Diagramming Method (PDM) avec calcul avant/arrière, marges et chemin incompressible
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Phase filter */}
            <select
              value={selectedPhaseFilter}
              onChange={(e) => setSelectedPhaseFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs"
            >
              <option value="all">Toutes les phases ({tasks.length} éléments)</option>
              {rootPhases.map((p) => (
                <option key={p.id} value={p.id}>
                  Phase {p.wbs} — {p.title}
                </option>
              ))}
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
              Chemin critique seul ({cpmData.criticalPath.length})
            </button>

            {/* Zoom Controls */}
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
                onClick={() => setZoom((z) => Math.min(1.5, Math.round((z + 0.1) * 10) / 10))}
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
          </div>
        </div>

        {/* CPM Metrics Strip */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 border-t border-slate-100 pt-3">
          <div className="rounded-lg bg-slate-50 p-3 border border-slate-200/60">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Durée Incompressible</span>
            <p className="mt-0.5 text-xl font-extrabold text-slate-900">
              {cpmData.projectDurationDays} <span className="text-xs font-normal text-slate-500">jours ouvrés</span>
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
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
            <p className="text-[10px] text-red-600/80 mt-0.5 font-mono truncate">
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
            <p className="text-[10px] text-indigo-600 mt-0.5">
              Intervalle : {cpmData.pertStatistics.confidenceInterval95.minDays} à {cpmData.pertStatistics.confidenceInterval95.maxDays} jours
            </p>
          </div>

          <div className="rounded-lg bg-emerald-50/70 p-3 border border-emerald-200">
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" />
              Liaisons Actives
            </span>
            <p className="mt-0.5 text-xl font-extrabold text-emerald-900">{dependencies.length}</p>
            <p className="text-[10px] text-emerald-600 mt-0.5">Dépendances FS / SS / FF / SF</p>
          </div>
        </div>
      </div>

      {/* ── PERT Visual Graph Area ── */}
      <div className="overflow-x-auto rounded-xl border bg-slate-900/5 p-6 shadow-inner min-h-[500px]">
        <div
          style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
          className="transition-transform duration-150 inline-flex flex-col gap-10 min-w-full pb-12"
        >
          {levelColumns.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
              <Flame className="mx-auto mb-3 h-10 w-10 text-slate-300" />
              <p className="font-bold text-slate-700">Aucun élément à afficher dans ce filtre.</p>
              <p className="text-xs text-slate-400 mt-1">
                Ajoutez des tâches et des dépendances pour générer automatiquement le graphe PERT.
              </p>
            </div>
          ) : (
            <div className="flex items-start gap-12">
              {levelColumns.map((column, colIdx) => (
                <div key={colIdx} className="flex flex-col gap-8 min-w-[260px] max-w-[280px]">
                  <div className="border-b-2 border-slate-300 pb-1 text-center font-mono text-xs font-extrabold uppercase text-slate-500">
                    Étape / Niveau {colIdx + 1}
                  </div>

                  {column.map((node) => {
                    const isMilestone = node.type === 'milestone';
                    const hasPert = !!node.pertEstimate;
                    const originalTask = tasks.find((t) => t.id === node.id);

                    return (
                      <div
                        key={node.id}
                        onClick={() => onSelectTask?.(originalTask || node)}
                        className={`group cursor-pointer rounded-xl border-2 bg-white shadow-md transition hover:-translate-y-1 hover:shadow-xl ${
                          node.isCritical
                            ? 'border-red-500 ring-2 ring-red-200'
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
                            J+{node.earlyStart}
                          </div>
                          <div
                            className="border-x border-slate-200/80 px-1"
                            title={`Durée retenue : ${node.duration} jours`}
                          >
                            <span className="block text-[9px] text-slate-400 font-normal">Durée</span>
                            {node.duration} j
                          </div>
                          <div title={`Date au plus tôt de fin (EF) : Jour ${node.earlyFinish} (${node.earlyFinishDate})`}>
                            <span className="block text-[9px] text-slate-400 font-normal">EF</span>
                            J+{node.earlyFinish}
                          </div>
                        </div>

                        {/* Cell 2 : Body (WBS + Titre + Badges) */}
                        <div className="p-3">
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="font-mono text-xs font-bold text-slate-500">{node.wbs}</span>
                            <div className="flex items-center gap-1">
                              {node.isCritical && (
                                <span className="inline-flex items-center gap-0.5 rounded-full bg-red-100 px-1.5 py-0.2 text-[10px] font-bold text-red-700">
                                  <Flame className="h-3 w-3" /> Critique
                                </span>
                              )}
                              {isMilestone && (
                                <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.2 text-[10px] font-bold text-amber-800">
                                  <Flag className="h-3 w-3" /> Jalon
                                </span>
                              )}
                            </div>
                          </div>

                          <h4 className="font-bold text-slate-900 text-xs line-clamp-2 leading-tight">
                            {node.title}
                          </h4>

                          {/* Predecessors / Successors summary */}
                          <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100 pt-2">
                            <span>Amont : <strong>{node.predecessorIds.length}</strong></span>
                            <span>Aval : <strong>{node.successorIds.length}</strong></span>
                            {hasPert && (
                              <span title={`PERT (O:${node.pertEstimate?.optimistic} / M:${node.pertEstimate?.mostLikely} / P:${node.pertEstimate?.pessimistic})`}>
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
                            J+{node.lateStart}
                          </div>
                          <div
                            className={`border-x border-slate-200/80 px-1 ${
                              node.isCritical ? 'text-red-600 font-extrabold' : 'text-emerald-700'
                            }`}
                            title={`Marge Totale (TF = LS - ES) : ${node.totalFloat} j | Marge Libre : ${node.freeFloat} j`}
                          >
                            <span className="block text-[9px] text-slate-400 font-normal">Marge</span>
                            {node.totalFloat} j
                          </div>
                          <div title={`Date au plus tard de fin (LF) : Jour ${node.lateFinish} (${node.lateFinishDate})`}>
                            <span className="block text-[9px] text-slate-400 font-normal">LF</span>
                            J+{node.lateFinish}
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
            <p>• <strong>Marge</strong> : Marge Totale (LS - ES). Si 0 = Tâche critique</p>
            <p>• <strong>LF (Late Finish)</strong> : Date de fin au plus tard</p>
          </div>

          <div className="rounded-lg border bg-red-50/60 p-3 space-y-1.5 border-red-200">
            <strong className="text-red-900 block flex items-center gap-1">
              <Flame className="h-3.5 w-3.5 text-red-600" />
              Chemin Critique (Critical Path) :
            </strong>
            <p>
              Séquence de tâches dont la <strong>marge totale est nulle</strong>. Tout retard d'un jour sur ces tâches
              repousse d'autant la date finale du projet.
            </p>
            <p className="text-[11px] text-red-700">
              💡 <strong>Action requise :</strong> Concentrez les ressources et le suivi hebdomadaire sur ce chemin.
            </p>
          </div>

          <div className="rounded-lg border bg-indigo-50/60 p-3 space-y-1.5 border-indigo-200">
            <strong className="text-indigo-900 block flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
              Estimation PERT à 3 Points :
            </strong>
            <p>
              Formule bêta standard : <span className="font-mono font-semibold">Te = (O + 4M + P) / 6</span>
            </p>
            <p>
              Écart-type : <span className="font-mono font-semibold">σ = (P - O) / 6</span>
            </p>
            <p className="text-[11px] text-indigo-700">
              Permet d'absorber l'incertitude et les aléas de livraison sur les tâches complexes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
