import React, { useState } from 'react';
import { Button, Input } from '@orgdashio/ui';
import {
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  FileSpreadsheet,
  FileText,
  HandCoins,
  Plus,
  Scale,
  Sparkles,
  Trash2,
  TrendingUp,
} from 'lucide-react';

interface FundingSource {
  id: string;
  donorName: string;
  fundingType: 'grant' | 'restricted_donation' | 'unrestricted' | 'other';
  amount: number | string;
  currency?: string | null;
  reportDueAt?: string | null;
  notes?: string | null;
}

interface ProjectFundingViewProps {
  projectId: string;
  fundingSources: FundingSource[];
  projectBudgetTotal: number;
  onAddFundingSource: (source: Partial<FundingSource>) => Promise<void>;
  onDeleteFundingSource: (id: string) => Promise<void>;
}

const FUNDING_TYPE_CONFIG: Record<string, { label: string; badgeCls: string; icon: string }> = {
  grant: { label: 'Subvention / Bailleur Institutionnel', badgeCls: 'bg-violet-100 text-violet-800 border-violet-200', icon: '🏛️' },
  restricted_donation: { label: 'Don Affecté / Fléché', badgeCls: 'bg-blue-100 text-blue-800 border-blue-200', icon: '🎯' },
  unrestricted: { label: 'Fonds Propres / Général', badgeCls: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: '🌱' },
  other: { label: 'Autre Financement', badgeCls: 'bg-slate-100 text-slate-700 border-slate-200', icon: '💼' },
};

