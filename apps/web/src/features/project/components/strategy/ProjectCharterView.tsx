import React, { useState } from 'react';
import { Button, Input } from '@orgdashio/ui';
import {
  BookmarkCheck,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  FileCheck,
  FileSpreadsheet,
  FileText,
  HandCoins,
  HeartHandshake,
  Layers,
  MapPin,
  Pencil,
  Printer,
  Scale,
  ShieldCheck,
  Sparkles,
  Target,
  UserCheck,
  Users,
} from 'lucide-react';

interface ProjectCharterViewProps {
  project: any;
  fundingSources: any[];
  members: any[];
  planItems: any[];
  resultNodes: any[];
  onUpdateProject?: (updates: any) => Promise<void>;
  onNavigateTab?: (tab: string, subTab?: string) => void;
}

export function ProjectCharterView({
  project,
  fundingSources,
  members,
  planItems,
  resultNodes,
  onUpdateProject,
  onNavigateTab,
}: ProjectCharterViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [desc, setDesc] = useState(project.description || '');
  const [saving, setSaving] = useState(false);

  const totalFunding = fundingSources.reduce((s, f) => s + parseFloat(f.amount || '0'), 0);
  const totalBudget = parseFloat(project.budgetTotal || '0') || totalFunding || 0;

  const projectLead = members.find((m) => m.role === 'manager') || members[0];
  const outcomesCount = resultNodes.filter((r) => r.level === 'outcome').length;
  const outputsCount = resultNodes.filter((r) => r.level === 'output').length;
  const phasesCount = planItems.filter((p) => p.type === 'phase').length;

  const fmt = (val: number, cur = 'CAD') =>
    new Intl.NumberFormat('fr-CA', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(val);

  const handleSave = async () => {
    if (!onUpdateProject) return;
    try {
      setSaving(true);
      await onUpdateProject({ description: desc });
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Toolbar: Print / Export ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 no-print">
        <div>
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-indigo-600" />
            Charte du Projet & Note de Cadrage Stratégique (Project Charter)
          </h3>
          <p className="text-xs text-slate-500">
            Document de référence validant le mandat, les objectifs, les bénéficiaires et les critères de réussite
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => window.print()}
            className="text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5"
          >
            <Printer className="h-3.5 w-3.5" />
            Imprimer la Charte
          </Button>
        </div>
      </div>

      {/* ── Charter Document Paper Layout ── */}
      <div className="rounded-2xl border border-slate-300 bg-white p-8 shadow-sm space-y-8 text-slate-900 print:border-none print:shadow-none print:p-0">
        {/* Document Header */}
        <div className="border-b-2 border-slate-900 pb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-black bg-slate-900 text-white px-2.5 py-1 rounded">
                CHARTE : {project.code}
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-200">
                Note de Cadrage Officielle
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900">{project.name}</h1>
            <p className="text-xs text-slate-500">
              Statut actuel : <strong className="uppercase text-slate-800">{project.status}</strong> • Émis par la direction de projet
            </p>
          </div>

          <div className="text-right sm:border-l sm:border-slate-200 sm:pl-6 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Responsable de Projet</span>
            <span className="font-bold text-slate-900 text-sm">{projectLead ? projectLead.name : 'Non assigné'}</span>
            <p className="text-[11px] text-slate-500">{projectLead?.email || ''}</p>
          </div>
        </div>

        {/* Section 1: Contexte, Justification & Vision */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <Target className="h-4 w-4 text-indigo-600" />
              1. Contexte, Justification & Mission du Projet
            </h2>
            {!isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 no-print"
              >
                <Pencil className="h-3 w-3" /> Modifier la description
              </button>
            ) : null}
          </div>

          {!isEditing ? (
            <div className="rounded-xl bg-slate-50/80 p-4 border border-slate-200/80">
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                {project.description ||
                  "Aucune description ou justification détaillée renseignée pour ce projet. Cliquez sur « Modifier la description » pour cadrer la mission, les enjeux et la vision stratégique."}
              </p>
            </div>
          ) : (
            <div className="space-y-3 bg-indigo-50/50 p-4 rounded-xl border border-indigo-200">
              <textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                rows={4}
                placeholder="Rédigez la justification, le contexte opérationnel, la problématique ciblée et la vision..."
                className="w-full rounded-lg border border-slate-300 bg-white p-3 text-xs text-slate-800"
              />
              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)} className="text-xs">
                  Annuler
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
                >
                  {saving ? 'Enregistrement...' : 'Enregistrer la note'}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Section 2: Piliers Structurants & Métriques Clés */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-2">
            <Scale className="h-4 w-4 text-indigo-600" />
            2. Cadre d'Engagement (Objectifs, Budget & Calendrier)
          </h2>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border bg-slate-50 p-3.5 border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Budget Global Cible</span>
              <span className="text-lg font-black font-mono text-slate-900 mt-1 block">{fmt(totalBudget)}</span>
              <p className="text-[10px] text-slate-400 mt-0.5">Enveloppe autorisée</p>
            </div>

            <div className="rounded-xl border bg-slate-50 p-3.5 border-slate-200">
              <span className="text-[10px] font-bold text-violet-700 uppercase tracking-wider block">Financements Sécurisés</span>
              <span className="text-lg font-black font-mono text-violet-900 mt-1 block">{fmt(totalFunding)}</span>
              <p className="text-[10px] text-violet-600 mt-0.5">{fundingSources.length} bailleur(s)</p>
            </div>

            <div className="rounded-xl border bg-slate-50 p-3.5 border-slate-200">
              <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">Période d'Exécution</span>
              <span className="text-xs font-bold font-mono text-slate-800 mt-1.5 block">
                {project.startDate || '—'} au {project.endDate || '—'}
              </span>
              <p className="text-[10px] text-slate-400 mt-0.5">Durée nominale</p>
            </div>

            <div className="rounded-xl border bg-slate-50 p-3.5 border-slate-200">
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Structure WBS</span>
              <span className="text-lg font-black font-mono text-emerald-900 mt-1 block">{phasesCount} Phase(s)</span>
              <p className="text-[10px] text-emerald-600 mt-0.5">{planItems.length} éléments de plan</p>
            </div>
          </div>
        </div>

        {/* Section 3: Chaîne de Résultats & Objectifs Stratégiques (Logframe Summary) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <Layers className="h-4 w-4 text-indigo-600" />
              3. Chaîne de Résultats Attendus (Impacts, Résultats & Extrants)
            </h2>
            <button
              type="button"
              onClick={() => onNavigateTab?.('strategy', 'logframe')}
              className="text-xs font-bold text-indigo-600 hover:underline no-print"
            >
              Voir le Cadre Logique ➔
            </button>
          </div>

          {resultNodes.length === 0 ? (
            <p className="text-xs text-slate-400 italic">Aucun résultat stratégique défini dans le cadre logique.</p>
          ) : (
            <div className="space-y-2">
              {resultNodes.map((rn) => (
                <div key={rn.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        rn.level === 'impact'
                          ? 'bg-purple-100 text-purple-800'
                          : rn.level === 'outcome'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {rn.level === 'impact' ? 'Impact Global' : rn.level === 'outcome' ? 'Résultat (Outcome)' : 'Extrant (Output)'}
                    </span>
                    <span className="font-bold text-slate-900">{rn.title}</span>
                  </div>
                  {rn.description && <span className="text-slate-500 text-[11px] truncate max-w-[250px]">{rn.description}</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 4: Périmètre d'Intervention (In Scope / Out of Scope) & Facteurs de Succès */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-2 text-xs">
            <h3 className="font-bold text-emerald-950 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Périmètre Inclus (In-Scope)
            </h3>
            <ul className="space-y-1 text-slate-700 list-disc list-inside">
              <li>Déploiement des activités opérationnelles validées au plan WBS.</li>
              <li>Production des livrables et rapports contractuels aux bailleurs.</li>
              <li>Atteinte des cibles d'extrants et satisfaction des bénéficiaires.</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl border border-slate-300 bg-slate-50 space-y-2 text-xs">
            <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-indigo-600" />
              Facteurs Clés de Succès (CSF)
            </h3>
            <ul className="space-y-1 text-slate-700 list-disc list-inside">
              <li>Respect de la gouvernance RACI et visa systématique des livrables.</li>
              <li>Maîtrise des écarts de coûts (CPI ≥ 1.0) et de calendrier (SPI ≥ 1.0).</li>
              <li>Implication continue des parties prenantes et bénéficiaires.</li>
            </ul>
          </div>
        </div>

        {/* Section 5: Signatures et Approbations */}
        <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-8 text-xs">
          <div>
            <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">Pour le Chef de Projet :</span>
            <div className="mt-8 border-b border-slate-300 pb-1 font-medium text-slate-700">
              Nom : <strong>{projectLead ? projectLead.name : '________________________'}</strong>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">Date et visa d'engagement</span>
          </div>

          <div>
            <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">Pour le Comité de Direction / Sponsor :</span>
            <div className="mt-8 border-b border-slate-300 pb-1 font-medium text-slate-700">
              Nom : <strong>________________________</strong>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">Date et visa d'approbation</span>
          </div>
        </div>
      </div>
    </div>
  );
}
