import React, { useState } from 'react';
import { Button, Input } from '@orgdashio/ui';
import {
  AlertTriangle,
  Flame,
  Plus,
  Trash2,
  Filter,
  Search,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  HelpCircle,
  Network,
} from 'lucide-react';

interface RaidItem {
  id: string;
  type: 'risk' | 'issue' | 'assumption' | 'dependency';
  title: string;
  description?: string | null;
  probability?: number | null;
  impact?: number | null;
  ownerName?: string | null;
  status?: string | null;
}

interface RaidHeatmapViewProps {
  raidItems: RaidItem[];
  planItems: any[];
  updates: any[];
  members: any[];
  onAddRaidItem: (item: Partial<RaidItem>) => Promise<void>;
  onDeleteRaidItem: (id: string) => Promise<void>;
  onSelectTask?: (task: any) => void;
}

const RAID_TYPE_CONFIG: Record<
  string,
  { label: string; singular: string; color: string; badgeCls: string; icon: React.ReactNode }
> = {
  risk: {
    label: 'Risques',
    singular: 'Risque',
    color: 'bg-red-100 text-red-800 border-red-200',
    badgeCls: 'bg-red-50 text-red-700 border-red-200',
    icon: <AlertTriangle className="h-3.5 w-3.5 text-red-600" />,
  },
  issue: {
    label: 'Enjeux / Incidents',
    singular: 'Enjeu',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    badgeCls: 'bg-orange-50 text-orange-700 border-orange-200',
    icon: <Flame className="h-3.5 w-3.5 text-orange-600" />,
  },
  assumption: {
    label: 'Hypothèses',
    singular: 'Hypothèse',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    badgeCls: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: <HelpCircle className="h-3.5 w-3.5 text-blue-600" />,
  },
  dependency: {
    label: 'Dépendances Clés',
    singular: 'Dépendance',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    badgeCls: 'bg-purple-50 text-purple-700 border-purple-200',
    icon: <Network className="h-3.5 w-3.5 text-purple-600" />,
  },
};