export function ProjectFundingView({
  projectId,
  fundingSources,
  projectBudgetTotal,
  onAddFundingSource,
  onDeleteFundingSource,
}: ProjectFundingViewProps) {
  const [showForm, setShowForm] = useState(false);
  const [donorName, setDonorName] = useState('');
  const [fundingType, setFundingType] = useState<FundingSource['fundingType']>('grant');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('CAD');
  const [reportDueAt, setReportDueAt] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalFunding = fundingSources.reduce((s, f) => s + parseFloat(f.amount?.toString() || '0'), 0);
  const totalBudget = projectBudgetTotal > 0 ? projectBudgetTotal : totalFunding;
  const coveragePct = totalBudget > 0 ? Math.min(100, Math.round((totalFunding / totalBudget) * 100)) : 100;
  const fundingGap = Math.max(0, totalBudget - totalFunding);

  const fmt = (val: number, cur = 'CAD') =>
    new Intl.NumberFormat('fr-CA', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(val);

  const today = new Date().toISOString().split('T')[0];

  const handleCreate = async () => {
    if (!donorName.trim() || !amount) return;
    try {
      setIsSubmitting(true);
      await onAddFundingSource({
        donorName: donorName.trim(),
        fundingType,
        amount: parseFloat(amount) || 0,
        currency,
        reportDueAt: reportDueAt || null,
        notes: notes.trim() || null,
      });
      setDonorName('');
      setAmount('');
      setReportDueAt('');
      setNotes('');
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
            <HandCoins className="h-5 w-5 text-indigo-600" />
            Bailleurs, Subventions & Engagements Financiers
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestion des conventions de financement, suivi du taux de couverture et calendrier des rapports dus
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => setShowForm(!showForm)}
          className="text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs shrink-0"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Ajouter un financement
        </Button>
      </div>

      {/* ── Financial Security Banner & Coverage Gauge ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="rounded-2xl border border-violet-200 bg-violet-50/60 p-5 space-y-3 md:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-violet-900 flex items-center gap-1.5">
              <Scale className="h-4 w-4 text-violet-600" />
              Taux de Couverture Budgétaire Sécurisé
            </span>
            <span className="text-xs font-mono font-bold bg-white px-2.5 py-0.5 rounded-full text-violet-800 border border-violet-200">
              {coveragePct}% financé
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-3 bg-gradient-to-r from-violet-500 to-indigo-600 rounded-full transition-all duration-500"
                style={{ width: `${coveragePct}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-600 font-medium">
              <span>Total Sécurisé : <strong className="text-violet-950 font-mono">{fmt(totalFunding)}</strong></span>
              <span>Budget Planifié (BAC) : <strong className="text-slate-900 font-mono">{fmt(totalBudget)}</strong></span>
            </div>
          </div>

          <p className="text-[11px] text-violet-800 pt-1 border-t border-violet-200/60">
            {fundingGap > 0 ? (
              <span className="text-amber-800 font-medium">
                ⚠️ Déficit de financement prévisionnel : <strong>{fmt(fundingGap)}</strong> à combler par de nouvelles subventions.
              </span>
            ) : (
              <span className="text-emerald-800 font-medium">
                ✅ Budget intégralement couvert par les conventions de subvention et fonds mobilisés.
              </span>
            )}
          </p>
        </div>

        {/* Quick Stats Tile */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Conventions Actives</span>
            <p className="text-3xl font-black font-mono text-slate-900 mt-1">{fundingSources.length}</p>
            <p className="text-xs text-slate-400 mt-1">Bailleurs et sources d'apport</p>
          </div>
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Rapports programmés :</span>
            <strong className="font-mono">{fundingSources.filter((f) => f.reportDueAt).length}</strong>
          </div>
        </div>
      </div>

      {/* ── Add Funding Form ── */}
      {showForm && (
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-6 shadow-sm space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-indigo-200/60 pb-3">
            <h4 className="font-bold text-indigo-950 text-sm flex items-center gap-2">
              <Plus className="h-4 w-4 text-indigo-600" />
              Enregistrer une nouvelle source de financement / subvention
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">1. Nom du bailleur / Donateur *</label>
              <Input
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                placeholder="Ex: Fondation McConnell, Emploi Québec..."
                className="bg-white text-xs"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">2. Type de financement *</label>
              <select
                value={fundingType}
                onChange={(e) => setFundingType(e.target.value as FundingSource['fundingType'])}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium"
              >
                {Object.entries(FUNDING_TYPE_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.icon} {v.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">3. Montant alloué (CAD) *</label>
              <Input
                type="number"
                min="0"
                step="100"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="bg-white text-xs font-mono font-bold"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">4. Date d'échéance du rapport dû</label>
              <Input
                type="date"
                value={reportDueAt}
                onChange={(e) => setReportDueAt(e.target.value)}
                className="bg-white text-xs"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-bold text-slate-700">5. Notes, clauses ou convention</label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Numéro de convention, restrictions d'affectation..."
                className="bg-white text-xs"
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
              disabled={!donorName.trim() || !amount || isSubmitting}
              className="text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {isSubmitting ? 'Enregistrement...' : 'Enregistrer le financement'}
            </Button>
          </div>
        </div>
      )}

      {/* ── Funding Sources List ── */}
      {fundingSources.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center space-y-3">
          <HandCoins className="mx-auto h-12 w-12 text-slate-300" />
          <p className="text-sm font-bold text-slate-700">Aucune source de financement enregistrée.</p>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Documentez les bailleurs de fonds et subventions pour assurer le suivi de la trésorerie et des échéances de reporting.
          </p>
          <Button size="sm" onClick={() => setShowForm(true)} className="text-xs font-bold bg-indigo-600 text-white">
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Ajouter un premier bailleur
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {fundingSources.map((fs) => {
            const typeCfg = FUNDING_TYPE_CONFIG[fs.fundingType] || FUNDING_TYPE_CONFIG.grant;
            const parsedAmt = parseFloat(fs.amount?.toString() || '0');
            const pctOfTotal = totalFunding > 0 ? Math.round((parsedAmt / totalFunding) * 100) : 0;

            // Report due drift calculation
            let isOverdue = false;
            let daysUntilDue = 0;
            if (fs.reportDueAt) {
              const dueTs = new Date(fs.reportDueAt).getTime();
              const nowTs = new Date(today).getTime();
              daysUntilDue = Math.round((dueTs - nowTs) / (1000 * 60 * 60 * 24));
              if (daysUntilDue < 0) isOverdue = true;
            }

            return (
              <div
                key={fs.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3 hover:border-violet-300 transition flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${typeCfg.badgeCls}`}>
                      {typeCfg.icon} {typeCfg.label}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (window.confirm(`Supprimer le financement "${fs.donorName}" (${fmt(parsedAmt)}) ?`)) {
                          onDeleteFundingSource(fs.id);
                        }
                      }}
                      className="h-7 w-7 p-0 text-slate-300 hover:text-red-600 hover:bg-red-50"
                      title="Supprimer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 text-base">{fs.donorName}</h4>
                    <p className="text-xl font-black font-mono text-violet-700 mt-1">{fmt(parsedAmt, fs.currency || 'CAD')}</p>
                    <span className="text-[11px] text-slate-400 font-medium">Représente {pctOfTotal}% des financements</span>
                  </div>

                  {fs.notes && (
                    <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      {fs.notes}
                    </p>
                  )}
                </div>

                {/* Reporting Due Date Box */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  {fs.reportDueAt ? (
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-slate-600">Rapport dû :</span>
                      <strong className={isOverdue ? 'text-red-700 font-mono' : 'text-slate-800 font-mono'}>
                        {new Date(fs.reportDueAt).toLocaleDateString('fr-CA')}
                      </strong>
                    </span>
                  ) : (
                    <span className="text-slate-400 italic">Aucun rapport requis</span>
                  )}

                  {fs.reportDueAt && (
                    <span
                      className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full ${
                        isOverdue ? 'bg-red-100 text-red-800' : daysUntilDue <= 30 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {isOverdue ? `Retard (${Math.abs(daysUntilDue)}j)` : `${daysUntilDue}j restants`}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
