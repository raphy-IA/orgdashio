import React, { useState } from 'react';
import { Button, Input } from '@orgdashio/ui';
import {
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Layers,
  Plus,
  Sparkles,
  Target,
  Trash2,
  ListTodo,
  CheckCircle2,
  FileCheck,
} from 'lucide-react';

interface ResultNode {
  id: string;
  projectId: string;
  parentId?: string | null;
  level: 'impact' | 'outcome' | 'output';
  title: string;
  description?: string | null;
}

interface ProjectLogframeViewProps {
  projectId: string;
  resultNodes: ResultNode[];
  planItems: any[];
  onAddResultNode: (node: Partial<ResultNode>) => Promise<void>;
  onDeleteResultNode: (id: string) => Promise<void>;
  onSelectTask?: (task: any) => void;
}

const LEVEL_CONFIG: Record<
  string,
  { label: string; badgeCls: string; borderCls: string; bgCls: string; icon: string; indent: number }
> = {
  impact: {
    label: 'Impact Global (Objectif Général)',
    badgeCls: 'bg-purple-100 text-purple-900 border-purple-200',
    borderCls: 'border-purple-300',
    bgCls: 'bg-purple-50/50',
    icon: '🌟',
    indent: 0,
  },
  outcome: {
    label: 'Résultat Intermédiaire (Outcome)',
    badgeCls: 'bg-blue-100 text-blue-900 border-blue-200',
    borderCls: 'border-blue-300',
    bgCls: 'bg-blue-50/50',
    icon: '🎯',
    indent: 1,
  },
  output: {
    label: 'Extrant Livrable (Output)',
    badgeCls: 'bg-emerald-100 text-emerald-900 border-emerald-200',
    borderCls: 'border-emerald-300',
    bgCls: 'bg-emerald-50/50',
    icon: '📦',
    indent: 2,
  },
};

