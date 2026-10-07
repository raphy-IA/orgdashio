import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Badge, Button, Input } from '@orgdashio/ui';
import {
  ShieldCheck,
  Building,
  Building2,
  Users,
  Database,
  Lock,
  Activity,
  Server,
  AlertTriangle,
  FileCheck2,
  RefreshCw,
  Search,
  Power,
  Settings,
  Key,
  FolderKanban,
  GraduationCap,
  ShieldAlert,
  FileText,
  Phone,
  Mail,
  Globe,
  Calendar,
  X,
  Check,
  Pencil,
  Trash2,
  HelpCircle,
  LifeBuoy,
  ExternalLink,
  ChevronRight,
  Filter,
  Clock,
  HeartHandshake,
  Briefcase,
  UserCheck,
  UserX,
  Layers,
  ArrowRightLeft,
  DollarSign,
  TrendingUp,
  Award,
} from 'lucide-react';
import { PlatformNavbar } from '../../components/PlatformNavbar';

export function PlatformDashboardScreen() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Primary navigation tabs
  const [activeTab, setActiveTab] = useState<'overview' | 'explorer' | 'clients' | 'support'>('explorer');

  // Client search & filter for Table Tab
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [modeFilter, setModeFilter] = useState<'all' | 'shared' | 'dedicated' | 'self_hosted'>('all');

  // Selected Tenant for Explorer & 360° Management
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [explorerSubTab, setExplorerSubTab] = useState<
    'overview' | 'projects' | 'staff' | 'cases' | 'trainings' | 'users' | 'settings' | 'support'
  >('overview');

  // Staff type filter inside Explorer
  const [staffTypeFilter, setStaffTypeFilter] = useState<'all' | 'employee' | 'volunteer' | 'board_member'>('all');

  // Tenant Edit Form State
  const [editName, setEditName] = useState('');
  const [editAcronym, setEditAcronym] = useState('');
  const [editOrgType, setEditOrgType] = useState('');
  const [editNeq, setEditNeq] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editWebsite, setEditWebsite] = useState('');
  const [editLogoUrl, setEditLogoUrl] = useState('');
  const [editPrivacyOfficerName, setEditPrivacyOfficerName] = useState('');
  const [editPrivacyOfficerEmail, setEditPrivacyOfficerEmail] = useState('');
  const [editDataRetention, setEditDataRetention] = useState<number>(60);
  const [editMode, setEditMode] = useState<'shared' | 'dedicated' | 'self_hosted'>('shared');
  const [editStatus, setEditStatus] = useState<'active' | 'suspended'>('active');

  // Staff Edit State
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [editStaffJobTitle, setEditStaffJobTitle] = useState('');
  const [editStaffType, setEditStaffType] = useState<'employee' | 'volunteer' | 'board_member' | 'contractor' | 'intern'>('employee');
  const [editStaffStatus, setEditStaffStatus] = useState<'active' | 'on_leave' | 'inactive' | 'archived'>('active');
  const [editStaffDeptId, setEditStaffDeptId] = useState<string>('');

  // Support Grant Form
  const [supportReason, setSupportReason] = useState('');
  const [supportDuration, setSupportDuration] = useState(60);
  const [supportFeedback, setSupportFeedback] = useState<string | null>(null);

  // 1. Fetch All Tenants with Metrics
  const { data: tenants = [], isLoading, refetch } = useQuery({
    queryKey: ['platform-tenants'],
    queryFn: async () => {
      const res = await fetch('/api/v1/platform/tenants', {
        headers: { 'x-platform-admin': 'true' },
      });
      if (!res.ok) throw new Error('Erreur console super-admin');
      return res.json();
    },
  });

  // Auto-select first tenant if none selected
  React.useEffect(() => {
    if (!selectedTenantId && tenants.length > 0) {
      setSelectedTenantId(tenants[0].id);
    }
  }, [tenants, selectedTenantId]);

  // 2. Fetch Selected Tenant Full 360° Details
  const { data: tenantDetails, isLoading: isDetailsLoading } = useQuery({
    queryKey: ['platform-tenant-details', selectedTenantId],
    queryFn: async () => {
      if (!selectedTenantId) return null;
      const res = await fetch(`/api/v1/platform/tenants/${selectedTenantId}`, {
        headers: { 'x-platform-admin': 'true' },
      });
      if (!res.ok) throw new Error('Erreur chargement détails client');
      return res.json();
    },
    enabled: !!selectedTenantId,
  });

  // When tenantDetails is loaded, initialize edit form
  React.useEffect(() => {
    if (tenantDetails?.tenant) {
      const t = tenantDetails.tenant;
      setEditName(t.name || '');
      setEditAcronym(t.acronym || '');
      setEditOrgType(t.orgType || 'OBNL / NPO (Organisme à but non lucratif)');
      setEditNeq(t.neqNumber || '');
      setEditDescription(t.description || '');
      setEditEmail(t.email || '');
      setEditPhone(t.phone || '');
      setEditAddress(t.address || '');
      setEditWebsite(t.website || '');
      setEditLogoUrl(t.logoUrl || '');
      setEditPrivacyOfficerName(t.privacyOfficerName || '');
      setEditPrivacyOfficerEmail(t.privacyOfficerEmail || '');
      setEditDataRetention(t.dataRetentionMonths || 60);
      setEditMode(t.mode || 'shared');
      setEditStatus(t.status || 'active');
      setSupportFeedback(null);
    }
  }, [tenantDetails]);

  // Mutations
  const updateTenantMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch(`/api/v1/platform/tenants/${selectedTenantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-platform-admin': 'true' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Erreur mise à jour');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-tenants'] });
      queryClient.invalidateQueries({ queryKey: ['platform-tenant-details', selectedTenantId] });
      alert('Paramètres de l\'organisme client mis à jour avec succès !');
    },
  });

  const toggleTenantStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'active' | 'suspended' }) => {
      const res = await fetch(`/api/v1/platform/tenants/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-platform-admin': 'true' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Erreur changement statut tenant');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-tenants'] });
      queryClient.invalidateQueries({ queryKey: ['platform-tenant-details', selectedTenantId] });
    },
  });

  const toggleUserStatusMutation = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: 'active' | 'suspended' }) => {
      const res = await fetch(`/api/v1/platform/tenants/${selectedTenantId}/users/${userId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-platform-admin': 'true' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Erreur changement statut utilisateur');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-tenant-details', selectedTenantId] });
    },
  });

  const updateStaffMutation = useMutation({
    mutationFn: async ({ partyId, updates }: { partyId: string; updates: any }) => {
      const res = await fetch(`/api/v1/platform/tenants/${selectedTenantId}/staff/${partyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-platform-admin': 'true' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Erreur mise à jour collaborateur');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-tenant-details', selectedTenantId] });
      queryClient.invalidateQueries({ queryKey: ['platform-tenants'] });
      setEditingStaffId(null);
    },
  });

  const grantSupportMutation = useMutation({
    mutationFn: async ({ reason, durationMinutes }: { reason: string; durationMinutes: number }) => {
      const res = await fetch(`/api/v1/platform/tenants/${selectedTenantId}/support-access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-platform-admin': 'true' },
        body: JSON.stringify({ reason, durationMinutes }),
      });
      if (!res.ok) throw new Error('Erreur octroi accès support');
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['platform-tenant-details', selectedTenantId] });
      setSupportFeedback(`Accès d'urgence activé avec succès jusqu'au ${new Date(data.expiresAt).toLocaleTimeString()} (enregistré dans le journal d'audit Loi 25).`);
      setSupportReason('');
    },
  });

  const switchTenantMutation = useMutation({
    mutationFn: async (targetTenantId: string) => {
      const res = await fetch('/api/v1/auth/switch-tenant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId: targetTenantId }),
      });
      if (!res.ok) throw new Error('Erreur de bascule de session');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      navigate('/dashboard');
    },
  });

  // Global KPIs
  const activeTenants = tenants.filter((t: any) => t.status === 'active').length;
  const suspendedTenants = tenants.filter((t: any) => t.status === 'suspended').length;
  const totalRegisteredUsers = tenants.reduce((acc: number, t: any) => acc + (t.metrics?.totalUsers || 0), 0);
  const totalRegisteredStaff = tenants.reduce((acc: number, t: any) => acc + (t.metrics?.totalStaff || 0), 0);
  const totalVolunteers = tenants.reduce((acc: number, t: any) => acc + (t.metrics?.totalVolunteers || 0), 0);
  const totalProjects = tenants.reduce((acc: number, t: any) => acc + (t.metrics?.totalProjects || 0), 0);

  // Filtered tenants list for Table Tab
  const filteredTenants = tenants.filter((t: any) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (modeFilter !== 'all' && t.mode !== modeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const name = (t.name || '').toLowerCase();
      const slug = (t.slug || '').toLowerCase();
      const email = (t.email || '').toLowerCase();
      const neq = (t.neqNumber || '').toLowerCase();
      return name.includes(q) || slug.includes(q) || email.includes(q) || neq.includes(q);
    }
    return true;
  });

  const currentSelectedTenant = tenants.find((t: any) => t.id === selectedTenantId) || tenantDetails?.tenant;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <PlatformNavbar />

      <main className="mx-auto max-w-7xl w-full p-4 sm:p-6 space-y-6 flex-1">
        {/* Header */}
        <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10">
            <div>
              <div className="flex items-center space-x-2 text-amber-400 text-xs font-mono font-bold uppercase tracking-wider mb-1">
                <ShieldCheck className="h-4 w-4" />
                <span>Console Super-Admin SaaS • Control Plane</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Administration Globale & Contrôle des Clients
              </h1>
              <p className="mt-1 text-sm text-slate-400 max-w-2xl">
                Supervisez, configurez et inspectez l'intégralité des éléments par client (projets, personnel, bénévoles, usagers, formations et paramètres).
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 text-xs"
              >
                <RefreshCw className="mr-1.5 h-3.5 w-3.5 text-amber-400" />
                Actualiser
              </Button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 space-x-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('explorer')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition shrink-0 ${
              activeTab === 'explorer'
                ? 'border-amber-400 text-amber-400 bg-slate-900/80 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 className="h-4 w-4 text-amber-400" />
            Explorateur 360° par Organisme Client
          </button>
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition shrink-0 ${
              activeTab === 'overview'
                ? 'border-amber-400 text-amber-400 bg-slate-900/80 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="h-4 w-4" />
            Vue Globale & Santé Plateforme
          </button>
          <button
            onClick={() => setActiveTab('clients')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition shrink-0 ${
              activeTab === 'clients'
                ? 'border-amber-400 text-amber-400 bg-slate-900/80 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="h-4 w-4 text-indigo-400" />
            Tableau des Comptes ({tenants.length})
          </button>
          <button
            onClick={() => setActiveTab('support')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition shrink-0 ${
              activeTab === 'support'
                ? 'border-amber-400 text-amber-400 bg-slate-900/80 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="h-4 w-4 text-emerald-400" />
            Sécurité, RLS & Support Loi 25
          </button>
        </div>

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* TAB 1: EXPLORATEUR PAR CLIENT (VUE 360° & ÉLÉMENTS VISIBLES)      */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        {activeTab === 'explorer' && (
          <div className="space-y-6">
            {/* Top Selector Bar: Client Selection & Direct Action Buttons */}
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                  <Building2 className="h-5 w-5" />
                </div>
                <div className="flex-1 max-w-md">
                  <label className="text-[11px] font-mono uppercase text-slate-400 font-bold block mb-1">
                    Sélectionner l'organisme client à inspecter & piloter :
                  </label>
                  <select
                    value={selectedTenantId || ''}
                    onChange={(e) => setSelectedTenantId(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-bold text-white focus:border-amber-400 focus:outline-none"
                  >
                    {tenants.map((t: any) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.slug}) • {t.status === 'active' ? '✅ Actif' : '⏸️ Suspendu'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {currentSelectedTenant && (
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={currentSelectedTenant.status === 'active' ? 'success' : 'secondary'}>
                    {currentSelectedTenant.status === 'active' ? 'Compte Actif' : 'Compte Suspendu'}
                  </Badge>
                  <Badge variant="default" className="uppercase font-mono text-[10px]">
                    Mode : {currentSelectedTenant.mode || 'shared'}
                  </Badge>

                  {/* Switch Session Button */}
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                    onClick={() => {
                      if (selectedTenantId) switchTenantMutation.mutate(selectedTenantId);
                    }}
                    disabled={switchTenantMutation.isPending}
                  >
                    <ArrowRightLeft className="mr-1.5 h-3.5 w-3.5" />
                    {switchTenantMutation.isPending ? 'Bascule en cours...' : "Basculer sur l'espace client"}
                  </Button>

                  {/* Suspend / Activate toggle */}
                  <Button
                    size="sm"
                    variant="outline"
                    className={`text-xs border-slate-700 font-semibold ${
                      currentSelectedTenant.status === 'active'
                        ? 'text-red-400 hover:bg-red-950/40 hover:border-red-600'
                        : 'text-emerald-400 hover:bg-emerald-950/40 hover:border-emerald-600'
                    }`}
                    onClick={() => {
                      if (selectedTenantId) {
                        const newStatus = currentSelectedTenant.status === 'active' ? 'suspended' : 'active';
                        if (confirm(`Confirmez-vous le passage du compte "${currentSelectedTenant.name}" au statut ${newStatus} ?`)) {
                          toggleTenantStatusMutation.mutate({ id: selectedTenantId, status: newStatus });
                        }
                      }
                    }}
                  >
                    <Power className="mr-1.5 h-3.5 w-3.5" />
                    {currentSelectedTenant.status === 'active' ? 'Suspendre le client' : 'Réactiver le client'}
                  </Button>
                </div>
              )}
            </div>

            {/* Selected Client Sub-Tabs */}
            <div className="flex border-b border-slate-800 space-x-1 overflow-x-auto">
              <button
                onClick={() => setExplorerSubTab('overview')}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition shrink-0 ${
                  explorerSubTab === 'overview'
                    ? 'border-indigo-400 text-indigo-400 bg-slate-900/90 rounded-t'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Activity className="h-3.5 w-3.5" />
                Vue d'ensemble & KPIs
              </button>
              <button
                onClick={() => setExplorerSubTab('projects')}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition shrink-0 ${
                  explorerSubTab === 'projects'
                    ? 'border-indigo-400 text-indigo-400 bg-slate-900/90 rounded-t'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <FolderKanban className="h-3.5 w-3.5 text-amber-400" />
                Projets & WBS ({tenantDetails?.projects?.length || 0})
              </button>
              <button
                onClick={() => setExplorerSubTab('staff')}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition shrink-0 ${
                  explorerSubTab === 'staff'
                    ? 'border-indigo-400 text-indigo-400 bg-slate-900/90 rounded-t'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Users className="h-3.5 w-3.5 text-emerald-400" />
                Personnel & Bénévoles ({tenantDetails?.staff?.length || 0})
              </button>
              <button
                onClick={() => setExplorerSubTab('cases')}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition shrink-0 ${
                  explorerSubTab === 'cases'
                    ? 'border-indigo-400 text-indigo-400 bg-slate-900/90 rounded-t'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
                Dossiers Usagers ({tenantDetails?.cases?.length || 0})
              </button>
              <button
                onClick={() => setExplorerSubTab('trainings')}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition shrink-0 ${
                  explorerSubTab === 'trainings'
                    ? 'border-indigo-400 text-indigo-400 bg-slate-900/90 rounded-t'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <GraduationCap className="h-3.5 w-3.5 text-purple-400" />
                Formations ({tenantDetails?.trainings?.length || 0})
              </button>
              <button
                onClick={() => setExplorerSubTab('users')}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition shrink-0 ${
                  explorerSubTab === 'users'
                    ? 'border-indigo-400 text-indigo-400 bg-slate-900/90 rounded-t'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Key className="h-3.5 w-3.5 text-cyan-400" />
                Comptes Utilisateurs ({tenantDetails?.users?.length || 0})
              </button>
              <button
                onClick={() => setExplorerSubTab('settings')}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition shrink-0 ${
                  explorerSubTab === 'settings'
                    ? 'border-indigo-400 text-indigo-400 bg-slate-900/90 rounded-t'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Settings className="h-3.5 w-3.5 text-slate-300" />
                Paramètres & Logo
              </button>
              <button
                onClick={() => setExplorerSubTab('support')}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition shrink-0 ${
                  explorerSubTab === 'support'
                    ? 'border-indigo-400 text-indigo-400 bg-slate-900/90 rounded-t'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Lock className="h-3.5 w-3.5 text-red-400" />
                Accès Support Loi 25
              </button>
            </div>

            {/* Sub-tab 1: Vue d'ensemble */}
            {explorerSubTab === 'overview' && (
              <div className="space-y-6">
                {/* 8 Granular KPI Cards for this Client */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                    <div className="flex items-center justify-between text-slate-400 text-xs font-mono uppercase">
                      <span>Salariés</span>
                      <Briefcase className="h-4 w-4 text-blue-400" />
                    </div>
                    <div className="mt-2 text-2xl font-bold text-white">
                      {tenantDetails?.metrics?.totalEmployees || 0}
                    </div>
                    <div className="text-[11px] text-slate-400">Contrats employés</div>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                    <div className="flex items-center justify-between text-slate-400 text-xs font-mono uppercase">
                      <span>Bénévoles</span>
                      <HeartHandshake className="h-4 w-4 text-emerald-400" />
                    </div>
                    <div className="mt-2 text-2xl font-bold text-emerald-400">
                      {tenantDetails?.metrics?.totalVolunteers || 0}
                    </div>
                    <div className="text-[11px] text-slate-400">Bénévoles inscrits</div>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                    <div className="flex items-center justify-between text-slate-400 text-xs font-mono uppercase">
                      <span>Projets WBS</span>
                      <FolderKanban className="h-4 w-4 text-amber-400" />
                    </div>
                    <div className="mt-2 text-2xl font-bold text-amber-400">
                      {tenantDetails?.metrics?.totalProjects || 0}
                    </div>
                    <div className="text-[11px] text-slate-400">Portefeuille projets</div>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                    <div className="flex items-center justify-between text-slate-400 text-xs font-mono uppercase">
                      <span>Dossiers Usagers</span>
                      <ShieldAlert className="h-4 w-4 text-rose-400" />
                    </div>
                    <div className="mt-2 text-2xl font-bold text-rose-400">
                      {tenantDetails?.metrics?.totalCases || 0}
                    </div>
                    <div className="text-[11px] text-slate-400">Cas & bénéficiaires</div>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                    <div className="flex items-center justify-between text-slate-400 text-xs font-mono uppercase">
                      <span>Formations</span>
                      <GraduationCap className="h-4 w-4 text-purple-400" />
                    </div>
                    <div className="mt-2 text-2xl font-bold text-purple-400">
                      {tenantDetails?.metrics?.totalTrainings || 0}
                    </div>
                    <div className="text-[11px] text-slate-400">Sessions planifiées</div>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                    <div className="flex items-center justify-between text-slate-400 text-xs font-mono uppercase">
                      <span>Utilisateurs</span>
                      <UserCheck className="h-4 w-4 text-cyan-400" />
                    </div>
                    <div className="mt-2 text-2xl font-bold text-cyan-400">
                      {tenantDetails?.metrics?.activeUsers || 0} / {tenantDetails?.metrics?.totalUsers || 0}
                    </div>
                    <div className="text-[11px] text-slate-400">Comptes actifs</div>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                    <div className="flex items-center justify-between text-slate-400 text-xs font-mono uppercase">
                      <span>Documents</span>
                      <FileText className="h-4 w-4 text-slate-300" />
                    </div>
                    <div className="mt-2 text-2xl font-bold text-white">
                      {tenantDetails?.metrics?.totalDocuments || 0}
                    </div>
                    <div className="text-[11px] text-slate-400">GED sécurisée</div>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                    <div className="flex items-center justify-between text-slate-400 text-xs font-mono uppercase">
                      <span>Consentements</span>
                      <FileCheck2 className="h-4 w-4 text-indigo-400" />
                    </div>
                    <div className="mt-2 text-2xl font-bold text-indigo-400">
                      {tenantDetails?.metrics?.totalConsents || 0}
                    </div>
                    <div className="text-[11px] text-slate-400">Conformité Loi 25</div>
                  </div>
                </div>

                {/* Identity & Legal Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
                    <h3 className="font-bold text-white text-sm flex items-center gap-2 border-b border-slate-800 pb-3">
                      <Building className="h-4 w-4 text-amber-400" />
                      Fiche d'Identité & Coordonnées Client
                    </h3>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-slate-800/60">
                        <span className="text-slate-400">Raison Sociale :</span>
                        <span className="font-semibold text-white">{tenantDetails?.tenant?.name}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-800/60">
                        <span className="text-slate-400">Acronyme :</span>
                        <span className="font-semibold text-slate-200">{tenantDetails?.tenant?.acronym || 'Non défini'}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-800/60">
                        <span className="text-slate-400">Type d'entité :</span>
                        <span className="font-semibold text-slate-200">{tenantDetails?.tenant?.orgType || 'OBNL'}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-800/60">
                        <span className="text-slate-400">Numéro NEQ (Québec) :</span>
                        <span className="font-mono text-amber-300 font-semibold">{tenantDetails?.tenant?.neqNumber || 'Non renseigné'}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-800/60">
                        <span className="text-slate-400">Courriel contact :</span>
                        <span className="font-semibold text-slate-200">{tenantDetails?.tenant?.email || 'Non renseigné'}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-800/60">
                        <span className="text-slate-400">Téléphone :</span>
                        <span className="font-semibold text-slate-200">{tenantDetails?.tenant?.phone || 'Non renseigné'}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-400">Adresse :</span>
                        <span className="font-semibold text-slate-200">{tenantDetails?.tenant?.address || 'Non renseignée'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
                    <h3 className="font-bold text-white text-sm flex items-center gap-2 border-b border-slate-800 pb-3">
                      <ShieldCheck className="h-4 w-4 text-emerald-400" />
                      Gouvernance Loi 25 & Paramètres SaaS
                    </h3>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-slate-800/60">
                        <span className="text-slate-400">Responsable Protection PRP (DPO) :</span>
                        <span className="font-semibold text-white">{tenantDetails?.tenant?.privacyOfficerName || 'Non assigné'}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-800/60">
                        <span className="text-slate-400">Courriel PRP dédié :</span>
                        <span className="font-semibold text-slate-200">{tenantDetails?.tenant?.privacyOfficerEmail || 'Non assigné'}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-800/60">
                        <span className="text-slate-400">Durée conservation données :</span>
                        <span className="font-semibold text-indigo-300">{tenantDetails?.tenant?.dataRetentionMonths || 60} mois</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-800/60">
                        <span className="text-slate-400">Mode d'hébergement :</span>
                        <Badge variant="default" className="uppercase font-mono text-[10px]">{tenantDetails?.tenant?.mode}</Badge>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-400">Créé le :</span>
                        <span className="font-mono text-slate-300">
                          {tenantDetails?.tenant?.createdAt ? new Date(tenantDetails.tenant.createdAt).toLocaleDateString() : '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sub-tab 2: Projets du client */}
            {explorerSubTab === 'projects' && (
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-lg space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <FolderKanban className="h-5 w-5 text-amber-400" />
                    <h3 className="font-bold text-white text-base">Portefeuille de Projets de l'Organisme</h3>
                  </div>
                  <Badge variant="default">{tenantDetails?.projects?.length || 0} Projet(s)</Badge>
                </div>

                {!tenantDetails?.projects || tenantDetails.projects.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-sm">
                    Aucun projet n'a encore été créé pour cet organisme.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-950 uppercase font-mono text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="px-4 py-3">Code & Projet</th>
                          <th className="px-4 py-3">Statut</th>
                          <th className="px-4 py-3">Budget Financement</th>
                          <th className="px-4 py-3">Avancement WBS</th>
                          <th className="px-4 py-3">Tâches</th>
                          <th className="px-4 py-3">Créé le</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {tenantDetails.projects.map((p: any) => (
                          <tr key={p.id} className="hover:bg-slate-800/40 transition">
                            <td className="px-4 py-3">
                              <div className="font-bold text-white">{p.name}</div>
                              <span className="font-mono text-amber-400 text-[11px]">{p.code}</span>
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant={p.status === 'active' ? 'success' : 'secondary'} className="text-[10px]">
                                {p.status}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 font-semibold text-emerald-400">
                              {Number(p.totalBudget || 0).toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
                            </td>
                            <td className="px-4 py-3 min-w-[140px]">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-amber-400 rounded-full"
                                    style={{ width: `${Math.min(100, p.avgProgressPct || 0)}%` }}
                                  />
                                </div>
                                <span className="font-mono font-bold text-white text-[11px]">{p.avgProgressPct || 0}%</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 font-mono text-slate-300">
                              {p.completedTasks || 0} / {p.taskCount || 0} finies
                            </td>
                            <td className="px-4 py-3 text-slate-400">
                              {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Sub-tab 3: Personnel & Bénévoles du client */}
            {explorerSubTab === 'staff' && (
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-lg space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-emerald-400" />
                    <h3 className="font-bold text-white text-base">Annuaire du Personnel & Bénévoles</h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-300">Type :</span>
                    <select
                      value={staffTypeFilter}
                      onChange={(e) => setStaffTypeFilter(e.target.value as any)}
                      className="rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs font-medium text-slate-200"
                    >
                      <option value="all">Tous les profils ({tenantDetails?.staff?.length || 0})</option>
                      <option value="employee">Salariés / Employés</option>
                      <option value="volunteer">Bénévoles</option>
                      <option value="board_member">Conseil d'administration</option>
                    </select>
                  </div>
                </div>

                {/* Staff Table */}
                {!tenantDetails?.staff || tenantDetails.staff.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-sm">
                    Aucun collaborateur ni bénévole n'a été enregistré pour cet organisme.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-950 uppercase font-mono text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="px-4 py-3">Nom & Coordonnées</th>
                          <th className="px-4 py-3">Poste / Fonction</th>
                          <th className="px-4 py-3">Type Contrat</th>
                          <th className="px-4 py-3">Département</th>
                          <th className="px-4 py-3">Statut</th>
                          <th className="px-4 py-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {tenantDetails.staff
                          .filter((s: any) => staffTypeFilter === 'all' || s.employmentType === staffTypeFilter)
                          .map((s: any) => (
                            <tr key={s.id} className="hover:bg-slate-800/40 transition">
                              <td className="px-4 py-3">
                                <div className="font-bold text-white">
                                  {s.party ? `${s.party.firstName || ''} ${s.party.lastName || ''}` : 'Sans nom'}
                                </div>
                                <div className="text-[11px] text-slate-400">{s.party?.email || s.party?.phone || '—'}</div>
                              </td>
                              <td className="px-4 py-3 font-medium text-slate-200">{s.jobTitle}</td>
                              <td className="px-4 py-3">
                                <Badge
                                  variant={
                                    s.employmentType === 'volunteer'
                                      ? 'success'
                                      : s.employmentType === 'employee'
                                      ? 'default'
                                      : 'secondary'
                                  }
                                  className="text-[10px]"
                                >
                                  {s.employmentType === 'volunteer'
                                    ? 'Bénévole'
                                    : s.employmentType === 'employee'
                                    ? 'Salarié'
                                    : s.employmentType === 'board_member'
                                    ? 'C.A.'
                                    : s.employmentType}
                                </Badge>
                              </td>
                              <td className="px-4 py-3 text-slate-400">{s.department?.name || 'Général'}</td>
                              <td className="px-4 py-3">
                                <span
                                  className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                    s.status === 'active'
                                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                      : 'bg-slate-800 text-slate-400'
                                  }`}
                                >
                                  {s.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-xs text-amber-400 hover:text-amber-300 hover:bg-slate-800"
                                  onClick={() => {
                                    setEditingStaffId(s.partyId);
                                    setEditStaffJobTitle(s.jobTitle || '');
                                    setEditStaffType(s.employmentType || 'employee');
                                    setEditStaffStatus(s.status || 'active');
                                    setEditStaffDeptId(s.departmentId || '');
                                  }}
                                >
                                  <Pencil className="h-3.5 w-3.5 mr-1" />
                                  Modifier
                                </Button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Inline Staff Edit Drawer */}
                {editingStaffId && (
                  <div className="rounded-xl border border-amber-500/30 bg-slate-950 p-4 space-y-3 mt-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="font-bold text-amber-400 text-xs flex items-center gap-1.5">
                        <Pencil className="h-3.5 w-3.5" />
                        Modifier la fiche de ce collaborateur (Action Super-Admin)
                      </span>
                      <button onClick={() => setEditingStaffId(null)} className="text-slate-400 hover:text-white">
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="text-[11px] font-mono text-slate-400 block mb-1">Poste / Fonction</label>
                        <Input
                          value={editStaffJobTitle}
                          onChange={(e) => setEditStaffJobTitle(e.target.value)}
                          className="h-8 text-xs bg-slate-900 border-slate-700"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-mono text-slate-400 block mb-1">Type de statut</label>
                        <select
                          value={editStaffType}
                          onChange={(e) => setEditStaffType(e.target.value as any)}
                          className="w-full h-8 rounded-lg border border-slate-700 bg-slate-900 px-2 text-xs text-slate-200"
                        >
                          <option value="employee">Salarié / Employé</option>
                          <option value="volunteer">Bénévole</option>
                          <option value="board_member">Membre du Conseil (C.A.)</option>
                          <option value="contractor">Prestataire / Consultant</option>
                          <option value="intern">Stagiaire</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] font-mono text-slate-400 block mb-1">Statut d'activité</label>
                        <select
                          value={editStaffStatus}
                          onChange={(e) => setEditStaffStatus(e.target.value as any)}
                          className="w-full h-8 rounded-lg border border-slate-700 bg-slate-900 px-2 text-xs text-slate-200"
                        >
                          <option value="active">Actif</option>
                          <option value="on_leave">En congé</option>
                          <option value="inactive">Inactif</option>
                          <option value="archived">Archivé</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] font-mono text-slate-400 block mb-1">Département</label>
                        <select
                          value={editStaffDeptId}
                          onChange={(e) => setEditStaffDeptId(e.target.value)}
                          className="w-full h-8 rounded-lg border border-slate-700 bg-slate-900 px-2 text-xs text-slate-200"
                        >
                          <option value="">(Aucun / Général)</option>
                          {tenantDetails?.departments?.map((d: any) => (
                            <option key={d.id} value={d.id}>
                              {d.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <Button size="sm" variant="ghost" className="text-xs" onClick={() => setEditingStaffId(null)}>
                        Annuler
                      </Button>
                      <Button
                        size="sm"
                        className="bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400"
                        onClick={() => {
                          updateStaffMutation.mutate({
                            partyId: editingStaffId,
                            updates: {
                              jobTitle: editStaffJobTitle,
                              employmentType: editStaffType,
                              status: editStaffStatus,
                              departmentId: editStaffDeptId || null,
                            },
                          });
                        }}
                      >
                        Enregistrer modifications
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Sub-tab 4: Dossiers Usagers / Cas */}
            {explorerSubTab === 'cases' && (
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-lg space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5 text-rose-400" />
                    <h3 className="font-bold text-white text-base">Dossiers & Usagers Pris en Charge</h3>
                  </div>
                  <Badge variant="default">{tenantDetails?.cases?.length || 0} Dossier(s)</Badge>
                </div>

                {!tenantDetails?.cases || tenantDetails.cases.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-sm">
                    Aucun dossier usager n'a encore été ouvert dans cet organisme.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-950 uppercase font-mono text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="px-4 py-3">Numéro & Titre</th>
                          <th className="px-4 py-3">Bénéficiaire / Usager</th>
                          <th className="px-4 py-3">Intervenant Principal</th>
                          <th className="px-4 py-3">Confidentialité</th>
                          <th className="px-4 py-3">Statut</th>
                          <th className="px-4 py-3">Ouvert le</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {tenantDetails.cases.map((c: any) => (
                          <tr key={c.id} className="hover:bg-slate-800/40 transition">
                            <td className="px-4 py-3">
                              <div className="font-bold text-white">{c.title}</div>
                              <span className="font-mono text-rose-400 text-[11px]">{c.caseNumber}</span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-semibold text-slate-200">
                                {c.beneficiary ? `${c.beneficiary.firstName || ''} ${c.beneficiary.lastName || ''}` : 'Anonyme'}
                              </div>
                              <div className="text-[11px] text-slate-400">{c.beneficiary?.email || c.beneficiary?.phone || ''}</div>
                            </td>
                            <td className="px-4 py-3 text-slate-300">
                              {c.primaryWorker ? `${c.primaryWorker.firstName || ''} ${c.primaryWorker.lastName || ''}` : 'Non assigné'}
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant="secondary" className="text-[10px] uppercase font-mono">
                                {c.confidentialityLevel}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant={c.status === 'active' || c.status === 'open' ? 'success' : 'secondary'} className="text-[10px]">
                                {c.status}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-slate-400">
                              {c.openedAt ? new Date(c.openedAt).toLocaleDateString() : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Sub-tab 5: Formations */}
            {explorerSubTab === 'trainings' && (
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-lg space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-purple-400" />
                    <h3 className="font-bold text-white text-base">Sessions de Formation & Cours</h3>
                  </div>
                  <Badge variant="default">{tenantDetails?.trainings?.length || 0} Session(s)</Badge>
                </div>

                {!tenantDetails?.trainings || tenantDetails.trainings.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-sm">
                    Aucune session de formation n'a été planifiée pour cet organisme.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-950 uppercase font-mono text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="px-4 py-3">Titre de la session</th>
                          <th className="px-4 py-3">Programme</th>
                          <th className="px-4 py-3">Dates</th>
                          <th className="px-4 py-3">Capacité</th>
                          <th className="px-4 py-3">Statut</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {tenantDetails.trainings.map((tr: any) => (
                          <tr key={tr.id} className="hover:bg-slate-800/40 transition">
                            <td className="px-4 py-3 font-bold text-white">{tr.title}</td>
                            <td className="px-4 py-3 text-purple-300">{tr.program?.name || 'Formation autonome'}</td>
                            <td className="px-4 py-3 text-slate-400">
                              {tr.startDate ? new Date(tr.startDate).toLocaleDateString() : '—'} au{' '}
                              {tr.endDate ? new Date(tr.endDate).toLocaleDateString() : '—'}
                            </td>
                            <td className="px-4 py-3 font-mono text-slate-200">{tr.capacity || 20} places</td>
                            <td className="px-4 py-3">
                              <Badge variant={tr.status === 'open' || tr.status === 'in_progress' ? 'success' : 'secondary'} className="text-[10px]">
                                {tr.status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Sub-tab 6: Utilisateurs & Droits */}
            {explorerSubTab === 'users' && (
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-lg space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Key className="h-5 w-5 text-cyan-400" />
                    <h3 className="font-bold text-white text-base">Comptes Utilisateurs Informatiques & Rôles</h3>
                  </div>
                  <Badge variant="default">{tenantDetails?.users?.length || 0} Compte(s)</Badge>
                </div>

                {!tenantDetails?.users || tenantDetails.users.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-sm">
                    Aucun compte utilisateur n'est rattaché à cet organisme.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-950 uppercase font-mono text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="px-4 py-3">Utilisateur</th>
                          <th className="px-4 py-3">Courriel de connexion</th>
                          <th className="px-4 py-3">Rôles attribués</th>
                          <th className="px-4 py-3">Statut du Compte</th>
                          <th className="px-4 py-3 text-right">Contrôle Accès</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {tenantDetails.users.map((u: any) => (
                          <tr key={u.membershipId} className="hover:bg-slate-800/40 transition">
                            <td className="px-4 py-3">
                              <div className="font-bold text-white">
                                {u.user?.firstName || u.user?.lastName ? `${u.user.firstName || ''} ${u.user.lastName || ''}` : 'Utilisateur'}
                              </div>
                              <div className="text-[11px] text-slate-400">{u.user?.jobTitle || 'Membre'}</div>
                            </td>
                            <td className="px-4 py-3 font-mono text-cyan-300">{u.user?.email}</td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-1">
                                {u.roles.map((r: any) => (
                                  <Badge key={r.id} variant="secondary" className="text-[10px]">
                                    {r.name}
                                  </Badge>
                                ))}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant={u.user?.status === 'active' ? 'success' : 'secondary'} className="text-[10px]">
                                {u.user?.status === 'active' ? 'Actif' : 'Suspendu'}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-right">
                              {u.user && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className={`text-[11px] border-slate-700 ${
                                    u.user.status === 'active'
                                      ? 'text-red-400 hover:bg-red-950/40 hover:border-red-500'
                                      : 'text-emerald-400 hover:bg-emerald-950/40 hover:border-emerald-500'
                                  }`}
                                  onClick={() => {
                                    const nextStatus = u.user.status === 'active' ? 'suspended' : 'active';
                                    toggleUserStatusMutation.mutate({ userId: u.user.id, status: nextStatus });
                                  }}
                                >
                                  {u.user.status === 'active' ? (
                                    <>
                                      <UserX className="h-3 w-3 mr-1" />
                                      Suspendre
                                    </>
                                  ) : (
                                    <>
                                      <UserCheck className="h-3 w-3 mr-1" />
                                      Activer
                                    </>
                                  )}
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Sub-tab 7: Paramètres & Logo Client */}
            {explorerSubTab === 'settings' && (
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-lg space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-amber-400" />
                    <h3 className="font-bold text-white text-base">Configuration & Profil de l'Organisme Client</h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">Nom légal de l'organisme</label>
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="bg-slate-950 border-slate-700 text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">Acronyme / Sigle</label>
                    <Input
                      value={editAcronym}
                      onChange={(e) => setEditAcronym(e.target.value)}
                      className="bg-slate-950 border-slate-700 text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">Type d'entité</label>
                    <Input
                      value={editOrgType}
                      onChange={(e) => setEditOrgType(e.target.value)}
                      className="bg-slate-950 border-slate-700 text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">Numéro NEQ (Québec)</label>
                    <Input
                      value={editNeq}
                      onChange={(e) => setEditNeq(e.target.value)}
                      className="bg-slate-950 border-slate-700 text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">Courriel officiel</label>
                    <Input
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="bg-slate-950 border-slate-700 text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">Téléphone officiel</label>
                    <Input
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="bg-slate-950 border-slate-700 text-slate-100"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">Adresse postale complète</label>
                    <Input
                      value={editAddress}
                      onChange={(e) => setEditAddress(e.target.value)}
                      className="bg-slate-950 border-slate-700 text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">Site Web</label>
                    <Input
                      value={editWebsite}
                      onChange={(e) => setEditWebsite(e.target.value)}
                      className="bg-slate-950 border-slate-700 text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">URL du Logo (White-Label)</label>
                    <Input
                      value={editLogoUrl}
                      onChange={(e) => setEditLogoUrl(e.target.value)}
                      className="bg-slate-950 border-slate-700 text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">Responsable Protection PRP (Loi 25)</label>
                    <Input
                      value={editPrivacyOfficerName}
                      onChange={(e) => setEditPrivacyOfficerName(e.target.value)}
                      className="bg-slate-950 border-slate-700 text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">Courriel PRP Loi 25</label>
                    <Input
                      value={editPrivacyOfficerEmail}
                      onChange={(e) => setEditPrivacyOfficerEmail(e.target.value)}
                      className="bg-slate-950 border-slate-700 text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">Rétention des données (Mois)</label>
                    <Input
                      type="number"
                      value={editDataRetention}
                      onChange={(e) => setEditDataRetention(Number(e.target.value))}
                      className="bg-slate-950 border-slate-700 text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">Mode d'hébergement SaaS</label>
                    <select
                      value={editMode}
                      onChange={(e) => setEditMode(e.target.value as any)}
                      className="w-full h-9 rounded-lg border border-slate-700 bg-slate-950 px-3 text-xs text-slate-200"
                    >
                      <option value="shared">Shared (Multi-tenant standard)</option>
                      <option value="dedicated">Dedicated (Schéma isolé)</option>
                      <option value="self_hosted">Self-Hosted (Déploiement sur site)</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-800">
                  <Button
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
                    onClick={() => {
                      updateTenantMutation.mutate({
                        name: editName,
                        acronym: editAcronym,
                        orgType: editOrgType,
                        neqNumber: editNeq,
                        description: editDescription,
                        email: editEmail,
                        phone: editPhone,
                        address: editAddress,
                        website: editWebsite,
                        logoUrl: editLogoUrl,
                        privacyOfficerName: editPrivacyOfficerName,
                        privacyOfficerEmail: editPrivacyOfficerEmail,
                        dataRetentionMonths: editDataRetention,
                        mode: editMode,
                      });
                    }}
                    disabled={updateTenantMutation.isPending}
                  >
                    {updateTenantMutation.isPending ? 'Enregistrement...' : 'Enregistrer tous les paramètres du client'}
                  </Button>
                </div>
              </div>
            )}

            {/* Sub-tab 8: Accès Support Break-Glass */}
            {explorerSubTab === 'support' && (
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-lg space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                  <Lock className="h-5 w-5 text-red-400" />
                  <h3 className="font-bold text-white text-base">Accès Support d'Urgence & Audit Loi 25</h3>
                </div>

                <p className="text-xs text-slate-400">
                  Permet à un Super-Admin de débloquer temporairement un accès de dépannage avec consignation obligatoire dans le journal d'audit conformément à la Loi 25.
                </p>

                {supportFeedback && (
                  <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                    <Check className="h-4 w-4 shrink-0" />
                    {supportFeedback}
                  </div>
                )}

                <div className="space-y-3 max-w-xl">
                  <div>
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">
                      Justification obligatoire (Audit Loi 25)
                    </label>
                    <Input
                      value={supportReason}
                      onChange={(e) => setSupportReason(e.target.value)}
                      placeholder="Ex: Demande de support ticket #4092 - incident synchronisation"
                      className="bg-slate-950 border-slate-700 text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">Durée de l'accès (minutes)</label>
                    <select
                      value={supportDuration}
                      onChange={(e) => setSupportDuration(Number(e.target.value))}
                      className="w-full h-9 rounded-lg border border-slate-700 bg-slate-950 px-3 text-xs text-slate-200"
                    >
                      <option value={30}>30 minutes</option>
                      <option value={60}>1 heure (Recommandé)</option>
                      <option value={120}>2 heures</option>
                      <option value={240}>4 heures</option>
                    </select>
                  </div>

                  <Button
                    className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs"
                    disabled={!supportReason.trim() || grantSupportMutation.isPending}
                    onClick={() => {
                      grantSupportMutation.mutate({
                        reason: supportReason,
                        durationMinutes: supportDuration,
                      });
                    }}
                  >
                    {grantSupportMutation.isPending ? 'Activation...' : "Activer l'accès support Loi 25"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* TAB 2: VUE GLOBALE DU SAAS                                        */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-400 uppercase">Organismes Clients</span>
                  <div className="rounded-lg bg-indigo-500/10 p-2 text-indigo-400 border border-indigo-500/20">
                    <Building className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <div className="text-2xl font-bold text-white">{tenants.length}</div>
                  <Badge variant="default" className="text-[10px]">{activeTenants} Actifs / {suspendedTenants} Suspendus</Badge>
                </div>
                <p className="mt-2 text-xs text-slate-400 flex items-center">
                  <Activity className="mr-1 h-3.5 w-3.5 text-emerald-400" />
                  Multi-tenant prêt pour la mise à l'échelle
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-400 uppercase">Effectifs & Utilisateurs</span>
                  <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400 border border-emerald-500/20">
                    <Users className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <div className="text-2xl font-bold text-white">{totalRegisteredStaff} Membres</div>
                  <Badge variant="default" className="text-[10px]">{totalVolunteers} Bénévoles</Badge>
                </div>
                <p className="mt-2 text-xs text-slate-400 flex items-center">
                  <UserCheck className="mr-1 h-3.5 w-3.5 text-blue-400" />
                  {totalRegisteredUsers} comptes informatiques actifs
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-400 uppercase">Activité Opérationnelle</span>
                  <div className="rounded-lg bg-amber-500/10 p-2 text-amber-400 border border-amber-500/20">
                    <FolderKanban className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <div className="text-2xl font-bold text-amber-400">{totalProjects} Projets</div>
                  <Badge variant="success" className="text-[10px]">WBS Rollup Actif</Badge>
                </div>
                <p className="mt-2 text-xs text-slate-400 flex items-center">
                  <Check className="mr-1 h-3.5 w-3.5 text-emerald-400" />
                  Gestion de projets & budgets temps réel
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-400 uppercase">Isolation RLS & Loi 25</span>
                  <div className="rounded-lg bg-purple-500/10 p-2 text-purple-400 border border-purple-500/20">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <div className="text-2xl font-bold text-emerald-400">100% Étanchéité</div>
                  <Badge variant="default" className="text-[10px]">RLS Multi-Tenant</Badge>
                </div>
                <p className="mt-2 text-xs text-slate-400 flex items-center">
                  <Lock className="mr-1 h-3.5 w-3.5 text-purple-400" />
                  Zéro fuite inter-organismes certifiée
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* TAB 3: TABLEAU DE TOUS LES COMPTES CLIENTS                         */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        {activeTab === 'clients' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-sm">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-slate-400" />
                  <span className="text-xs font-bold text-slate-300">Statut :</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs font-medium text-slate-200"
                  >
                    <option value="all">Tous les statuts ({tenants.length})</option>
                    <option value="active">Actifs uniquement ({activeTenants})</option>
                    <option value="suspended">Suspendus uniquement ({suspendedTenants})</option>
                  </select>
                </div>
              </div>

              <div className="w-80">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher par nom, slug, email, NEQ..."
                  className="h-9 text-xs bg-slate-950 border-slate-700 text-slate-100"
                />
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900 shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-950 text-xs font-mono uppercase text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="px-6 py-3.5">Organisme Client</th>
                      <th className="px-6 py-3.5">Identifiant / Slug</th>
                      <th className="px-6 py-3.5">Statut</th>
                      <th className="px-6 py-3.5">Membres / Bénévoles</th>
                      <th className="px-6 py-3.5">Projets</th>
                      <th className="px-6 py-3.5 text-right">Actions Super-Admin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredTenants.map((t: any) => (
                      <tr key={t.id} className="hover:bg-slate-800/40 transition">
                        <td className="px-6 py-4">
                          <div className="font-bold text-white">{t.name}</div>
                          <div className="text-xs text-slate-400">{t.email || t.phone || 'Non renseigné'}</div>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-indigo-400">{t.slug}</td>
                        <td className="px-6 py-4">
                          <Badge variant={t.status === 'active' ? 'success' : 'secondary'}>
                            {t.status === 'active' ? 'Actif' : 'Suspendu'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-xs">
                          <span className="font-semibold text-white">{t.metrics?.totalStaff || 0}</span> membres
                          <span className="text-slate-400"> ({t.metrics?.totalVolunteers || 0} bénév.)</span>
                        </td>
                        <td className="px-6 py-4 font-semibold text-amber-400 text-xs">
                          {t.metrics?.totalProjects || 0}
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <Button
                            size="sm"
                            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs"
                            onClick={() => {
                              setSelectedTenantId(t.id);
                              setActiveTab('explorer');
                              setExplorerSubTab('overview');
                            }}
                          >
                            Inspecter 360°
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* TAB 4: SÉCURITÉ & LOI 25                                          */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        {activeTab === 'support' && (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-lg space-y-4">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              Politique d'Isolation des Données & Conformité Loi 25
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
              OrgDashio applique des politiques strictes de sécurité multi-tenant (RLS PostgreSQL). Chaque organisme possède ses données de manière hermétique. Les accès d'administration plateforme s'effectuent via les jetons de session d'audit journalisés.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
