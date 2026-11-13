import React, { useState } from 'react';
import { Button } from '@orgdashio/ui';
import {
  FileText,
  Printer,
  FileSpreadsheet,
  Users,
  DollarSign,
  HeartHandshake,
  ShieldAlert,
  BarChart3,
  Layers,
  Sparkles,
  Calendar,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import { CopilFlashReportView } from './CopilFlashReportView';

export type ProjectReportType = 'copil' | 'beneficiaries' | 'financial';

interface ProjectReportsHubProps {
  project: any;
  planItems: any[];
  expenses: any[];
  members: any[];
  deliverables: any[];
  updates: any[];
  raidItems: any[];
  fundingSources: any[];
  serviceDeliveries?: any[];
  resultNodes?: any[];
  budget?: any;
}

export function ProjectReportsHub({
  project,
  planItems,
  expenses,
  members,
  deliverables,
  updates,
  raidItems,
  fundingSources,
  serviceDeliveries = [],
  resultNodes = [],
  budget,
}: ProjectReportsHubProps) {
  const [selectedReport, setSelectedReport] = useState<ProjectReportType>('copil');

  // Compute beneficiary metrics
  const uniqueBeneficiaries = React.useMemo(() => {
    const map = new Map<string, any>();
    for (const d of serviceDeliveries) {
      if (!map.has(d.partyId)) {
        map.set(d.partyId, d);
      }
    }
    return Array.from(map.values());
  }, [serviceDeliveries]);

  const totalReached = uniqueBeneficiaries.length;
  const targetCount = project?.targetBeneficiariesCount || 0;
  const reachPercentage = targetCount > 0 ? Math.min(100, Math.round((totalReached / targetCount) * 100)) : 0;

  const genderStats = React.useMemo(() => {
    let female = 0;
    let male = 0;
    let other = 0;
    for (const b of uniqueBeneficiaries) {
      const g = (b.genderCode || '').toLowerCase();
      if (g === 'f' || g === 'female' || g === 'femme') female++;
      else if (g === 'm' || g === 'male' || g === 'homme') male++;
      else other++;
    }
    const fPct = totalReached > 0 ? Math.round((female / totalReached) * 100) : 0;
    const mPct = totalReached > 0 ? Math.round((male / totalReached) * 100) : 0;
    const oPct = totalReached > 0 ? Math.max(0, 100 - fPct - mPct) : 0;
    return { female, male, other, fPct, mPct, oPct };
  }, [uniqueBeneficiaries, totalReached]);

  // Financial metrics
  const totalBudget = (budget?.lines || []).reduce((s: number, l: any) => s + parseFloat(l.amount || '0'), 0) || parseFloat(project.budgetTotal || '0') || 0;
  const totalExpensesApproved = expenses
    .filter((e) => e.status === 'approved' || e.status === 'paid')
    .reduce((s, e) => s + parseFloat(e.amount || '0'), 0);
  const totalFunding = fundingSources.reduce((s, f) => s + parseFloat(f.amount || '0'), 0);

  const fmt = (val: number) =>
    new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-6">
      {/* ── Report Selector Header Strip ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileText className="h-5 w-5 text-indigo-600" />
            Centre d'Édition & Rapports Officiels
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Générez, prévisualisez et exportez les rapports réglementaires et de gouvernance du projet
          </p>
        </div>

        {/* Action button */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => window.print()}
            className="text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
          >
            <Printer className="mr-1.5 h-3.5 w-3.5" />
            Imprimer / Exporter PDF
          </Button>
        </div>
      </div>

      {/* ── Report Type Switcher Tabs ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => setSelectedReport('copil')}
          className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${
            selectedReport === 'copil'
              ? 'bg-indigo-50/80 border-indigo-400 shadow-xs ring-1 ring-indigo-400'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className={`p-2.5 rounded-lg shrink-0 ${selectedReport === 'copil' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900">Rapport Flash COPIL</span>
              <span className="text-[10px] font-mono font-bold bg-indigo-100 text-indigo-700 px-1.5 py-0.2 rounded">
                1-Page
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Synthèse exécutive pour comité de pilotage : santé, EVM, jalons & arbitrage des risques.
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setSelectedReport('beneficiaries')}
          className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${
            selectedReport === 'beneficiaries'
              ? 'bg-indigo-50/80 border-indigo-400 shadow-xs ring-1 ring-indigo-400'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className={`p-2.5 rounded-lg shrink-0 ${selectedReport === 'beneficiaries' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
            <HeartHandshake className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900">Bénéficiaires & Genre (ACS+)</span>
              <span className="text-[10px] font-mono font-bold bg-rose-100 text-rose-700 px-1.5 py-0.2 rounded">
                Impact
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Désagrégation par genre, volume de personnes touchées et traçabilité des services délivrés.
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setSelectedReport('financial')}
          className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${
            selectedReport === 'financial'
              ? 'bg-indigo-50/80 border-indigo-400 shadow-xs ring-1 ring-indigo-400'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className={`p-2.5 rounded-lg shrink-0 ${selectedReport === 'financial' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900">Rapport Financier & Bailleurs</span>
              <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.2 rounded">
                Audit
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Justification des dépenses par ligne budgétaire vs subventions et solde contractuel.
            </p>
          </div>
        </button>
      </div>

      {/* ── Active Report View ── */}
      {selectedReport === 'copil' && (
        <CopilFlashReportView
          project={project}
          planItems={planItems}
          expenses={expenses}
          members={members}
          deliverables={deliverables}
          updates={updates}
          raidItems={raidItems}
          fundingSources={fundingSources}
        />
      )}

      {selectedReport === 'beneficiaries' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xs space-y-6">
          {/* Header Document */}
          <div className="border-b border-slate-200 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider font-mono">
                {project.code} • RAPPORT D'IMPACT SOCIAL & ANALYSE DE GENRE
              </span>
              <h2 className="text-2xl font-black text-slate-900 mt-1">{project.name}</h2>
              <p className="text-xs text-slate-500 mt-1">
                Conformité aux exigences de reddition de comptes et analyse comparative entre les sexes (ACS+ / GBA+)
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono font-bold text-slate-500">Date d'édition :</span>
              <p className="text-xs font-bold text-slate-800">
                {new Date().toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Key KPI Tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-200">
              <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider block">Bénéficiaires Touchés</span>
              <p className="text-3xl font-black text-purple-950 mt-1 font-mono">{totalReached}</p>
              <p className="text-[11px] text-purple-700 mt-1">Personnes uniques distinctes</p>
            </div>

            <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-200">
              <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider block">Cible Contractuelle</span>
              <p className="text-3xl font-black text-indigo-950 mt-1 font-mono">{targetCount || '—'}</p>
              <p className="text-[11px] text-indigo-700 mt-1">
                {targetCount > 0 ? `Taux d'atteinte : ${reachPercentage}%` : 'Aucune cible quantifiée'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-200">
              <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider block">Femmes (ACS+)</span>
              <p className="text-3xl font-black text-rose-950 mt-1 font-mono">
                {genderStats.female} <span className="text-base font-semibold text-rose-700">({genderStats.fPct}%)</span>
              </p>
              <p className="text-[11px] text-rose-700 mt-1">Participation féminine certifiée</p>
            </div>

            <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200">
              <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">Hommes & Autres</span>
              <p className="text-3xl font-black text-blue-950 mt-1 font-mono">
                {genderStats.male} <span className="text-base font-semibold text-blue-700">({genderStats.mPct}%)</span>
              </p>
              <p className="text-[11px] text-blue-700 mt-1">
                Autre / Non spécifié : {genderStats.other} ({genderStats.oPct}%)
              </p>
            </div>
          </div>

          {/* Visual Parity Bar */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span>Répartition par Genre (ACS+)</span>
              <span>{totalReached} participant(s) au total</span>
            </div>
            <div className="h-3 w-full rounded-full bg-slate-200 overflow-hidden flex">
              <div
                className="bg-rose-500 h-full transition-all"
                style={{ width: `${genderStats.fPct}%` }}
                title={`Femmes: ${genderStats.female} (${genderStats.fPct}%)`}
              />
              <div
                className="bg-blue-500 h-full transition-all"
                style={{ width: `${genderStats.mPct}%` }}
                title={`Hommes: ${genderStats.male} (${genderStats.mPct}%)`}
              />
              <div
                className="bg-amber-400 h-full transition-all"
                style={{ width: `${genderStats.oPct}%` }}
                title={`Autre / Non binaire: ${genderStats.other} (${genderStats.oPct}%)`}
              />
            </div>
            <div className="flex items-center gap-6 text-[11px] text-slate-600 pt-1">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500 inline-block" />
                Femmes : <strong>{genderStats.female}</strong> ({genderStats.fPct}%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-500 inline-block" />
                Hommes : <strong>{genderStats.male}</strong> ({genderStats.mPct}%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400 inline-block" />
                Non spécifié / Autre : <strong>{genderStats.other}</strong> ({genderStats.oPct}%)
              </span>
            </div>
          </div>

          {/* Detailed Service Deliveries Table */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Registre des Prestations et Services Enregistrés ({serviceDeliveries.length})
            </h3>
            {serviceDeliveries.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center border rounded-xl bg-slate-50">
                Aucune prestation ou remise de service n'a encore été enregistrée pour ce projet.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                  <thead className="bg-slate-50 font-bold text-slate-700">
                    <tr>
                      <th className="px-4 py-2.5">Date</th>
                      <th className="px-4 py-2.5">Bénéficiaire</th>
                      <th className="px-4 py-2.5">Genre</th>
                      <th className="px-4 py-2.5">Type de Service</th>
                      <th className="px-4 py-2.5">Notes & Preuves</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {serviceDeliveries.map((d: any) => {
                      const g = (d.genderCode || '').toLowerCase();
                      const isF = g === 'f' || g === 'female' || g === 'femme';
                      const isM = g === 'm' || g === 'male' || g === 'homme';
                      return (
                        <tr key={d.id} className="hover:bg-slate-50/70">
                          <td className="px-4 py-2 font-mono text-slate-600 whitespace-nowrap">
                            {d.deliveredAt || '—'}
                          </td>
                          <td className="px-4 py-2 font-bold text-slate-900">
                            {d.firstName} {d.lastName}
                          </td>
                          <td className="px-4 py-2">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isF ? 'bg-rose-100 text-rose-800' : isM ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {isF ? '♀ Femme' : isM ? '♂ Homme' : '⚥ Autre'}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-indigo-700 font-medium">
                            {d.serviceType}
                          </td>
                          <td className="px-4 py-2 text-slate-500">
                            {d.notes || '—'}
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
      )}

      {selectedReport === 'financial' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xs space-y-6">
          {/* Header */}
          <div className="border-b border-slate-200 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider font-mono">
                {project.code} • RAPPORT FINANCIER & REDDITION DE COMPTES
              </span>
              <h2 className="text-2xl font-black text-slate-900 mt-1">{project.name}</h2>
              <p className="text-xs text-slate-500 mt-1">
                État certifié des engagements, dépenses acquittées et réconciliation des financements
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono font-bold text-slate-500">Date d'édition :</span>
              <p className="text-xs font-bold text-slate-800">
                {new Date().toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Financial Summary Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">Budget Total Contractuel</span>
              <p className="text-2xl font-black text-slate-900 mt-1 font-mono">{fmt(totalBudget)}</p>
              <p className="text-[11px] text-slate-500 mt-1">Enveloppe approuvée</p>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200">
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">Subventions Allouées</span>
              <p className="text-2xl font-black text-emerald-950 mt-1 font-mono">{fmt(totalFunding)}</p>
              <p className="text-[11px] text-emerald-700 mt-1">{fundingSources.length} bailleur(s) contributeur(s)</p>
            </div>

            <div className="p-4 rounded-xl bg-violet-50/60 border border-violet-200">
              <span className="text-[11px] font-bold text-violet-700 uppercase tracking-wider block">Dépenses Acquittées</span>
              <p className="text-2xl font-black text-violet-950 mt-1 font-mono">{fmt(totalExpensesApproved)}</p>
              <p className="text-[11px] text-violet-700 mt-1">
                Taux d'absorption : {totalBudget > 0 ? Math.round((totalExpensesApproved / totalBudget) * 100) : 0}%
              </p>
            </div>

            <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-200">
              <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider block">Solde Restant</span>
              <p className="text-2xl font-black text-indigo-950 mt-1 font-mono">{fmt(totalBudget - totalExpensesApproved)}</p>
              <p className="text-[11px] text-indigo-700 mt-1">Reliquat budgétaire disponible</p>
            </div>
          </div>

          {/* Funding Sources Table */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 text-sm">Financements & Subventions Alloués</h3>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                <thead className="bg-slate-50 font-bold text-slate-700">
                  <tr>
                    <th className="px-4 py-2.5">Bailleur / Source</th>
                    <th className="px-4 py-2.5">Type de Fonds</th>
                    <th className="px-4 py-2.5 text-right">Montant</th>
                    <th className="px-4 py-2.5">Date limite de reddition</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {fundingSources.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-3 text-center text-slate-400">
                        Aucune source de financement externe renseignée.
                      </td>
                    </tr>
                  ) : (
                    fundingSources.map((f: any) => (
                      <tr key={f.id}>
                        <td className="px-4 py-2 font-bold text-slate-900">{f.donorName}</td>
                        <td className="px-4 py-2 text-slate-600 capitalize">{f.fundingType}</td>
                        <td className="px-4 py-2 font-mono font-bold text-emerald-700 text-right">
                          {fmt(parseFloat(f.amount || '0'))}
                        </td>
                        <td className="px-4 py-2 text-slate-500 font-mono">{f.reportDueAt || 'Non spécifiée'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