export function ProjectLogframeView({
  projectId,
  resultNodes,
  planItems,
  onAddResultNode,
  onDeleteResultNode,
  onSelectTask,
}: ProjectLogframeViewProps) {
  const [showForm, setShowForm] = useState(false);
  const [level, setLevel] = useState<ResultNode['level']>('outcome');
  const [parentId, setParentId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Group nodes by level
  const impacts = resultNodes.filter((r) => r.level === 'impact');
  const outcomes = resultNodes.filter((r) => r.level === 'outcome');
  const outputs = resultNodes.filter((r) => r.level === 'output');

  const handleCreate = async () => {
    if (!title.trim()) return;
    try {
      setIsSubmitting(true);
      await onAddResultNode({
        level,
        parentId: parentId || null,
        title: title.trim(),
        description: description.trim() || null,
      });
      setTitle('');
      setDescription('');
      setParentId('');
      setShowForm(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <Target className="h-5 w-5 text-indigo-600" />
            Cadre Logique & Chaîne de Résultats (GAR / RBM)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Articuler la vision stratégique : de l'impact sociétal aux extrants livrés et activités WBS contributives
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => setShowForm(!showForm)}
          className="text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs shrink-0"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Ajouter un nœud de résultat
        </Button>
      </div>

      {/* ── Summary KPI Strip ── */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-purple-200 bg-purple-50/60 p-4">
          <span className="text-[11px] font-bold text-purple-800 uppercase tracking-wider block">1. Impacts Globaux</span>
          <p className="text-2xl font-black text-purple-950 mt-1">{impacts.length}</p>
          <p className="text-[10px] text-purple-700 mt-0.5">Changement durable à long terme</p>
        </div>

        <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4">
          <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider block">2. Résultats (Outcomes)</span>
          <p className="text-2xl font-black text-blue-950 mt-1">{outcomes.length}</p>
          <p className="text-[10px] text-blue-700 mt-0.5">Effets directs & changements d'état</p>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
          <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">3. Extrants (Outputs)</span>
          <p className="text-2xl font-black text-emerald-950 mt-1">{outputs.length}</p>
          <p className="text-[10px] text-emerald-700 mt-0.5">Biens, services et livrables produits</p>
        </div>
      </div>

      {/* ── Add Result Node Form ── */}
      {showForm && (
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-6 shadow-sm space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-indigo-200/60 pb-3">
            <h4 className="font-bold text-indigo-950 text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-600" />
              Nouveau nœud dans la chaîne de résultats
            </h4>
            <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-100 px-2.5 py-0.5 rounded">
              Niveau : {level.toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">1. Niveau de résultat *</label>
              <select
                value={level}
                onChange={(e) => {
                  const newLevel = e.target.value as ResultNode['level'];
                  setLevel(newLevel);
                  setParentId('');
                }}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold"
              >
                <option value="impact">🌟 Impact Global (Macro)</option>
                <option value="outcome">🎯 Résultat Intermédiaire (Outcome)</option>
                <option value="output">📦 Extrant Livrable (Output)</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-bold text-slate-700">2. Nœud parent de rattachement</label>
              <select
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs"
              >
                <option value="">— Aucun parent (Racine du cadre logique) —</option>
                {resultNodes
                  .filter((rn) => (level === 'output' ? rn.level === 'outcome' || rn.level === 'impact' : rn.level === 'impact'))
                  .map((rn) => (
                    <option key={rn.id} value={rn.id}>
                      [{rn.level.toUpperCase()}] {rn.title}
                    </option>
                  ))}
              </select>
            </div>

            <div className="sm:col-span-3">
              <label className="mb-1 block text-xs font-bold text-slate-700">3. Titre du résultat visé *</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Taux d'insertion professionnelle des jeunes diplômés accru de 30%..."
                className="bg-white text-xs"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="mb-1 block text-xs font-bold text-slate-700">4. Description, indicateurs visés & hypothèses</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Précisez les indicateurs de changement, sources de vérification ou hypothèses de réalisation..."
                className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs text-slate-800"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button size="sm" variant="ghost" onClick={() => setShowForm(false)} className="text-xs">
              Annuler
            </Button>
            <Button
              size="sm"
              onClick={handleCreate}
              disabled={!title.trim() || isSubmitting}
              className="text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {isSubmitting ? 'Enregistrement...' : 'Enregistrer le résultat'}
            </Button>
          </div>
        </div>
      )}

      {/* ── Result Nodes Tree & WBS Alignment Map ── */}
      {resultNodes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center space-y-3">
          <Target className="mx-auto h-12 w-12 text-slate-300" />
          <p className="text-sm font-bold text-slate-700">Aucun nœud de résultat défini dans le cadre logique.</p>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Structurez votre intervention selon la méthode GAR en ajoutant un impact global, puis des résultats et extrants.
          </p>
          <Button size="sm" onClick={() => setShowForm(true)} className="text-xs font-bold bg-indigo-600 text-white">
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Créer le premier résultat
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {(['impact', 'outcome', 'output'] as const).map((lvl) => {
            const nodes = resultNodes.filter((r) => r.level === lvl);
            if (nodes.length === 0) return null;
            const cfg = LEVEL_CONFIG[lvl];

            return (
              <div key={lvl} className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
                <div className="border-b bg-slate-50 px-6 py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{cfg.icon}</span>
                    <h4 className="font-bold text-slate-900 text-sm">{cfg.label}</h4>
                  </div>
                  <span className="text-xs font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {nodes.length} élément(s)
                  </span>
                </div>

                <div className="divide-y divide-slate-100 p-2">
                  {nodes.map((node) => {
                    const linkedTasks = planItems.filter((p) => p.resultNodeId === node.id);
                    const completedLinkedTasks = linkedTasks.filter((p) => p.status === 'completed').length;

                    return (
                      <div key={node.id} className="p-4 hover:bg-slate-50 transition rounded-xl space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${cfg.badgeCls}`}>
                                {lvl.toUpperCase()}
                              </span>
                              <h5 className="font-bold text-sm text-slate-900">{node.title}</h5>
                            </div>
                            {node.description && (
                              <p className="text-xs text-slate-600 leading-relaxed pl-1">{node.description}</p>
                            )}
                          </div>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              if (window.confirm(`Supprimer le nœud "${node.title}" du cadre logique ?`)) {
                                onDeleteResultNode(node.id);
                              }
                            }}
                            className="h-7 w-7 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 shrink-0"
                            title="Supprimer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>

                        {/* WBS Tasks Alignment Ribbon */}
                        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2 text-slate-500">
                            <ListTodo className="h-3.5 w-3.5 text-indigo-600" />
                            <span>
                              Contribution WBS :{' '}
                              <strong className="text-slate-800 font-mono">{linkedTasks.length} tâche(s) reliée(s)</strong>
                              {linkedTasks.length > 0 && ` (${completedLinkedTasks} achevées)`}
                            </span>
                          </div>

                          {linkedTasks.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5">
                              {linkedTasks.map((t) => (
                                <button
                                  key={t.id}
                                  type="button"
                                  onClick={() => onSelectTask?.(t)}
                                  className="inline-flex items-center gap-1 rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 hover:bg-indigo-100 border border-indigo-200"
                                >
                                  <span>{t.wbs}</span>
                                  <span className="truncate max-w-[100px]">{t.title}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
