import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Input, Badge } from '@orgdashio/ui';
import {
  ArrowLeft,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Plus,
  AlertCircle,
  FileText,
  CheckCircle,
  CheckCircle2,
  Users,
  Calendar,
  Phone,
  Mail,
  Clock,
  Target,
  Share2,
  FolderLock,
  AlertTriangle,
  Send,
  UserPlus,
  Trash2,
  Pencil,
  Check,
  X,
  History,
  HeartHandshake,
  ExternalLink,
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';

type TabKey = 'overview' | 'plans' | 'notes' | 'referrals' | 'audit';

export function CaseDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  // Modals state
  const [showBreakGlassModal, setShowBreakGlassModal] = useState(false);
  const [breakGlassReason, setBreakGlassReason] = useState('');

  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteType, setNoteType] = useState<'meeting' | 'phone_call' | 'home_visit' | 'assessment' | 'other'>('meeting');
  const [noteContent, setNoteContent] = useState('');
  const [parentNoteId, setParentNoteId] = useState<string | undefined>(undefined);

  const [showPlanModal, setShowPlanModal] = useState(false);
  const [planTitle, setPlanTitle] = useState('');
  const [planDescription, setPlanDescription] = useState('');
  const [planStartDate, setPlanStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [planReviewDate, setPlanReviewDate] = useState('');

  const [showGoalModal, setShowGoalModal] = useState(false);
  const [selectedPlanIdForGoal, setSelectedPlanIdForGoal] = useState<string | null>(null);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalDescription, setGoalDescription] = useState('');
  const [goalTargetDate, setGoalTargetDate] = useState('');

  const [showReferralModal, setShowReferralModal] = useState(false);
  const [refOrgName, setRefOrgName] = useState('');
  const [refServiceType, setRefServiceType] = useState('');
  const [refContactPerson, setRefContactPerson] = useState('');
  const [refContactPhone, setRefContactPhone] = useState('');
  const [refContactEmail, setRefContactEmail] = useState('');
  const [refReason, setRefReason] = useState('');

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignUserId, setAssignUserId] = useState('');
  const [assignRole, setAssignRole] = useState<'primary_worker' | 'co_worker' | 'supervisor'>('co_worker');

  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // 1. Fetch Case Details
  const { data, isLoading, isError, error: queryError } = useQuery({
    queryKey: ['caseDetail', id],
    queryFn: async () => {
      const res = await fetch(`/api/v1/cases/${id}`);
      if (!res.ok) {
        const errData = await res.json();
        throw errData;
      }
      return res.json();
    },
    enabled: !!id,
    retry: false,
  });

  // 2. Fetch all org personnel to assign to case team
  const { data: people = [] } = useQuery({
    queryKey: ['people'],
    queryFn: async () => {
      const res = await fetch('/api/v1/people');
      if (!res.ok) return [];
      return res.json();
    },
  });

  const staffWithAccounts = people.filter((p: any) => p.staff?.userId);

  // Mutations
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['caseDetail', id] });

  const breakGlassMutation = useMutation({
    mutationFn: async (reason: string) => {
      const res = await fetch(`/api/v1/cases/${id}/break-glass`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Erreur lors du bris de glace');
      }
      return res.json();
    },
    onSuccess: (resData) => {
      invalidate();
      setShowBreakGlassModal(false);
      setBreakGlassReason('');
      setSuccessMessage(resData.message || 'Accès exceptionnel accordé.');
    },
    onError: (err: any) => setError(err.message),
  });

  const updateCaseMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch(`/api/v1/cases/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Erreur mise à jour');
      return res.json();
    },
    onSuccess: () => invalidate(),
  });

  const addNoteMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch(`/api/v1/cases/${id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Erreur lors de l’ajout de la note');
      }
      return res.json();
    },
    onSuccess: () => {
      invalidate();
      setShowNoteModal(false);
      setNoteContent('');
      setParentNoteId(undefined);
    },
    onError: (err: any) => setError(err.message),
  });

  const assignWorkerMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch(`/api/v1/cases/${id}/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Erreur lors de l’assignation');
      return res.json();
    },
    onSuccess: () => {
      invalidate();
      setShowAssignModal(false);
      setAssignUserId('');
    },
    onError: (err: any) => setError(err.message),
  });

  const removeWorkerMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      const res = await fetch(`/api/v1/cases/${id}/assignments/${assignmentId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Erreur retrait intervenant');
      return res.json();
    },
    onSuccess: () => invalidate(),
  });

  const createPlanMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch(`/api/v1/cases/${id}/intervention-plans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Erreur création plan');
      return res.json();
    },
    onSuccess: () => {
      invalidate();
      setShowPlanModal(false);
      setPlanTitle('');
      setPlanDescription('');
      setPlanReviewDate('');
    },
    onError: (err: any) => setError(err.message),
  });

  const addGoalMutation = useMutation({
    mutationFn: async ({ planId, payload }: { planId: string; payload: any }) => {
      const res = await fetch(`/api/v1/cases/${id}/intervention-plans/${planId}/goals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Erreur ajout objectif');
      return res.json();
    },
    onSuccess: () => {
      invalidate();
      setShowGoalModal(false);
      setGoalTitle('');
      setGoalDescription('');
      setGoalTargetDate('');
    },
    onError: (err: any) => setError(err.message),
  });

  const updateGoalMutation = useMutation({
    mutationFn: async ({ goalId, payload }: { goalId: string; payload: any }) => {
      const res = await fetch(`/api/v1/cases/${id}/goals/${goalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Erreur mise à jour objectif');
      return res.json();
    },
    onSuccess: () => invalidate(),
  });

  const createReferralMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch(`/api/v1/cases/${id}/referrals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Erreur création référence');
      return res.json();
    },
    onSuccess: () => {
      invalidate();
      setShowReferralModal(false);
      setRefOrgName('');
      setRefServiceType('');
      setRefContactPerson('');
      setRefReason('');
    },
    onError: (err: any) => setError(err.message),
  });

  const updateReferralMutation = useMutation({
    mutationFn: async ({ referralId, payload }: { referralId: string; payload: any }) => {
      const res = await fetch(`/api/v1/cases/${id}/referrals/${referralId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Erreur mise à jour référence');
      return res.json();
    },
    onSuccess: () => invalidate(),
  });

  // Handle Loading
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          <span className="text-xs">Chargement du dossier confidentiel...</span>
        </div>
      </div>
    );
  }

  // Handle Restricted Access / Break Glass scenario
  if (isError && (queryError as any)?.requiresBreakGlass) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="p-8 max-w-3xl mx-auto space-y-6">
          <Button variant="outline" size="sm" onClick={() => navigate('/cases')}>
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Retour à la liste des dossiers
          </Button>

          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center space-y-4 shadow-sm">
            <ShieldAlert className="w-12 h-12 text-red-600 mx-auto" />
            <h2 className="text-xl font-bold text-red-900">Accès Restreint aux Données Confidentielles (CAS-08)</h2>
            <p className="text-xs text-red-700 max-w-lg mx-auto leading-relaxed">
              Vous n'êtes pas membre de l'équipe assignée à ce dossier d'accompagnement. Conformément aux dispositions de la Loi 25 et aux règles de déontologie sociale, l’accès direct aux notes et plans d'intervention est verrouillé.
            </p>

            <div className="pt-3">
              <Button
                className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs"
                onClick={() => setShowBreakGlassModal(true)}
              >
                <Lock className="w-4 h-4 mr-2" /> Déclencher un Bris de Glace d’Urgence
              </Button>
            </div>
          </div>

          {/* Modal Bris de Glace */}
          {showBreakGlassModal && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
                <div className="flex items-center gap-2 text-red-700 border-b border-red-100 pb-3">
                  <ShieldAlert className="w-5 h-5" />
                  <h3 className="text-base font-bold">Justification d’Urgence (Bris de glace)</h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Avertissement : Cette action est strictement auditée et consignée au journal de conformité Loi 25. Une alerte sera transmise au superviseur.
                </p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (breakGlassReason.trim().length < 10) {
                      setError('Le motif doit contenir au moins 10 caractères.');
                      return;
                    }
                    breakGlassMutation.mutate(breakGlassReason);
                  }}
                  className="space-y-3 text-xs"
                >
                  <div>
                    <label className="text-slate-700 font-bold block mb-1">
                      Motif explicite de l'accès d'urgence *
                    </label>
                    <Input
                      value={breakGlassReason}
                      onChange={(e) => setBreakGlassReason(e.target.value)}
                      placeholder="Ex: Intervention d'urgence psychosociale en cours, crise familiale..."
                      required
                      className="text-xs"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" type="button" onClick={() => setShowBreakGlassModal(false)}>
                      Annuler
                    </Button>
                    <Button
                      type="submit"
                      className="bg-red-600 hover:bg-red-700 text-white font-bold"
                      disabled={breakGlassMutation.isPending}
                    >
                      {breakGlassMutation.isPending ? 'Enregistrement...' : 'Confirmer le bris de glace'}
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

  const {
    caseFile: c,
    beneficiary,
    assignments = [],
    notes = [],
    interventionPlans = [],
    referrals = [],
    breakGlassLogs = [],
  } = data || {};

  const TABS = [
    { key: 'overview' as TabKey, label: 'Vue d’ensemble & Bénéficiaire', icon: FolderLock },
    { key: 'plans' as TabKey, label: `Plans d'Intervention (${interventionPlans.length})`, icon: Target },
    { key: 'notes' as TabKey, label: `Notes de Suivi & Addenda (${notes.length})`, icon: FileText },
    { key: 'referrals' as TabKey, label: `Aiguillages & Références (${referrals.length})`, icon: Share2 },
    { key: 'audit' as TabKey, label: `Audit & Bris de Glace (${breakGlassLogs.length})`, icon: History },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* Header */}
      <header className="border-b bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between py-4 gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/cases')}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
              >
                <ArrowLeft className="h-4 w-4" />
                Dossiers
              </button>
              <div className="h-4 w-px bg-slate-200" />
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-xs font-bold bg-slate-100 px-2.5 py-1 rounded text-slate-800 border border-slate-200">
                  {c?.caseNumber}
                </span>
                <h1 className="text-lg font-bold text-slate-900">{c?.title}</h1>
                <Badge variant={c?.confidentialityLevel === 'highly_confidential' ? 'danger' : 'secondary'}>
                  {c?.confidentialityLevel}
                </Badge>
              </div>
            </div>

            {/* Quick Status Control */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">Statut du dossier :</span>
              <select
                value={c?.status}
                onChange={(e) => updateCaseMutation.mutate({ status: e.target.value })}
                className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-800"
              >
                <option value="open">Ouvert</option>
                <option value="active">Actif / En cours</option>
                <option value="under_review">En révision</option>
                <option value="closed">Clôturé</option>
              </select>
            </div>
          </div>

          {/* Quick info strip */}
          <div className="flex flex-wrap items-center gap-6 pb-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5 text-indigo-600" />
              Bénéficiaire :{' '}
              <strong className="text-slate-800">
                {beneficiary ? `${beneficiary.firstName} ${beneficiary.lastName}` : 'Non spécifié'}
              </strong>
            </span>
            <span className="flex items-center gap-1">
              <HeartHandshake className="h-3.5 w-3.5 text-emerald-600" />
              Équipe assignée : <strong className="text-slate-800">{assignments.length}</strong> intervenant(s)
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              Ouvert le {c?.openedAt ? new Date(c.openedAt).toLocaleDateString('fr-CA') : '—'}
            </span>
          </div>

          {/* Tab navigation */}
          <div className="-mb-px flex gap-0 overflow-x-auto">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-xs font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? 'border-indigo-600 text-indigo-700 font-bold'
                      : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto max-w-7xl p-6 space-y-6">
        {successMessage && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
            <button onClick={() => setSuccessMessage('')} className="text-slate-400 hover:text-slate-600">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* TAB 1: VUE D'ENSEMBLE & BÉNÉFICIAIRE                             */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profil Bénéficiaire */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Users className="h-4 w-4 text-indigo-600" />
                  Profil de la Personne Accompagnée
                </h3>
              </div>

              {beneficiary ? (
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Nom complet</span>
                    <span className="font-bold text-slate-900 text-sm">
                      {beneficiary.firstName} {beneficiary.lastName}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Courriel</span>
                      <span className="font-medium text-slate-700">{beneficiary.email || 'Non renseigné'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Téléphone</span>
                      <span className="font-medium text-slate-700">{beneficiary.phone || 'Non renseigné'}</span>
                    </div>
                  </div>

                  {beneficiary.profile && (
                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-slate-400 block text-[11px]">Date de naissance</span>
                          <span className="text-slate-700">
                            {beneficiary.profile.birthDate
                              ? new Date(beneficiary.profile.birthDate).toLocaleDateString('fr-CA')
                              : 'Non renseignée'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">Langue préférée</span>
                          <span className="text-slate-700">{beneficiary.profile.preferredLang || 'Français'}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs"
                      onClick={() => navigate(`/people/${beneficiary.id}`)}
                    >
                      <ExternalLink className="h-3.5 w-3.5 mr-1.5 text-indigo-600" />
                      Consulter la fiche 360° du bénéficiaire
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">Aucune information bénéficiaire associée.</p>
              )}
            </div>

            {/* Équipe d'Intervention Assignée */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <HeartHandshake className="h-4 w-4 text-indigo-600" />
                    Équipe de Suivi Assignée (CAS-02)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Seuls les intervenants figurant ci-dessous ont un droit d'accès direct au dossier.
                  </p>
                </div>
                <Button size="sm" onClick={() => setShowAssignModal(true)} className="text-xs">
                  <UserPlus className="h-3.5 w-3.5 mr-1" /> Assigner un intervenant
                </Button>
              </div>

              <div className="divide-y divide-slate-100">
                {assignments.map((a: any) => (
                  <div key={a.id} className="py-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center font-bold text-indigo-700 text-xs">
                        {a.user?.firstName?.[0] || 'I'}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">
                          {a.user ? `${a.user.firstName} ${a.user.lastName}` : 'Intervenant inconnu'}
                        </div>
                        <div className="text-slate-400 text-[11px]">
                          {a.user?.email} • {a.user?.jobTitle || 'Intervenant social'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          a.role === 'primary_worker'
                            ? 'bg-indigo-100 text-indigo-800'
                            : a.role === 'supervisor'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {a.role === 'primary_worker'
                          ? 'Intervenant Principal'
                          : a.role === 'supervisor'
                          ? 'Superviseur Clinique'
                          : 'Co-intervenant'}
                      </span>

                      {a.role !== 'primary_worker' && (
                        <button
                          onClick={() => removeWorkerMutation.mutate(a.id)}
                          className="text-slate-400 hover:text-red-600 p-1 rounded transition"
                          title="Retirer l'assignation"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* TAB 2: PLANS D'INTERVENTION INDIVIDUALISÉS                       */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {activeTab === 'plans' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Target className="h-5 w-5 text-indigo-600" />
                  Plans d'Intervention & Objectifs SMART (CAS-03)
                </h3>
                <p className="text-xs text-slate-500">
                  Définition des étapes clés, des échéances et des critères de succès de l'accompagnement.
                </p>
              </div>

              <Button onClick={() => setShowPlanModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs">
                <Plus className="h-4 w-4 mr-1.5" /> Nouveau Plan d'Intervention
              </Button>
            </div>

            {interventionPlans.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-400 space-y-3 shadow-sm">
                <Target className="h-10 w-10 text-slate-300 mx-auto" />
                <p className="text-sm font-medium">Aucun plan d'intervention actif pour ce dossier.</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Créez un plan d'intervention pour formaliser les objectifs d'accompagnement du bénéficiaire.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {interventionPlans.map((plan: any) => {
                  const goals = plan.goals || [];
                  const achievedCount = goals.filter((g: any) => g.status === 'achieved').length;
                  const planProgress = goals.length > 0 ? Math.round((achievedCount / goals.length) * 100) : 0;

                  return (
                    <div key={plan.id} className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden space-y-4 p-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-900 text-base">{plan.title}</h4>
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                plan.status === 'active'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : plan.status === 'completed'
                                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {plan.status === 'active' ? 'Plan Actif' : plan.status === 'completed' ? 'Complété' : 'Brouillon'}
                            </span>
                          </div>
                          {plan.description && (
                            <p className="text-xs text-slate-500 mt-1">{plan.description}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs">
                          <div className="text-right">
                            <span className="text-[11px] text-slate-400 block">Progression SMART</span>
                            <span className="font-bold text-indigo-700 font-mono">{planProgress}% ({achievedCount}/{goals.length} objectifs)</span>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs"
                            onClick={() => {
                              setSelectedPlanIdForGoal(plan.id);
                              setShowGoalModal(true);
                            }}
                          >
                            <Plus className="h-3.5 w-3.5 mr-1" /> Ajouter un objectif
                          </Button>
                        </div>
                      </div>

                      {/* Goals List */}
                      <div className="space-y-2">
                        <h5 className="text-[11px] font-mono uppercase font-bold text-slate-400">Objectifs d'action :</h5>
                        {goals.length === 0 ? (
                          <p className="text-xs text-slate-400 italic py-2">Aucun objectif défini dans ce plan.</p>
                        ) : (
                          <div className="divide-y divide-slate-100">
                            {goals.map((goal: any) => (
                              <div key={goal.id} className="py-2.5 flex items-center justify-between text-xs hover:bg-slate-50 px-2 rounded">
                                <div className="flex items-center gap-3">
                                  <button
                                    onClick={() => {
                                      const nextStatus = goal.status === 'achieved' ? 'in_progress' : 'achieved';
                                      updateGoalMutation.mutate({ goalId: goal.id, payload: { status: nextStatus } });
                                    }}
                                    className={`h-5 w-5 rounded border flex items-center justify-center transition ${
                                      goal.status === 'achieved'
                                        ? 'bg-emerald-600 border-emerald-600 text-white'
                                        : 'border-slate-300 hover:border-indigo-600'
                                    }`}
                                  >
                                    {goal.status === 'achieved' && <Check className="h-3.5 w-3.5" />}
                                  </button>
                                  <div>
                                    <span className={`font-semibold ${goal.status === 'achieved' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                                      {goal.title}
                                    </span>
                                    {goal.description && <p className="text-[11px] text-slate-400">{goal.description}</p>}
                                  </div>
                                </div>

                                <div className="flex items-center gap-3">
                                  {goal.targetDate && (
                                    <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                                      <Clock className="h-3 w-3" /> Échéance : {new Date(goal.targetDate).toLocaleDateString('fr-CA')}
                                    </span>
                                  )}
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                                      goal.status === 'achieved'
                                        ? 'bg-emerald-100 text-emerald-800 font-bold'
                                        : goal.status === 'in_progress'
                                        ? 'bg-sky-100 text-sky-800'
                                        : 'bg-slate-100 text-slate-600'
                                    }`}
                                  >
                                    {goal.status === 'achieved' ? 'Atteint' : goal.status === 'in_progress' ? 'En cours' : 'Non débuté'}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* TAB 3: NOTES DE SUIVI & ADDENDA (IMMUTABILITÉ LOI 25)            */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {activeTab === 'notes' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <FileText className="h-5 w-5 text-indigo-600" />
                  Notes Cliniques, Rencontres & Addenda (CAS-05)
                </h3>
                <p className="text-xs text-slate-500">
                  Règle d'intégrité Loi 25 : Les notes deviennent strictement immuables après 7 jours et ne peuvent être modifiées que par addenda.
                </p>
              </div>

              <Button
                onClick={() => {
                  setParentNoteId(undefined);
                  setShowNoteModal(true);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
              >
                <Plus className="h-4 w-4 mr-1.5" /> Consigner une nouvelle note
              </Button>
            </div>

            {notes.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-400 space-y-3 shadow-sm">
                <FileText className="h-10 w-10 text-slate-300 mx-auto" />
                <p className="text-sm font-medium">Aucune note de suivi consignée pour ce dossier.</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Enregistrez les comptes-rendus de rencontres, appels téléphoniques ou bilans d'évaluation.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {notes
                  .filter((n: any) => !n.parentNoteId)
                  .map((note: any) => {
                    const addenda = notes.filter((sub: any) => sub.parentNoteId === note.id);
                    return (
                      <div key={note.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-indigo-700 uppercase font-mono text-[10px] px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200">
                              {note.noteType === 'meeting'
                                ? 'Rencontre en personne'
                                : note.noteType === 'phone_call'
                                ? 'Entretien téléphonique'
                                : note.noteType === 'home_visit'
                                ? 'Visite à domicile'
                                : note.noteType === 'assessment'
                                ? 'Évaluation'
                                : 'Autre intervention'}
                            </span>
                            <span className="text-xs font-bold text-slate-800">
                              Par {note.author ? `${note.author.firstName} ${note.author.lastName}` : 'Intervenant'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-slate-400 font-mono">
                              {new Date(note.createdAt).toLocaleString('fr-CA')}
                            </span>
                            {note.isEditable ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                <Clock className="h-3 w-3" /> Édition libre (J-7)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                <Lock className="h-3 w-3" /> Immuable (Loi 25)
                              </span>
                            )}
                          </div>
                        </div>

                        <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">{note.content}</p>

                        <div className="flex justify-end pt-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-[11px] border-slate-200"
                            onClick={() => {
                              setParentNoteId(note.id);
                              setShowNoteModal(true);
                            }}
                          >
                            <Plus className="h-3 w-3 mr-1" /> Ajouter un addendum officiel
                          </Button>
                        </div>

                        {/* Addenda list */}
                        {addenda.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-slate-100 space-y-2 pl-4 border-l-2 border-indigo-400">
                            <span className="text-[10px] font-mono uppercase font-bold text-indigo-700 block">
                              Addenda & Avenants officiels :
                            </span>
                            {addenda.map((sub: any) => (
                              <div key={sub.id} className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1 text-xs">
                                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                                  <span>Addendum par {sub.author ? `${sub.author.firstName} ${sub.author.lastName}` : 'Intervenant'}</span>
                                  <span>{new Date(sub.createdAt).toLocaleString('fr-CA')}</span>
                                </div>
                                <p className="text-slate-800">{sub.content}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* TAB 4: AIGUILLAGES & RÉFÉRENCES EXTERNES                        */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {activeTab === 'referrals' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Share2 className="h-5 w-5 text-indigo-600" />
                  Aiguillages & Références Externes (CAS-06)
                </h3>
                <p className="text-xs text-slate-500">
                  Orientation du bénéficiaire vers des ressources communautaires, CLSC, services d'emploi ou partenaires.
                </p>
              </div>

              <Button onClick={() => setShowReferralModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs">
                <Plus className="h-4 w-4 mr-1.5" /> Nouvelle Référence Externe
              </Button>
            </div>

            {referrals.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-400 space-y-3 shadow-sm">
                <Share2 className="h-10 w-10 text-slate-300 mx-auto" />
                <p className="text-sm font-medium">Aucune référence externe enregistrée.</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Enregistrez les démarches d'orientation vers des organismes spécialisés partenaires.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {referrals.map((refItem: any) => (
                  <div key={refItem.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <h4 className="font-bold text-slate-900 text-sm">{refItem.organizationName}</h4>
                      <select
                        value={refItem.status}
                        onChange={(e) => updateReferralMutation.mutate({ referralId: refItem.id, payload: { status: e.target.value } })}
                        className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-semibold text-slate-700"
                      >
                        <option value="pending">En attente</option>
                        <option value="accepted">Accepté</option>
                        <option value="rejected">Refusé</option>
                        <option value="completed">Complété</option>
                      </select>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div>
                        <span className="text-slate-400 text-[11px] block">Service ciblé :</span>
                        <span className="font-semibold text-indigo-700">{refItem.serviceType}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px] block">Motif de référence :</span>
                        <p className="text-slate-700">{refItem.reason}</p>
                      </div>
                      {(refItem.contactPerson || refItem.contactPhone) && (
                        <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                          Contact : {refItem.contactPerson} {refItem.contactPhone ? `(${refItem.contactPhone})` : ''}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* TAB 5: AUDIT & BRIS DE GLACE                                    */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {activeTab === 'audit' && (
          <div className="space-y-6">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <History className="h-5 w-5 text-indigo-600" />
                Journal d'Audit & Accès Exceptionnels « Bris de Glace » (CAS-08)
              </h3>
              <p className="text-xs text-slate-500">
                Traçabilité immuable de tous les accès d'urgence réalisés sur ce dossier restreint (Conformité Loi 25).
              </p>
            </div>

            {breakGlassLogs.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-400 space-y-3 shadow-sm">
                <ShieldCheck className="h-10 w-10 text-emerald-500 mx-auto" />
                <p className="text-sm font-medium text-slate-800">Aucun accès d'urgence exceptionnel.</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Tous les accès à ce dossier ont été effectués dans le cadre normal des assignations de l'équipe.
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 uppercase font-mono text-[11px] text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="px-5 py-3">Date & Heure</th>
                      <th className="px-5 py-3">Intervenant</th>
                      <th className="px-5 py-3">Motif Explicite Fourni</th>
                      <th className="px-5 py-3 text-right">Statut Audit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {breakGlassLogs.map((log: any) => (
                      <tr key={log.id} className="hover:bg-slate-50">
                        <td className="px-5 py-3 font-mono text-slate-700">
                          {new Date(log.accessedAt).toLocaleString('fr-CA')}
                        </td>
                        <td className="px-5 py-3 font-bold text-slate-900">
                          {log.user ? `${log.user.firstName} ${log.user.lastName}` : log.userId}
                        </td>
                        <td className="px-5 py-3 text-slate-800 italic">"{log.reason}"</td>
                        <td className="px-5 py-3 text-right">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            <AlertTriangle className="h-3 w-3" /> Journalisé Loi 25
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Modal Consigner Note */}
        {showNoteModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-indigo-600" />
                  {parentNoteId ? 'Ajouter un Addendum Officiel' : 'Consigner une Note Clinique'}
                </h3>
                <button onClick={() => setShowNoteModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  addNoteMutation.mutate({
                    noteType,
                    content: noteContent,
                    parentNoteId,
                  });
                }}
                className="space-y-4 text-xs"
              >
                {!parentNoteId && (
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Type d'intervention</label>
                    <select
                      value={noteType}
                      onChange={(e) => setNoteType(e.target.value as any)}
                      className="w-full h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-800"
                    >
                      <option value="meeting">Rencontre en personne</option>
                      <option value="phone_call">Entretien téléphonique</option>
                      <option value="home_visit">Visite à domicile</option>
                      <option value="assessment">Évaluation / Bilan</option>
                      <option value="other">Autre intervention</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    {parentNoteId ? 'Contenu de l’addendum *' : 'Observations & Compte-rendu *'}
                  </label>
                  <textarea
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    rows={5}
                    required
                    placeholder="Saisissez les faits observés, les démarches convenues..."
                    className="w-full rounded-lg border border-slate-300 p-3 text-xs text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button type="button" variant="outline" onClick={() => setShowNoteModal(false)}>
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                    disabled={addNoteMutation.isPending}
                  >
                    {addNoteMutation.isPending ? 'Enregistrement...' : 'Enregistrer la note'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Nouveau Plan */}
        {showPlanModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Target className="h-5 w-5 text-indigo-600" />
                  Nouveau Plan d'Intervention
                </h3>
                <button onClick={() => setShowPlanModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  createPlanMutation.mutate({
                    title: planTitle,
                    description: planDescription || undefined,
                    startDate: planStartDate || undefined,
                    reviewDate: planReviewDate || undefined,
                    status: 'active',
                  });
                }}
                className="space-y-4 text-xs"
              >
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Titre du plan *</label>
                  <Input
                    value={planTitle}
                    onChange={(e) => setPlanTitle(e.target.value)}
                    placeholder="Ex: Plan d'accompagnement vers l'emploi"
                    required
                    className="text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Description / Objectif global</label>
                  <textarea
                    value={planDescription}
                    onChange={(e) => setPlanDescription(e.target.value)}
                    rows={3}
                    placeholder="Contexte et finalité du plan..."
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Date de début</label>
                    <Input
                      type="date"
                      value={planStartDate}
                      onChange={(e) => setPlanStartDate(e.target.value)}
                      className="text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Date de révision</label>
                    <Input
                      type="date"
                      value={planReviewDate}
                      onChange={(e) => setPlanReviewDate(e.target.value)}
                      className="text-xs"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button type="button" variant="outline" onClick={() => setShowPlanModal(false)}>
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                    disabled={createPlanMutation.isPending}
                  >
                    {createPlanMutation.isPending ? 'Création...' : 'Créer le plan'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Ajouter Objectif SMART */}
        {showGoalModal && selectedPlanIdForGoal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-indigo-600" />
                  Ajouter un Objectif SMART
                </h3>
                <button onClick={() => setShowGoalModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  addGoalMutation.mutate({
                    planId: selectedPlanIdForGoal,
                    payload: {
                      title: goalTitle,
                      description: goalDescription || undefined,
                      targetDate: goalTargetDate || undefined,
                      status: 'in_progress',
                    },
                  });
                }}
                className="space-y-4 text-xs"
              >
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Objectif SMART *</label>
                  <Input
                    value={goalTitle}
                    onChange={(e) => setGoalTitle(e.target.value)}
                    placeholder="Ex: Rédiger un CV québécois et postuler à 3 offres"
                    required
                    className="text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Échéance cible</label>
                  <Input
                    type="date"
                    value={goalTargetDate}
                    onChange={(e) => setGoalTargetDate(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button type="button" variant="outline" onClick={() => setShowGoalModal(false)}>
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                    disabled={addGoalMutation.isPending}
                  >
                    {addGoalMutation.isPending ? 'Ajout...' : 'Ajouter l’objectif'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Assigner Intervenant */}
        {showAssignModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-indigo-600" />
                  Assigner un Membre à l'Équipe
                </h3>
                <button onClick={() => setShowAssignModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!assignUserId) return;
                  assignWorkerMutation.mutate({
                    userId: assignUserId,
                    role: assignRole,
                  });
                }}
                className="space-y-4 text-xs"
              >
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Intervenant / Collaborateur *</label>
                  <select
                    value={assignUserId}
                    onChange={(e) => setAssignUserId(e.target.value)}
                    required
                    className="w-full h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-800"
                  >
                    <option value="">-- Choisir un intervenant --</option>
                    {staffWithAccounts.map((s: any) => (
                      <option key={s.staff.userId} value={s.staff.userId}>
                        {s.firstName} {s.lastName} ({s.staff.jobTitle || 'Membre'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Rôle sur le dossier</label>
                  <select
                    value={assignRole}
                    onChange={(e) => setAssignRole(e.target.value as any)}
                    className="w-full h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-800"
                  >
                    <option value="co_worker">Co-intervenant (Lecture & Écriture)</option>
                    <option value="supervisor">Superviseur Clinique</option>
                    <option value="primary_worker">Intervenant Principal</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button type="button" variant="outline" onClick={() => setShowAssignModal(false)}>
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                    disabled={assignWorkerMutation.isPending}
                  >
                    {assignWorkerMutation.isPending ? 'Assignation...' : 'Assigner'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Nouvelle Référence Externe */}
        {showReferralModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Share2 className="h-5 w-5 text-indigo-600" />
                  Nouvelle Référence Externe (Aiguillage)
                </h3>
                <button onClick={() => setShowReferralModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  createReferralMutation.mutate({
                    organizationName: refOrgName,
                    serviceType: refServiceType,
                    contactPerson: refContactPerson || undefined,
                    contactPhone: refContactPhone || undefined,
                    contactEmail: refContactEmail || undefined,
                    reason: refReason,
                    status: 'pending',
                  });
                }}
                className="space-y-4 text-xs"
              >
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Organisme partenaire destinataire *</label>
                  <Input
                    value={refOrgName}
                    onChange={(e) => setRefOrgName(e.target.value)}
                    placeholder="Ex: Centre d'intégration jeunesse / CLSC"
                    required
                    className="text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Type de service visé *</label>
                  <Input
                    value={refServiceType}
                    onChange={(e) => setRefServiceType(e.target.value)}
                    placeholder="Ex: Soutien au logement, aide alimentaire..."
                    required
                    className="text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Motif de l'orientation *</label>
                  <textarea
                    value={refReason}
                    onChange={(e) => setRefReason(e.target.value)}
                    rows={3}
                    required
                    placeholder="Expliquez la situation et le besoin du bénéficiaire..."
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Personne-ressource</label>
                    <Input
                      value={refContactPerson}
                      onChange={(e) => setRefContactPerson(e.target.value)}
                      placeholder="Ex: Marie Gagnon"
                      className="text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Téléphone de contact</label>
                    <Input
                      value={refContactPhone}
                      onChange={(e) => setRefContactPhone(e.target.value)}
                      placeholder="514-555-0188"
                      className="text-xs"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button type="button" variant="outline" onClick={() => setShowReferralModal(false)}>
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                    disabled={createReferralMutation.isPending}
                  >
                    {createReferralMutation.isPending ? 'Enregistrement...' : 'Enregistrer la référence'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
