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
  Link2,
  Unlink,
  Sparkles,
  UserPlus,
  Radio,
  Sliders,
  BellRing,
  HardDrive,
  Cpu,
  Receipt,
  PlusCircle,
  CheckCircle2,
  AlertOctagon,
  Eye,
  FileSpreadsheet,
} from 'lucide-react';
import { PlatformNavbar } from '../../components/PlatformNavbar';

export function PlatformDashboardScreen() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Primary navigation tabs
  const [activeTab, setActiveTab] = useState<
    'explorer' | 'financials' | 'provisioning' | 'feature_flags' | 'observability' | 'security_audit' | 'announcements'
  >('explorer');

  // Client search & filter for Table Tab
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [modeFilter, setModeFilter] = useState<'all' | 'shared' | 'dedicated' | 'self_hosted'>('all');

  // Selected Tenant for Explorer & 360° Management
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [explorerSubTab, setExplorerSubTab] = useState<
    'overview' | 'quotas' | 'projects' | 'staff' | 'beneficiaries' | 'cases' | 'trainings' | 'users' | 'invoices' | 'settings' | 'support'
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

  // Quotas & Plan Override State
  const [overridePlanCode, setOverridePlanCode] = useState('starter');
  const [overrideCycle, setOverrideCycle] = useState<'monthly' | 'annual'>('monthly');
  const [overrideSeatCount, setOverrideSeatCount] = useState<number>(5);
  const [overrideMaxUsers, setOverrideMaxUsers] = useState<string>('');
  const [overrideMaxStorage, setOverrideMaxStorage] = useState<string>('');
  const [overrideMaxProjects, setOverrideMaxProjects] = useState<string>('');
  const [overrideModules, setOverrideModules] = useState<string[]>([]);
  const [quotaFeedback, setQuotaFeedback] = useState<string | null>(null);

  // Staff Edit State
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [editStaffJobTitle, setEditStaffJobTitle] = useState('');
  const [editStaffType, setEditStaffType] = useState<'employee' | 'volunteer' | 'board_member' | 'contractor' | 'intern'>('employee');
  const [editStaffStatus, setEditStaffStatus] = useState<'active' | 'on_leave' | 'inactive' | 'archived'>('active');
  const [editStaffDeptId, setEditStaffDeptId] = useState<string>('');

  // User Edit State & Modal
  const [editingUserItem, setEditingUserItem] = useState<any | null>(null);
  const [editUserFirstName, setEditUserFirstName] = useState('');
  const [editUserLastName, setEditUserLastName] = useState('');
  const [editUserEmail, setEditUserEmail] = useState('');
  const [editUserPhone, setEditUserPhone] = useState('');
  const [editUserJobTitle, setEditUserJobTitle] = useState('');
  const [editUserRoles, setEditUserRoles] = useState<string[]>([]);
  const [editUserPassword, setEditUserPassword] = useState('');
  const [editUserStatus, setEditUserStatus] = useState<'active' | 'suspended'>('active');
  const [linkStaffMode, setLinkStaffMode] = useState<'new' | 'existing'>('new');
  const [selectedExistingPartyId, setSelectedExistingPartyId] = useState<string>('');
  const [newStaffType, setNewStaffType] = useState<'employee' | 'volunteer' | 'contractor' | 'board_member'>('employee');
  const [newStaffDeptId, setNewStaffDeptId] = useState<string>('');
  const [userActionFeedback, setUserActionFeedback] = useState<string | null>(null);

  // Support Grant Form
  const [supportReason, setSupportReason] = useState('');
  const [supportDuration, setSupportDuration] = useState(60);
  const [supportFeedback, setSupportFeedback] = useState<string | null>(null);

  // Provisioning Wizard State
  const [provStep, setProvStep] = useState<1 | 2 | 3>(1);
  const [provName, setProvName] = useState('');
  const [provSlug, setProvSlug] = useState('');
  const [provAcronym, setProvAcronym] = useState('');
  const [provOrgType, setProvOrgType] = useState('OBNL / NPO (Organisme à but non lucratif)');
  const [provNeq, setProvNeq] = useState('');
  const [provEmail, setProvEmail] = useState('');
  const [provPhone, setProvPhone] = useState('');
  const [provAddress, setProvAddress] = useState('');
  const [provWebsite, setProvWebsite] = useState('');
  const [provMode, setProvMode] = useState<'shared' | 'dedicated' | 'self_hosted'>('shared');
  const [provPlanCode, setProvPlanCode] = useState<'community' | 'starter' | 'pro' | 'enterprise'>('starter');
  const [provBillingCycle, setProvBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [provAdminFirstName, setProvAdminFirstName] = useState('');
  const [provAdminLastName, setProvAdminLastName] = useState('');
  const [provAdminEmail, setProvAdminEmail] = useState('');
  const [provAdminPassword, setProvAdminPassword] = useState('OrgDashio@2026!');
  const [provAdminJobTitle, setProvAdminJobTitle] = useState('Direction Générale');
  const [provPrivacyOfficerName, setProvPrivacyOfficerName] = useState('');
  const [provPrivacyOfficerEmail, setProvPrivacyOfficerEmail] = useState('');
  const [provRetentionMonths, setProvRetentionMonths] = useState(60);
  const [provSuccessFeedback, setProvSuccessFeedback] = useState<string | null>(null);

  // Announcement Form State
  const [annTitle, setAnnTitle] = useState('');
  const [annMessage, setAnnMessage] = useState('');
  const [annSeverity, setAnnSeverity] = useState<'info' | 'warning' | 'critical'>('info');
  const [annTargetTenant, setAnnTargetTenant] = useState<string>('');
  const [annFeedback, setAnnFeedback] = useState<string | null>(null);

  // Security Incident Form State
  const [incidentModalOpen, setIncidentModalOpen] = useState(false);
  const [incTitle, setIncTitle] = useState('');
  const [incDescription, setIncDescription] = useState('');
  const [incSeverity, setIncSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('high');
  const [incTenantId, setIncTenantId] = useState<string>('');
  const [incImpactedCount, setIncImpactedCount] = useState<number>(0);
  const [incContainment, setIncContainment] = useState('');
  const [incNotifiedCai, setIncNotifiedCai] = useState(false);
  const [incCaiRef, setIncCaiRef] = useState('');
  const [incidentFeedback, setIncidentFeedback] = useState<string | null>(null);

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

  // 3. Fetch Financial Cockpit
  const { data: financials, refetch: refetchFinancials } = useQuery({
    queryKey: ['platform-financials'],
    queryFn: async () => {
      const res = await fetch('/api/v1/platform/financials', {
        headers: { 'x-platform-admin': 'true' },
      });
      if (!res.ok) throw new Error('Erreur chargement cockpit financier');
      return res.json();
    },
    enabled: activeTab === 'financials',
  });

  // 4. Fetch Observability & Telemetry
  const { data: telemetry, refetch: refetchTelemetry } = useQuery({
    queryKey: ['platform-telemetry'],
    queryFn: async () => {
      const res = await fetch('/api/v1/platform/system/health', {
        headers: { 'x-platform-admin': 'true' },
      });
      if (!res.ok) throw new Error('Erreur télémétrie système');
      return res.json();
    },
    enabled: activeTab === 'observability',
  });

  // 5. Fetch Feature Flags
  const { data: featureFlagsData, refetch: refetchFeatureFlags } = useQuery({
    queryKey: ['platform-feature-flags'],
    queryFn: async () => {
      const res = await fetch('/api/v1/platform/feature-flags', {
        headers: { 'x-platform-admin': 'true' },
      });
      if (!res.ok) throw new Error('Erreur feature flags');
      return res.json();
    },
    enabled: activeTab === 'feature_flags',
  });

  // 6. Fetch Audit Logs & Security Incidents
  const { data: auditLogs = [], refetch: refetchAuditLogs } = useQuery({
    queryKey: ['platform-audit-logs'],
    queryFn: async () => {
      const res = await fetch('/api/v1/platform/audit-logs?limit=40', {
        headers: { 'x-platform-admin': 'true' },
      });
      if (!res.ok) throw new Error('Erreur audit logs');
      return res.json();
    },
    enabled: activeTab === 'security_audit',
  });

  const { data: securityIncidents = [], refetch: refetchIncidents } = useQuery({
    queryKey: ['platform-security-incidents'],
    queryFn: async () => {
      const res = await fetch('/api/v1/platform/security-incidents', {
        headers: { 'x-platform-admin': 'true' },
      });
      if (!res.ok) throw new Error('Erreur incidents sécurité');
      return res.json();
    },
    enabled: activeTab === 'security_audit',
  });

  // 7. Fetch Announcements
  const { data: announcements = [], refetch: refetchAnnouncements } = useQuery({
    queryKey: ['platform-announcements'],
    queryFn: async () => {
      const res = await fetch('/api/v1/platform/announcements', {
        headers: { 'x-platform-admin': 'true' },
      });
      if (!res.ok) throw new Error('Erreur annonces');
      return res.json();
    },
    enabled: activeTab === 'announcements',
  });

  // 8. Fetch Invoices for selected tenant in Explorer
  const { data: tenantInvoices = [], refetch: refetchTenantInvoices } = useQuery({
    queryKey: ['platform-tenant-invoices', selectedTenantId],
    queryFn: async () => {
      if (!selectedTenantId) return [];
      const res = await fetch(`/api/v1/platform/tenants/${selectedTenantId}/invoices`, {
        headers: { 'x-platform-admin': 'true' },
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!selectedTenantId && activeTab === 'explorer' && explorerSubTab === 'invoices',
  });

  // When tenantDetails is loaded, initialize edit forms & quotas
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

      setOverrideMaxUsers(t.maxUsersOverride !== null && t.maxUsersOverride !== undefined ? String(t.maxUsersOverride) : '');
      setOverrideMaxStorage(t.maxStorageGbOverride !== null && t.maxStorageGbOverride !== undefined ? String(t.maxStorageGbOverride) : '');
      setOverrideMaxProjects(t.maxProjectsOverride !== null && t.maxProjectsOverride !== undefined ? String(t.maxProjectsOverride) : '');
      setOverrideModules(t.allowedModules || ['projects', 'staff', 'beneficiaries', 'cases', 'trainings', 'grants', 'timesheets']);
      setSupportFeedback(null);
      setQuotaFeedback(null);
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

  const updateQuotasMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch(`/api/v1/platform/tenants/${selectedTenantId}/plan`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-platform-admin': 'true' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Erreur mise à jour quotas/forfait');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-tenants'] });
      queryClient.invalidateQueries({ queryKey: ['platform-tenant-details', selectedTenantId] });
      setQuotaFeedback('Forfait et quotas sur-mesure enregistrés avec succès !');
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

  const purgeTenantMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/v1/platform/tenants/${id}/purge`, {
        method: 'DELETE',
        headers: { 'x-platform-admin': 'true' },
      });
      if (!res.ok) throw new Error('Erreur purge client');
      return res.json();
    },
    onSuccess: (data) => {
      alert(data.message || 'Organisme purgé avec succès.');
      queryClient.invalidateQueries({ queryKey: ['platform-tenants'] });
      setSelectedTenantId(null);
    },
  });

  const provisionTenantMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch('/api/v1/platform/tenants/provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-platform-admin': 'true' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Erreur lors du provisioning');
      }
      return res.json();
    },
    onSuccess: (newTenant) => {
      setProvSuccessFeedback(`L'organisme "${newTenant.name}" a été provisionné avec succès avec son administrateur principal !`);
      queryClient.invalidateQueries({ queryKey: ['platform-tenants'] });
      setSelectedTenantId(newTenant.id);
      setTimeout(() => {
        setProvStep(1);
        setActiveTab('explorer');
        setProvSuccessFeedback(null);
      }, 2000);
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
      queryClient.invalidateQueries({ queryKey: ['platform-tenants'] });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, payload }: { userId: string; payload: any }) => {
      const res = await fetch(`/api/v1/platform/tenants/${selectedTenantId}/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-platform-admin': 'true' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Erreur lors de la mise à jour du compte');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-tenant-details', selectedTenantId] });
      queryClient.invalidateQueries({ queryKey: ['platform-tenants'] });
      setUserActionFeedback('Compte utilisateur et permissions mis à jour avec succès !');
      setEditingUserItem(null);
    },
  });

  const linkStaffMutation = useMutation({
    mutationFn: async ({ userId, payload }: { userId: string; payload: any }) => {
      const res = await fetch(`/api/v1/platform/tenants/${selectedTenantId}/users/${userId}/link-staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-platform-admin': 'true' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Erreur liaison');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-tenant-details', selectedTenantId] });
      queryClient.invalidateQueries({ queryKey: ['platform-tenants'] });
      setUserActionFeedback('Liaison avec la fiche du personnel effectuée avec succès !');
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

  const toggleFeatureFlagMutation = useMutation({
    mutationFn: async ({ key, isEnabled, tenantId }: { key: string; isEnabled: boolean; tenantId?: string }) => {
      const res = await fetch('/api/v1/platform/feature-flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-platform-admin': 'true' },
        body: JSON.stringify({ featureKey: key, isEnabled, tenantId: tenantId || null }),
      });
      if (!res.ok) throw new Error('Erreur flag');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-feature-flags'] });
    },
  });

  const createAnnouncementMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch('/api/v1/platform/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-platform-admin': 'true' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Erreur création annonce');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-announcements'] });
      setAnnTitle('');
      setAnnMessage('');
      setAnnFeedback('Bannière de communication diffusée avec succès !');
      setTimeout(() => setAnnFeedback(null), 3000);
    },
  });

  const deleteAnnouncementMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/v1/platform/announcements/${id}`, {
        method: 'DELETE',
        headers: { 'x-platform-admin': 'true' },
      });
      if (!res.ok) throw new Error('Erreur suppression annonce');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-announcements'] });
    },
  });

  const createIncidentMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch('/api/v1/platform/security-incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-platform-admin': 'true' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Erreur enregistrement incident');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-security-incidents'] });
      setIncidentModalOpen(false);
      setIncTitle('');
      setIncDescription('');
      setIncidentFeedback('Incident de sécurité enregistré et journalisé conformément à la Loi 25.');
      setTimeout(() => setIncidentFeedback(null), 4000);
    },
  });

  const currentSelectedTenant = tenants.find((t: any) => t.id === selectedTenantId) || tenantDetails?.tenant;

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*';
    let pwd = '';
    for (let i = 0; i < 14; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setEditUserPassword(pwd);
  };

  const handleOpenEditUser = (userItem: any) => {
    const u = userItem.user;
    setEditingUserItem(userItem);
    setEditUserFirstName(u?.firstName || '');
    setEditUserLastName(u?.lastName || '');
    setEditUserEmail(u?.email || '');
    setEditUserPhone(u?.phone || '');
    setEditUserJobTitle(u?.jobTitle || '');
    setEditUserRoles((userItem.roles || []).map((r: any) => r.name));
    setEditUserPassword('');
    setEditUserStatus(u?.status || 'active');
    setLinkStaffMode('new');
    setSelectedExistingPartyId('');
    setNewStaffType('employee');
    setNewStaffDeptId('');
    setUserActionFeedback(null);
  };

  const allAvailableModules = [
    { key: 'projects', name: 'Gestion de Projets & WBS', desc: 'Planification, budget et jalons' },
    { key: 'advanced_pm_evm', name: 'MOP Avancé (EVM, PERT, CPM)', desc: 'Courbe en S, chemin critique et jalons COPIL' },
    { key: 'staff', name: 'Personnel & Bénévoles RH', desc: 'Fiches collaborateurs, contrats et rôles' },
    { key: 'beneficiaries', name: 'Bénéficiaires & Dossiers Usagers', desc: 'Suivi social, notes évolutives et consentements' },
    { key: 'trainings', name: 'Formations & Inscriptions', desc: 'Catalogue, sessions et portail public' },
    { key: 'grants', name: 'Subventions & Bailleurs', desc: 'Conventions, échéances et reporting financier' },
    { key: 'timesheets', name: 'Feuilles de Temps Analytiques', desc: 'Saisie d’heures et ventilation multi-projets' },
    { key: 'donations', name: 'Dons & Reçus Fiscaux', desc: 'Collecte, reçus officiels d’impôt et campagnes' },
    { key: 'documents', name: 'GED Sécurisée & Loi 25', desc: 'Stockage chiffré et journal d’accès' },
  ];

  const handleToggleModule = (modKey: string) => {
    if (overrideModules.includes(modKey)) {
      setOverrideModules(overrideModules.filter((m) => m !== modKey));
    } else {
      setOverrideModules([...overrideModules, modKey]);
    }
  };

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
                <span>Console Fournisseur SaaS • Plan de Contrôle Global</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Centre de Pilotage SaaS & Exploitation
              </h1>
              <p className="mt-1 text-sm text-slate-400 max-w-3xl">
                Supervision 360° des organismes clients, cockpit financier MRR, gestion des quotas sur-mesure, feature flags, provisioning assisté et conformité Loi 25.
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  refetch();
                  refetchFinancials();
                  refetchTelemetry();
                  refetchFeatureFlags();
                }}
                className="bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 text-xs"
              >
                <RefreshCw className="mr-1.5 h-3.5 w-3.5 text-amber-400" />
                Actualiser
              </Button>
            </div>
          </div>
        </div>

        {/* 7 Core Control Plane Tabs */}
        <div className="flex border-b border-slate-800 space-x-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('explorer')}
            className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition shrink-0 ${
              activeTab === 'explorer'
                ? 'border-amber-400 text-amber-400 bg-slate-900/90 rounded-t-lg shadow'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 className="h-4 w-4 text-amber-400" />
            Explorateur 360° Client
          </button>
          <button
            onClick={() => setActiveTab('financials')}
            className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition shrink-0 ${
              activeTab === 'financials'
                ? 'border-emerald-400 text-emerald-400 bg-slate-900/90 rounded-t-lg shadow'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <DollarSign className="h-4 w-4 text-emerald-400" />
            Cockpit Financier & MRR
          </button>
          <button
            onClick={() => setActiveTab('provisioning')}
            className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition shrink-0 ${
              activeTab === 'provisioning'
                ? 'border-indigo-400 text-indigo-400 bg-slate-900/90 rounded-t-lg shadow'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <PlusCircle className="h-4 w-4 text-indigo-400" />
            Provisioning & Nouveau Client
          </button>
          <button
            onClick={() => setActiveTab('feature_flags')}
            className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition shrink-0 ${
              activeTab === 'feature_flags'
                ? 'border-purple-400 text-purple-400 bg-slate-900/90 rounded-t-lg shadow'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="h-4 w-4 text-purple-400" />
            Feature Flags & Modules
          </button>
          <button
            onClick={() => setActiveTab('observability')}
            className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition shrink-0 ${
              activeTab === 'observability'
                ? 'border-cyan-400 text-cyan-400 bg-slate-900/90 rounded-t-lg shadow'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <HardDrive className="h-4 w-4 text-cyan-400" />
            Observabilité & GED
          </button>
          <button
            onClick={() => setActiveTab('security_audit')}
            className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition shrink-0 ${
              activeTab === 'security_audit'
                ? 'border-rose-400 text-rose-400 bg-slate-900/90 rounded-t-lg shadow'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="h-4 w-4 text-rose-400" />
            Audit & Incidents Loi 25
          </button>
          <button
            onClick={() => setActiveTab('announcements')}
            className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition shrink-0 ${
              activeTab === 'announcements'
                ? 'border-amber-400 text-amber-400 bg-slate-900/90 rounded-t-lg shadow'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BellRing className="h-4 w-4 text-amber-400" />
            Bannières Système
          </button>
        </div>

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* PILIER 1 : EXPLORATEUR 360° CLIENT                                */}
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
                    {switchTenantMutation.isPending ? 'Bascule...' : "Basculer sur l'espace client"}
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
                    {currentSelectedTenant.status === 'active' ? 'Suspendre' : 'Réactiver'}
                  </Button>

                  {/* Decommission / Purge button */}
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs border-red-900/60 text-red-500 hover:bg-red-950 hover:text-red-400"
                    onClick={() => {
                      if (selectedTenantId) {
                        const confirmation = prompt(`⚠️ ATTENTION : Purge définitive Loi 25 !\nTapez "PURGER ${currentSelectedTenant.slug}" pour supprimer irréversiblement ce tenant et toutes ses données :`);
                        if (confirmation === `PURGER ${currentSelectedTenant.slug}`) {
                          purgeTenantMutation.mutate(selectedTenantId);
                        }
                      }
                    }}
                  >
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                    Purger (Loi 25)
                  </Button>
                </div>
              )}
            </div>

            {/* Selected Client Sub-Tabs */}
            <div className="flex border-b border-slate-800 space-x-1 overflow-x-auto">
              <button
                onClick={() => setExplorerSubTab('overview')}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition shrink-0 ${
                  explorerSubTab === 'overview'
                    ? 'border-indigo-400 text-indigo-400 bg-slate-900/90 rounded-t'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Activity className="h-3.5 w-3.5" />
                Vue 360° & KPIs
              </button>
              <button
                onClick={() => setExplorerSubTab('quotas')}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition shrink-0 ${
                  explorerSubTab === 'quotas'
                    ? 'border-indigo-400 text-indigo-400 bg-slate-900/90 rounded-t'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sliders className="h-3.5 w-3.5 text-amber-400" />
                Quotas & Forfait Sur-Mesure
              </button>
              <button
                onClick={() => setExplorerSubTab('projects')}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition shrink-0 ${
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
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition shrink-0 ${
                  explorerSubTab === 'staff'
                    ? 'border-indigo-400 text-indigo-400 bg-slate-900/90 rounded-t'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Users className="h-3.5 w-3.5 text-emerald-400" />
                Personnel & Bénévoles ({tenantDetails?.staff?.length || 0})
              </button>
              <button
                onClick={() => setExplorerSubTab('beneficiaries')}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition shrink-0 ${
                  explorerSubTab === 'beneficiaries'
                    ? 'border-indigo-400 text-indigo-400 bg-slate-900/90 rounded-t'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <HeartHandshake className="h-3.5 w-3.5 text-teal-400" />
                Bénéficiaires ({tenantDetails?.beneficiaries?.length || 0})
              </button>
              <button
                onClick={() => setExplorerSubTab('cases')}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition shrink-0 ${
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
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition shrink-0 ${
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
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition shrink-0 ${
                  explorerSubTab === 'users'
                    ? 'border-indigo-400 text-indigo-400 bg-slate-900/90 rounded-t'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Key className="h-3.5 w-3.5 text-cyan-400" />
                Comptes Utilisateurs ({tenantDetails?.users?.length || 0})
              </button>
              <button
                onClick={() => setExplorerSubTab('invoices')}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition shrink-0 ${
                  explorerSubTab === 'invoices'
                    ? 'border-indigo-400 text-indigo-400 bg-slate-900/90 rounded-t'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Receipt className="h-3.5 w-3.5 text-green-400" />
                Factures & Paiements
              </button>
              <button
                onClick={() => setExplorerSubTab('settings')}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition shrink-0 ${
                  explorerSubTab === 'settings'
                    ? 'border-indigo-400 text-indigo-400 bg-slate-900/90 rounded-t'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Settings className="h-3.5 w-3.5 text-slate-300" />
                Profil & Logo
              </button>
              <button
                onClick={() => setExplorerSubTab('support')}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition shrink-0 ${
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
                    <div className="text-[11px] text-slate-400">Bénévoles actifs</div>
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
                      <span>Documents GED</span>
                      <FileText className="h-4 w-4 text-slate-300" />
                    </div>
                    <div className="mt-2 text-2xl font-bold text-white">
                      {tenantDetails?.metrics?.totalDocuments || 0}
                    </div>
                    <div className="text-[11px] text-slate-400">Fichiers hébergés</div>
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
                        <span className="text-slate-400">Numéro NEQ (Québec) :</span>
                        <span className="font-mono text-amber-300 font-semibold">{tenantDetails?.tenant?.neqNumber || 'Non renseigné'}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-800/60">
                        <span className="text-slate-400">Courriel contact :</span>
                        <span className="font-semibold text-slate-200">{tenantDetails?.tenant?.email || 'Non renseigné'}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-400">Téléphone :</span>
                        <span className="font-semibold text-slate-200">{tenantDetails?.tenant?.phone || 'Non renseigné'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
                    <h3 className="font-bold text-white text-sm flex items-center gap-2 border-b border-slate-800 pb-3">
                      <ShieldCheck className="h-4 w-4 text-emerald-400" />
                      Gouvernance Loi 25 & Hébergement
                    </h3>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-slate-800/60">
                        <span className="text-slate-400">Responsable PRP (DPO) :</span>
                        <span className="font-semibold text-white">{tenantDetails?.tenant?.privacyOfficerName || 'Non assigné'}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-800/60">
                        <span className="text-slate-400">Courriel PRP :</span>
                        <span className="font-semibold text-slate-200">{tenantDetails?.tenant?.privacyOfficerEmail || 'Non assigné'}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-800/60">
                        <span className="text-slate-400">Durée conservation données :</span>
                        <span className="font-semibold text-indigo-300">{tenantDetails?.tenant?.dataRetentionMonths || 60} mois</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-400">Mode d'hébergement :</span>
                        <Badge variant="default" className="uppercase font-mono text-[10px]">{tenantDetails?.tenant?.mode}</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sub-tab 2: Quotas & Forfait Sur-Mesure */}
            {explorerSubTab === 'quotas' && (
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Sliders className="h-5 w-5 text-amber-400" />
                      Configuration des Quotas & Modules Sur-Mesure
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Accordez des plafonds personnalisés (utilisateurs, stockage, projets) et activez ou désactivez sélectivement les modules pour ce client.
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      updateQuotasMutation.mutate({
                        planCode: overridePlanCode,
                        billingCycle: overrideCycle,
                        seatCount: overrideSeatCount,
                        maxUsersOverride: overrideMaxUsers ? parseInt(overrideMaxUsers, 10) : null,
                        maxStorageGbOverride: overrideMaxStorage ? parseInt(overrideMaxStorage, 10) : null,
                        maxProjectsOverride: overrideMaxProjects ? parseInt(overrideMaxProjects, 10) : null,
                        allowedModules: overrideModules,
                      });
                    }}
                    disabled={updateQuotasMutation.isPending}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
                  >
                    <Check className="mr-1.5 h-4 w-4" />
                    {updateQuotasMutation.isPending ? 'Enregistrement...' : 'Enregistrer les Quotas'}
                  </Button>
                </div>

                {quotaFeedback && (
                  <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs rounded-lg flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>{quotaFeedback}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-4 rounded-lg bg-slate-950/60 p-4 border border-slate-800">
                    <h4 className="text-xs font-mono uppercase text-slate-400 font-bold">1. Forfait de Base</h4>
                    <div>
                      <label className="text-xs text-slate-300 block mb-1">Palier d'abonnement</label>
                      <select
                        value={overridePlanCode}
                        onChange={(e) => setOverridePlanCode(e.target.value)}
                        className="w-full rounded bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white"
                      >
                        <option value="community">Community (Gratuit - 5 usagers)</option>
                        <option value="starter">Starter (99 $ / mois)</option>
                        <option value="pro">Pro (199 $ / mois)</option>
                        <option value="enterprise">Enterprise (Sur-mesure)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-slate-300 block mb-1">Cycle de facturation</label>
                      <select
                        value={overrideCycle}
                        onChange={(e) => setOverrideCycle(e.target.value as any)}
                        className="w-full rounded bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white"
                      >
                        <option value="monthly">Mensuel</option>
                        <option value="annual">Annuel (-20%)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4 rounded-lg bg-slate-950/60 p-4 border border-slate-800">
                    <h4 className="text-xs font-mono uppercase text-slate-400 font-bold">2. Plafonds Dérogatoires (Overrides)</h4>
                    <div>
                      <label className="text-xs text-slate-300 block mb-1">Max Utilisateurs (laisser vide = standard)</label>
                      <Input
                        type="number"
                        placeholder="Ex: 25"
                        value={overrideMaxUsers}
                        onChange={(e) => setOverrideMaxUsers(e.target.value)}
                        className="bg-slate-900 border-slate-700 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-300 block mb-1">Max Stockage GED en Go (laisser vide = standard)</label>
                      <Input
                        type="number"
                        placeholder="Ex: 100"
                        value={overrideMaxStorage}
                        onChange={(e) => setOverrideMaxStorage(e.target.value)}
                        className="bg-slate-900 border-slate-700 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-300 block mb-1">Max Projets WBS (laisser vide = standard)</label>
                      <Input
                        type="number"
                        placeholder="Ex: 50"
                        value={overrideMaxProjects}
                        onChange={(e) => setOverrideMaxProjects(e.target.value)}
                        className="bg-slate-900 border-slate-700 text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-4 rounded-lg bg-slate-950/60 p-4 border border-slate-800">
                    <h4 className="text-xs font-mono uppercase text-slate-400 font-bold">3. Modules Activés pour ce Client</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {allAvailableModules.map((m) => {
                        const isChecked = overrideModules.includes(m.key);
                        return (
                          <label
                            key={m.key}
                            className={`flex items-start gap-2 p-2 rounded cursor-pointer border transition text-xs ${
                              isChecked
                                ? 'bg-indigo-950/40 border-indigo-700/60 text-indigo-200'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleModule(m.key)}
                              className="mt-0.5 rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-0"
                            />
                            <div>
                              <div className="font-semibold text-white">{m.name}</div>
                              <div className="text-[10px] text-slate-400">{m.desc}</div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sub-tab: Projects */}
            {explorerSubTab === 'projects' && (
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <FolderKanban className="h-4 w-4 text-amber-400" />
                    Portefeuille de Projets du Client ({tenantDetails?.projects?.length || 0})
                  </h3>
                </div>
                {tenantDetails?.projects?.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4">Aucun projet enregistré.</p>
                ) : (
                  <div className="space-y-3">
                    {tenantDetails?.projects?.map((p: any) => (
                      <div key={p.id} className="rounded-lg border border-slate-800 bg-slate-950 p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-white">{p.name}</span>
                            <Badge variant={p.status === 'in_progress' ? 'default' : 'secondary'}>{p.status}</Badge>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">{p.description || 'Aucune description'}</p>
                          <div className="flex items-center gap-4 text-[11px] text-slate-400 mt-2 font-mono">
                            <span>Tâches: {p.taskCount}</span>
                            <span>Terminées: {p.completedTasks}</span>
                            <span>Budget: {Number(p.totalBudget).toLocaleString()} CAD</span>
                          </div>
                        </div>
                        <div className="w-full md:w-48 space-y-1">
                          <div className="flex justify-between text-[11px] text-slate-400">
                            <span>Progression</span>
                            <span className="font-bold text-amber-400">{p.avgProgressPct}%</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                            <div className="h-full bg-amber-500" style={{ width: `${p.avgProgressPct}%` }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Sub-tab: Staff */}
            {explorerSubTab === 'staff' && (
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <Users className="h-4 w-4 text-emerald-400" />
                    Personnel & Bénévoles RH ({tenantDetails?.staff?.length || 0})
                  </h3>
                  <div className="flex gap-2">
                    <select
                      value={staffTypeFilter}
                      onChange={(e) => setStaffTypeFilter(e.target.value as any)}
                      className="rounded bg-slate-950 border border-slate-700 text-xs px-2 py-1 text-slate-200"
                    >
                      <option value="all">Tous les profils</option>
                      <option value="employee">Salariés</option>
                      <option value="volunteer">Bénévoles</option>
                      <option value="board_member">Conseil d'administration</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 uppercase font-mono border-b border-slate-800">
                      <tr>
                        <th className="p-3">Nom & Prénom</th>
                        <th className="p-3">Poste / Fonction</th>
                        <th className="p-3">Type</th>
                        <th className="p-3">Département</th>
                        <th className="p-3">Statut</th>
                        <th className="p-3">Compte Lié</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {tenantDetails?.staff
                        ?.filter((s: any) => staffTypeFilter === 'all' || s.employmentType === staffTypeFilter)
                        ?.map((s: any) => (
                          <tr key={s.id} className="hover:bg-slate-800/40">
                            <td className="p-3 font-semibold text-white">
                              {s.party?.firstName} {s.party?.lastName}
                            </td>
                            <td className="p-3 text-slate-300">{s.jobTitle}</td>
                            <td className="p-3">
                              <Badge variant="default" className="text-[10px]">{s.employmentType}</Badge>
                            </td>
                            <td className="p-3 text-slate-400">{s.department?.name || '—'}</td>
                            <td className="p-3">
                              <Badge variant={s.status === 'active' ? 'success' : 'secondary'}>{s.status}</Badge>
                            </td>
                            <td className="p-3">
                              {s.userId ? (
                                <span className="text-emerald-400 font-mono text-[11px] flex items-center gap-1">
                                  <Check className="h-3 w-3" /> Lié
                                </span>
                              ) : (
                                <span className="text-slate-500 text-[11px]">Non lié</span>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Sub-tab: Beneficiaries & Cases */}
            {explorerSubTab === 'beneficiaries' && (
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
                <h3 className="font-bold text-white text-sm flex items-center gap-2 border-b border-slate-800 pb-3">
                  <HeartHandshake className="h-4 w-4 text-teal-400" />
                  Registre des Bénéficiaires & Usagers ({tenantDetails?.beneficiaries?.length || 0})
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 uppercase font-mono border-b border-slate-800">
                      <tr>
                        <th className="p-3">Nom & Prénom</th>
                        <th className="p-3">Numéro Dossier</th>
                        <th className="p-3">Courriel</th>
                        <th className="p-3">Téléphone</th>
                        <th className="p-3">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {tenantDetails?.beneficiaries?.map((b: any) => (
                        <tr key={b.id} className="hover:bg-slate-800/40">
                          <td className="p-3 font-semibold text-white">{b.party?.firstName} {b.party?.lastName}</td>
                          <td className="p-3 font-mono text-teal-300">{b.fileNumber || '—'}</td>
                          <td className="p-3 text-slate-400">{b.party?.email || '—'}</td>
                          <td className="p-3 text-slate-400">{b.party?.phone || '—'}</td>
                          <td className="p-3"><Badge variant="default">{b.status}</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Sub-tab: Cases */}
            {explorerSubTab === 'cases' && (
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
                <h3 className="font-bold text-white text-sm flex items-center gap-2 border-b border-slate-800 pb-3">
                  <ShieldAlert className="h-4 w-4 text-rose-400" />
                  Dossiers d'Accompagnement Social ({tenantDetails?.cases?.length || 0})
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 uppercase font-mono border-b border-slate-800">
                      <tr>
                        <th className="p-3">Titre du Dossier</th>
                        <th className="p-3">Bénéficiaire</th>
                        <th className="p-3">Intervenant Assigné</th>
                        <th className="p-3">Priorité</th>
                        <th className="p-3">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {tenantDetails?.cases?.map((c: any) => (
                        <tr key={c.id} className="hover:bg-slate-800/40">
                          <td className="p-3 font-semibold text-white">{c.title}</td>
                          <td className="p-3 text-slate-300">{c.beneficiary?.firstName} {c.beneficiary?.lastName}</td>
                          <td className="p-3 text-slate-400">{c.primaryWorker?.email || 'Non assigné'}</td>
                          <td className="p-3"><Badge variant={c.priority === 'urgent' ? 'danger' : 'secondary'}>{c.priority}</Badge></td>
                          <td className="p-3"><Badge variant="default">{c.status}</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Sub-tab: Users */}
            {explorerSubTab === 'users' && (
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <Key className="h-4 w-4 text-cyan-400" />
                    Comptes Utilisateurs & Droits d'Accès ({tenantDetails?.users?.length || 0})
                  </h3>
                </div>

                {userActionFeedback && (
                  <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs rounded-lg flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>{userActionFeedback}</span>
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 uppercase font-mono border-b border-slate-800">
                      <tr>
                        <th className="p-3">Utilisateur</th>
                        <th className="p-3">Courriel</th>
                        <th className="p-3">Rôles Attribués</th>
                        <th className="p-3">Statut</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {tenantDetails?.users?.map((u: any) => (
                        <tr key={u.membershipId} className="hover:bg-slate-800/40">
                          <td className="p-3 font-semibold text-white">
                            {u.user?.firstName} {u.user?.lastName}
                          </td>
                          <td className="p-3 font-mono text-slate-300">{u.user?.email}</td>
                          <td className="p-3">
                            <div className="flex flex-wrap gap-1">
                              {u.roles?.map((r: any) => (
                                <Badge key={r.id} variant="default" className="text-[10px]">{r.name}</Badge>
                              ))}
                            </div>
                          </td>
                          <td className="p-3">
                            <Badge variant={u.status === 'active' ? 'success' : 'secondary'}>{u.status}</Badge>
                          </td>
                          <td className="p-3 text-right space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-[11px] h-7 px-2 border-slate-700"
                              onClick={() => handleOpenEditUser(u)}
                            >
                              <Pencil className="h-3 w-3 mr-1" />
                              Gérer / MDP
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Sub-tab: Invoices */}
            {explorerSubTab === 'invoices' && (
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
                <h3 className="font-bold text-white text-sm flex items-center gap-2 border-b border-slate-800 pb-3">
                  <Receipt className="h-4 w-4 text-green-400" />
                  Historique des Factures Émises ({tenantInvoices.length})
                </h3>
                {tenantInvoices.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4">Aucune facture enregistrée pour ce compte.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950 text-slate-400 uppercase font-mono border-b border-slate-800">
                        <tr>
                          <th className="p-3">Numéro</th>
                          <th className="p-3">Plan / Cycle</th>
                          <th className="p-3">Sous-total</th>
                          <th className="p-3">TPS + TVQ (QC)</th>
                          <th className="p-3">Total (CAD)</th>
                          <th className="p-3">Statut</th>
                          <th className="p-3">Date d'émission</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {tenantInvoices.map((inv: any) => (
                          <tr key={inv.id} className="hover:bg-slate-800/40">
                            <td className="p-3 font-mono text-amber-300 font-semibold">{inv.invoiceNumber}</td>
                            <td className="p-3 text-slate-200">{inv.planName} ({inv.billingCycle})</td>
                            <td className="p-3 font-mono">{Number(inv.subtotal).toFixed(2)} $</td>
                            <td className="p-3 font-mono text-slate-400">{(Number(inv.taxTps) + Number(inv.taxTvq)).toFixed(2)} $</td>
                            <td className="p-3 font-mono font-bold text-white">{Number(inv.total).toFixed(2)} $</td>
                            <td className="p-3">
                              <Badge variant={inv.status === 'paid' ? 'success' : 'secondary'}>{inv.status}</Badge>
                            </td>
                            <td className="p-3 text-slate-400">{new Date(inv.createdAt).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Sub-tab: Support Break-Glass */}
            {explorerSubTab === 'support' && (
              <div className="rounded-xl border border-red-900/60 bg-slate-900 p-6 space-y-6">
                <div className="border-b border-red-900/40 pb-4">
                  <h3 className="text-lg font-bold text-red-400 flex items-center gap-2">
                    <Lock className="h-5 w-5 text-red-400" />
                    Accès Support d'Urgence (Break-Glass Loi 25)
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Débloquez un accès temporaire pour dépannage technique ou assistance à la demande du client. Cet événement est horodaté et consigné dans le registre légal Loi 25.
                  </p>
                </div>

                {supportFeedback && (
                  <div className="p-3 bg-red-950/40 border border-red-800 text-red-300 text-xs rounded-lg flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-red-400 shrink-0" />
                    <span>{supportFeedback}</span>
                  </div>
                )}

                <div className="max-w-xl space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Motif de l'intervention de support (Requis Loi 25) :</label>
                    <Input
                      placeholder="Ex: Demande expresse du directeur pour déblocage import subventions..."
                      value={supportReason}
                      onChange={(e) => setSupportReason(e.target.value)}
                      className="bg-slate-950 border-slate-700 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Durée d'autorisation :</label>
                    <select
                      value={supportDuration}
                      onChange={(e) => setSupportDuration(parseInt(e.target.value, 10))}
                      className="w-full rounded bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white"
                    >
                      <option value={30}>30 minutes</option>
                      <option value={60}>1 heure (recommandé)</option>
                      <option value={120}>2 heures</option>
                      <option value={240}>4 heures</option>
                    </select>
                  </div>

                  <Button
                    onClick={() => {
                      if (!supportReason.trim()) {
                        alert('Veuillez spécifier le motif légal de l’intervention.');
                        return;
                      }
                      grantSupportMutation.mutate({ reason: supportReason, durationMinutes: supportDuration });
                    }}
                    disabled={grantSupportMutation.isPending}
                    className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs"
                  >
                    <Lock className="mr-1.5 h-4 w-4" />
                    {grantSupportMutation.isPending ? 'Activation...' : 'Activer l’Accès d’Urgence'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* PILIER 2 : COCKPIT FINANCIER & MRR (MONÉTISATION)                 */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        {activeTab === 'financials' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 shadow">
                <div className="flex items-center justify-between text-slate-400 text-xs font-mono uppercase">
                  <span>MRR (Revenu Mensuel)</span>
                  <DollarSign className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="mt-2 text-3xl font-extrabold text-emerald-400">
                  {financials?.totalMRR?.toLocaleString() || '0'} $
                </div>
                <div className="text-[11px] text-slate-400 mt-1">CAD récurrent mensuel</div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 shadow">
                <div className="flex items-center justify-between text-slate-400 text-xs font-mono uppercase">
                  <span>ARR (Revenu Annuel)</span>
                  <TrendingUp className="h-4 w-4 text-blue-400" />
                </div>
                <div className="mt-2 text-3xl font-extrabold text-blue-400">
                  {financials?.totalARR?.toLocaleString() || '0'} $
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Projection annuelle</div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 shadow">
                <div className="flex items-center justify-between text-slate-400 text-xs font-mono uppercase">
                  <span>Abonnements Actifs</span>
                  <Award className="h-4 w-4 text-amber-400" />
                </div>
                <div className="mt-2 text-3xl font-extrabold text-white">
                  {financials?.activeSubscriptions || 0}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Sur {tenants.length} organismes enregistrés</div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 shadow">
                <div className="flex items-center justify-between text-slate-400 text-xs font-mono uppercase">
                  <span>Impayés / En Retard</span>
                  <AlertTriangle className="h-4 w-4 text-rose-400" />
                </div>
                <div className="mt-2 text-3xl font-extrabold text-rose-400">
                  {financials?.pastDueCount || 0}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Comptes à relancer</div>
              </div>
            </div>

            {/* Plans Distribution & Recent Invoices */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
                <h3 className="font-bold text-white text-sm flex items-center gap-2 border-b border-slate-800 pb-3">
                  <Award className="h-4 w-4 text-amber-400" />
                  Répartition par Forfait SaaS
                </h3>
                <div className="space-y-3">
                  {financials?.plans?.map((p: any) => {
                    const count = financials?.planDistribution?.[p.code] || 0;
                    return (
                      <div key={p.id} className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-white text-xs">{p.name} ({p.code})</div>
                          <div className="text-[11px] text-slate-400">
                            {Number(p.priceMonthly).toFixed(0)} $/mois • Jusqu'à {p.maxUsers} utilisateurs
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="default" className="text-xs font-bold">{count} Client(s)</Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
                <h3 className="font-bold text-white text-sm flex items-center gap-2 border-b border-slate-800 pb-3">
                  <Receipt className="h-4 w-4 text-green-400" />
                  Dernières Factures Émises sur la Plateforme
                </h3>
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {financials?.recentInvoices?.map((inv: any) => (
                    <div key={inv.id} className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-white">{inv.tenant?.name || 'Client'}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{inv.invoiceNumber} • {new Date(inv.createdAt).toLocaleDateString()}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-white font-mono">{Number(inv.total).toFixed(2)} $ CAD</div>
                        <Badge variant={inv.status === 'paid' ? 'success' : 'secondary'} className="text-[10px]">{inv.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* PILIER 3 : PROVISIONING CLIENT ASSISTÉ & NOUVEAU CLIENT          */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        {activeTab === 'provisioning' && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-6 max-w-4xl mx-auto shadow-2xl">
            <div className="border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2 text-indigo-400 font-mono text-xs uppercase font-bold">
                <PlusCircle className="h-4 w-4" />
                <span>Assistant de Provisioning Fournisseur</span>
              </div>
              <h2 className="text-xl font-bold text-white mt-1">Créer et Déployer un Nouvel Organisme Client</h2>
              <p className="text-xs text-slate-400">
                Créez le tenant, configurez ses quotas, générez son administrateur principal et activez ses modules en 3 étapes.
              </p>
            </div>

            {/* Stepper */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 text-xs font-bold">
              <button
                onClick={() => setProvStep(1)}
                className={`flex items-center gap-2 ${provStep === 1 ? 'text-amber-400' : 'text-slate-400'}`}
              >
                <span className={`h-6 w-6 rounded-full flex items-center justify-center ${provStep === 1 ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300'}`}>1</span>
                <span>Fiche d'Identité & Coordonnées</span>
              </button>
              <ChevronRight className="h-4 w-4 text-slate-600" />
              <button
                onClick={() => setProvStep(2)}
                className={`flex items-center gap-2 ${provStep === 2 ? 'text-amber-400' : 'text-slate-400'}`}
              >
                <span className={`h-6 w-6 rounded-full flex items-center justify-center ${provStep === 2 ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300'}`}>2</span>
                <span>Forfait & Mode d'Hébergement</span>
              </button>
              <ChevronRight className="h-4 w-4 text-slate-600" />
              <button
                onClick={() => setProvStep(3)}
                className={`flex items-center gap-2 ${provStep === 3 ? 'text-amber-400' : 'text-slate-400'}`}
              >
                <span className={`h-6 w-6 rounded-full flex items-center justify-center ${provStep === 3 ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300'}`}>3</span>
                <span>Administrateur Initial & Loi 25</span>
              </button>
            </div>

            {provSuccessFeedback && (
              <div className="p-4 bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs rounded-xl flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                <span className="font-semibold">{provSuccessFeedback}</span>
              </div>
            )}

            {/* Step 1: Legal & Profile */}
            {provStep === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Raison Sociale / Nom de l'organisme *</label>
                    <Input
                      placeholder="Ex: Fondation Espoir Jeunesse"
                      value={provName}
                      onChange={(e) => {
                        setProvName(e.target.value);
                        if (!provSlug) {
                          setProvSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'));
                        }
                      }}
                      className="bg-slate-950 border-slate-700 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Slug URL unique (ex: espoir-jeunesse) *</label>
                    <Input
                      placeholder="ex: espoir-jeunesse"
                      value={provSlug}
                      onChange={(e) => setProvSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      className="bg-slate-950 border-slate-700 text-xs text-white font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Acronyme</label>
                    <Input
                      placeholder="Ex: FEJ"
                      value={provAcronym}
                      onChange={(e) => setProvAcronym(e.target.value)}
                      className="bg-slate-950 border-slate-700 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Numéro NEQ (Québec)</label>
                    <Input
                      placeholder="Ex: 1172839401"
                      value={provNeq}
                      onChange={(e) => setProvNeq(e.target.value)}
                      className="bg-slate-950 border-slate-700 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Courriel officiel *</label>
                    <Input
                      type="email"
                      placeholder="direction@organisme.org"
                      value={provEmail}
                      onChange={(e) => setProvEmail(e.target.value)}
                      className="bg-slate-950 border-slate-700 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    onClick={() => {
                      if (!provName.trim() || !provSlug.trim() || !provEmail.trim()) {
                        alert('Veuillez remplir le nom, le slug et le courriel.');
                        return;
                      }
                      setProvStep(2);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
                  >
                    Suivant : Forfait & Hébergement
                    <ChevronRight className="ml-1.5 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Plan & Isolation Mode */}
            {provStep === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Palier d'Abonnement Initial</label>
                    <select
                      value={provPlanCode}
                      onChange={(e) => setProvPlanCode(e.target.value as any)}
                      className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white font-bold"
                    >
                      <option value="community">Community (Gratuit pour petits OBNL)</option>
                      <option value="starter">Starter (99 $/mois • 5 postes)</option>
                      <option value="pro">Pro (199 $/mois • 20 postes & EVM)</option>
                      <option value="enterprise">Enterprise (Sur-mesure)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Cycle de Facturation</label>
                    <select
                      value={provBillingCycle}
                      onChange={(e) => setProvBillingCycle(e.target.value as any)}
                      className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white font-bold"
                    >
                      <option value="monthly">Facturation Mensuelle</option>
                      <option value="annual">Facturation Annuelle (-20%)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Mode d'Isolation / Architecture</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <label className={`p-3 rounded-xl border cursor-pointer ${provMode === 'shared' ? 'bg-indigo-950/60 border-indigo-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
                      <input type="radio" name="mode" checked={provMode === 'shared'} onChange={() => setProvMode('shared')} className="sr-only" />
                      <div className="font-bold text-xs">Mutualisé (Shared RLS)</div>
                      <div className="text-[10px] text-slate-400 mt-1">PostgreSQL partagé avec isolation RLS automatique.</div>
                    </label>
                    <label className={`p-3 rounded-xl border cursor-pointer ${provMode === 'dedicated' ? 'bg-indigo-950/60 border-indigo-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
                      <input type="radio" name="mode" checked={provMode === 'dedicated'} onChange={() => setProvMode('dedicated')} className="sr-only" />
                      <div className="font-bold text-xs">Instance Dédiée</div>
                      <div className="text-[10px] text-slate-400 mt-1">Base de données ou schéma isolé pour grands comptes.</div>
                    </label>
                    <label className={`p-3 rounded-xl border cursor-pointer ${provMode === 'self_hosted' ? 'bg-indigo-950/60 border-indigo-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
                      <input type="radio" name="mode" checked={provMode === 'self_hosted'} onChange={() => setProvMode('self_hosted')} className="sr-only" />
                      <div className="font-bold text-xs">Auto-hébergé (On-Prem)</div>
                      <div className="text-[10px] text-slate-400 mt-1">Infrastructure propre gérée par le client.</div>
                    </label>
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={() => setProvStep(1)} className="text-xs border-slate-700">Précédent</Button>
                  <Button onClick={() => setProvStep(3)} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs">
                    Suivant : Administrateur
                    <ChevronRight className="ml-1.5 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Initial Admin & Loi 25 */}
            {provStep === 3 && (
              <div className="space-y-4">
                <div className="rounded-xl bg-slate-950 p-4 border border-slate-800 space-y-4">
                  <h4 className="text-xs font-mono uppercase text-amber-400 font-bold">Compte Administrateur Principal (Super-User Client)</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">Prénom *</label>
                      <Input
                        placeholder="Ex: Jean"
                        value={provAdminFirstName}
                        onChange={(e) => setProvAdminFirstName(e.target.value)}
                        className="bg-slate-900 border-slate-700 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">Nom *</label>
                      <Input
                        placeholder="Ex: Dupont"
                        value={provAdminLastName}
                        onChange={(e) => setProvAdminLastName(e.target.value)}
                        className="bg-slate-900 border-slate-700 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">Courriel de connexion *</label>
                      <Input
                        type="email"
                        placeholder="j.dupont@organisme.org"
                        value={provAdminEmail}
                        onChange={(e) => setProvAdminEmail(e.target.value)}
                        className="bg-slate-900 border-slate-700 text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">Mot de passe initial *</label>
                      <Input
                        type="text"
                        value={provAdminPassword}
                        onChange={(e) => setProvAdminPassword(e.target.value)}
                        className="bg-slate-900 border-slate-700 text-xs text-white font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={() => setProvStep(2)} className="text-xs border-slate-700">Précédent</Button>
                  <Button
                    onClick={() => {
                      if (!provAdminFirstName.trim() || !provAdminLastName.trim() || !provAdminEmail.trim() || !provAdminPassword.trim()) {
                        alert('Veuillez compléter les informations de l’administrateur.');
                        return;
                      }
                      provisionTenantMutation.mutate({
                        name: provName,
                        slug: provSlug,
                        acronym: provAcronym,
                        orgType: provOrgType,
                        neqNumber: provNeq,
                        email: provEmail,
                        phone: provPhone,
                        address: provAddress,
                        website: provWebsite,
                        mode: provMode,
                        planCode: provPlanCode,
                        billingCycle: provBillingCycle,
                        adminFirstName: provAdminFirstName,
                        adminLastName: provAdminLastName,
                        adminEmail: provAdminEmail,
                        adminPassword: provAdminPassword,
                        adminJobTitle: provAdminJobTitle,
                        privacyOfficerName: provPrivacyOfficerName || `${provAdminFirstName} ${provAdminLastName}`,
                        privacyOfficerEmail: provPrivacyOfficerEmail || provAdminEmail,
                        dataRetentionMonths: provRetentionMonths,
                      });
                    }}
                    disabled={provisionTenantMutation.isPending}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                  >
                    <Check className="mr-1.5 h-4 w-4" />
                    {provisionTenantMutation.isPending ? 'Provisioning en cours...' : 'Provisionner le Client Immédiatement'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* PILIER 4 : FEATURE FLAGS & MODULES (ENTITLEMENTS)                 */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        {activeTab === 'feature_flags' && (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Sliders className="h-5 w-5 text-purple-400" />
                Matrice des Feature Flags & Déploiement Progressif
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Activez ou désactivez globalement de nouveaux modules ou fonctionnalités en bêta pour tous les tenants ou des cohortes spécifiques.
              </p>
            </div>

            <div className="space-y-3">
              {featureFlagsData?.systemFlags?.map((flag: any) => {
                const isConfigured = featureFlagsData?.configuredFlags?.find((f: any) => f.featureKey === flag.key);
                const isEnabled = isConfigured ? isConfigured.isEnabled : flag.default;

                return (
                  <div key={flag.key} className="p-4 rounded-xl border border-slate-800 bg-slate-950 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm text-white flex items-center gap-2">
                        <span>{flag.name}</span>
                        <code className="text-[10px] text-purple-400 font-mono bg-purple-950/40 px-2 py-0.5 rounded">{flag.key}</code>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Contrôle l'accès à ce composant sur l'ensemble des interfaces clients.
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        toggleFeatureFlagMutation.mutate({ key: flag.key, isEnabled: !isEnabled });
                      }}
                      className={`px-4 py-2 rounded-lg font-bold text-xs transition flex items-center gap-1.5 ${
                        isEnabled
                          ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      <Power className="h-3.5 w-3.5" />
                      {isEnabled ? 'Activé (Global)' : 'Désactivé'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* PILIER 5 : OBSERVABILITÉ, GED & QUOTAS (SRE / OPS)               */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        {activeTab === 'observability' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
                <div className="flex items-center justify-between text-slate-400 text-xs font-mono uppercase">
                  <span>Base PostgreSQL</span>
                  <Database className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="mt-2 text-2xl font-bold text-emerald-400 flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
                  Opérationnelle
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Connexion Pool OK</div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
                <div className="flex items-center justify-between text-slate-400 text-xs font-mono uppercase">
                  <span>Sessions Actives</span>
                  <Activity className="h-4 w-4 text-cyan-400" />
                </div>
                <div className="mt-2 text-2xl font-bold text-white">
                  {telemetry?.activeSessionsCount || 0}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Jetons valides en cours</div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
                <div className="flex items-center justify-between text-slate-400 text-xs font-mono uppercase">
                  <span>Total Fichiers GED</span>
                  <FileText className="h-4 w-4 text-amber-400" />
                </div>
                <div className="mt-2 text-2xl font-bold text-white">
                  {telemetry?.totalDocumentsCount || 0}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Pièces jointes & reçus</div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
                <div className="flex items-center justify-between text-slate-400 text-xs font-mono uppercase">
                  <span>Disponibilité (Uptime)</span>
                  <Server className="h-4 w-4 text-purple-400" />
                </div>
                <div className="mt-2 text-2xl font-bold text-purple-400">
                  {Math.floor((telemetry?.uptimeSeconds || 0) / 3600)} h {Math.floor(((telemetry?.uptimeSeconds || 0) % 3600) / 60)} m
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Node {telemetry?.nodeVersion}</div>
              </div>
            </div>

            {/* Storage Quotas Usage Table */}
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
              <h3 className="font-bold text-white text-sm flex items-center gap-2 border-b border-slate-800 pb-3">
                <HardDrive className="h-4 w-4 text-cyan-400" />
                Consommation de Stockage GED par Client vs Plafond
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase font-mono border-b border-slate-800">
                    <tr>
                      <th className="p-3">Organisme</th>
                      <th className="p-3">Documents</th>
                      <th className="p-3">Espace Utilisé (Mo)</th>
                      <th className="p-3">Quota Alloué (Go)</th>
                      <th className="p-3">Jauge d'Utilisation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {telemetry?.storageTelemetry?.map((st: any) => (
                      <tr key={st.tenantId} className="hover:bg-slate-800/40">
                        <td className="p-3 font-semibold text-white">{st.tenantName} ({st.slug})</td>
                        <td className="p-3 font-mono text-slate-300">{st.documentCount}</td>
                        <td className="p-3 font-mono text-cyan-300">{st.usedStorageMb} Mo</td>
                        <td className="p-3 font-mono text-slate-300">{st.allocatedStorageGb} Go</td>
                        <td className="p-3">
                          <div className="w-48 space-y-1">
                            <div className="flex justify-between text-[10px] text-slate-400">
                              <span>{st.usagePct}%</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                              <div
                                className={`h-full ${st.usagePct > 80 ? 'bg-red-500' : 'bg-cyan-500'}`}
                                style={{ width: `${Math.max(2, st.usagePct)}%` }}
                              />
                            </div>
                          </div>
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
        {/* PILIER 6 : GOUVERNANCE, AUDIT GLOBAL & INCIDENTS LOI 25          */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        {activeTab === 'security_audit' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Lock className="h-5 w-5 text-rose-400" />
                  Gouvernance Loi 25 & Registre des Incidents de Sécurité
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Journal d'audit universel des interventions super-admin et registre obligatoire de déclaration d'incidents CAI.
                </p>
              </div>
              <Button
                onClick={() => setIncidentModalOpen(true)}
                className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
              >
                <AlertOctagon className="mr-1.5 h-4 w-4" />
                Déclarer un Incident Loi 25
              </Button>
            </div>

            {incidentFeedback && (
              <div className="p-4 bg-rose-950/80 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-rose-400 shrink-0" />
                <span>{incidentFeedback}</span>
              </div>
            )}

            {/* Incidents Table */}
            <div className="rounded-xl border border-rose-950 bg-slate-900 p-5 space-y-4">
              <h3 className="font-bold text-white text-sm flex items-center gap-2 border-b border-slate-800 pb-3">
                <ShieldAlert className="h-4 w-4 text-rose-400" />
                Registre des Incidents de Confidentialité Loi 25 ({securityIncidents.length})
              </h3>
              {securityIncidents.length === 0 ? (
                <p className="text-xs text-emerald-400 py-2">✅ Aucun incident de sécurité ou fuite de données n'a été enregistré.</p>
              ) : (
                <div className="space-y-3">
                  {securityIncidents.map((inc: any) => (
                    <div key={inc.id} className="p-4 rounded-lg bg-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{inc.title}</span>
                          <Badge variant={inc.severity === 'critical' || inc.severity === 'high' ? 'danger' : 'secondary'}>
                            {inc.severity}
                          </Badge>
                          <Badge variant="default" className="text-[10px]">{inc.status}</Badge>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{inc.description}</p>
                        <div className="flex items-center gap-4 text-[11px] text-slate-400 mt-2 font-mono">
                          <span>Client: {inc.tenant?.name || 'Plateforme globale'}</span>
                          <span>Usagers affectés: {inc.impactedUsersCount}</span>
                          <span>Déclaré CAI: {inc.notifiedCai ? '✅ Oui' : 'Non'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Platform Universal Audit Trail */}
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
              <h3 className="font-bold text-white text-sm flex items-center gap-2 border-b border-slate-800 pb-3">
                <FileCheck2 className="h-4 w-4 text-amber-400" />
                Journal d'Audit Universel Super-Admin ({auditLogs.length})
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase font-mono border-b border-slate-800">
                    <tr>
                      <th className="p-3">Date & Heure</th>
                      <th className="p-3">Action</th>
                      <th className="p-3">Client (Tenant)</th>
                      <th className="p-3">Opérateur</th>
                      <th className="p-3">Détails</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-mono">
                    {auditLogs.map((log: any) => (
                      <tr key={log.id} className="hover:bg-slate-800/40 text-[11px]">
                        <td className="p-3 text-slate-400">{new Date(log.createdAt).toLocaleString()}</td>
                        <td className="p-3 font-bold text-amber-300">{log.action}</td>
                        <td className="p-3 text-white font-sans">{log.tenant?.name || 'Système'}</td>
                        <td className="p-3 text-slate-300 font-sans">{log.user?.email || 'Super-Admin'}</td>
                        <td className="p-3 text-slate-400 max-w-xs truncate">{JSON.stringify(log.payload || {})}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* PILIER 7 : BANNIÈRES DE COMMUNICATION & MAINTENANCE SYSTÈME       */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        {activeTab === 'announcements' && (
          <div className="space-y-6">
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <BellRing className="h-5 w-5 text-amber-400" />
                  Diffuser une Nouvelle Bannière Système
                </h3>
                <p className="text-xs text-slate-400">
                  Cette bannière apparaîtra en haut des écrans de tous les utilisateurs connectés sur leurs espaces clients.
                </p>
              </div>

              {annFeedback && (
                <div className="p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs rounded-lg flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>{annFeedback}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Titre de l'alerte / annonce *</label>
                  <Input
                    placeholder="Ex: Maintenance programmée dimanche à 02h00"
                    value={annTitle}
                    onChange={(e) => setAnnTitle(e.target.value)}
                    className="bg-slate-950 border-slate-700 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Niveau d'Urgence</label>
                  <select
                    value={annSeverity}
                    onChange={(e) => setAnnSeverity(e.target.value as any)}
                    className="w-full rounded bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white"
                  >
                    <option value="info">Information (Bleu)</option>
                    <option value="warning">Avertissement (Orange)</option>
                    <option value="critical">Critique / Interruption (Rouge)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Message complet *</label>
                <textarea
                  rows={3}
                  placeholder="Ex: Une mise à jour majeure de la plateforme sera déployée. L'accès sera interrompu pendant 15 minutes."
                  value={annMessage}
                  onChange={(e) => setAnnMessage(e.target.value)}
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 p-3 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => {
                    if (!annTitle.trim() || !annMessage.trim()) {
                      alert('Veuillez remplir le titre et le message.');
                      return;
                    }
                    createAnnouncementMutation.mutate({
                      title: annTitle,
                      message: annMessage,
                      severity: annSeverity,
                    });
                  }}
                  disabled={createAnnouncementMutation.isPending}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
                >
                  <BellRing className="mr-1.5 h-4 w-4" />
                  Publier l'Annonce en Direct
                </Button>
              </div>
            </div>

            {/* Active Announcements List */}
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
              <h3 className="font-bold text-white text-sm flex items-center gap-2 border-b border-slate-800 pb-3">
                <Radio className="h-4 w-4 text-amber-400" />
                Bannières Diffusées ({announcements.length})
              </h3>
              {announcements.length === 0 ? (
                <p className="text-xs text-slate-500 py-3">Aucune bannière active actuellement.</p>
              ) : (
                <div className="space-y-3">
                  {announcements.map((ann: any) => (
                    <div key={ann.id} className="p-4 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{ann.title}</span>
                          <Badge variant={ann.severity === 'critical' ? 'danger' : 'default'}>{ann.severity}</Badge>
                        </div>
                        <p className="text-xs text-slate-300 mt-1">{ann.message}</p>
                        <div className="text-[10px] text-slate-500 mt-1 font-mono">{new Date(ann.createdAt).toLocaleString()}</div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs text-red-400 border-slate-800 hover:bg-red-950/40"
                        onClick={() => deleteAnnouncementMutation.mutate(ann.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                        Retirer
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal : Declarer Incident Loi 25 */}
        {incidentModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div className="rounded-2xl border border-red-900 bg-slate-900 p-6 max-w-lg w-full space-y-4 shadow-2xl">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <AlertOctagon className="h-5 w-5 text-red-400" />
                  Déclarer un Incident de Confidentialité (Loi 25)
                </h3>
                <button onClick={() => setIncidentModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Titre de l'incident *</label>
                  <Input
                    placeholder="Ex: Tentative d'accès non autorisé par force brute"
                    value={incTitle}
                    onChange={(e) => setIncTitle(e.target.value)}
                    className="bg-slate-950 border-slate-700 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Gravité</label>
                  <select
                    value={incSeverity}
                    onChange={(e) => setIncSeverity(e.target.value as any)}
                    className="w-full rounded bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white"
                  >
                    <option value="low">Faible (Aucune fuite avérée)</option>
                    <option value="medium">Moyenne (Impact limité)</option>
                    <option value="high">Élevée (Données personnelles consultées)</option>
                    <option value="critical">Critique (Risque sérieux de préjudice)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Description détaillée des faits *</label>
                  <textarea
                    rows={3}
                    placeholder="Détaillez la nature de l'incident, les journaux observés et les vecteurs d'attaque."
                    value={incDescription}
                    onChange={(e) => setIncDescription(e.target.value)}
                    className="w-full rounded bg-slate-950 border border-slate-700 p-2 text-xs text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Usagers affectés (estimation)</label>
                    <Input
                      type="number"
                      value={incImpactedCount}
                      onChange={(e) => setIncImpactedCount(parseInt(e.target.value, 10) || 0)}
                      className="bg-slate-950 border-slate-700 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Notification CAI (Québec)</label>
                    <label className="flex items-center gap-2 pt-2 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={incNotifiedCai}
                        onChange={(e) => setIncNotifiedCai(e.target.checked)}
                        className="rounded bg-slate-950 border-slate-700 text-red-600"
                      />
                      <span>Déclaré à la CAI</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <Button variant="outline" onClick={() => setIncidentModalOpen(false)} className="text-xs border-slate-700">Annuler</Button>
                <Button
                  onClick={() => {
                    if (!incTitle.trim() || !incDescription.trim()) {
                      alert('Veuillez renseigner le titre et la description.');
                      return;
                    }
                    createIncidentMutation.mutate({
                      title: incTitle,
                      description: incDescription,
                      severity: incSeverity,
                      impactedUsersCount: incImpactedCount,
                      notifiedCai: incNotifiedCai,
                    });
                  }}
                  className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs"
                >
                  Enregistrer l'Incident
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Modal : Edition Utilisateur & Reset Password */}
        {editingUserItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 max-w-lg w-full space-y-4 shadow-2xl">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <Key className="h-5 w-5 text-cyan-400" />
                  Gérer le Compte Utilisateur
                </h3>
                <button onClick={() => setEditingUserItem(null)} className="text-slate-400 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Prénom</label>
                    <Input
                      value={editUserFirstName}
                      onChange={(e) => setEditUserFirstName(e.target.value)}
                      className="bg-slate-950 border-slate-700 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Nom</label>
                    <Input
                      value={editUserLastName}
                      onChange={(e) => setEditUserLastName(e.target.value)}
                      className="bg-slate-950 border-slate-700 text-xs text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Courriel</label>
                  <Input
                    type="email"
                    value={editUserEmail}
                    onChange={(e) => setEditUserEmail(e.target.value)}
                    className="bg-slate-950 border-slate-700 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Titre / Fonction</label>
                  <Input
                    value={editUserJobTitle}
                    onChange={(e) => setEditUserJobTitle(e.target.value)}
                    className="bg-slate-950 border-slate-700 text-xs text-white"
                  />
                </div>

                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-amber-400">Réinitialiser le mot de passe</label>
                    <button
                      type="button"
                      onClick={generateRandomPassword}
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
                    >
                      <Sparkles className="h-3 w-3" /> Générer
                    </button>
                  </div>
                  <Input
                    type="text"
                    placeholder="Laisser vide pour ne pas modifier"
                    value={editUserPassword}
                    onChange={(e) => setEditUserPassword(e.target.value)}
                    className="bg-slate-900 border-slate-700 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-slate-800">
                <Button
                  size="sm"
                  variant="outline"
                  className={editUserStatus === 'active' ? 'text-red-400 border-slate-700 text-xs' : 'text-emerald-400 border-slate-700 text-xs'}
                  onClick={() => {
                    const newSt = editUserStatus === 'active' ? 'suspended' : 'active';
                    setEditUserStatus(newSt);
                    toggleUserStatusMutation.mutate({ userId: editingUserItem.user.id, status: newSt });
                  }}
                >
                  <Power className="h-3 w-3 mr-1" />
                  {editUserStatus === 'active' ? 'Suspendre l’accès' : 'Réactiver l’accès'}
                </Button>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setEditingUserItem(null)} className="text-xs border-slate-700">Annuler</Button>
                  <Button
                    onClick={() => {
                      updateUserMutation.mutate({
                        userId: editingUserItem.user.id,
                        payload: {
                          firstName: editUserFirstName,
                          lastName: editUserLastName,
                          email: editUserEmail,
                          jobTitle: editUserJobTitle,
                          ...(editUserPassword.trim() && { password: editUserPassword.trim() }),
                        },
                      });
                    }}
                    disabled={updateUserMutation.isPending}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs"
                  >
                    Enregistrer
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
