import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Input, Badge } from '@orgdashio/ui';
import {
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Sparkles,
  Zap,
  Building2,
  Users,
  FolderKanban,
  HardDrive,
  FileText,
  Download,
  Calendar,
  Clock,
  Shield,
  ArrowUpRight,
  Receipt,
  Check,
  HelpCircle,
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';

export function BillingScreen() {
  const queryClient = useQueryClient();

  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [showChangePlanModal, setShowChangePlanModal] = useState(false);
  const [selectedPlanForUpgrade, setSelectedPlanForUpgrade] = useState<any>(null);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [cardLast4, setCardLast4] = useState('4242');
  const [cardBrand, setCardBrand] = useState('Visa');
  const [billingEmail, setBillingEmail] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [neqNumber, setNeqNumber] = useState('');

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch subscription & real-time quotas
  const { data: subData, isLoading: isSubLoading } = useQuery({
    queryKey: ['tenantSubscription'],
    queryFn: async () => {
      const res = await fetch('/api/v1/billing/subscription');
      if (!res.ok) throw new Error('Erreur de chargement de l’abonnement');
      return res.json();
    },
  });

  // Fetch available plans
  const { data: plans = [] } = useQuery({
    queryKey: ['subscriptionPlans'],
    queryFn: async () => {
      const res = await fetch('/api/v1/billing/plans');
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Fetch invoices
  const { data: invoices = [] } = useQuery({
    queryKey: ['tenantInvoices'],
    queryFn: async () => {
      const res = await fetch('/api/v1/billing/invoices');
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Mutation: Change Plan
  const changePlanMutation = useMutation({
    mutationFn: async (payload: { planCode: string; billingCycle: 'monthly' | 'annual' }) => {
      const res = await fetch('/api/v1/billing/change-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Erreur lors du changement de forfait');
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tenantSubscription'] });
      queryClient.invalidateQueries({ queryKey: ['tenantInvoices'] });
      setShowChangePlanModal(false);
      setSuccessMsg(`Félicitations ! Votre organisation est désormais sur le forfait ${data.plan.name}.`);
    },
    onError: (err: any) => setError(err.message),
  });

  // Mutation: Update Payment Method
  const paymentMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch('/api/v1/billing/payment-method', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Erreur lors de la mise à jour du moyen de paiement');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenantSubscription'] });
      setShowPaymentModal(false);
      setSuccessMsg('Moyen de paiement et coordonnées de facturation mis à jour.');
    },
    onError: (err: any) => setError(err.message),
  });

  const currentPlanCode = subData?.subscription?.planCode || 'starter';
  const usage = subData?.usage;
  const currentSub = subData?.subscription;

  const getPlanFeatureBadge = (code: string) => {
    switch (code) {
      case 'enterprise':
        return 'Fédération & Grand Compte';
      case 'pro':
        return 'Le plus populaire';
      case 'starter':
        return 'Essentiel OBNL';
      case 'community':
      default:
        return 'Gratuit / Émergent';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                Facturation & Quotas SaaS • R1B.3
              </span>
              <span className="text-xs text-slate-400">Taxes Québec (TPS 5% + TVQ 9.975%)</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">Abonnement & Facturation</h1>
            <p className="text-sm text-slate-500">
              Gérez votre forfait, surveillez les quotas de votre organisation et téléchargez vos reçus fiscaux
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setBillingEmail(currentSub?.billingEmail || '');
                setBillingAddress(currentSub?.billingAddress || '');
                setNeqNumber(currentSub?.neqNumber || '');
                setShowPaymentModal(true);
              }}
            >
              <CreditCard className="w-4 h-4 mr-2" /> Mode de paiement
            </Button>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="p-4 bg-rose-50 text-rose-700 rounded-xl border border-rose-200 flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-rose-500 font-bold">
              ✕
            </button>
          </div>
        )}
        {successMsg && (
          <div className="p-4 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200 flex justify-between items-center">
            <span>{successMsg}</span>
            <button onClick={() => setSuccessMsg('')} className="text-emerald-500 font-bold">
              ✕
            </button>
          </div>
        )}

        {/* Current Subscription & Quotas Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-black text-xl">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-slate-900">
                    Forfait {subData?.plan?.name || currentPlanCode.toUpperCase()}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-emerald-100 text-emerald-800">
                    {currentSub?.status === 'active' ? 'Actif' : currentSub?.status}
                  </span>
                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700">
                    Facturation {currentSub?.billingCycle === 'annual' ? 'Annuelle' : 'Mensuelle'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Prochain renouvellement le :{' '}
                  <strong className="text-slate-700">
                    {currentSub?.currentPeriodEnd
                      ? new Date(currentSub.currentPeriodEnd).toLocaleDateString('fr-CA', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : 'N/A'}
                  </strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-2xl font-black text-slate-900">
                  {currentSub?.billingCycle === 'annual'
                    ? `${subData?.plan?.priceAnnual || 0} $ CAD`
                    : `${subData?.plan?.priceMonthly || 0} $ CAD`}
                </span>
                <span className="text-xs text-slate-400 block">
                  {currentSub?.billingCycle === 'annual' ? '/ an + taxes' : '/ mois + taxes'}
                </span>
              </div>
            </div>
          </div>

          {/* Quota Progress Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Sièges Utilisateurs */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-600 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-indigo-600" /> Sièges Utilisateurs
                </span>
                <span
                  className={
                    usage?.usersQuota?.isExceeded
                      ? 'text-rose-600 font-bold'
                      : usage?.usersQuota?.isWarning
                      ? 'text-amber-600 font-bold'
                      : 'text-slate-700'
                  }
                >
                  {usage?.activeUsers ?? 0} / {usage?.maxUsers ?? 5} actifs
                </span>
              </div>
              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    usage?.usersQuota?.isExceeded
                      ? 'bg-rose-600'
                      : usage?.usersQuota?.isWarning
                      ? 'bg-amber-500'
                      : 'bg-indigo-600'
                  }`}
                  style={{ width: `${Math.min(usage?.usersQuota?.usagePct ?? 0, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>{usage?.totalMembers ?? 0} comptes créés</span>
                <span>{usage?.usersQuota?.usagePct ?? 0}% utilisé</span>
              </div>
            </div>

            {/* Projets Actifs */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-600 flex items-center gap-1.5">
                  <FolderKanban className="w-4 h-4 text-sky-600" /> Projets Organisme
                </span>
                <span
                  className={
                    usage?.projectsQuota?.isExceeded
                      ? 'text-rose-600 font-bold'
                      : usage?.projectsQuota?.isWarning
                      ? 'text-amber-600 font-bold'
                      : 'text-slate-700'
                  }
                >
                  {usage?.totalProjects ?? 0} / {usage?.maxProjects ?? 5} projets
                </span>
              </div>
              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    usage?.projectsQuota?.isExceeded
                      ? 'bg-rose-600'
                      : usage?.projectsQuota?.isWarning
                      ? 'bg-amber-500'
                      : 'bg-sky-600'
                  }`}
                  style={{ width: `${Math.min(usage?.projectsQuota?.usagePct ?? 0, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>{usage?.totalCases ?? 0} dossiers de cas</span>
                <span>{usage?.projectsQuota?.usagePct ?? 0}% utilisé</span>
              </div>
            </div>

            {/* Stockage GED */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-600 flex items-center gap-1.5">
                  <HardDrive className="w-4 h-4 text-emerald-600" /> Espace Documentaire
                </span>
                <span className="text-slate-700">
                  {usage?.estimatedStorageGb ?? 0} Go / {usage?.maxStorageGb ?? 5} Go
                </span>
              </div>
              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(usage?.storageQuota?.usagePct ?? 0, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>{usage?.totalDocuments ?? 0} fichiers indexés</span>
                <span>{usage?.storageQuota?.usagePct ?? 0}% utilisé</span>
              </div>
            </div>
          </div>
        </div>

        {/* Plan Comparator & Upgrade Section */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Changer de Formule</h2>
              <p className="text-xs text-slate-500">
                Sélectionnez le forfait adapté à la taille et aux ambitions d'impact de votre organisme
              </p>
            </div>

            {/* Billing Cycle Toggle */}
            <div className="bg-slate-200 p-1 rounded-xl flex items-center self-start">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  billingCycle === 'monthly'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Mensuel
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  billingCycle === 'annual'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Annuel
                <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.5 rounded font-black">
                  -17%
                </span>
              </button>
            </div>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {plans.map((p: any) => {
              const isCurrent = currentPlanCode === p.code;
              const price = billingCycle === 'annual' ? Number(p.priceAnnual) / 12 : Number(p.priceMonthly);

              return (
                <div
                  key={p.code}
                  className={`bg-white rounded-2xl border p-6 flex flex-col justify-between transition relative ${
                    isCurrent
                      ? 'border-indigo-600 shadow-md ring-2 ring-indigo-600/20'
                      : 'border-slate-200 hover:border-slate-300 shadow-sm'
                  }`}
                >
                  {isCurrent && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-indigo-600 text-white rounded-full text-[10px] font-black uppercase tracking-wider">
                      Forfait Actuel
                    </span>
                  )}

                  <div className="space-y-4">
                    <div>
                      <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">
                        {getPlanFeatureBadge(p.code)}
                      </span>
                      <h3 className="text-lg font-bold text-slate-900">{p.name}</h3>
                      <p className="text-xs text-slate-500 mt-1 min-h-[32px]">{p.description}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-slate-900">
                          {Math.round(price)} $
                        </span>
                        <span className="text-xs text-slate-400">CAD / mois</span>
                      </div>
                      <span className="text-[11px] text-slate-500 block mt-0.5">
                        {billingCycle === 'annual'
                          ? `Facturé ${p.priceAnnual} $ par an`
                          : `Facturé mensuellement`}
                      </span>
                    </div>

                    {/* Features list */}
                    <ul className="space-y-2.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>
                          <strong>{p.maxUsers >= 9999 ? 'Sièges illimités' : `${p.maxUsers} sièges`}</strong> inclus
                        </span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>
                          <strong>{p.maxProjects >= 9999 ? 'Projets illimités' : `${p.maxProjects} projets`}</strong>
                        </span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>
                          <strong>{p.maxStorageGb} Go</strong> de stockage sécurisé
                        </span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Dossiers de cas sociaux Loi 25</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Cadre logique & indicateurs GAC/IRCC</span>
                      </li>
                    </ul>
                  </div>

                  <div className="pt-6">
                    {isCurrent ? (
                      <Button variant="outline" className="w-full" disabled>
                        Plan en cours
                      </Button>
                    ) : (
                      <Button
                        className="w-full"
                        onClick={() => {
                          setSelectedPlanForUpgrade(p);
                          setShowChangePlanModal(true);
                        }}
                      >
                        Passer à {p.name}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment & Invoices Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Payment Method Details */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-indigo-600" /> Mode de Paiement Actif
            </h3>

            <div className="p-4 bg-slate-900 text-white rounded-xl space-y-4 shadow-sm">
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span>Carte de paiement OBNL</span>
                <span className="font-bold text-white uppercase">{currentSub?.paymentMethodBrand || 'VISA'}</span>
              </div>
              <p className="font-mono text-lg tracking-widest text-slate-200">
                •••• •••• •••• {currentSub?.paymentMethodLast4 || '4242'}
              </p>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Titulaire: {currentSub?.billingEmail || 'Organisme'}</span>
                <span>EXP: 12/28</span>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
              <div>
                <span className="text-slate-400 block">Courriel de facturation :</span>
                <span className="font-semibold text-slate-800">
                  {currentSub?.billingEmail || 'contact@organisme.org'}
                </span>
              </div>
              {currentSub?.neqNumber && (
                <div>
                  <span className="text-slate-400 block">NEQ Québec :</span>
                  <span className="font-semibold text-slate-800">{currentSub.neqNumber}</span>
                </div>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                setBillingEmail(currentSub?.billingEmail || '');
                setBillingAddress(currentSub?.billingAddress || '');
                setNeqNumber(currentSub?.neqNumber || '');
                setShowPaymentModal(true);
              }}
            >
              Modifier les coordonnées
            </Button>
          </div>

          {/* Invoices History */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-600" /> Historique des Factures & Reçus
              </h3>
              <span className="text-xs text-slate-400">{invoices.length} factures émises</span>
            </div>

            {invoices.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-6 text-center">
                Aucune facture émise pour le moment.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                      <th className="p-3 font-semibold">N° Facture</th>
                      <th className="p-3 font-semibold">Date</th>
                      <th className="p-3 font-semibold">Plan</th>
                      <th className="p-3 font-semibold text-right">Sous-total</th>
                      <th className="p-3 font-semibold text-right">TPS / TVQ</th>
                      <th className="p-3 font-semibold text-right">Total CAD</th>
                      <th className="p-3 font-semibold text-center">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoices.map((inv: any) => (
                      <tr key={inv.id} className="hover:bg-slate-50">
                        <td className="p-3 font-mono font-bold text-indigo-600">{inv.invoiceNumber}</td>
                        <td className="p-3 text-slate-600">
                          {new Date(inv.createdAt).toLocaleDateString('fr-CA')}
                        </td>
                        <td className="p-3 font-medium text-slate-900">{inv.planName}</td>
                        <td className="p-3 text-right font-medium">{inv.subtotal} $</td>
                        <td className="p-3 text-right text-slate-500">
                          {inv.taxTps} $ / {inv.taxTvq} $
                        </td>
                        <td className="p-3 text-right font-black text-slate-900">{inv.total} $</td>
                        <td className="p-3 text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Payé
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* MODAL CONFIRMATION CHANGEMENT DE FORFAIT */}
        {showChangePlanModal && selectedPlanForUpgrade && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900">Confirmer le changement de formule</h3>
                <button
                  onClick={() => setShowChangePlanModal(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold text-xl"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <p className="text-slate-600">
                  Vous vous apprêtez à passer au forfait <strong>{selectedPlanForUpgrade.name}</strong> avec
                  facturation <strong>{billingCycle === 'annual' ? 'annuelle' : 'mensuelle'}</strong>.
                </p>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Sous-total :</span>
                    <span className="font-bold text-slate-900">
                      {billingCycle === 'annual'
                        ? selectedPlanForUpgrade.priceAnnual
                        : selectedPlanForUpgrade.priceMonthly}{' '}
                      $ CAD
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>TPS Fédérale (5%) :</span>
                    <span>
                      {(
                        (billingCycle === 'annual'
                          ? Number(selectedPlanForUpgrade.priceAnnual)
                          : Number(selectedPlanForUpgrade.priceMonthly)) * 0.05
                      ).toFixed(2)}{' '}
                      $
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>TVQ Québec (9.975%) :</span>
                    <span>
                      {(
                        (billingCycle === 'annual'
                          ? Number(selectedPlanForUpgrade.priceAnnual)
                          : Number(selectedPlanForUpgrade.priceMonthly)) * 0.09975
                      ).toFixed(2)}{' '}
                      $
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-black text-slate-900">
                    <span>Total facturé :</span>
                    <span className="text-indigo-600">
                      {(
                        (billingCycle === 'annual'
                          ? Number(selectedPlanForUpgrade.priceAnnual)
                          : Number(selectedPlanForUpgrade.priceMonthly)) * 1.14975
                      ).toFixed(2)}{' '}
                      $ CAD
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400">
                  Votre carte finissant par {currentSub?.paymentMethodLast4 || '4242'} sera débitée et un reçu
                  fiscal avec taxes sera automatiquement généré.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button variant="outline" onClick={() => setShowChangePlanModal(false)}>
                  Annuler
                </Button>
                <Button
                  onClick={() => {
                    changePlanMutation.mutate({
                      planCode: selectedPlanForUpgrade.code,
                      billingCycle,
                    });
                  }}
                  disabled={changePlanMutation.isPending}
                >
                  {changePlanMutation.isPending ? 'Traitement...' : 'Confirmer et Payer'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL MISE À JOUR MODE DE PAIEMENT */}
        {showPaymentModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900">Modifier les coordonnées de facturation</h3>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold text-xl"
                >
                  ✕
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  paymentMutation.mutate({
                    paymentMethodLast4: cardLast4,
                    paymentMethodBrand: cardBrand,
                    billingEmail: billingEmail || undefined,
                    billingAddress: billingAddress || undefined,
                    neqNumber: neqNumber || undefined,
                  });
                }}
                className="space-y-3"
              >
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">4 derniers chiffres</label>
                    <Input
                      maxLength={4}
                      value={cardLast4}
                      onChange={(e) => setCardLast4(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Marque</label>
                    <select
                      className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-white mt-1"
                      value={cardBrand}
                      onChange={(e) => setCardBrand(e.target.value)}
                    >
                      <option value="Visa">Visa</option>
                      <option value="MasterCard">MasterCard</option>
                      <option value="Amex">American Express</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">Courriel de facturation</label>
                  <Input
                    type="email"
                    value={billingEmail}
                    onChange={(e) => setBillingEmail(e.target.value)}
                    placeholder="comptabilite@organisme.org"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">Adresse de l'organisme</label>
                  <Input
                    value={billingAddress}
                    onChange={(e) => setBillingAddress(e.target.value)}
                    placeholder="1234 Rue Sainte-Catherine, Montréal, QC"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">Numéro d'entreprise du Québec (NEQ)</label>
                  <Input
                    value={neqNumber}
                    onChange={(e) => setNeqNumber(e.target.value)}
                    placeholder="1170000000"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <Button variant="outline" type="button" onClick={() => setShowPaymentModal(false)}>
                    Annuler
                  </Button>
                  <Button type="submit" disabled={paymentMutation.isPending}>
                    {paymentMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
