import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Input, Badge } from '@orgdashio/ui';
import {
  Landmark,
  ArrowLeft,
  Calendar,
  DollarSign,
  Building2,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Check,
  Percent,
  Layers,
  Sparkles,
  Award,
  Save,
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';

type DetailTab = 'overview' | 'installments' | 'deliverables' | 'notes';

interface GrantDetail {
  id: string;
  code: string;
  title: string;
  funderName: string;
  funderType: 'federal' | 'provincial' | 'municipal' | 'foundation' | 'corporate' | 'other';
  programName?: string | null;
  status: 'prospect' | 'drafting' | 'submitted' | 'approved' | 'rejected' | 'closed';
  requestedAmount: number;
  awardedAmount: number;
  submissionDeadline?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  notes?: string | null;
  contractReference?: string | null;
  project?: {
    id: string;
    name: string;
    code: string;
  } | null;
  installments?: Array<{
    id: string;
    installmentNumber: number;
    title: string;
    amount: number;
    scheduledDate: string;
    receivedDate?: string | null;
    status: 'scheduled' | 'invoiced' | 'received' | 'delayed';
    conditions?: string | null;
    paymentReference?: string | null;
  }>;
  deliverables?: Array<{
    id: string;
    title: string;
    deliverableType: 'narrative_report' | 'financial_report' | 'evaluation' | 'audit' | 'other';
    dueDate: string;
    submissionDate?: string | null;
    status: 'pending' | 'drafting' | 'submitted' | 'approved' | 'revision_required';
    description?: string | null;
    funderRecipient?: string | null;
  }>;
}

export function GrantDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<DetailTab>('overview');

  // Edit Grant modal state
  const [showEditGrantModal, setShowEditGrantModal] = useState(false);
  const [editFunderId, setEditFunderId] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editFunderName, setEditFunderName] = useState('');
  const [editFunderType, setEditFunderType] = useState<
    'federal' | 'provincial' | 'municipal' | 'foundation' | 'corporate' | 'other'
  >('foundation');
  const [editProgramName, setEditProgramName] = useState('');
  const [editStatus, setEditStatus] = useState<
    'prospect' | 'drafting' | 'submitted' | 'approved' | 'rejected' | 'closed'
  >('drafting');
  const [editRequestedAmount, setEditRequestedAmount] = useState(0);
  const [editAwardedAmount, setEditAwardedAmount] = useState(0);
  const [editSubmissionDeadline, setEditSubmissionDeadline] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editContractRef, setEditContractRef] = useState('');

  // Installment modal state
  const [showInstallmentModal, setShowInstallmentModal] = useState(false);
  const [editingInstallmentId, setEditingInstallmentId] = useState<string | null>(null);
  const [instNumber, setInstNumber] = useState(1);
  const [instTitle, setInstTitle] = useState('');
  const [instAmount, setInstAmount] = useState(10000);
  const [instScheduledDate, setInstScheduledDate] = useState('');
  const [instReceivedDate, setInstReceivedDate] = useState('');
  const [instStatus, setInstStatus] = useState<'scheduled' | 'invoiced' | 'received' | 'delayed'>('scheduled');
  const [instConditions, setInstConditions] = useState('');
  const [instPaymentRef, setInstPaymentRef] = useState('');

  // Deliverable modal state
  const [showDeliverableModal, setShowDeliverableModal] = useState(false);
  const [editingDeliverableId, setEditingDeliverableId] = useState<string | null>(null);
  const [delTitle, setDelTitle] = useState('');
  const [delType, setDelType] = useState<'narrative_report' | 'financial_report' | 'evaluation' | 'audit' | 'other'>('narrative_report');
  const [delDueDate, setDelDueDate] = useState('');
  const [delSubmissionDate, setDelSubmissionDate] = useState('');
  const [delStatus, setDelStatus] = useState<'pending' | 'drafting' | 'submitted' | 'approved' | 'revision_required'>('pending');
  const [delDescription, setDelDescription] = useState('');
  const [delRecipient, setDelRecipient] = useState('');

  // Notes state
  const [notesContent, setNotesContent] = useState('');
  const [notesDirty, setNotesDirty] = useState(false);

  // Fetch Grant Detail
  const { data: grant, isLoading, error: fetchError } = useQuery<GrantDetail>({
    queryKey: ['grant', id],
    queryFn: async () => {
      const res = await fetch(`/api/v1/grants/${id}`);
      if (!res.ok) {
        throw new Error('Erreur lors du chargement de la subvention.');
      }
      return res.json();
    },
    enabled: !!id,
  });

  // Fetch Funders Directory
  const { data: funders = [] } = useQuery({
    queryKey: ['funders'],
    queryFn: async () => {
      const res = await fetch('/api/v1/grants/funders');
      if (!res.ok) return [];
      return res.json();
    },
  });

  React.useEffect(() => {
    if (grant?.notes && !notesDirty) {
      setNotesContent(grant.notes);
    }
  }, [grant?.notes, notesDirty]);

  // Update Grant Mutation
  const updateGrantMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch(`/api/v1/grants/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Erreur lors de la mise à jour');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grant', id] });
      queryClient.invalidateQueries({ queryKey: ['grants'] });
      setShowEditGrantModal(false);
      setNotesDirty(false);
    },
  });

  // Delete Grant Mutation
  const deleteGrantMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/v1/grants/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Erreur lors de la suppression');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grants'] });
      navigate('/grants');
    },
  });

  // Installment Mutations
  const createInstallmentMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch(`/api/v1/grants/${id}/installments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Erreur lors de la création de la tranche');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grant', id] });
      setShowInstallmentModal(false);
      resetInstallmentForm();
    },
  });

  const updateInstallmentMutation = useMutation({
    mutationFn: async ({ instId, payload }: { instId: string; payload: any }) => {
      const res = await fetch(`/api/v1/grants/${id}/installments/${instId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Erreur lors de la modification de la tranche');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grant', id] });
      setShowInstallmentModal(false);
      resetInstallmentForm();
    },
  });

  const deleteInstallmentMutation = useMutation({
    mutationFn: async (instId: string) => {
      const res = await fetch(`/api/v1/grants/${id}/installments/${instId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Erreur lors de la suppression');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grant', id] });
    },
  });

  // Deliverable Mutations
  const createDeliverableMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch(`/api/v1/grants/${id}/deliverables`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Erreur lors de la création du livrable');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grant', id] });
      setShowDeliverableModal(false);
      resetDeliverableForm();
    },
  });

  const updateDeliverableMutation = useMutation({
    mutationFn: async ({ delivId, payload }: { delivId: string; payload: any }) => {
      const res = await fetch(`/api/v1/grants/${id}/deliverables/${delivId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Erreur lors de la mise à jour du livrable');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grant', id] });
      setShowDeliverableModal(false);
      resetDeliverableForm();
    },
  });

  const deleteDeliverableMutation = useMutation({
    mutationFn: async (delivId: string) => {
      const res = await fetch(`/api/v1/grants/${id}/deliverables/${delivId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Erreur lors de la suppression');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grant', id] });
    },
  });

  const resetInstallmentForm = () => {
    setEditingInstallmentId(null);
    setInstNumber(grant?.installments?.length ? grant.installments.length + 1 : 1);
    setInstTitle('');
    setInstAmount(10000);
    setInstScheduledDate('');
    setInstReceivedDate('');
    setInstStatus('scheduled');
    setInstConditions('');
    setInstPaymentRef('');
  };

  const openAddInstallment = () => {
    resetInstallmentForm();
    setShowInstallmentModal(true);
  };

  const openEditInstallment = (inst: any) => {
    setEditingInstallmentId(inst.id);
    setInstNumber(inst.installmentNumber);
    setInstTitle(inst.title || '');
    setInstAmount(inst.amount);
    setInstScheduledDate(inst.scheduledDate ? inst.scheduledDate.substring(0, 10) : '');
    setInstReceivedDate(inst.receivedDate ? inst.receivedDate.substring(0, 10) : '');
    setInstStatus(inst.status);
    setInstConditions(inst.conditions || '');
    setInstPaymentRef(inst.paymentReference || '');
    setShowInstallmentModal(true);
  };

  const resetDeliverableForm = () => {
    setEditingDeliverableId(null);
    setDelTitle('');
    setDelType('narrative_report');
    setDelDueDate('');
    setDelSubmissionDate('');
    setDelStatus('pending');
    setDelDescription('');
    setDelRecipient('');
  };

  const openAddDeliverable = () => {
    resetDeliverableForm();
    setShowDeliverableModal(true);
  };

  const openEditDeliverable = (deliv: any) => {
    setEditingDeliverableId(deliv.id);
    setDelTitle(deliv.title);
    setDelType(deliv.deliverableType);
    setDelDueDate(deliv.dueDate ? deliv.dueDate.substring(0, 10) : '');
    setDelSubmissionDate(deliv.submissionDate ? deliv.submissionDate.substring(0, 10) : '');
    setDelStatus(deliv.status);
    setDelDescription(deliv.description || '');
    setDelRecipient(deliv.funderRecipient || '');
    setShowDeliverableModal(true);
  };

  const openEditGrant = () => {
    if (!grant) return;
    const matchedFunder = funders.find(
      (f: any) =>
        (grant as any).funderId === f.id ||
        f.name.trim().toLowerCase() === grant.funderName.trim().toLowerCase()
    );
    setEditFunderId(matchedFunder ? matchedFunder.id : 'custom');
    setEditTitle(grant.title);
    setEditFunderName(grant.funderName);
    setEditFunderType(grant.funderType);
    setEditProgramName(grant.programName || '');
    setEditStatus(grant.status);
    setEditRequestedAmount(grant.requestedAmount);
    setEditAwardedAmount(grant.awardedAmount);
    setEditSubmissionDeadline(grant.submissionDeadline ? grant.submissionDeadline.substring(0, 10) : '');
    setEditStartDate(grant.startDate ? grant.startDate.substring(0, 10) : '');
    setEditEndDate(grant.endDate ? grant.endDate.substring(0, 10) : '');
    setEditNotes(grant.notes || '');
    setEditContractRef(grant.contractReference || '');
    setShowEditGrantModal(true);
  };

  const handleSaveGrantModal = (e: React.FormEvent) => {
    e.preventDefault();
    updateGrantMutation.mutate({
      title: editTitle,
      funderId: editFunderId && editFunderId !== 'custom' ? editFunderId : null,
      funderName: editFunderName,
      funderType: editFunderType,
      programName: editProgramName || null,
      status: editStatus,
      requestedAmount: Number(editRequestedAmount),
      awardedAmount: Number(editAwardedAmount),
      submissionDeadline: editSubmissionDeadline ? new Date(editSubmissionDeadline).toISOString() : null,
      startDate: editStartDate ? new Date(editStartDate).toISOString() : null,
      endDate: editEndDate ? new Date(editEndDate).toISOString() : null,
      notes: editNotes || null,
      contractReference: editContractRef || null,
    });
  };

  const handleSaveInstallment = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      installmentNumber: Number(instNumber),
      title: instTitle || `Tranche #${instNumber}`,
      amount: Number(instAmount),
      scheduledDate: instScheduledDate ? new Date(instScheduledDate).toISOString() : new Date().toISOString(),
      receivedDate: instReceivedDate ? new Date(instReceivedDate).toISOString() : null,
      status: instStatus,
      conditions: instConditions || null,
      paymentReference: instPaymentRef || null,
    };

    if (editingInstallmentId) {
      updateInstallmentMutation.mutate({ instId: editingInstallmentId, payload });
    } else {
      createInstallmentMutation.mutate(payload);
    }
  };

  const handleSaveDeliverable = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      title: delTitle,
      deliverableType: delType,
      dueDate: delDueDate ? new Date(delDueDate).toISOString() : new Date().toISOString(),
      submissionDate: delSubmissionDate ? new Date(delSubmissionDate).toISOString() : null,
      status: delStatus,
      description: delDescription || null,
      funderRecipient: delRecipient || null,
    };

    if (editingDeliverableId) {
      updateDeliverableMutation.mutate({ delivId: editingDeliverableId, payload });
    } else {
      createDeliverableMutation.mutate(payload);
    }
  };

  const handleSaveNotes = () => {
    updateGrantMutation.mutate({ notes: notesContent });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center text-slate-500">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto mb-4" />
          <p>Chargement des détails de la subvention...</p>
        </div>
      </div>
    );
  }

  if (fetchError || !grant) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl max-w-md mx-auto">
            <AlertTriangle className="h-10 w-10 mx-auto mb-2 text-red-500" />
            <h3 className="font-semibold text-lg mb-1">Subvention introuvable</h3>
            <p className="text-sm mb-4">La subvention demandée n'existe pas ou a été supprimée.</p>
            <Button variant="outline" onClick={() => navigate('/grants')}>
              Retour à la liste
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Calculations
  const totalReceived = grant.installments
    ?.filter((i: any) => i.status === 'received')
    .reduce((sum: number, i: any) => sum + i.amount, 0) || 0;
  const progressPercent = grant.awardedAmount > 0 ? Math.min(100, Math.round((totalReceived / grant.awardedAmount) * 100)) : 0;
  const pendingDeliverables = grant.deliverables?.filter((d: any) => d.status !== 'approved') || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'prospect':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">Prospection</span>;
      case 'drafting':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-300">Rédaction</span>;
      case 'submitted':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-300">Déposée</span>;
      case 'approved':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-300">Octroyée / Active</span>;
      case 'rejected':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-300">Refusée</span>;
      case 'closed':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-300">Clôturée</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  const getFunderTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      federal: 'Fédéral',
      provincial: 'Provincial',
      municipal: 'Municipal',
      foundation: 'Fondation Philanthropique',
      corporate: 'Entreprise / RSE',
      other: 'Autre bailleur',
    };
    return labels[type] || type;
  };

  const getDeliverableTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      narrative_report: 'Rapport Narratif',
      financial_report: 'Rapport Financier',
      evaluation: 'Évaluation d\'impact',
      audit: 'Audit Externe',
      other: 'Autre Livrable',
    };
    return labels[type] || type;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-16">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-slate-500 mb-6">
          <button
            onClick={() => navigate('/grants')}
            className="hover:text-primary-600 flex items-center transition"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Subventions
          </button>
          <span>/</span>
          <span className="font-mono text-xs bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-2 py-0.5 rounded">
            {grant.code}
          </span>
          <span>/</span>
          <span className="text-slate-900 dark:text-white font-medium truncate max-w-xs sm:max-w-md">
            {grant.title}
          </span>
        </div>

        {/* Top Header Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200/80 dark:border-slate-700/80 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded bg-primary-50 text-primary-700 border border-primary-200 dark:bg-primary-950 dark:text-primary-300 dark:border-primary-800">
                  {grant.code}
                </span>
                {getStatusBadge(grant.status)}
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                  <Building2 className="h-3 w-3 mr-1" />
                  {getFunderTypeLabel(grant.funderType)}
                </span>
                {grant.project && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300">
                    <Layers className="h-3 w-3 mr-1" />
                    Projet: {grant.project.name}
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                {grant.title}
              </h1>

              <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-sm text-slate-600 dark:text-slate-400">
                <div className="flex items-center">
                  <Landmark className="h-4 w-4 mr-1.5 text-primary-600" />
                  <span className="font-medium text-slate-900 dark:text-white">{grant.funderName}</span>
                  {grant.programName && <span className="ml-1 text-slate-500">({grant.programName})</span>}
                </div>
                {grant.contractReference && (
                  <div className="flex items-center text-xs font-mono bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">
                    Ref: {grant.contractReference}
                  </div>
                )}
              </div>
            </div>

            {/* Header Right Actions */}
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={openEditGrant} className="flex items-center gap-1.5">
                <Edit2 className="h-4 w-4" />
                Modifier
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  if (confirm(`Êtes-vous certain de vouloir supprimer la subvention ${grant.code} ?`)) {
                    deleteGrantMutation.mutate();
                  }
                }}
                className="text-rose-600 hover:bg-rose-50 border-rose-200 dark:border-rose-900 flex items-center gap-1.5"
              >
                <Trash2 className="h-4 w-4" />
                Supprimer
              </Button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100 dark:border-slate-700/60">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Montant Octroyé</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                {grant.awardedAmount ? `${grant.awardedAmount.toLocaleString('fr-CA')} $` : 'En attente'}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Demandé: {grant.requestedAmount.toLocaleString('fr-CA')} $</p>
            </div>

            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Fonds Encaissés</p>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {totalReceived.toLocaleString('fr-CA')} $
              </p>
              <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">{progressPercent}% décaissé</p>
            </div>

            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Période du Contrat</p>
              <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1 flex items-center">
                <Calendar className="h-3.5 w-3.5 mr-1 text-slate-400" />
                {grant.startDate ? new Date(grant.startDate).toLocaleDateString('fr-CA') : 'Non définie'} -{' '}
                {grant.endDate ? new Date(grant.endDate).toLocaleDateString('fr-CA') : 'Non définie'}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {grant.endDate && new Date(grant.endDate) > new Date()
                  ? `Fin dans ${Math.ceil((new Date(grant.endDate).getTime() - Date.now()) / (1000 * 3600 * 24))} jours`
                  : 'Convention'}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Reddition de Comptes</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                {grant.deliverables?.length || 0}{' '}
                <span className="text-sm font-normal text-slate-500">livrable(s)</span>
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                {pendingDeliverables.length} en attente / à soumettre
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-700 mb-6 space-x-2 sm:space-x-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 px-2 font-medium text-sm border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
              activeTab === 'overview'
                ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 hover:border-slate-300'
            }`}
          >
            <Building2 className="h-4 w-4" />
            Vue d'ensemble & Fiche Bailleur
          </button>

          <button
            onClick={() => setActiveTab('installments')}
            className={`pb-3 px-2 font-medium text-sm border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
              activeTab === 'installments'
                ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 hover:border-slate-300'
            }`}
          >
            <DollarSign className="h-4 w-4" />
            Tranches de Versement ({grant.installments?.length || 0})
          </button>

          <button
            onClick={() => setActiveTab('deliverables')}
            className={`pb-3 px-2 font-medium text-sm border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
              activeTab === 'deliverables'
                ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 hover:border-slate-300'
            }`}
          >
            <FileText className="h-4 w-4" />
            Livrables & Reddition ({grant.deliverables?.length || 0})
          </button>

          <button
            onClick={() => setActiveTab('notes')}
            className={`pb-3 px-2 font-medium text-sm border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
              activeTab === 'notes'
                ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 hover:border-slate-300'
            }`}
          >
            <Edit2 className="h-4 w-4" />
            Notes de Suivi
          </button>
        </div>

        {/* TAB 1: Overview */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                  Informations Générales de la Convention
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500 block text-xs">Organisme Subventionnaire :</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{grant.funderName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-xs">Catégorie de Bailleur :</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{getFunderTypeLabel(grant.funderType)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-xs">Programme / Appel à projets :</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{grant.programName || 'Non spécifié'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-xs">N° de Convention / Contrat :</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{grant.contractReference || 'Non spécifié'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-xs">Date limite de dépôt :</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {grant.submissionDeadline ? new Date(grant.submissionDeadline).toLocaleDateString('fr-CA') : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-xs">Période d'exécution :</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {grant.startDate ? new Date(grant.startDate).toLocaleDateString('fr-CA') : 'N/A'} au{' '}
                      {grant.endDate ? new Date(grant.endDate).toLocaleDateString('fr-CA') : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Linked Project Box */}
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <Layers className="h-5 w-5 text-indigo-600" />
                  Imputation Opérationnelle & Projet
                </h3>
                {grant.project ? (
                  <div className="bg-slate-50 dark:bg-slate-750 p-4 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{grant.project.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5 font-mono">Code Projet: {grant.project.code}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/projects/${grant.project?.id}`)}
                      className="text-xs flex items-center gap-1"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Voir le Projet
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 italic">
                    Cette subvention n'est rattachée à aucun projet spécifique (Financement de fonctionnement ou non restreint).
                  </p>
                )}
              </div>
            </div>

            {/* Sidebar Summary */}
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-primary-600 to-indigo-700 text-white rounded-xl p-6 shadow-sm">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-primary-100 mb-2">
                  Synthèse Financière
                </h4>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-primary-200">Montant Accordé</p>
                    <p className="text-3xl font-extrabold">{grant.awardedAmount?.toLocaleString('fr-CA') || 0} $</p>
                  </div>
                  <div className="pt-2 border-t border-primary-500/50 flex justify-between text-sm">
                    <span className="text-primary-200">Encaissé à ce jour :</span>
                    <span className="font-semibold">{totalReceived.toLocaleString('fr-CA')} $</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-primary-200">Reste à percevoir :</span>
                    <span className="font-semibold">
                      {Math.max(0, (grant.awardedAmount || 0) - totalReceived).toLocaleString('fr-CA')} $
                    </span>
                  </div>
                  <div className="w-full bg-primary-800/60 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${progressPercent}%` }} />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
                  Checklist Conformité
                </h4>
                <ul className="space-y-2.5 text-sm">
                  <li className="flex items-center text-emerald-600">
                    <CheckCircle2 className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span>Convention validée</span>
                  </li>
                  <li className="flex items-center text-slate-700 dark:text-slate-300">
                    <Clock className="h-4 w-4 mr-2 text-amber-500 flex-shrink-0" />
                    <span>
                      {grant.installments?.length || 0} tranche(s) planifiée(s)
                    </span>
                  </li>
                  <li className="flex items-center text-slate-700 dark:text-slate-300">
                    <FileText className="h-4 w-4 mr-2 text-blue-500 flex-shrink-0" />
                    <span>
                      {grant.deliverables?.length || 0} livrable(s) de reddition
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Installments */}
        {activeTab === 'installments' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Échéancier des Tranches Financières</h3>
                <p className="text-sm text-slate-500">
                  Suivi des encaissements prévus, facturés et reçus du bailleur.
                </p>
              </div>
              <Button onClick={openAddInstallment} className="flex items-center gap-1.5">
                <Plus className="h-4 w-4" />
                Ajouter une Tranche
              </Button>
            </div>

            {grant.installments && grant.installments.length > 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-750 border-b border-slate-200 dark:border-slate-700 text-xs font-semibold uppercase text-slate-500">
                        <th className="py-3 px-4">#</th>
                        <th className="py-3 px-4">Libellé / Tranche</th>
                        <th className="py-3 px-4">Montant</th>
                        <th className="py-3 px-4">Date Prévue</th>
                        <th className="py-3 px-4">Date Reçue</th>
                        <th className="py-3 px-4">Statut</th>
                        <th className="py-3 px-4">Conditions / Ref</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {grant.installments
                        .sort((a: any, b: any) => a.installmentNumber - b.installmentNumber)
                        .map((inst: any) => (
                          <tr key={inst.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-750/50 transition">
                            <td className="py-3 px-4 font-bold text-slate-400">
                              #{inst.installmentNumber}
                            </td>
                            <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                              {inst.title}
                            </td>
                            <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                              {inst.amount.toLocaleString('fr-CA')} $
                            </td>
                            <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                              {inst.scheduledDate ? new Date(inst.scheduledDate).toLocaleDateString('fr-CA') : '-'}
                            </td>
                            <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                              {inst.receivedDate ? (
                                <span className="text-emerald-600 font-medium">
                                  {new Date(inst.receivedDate).toLocaleDateString('fr-CA')}
                                </span>
                              ) : (
                                <span className="text-slate-400 italic">En attente</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              {inst.status === 'received' ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">
                                  <CheckCircle2 className="h-3 w-3 mr-1" /> Reçue
                                </span>
                              ) : inst.status === 'invoiced' ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800">
                                  Facturée
                                </span>
                              ) : inst.status === 'delayed' ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-rose-100 text-rose-800">
                                  En retard
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700">
                                  Planifiée
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-xs text-slate-500 max-w-xs truncate">
                              {inst.conditions || inst.paymentReference || '-'}
                            </td>
                            <td className="py-3 px-4 text-right space-x-2">
                              <button
                                onClick={() => openEditInstallment(inst)}
                                className="text-slate-400 hover:text-primary-600 transition"
                                title="Modifier"
                              >
                                <Edit2 className="h-4 w-4 inline" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Supprimer la tranche #${inst.installmentNumber} ?`)) {
                                    deleteInstallmentMutation.mutate(inst.id);
                                  }
                                }}
                                className="text-slate-400 hover:text-rose-600 transition"
                                title="Supprimer"
                              >
                                <Trash2 className="h-4 w-4 inline" />
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
                <DollarSign className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                <h4 className="font-semibold text-slate-900 dark:text-white mb-1">Aucune tranche planifiée</h4>
                <p className="text-sm text-slate-500 mb-4 max-w-md mx-auto">
                  Découpez le financement octroyé en tranches de versement selon le calendrier de la convention.
                </p>
                <Button onClick={openAddInstallment}>+ Créer une première tranche</Button>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Deliverables */}
        {activeTab === 'deliverables' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Livrables & Reddition de Comptes</h3>
                <p className="text-sm text-slate-500">
                  Rapports d'activités, états financiers certifiés et audits exigés par le bailleur.
                </p>
              </div>
              <Button onClick={openAddDeliverable} className="flex items-center gap-1.5">
                <Plus className="h-4 w-4" />
                Ajouter un Livrable
              </Button>
            </div>

            {grant.deliverables && grant.deliverables.length > 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-750 border-b border-slate-200 dark:border-slate-700 text-xs font-semibold uppercase text-slate-500">
                        <th className="py-3 px-4">Livrable</th>
                        <th className="py-3 px-4">Type</th>
                        <th className="py-3 px-4">Échéance</th>
                        <th className="py-3 px-4">Date Dépôt</th>
                        <th className="py-3 px-4">Statut Approbation</th>
                        <th className="py-3 px-4">Destinataire</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {grant.deliverables
                        .sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                        .map((deliv: any) => {
                          const isOverdue = new Date(deliv.dueDate) < new Date() && deliv.status !== 'approved';
                          return (
                            <tr key={deliv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-750/50 transition">
                              <td className="py-3 px-4">
                                <div className="font-semibold text-slate-900 dark:text-white">{deliv.title}</div>
                                {deliv.description && (
                                  <div className="text-xs text-slate-500 max-w-sm truncate">{deliv.description}</div>
                                )}
                              </td>
                              <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-slate-100 dark:bg-slate-700">
                                  {getDeliverableTypeLabel(deliv.deliverableType)}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <span
                                  className={`inline-flex items-center font-medium ${
                                    isOverdue ? 'text-rose-600 font-bold' : 'text-slate-700 dark:text-slate-300'
                                  }`}
                                >
                                  <Calendar className="h-3.5 w-3.5 mr-1" />
                                  {new Date(deliv.dueDate).toLocaleDateString('fr-CA')}
                                  {isOverdue && (
                                    <span className="ml-1 text-xs px-1.5 py-0.2 rounded bg-rose-100 text-rose-800">
                                      En retard
                                    </span>
                                  )}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                                {deliv.submissionDate ? (
                                  <span className="text-blue-600 font-medium">
                                    {new Date(deliv.submissionDate).toLocaleDateString('fr-CA')}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 italic">Non déposé</span>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                {deliv.status === 'approved' ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">
                                    <CheckCircle2 className="h-3 w-3 mr-1" /> Approuvé
                                  </span>
                                ) : deliv.status === 'submitted' ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800">
                                    Déposé (En revue)
                                  </span>
                                ) : deliv.status === 'revision_required' ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800">
                                    Révision demandée
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700">
                                    À rédiger
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-xs text-slate-500">
                                {deliv.funderRecipient || '-'}
                              </td>
                              <td className="py-3 px-4 text-right space-x-2">
                                <button
                                  onClick={() => openEditDeliverable(deliv)}
                                  className="text-slate-400 hover:text-primary-600 transition"
                                  title="Modifier"
                                >
                                  <Edit2 className="h-4 w-4 inline" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(`Supprimer le livrable "${deliv.title}" ?`)) {
                                      deleteDeliverableMutation.mutate(deliv.id);
                                    }
                                  }}
                                  className="text-slate-400 hover:text-rose-600 transition"
                                  title="Supprimer"
                                >
                                  <Trash2 className="h-4 w-4 inline" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-800 rounded-xl p-12 text-center border border-dashed border-slate-300 dark:border-slate-700">
                <FileText className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                <h4 className="font-semibold text-slate-900 dark:text-white mb-1">Aucun livrable défini</h4>
                <p className="text-sm text-slate-500 mb-4 max-w-md mx-auto">
                  Ajoutez les rapports narratifs ou financiers exigés pour garantir la reddition de comptes.
                </p>
                <Button onClick={openAddDeliverable}>+ Créer un premier livrable</Button>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: Notes */}
        {activeTab === 'notes' && (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Journal & Notes de Suivi</h3>
                <p className="text-sm text-slate-500">
                  Consignez les échanges téléphoniques, comptes-rendus de rencontres ou exigences particulières.
                </p>
              </div>
              <Button
                onClick={handleSaveNotes}
                disabled={!notesDirty || updateGrantMutation.isPending}
                className="flex items-center gap-1.5"
              >
                <Save className="h-4 w-4" />
                Enregistrer
              </Button>
            </div>

            <textarea
              rows={12}
              value={notesContent}
              onChange={(e) => {
                setNotesContent(e.target.value);
                setNotesDirty(true);
              }}
              placeholder="Écrivez ici vos notes, compte-rendus ou liens vers les pièces justificatives..."
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-4 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono"
            />
          </div>
        )}
      </main>

      {/* EDIT GRANT MODAL */}
      {showEditGrantModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 my-8">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
              Modifier la Subvention {grant.code}
            </h3>
            <form onSubmit={handleSaveGrantModal} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Intitulé du projet / subvention *
                  </label>
                  <Input
                    value={editTitle}
                    onChange={(e: any) => setEditTitle(e.target.value)}
                    required
                  />
                </div>

                {/* Funder selection section */}
                <div className="sm:col-span-2 space-y-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Bailleur de fonds institutionnel *
                  </label>
                  <select
                    className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                    value={editFunderId}
                    onChange={(e) => {
                      const selId = e.target.value;
                      setEditFunderId(selId);
                      if (selId && selId !== 'custom') {
                        const found = funders.find((f: any) => f.id === selId);
                        if (found) {
                          setEditFunderName(found.name);
                          setEditFunderType(found.type);
                        }
                      }
                    }}
                    required
                  >
                    <option value="">-- Sélectionnez un bailleur dans le répertoire --</option>
                    {funders.map((f: any) => (
                      <option key={f.id} value={f.id}>
                        🏛️ {f.name} ({f.code}) — {f.type}
                      </option>
                    ))}
                    <option value="custom">✍️ Saisie libre (Bailleur temporaire / hors répertoire)</option>
                  </select>

                  {/* Funder summary card if registered funder selected */}
                  {(() => {
                    const selectedFunder = funders.find((f: any) => f.id === editFunderId);
                    if (!selectedFunder) return null;
                    return (
                      <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900 rounded-xl flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-black text-indigo-700 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900 px-2 py-0.5 rounded">
                            {selectedFunder.code}
                          </span>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">{selectedFunder.name}</div>
                            <div className="text-slate-500">
                              {selectedFunder.contactPerson ? `Contact : ${selectedFunder.contactPerson}` : ''}
                              {selectedFunder.contactEmail ? ` • ${selectedFunder.contactEmail}` : ''}
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] uppercase font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/50 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                          {getFunderTypeLabel(selectedFunder.type)}
                        </span>
                      </div>
                    );
                  })()}

                  {/* Manual inputs if custom */}
                  {editFunderId === 'custom' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl mt-2">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Nom du bailleur *
                        </label>
                        <Input
                          value={editFunderName}
                          onChange={(e: any) => setEditFunderName(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Type de bailleur *
                        </label>
                        <select
                          value={editFunderType}
                          onChange={(e: any) => setEditFunderType(e.target.value)}
                          className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                        >
                          <option value="foundation">Fondation</option>
                          <option value="provincial">Provincial</option>
                          <option value="federal">Fédéral</option>
                          <option value="municipal">Municipal</option>
                          <option value="corporate">Entreprise / RSE</option>
                          <option value="other">Autre</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Programme / Volet
                  </label>
                  <Input
                    value={editProgramName}
                    onChange={(e: any) => setEditProgramName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Statut du pipeline *
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e: any) => setEditStatus(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                  >
                    <option value="prospect">Prospection</option>
                    <option value="drafting">En rédaction</option>
                    <option value="submitted">Déposée / En revue</option>
                    <option value="approved">Octroyée / Active</option>
                    <option value="rejected">Refusée</option>
                    <option value="closed">Clôturée</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Montant demandé ($ CAD) *
                  </label>
                  <Input
                    type="number"
                    value={editRequestedAmount}
                    onChange={(e: any) => setEditRequestedAmount(Number(e.target.value))}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Montant octroyé ($ CAD)
                  </label>
                  <Input
                    type="number"
                    value={editAwardedAmount}
                    onChange={(e: any) => setEditAwardedAmount(Number(e.target.value))}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Date début
                  </label>
                  <Input
                    type="date"
                    value={editStartDate}
                    onChange={(e: any) => setEditStartDate(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Date fin
                  </label>
                  <Input
                    type="date"
                    value={editEndDate}
                    onChange={(e: any) => setEditEndDate(e.target.value)}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Référence contrat / convention
                  </label>
                  <Input
                    value={editContractRef}
                    onChange={(e: any) => setEditContractRef(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <Button variant="outline" type="button" onClick={() => setShowEditGrantModal(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={updateGrantMutation.isPending}>
                  Enregistrer les modifications
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INSTALLMENT MODAL */}
      {showInstallmentModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
              {editingInstallmentId ? 'Modifier la Tranche' : 'Nouvelle Tranche de Versement'}
            </h3>
            <form onSubmit={handleSaveInstallment} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    N° de Tranche *
                  </label>
                  <Input
                    type="number"
                    value={instNumber}
                    onChange={(e: any) => setInstNumber(Number(e.target.value))}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Montant ($ CAD) *
                  </label>
                  <Input
                    type="number"
                    value={instAmount}
                    onChange={(e: any) => setInstAmount(Number(e.target.value))}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Intitulé / Libellé
                </label>
                <Input
                  value={instTitle}
                  onChange={(e: any) => setInstTitle(e.target.value)}
                  placeholder="ex: Avance de démarrage 40%"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Date Prévue *
                  </label>
                  <Input
                    type="date"
                    value={instScheduledDate}
                    onChange={(e: any) => setInstScheduledDate(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Statut *
                  </label>
                  <select
                    value={instStatus}
                    onChange={(e: any) => setInstStatus(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                  >
                    <option value="scheduled">Planifiée</option>
                    <option value="invoiced">Facturée / Réclamée</option>
                    <option value="received">Reçue / Encaissée</option>
                    <option value="delayed">En retard</option>
                  </select>
                </div>
              </div>

              {instStatus === 'received' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Date de Réception
                    </label>
                    <Input
                      type="date"
                      value={instReceivedDate}
                      onChange={(e: any) => setInstReceivedDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Ref Paiement / Virement
                    </label>
                    <Input
                      value={instPaymentRef}
                      onChange={(e: any) => setInstPaymentRef(e.target.value)}
                      placeholder="ex: VIR-2026-04"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Conditions de déblocage / Jalons
                </label>
                <Input
                  value={instConditions}
                  onChange={(e: any) => setInstConditions(e.target.value)}
                  placeholder="ex: Sur présentation du rapport d'étape T1"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <Button variant="outline" type="button" onClick={() => setShowInstallmentModal(false)}>
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={createInstallmentMutation.isPending || updateInstallmentMutation.isPending}
                >
                  {editingInstallmentId ? 'Mettre à jour' : 'Ajouter la tranche'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELIVERABLE MODAL */}
      {showDeliverableModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
              {editingDeliverableId ? 'Modifier le Livrable' : 'Nouveau Livrable de Reddition'}
            </h3>
            <form onSubmit={handleSaveDeliverable} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Intitulé du livrable *
                </label>
                <Input
                  value={delTitle}
                  onChange={(e: any) => setDelTitle(e.target.value)}
                  placeholder="ex: Rapport narratif final et bilan d'activités"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Type de livrable *
                  </label>
                  <select
                    value={delType}
                    onChange={(e: any) => setDelType(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                  >
                    <option value="narrative_report">Rapport narratif</option>
                    <option value="financial_report">Rapport financier</option>
                    <option value="evaluation">Évaluation d'impact</option>
                    <option value="audit">Audit externe</option>
                    <option value="other">Autre</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Statut *
                  </label>
                  <select
                    value={delStatus}
                    onChange={(e: any) => setDelStatus(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                  >
                    <option value="pending">En attente / À rédiger</option>
                    <option value="drafting">En cours de rédaction</option>
                    <option value="submitted">Déposé / Envoyé</option>
                    <option value="approved">Approuvé par le bailleur</option>
                    <option value="revision_required">Révision demandée</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Date d'échéance *
                  </label>
                  <Input
                    type="date"
                    value={delDueDate}
                    onChange={(e: any) => setDelDueDate(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Date de dépôt effectif
                  </label>
                  <Input
                    type="date"
                    value={delSubmissionDate}
                    onChange={(e: any) => setDelSubmissionDate(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Contact / Destinataire chez le bailleur
                </label>
                <Input
                  value={delRecipient}
                  onChange={(e: any) => setDelRecipient(e.target.value)}
                  placeholder="ex: chargé.de.programme@bailleur.org"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description / Exigences de reddition
                </label>
                <textarea
                  rows={3}
                  value={delDescription}
                  onChange={(e) => setDelDescription(e.target.value)}
                  placeholder="Format exigé, pièces justificatives obligatoires..."
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-sm text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <Button variant="outline" type="button" onClick={() => setShowDeliverableModal(false)}>
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={createDeliverableMutation.isPending || updateDeliverableMutation.isPending}
                >
                  {editingDeliverableId ? 'Mettre à jour' : 'Ajouter le livrable'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
