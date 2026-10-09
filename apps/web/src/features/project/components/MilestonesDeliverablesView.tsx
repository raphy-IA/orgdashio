import React, { useState } from 'react';
import { Button, Input } from '@orgdashio/ui';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  FileCheck,
  FileSpreadsheet,
  FileText,
  Filter,
  Flame,
  Layers,
  Paperclip,
  Search,
  ShieldCheck,
  Sparkles,
  Tag,
  UserCheck,
  XCircle,
} from 'lucide-react';

interface MilestonesDeliverablesViewProps {
  projectId: string;
  planItems: any[];
  deliverables: any[];
  members: any[];
  onSelectTask?: (task: any) => void;
  onApproveDeliverable?: (delivId: string) => Promise<void>;
  onRejectDeliverable?: (delivId: string, reason: string) => Promise<void>;
}

export function MilestonesDeliverablesView({
  projectId,
  planItems,
  deliverables,
  members,
  onSelectTask,
  onApproveDeliverable,
  onRejectDeliverable,
}: MilestonesDeliverablesViewProps) {
  const [deliverableFilter, setDeliverableFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [rejectingDelivId, setRejectingDelivId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // 1. Milestones
  const milestones = planItems.filter((p) => p.type === 'milestone');
  const today = new Date().toISOString().split('T')[0];

  const milestonesWithDrift = milestones.map((m) => {
    const targetDate = m.startDate || m.endDate;
    let driftDays = 0;
    let isOverdue = false;

    if (targetDate && m.status !== 'completed') {
      const targetTs = new Date(targetDate).getTime();
      const todayTs = new Date(today).getTime();
      driftDays = Math.round((todayTs - targetTs) / (1000 * 60 * 60 * 24));
      if (driftDays > 0) isOverdue = true;
    }

    const parent = planItems.find((p) => p.id === m.parentId);
    const linkedDeliverables = deliverables.filter((d) => d.planItemId === m.id);

    return {
      ...m,
      targetDate,
      driftDays,
      isOverdue,
      parentTitle: parent?.title || 'Racine du projet',
      linkedDeliverables,
    };
  });

  // 2. Deliverables List enriched with parent task info
  const enrichedDeliverables = deliverables.map((deliv) => {
    const parentTask = planItems.find((p) => p.id === deliv.planItemId);
    const parentPhase = parentTask?.parentId
      ? planItems.find((p) => p.id === parentTask.parentId)
      : null;
    const isDataUrl = deliv.fileUrl?.startsWith('data:');

    return {
      ...deliv,
      parentTask,
      parentPhase,
      isDataUrl,
    };
  });

  const filteredDeliverables = enrichedDeliverables.filter((deliv) => {
    if (deliverableFilter !== 'all' && deliv.status !== deliverableFilter) return false;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const titleMatch = deliv.title?.toLowerCase().includes(term);
      const descMatch = deliv.description?.toLowerCase().includes(term);
      const taskMatch = deliv.parentTask?.title?.toLowerCase().includes(term);
      const wbsMatch = deliv.parentTask?.wbs?.toLowerCase().includes(term);
      return titleMatch || descMatch || taskMatch || wbsMatch;
    }
    return true;
  });

  const handleApprove = async (delivId: string) => {
    if (!onApproveDeliverable) return;
    try {
      setActionLoading(true);
      await onApproveDeliverable(delivId);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (delivId: string) => {
    if (!onRejectDeliverable || !rejectReason.trim()) return;
    try {
      setActionLoading(true);
      await onRejectDeliverable(delivId, rejectReason);
      setRejectingDelivId(null);
      setRejectReason('');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── SECTION 1: JALONS CLÉS (MILESTONES TRACKER) ── */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="border-b bg-slate-50 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-600" />
              1. Suivi Chronologique des Jalons Clés & Dérives
            </h3>
            <p className="text-xs text-slate-500">
              Contrôle des dates cibles contractuelles, échéances PERT et dérives temporelles
            </p>
          </div>
          <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
            {milestones.filter((m) => m.status === 'completed').length} / {milestones.length} jalon(s) validé(s)
          </span>
        </div>

        {milestonesWithDrift.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            Aucun jalon clé défini dans le plan WBS. Définissez des éléments de type « Jalon » dans l'onglet Planification.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b bg-slate-50/70 uppercase text-slate-500 font-semibold tracking-wider">
                <tr>
                  <th className="px-6 py-3">Code & Jalon</th>
                  <th className="px-4 py-3">Rattachement</th>
                  <th className="px-4 py-3 text-center">Date Cible</th>
                  <th className="px-4 py-3 text-center">Dérive / Écart</th>
                  <th className="px-4 py-3 text-center">Statut</th>
                  <th className="px-6 py-3 text-right">Livrables liés</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {milestonesWithDrift.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-purple-700 bg-purple-50 px-2 py-0.5 rounded font-bold text-[11px]">
                          {m.wbs}
                        </span>
                        <span className="font-bold text-slate-900">{m.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-500">{m.parentTitle}</td>
                    <td className="px-4 py-3.5 text-center font-mono font-bold text-slate-700">
                      {m.targetDate ? new Date(m.targetDate).toLocaleDateString('fr-CA') : 'Non planifié'}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {m.status === 'completed' ? (
                        <span className="text-emerald-600 font-bold text-[11px] inline-flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Franchi
                        </span>
                      ) : m.isOverdue ? (
                        <span className="text-red-700 font-bold font-mono bg-red-50 border border-red-200 px-2 py-0.5 rounded text-[11px]">
                          +{m.driftDays}j de retard
                        </span>
                      ) : (
                        <span className="text-slate-500 font-mono text-[11px]">Dans les temps</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          m.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : m.status === 'in_progress'
                            ? 'bg-sky-100 text-sky-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {m.status === 'completed'
                          ? 'Terminé'
                          : m.status === 'in_progress'
                          ? 'En cours'
                          : 'À venir'}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right font-mono text-slate-500">
                      {m.linkedDeliverables.length} livrable(s)
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── SECTION 2: MATRICE DES LIVRABLES & VISAS QUALITÉ RACI ── */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden space-y-4 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-indigo-600" />
              2. Matrice Centrale des Livrables & Visas Qualité RACI
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Registre exhaustif des justificatifs, documents, livrables téléchargeables et approbations de conformité
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center rounded-lg bg-slate-100 p-1 border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setDeliverableFilter('all')}
              className={`px-3 py-1 rounded-md transition ${
                deliverableFilter === 'all' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tous ({enrichedDeliverables.length})
            </button>
            <button
              onClick={() => setDeliverableFilter('pending')}
              className={`px-3 py-1 rounded-md transition ${
                deliverableFilter === 'pending' ? 'bg-white text-amber-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              En attente de visa ({enrichedDeliverables.filter((d) => d.status === 'pending').length})
            </button>
            <button
              onClick={() => setDeliverableFilter('approved')}
              className={`px-3 py-1 rounded-md transition ${
                deliverableFilter === 'approved' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Approuvés ({enrichedDeliverables.filter((d) => d.status === 'approved').length})
            </button>
            <button
              onClick={() => setDeliverableFilter('rejected')}
              className={`px-3 py-1 rounded-md transition ${
                deliverableFilter === 'rejected' ? 'bg-white text-red-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Rejetés ({enrichedDeliverables.filter((d) => d.status === 'rejected').length})
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par titre de livrable, code WBS ou tâche..."
              className="pl-9 text-xs bg-slate-50/50"
            />
          </div>
        </div>

        {/* Deliverables Table */}
        {filteredDeliverables.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <FileText className="mx-auto h-8 w-8 text-slate-300" />
            <p className="text-xs font-medium text-slate-500">Aucun livrable ne correspond aux critères de filtre.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b bg-slate-50 font-semibold uppercase text-slate-500 tracking-wider">
                <tr>
                  <th className="px-4 py-3">Livrable & Justificatif</th>
                  <th className="px-4 py-3">Tâche Associée</th>
                  <th className="px-4 py-3 text-center">Fichier / Lien</th>
                  <th className="px-4 py-3 text-center">Visa Qualité RACI</th>
                  <th className="px-4 py-3">Visa par & Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDeliverables.map((deliv) => {
                  return (
                    <tr key={deliv.id} className="hover:bg-slate-50 transition">
                      {/* Title & Description */}
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900 text-sm">{deliv.title}</div>
                        {deliv.description && (
                          <div className="text-slate-500 text-xs mt-0.5 line-clamp-1">{deliv.description}</div>
                        )}
                      </td>

                      {/* Parent Task */}
                      <td className="px-4 py-3.5">
                        {deliv.parentTask ? (
                          <button
                            type="button"
                            onClick={() => onSelectTask?.(deliv.parentTask)}
                            className="flex items-center gap-1.5 text-left text-indigo-700 hover:underline font-medium"
                          >
                            <span className="font-mono text-[11px] font-bold bg-indigo-50 px-1.5 py-0.5 rounded">
                              {deliv.parentTask.wbs}
                            </span>
                            <span className="truncate max-w-[180px]">{deliv.parentTask.title}</span>
                          </button>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* File / Link Download */}
                      <td className="px-4 py-3.5 text-center">
                        {deliv.fileUrl ? (
                          deliv.isDataUrl ? (
                            <a
                              href={deliv.fileUrl}
                              download={`Livrable_${deliv.title.replace(/\s+/g, '_')}`}
                              className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition border border-indigo-200"
                            >
                              <Download className="h-3.5 w-3.5" /> Télécharger
                            </a>
                          ) : (
                            <a
                              href={deliv.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 rounded-lg bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-700 hover:bg-sky-100 transition border border-sky-200"
                            >
                              <ExternalLink className="h-3.5 w-3.5" /> Ouvrir lien
                            </a>
                          )
                        ) : (
                          <span className="text-slate-400 italic">Aucun fichier</span>
                        )}
                      </td>

                      {/* Visa Status Badge */}
                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                            deliv.status === 'approved'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : deliv.status === 'rejected'
                              ? 'bg-red-50 text-red-800 border-red-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {deliv.status === 'approved' ? (
                            <>
                              <CheckCircle2 className="h-3 w-3" /> Approuvé
                            </>
                          ) : deliv.status === 'rejected' ? (
                            <>
                              <XCircle className="h-3 w-3" /> Rejeté
                            </>
                          ) : (
                            <>
                              <Clock className="h-3 w-3" /> En attente de visa
                            </>
                          )}
                        </span>
                      </td>

                      {/* Verified By / Date */}
                      <td className="px-4 py-3.5 text-slate-600">
                        {deliv.verifiedBy ? (
                          <div className="space-y-0.5">
                            <span className="font-semibold block text-slate-800">{deliv.verifiedBy}</span>
                            {deliv.verifiedAt && (
                              <span className="text-[10px] text-slate-400">
                                {new Date(deliv.verifiedAt).toLocaleDateString('fr-CA')}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Quality Visa Action Buttons */}
                      <td className="px-4 py-3.5 text-right">
                        {deliv.status === 'pending' && onApproveDeliverable && (
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              onClick={() => handleApprove(deliv.id)}
                              disabled={actionLoading}
                              className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                            >
                              <CheckCircle2 className="mr-1 h-3 w-3" /> Approuver
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setRejectingDelivId(deliv.id)}
                              disabled={actionLoading}
                              className="h-7 text-xs border-amber-300 text-amber-800 hover:bg-amber-50"
                            >
                              Rejeter
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Reject Modal / Prompt */}
        {rejectingDelivId && (
          <div className="p-4 rounded-xl border border-red-200 bg-red-50/80 space-y-3 animate-in fade-in">
            <h4 className="text-xs font-bold text-red-900">Motif du rejet / Corrections exigées</h4>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={2}
              placeholder="Précisez ce qui doit être corrigé sur ce livrable avant validation..."
              className="w-full rounded-lg border border-red-300 bg-white p-2.5 text-xs text-slate-800"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => handleReject(rejectingDelivId)}
                disabled={!rejectReason.trim() || actionLoading}
                className="bg-red-700 hover:bg-red-800 text-white text-xs font-bold"
              >
                Confirmer le rejet
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setRejectingDelivId(null)} className="text-xs">
                Annuler
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
