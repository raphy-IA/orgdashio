import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Input, Badge } from '@orgdashio/ui';
import {
  HeartHandshake,
  Plus,
  DollarSign,
  Receipt,
  Users,
  Megaphone,
  Calendar,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  FileText,
  AlertCircle,
  AlertTriangle,
  Building2,
  Download,
  Printer,
  Ban,
  ShieldCheck,
  TrendingUp,
  Sparkles,
  Award,
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';

type DonationTab = 'donations' | 'donors' | 'campaigns' | 'receipts';

interface DonationItem {
  id: string;
  donationNumber: string;
  donationDate: string;
  grossAmount: number;
  advantageAmount: number;
  eligibleAmount: number;
  currency: string;
  paymentMethod: string;
  paymentReference?: string | null;
  recurrence: string;
  status: string;
  isTaxReceiptEligible: boolean;
  taxReceiptId?: string | null;
  notes?: string | null;
  donorId: string;
  donorName: string;
  donorEmail?: string | null;
  campaignId?: string | null;
  campaignName?: string | null;
  projectId?: string | null;
  projectName?: string | null;
}

interface DonorItem {
  id: string;
  displayName: string;
  type: 'individual' | 'organization' | 'anonymous';
  firstName?: string | null;
  lastName?: string | null;
  companyName?: string | null;
  email?: string | null;
  phone?: string | null;
  taxAddress?: string | null;
  taxCity?: string | null;
  taxStateProvince?: string | null;
  taxPostalCode?: string | null;
  taxCountry?: string | null;
  totalGiven: number;
  donationCount: number;
}

interface CampaignItem {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  targetAmount: number;
  collectedAmount: number;
  progressPct: number;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  startDate?: string | null;
  endDate?: string | null;
}

interface TaxReceiptItem {
  id: string;
  receiptNumber: string;
  donorId: string;
  donorName: string;
  donorEmail?: string | null;
  type: 'single_donation' | 'annual_consolidated';
  taxYear: number;
  issueDate: string;
  locationIssued: string;
  totalReceivedAmount: number;
  totalAdvantageAmount: number;
  totalEligibleAmount: number;
  charityRegistrationNumber: string;
  status: 'draft' | 'issued' | 'cancelled' | 'replaced';
  replacementReason?: string | null;
  authorizedSignatoryName: string;
  donorSnapshot?: any;
}

export function DonationListScreen() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<DonationTab>('donations');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('ALL');
  const [filterReceiptStatus, setFilterReceiptStatus] = useState('ALL');

  // Modals state
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [showDonorModal, setShowDonorModal] = useState(false);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [showConsolidatedModal, setShowConsolidatedModal] = useState(false);
  const [showReceiptPreviewModal, setShowReceiptPreviewModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);

  // New Donation form state
  const [donDonorId, setDonDonorId] = useState('');
  const [donCampaignId, setDonCampaignId] = useState('');
  const [donGrossAmount, setDonGrossAmount] = useState(100);
  const [donAdvantageAmount, setDonAdvantageAmount] = useState(0);
  const [donPaymentMethod, setDonPaymentMethod] = useState<'interac' | 'credit_card' | 'cheque' | 'cash' | 'bank_transfer' | 'other'>('interac');
  const [donPaymentRef, setDonPaymentRef] = useState('');
  const [donRecurrence, setDonRecurrence] = useState<'one_time' | 'monthly' | 'annual'>('one_time');
  const [donDate, setDonDate] = useState(new Date().toISOString().substring(0, 10));
  const [donIsEligible, setDonIsEligible] = useState(true);
  const [donGenerateReceipt, setDonGenerateReceipt] = useState(true);
  const [donSignatoryName, setDonSignatoryName] = useState('Direction Générale');
  const [donLocationIssued, setDonLocationIssued] = useState('Montréal, QC');
  const [donNotes, setDonNotes] = useState('');

  // New Donor form state
  const [donorType, setDonorType] = useState<'individual' | 'organization' | 'anonymous'>('individual');
  const [donorFirstName, setDonorFirstName] = useState('');
  const [donorLastName, setDonorLastName] = useState('');
  const [donorCompanyName, setDonorCompanyName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [donorPhone, setDonorPhone] = useState('');
  const [donorTaxAddress, setDonorTaxAddress] = useState('');
  const [donorTaxCity, setDonorTaxCity] = useState('');
  const [donorTaxPostalCode, setDonorTaxPostalCode] = useState('');
  const [donorTaxState, setDonorTaxState] = useState('QC');

  // New Campaign form state
  const [campCode, setCampCode] = useState('');
  const [campName, setCampName] = useState('');
  const [campTargetAmount, setCampTargetAmount] = useState(50000);
  const [campDescription, setCampDescription] = useState('');

  // Consolidated receipt form state
  const [consDonorId, setConsDonorId] = useState('');
  const [consYear, setConsYear] = useState(new Date().getFullYear());
  const [consSignatoryName, setConsSignatoryName] = useState('Direction Générale');
  const [consLocation, setConsLocation] = useState('Montréal, QC');

  // Cancel receipt state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellingReceiptId, setCancellingReceiptId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelReplaceWithNew, setCancelReplaceWithNew] = useState(false);

  // Queries
  const { data: dashboardData } = useQuery<any>({
    queryKey: ['donationsDashboard'],
    queryFn: async () => {
      const res = await fetch('/api/v1/donations/dashboard');
      if (!res.ok) return null;
      return res.json();
    },
  });

  const { data: donations = [], isLoading: isDonationsLoading } = useQuery<DonationItem[]>({
    queryKey: ['donations'],
    queryFn: async () => {
      const res = await fetch('/api/v1/donations');
      if (!res.ok) throw new Error('Erreur de chargement des dons');
      return res.json();
    },
  });

  const { data: donors = [] } = useQuery<DonorItem[]>({
    queryKey: ['donors'],
    queryFn: async () => {
      const res = await fetch('/api/v1/donors');
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: campaigns = [] } = useQuery<CampaignItem[]>({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const res = await fetch('/api/v1/campaigns');
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: taxReceipts = [] } = useQuery<TaxReceiptItem[]>({
    queryKey: ['taxReceipts'],
    queryFn: async () => {
      const res = await fetch('/api/v1/tax-receipts');
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Mutations
  const createDonationMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch('/api/v1/donations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Erreur lors de l\'enregistrement du don');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donations'] });
      queryClient.invalidateQueries({ queryKey: ['donationsDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['taxReceipts'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['donors'] });
      setShowDonationModal(false);
      resetDonationForm();
    },
  });

  const createDonorMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch('/api/v1/donors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Erreur lors de la création du donateur');
      }
      return res.json();
    },
    onSuccess: (newDonor) => {
      queryClient.invalidateQueries({ queryKey: ['donors'] });
      setShowDonorModal(false);
      resetDonorForm();
      if (showDonationModal) {
        setDonDonorId(newDonor.id);
      }
    },
  });

  const createCampaignMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch('/api/v1/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Erreur lors de la création de la campagne');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      setShowCampaignModal(false);
      resetCampaignForm();
    },
  });

  const issueSingleReceiptMutation = useMutation({
    mutationFn: async (payload: { donationId: string; signatory: string; location: string }) => {
      const res = await fetch('/api/v1/tax-receipts/single', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          donationId: payload.donationId,
          authorizedSignatoryName: payload.signatory,
          locationIssued: payload.location,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Erreur lors de l\'émission du reçu fiscal');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donations'] });
      queryClient.invalidateQueries({ queryKey: ['taxReceipts'] });
      queryClient.invalidateQueries({ queryKey: ['donationsDashboard'] });
    },
  });

  const issueConsolidatedMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch('/api/v1/tax-receipts/consolidated', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Erreur lors de l\'émission du reçu consolidé');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donations'] });
      queryClient.invalidateQueries({ queryKey: ['taxReceipts'] });
      queryClient.invalidateQueries({ queryKey: ['donationsDashboard'] });
      setShowConsolidatedModal(false);
    },
  });

  const cancelReceiptMutation = useMutation({
    mutationFn: async ({ receiptId, payload }: { receiptId: string; payload: any }) => {
      const res = await fetch(`/api/v1/tax-receipts/${receiptId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Erreur lors de l\'annulation');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donations'] });
      queryClient.invalidateQueries({ queryKey: ['taxReceipts'] });
      queryClient.invalidateQueries({ queryKey: ['donationsDashboard'] });
      setShowCancelModal(false);
      setCancellingReceiptId(null);
      setCancelReason('');
    },
  });

  // Form Resets
  const resetDonationForm = () => {
    setDonDonorId(donors[0]?.id || '');
    setDonCampaignId('');
    setDonGrossAmount(100);
    setDonAdvantageAmount(0);
    setDonPaymentMethod('interac');
    setDonPaymentRef('');
    setDonRecurrence('one_time');
    setDonDate(new Date().toISOString().substring(0, 10));
    setDonIsEligible(true);
    setDonGenerateReceipt(true);
    setDonNotes('');
  };

  const resetDonorForm = () => {
    setDonorType('individual');
    setDonorFirstName('');
    setDonorLastName('');
    setDonorCompanyName('');
    setDonorEmail('');
    setDonorPhone('');
    setDonorTaxAddress('');
    setDonorTaxCity('');
    setDonorTaxPostalCode('');
    setDonorTaxState('QC');
  };

  const resetCampaignForm = () => {
    setCampCode('');
    setCampName('');
    setCampTargetAmount(50000);
    setCampDescription('');
  };

  const handleOpenReceiptPreview = async (receiptId: string) => {
    try {
      const res = await fetch(`/api/v1/tax-receipts/${receiptId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedReceipt(data);
        setShowReceiptPreviewModal(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateDonation = (e: React.FormEvent) => {
    e.preventDefault();
    createDonationMutation.mutate({
      donorId: donDonorId,
      campaignId: donCampaignId || undefined,
      grossAmount: Number(donGrossAmount),
      advantageAmount: Number(donAdvantageAmount || 0),
      paymentMethod: donPaymentMethod,
      paymentReference: donPaymentRef || undefined,
      recurrence: donRecurrence,
      donationDate: new Date(donDate).toISOString(),
      isTaxReceiptEligible: donIsEligible,
      generateReceiptNow: donGenerateReceipt,
      authorizedSignatoryName: donSignatoryName,
      locationIssued: donLocationIssued,
      notes: donNotes || undefined,
    });
  };

  const handleCreateDonor = (e: React.FormEvent) => {
    e.preventDefault();
    createDonorMutation.mutate({
      type: donorType,
      firstName: donorFirstName || undefined,
      lastName: donorLastName || undefined,
      companyName: donorCompanyName || undefined,
      email: donorEmail || undefined,
      phone: donorPhone || undefined,
      taxAddress: donorTaxAddress || undefined,
      taxCity: donorTaxCity || undefined,
      taxStateProvince: donorTaxState,
      taxPostalCode: donorTaxPostalCode || undefined,
      taxCountry: 'Canada',
    });
  };

  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    createCampaignMutation.mutate({
      code: campCode,
      name: campName,
      targetAmount: Number(campTargetAmount),
      description: campDescription || undefined,
      status: 'active',
    });
  };

  const handleIssueConsolidated = (e: React.FormEvent) => {
    e.preventDefault();
    issueConsolidatedMutation.mutate({
      donorId: consDonorId,
      taxYear: Number(consYear),
      authorizedSignatoryName: consSignatoryName,
      locationIssued: consLocation,
    });
  };

  const handleCancelReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancellingReceiptId) return;
    cancelReceiptMutation.mutate({
      receiptId: cancellingReceiptId,
      payload: {
        reason: cancelReason,
        replaceWithNew: cancelReplaceWithNew,
      },
    });
  };

  // Filtered Donations
  const filteredDonations = donations.filter((d) => {
    const matchesSearch =
      d.donationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.donorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.campaignName && d.campaignName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = filterStatus === 'ALL' || d.status === filterStatus;
    const matchesMethod = filterPaymentMethod === 'ALL' || d.paymentMethod === filterPaymentMethod;
    const matchesReceipt =
      filterReceiptStatus === 'ALL' ||
      (filterReceiptStatus === 'receipted' && !!d.taxReceiptId) ||
      (filterReceiptStatus === 'pending' && !d.taxReceiptId && d.isTaxReceiptEligible) ||
      (filterReceiptStatus === 'ineligible' && !d.isTaxReceiptEligible);

    return matchesSearch && matchesStatus && matchesMethod && matchesReceipt;
  });

  const getPaymentMethodBadge = (method: string) => {
    const map: Record<string, { label: string; bg: string }> = {
      interac: { label: 'Virement Interac', bg: 'bg-amber-50 text-amber-800 border-amber-200' },
      credit_card: { label: 'Carte de Crédit (Stripe)', bg: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
      cheque: { label: 'Chèque Bancaire', bg: 'bg-slate-100 text-slate-700 border-slate-200' },
      cash: { label: 'Espèces', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
      bank_transfer: { label: 'Prélèvement / TEF', bg: 'bg-blue-50 text-blue-800 border-blue-200' },
      other: { label: 'Autre', bg: 'bg-slate-100 text-slate-700 border-slate-200' },
    };
    const item = map[method] || { label: method, bg: 'bg-slate-100 text-slate-700' };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${item.bg}`}>
        {item.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-16">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Header Title & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/60 rounded-xl text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
                <HeartHandshake className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                  Dons & Reçus Fiscaux ARC
                </h1>
                <p className="text-sm text-slate-500">
                  Collecte de fonds philanthropiques, gestion des donateurs et émission certifiée des reçus d'impôt ARC (CRA).
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              onClick={() => {
                resetDonorForm();
                setShowDonorModal(true);
              }}
              className="flex items-center gap-1.5 text-xs sm:text-sm"
            >
              <Users className="h-4 w-4" />
              Nouveau Donateur
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                resetCampaignForm();
                setShowCampaignModal(true);
              }}
              className="flex items-center gap-1.5 text-xs sm:text-sm"
            >
              <Megaphone className="h-4 w-4" />
              Nouvelle Campagne
            </Button>
            <Button
              onClick={() => {
                if (donors.length === 0) {
                  setShowDonorModal(true);
                } else {
                  resetDonationForm();
                  setShowDonationModal(true);
                }
              }}
              className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Enregistrer un Don
            </Button>
          </div>
        </div>

        {/* KPI Metrics Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Dons Encaissés</p>
              <div className="p-2 bg-emerald-50 dark:bg-emerald-950/50 rounded-lg text-emerald-600">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
              {dashboardData?.totalGross ? `${dashboardData.totalGross.toLocaleString('fr-CA')} $` : '0 $'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {dashboardData?.receivedCount || 0} don(s) perçu(s)
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Montant Admissible ARC</p>
              <div className="p-2 bg-rose-50 dark:bg-rose-950/50 rounded-lg text-rose-600">
                <ShieldCheck className="h-5 w-5" />
              </div>
            </div>
            <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-2">
              {dashboardData?.totalEligible ? `${dashboardData.totalEligible.toLocaleString('fr-CA')} $` : '0 $'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Déductible d'impôt au Canada
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Fichier Donateurs</p>
              <div className="p-2 bg-blue-50 dark:bg-blue-950/50 rounded-lg text-blue-600">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
              {dashboardData?.totalDonors || donors.length}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Don moyen : {dashboardData?.averageDonation ? `${dashboardData.averageDonation.toLocaleString('fr-CA')} $` : '0 $'}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Reçus Fiscaux Émis</p>
              <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 rounded-lg text-indigo-600">
                <Receipt className="h-5 w-5" />
              </div>
            </div>
            <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-2">
              {taxReceipts.length}
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
              {dashboardData?.pendingReceiptCount || 0} don(s) en attente de reçu
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-700 mb-6 space-x-2 sm:space-x-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab('donations')}
            className={`pb-3 px-2 font-medium text-sm border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
              activeTab === 'donations'
                ? 'border-rose-600 text-rose-600 dark:border-rose-400 dark:text-rose-400 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 hover:border-slate-300'
            }`}
          >
            <DollarSign className="h-4 w-4" />
            Journal des Dons ({donations.length})
          </button>

          <button
            onClick={() => setActiveTab('donors')}
            className={`pb-3 px-2 font-medium text-sm border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
              activeTab === 'donors'
                ? 'border-rose-600 text-rose-600 dark:border-rose-400 dark:text-rose-400 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 hover:border-slate-300'
            }`}
          >
            <Users className="h-4 w-4" />
            Donateurs ({donors.length})
          </button>

          <button
            onClick={() => setActiveTab('campaigns')}
            className={`pb-3 px-2 font-medium text-sm border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
              activeTab === 'campaigns'
                ? 'border-rose-600 text-rose-600 dark:border-rose-400 dark:text-rose-400 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 hover:border-slate-300'
            }`}
          >
            <Megaphone className="h-4 w-4" />
            Campagnes de Levée ({campaigns.length})
          </button>

          <button
            onClick={() => setActiveTab('receipts')}
            className={`pb-3 px-2 font-medium text-sm border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
              activeTab === 'receipts'
                ? 'border-rose-600 text-rose-600 dark:border-rose-400 dark:text-rose-400 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 hover:border-slate-300'
            }`}
          >
            <Receipt className="h-4 w-4" />
            Reçus Fiscaux ARC ({taxReceipts.length})
          </button>
        </div>

        {/* TAB 1: JOURNAL DES DONS */}
        {activeTab === 'donations' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-wrap gap-3 items-center justify-between shadow-sm">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher par n° de don, donateur, campagne..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex flex-wrap gap-2 items-center">
                <select
                  value={filterPaymentMethod}
                  onChange={(e) => setFilterPaymentMethod(e.target.value)}
                  className="h-9 px-3 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300"
                >
                  <option value="ALL">Tous les modes de paiement</option>
                  <option value="interac">Virement Interac</option>
                  <option value="credit_card">Carte de crédit (Stripe)</option>
                  <option value="cheque">Chèque</option>
                  <option value="cash">Espèces</option>
                  <option value="bank_transfer">Prélèvement bancaire</option>
                </select>

                <select
                  value={filterReceiptStatus}
                  onChange={(e) => setFilterReceiptStatus(e.target.value)}
                  className="h-9 px-3 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300"
                >
                  <option value="ALL">Tous les statuts de reçu</option>
                  <option value="receipted">Reçu émis</option>
                  <option value="pending">En attente de reçu</option>
                  <option value="ineligible">Non admissible</option>
                </select>
              </div>
            </div>

            {/* Donations Table */}
            {filteredDonations.length > 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-750 border-b border-slate-200 dark:border-slate-700 text-xs font-semibold uppercase text-slate-500">
                        <th className="py-3 px-4">N° Don</th>
                        <th className="py-3 px-4">Donateur</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Montant Brut</th>
                        <th className="py-3 px-4">Admissible ARC</th>
                        <th className="py-3 px-4">Paiement</th>
                        <th className="py-3 px-4">Campagne / Projet</th>
                        <th className="py-3 px-4">Reçu Fiscal</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {filteredDonations.map((don) => (
                        <tr key={don.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-750/50 transition">
                          <td className="py-3 px-4 font-mono font-semibold text-rose-600 dark:text-rose-400">
                            {don.donationNumber}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-medium text-slate-900 dark:text-white">{don.donorName}</div>
                            {don.donorEmail && <div className="text-xs text-slate-400">{don.donorEmail}</div>}
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                            {new Date(don.donationDate).toLocaleDateString('fr-CA')}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                            {don.grossAmount.toLocaleString('fr-CA')} $
                          </td>
                          <td className="py-3 px-4 font-semibold text-emerald-600 dark:text-emerald-400">
                            {don.eligibleAmount.toLocaleString('fr-CA')} $
                          </td>
                          <td className="py-3 px-4">{getPaymentMethodBadge(don.paymentMethod)}</td>
                          <td className="py-3 px-4 text-xs text-slate-500">
                            {don.campaignName || don.projectName || 'Fonds général'}
                          </td>
                          <td className="py-3 px-4">
                            {don.taxReceiptId ? (
                              <button
                                onClick={() => handleOpenReceiptPreview(don.taxReceiptId!)}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition"
                              >
                                <Receipt className="h-3 w-3 mr-1" />
                                Voir le Reçu
                              </button>
                            ) : don.isTaxReceiptEligible ? (
                              <button
                                onClick={() =>
                                  issueSingleReceiptMutation.mutate({
                                    donationId: don.id,
                                    signatory: 'Direction Générale',
                                    location: 'Montréal, QC',
                                  })
                                }
                                disabled={issueSingleReceiptMutation.isPending}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition"
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Émettre reçu
                              </button>
                            ) : (
                              <span className="text-xs text-slate-400 italic">Non admissible</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {/* Action dropdown or quick view */}
                            <button
                              onClick={() => {
                                if (confirm(`Supprimer le don ${don.donationNumber} ?`)) {
                                  fetch(`/api/v1/donations/${don.id}`, { method: 'DELETE' }).then(() => {
                                    queryClient.invalidateQueries({ queryKey: ['donations'] });
                                    queryClient.invalidateQueries({ queryKey: ['donationsDashboard'] });
                                  });
                                }
                              }}
                              className="text-xs text-rose-500 hover:text-rose-700 transition"
                            >
                              Supprimer
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-800 rounded-xl p-12 text-center border border-dashed border-slate-300 dark:border-slate-700">
                <HeartHandshake className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                <h4 className="font-semibold text-slate-900 dark:text-white mb-1">Aucun don enregistré</h4>
                <p className="text-sm text-slate-500 mb-4 max-w-md mx-auto">
                  Enregistrez votre première contribution philanthropique pour démarrer la gestion des dons et reçus fiscaux.
                </p>
                <Button
                  onClick={() => {
                    if (donors.length === 0) setShowDonorModal(true);
                    else {
                      resetDonationForm();
                      setShowDonationModal(true);
                    }
                  }}
                  className="bg-rose-600 hover:bg-rose-700 text-white"
                >
                  + Enregistrer un Don
                </Button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: DONATEURS */}
        {activeTab === 'donors' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Répertoire des Donateurs</h3>
                <p className="text-sm text-slate-500">
                  Particuliers, mécènes et entreprises partenaires avec historique complet des dons.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowConsolidatedModal(true)}
                  className="flex items-center gap-1.5 text-xs sm:text-sm"
                >
                  <Receipt className="h-4 w-4" />
                  Reçu Consolidé Annuel
                </Button>
                <Button
                  onClick={() => {
                    resetDonorForm();
                    setShowDonorModal(true);
                  }}
                  className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm"
                >
                  <Plus className="h-4 w-4" />
                  Ajouter un Donateur
                </Button>
              </div>
            </div>

            {donors.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {donors.map((d) => (
                  <div
                    key={d.id}
                    className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm hover:border-rose-300 transition space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          {d.type === 'organization' ? 'Entreprise / OBNL' : d.type === 'anonymous' ? 'Anonyme' : 'Particulier'}
                        </span>
                        <h4 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                          {d.displayName}
                        </h4>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                          {d.totalGiven.toLocaleString('fr-CA')} $
                        </p>
                        <p className="text-[11px] text-slate-400">{d.donationCount} don(s)</p>
                      </div>
                    </div>

                    <div className="text-xs text-slate-500 space-y-1 pt-2 border-t border-slate-100 dark:border-slate-700">
                      {d.email && <p className="truncate">📧 {d.email}</p>}
                      {d.phone && <p>📞 {d.phone}</p>}
                      {d.taxAddress && (
                        <p className="truncate">
                          📍 {d.taxAddress}, {d.taxCity} ({d.taxPostalCode})
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-800 rounded-xl p-12 text-center border border-dashed border-slate-300 dark:border-slate-700">
                <Users className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                <h4 className="font-semibold text-slate-900 dark:text-white mb-1">Aucun donateur créé</h4>
                <p className="text-sm text-slate-500 mb-4 max-w-md mx-auto">
                  Créez la fiche d'un donateur particulier ou organisationnel avec son adresse fiscale pour l'ARC.
                </p>
                <Button onClick={() => setShowDonorModal(true)}>+ Ajouter un Donateur</Button>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: CAMPAGNES */}
        {activeTab === 'campaigns' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Campagnes de Financement Philanthropique</h3>
                <p className="text-sm text-slate-500">
                  Objectifs de collecte, campagnes de fin d'année et fonds réservés.
                </p>
              </div>
              <Button
                onClick={() => {
                  resetCampaignForm();
                  setShowCampaignModal(true);
                }}
                className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm"
              >
                <Plus className="h-4 w-4" />
                Nouvelle Campagne
              </Button>
            </div>

            {campaigns.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {campaigns.map((camp) => (
                  <div
                    key={camp.id}
                    className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                          {camp.code}
                        </span>
                        <h4 className="text-lg font-bold text-slate-900 dark:text-white mt-1.5">
                          {camp.name}
                        </h4>
                      </div>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                        {camp.status === 'active' ? 'En cours' : camp.status}
                      </span>
                    </div>

                    {camp.description && (
                      <p className="text-xs text-slate-500 line-clamp-2">{camp.description}</p>
                    )}

                    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Collecté :</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {camp.collectedAmount.toLocaleString('fr-CA')} $ /{' '}
                          {camp.targetAmount ? `${camp.targetAmount.toLocaleString('fr-CA')} $` : 'Non fixé'}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-rose-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${camp.progressPct}%` }}
                        />
                      </div>
                      <p className="text-right text-xs font-semibold text-rose-600">{camp.progressPct}% atteint</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-800 rounded-xl p-12 text-center border border-dashed border-slate-300 dark:border-slate-700">
                <Megaphone className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                <h4 className="font-semibold text-slate-900 dark:text-white mb-1">Aucune campagne active</h4>
                <p className="text-sm text-slate-500 mb-4 max-w-md mx-auto">
                  Définissez des campagnes ou appels de fonds pour suivre vos objectifs financiers.
                </p>
                <Button onClick={() => setShowCampaignModal(true)}>+ Créer une Campagne</Button>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: REÇUS FISCAUX ARC */}
        {activeTab === 'receipts' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Registre des Reçus Fiscaux Officiels ARC</h3>
                <p className="text-sm text-slate-500">
                  Numérotation séquentielle certifiée conforme aux exigences de l'Agence du revenu du Canada.
                </p>
              </div>
              <Button
                onClick={() => setShowConsolidatedModal(true)}
                className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm"
              >
                <Receipt className="h-4 w-4" />
                Générer un Reçu Consolidé Annuel
              </Button>
            </div>

            {taxReceipts.length > 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-750 border-b border-slate-200 dark:border-slate-700 text-xs font-semibold uppercase text-slate-500">
                        <th className="py-3 px-4">N° Reçu Officiel</th>
                        <th className="py-3 px-4">Donateur</th>
                        <th className="py-3 px-4">Année Fiscale</th>
                        <th className="py-3 px-4">Date Émission</th>
                        <th className="py-3 px-4">Montant Reçu</th>
                        <th className="py-3 px-4">Montant Admissible</th>
                        <th className="py-3 px-4">Type</th>
                        <th className="py-3 px-4">Statut</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {taxReceipts.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-750/50 transition">
                          <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                            {r.receiptNumber}
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                            {r.donorName}
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                            {r.taxYear}
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                            {new Date(r.issueDate).toLocaleDateString('fr-CA')}
                          </td>
                          <td className="py-3 px-4 text-slate-900 dark:text-white">
                            {r.totalReceivedAmount.toLocaleString('fr-CA')} $
                          </td>
                          <td className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                            {r.totalEligibleAmount.toLocaleString('fr-CA')} $
                          </td>
                          <td className="py-3 px-4 text-xs">
                            {r.type === 'annual_consolidated' ? (
                              <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-semibold">
                                Consolidé Annuel
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                                Don Unique
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {r.status === 'issued' ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">
                                <CheckCircle2 className="h-3 w-3 mr-1" /> Émis / Valide
                              </span>
                            ) : r.status === 'cancelled' ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-rose-100 text-rose-800">
                                <Ban className="h-3 w-3 mr-1" /> Annulé
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800">
                                Remplacé
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right space-x-2">
                            <button
                              onClick={() => handleOpenReceiptPreview(r.id)}
                              className="text-indigo-600 hover:text-indigo-800 font-medium text-xs transition"
                            >
                              Aperçu Officiel
                            </button>
                            {r.status === 'issued' && (
                              <button
                                onClick={() => {
                                  setCancellingReceiptId(r.id);
                                  setShowCancelModal(true);
                                }}
                                className="text-rose-500 hover:text-rose-700 text-xs transition ml-2"
                              >
                                Annuler
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-800 rounded-xl p-12 text-center border border-dashed border-slate-300 dark:border-slate-700">
                <Receipt className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                <h4 className="font-semibold text-slate-900 dark:text-white mb-1">Aucun reçu émis</h4>
                <p className="text-sm text-slate-500 mb-4 max-w-md mx-auto">
                  Les reçus fiscaux certifiés pour l'Agence du revenu du Canada apparaîtront ici.
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODAL NOUVEAU DON */}
      {showDonationModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 my-8">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <HeartHandshake className="h-6 w-6 text-rose-600" />
              Enregistrer une Contribution Philanthropique
            </h3>
            <form onSubmit={handleCreateDonation} className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Donateur *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowDonorModal(true)}
                    className="text-xs text-rose-600 hover:underline"
                  >
                    + Créer un donateur
                  </button>
                </div>
                <select
                  value={donDonorId}
                  onChange={(e) => setDonDonorId(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                  required
                >
                  <option value="">Sélectionner un donateur...</option>
                  {donors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.displayName} {d.email ? `(${d.email})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Montant total reçu ($ CAD) *
                  </label>
                  <Input
                    type="number"
                    value={donGrossAmount}
                    onChange={(e: any) => setDonGrossAmount(Number(e.target.value))}
                    required
                    min={1}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Valeur des avantages reçus (FMV) $
                  </label>
                  <Input
                    type="number"
                    value={donAdvantageAmount}
                    onChange={(e: any) => setDonAdvantageAmount(Number(e.target.value))}
                    min={0}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Mode de versement *
                  </label>
                  <select
                    value={donPaymentMethod}
                    onChange={(e: any) => setDonPaymentMethod(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                  >
                    <option value="interac">Virement Interac</option>
                    <option value="credit_card">Carte de crédit (Stripe)</option>
                    <option value="cheque">Chèque bancaire</option>
                    <option value="cash">Espèces</option>
                    <option value="bank_transfer">Prélèvement bancaire (TEF)</option>
                    <option value="other">Autre</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Date du don *
                  </label>
                  <Input
                    type="date"
                    value={donDate}
                    onChange={(e: any) => setDonDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Campagne associée (optionnelle)
                  </label>
                  <select
                    value={donCampaignId}
                    onChange={(e) => setDonCampaignId(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                  >
                    <option value="">Fonds général / Sans campagne</option>
                    {campaigns.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Référence de transaction
                  </label>
                  <Input
                    value={donPaymentRef}
                    onChange={(e: any) => setDonPaymentRef(e.target.value)}
                    placeholder="ex: CHQ-8842 ou INT-9021"
                  />
                </div>
              </div>

              {/* Tax receipt toggle */}
              <div className="p-4 bg-slate-50 dark:bg-slate-750 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    Émettre le reçu fiscal officiel ARC immédiatement
                  </label>
                  <input
                    type="checkbox"
                    checked={donGenerateReceipt}
                    onChange={(e) => setDonGenerateReceipt(e.target.checked)}
                    className="h-4 w-4 text-rose-600 rounded"
                  />
                </div>

                {donGenerateReceipt && (
                  <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">Signataire officiel</label>
                      <Input
                        value={donSignatoryName}
                        onChange={(e: any) => setDonSignatoryName(e.target.value)}
                        required={donGenerateReceipt}
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">Lieu d'émission</label>
                      <Input
                        value={donLocationIssued}
                        onChange={(e: any) => setDonLocationIssued(e.target.value)}
                        required={donGenerateReceipt}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <Button variant="outline" type="button" onClick={() => setShowDonationModal(false)}>
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={createDonationMutation.isPending}
                  className="bg-rose-600 hover:bg-rose-700 text-white"
                >
                  Enregistrer la contribution
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL NOUVEAU DONATEUR */}
      {showDonorModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 my-8">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
              Nouveau Donateur (Fiche Fiscale ARC)
            </h3>
            <form onSubmit={handleCreateDonor} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Type de donateur *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setDonorType('individual')}
                    className={`py-2 text-xs font-semibold rounded-lg border text-center transition ${
                      donorType === 'individual'
                        ? 'bg-rose-50 border-rose-500 text-rose-700'
                        : 'border-slate-200 text-slate-700'
                    }`}
                  >
                    Particulier
                  </button>
                  <button
                    type="button"
                    onClick={() => setDonorType('organization')}
                    className={`py-2 text-xs font-semibold rounded-lg border text-center transition ${
                      donorType === 'organization'
                        ? 'bg-rose-50 border-rose-500 text-rose-700'
                        : 'border-slate-200 text-slate-700'
                    }`}
                  >
                    Entreprise
                  </button>
                  <button
                    type="button"
                    onClick={() => setDonorType('anonymous')}
                    className={`py-2 text-xs font-semibold rounded-lg border text-center transition ${
                      donorType === 'anonymous'
                        ? 'bg-rose-50 border-rose-500 text-rose-700'
                        : 'border-slate-200 text-slate-700'
                    }`}
                  >
                    Anonyme
                  </button>
                </div>
              </div>

              {donorType === 'individual' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Prénom *
                    </label>
                    <Input
                      value={donorFirstName}
                      onChange={(e: any) => setDonorFirstName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Nom de famille *
                    </label>
                    <Input
                      value={donorLastName}
                      onChange={(e: any) => setDonorLastName(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}

              {donorType === 'organization' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Raison sociale de l'entreprise *
                  </label>
                  <Input
                    value={donorCompanyName}
                    onChange={(e: any) => setDonorCompanyName(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Courriel
                  </label>
                  <Input
                    type="email"
                    value={donorEmail}
                    onChange={(e: any) => setDonorEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Téléphone
                  </label>
                  <Input
                    value={donorPhone}
                    onChange={(e: any) => setDonorPhone(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Adresse fiscale (Rue, App) - Requis pour reçu ARC
                </label>
                <Input
                  value={donorTaxAddress}
                  onChange={(e: any) => setDonorTaxAddress(e.target.value)}
                  placeholder="ex: 1234 Rue Sherbrooke Est, Apt 4"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Ville
                  </label>
                  <Input
                    value={donorTaxCity}
                    onChange={(e: any) => setDonorTaxCity(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Province
                  </label>
                  <Input
                    value={donorTaxState}
                    onChange={(e: any) => setDonorTaxState(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Code postal
                  </label>
                  <Input
                    value={donorTaxPostalCode}
                    onChange={(e: any) => setDonorTaxPostalCode(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <Button variant="outline" type="button" onClick={() => setShowDonorModal(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={createDonorMutation.isPending}>
                  Créer le donateur
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL NOUVELLE CAMPAGNE */}
      {showCampaignModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
              Nouvelle Campagne de Financement
            </h3>
            <form onSubmit={handleCreateCampaign} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Code *
                  </label>
                  <Input
                    value={campCode}
                    onChange={(e: any) => setCampCode(e.target.value)}
                    placeholder="CAMP-2026"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nom de la campagne *
                  </label>
                  <Input
                    value={campName}
                    onChange={(e: any) => setCampName(e.target.value)}
                    placeholder="ex: Campagne Annuelle 2026"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Objectif financier ($ CAD)
                </label>
                <Input
                  type="number"
                  value={campTargetAmount}
                  onChange={(e: any) => setCampTargetAmount(Number(e.target.value))}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={campDescription}
                  onChange={(e) => setCampDescription(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <Button variant="outline" type="button" onClick={() => setShowCampaignModal(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={createCampaignMutation.isPending}>
                  Créer la campagne
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL REÇU CONSOLIDÉ ANNUEL */}
      {showConsolidatedModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Receipt className="h-6 w-6 text-purple-600" />
              Émission Reçu Consolidé Annuel (ARC)
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Regroupe l'ensemble des dons perçus pour un donateur au cours de l'année civile dans un reçu fiscal officiel unique.
            </p>
            <form onSubmit={handleIssueConsolidated} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Donateur *
                </label>
                <select
                  value={consDonorId}
                  onChange={(e) => setConsDonorId(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                  required
                >
                  <option value="">Sélectionner un donateur...</option>
                  {donors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.displayName} ({d.totalGiven.toLocaleString('fr-CA')} $ total)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Année Fiscale *
                  </label>
                  <Input
                    type="number"
                    value={consYear}
                    onChange={(e: any) => setConsYear(Number(e.target.value))}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Lieu d'émission *
                  </label>
                  <Input
                    value={consLocation}
                    onChange={(e: any) => setConsLocation(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Signataire officiel autorisé *
                </label>
                <Input
                  value={consSignatoryName}
                  onChange={(e: any) => setConsSignatoryName(e.target.value)}
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <Button variant="outline" type="button" onClick={() => setShowConsolidatedModal(false)}>
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={issueConsolidatedMutation.isPending}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  Générer le reçu consolidé
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ANNULATION DE REÇU */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700">
            <h3 className="text-xl font-bold text-rose-600 mb-3 flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-rose-600" />
              Annulation de Reçu Fiscal ARC
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              L'ARC exige une traçabilité stricte en cas d'annulation ou de remplacement d'un reçu officiel.
            </p>
            <form onSubmit={handleCancelReceipt} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Motif officiel de l'annulation *
                </label>
                <textarea
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="ex: Erreur de frappe sur l'adresse du donateur ou montant..."
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-sm"
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="replaceCheck"
                  checked={cancelReplaceWithNew}
                  onChange={(e) => setCancelReplaceWithNew(e.target.checked)}
                  className="h-4 w-4 text-rose-600 rounded"
                />
                <label htmlFor="replaceCheck" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Émettre automatiquement un nouveau reçu de remplacement
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <Button variant="outline" type="button" onClick={() => setShowCancelModal(false)}>
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={cancelReceiptMutation.isPending}
                  className="bg-rose-600 hover:bg-rose-700 text-white"
                >
                  Confirmer l'annulation
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL APERÇU OFFICIEL CERTIFICAT REÇU FISCAL ARC (CRA PRINT FORMAT) */}
      {showReceiptPreviewModal && selectedReceipt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white text-slate-900 rounded-2xl max-w-3xl w-full p-8 shadow-2xl border border-slate-300 my-8 print:p-0 print:border-none">
            {/* Action Bar */}
            <div className="flex justify-between items-center pb-4 mb-6 border-b border-slate-200 print:hidden">
              <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5" /> Reçu Officiel Certifié ARC
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => window.print()} className="flex items-center gap-1">
                  <Printer className="h-4 w-4" />
                  Imprimer
                </Button>
                <Button size="sm" onClick={() => setShowReceiptPreviewModal(false)}>
                  Fermer
                </Button>
              </div>
            </div>

            {/* Official CRA Receipt Layout */}
            <div className="border-2 border-slate-800 p-6 rounded-lg space-y-6">
              {/* Header Box */}
              <div className="flex justify-between items-start pb-4 border-b-2 border-slate-800">
                <div>
                  <h2 className="text-xl font-black uppercase tracking-wide">
                    {selectedReceipt.organization?.name || 'Organisme de Bienfaisance'}
                  </h2>
                  <p className="text-xs text-slate-600 mt-1 max-w-sm">
                    {selectedReceipt.organization?.address || '1000 Rue Sainte-Catherine, Montréal, QC'}
                  </p>
                  <p className="text-xs font-mono font-bold mt-2 text-indigo-900">
                    N° d'enregistrement ARC : {selectedReceipt.charityRegistrationNumber}
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-block bg-slate-900 text-white font-mono text-xs px-3 py-1 font-bold rounded">
                    REÇU OFFICIEL DE DON
                  </span>
                  <p className="text-sm font-mono font-black mt-2 text-rose-600">
                    {selectedReceipt.receiptNumber}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Lieu de délivrance : {selectedReceipt.locationIssued}
                  </p>
                </div>
              </div>

              {/* Donor & Issuance Info */}
              <div className="grid grid-cols-2 gap-6 text-xs">
                <div className="p-3 bg-slate-50 rounded border border-slate-200">
                  <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px] mb-1">
                    Donateur (Nom & Adresse Fiscale) :
                  </p>
                  <p className="font-bold text-sm text-slate-900">
                    {selectedReceipt.donorSnapshot?.donorName || selectedReceipt.donor?.displayName}
                  </p>
                  <p className="text-slate-700 mt-0.5">
                    {selectedReceipt.donorSnapshot?.taxAddress || selectedReceipt.donor?.taxAddress || 'Adresse sur dossier'}
                  </p>
                  <p className="text-slate-700">
                    {selectedReceipt.donorSnapshot?.taxCity || selectedReceipt.donor?.taxCity}{' '}
                    {selectedReceipt.donorSnapshot?.taxStateProvince || selectedReceipt.donor?.taxStateProvince}{' '}
                    {selectedReceipt.donorSnapshot?.taxPostalCode || selectedReceipt.donor?.taxPostalCode}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Date d'émission du reçu :</span>
                    <span className="font-bold">{new Date(selectedReceipt.issueDate).toLocaleDateString('fr-CA')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Année fiscale :</span>
                    <span className="font-bold">{selectedReceipt.taxYear}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Nature du reçu :</span>
                    <span className="font-bold">
                      {selectedReceipt.type === 'annual_consolidated' ? 'Consolidé Annuel' : 'Don Unique'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Financial Box */}
              <div className="border-2 border-dashed border-slate-300 p-4 rounded-lg bg-slate-50">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-[11px] font-semibold text-slate-500 uppercase">Somme Reçue</p>
                    <p className="text-xl font-extrabold text-slate-900 mt-1">
                      {selectedReceipt.totalReceivedAmount.toLocaleString('fr-CA')} $ CAD
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-slate-500 uppercase">Valeur Avantages (FMV)</p>
                    <p className="text-xl font-extrabold text-slate-600 mt-1">
                      {selectedReceipt.totalAdvantageAmount.toLocaleString('fr-CA')} $ CAD
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-rose-600 uppercase">Montant Admissible</p>
                    <p className="text-2xl font-black text-emerald-600 mt-1">
                      {selectedReceipt.totalEligibleAmount.toLocaleString('fr-CA')} $ CAD
                    </p>
                  </div>
                </div>
              </div>

              {/* Legal Notice & Signature */}
              <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-200 items-end text-xs">
                <div className="text-[10px] text-slate-500 leading-tight">
                  <p className="font-bold uppercase mb-1">Avis de l'Agence du revenu du Canada :</p>
                  <p>
                    Ce reçu officiel est délivré aux fins de l'impôt sur le revenu conformément à la Loi de l'impôt sur le revenu du Canada.
                    Pour vérifier la validité de cet enregistrement, consultez canada.ca/bienfaisance.
                  </p>
                </div>

                <div className="text-right">
                  <div className="inline-block border-b border-slate-800 pb-1 w-48 text-center font-serif italic text-sm text-slate-800">
                    {selectedReceipt.authorizedSignatoryName}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 uppercase font-semibold">
                    Signature du signataire autorisé
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
