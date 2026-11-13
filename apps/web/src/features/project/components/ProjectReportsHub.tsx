import React, { useState, useMemo } from 'react';
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
  AlertTriangle,
  Clock,
  Filter,
  SlidersHorizontal,
  ChevronDown,
  Building2,
  FileCheck,
  Award,
  PenTool,
  Download,
  Info,
} from 'lucide-react';
import { calculateEVM, EVMTaskInput, EVMExpenseInput, calculateBeneficiaryDemographics } from '@orgdashio/shared';

export type ReportTemplate =
  | 'copil_executive'
  | 'funder_donor'
  | 'impact_beneficiaries'
  | 'logframe_results';

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
  indicators?: any[];
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
  indicators = [],
  budget,
}: ProjectReportsHubProps) {
  // ── Report Customization & Adjustment State ──
  const [template, setTemplate] = useState<ReportTemplate>('copil_executive');
  const [periodPreset, setPeriodPreset] = useState<'all' | 'q1' | 'q2' | 'q3' | 'q4' | 'ytd' | 'custom'>('all');
  const [dateStart, setDateStart] = useState<string>('');
  const [dateEnd, setDateEnd] = useState<string>('');
  const [selectedFunder, setSelectedFunder] = useState<string>('all');
  const [selectedPillar, setSelectedPillar] = useState<string>('all');
  
  // Custom narrative inputs for the report
  const [executiveSummary, setExecutiveSummary] = useState<string>(
    project.description ||
      "Durant cette période d'intervention, les activités opérationnelles se sont poursuivies conformément aux objectifs contractuels. Les jalons critiques ont été franchis avec un taux de satisfaction élevé des parties prenantes et des bénéficiaires."
  );
  const [highlightKeyAchievements, setHighlightKeyAchievements] = useState<string>(
    '• Déploiement des ateliers thématiques auprès des cohortes cibles.\n• Mobilisation réussie des bénévoles et partenaires communautaires.\n• Respect des engagements financiers et reddition des comptes.'
  );
  const [decisionsRequired, setDecisionsRequired] = useState<string>(
    '• Approbation du calendrier d’extension pour la phase suivante.\n• Arbitrage sur l’allocation des reliquats budgétaires non engagés.\n• Validation officielle du procès-verbal de revue intermédiaire.'
  );

  // Sections toggle display
  const [showExecutiveSummary, setShowExecutiveSummary] = useState(true);
  const [showEvmSection, setShowEvmSection] = useState(true);
  const [showWbsSection, setShowWbsSection] = useState(true);
  const [showLogframeSection, setShowLogframeSection] = useState(true);
  const [showBeneficiariesSection, setShowBeneficiariesSection] = useState(true);
  const [showFinancialSection, setShowFinancialSection] = useState(true);
  const [showRisksSection, setShowRisksSection] = useState(true);
  const [showSignatures, setShowSignatures] = useState(true);

  // Signatory details
  const [preparedBy, setPreparedBy] = useState<string>('Coordonnateur(trice) de Projet');
  const [reviewedBy, setReviewedBy] = useState<string>('Direction Générale / Directoire');
  const [funderRepresentative, setFunderRepresentative] = useState<string>(
    fundingSources[0]?.donorName || 'Représentant du Bailleur de Fonds'
  );

  // ── Filtered Datasets ──
  const filteredDeliveries = useMemo(() => {
    return serviceDeliveries.filter((d) => {
      if (!d.deliveredAt) return true;
      if (dateStart && d.deliveredAt < dateStart) return false;
      if (dateEnd && d.deliveredAt > dateEnd) return false;
      return true;
    });
  }, [serviceDeliveries, dateStart, dateEnd]);

  // Comprehensive Human Person-Level Demographics (ACS+ / GBA+)
  const demographics = useMemo(() => {
    return calculateBeneficiaryDemographics(filteredDeliveries);
  }, [filteredDeliveries]);

  const totalBeneficiariesReached = demographics.totalPersons;
  const targetBeneficiaries = project?.targetBeneficiariesCount || 0;
  const reachPercentage = targetBeneficiaries > 0
    ? Math.min(100, Math.round((totalBeneficiariesReached / targetBeneficiaries) * 100))
    : 0;

  // Financial filtering & metrics
  const filteredFundingSources = useMemo(() => {
    if (selectedFunder === 'all') return fundingSources;
    return fundingSources.filter((f) => f.donorName === selectedFunder);
  }, [fundingSources, selectedFunder]);

  const totalBudgetContract = (budget?.lines || []).reduce((s: number, l: any) => s + parseFloat(l.amount || '0'), 0) || parseFloat(project.budgetTotal || '0') || 0;
  const totalFundingAllocated = filteredFundingSources.reduce((s, f) => s + parseFloat(f.amount || '0'), 0);
  
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      if (!e.date) return true;
      if (dateStart && e.date < dateStart) return false;
      if (dateEnd && e.date > dateEnd) return false;
      return true;
    });
  }, [expenses, dateStart, dateEnd]);

  const totalApprovedExpenses = filteredExpenses
    .filter((e) => e.status === 'approved' || e.status === 'paid')
    .reduce((s, e) => s + parseFloat(e.amount || '0'), 0);

  const budgetExecutionRate = totalBudgetContract > 0
    ? Math.round((totalApprovedExpenses / totalBudgetContract) * 100)
    : 0;

  // EVM
  const evmData = useMemo(() => {
    const evmTasks: EVMTaskInput[] = planItems.map((t) => ({
      id: t.id,
      wbs: t.wbs,
      title: t.title,
      startDate: t.startDate,
      endDate: t.endDate,
      durationDays: t.durationDays,
      progressPct: t.progressPct,
      estimatedCost: t.estimatedCost,
      status: t.status,
    }));

    const evmExpenses: EVMExpenseInput[] = filteredExpenses.map((e) => ({
      id: e.id,
      date: e.date,
      amount: e.amount,
      status: e.status,
    }));

    return calculateEVM(evmTasks, evmExpenses, totalBudgetContract);
  }, [planItems, filteredExpenses, totalBudgetContract]);

  // Tasks and WBS
  const tasksOnly = planItems.filter((p) => p.type === 'task' || !p.type);
  const phases = planItems.filter((p) => p.type === 'phase');
  const milestones = planItems.filter((p) => p.type === 'milestone');
  const completedTasks = tasksOnly.filter((t) => t.status === 'completed' || (t.progressPct ?? 0) === 100);
  const blockedTasks = tasksOnly.filter((t) => t.status === 'blocked');
  const inProgressTasks = tasksOnly.filter((t) => (t.progressPct ?? 0) > 0 && (t.progressPct ?? 0) < 100);

  const overallProgress = phases.length > 0
    ? Math.round(phases.reduce((acc, p) => acc + (p.progressPct || 0), 0) / phases.length)
    : (tasksOnly.length > 0 ? Math.round(tasksOnly.reduce((acc, t) => acc + (t.progressPct || 0), 0) / tasksOnly.length) : 0);

  // Budget Breakdown by Category (CBS)
  const cbsBreakdown = useMemo(() => {
    const catMap: Record<string, { budget: number; actual: number }> = {
      personnel: { budget: 0, actual: 0 },
      material: { budget: 0, actual: 0 },
      direct_aid: { budget: 0, actual: 0 },
      training: { budget: 0, actual: 0 },
      transport: { budget: 0, actual: 0 },
      administrative: { budget: 0, actual: 0 },
      subcontracting: { budget: 0, actual: 0 },
      other: { budget: 0, actual: 0 },
    };

    (budget?.lines || []).forEach((bl: any) => {
      const cat = bl.category || 'other';
      if (!catMap[cat]) catMap[cat] = { budget: 0, actual: 0 };
      catMap[cat].budget += parseFloat(bl.amount || '0');
    });

    filteredExpenses.forEach((exp: any) => {
      if (exp.status === 'approved' || exp.status === 'paid') {
        const cat = exp.category || 'other';
        if (!catMap[cat]) catMap[cat] = { budget: 0, actual: 0 };
        catMap[cat].actual += parseFloat(exp.amount || '0');
      }
    });

    return catMap;
  }, [budget, filteredExpenses]);

  const CATEGORY_NAMES: Record<string, string> = {
    personnel: 'Personnel & Ressources Humaines',
    material: 'Équipements, Matériel & Fournitures',
    direct_aid: 'Aide Directe & Dons aux Bénéficiaires',
    training: 'Formations, Pédagogie & Ateliers',
    transport: 'Déplacements & Logistique Terrain',
    administrative: 'Frais de Gestion & Administratifs',
    subcontracting: 'Prestations & Sous-traitance',
    other: 'Autres Charges Directes',
  };

  const fmt = (val: number) =>
    new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-6">
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* TOOLBAR DE PARAMÉTRAGE ET DE FILTRAGE (CACHÉE À L'IMPRESSION)        */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      <div className="print:hidden space-y-4">
        {/* Header Action Bar */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-600" />
                Générateur de Rapports Professionnels & Bailleurs
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Ajustez les paramètres, périodes, filtres et sections narratives avant d'exporter en PDF officiel
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => window.print()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs"
              >
                <Printer className="mr-1.5 h-3.5 w-3.5" />
                Imprimer / Exporter PDF Officiel
              </Button>
            </div>
          </div>

          {/* Template Selection Tabs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 pt-4">
            <button
              type="button"
              onClick={() => {
                setTemplate('copil_executive');
                setShowEvmSection(true);
                setShowWbsSection(true);
                setShowLogframeSection(true);
                setShowBeneficiariesSection(true);
                setShowFinancialSection(true);
                setShowRisksSection(true);
              }}
              className={`p-3 rounded-xl border text-left transition-all ${
                template === 'copil_executive'
                  ? 'bg-indigo-50 border-indigo-500 text-indigo-900 shadow-2xs font-bold'
                  : 'bg-slate-50/60 border-slate-200 text-slate-700 hover:bg-white'
              }`}
            >
              <div className="flex items-center justify-between text-xs">
                <span>Rapport Flash COPIL</span>
                <span className="font-mono text-[10px] bg-indigo-200/80 px-1.5 py-0.2 rounded text-indigo-900">
                  Comité
                </span>
              </div>
              <p className="text-[11px] font-normal text-slate-500 mt-1 line-clamp-1">
                Santé 360°, EVM, Jalons & Arbitrages
              </p>
            </button>

            <button
              type="button"
              onClick={() => {
                setTemplate('funder_donor');
                setShowEvmSection(false);
                setShowWbsSection(true);
                setShowLogframeSection(true);
                setShowBeneficiariesSection(true);
                setShowFinancialSection(true);
                setShowRisksSection(false);
              }}
              className={`p-3 rounded-xl border text-left transition-all ${
                template === 'funder_donor'
                  ? 'bg-indigo-50 border-indigo-500 text-indigo-900 shadow-2xs font-bold'
                  : 'bg-slate-50/60 border-slate-200 text-slate-700 hover:bg-white'
              }`}
            >
              <div className="flex items-center justify-between text-xs">
                <span>Rapport Bailleur & Financier</span>
                <span className="font-mono text-[10px] bg-emerald-200/80 px-1.5 py-0.2 rounded text-emerald-900">
                  Audit
                </span>
              </div>
              <p className="text-[11px] font-normal text-slate-500 mt-1 line-clamp-1">
                Lignes CBS, Subventions & Dépenses
              </p>
            </button>

            <button
              type="button"
              onClick={() => {
                setTemplate('impact_beneficiaries');
                setShowEvmSection(false);
                setShowWbsSection(false);
                setShowLogframeSection(true);
                setShowBeneficiariesSection(true);
                setShowFinancialSection(false);
                setShowRisksSection(false);
              }}
              className={`p-3 rounded-xl border text-left transition-all ${
                template === 'impact_beneficiaries'
                  ? 'bg-indigo-50 border-indigo-500 text-indigo-900 shadow-2xs font-bold'
                  : 'bg-slate-50/60 border-slate-200 text-slate-700 hover:bg-white'
              }`}
            >
              <div className="flex items-center justify-between text-xs">
                <span>Impact & Analyse Genre (ACS+)</span>
                <span className="font-mono text-[10px] bg-rose-200/80 px-1.5 py-0.2 rounded text-rose-900">
                  GBA+
                </span>
              </div>
              <p className="text-[11px] font-normal text-slate-500 mt-1 line-clamp-1">
                Démographie, Ratios & Services rendus
              </p>
            </button>

            <button
              type="button"
              onClick={() => {
                setTemplate('logframe_results');
                setShowEvmSection(false);
                setShowWbsSection(true);
                setShowLogframeSection(true);
                setShowBeneficiariesSection(true);
                setShowFinancialSection(false);
                setShowRisksSection(false);
              }}
              className={`p-3 rounded-xl border text-left transition-all ${
                template === 'logframe_results'
                  ? 'bg-indigo-50 border-indigo-500 text-indigo-900 shadow-2xs font-bold'
                  : 'bg-slate-50/60 border-slate-200 text-slate-700 hover:bg-white'
              }`}
            >
              <div className="flex items-center justify-between text-xs">
                <span>Cadre Logique & Résultats</span>
                <span className="font-mono text-[10px] bg-purple-200/80 px-1.5 py-0.2 rounded text-purple-900">
                  GAR
                </span>
              </div>
              <p className="text-[11px] font-normal text-slate-500 mt-1 line-clamp-1">
                Impacts, Outcomes, Outputs & IOV
              </p>
            </button>
          </div>
        </div>

        {/* Filters and Parameter Controls */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <SlidersHorizontal className="h-4 w-4 text-indigo-600" />
              Paramètres du Document & Filtres Temporels
            </h3>
            <span className="text-[11px] text-slate-400">Personnalisez avant génération</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Période d'évaluation</label>
              <select
                value={periodPreset}
                onChange={(e) => {
                  const val = e.target.value as any;
                  setPeriodPreset(val);
                  const currentYear = new Date().getFullYear();
                  if (val === 'all') {
                    setDateStart('');
                    setDateEnd('');
                  } else if (val === 'q1') {
                    setDateStart(`${currentYear}-01-01`);
                    setDateEnd(`${currentYear}-03-31`);
                  } else if (val === 'q2') {
                    setDateStart(`${currentYear}-04-01`);
                    setDateEnd(`${currentYear}-06-30`);
                  } else if (val === 'q3') {
                    setDateStart(`${currentYear}-07-01`);
                    setDateEnd(`${currentYear}-09-30`);
                  } else if (val === 'q4') {
                    setDateStart(`${currentYear}-10-01`);
                    setDateEnd(`${currentYear}-12-31`);
                  } else if (val === 'ytd') {
                    setDateStart(`${currentYear}-01-01`);
                    setDateEnd(new Date().toISOString().split('T')[0]);
                  }
                }}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
              >
                <option value="all">Tout le projet (Cumulatif)</option>
                <option value="ytd">Année en cours (YTD)</option>
                <option value="q1">Trimestre 1 (Q1)</option>
                <option value="q2">Trimestre 2 (Q2)</option>
                <option value="q3">Trimestre 3 (Q3)</option>
                <option value="q4">Trimestre 4 (Q4)</option>
                <option value="custom">Plage personnalisée</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Date de début</label>
              <input
                type="date"
                value={dateStart}
                onChange={(e) => {
                  setDateStart(e.target.value);
                  setPeriodPreset('custom');
                }}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Date de fin</label>
              <input
                type="date"
                value={dateEnd}
                onChange={(e) => {
                  setDateEnd(e.target.value);
                  setPeriodPreset('custom');
                }}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Bailleur ciblé</label>
              <select
                value={selectedFunder}
                onChange={(e) => setSelectedFunder(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
              >
                <option value="all">Tous les bailleurs consolidés</option>
                {fundingSources.map((f) => (
                  <option key={f.id} value={f.donorName}>
                    {f.donorName} ({fmt(parseFloat(f.amount || '0'))})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Section Visibility Toggles */}
          <div className="pt-2 border-t border-slate-100">
            <span className="block font-bold text-slate-700 text-xs mb-2">Sections à inclure dans le rapport :</span>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showExecutiveSummary}
                  onChange={(e) => setShowExecutiveSummary(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                Synthèse & Faits saillants
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showEvmSection}
                  onChange={(e) => setShowEvmSection(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                Métriques EVM & Rendement
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showLogframeSection}
                  onChange={(e) => setShowLogframeSection(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                Indicateurs Cadre Logique (GAR)
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showBeneficiariesSection}
                  onChange={(e) => setShowBeneficiariesSection(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                Bénéficiaires & Démographie (ACS+)
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showWbsSection}
                  onChange={(e) => setShowWbsSection(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                Avancement des Phases WBS
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showFinancialSection}
                  onChange={(e) => setShowFinancialSection(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                Ventilation Financière CBS
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showRisksSection}
                  onChange={(e) => setShowRisksSection(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                Risques & Décisions requises
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showSignatures}
                  onChange={(e) => setShowSignatures(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                Bloc Signatures & Visas
              </label>
            </div>
          </div>

          {/* Narrative Text Customizer Accordion */}
          <details className="rounded-xl border border-indigo-100 bg-indigo-50/30 p-3.5 text-xs">
            <summary className="font-bold text-indigo-900 cursor-pointer flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <PenTool className="h-4 w-4 text-indigo-600" />
                Personnaliser les textes narratifs et les signataires
              </span>
              <span className="text-[10px] text-indigo-600">Cliquer pour déplier</span>
            </summary>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Synthèse Exécutive</label>
                <textarea
                  rows={3}
                  value={executiveSummary}
                  onChange={(e) => setExecutiveSummary(e.target.value)}
                  className="w-full rounded border border-slate-300 p-2 text-xs bg-white"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Faits Marquants & Réalisations</label>
                <textarea
                  rows={3}
                  value={highlightKeyAchievements}
                  onChange={(e) => setHighlightKeyAchievements(e.target.value)}
                  className="w-full rounded border border-slate-300 p-2 text-xs bg-white"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Décisions & Arbitrages Requis</label>
                <textarea
                  rows={3}
                  value={decisionsRequired}
                  onChange={(e) => setDecisionsRequired(e.target.value)}
                  className="w-full rounded border border-slate-300 p-2 text-xs bg-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Signataire 1 (Rédacteur)</label>
                <input
                  type="text"
                  value={preparedBy}
                  onChange={(e) => setPreparedBy(e.target.value)}
                  className="w-full rounded border border-slate-300 p-1.5 text-xs bg-white"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Signataire 2 (Validation)</label>
                <input
                  type="text"
                  value={reviewedBy}
                  onChange={(e) => setReviewedBy(e.target.value)}
                  className="w-full rounded border border-slate-300 p-1.5 text-xs bg-white"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Signataire 3 (Approbateur Bailleur/COPIL)</label>
                <input
                  type="text"
                  value={funderRepresentative}
                  onChange={(e) => setFunderRepresentative(e.target.value)}
                  className="w-full rounded border border-slate-300 p-1.5 text-xs bg-white"
                />
              </div>
            </div>
          </details>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* DOCUMENT OFFICIEL DESTINÉ À L'IMPRESSION ET À L'EXPORT PDF          */}
      {/* (Stylisé aux normes de reddition de comptes gouvernementales/bailleurs)*/}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      <div className="rounded-2xl border border-slate-300 bg-white p-8 sm:p-12 shadow-sm space-y-8 print:p-0 print:border-none print:shadow-none text-slate-900">
        {/* Document Official Header */}
        <div className="border-b-2 border-slate-900 pb-5">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-black uppercase tracking-wider bg-slate-900 text-white px-2 py-0.5 rounded">
                  {project.code}
                </span>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  RAPPORT OFFICIEL DE GOUVERNANCE & PERFORMANCE
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-950 mt-2 tracking-tight">
                {project.name}
              </h1>
              <p className="text-xs text-slate-600 mt-1">
                Type de rapport :{' '}
                <strong className="text-slate-900 uppercase font-mono">
                  {template === 'copil_executive'
                    ? 'Synthèse Périodique de Performance (Comité de Pilotage)'
                    : template === 'funder_donor'
                    ? 'Rapport de Justification Financière & Subventions'
                    : template === 'impact_beneficiaries'
                    ? 'Bilan d’Impact Social & Analyse Comparative de Genre (ACS+)'
                    : 'Rapport d’Atteinte des Résultats du Cadre Logique (GAR)'}
                </strong>
              </p>
            </div>

            <div className="sm:text-right shrink-0 font-mono text-xs text-slate-600 space-y-1">
              <div>
                <span className="text-slate-400">Date d'édition : </span>
                <strong className="text-slate-900">
                  {new Date().toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' })}
                </strong>
              </div>
              <div>
                <span className="text-slate-400">Période couverte : </span>
                <strong className="text-indigo-700">
                  {dateStart || dateEnd ? `${dateStart || 'Début'} → ${dateEnd || 'Aujourd’hui'}` : 'Cumul complet du projet'}
                </strong>
              </div>
              <div>
                <span className="text-slate-400">Statut Projet : </span>
                <strong className="text-emerald-700 uppercase font-bold">{project.status}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* ── Top Key Metric Grid (Format Bailleurs) ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border border-slate-200 rounded-xl p-4 bg-slate-50/70">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Avancement Physique</span>
            <p className="text-2xl font-black font-mono text-indigo-700 mt-0.5">{overallProgress}%</p>
            <span className="text-[11px] text-slate-500">{completedTasks.length} / {tasksOnly.length} tâches closes</span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Budget Total Approuvé</span>
            <p className="text-2xl font-black font-mono text-slate-900 mt-0.5">{fmt(totalBudgetContract)}</p>
            <span className="text-[11px] text-slate-500">{fundingSources.length} source(s) de fonds</span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Dépenses Acquittées</span>
            <p className="text-2xl font-black font-mono text-violet-800 mt-0.5">{fmt(totalApprovedExpenses)}</p>
            <span className="text-[11px] text-slate-500">Taux d'exécution : {budgetExecutionRate}%</span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Bénéficiaires Touchés</span>
            <p className="text-2xl font-black font-mono text-rose-700 mt-0.5">{totalBeneficiariesReached}</p>
            <span className="text-[11px] text-slate-500">
              {targetBeneficiaries > 0 ? `${reachPercentage}% de la cible (${targetBeneficiaries})` : 'Personnes distinctes'}
            </span>
          </div>
        </div>

        {/* ── SECTION 1 : SYNTHÈSE EXÉCUTIVE & FAITS SAILLANTS ── */}
        {showExecutiveSummary && (
          <div className="space-y-3">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1.5 flex items-center gap-2">
              <span>1.</span> Note de Synthèse Exécutive & Faits Saillants
            </h2>
            <div className="rounded-xl border border-slate-200 p-4 bg-white text-xs leading-relaxed space-y-3">
              <p className="text-slate-800 whitespace-pre-line">{executiveSummary}</p>
              {highlightKeyAchievements && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="font-bold text-slate-900 block mb-1">Faits marquants de la période :</span>
                  <p className="text-slate-700 whitespace-pre-line">{highlightKeyAchievements}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── SECTION 2 : CADRE LOGIQUE & GESTION AXÉE SUR LES RÉSULTATS (GAR) ── */}
        {showLogframeSection && (
          <div className="space-y-3">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1.5 flex items-center justify-between">
              <span>2. Chaîne de Résultats & Indicateurs de Performance (GAR)</span>
              <span className="font-mono text-xs font-normal text-slate-500">
                {resultNodes.length} niveau(x) • {indicators.length} indicateur(s)
              </span>
            </h2>

            {indicators.length === 0 && resultNodes.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">
                Aucun indicateur formel ni chaîne de résultats rattachée au projet.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                  <thead className="bg-slate-100 font-bold text-slate-800">
                    <tr>
                      <th className="px-3.5 py-2">Code</th>
                      <th className="px-3.5 py-2">Niveau</th>
                      <th className="px-3.5 py-2">Intitulé de l'Indicateur / Résultat</th>
                      <th className="px-3.5 py-2 text-right">Référence</th>
                      <th className="px-3.5 py-2 text-right">Cible</th>
                      <th className="px-3.5 py-2 text-right">Réalisé</th>
                      <th className="px-3.5 py-2 text-center">Progression</th>
                      <th className="px-3.5 py-2">Moyen de Vérification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {/* Display indicators */}
                    {indicators.map((ind: any) => {
                      const base = Number(ind.baselineValue || 0);
                      const target = Number(ind.targetValue || 1);
                      const actual = ind.latestObservation ? Number(ind.latestObservation.recordedValue) : Number(ind.actualValue || 0);
                      const pct = Math.min(100, Math.round((actual / target) * 100));

                      return (
                        <tr key={ind.id} className="hover:bg-slate-50/50">
                          <td className="px-3.5 py-2 font-mono font-bold text-indigo-700 whitespace-nowrap">
                            {ind.code}
                          </td>
                          <td className="px-3.5 py-2 uppercase text-[10px] font-bold text-slate-500">
                            {ind.level}
                          </td>
                          <td className="px-3.5 py-2 font-medium text-slate-900">
                            {ind.name}
                            {ind.description && (
                              <span className="block text-[11px] text-slate-500 mt-0.5">{ind.description}</span>
                            )}
                          </td>
                          <td className="px-3.5 py-2 font-mono text-slate-600 text-right">{base}</td>
                          <td className="px-3.5 py-2 font-mono font-bold text-slate-800 text-right">{target}</td>
                          <td className="px-3.5 py-2 font-mono font-bold text-indigo-700 text-right">{actual}</td>
                          <td className="px-3.5 py-2 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              pct >= 100 ? 'bg-emerald-100 text-emerald-800' : pct >= 50 ? 'bg-indigo-100 text-indigo-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {pct}%
                            </span>
                          </td>
                          <td className="px-3.5 py-2 text-slate-500 text-[11px]">
                            {ind.meansOfVerification || 'Rapports terrain'}
                          </td>
                        </tr>
                      );
                    })}

                    {/* Result nodes if no indicators */}
                    {indicators.length === 0 &&
                      resultNodes.map((rn: any) => (
                        <tr key={rn.id}>
                          <td className="px-3.5 py-2 font-mono font-bold text-purple-700">GAR</td>
                          <td className="px-3.5 py-2 uppercase text-[10px] font-bold text-purple-700">{rn.level}</td>
                          <td colSpan={6} className="px-3.5 py-2 font-medium text-slate-800">
                            {rn.title}
                            {rn.description && <span className="block text-[11px] text-slate-500">{rn.description}</span>}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── SECTION 3 : BÉNÉFICIAIRES & ANALYSE DE GENRE (ACS+ / GBA+) ── */}
        {showBeneficiariesSection && (
          <div className="space-y-4">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1.5 flex items-center justify-between">
              <span>3. Atteinte des Bénéficiaires & Ventilation Genre (ACS+)</span>
              <span className="font-mono text-xs font-normal text-slate-500">
                {demographics.totalPersons} personne(s) touchée(s) • {demographics.totalEntities} dossier(s) certifié(s)
              </span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Gender parity card */}
              <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/50 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                    Désagrégation par Genre (ACS+)
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 font-mono">
                    {demographics.totalPersons} pers.
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  {/* Femmes & Filles */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center font-bold">
                      <span className="flex items-center gap-1.5 text-rose-700">
                        <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                        Femmes & Filles
                      </span>
                      <strong className="font-mono text-slate-900">
                        {demographics.totalFemales} ({demographics.femalePct}%)
                      </strong>
                    </div>
                    <div className="pl-4 text-[11px] text-slate-500 flex justify-between">
                      <span>• Femmes adultes (≥ 18 ans)</span>
                      <span className="font-mono font-semibold text-slate-700">{demographics.women}</span>
                    </div>
                    <div className="pl-4 text-[11px] text-slate-500 flex justify-between">
                      <span>• Filles mineures (&lt; 18 ans)</span>
                      <span className="font-mono font-semibold text-slate-700">{demographics.girls}</span>
                    </div>
                  </div>

                  {/* Hommes & Garçons */}
                  <div className="space-y-1 pt-1.5 border-t border-slate-200/60">
                    <div className="flex justify-between items-center font-bold">
                      <span className="flex items-center gap-1.5 text-blue-700">
                        <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                        Hommes & Garçons
                      </span>
                      <strong className="font-mono text-slate-900">
                        {demographics.totalMales} ({demographics.malePct}%)
                      </strong>
                    </div>
                    <div className="pl-4 text-[11px] text-slate-500 flex justify-between">
                      <span>• Hommes adultes (≥ 18 ans)</span>
                      <span className="font-mono font-semibold text-slate-700">{demographics.men}</span>
                    </div>
                    <div className="pl-4 text-[11px] text-slate-500 flex justify-between">
                      <span>• Garçons mineurs (&lt; 18 ans)</span>
                      <span className="font-mono font-semibold text-slate-700">{demographics.boys}</span>
                    </div>
                  </div>

                  {/* Autre / Non spécifié */}
                  <div className="flex justify-between items-center pt-1.5 border-t border-slate-200/60">
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                      Autre / Non spécifié
                    </span>
                    <strong className="font-mono text-slate-900">
                      {demographics.otherGender} ({demographics.otherPct}%)
                    </strong>
                  </div>
                </div>
              </div>

              {/* Age groups */}
              <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/50 space-y-2.5">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  Groupes d'Âge & Générations
                </span>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Enfants & Mineurs (&lt; 18 ans)</span>
                    <strong className="font-mono text-slate-900">{demographics.children}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Jeunes (18 – 24 ans)</span>
                    <strong className="font-mono text-slate-900">
                      {Math.max(0, demographics.youth - demographics.children)}
                    </strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Adultes (25 – 60 ans)</span>
                    <strong className="font-mono text-slate-900">{demographics.adults}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Aînés (&gt; 60 ans)</span>
                    <strong className="font-mono text-slate-900">{demographics.seniors}</strong>
                  </div>
                  {demographics.unspecifiedCount > 0 && (
                    <div className="flex justify-between items-center pt-1 border-t border-slate-200/60 text-[11px] text-slate-400">
                      <span>Âge non renseigné</span>
                      <span className="font-mono font-semibold">{demographics.unspecifiedCount}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Cible & portance */}
              <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/50 space-y-2.5">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  Portée & Typologie Terrain
                </span>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Prestations délivrées</span>
                    <strong className="font-mono text-slate-900">{filteredDeliveries.length} acte(s)</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Individus accompagnés</span>
                    <strong className="font-mono text-slate-900">{demographics.individualsCount}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Ménages / Familles</span>
                    <strong className="font-mono text-slate-900">{demographics.householdsCount}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Communautés / Groupes</span>
                    <strong className="font-mono text-slate-900">{demographics.communitiesCount + demographics.organizationsCount}</strong>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-slate-200/60">
                    <span className="text-slate-600">Ratio moyen / personne</span>
                    <strong className="font-mono text-indigo-700">
                      {demographics.totalPersons > 0 ? (filteredDeliveries.length / demographics.totalPersons).toFixed(1) : '0'} acte(s)
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Table of individual & group deliveries */}
            {filteredDeliveries.length > 0 && (
              <div className="overflow-x-auto rounded-xl border border-slate-200 mt-2">
                <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                  <thead className="bg-slate-100 font-bold text-slate-800">
                    <tr>
                      <th className="px-3.5 py-2">Bénéficiaire & Structure</th>
                      <th className="px-3.5 py-2">Catégorie</th>
                      <th className="px-3.5 py-2 text-center">Personnes</th>
                      <th className="px-3.5 py-2">Détail Genre & Âge (ACS+)</th>
                      <th className="px-3.5 py-2">Prestation Délivrée</th>
                      <th className="px-3.5 py-2 text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredDeliveries.map((d: any) => {
                      const custom = (d.customFields as Record<string, any>) || {};
                      const bType = custom.beneficiaryType || (d.partyKind === 'organization' ? 'community' : 'individual');
                      const displayName = d.partyKind === 'organization'
                        ? (d.lastName || d.firstName || 'Organisation')
                        : `${d.firstName || ''} ${d.lastName || ''}`.trim() || 'Individu';

                      const isIndiv = bType === 'individual';
                      const mMen = Number(custom.menCount) || 0;
                      const mWomen = Number(custom.womenCount) || 0;
                      const mBoys = Number(custom.boysCount) || 0;
                      const mGirls = Number(custom.girlsCount) || 0;
                      const mKids = Number(custom.childCount) || (mBoys + mGirls);
                      const mTotal = isIndiv ? 1 : (Number(custom.memberCount) || (mMen + mWomen + mBoys + mGirls) || 1);

                      let demoDetail = '';
                      if (isIndiv) {
                        const g = (d.genderCode || '').toLowerCase();
                        const gLabel = g === 'f' || g === 'female' || g === 'femme' ? 'Femme' : g === 'm' || g === 'male' || g === 'homme' ? 'Homme' : 'Non spécifié';
                        let ageLabel = '';
                        if (d.birthDate) {
                          const age = new Date().getFullYear() - new Date(d.birthDate).getFullYear();
                          ageLabel = `, ${age} ans`;
                        }
                        demoDetail = `${gLabel}${ageLabel}`;
                      } else {
                        const parts = [];
                        if (mWomen > 0) parts.push(`${mWomen} F`);
                        if (mGirls > 0) parts.push(`${mGirls} Filles`);
                        if (mMen > 0) parts.push(`${mMen} H`);
                        if (mBoys > 0) parts.push(`${mBoys} Garçons`);
                        if (parts.length === 0 && mKids > 0) parts.push(`${mKids} Enfants`);
                        demoDetail = parts.length > 0 ? parts.join(', ') : 'Détail non spécifié';
                      }

                      return (
                        <tr key={d.id} className="hover:bg-slate-50/50">
                          <td className="px-3.5 py-2 font-medium text-slate-900">
                            {displayName}
                            {custom.location && <span className="block text-[10px] text-slate-400">{custom.location}</span>}
                          </td>
                          <td className="px-3.5 py-2 uppercase text-[10px] font-bold text-slate-500">
                            <span className={`px-2 py-0.5 rounded-full ${
                              bType === 'individual' ? 'bg-slate-100 text-slate-700' : bType === 'household' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                            }`}>
                              {bType === 'individual' ? 'Individu' : bType === 'household' ? 'Ménage' : 'Collectivité'}
                            </span>
                          </td>
                          <td className="px-3.5 py-2 text-center font-mono font-bold text-slate-900">
                            {mTotal}
                          </td>
                          <td className="px-3.5 py-2 text-xs text-slate-700">
                            {demoDetail}
                          </td>
                          <td className="px-3.5 py-2 font-medium text-indigo-700">
                            {d.serviceType || 'Service rattaché'}
                            {d.notes && <span className="block text-[11px] text-slate-500 font-normal">{d.notes}</span>}
                          </td>
                          <td className="px-3.5 py-2 text-right font-mono text-slate-500 text-[11px]">
                            {d.deliveredAt ? new Date(d.deliveredAt).toLocaleDateString('fr-CA') : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── SECTION 4 : GOUVERNANCE FINANCIÈRE & LIGNES BUDGÉTAIRES (CBS) ── */}
        {showFinancialSection && (
          <div className="space-y-3">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1.5 flex items-center justify-between">
              <span>4. Exécution Budgétaire & Ventilation par Catégorie (CBS)</span>
              <span className="font-mono text-xs font-normal text-slate-500">
                Solde : {fmt(totalBudgetContract - totalApprovedExpenses)}
              </span>
            </h2>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                <thead className="bg-slate-100 font-bold text-slate-800">
                  <tr>
                    <th className="px-3.5 py-2">Catégorie Budgétaire (CBS)</th>
                    <th className="px-3.5 py-2 text-right">Budget Alloué</th>
                    <th className="px-3.5 py-2 text-right">Dépenses Acquittées</th>
                    <th className="px-3.5 py-2 text-right">Solde Disponible</th>
                    <th className="px-3.5 py-2 text-center">Taux d'Absorption</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {Object.entries(cbsBreakdown)
                    .filter(([_, data]) => data.budget > 0 || data.actual > 0)
                    .map(([catKey, data]) => {
                      const balance = data.budget - data.actual;
                      const rate = data.budget > 0 ? Math.round((data.actual / data.budget) * 100) : 0;
                      return (
                        <tr key={catKey}>
                          <td className="px-3.5 py-2 font-bold text-slate-900">
                            {CATEGORY_NAMES[catKey] || catKey}
                          </td>
                          <td className="px-3.5 py-2 font-mono text-slate-700 text-right">{fmt(data.budget)}</td>
                          <td className="px-3.5 py-2 font-mono font-bold text-violet-900 text-right">{fmt(data.actual)}</td>
                          <td className={`px-3.5 py-2 font-mono text-right font-bold ${balance < 0 ? 'text-red-600' : 'text-slate-800'}`}>
                            {fmt(balance)}
                          </td>
                          <td className="px-3.5 py-2 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              rate > 100 ? 'bg-red-100 text-red-800' : rate >= 70 ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {rate}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  {/* Totals Row */}
                  <tr className="bg-slate-50 font-bold border-t-2 border-slate-300">
                    <td className="px-3.5 py-2.5 uppercase text-slate-900">Total Général Consolidé</td>
                    <td className="px-3.5 py-2.5 font-mono text-slate-900 text-right">{fmt(totalBudgetContract)}</td>
                    <td className="px-3.5 py-2.5 font-mono text-violet-900 text-right">{fmt(totalApprovedExpenses)}</td>
                    <td className="px-3.5 py-2.5 font-mono text-slate-900 text-right">{fmt(totalBudgetContract - totalApprovedExpenses)}</td>
                    <td className="px-3.5 py-2.5 text-center font-mono text-indigo-900">{budgetExecutionRate}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── SECTION 5 : AVANCEMENT WBS & JALONS ── */}
        {showWbsSection && (
          <div className="space-y-3">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1.5 flex items-center justify-between">
              <span>5. Exécution du Plan de Travail (WBS) & Jalons Clés</span>
              <span className="font-mono text-xs font-normal text-slate-500">
                {phases.length} phase(s) • {milestones.length} jalon(s)
              </span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {phases.map((ph) => (
                <div key={ph.id} className="rounded-xl border border-slate-200 p-3 bg-slate-50/60 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900 truncate">
                      <span className="font-mono text-indigo-700 mr-1.5">[{ph.wbs}]</span>
                      {ph.title}
                    </span>
                    <span className="font-mono font-bold text-indigo-700">{ph.progressPct || 0}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full"
                      style={{ width: `${ph.progressPct || 0}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>
                      {ph.startDate ? new Date(ph.startDate).toLocaleDateString('fr-CA') : '—'} au{' '}
                      {ph.endDate ? new Date(ph.endDate).toLocaleDateString('fr-CA') : '—'}
                    </span>
                    <span>{planItems.filter((i) => i.parentId === ph.id).length} tâche(s)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SECTION 6 : ARBITRAGES, RISQUES MAJEURS & DÉCISIONS COPIL ── */}
        {showRisksSection && (
          <div className="space-y-3">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1.5 flex items-center justify-between">
              <span>6. Vigilance Opérationnelle & Décisions Soumises au Comité</span>
              <span className="font-mono text-xs font-normal text-slate-500">
                {raidItems.length} élément(s) RAID
              </span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Top risks */}
              <div className="rounded-xl border border-slate-200 p-4 bg-white space-y-2">
                <span className="font-bold text-slate-900 uppercase text-[11px] block">
                  Risques Prioritaires (Impact × Probabilité)
                </span>
                {raidItems.filter((r) => r.type === 'risk').length === 0 ? (
                  <p className="text-slate-400 italic">Aucun risque critique à signaler.</p>
                ) : (
                  <div className="space-y-1.5">
                    {raidItems
                      .filter((r) => r.type === 'risk')
                      .slice(0, 3)
                      .map((r) => (
                        <div key={r.id} className="p-2 rounded bg-amber-50/60 border border-amber-200 flex justify-between items-center">
                          <span className="font-medium text-amber-950 truncate max-w-[200px]">{r.title}</span>
                          <span className="font-mono font-bold text-red-700 bg-red-100 px-1.5 py-0.2 rounded text-[10px]">
                            {(r.probability || 1) * (r.impact || 1)}/25
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Decisions required */}
              <div className="rounded-xl border border-slate-200 p-4 bg-white space-y-2">
                <span className="font-bold text-slate-900 uppercase text-[11px] block">
                  Décisions & Arbitrages Requis (COPIL)
                </span>
                <p className="text-slate-700 whitespace-pre-line leading-relaxed">
                  {decisionsRequired}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── SECTION 7 : CADRE OFFICIEL DE VALIDATION & SIGNATURES ── */}
        {showSignatures && (
          <div className="pt-6 border-t-2 border-slate-900 space-y-4">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-700">
              7. Visa & Certifications Officielles
            </h2>
            <div className="grid grid-cols-3 gap-6 pt-2">
              <div className="border border-slate-300 rounded-xl p-4 min-h-[110px] flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Établi par :
                  </span>
                  <p className="text-xs font-bold text-slate-900 mt-0.5">{preparedBy}</p>
                </div>
                <div className="border-t border-dashed border-slate-300 pt-1 text-[10px] text-slate-400">
                  Signature & Date :
                </div>
              </div>

              <div className="border border-slate-300 rounded-xl p-4 min-h-[110px] flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Vérifié & Approuvé par :
                  </span>
                  <p className="text-xs font-bold text-slate-900 mt-0.5">{reviewedBy}</p>
                </div>
                <div className="border-t border-dashed border-slate-300 pt-1 text-[10px] text-slate-400">
                  Signature & Date :
                </div>
              </div>

              <div className="border border-slate-300 rounded-xl p-4 min-h-[110px] flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Pour le Bailleur / COPIL :
                  </span>
                  <p className="text-xs font-bold text-slate-900 mt-0.5">{funderRepresentative}</p>
                </div>
                <div className="border-t border-dashed border-slate-300 pt-1 text-[10px] text-slate-400">
                  Mention « Lu et Approuvé » & Date :
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