export function RaidHeatmapView({
  raidItems,
  planItems,
  updates,
  members,
  onAddRaidItem,
  onDeleteRaidItem,
  onSelectTask,
}: RaidHeatmapViewProps) {
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCell, setSelectedCell] = useState<{ prob: number; imp: number } | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [newType, setNewType] = useState<RaidItem['type']>('risk');
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newProb, setNewProb] = useState(3);
  const [newImpact, setNewImpact] = useState(3);
  const [newOwner, setNewOwner] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Blocked Tasks calculation
  const blockedTasks = planItems.filter((p) => p.status === 'blocked');

  // Heatmap Matrix Grid (5x5: Probability 5 down to 1, Impact 1 to 5)
  const probabilities = [5, 4, 3, 2, 1];
  const impacts = [1, 2, 3, 4, 5];

  const getCellColor = (prob: number, imp: number) => {
    const score = prob * imp;
    if (score >= 15) return 'bg-red-500/15 border-red-300 text-red-900 hover:bg-red-500/25';
    if (score >= 10) return 'bg-orange-500/15 border-orange-300 text-orange-900 hover:bg-orange-500/25';
    if (score >= 5) return 'bg-amber-500/15 border-amber-300 text-amber-900 hover:bg-amber-500/25';
    return 'bg-emerald-500/15 border-emerald-300 text-emerald-900 hover:bg-emerald-500/25';
  };

  const getSeverityBadge = (prob?: number | null, imp?: number | null) => {
    const score = (prob || 1) * (imp || 1);
    if (score >= 15) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold bg-red-100 text-red-800 border border-red-300">
          Critique ({score}/25)
        </span>
      );
    }
    if (score >= 10) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold bg-orange-100 text-orange-800 border border-orange-300">
          Majeur ({score}/25)
        </span>
      );
    }
    if (score >= 5) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
          Modéré ({score}/25)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
        Faible ({score}/25)
      </span>
    );
  };

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    try {
      setIsSubmitting(true);
      await onAddRaidItem({
        type: newType,
        title: newTitle.trim(),
        description: newDesc.trim() || null,
        probability: newProb,
        impact: newImpact,
        ownerName: newOwner.trim() || null,
      });
      setNewTitle('');
      setNewDesc('');
      setNewProb(3);
      setNewImpact(3);
      setNewOwner('');
      setShowAddForm(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter items
  const filteredRaidItems = raidItems.filter((item) => {
    if (selectedType !== 'all' && item.type !== selectedType) return false;
    if (selectedCell) {
      if (item.probability !== selectedCell.prob || item.impact !== selectedCell.imp) return false;
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchTitle = item.title?.toLowerCase().includes(term);
      const matchDesc = item.description?.toLowerCase().includes(term);
      const matchOwner = item.ownerName?.toLowerCase().includes(term);
      return matchTitle || matchDesc || matchOwner;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* ── 1. Early Warnings Strip (Alertes Prédictives) ── */}
      {blockedTasks.length > 0 && (
        <div className="rounded-2xl border border-red-300 bg-red-50/80 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-red-600" />
              <h3 className="font-bold text-red-950 text-sm">
                Radar d'Alerte : {blockedTasks.length} Tâche(s) Opérationnelle(s) actuellement Bloquée(s)
              </h3>
            </div>
            <span className="text-xs font-bold text-red-700 bg-red-100 px-2.5 py-0.5 rounded-full">
              Action Corrective Requise
            </span>
          </div>

          <div className="divide-y divide-red-200/60 rounded-xl bg-white border border-red-200">
            {blockedTasks.map((t) => {
              const taskUpdates = updates.filter((u) => u.planItemId === t.id && u.blockerReason);
              const latestBlocker = taskUpdates[taskUpdates.length - 1]?.blockerReason || 'Motif non précisé';
              const assignee = members.find((m) => m.id === t.assigneePartyId);

              return (
                <div key={t.id} className="p-3.5 flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-red-800 bg-red-100 px-1.5 py-0.5 rounded">
                        {t.wbs}
                      </span>
                      <span className="font-bold text-sm text-slate-900">{t.title}</span>
                      {assignee && <span className="text-xs text-slate-500">({assignee.name})</span>}
                    </div>
                    <p className="text-xs text-red-700 mt-1 font-medium">🛑 {latestBlocker}</p>
                  </div>
                  {onSelectTask && (
                    <Button
                      size="sm"
                      onClick={() => onSelectTask(t)}
                      className="text-xs font-semibold bg-red-600 hover:bg-red-700 text-white shrink-0"
                    >
                      Débloquer
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 2. Interactive 5x5 Heatmap Matrix ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Heatmap Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4 lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-indigo-600" />
                Matrice d'Évaluation des Risques 5×5 (Probabilité × Impact)
              </h3>
              <p className="text-xs text-slate-500">
                Cartographie matricielle standard PMI : cliquez sur une case pour filtrer les éléments correspondants
              </p>
            </div>
            {selectedCell && (
              <button
                type="button"
                onClick={() => setSelectedCell(null)}
                className="text-xs font-bold text-indigo-600 hover:underline"
              >
                Réinitialiser filtre case (P:{selectedCell.prob}, I:{selectedCell.imp}) ✕
              </button>
            )}
          </div>

          {/* 5x5 Grid */}
          <div className="flex flex-col items-center justify-center p-2">
            <div className="relative w-full max-w-[500px]">
              {/* Y-Axis Label */}
              <div className="absolute -left-7 top-1/2 -translate-y-1/2 -rotate-90 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Probabilité (1 → 5)
              </div>

              {/* Grid Rows */}
              <div className="space-y-1.5 pl-4">
                {probabilities.map((prob) => (
                  <div key={prob} className="flex items-center gap-1.5">
                    <span className="w-5 text-right font-mono text-xs font-bold text-slate-400">{prob}</span>
                    <div className="grid flex-1 grid-cols-5 gap-1.5">
                      {impacts.map((imp) => {
                        const cellItems = raidItems.filter(
                          (r) => (r.probability || 1) === prob && (r.impact || 1) === imp
                        );
                        const isSelected = selectedCell?.prob === prob && selectedCell?.imp === imp;

                        return (
                          <button
                            key={imp}
                            type="button"
                            onClick={() => {
                              if (isSelected) setSelectedCell(null);
                              else setSelectedCell({ prob, imp });
                            }}
                            className={`h-12 rounded-xl border p-1 text-center transition flex flex-col items-center justify-center ${getCellColor(
                              prob,
                              imp
                            )} ${isSelected ? 'ring-2 ring-indigo-600 font-black shadow-md' : 'opacity-90'}`}
                          >
                            <span className="text-[10px] font-mono font-bold">{prob * imp}</span>
                            {cellItems.length > 0 && (
                              <span className="mt-0.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-slate-900 px-1 text-[9px] font-extrabold text-white">
                                {cellItems.length}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* X-Axis Labels */}
                <div className="flex items-center gap-1.5 pt-1">
                  <span className="w-5" />
                  <div className="grid flex-1 grid-cols-5 gap-1.5 text-center font-mono text-xs font-bold text-slate-400">
                    {impacts.map((imp) => (
                      <span key={imp}>{imp}</span>
                    ))}
                  </div>
                </div>
                <div className="text-center text-[11px] font-bold uppercase tracking-wider text-slate-400 pt-1">
                  Impact sur le Projet (1 → 5)
                </div>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2 border-t border-slate-100 text-[11px] font-bold">
            <span className="flex items-center gap-1 text-emerald-700">
              <span className="h-3 w-3 rounded bg-emerald-500/40 border border-emerald-400" /> Faible (1-4)
            </span>
            <span className="flex items-center gap-1 text-amber-700">
              <span className="h-3 w-3 rounded bg-amber-500/40 border border-amber-400" /> Modéré (5-9)
            </span>
            <span className="flex items-center gap-1 text-orange-700">
              <span className="h-3 w-3 rounded bg-orange-500/40 border border-orange-400" /> Majeur (10-14)
            </span>
            <span className="flex items-center gap-1 text-red-700">
              <span className="h-3 w-3 rounded bg-red-500/40 border border-red-400" /> Critique (15-25)
            </span>
          </div>
        </div>

        {/* RAID Quick Summary / Stats */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3">
              Ventilation du Registre RAID
            </h3>

            <div className="mt-4 space-y-3">
              {Object.entries(RAID_TYPE_CONFIG).map(([key, cfg]) => {
                const count = raidItems.filter((r) => r.type === key).length;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedType(selectedType === key ? 'all' : key)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition ${
                      selectedType === key
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-slate-50/70 hover:bg-slate-100 border-slate-200 text-slate-800'
                    }`}
                  >
                    <span className="flex items-center gap-2 text-xs font-bold">
                      {cfg.icon}
                      {cfg.label}
                    </span>
                    <span className="font-mono font-bold text-xs">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            className="w-full text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Plus className="mr-1.5 h-4 w-4" /> Ajouter un élément RAID
          </Button>
        </div>
      </div>

      {/* ── 3. Add Item Form Modal / Drawer ── */}
      {showAddForm && (
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-6 shadow-sm space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-indigo-200/60 pb-3">
            <h3 className="font-bold text-indigo-950 text-sm flex items-center gap-2">
              <Plus className="h-4 w-4 text-indigo-600" />
              Consigner un nouvel élément dans le registre RAID
            </h3>
            <span className="text-xs font-mono font-bold text-indigo-700">
              Sévérité estimée : {newProb * newImpact} / 25
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">Type d'élément *</label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as RaidItem['type'])}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium"
              >
                {Object.entries(RAID_TYPE_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-bold text-slate-700">Titre ou désignation *</label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Ex: Retard d'approvisionnement des composants critiques..."
                className="bg-white text-xs"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="mb-1 block text-xs font-bold text-slate-700">
                Description & Plan de mitigation / Traitement
              </label>
              <textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                rows={2}
                placeholder="Contexte, déclencheur, plan de contingence ou actions préventives..."
                className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs text-slate-800"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">Probabilité (1 à 5) : {newProb}</label>
              <input
                type="range"
                min={1}
                max={5}
                value={newProb}
                onChange={(e) => setNewProb(parseInt(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">Impact (1 à 5) : {newImpact}</label>
              <input
                type="range"
                min={1}
                max={5}
                value={newImpact}
                onChange={(e) => setNewImpact(parseInt(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">Responsable du Risque</label>
              <Input
                value={newOwner}
                onChange={(e) => setNewOwner(e.target.value)}
                placeholder="Nom du pilote..."
                className="bg-white text-xs"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button size="sm" variant="ghost" onClick={() => setShowAddForm(false)} className="text-xs">
              Annuler
            </Button>
            <Button
              size="sm"
              onClick={handleCreate}
              disabled={!newTitle.trim() || isSubmitting}
              className="text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {isSubmitting ? 'Enregistrement...' : 'Enregistrer dans le Registre'}
            </Button>
          </div>
        </div>
      )}

      {/* ── 4. RAID Items Table ── */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="border-b bg-slate-50 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-500" />
            <h4 className="font-bold text-slate-900 text-sm">Registre Détaillé ({filteredRaidItems.length} éléments)</h4>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filtrer par titre, description ou pilote..."
                className="pl-8 text-xs bg-white h-8 w-64"
              />
            </div>
          </div>
        </div>

        {filteredRaidItems.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-xs">
            Aucun élément ne correspond aux filtres actuels.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b bg-slate-50 font-semibold uppercase text-slate-500 tracking-wider">
                <tr>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-4 py-3">Titre & Description</th>
                  <th className="px-4 py-3 text-center">Prob.</th>
                  <th className="px-4 py-3 text-center">Imp.</th>
                  <th className="px-4 py-3 text-center">Sévérité</th>
                  <th className="px-4 py-3">Pilote</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRaidItems
                  .sort((a, b) => (b.probability || 1) * (b.impact || 1) - (a.probability || 1) * (a.impact || 1))
                  .map((item) => {
                    const cfg = RAID_TYPE_CONFIG[item.type] || RAID_TYPE_CONFIG.risk;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50 transition">
                        <td className="px-6 py-3.5">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${cfg.badgeCls}`}>
                            {cfg.icon}
                            {cfg.singular}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-slate-900 text-sm">{item.title}</div>
                          {item.description && (
                            <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">{item.description}</p>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-center font-mono font-bold text-slate-700">{item.probability || 1}</td>
                        <td className="px-4 py-3.5 text-center font-mono font-bold text-slate-700">{item.impact || 1}</td>
                        <td className="px-4 py-3.5 text-center">{getSeverityBadge(item.probability, item.impact)}</td>
                        <td className="px-4 py-3.5 font-medium text-slate-700">{item.ownerName || '—'}</td>
                        <td className="px-6 py-3.5 text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              if (window.confirm(`Supprimer l'élément "${item.title}" du registre ?`)) {
                                onDeleteRaidItem(item.id);
                              }
                            }}
                            className="h-7 w-7 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50"
                            title="Supprimer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
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
