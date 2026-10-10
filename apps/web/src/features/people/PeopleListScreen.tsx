import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Input, Badge } from '@orgdashio/ui';
import {
  Users,
  UserPlus,
  Search,
  ArrowRight,
  Briefcase,
  Building2,
  HeartHandshake,
  ShieldCheck,
  ShieldAlert,
  Plus,
  Mail,
  Phone,
  Calendar,
  AlertTriangle,
  Trash2,
  Pencil,
  KeyRound,
  CheckCircle2,
  X,
  Filter,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../../components/Navbar';

export const EMPLOYMENT_TYPE_CONFIG: Record<string, { labelKey: string; color: string }> = {
  employee: { labelKey: 'people.types.employee', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  volunteer: { labelKey: 'people.types.volunteer', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  board_member: { labelKey: 'people.types.board_member', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  contractor: { labelKey: 'people.types.contractor', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  intern: { labelKey: 'people.types.intern', color: 'bg-sky-100 text-sky-800 border-sky-200' },
};

export const STAFF_STATUS_CONFIG: Record<string, { labelKey: string; color: string }> = {
  active: { labelKey: 'people.statuses.active', color: 'bg-emerald-100 text-emerald-800' },
  on_leave: { labelKey: 'people.statuses.on_leave', color: 'bg-amber-100 text-amber-800' },
  inactive: { labelKey: 'people.statuses.inactive', color: 'bg-slate-100 text-slate-600' },
  archived: { labelKey: 'people.statuses.archived', color: 'bg-red-100 text-red-800' },
};

export function PeopleListScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Active sub-tab: 'staff' | 'volunteers' | 'departments' | 'beneficiaries'
  const [activeTab, setActiveTab] = useState<'staff' | 'volunteers' | 'departments' | 'beneficiaries'>('staff');

  // Search and filter
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Staff / Volunteer Modal State (Create or Edit)
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any>(null);
  const [staffModalMode, setStaffModalMode] = useState<'staff' | 'volunteer'>('staff');
  const [staffFirstName, setStaffFirstName] = useState('');
  const [staffLastName, setStaffLastName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPhone, setStaffPhone] = useState('');
  const [staffJobTitle, setStaffJobTitle] = useState('');
  const [staffEmploymentType, setStaffEmploymentType] = useState('employee');
  const [staffDepartmentId, setStaffDepartmentId] = useState('');
  const [staffStatus, setStaffStatus] = useState('active');
  const [staffHireDate, setStaffHireDate] = useState(new Date().toISOString().split('T')[0]);
  const [staffEmergencyContact, setStaffEmergencyContact] = useState('');
  const [staffNotes, setStaffNotes] = useState('');
  const [staffCreateAccount, setStaffCreateAccount] = useState(true);
  const [staffPassword, setStaffPassword] = useState('');
  const [staffRoleId, setStaffRoleId] = useState('');
  const [staffSendInvite, setStaffSendInvite] = useState(false);

  // Quick Account Modal State
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [targetStaffForAccount, setTargetStaffForAccount] = useState<any>(null);
  const [accountPassword, setAccountPassword] = useState('OrgDash2026!');
  const [accountRoleId, setAccountRoleId] = useState('');

  // Department Modal State
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [editingDept, setEditingDept] = useState<any>(null);
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptCode, setNewDeptCode] = useState('');
  const [newDeptParentId, setNewDeptParentId] = useState('');

  // Beneficiary Modal State
  const [showBeneficiaryModal, setShowBeneficiaryModal] = useState(false);
  const [benFirstName, setBenFirstName] = useState('');
  const [benLastName, setBenLastName] = useState('');
  const [benEmail, setBenEmail] = useState('');
  const [benPhone, setBenPhone] = useState('');
  const [benWarnings, setBenWarnings] = useState<any[]>([]);
  const [staffWarnings, setStaffWarnings] = useState<any[]>([]);
  const [error, setError] = useState('');

  // Fetch People (Includes both staff & beneficiaries)
  const { data: people = [], isLoading } = useQuery({
    queryKey: ['people'],
    queryFn: async () => {
      const res = await fetch('/api/v1/people');
      if (!res.ok) throw new Error('Erreur chargement personnes');
      return res.json();
    },
  });

  // Fetch Departments (orgUnits)
  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const res = await fetch('/api/v1/people/departments');
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Fetch Roles for tenant
  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await fetch('/api/v1/people/roles');
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Create Staff Mutation
  const createStaffMutation = useMutation({
    mutationFn: async (newStaff: any) => {
      const res = await fetch('/api/v1/people/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStaff),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Erreur création collaborateur');
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['people'] });
      if (data.warnings && data.warnings.length > 0) {
        setStaffWarnings(data.warnings);
      } else {
        setShowStaffModal(false);
        resetStaffForm();
      }
    },
    onError: (err: any) => {
      setError(err.message);
    },
  });

  // Update Staff Mutation
  const updateStaffMutation = useMutation({
    mutationFn: async ({ partyId, data }: { partyId: string; data: any }) => {
      const res = await fetch(`/api/v1/people/staff/${partyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Erreur mise à jour collaborateur');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['people'] });
      setShowStaffModal(false);
      resetStaffForm();
    },
    onError: (err: any) => {
      setError(err.message);
    },
  });

  // Create Account For Existing Staff Mutation
  const createAccountMutation = useMutation({
    mutationFn: async ({ partyId, password, roleId }: { partyId: string; password?: string; roleId?: string }) => {
      const res = await fetch(`/api/v1/people/staff/${partyId}/account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, roleId: roleId || undefined }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Erreur création compte');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['people'] });
      setShowAccountModal(false);
      setTargetStaffForAccount(null);
    },
    onError: (err: any) => {
      setError(err.message);
    },
  });

  // Delete Staff Mutation
  const deleteStaffMutation = useMutation({
    mutationFn: async (partyId: string) => {
      const res = await fetch(`/api/v1/people/staff/${partyId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erreur suppression');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['people'] });
    },
  });

  // Create / Update Department Mutation
  const saveDeptMutation = useMutation({
    mutationFn: async (dept: { id?: string; name: string; code?: string; parentId?: string | null }) => {
      const url = dept.id ? `/api/v1/people/departments/${dept.id}` : '/api/v1/people/departments';
      const method = dept.id ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dept),
      });
      if (!res.ok) throw new Error('Erreur enregistrement département');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      setShowDeptModal(false);
      setEditingDept(null);
    },
  });

  // Delete Department Mutation
  const deleteDeptMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/v1/people/departments/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erreur suppression');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      queryClient.invalidateQueries({ queryKey: ['people'] });
    },
  });

  // Create Beneficiary Mutation
  const createBeneficiaryMutation = useMutation({
    mutationFn: async (newBen: any) => {
      const res = await fetch('/api/v1/people', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBen),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Erreur création bénéficiaire');
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['people'] });
      if (data.warnings && data.warnings.length > 0) {
        setBenWarnings(data.warnings);
      } else {
        setShowBeneficiaryModal(false);
        setBenFirstName('');
        setBenLastName('');
        setBenEmail('');
        setBenPhone('');
      }
    },
    onError: (err: any) => {
      setError(err.message);
    },
  });

  const resetStaffForm = (mode: 'staff' | 'volunteer' = 'staff') => {
    setEditingStaff(null);
    setStaffModalMode(mode);
    setStaffFirstName('');
    setStaffLastName('');
    setStaffEmail('');
    setStaffPhone('');
    setStaffJobTitle(mode === 'volunteer' ? t('people.types.volunteer') : '');
    setStaffEmploymentType(mode === 'volunteer' ? 'volunteer' : 'employee');
    setStaffDepartmentId('');
    setStaffStatus('active');
    setStaffHireDate(new Date().toISOString().split('T')[0]);
    setStaffEmergencyContact('');
    setStaffNotes('');
    setStaffCreateAccount(true);
    setStaffPassword('OrgDash2026!');
    setStaffRoleId('');
    setStaffSendInvite(false);
    setStaffWarnings([]);
    setError('');
  };

  const openEditStaffModal = (person: any) => {
    setEditingStaff(person);
    const mode = person.staff?.employmentType === 'volunteer' ? 'volunteer' : 'staff';
    setStaffModalMode(mode);
    setStaffFirstName(person.firstName || '');
    setStaffLastName(person.lastName || '');
    setStaffEmail(person.email || '');
    setStaffPhone(person.phone || '');
    setStaffJobTitle(person.staff?.jobTitle || '');
    setStaffEmploymentType(person.staff?.employmentType || 'employee');
    setStaffDepartmentId(person.staff?.departmentId || '');
    setStaffStatus(person.staff?.status || 'active');
    setStaffHireDate(person.staff?.hireDate || '');
    setStaffEmergencyContact(person.staff?.emergencyContact || '');
    setStaffNotes(person.staff?.notes || '');
    setStaffCreateAccount(!!person.staff?.userId);
    setStaffPassword('');
    setStaffRoleId(person.staff?.roles?.[0]?.id || '');
    setStaffSendInvite(false);
    setStaffWarnings([]);
    setError('');
    setShowStaffModal(true);
  };

  const handleStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const payload: any = {
      firstName: staffFirstName,
      lastName: staffLastName,
      email: staffEmail || undefined,
      phone: staffPhone || undefined,
      jobTitle: staffJobTitle,
      employmentType: staffEmploymentType,
      departmentId: staffDepartmentId || undefined,
      status: staffStatus,
      hireDate: staffHireDate || undefined,
      emergencyContact: staffEmergencyContact || undefined,
      notes: staffNotes || undefined,
      createAccount: staffCreateAccount,
      password: staffPassword || undefined,
      roleId: staffRoleId || undefined,
      sendInviteEmail: staffSendInvite,
    };

    if (editingStaff) {
      updateStaffMutation.mutate({ partyId: editingStaff.id, data: payload });
    } else {
      createStaffMutation.mutate(payload);
    }
  };

  const handleBeneficiarySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    createBeneficiaryMutation.mutate({
      firstName: benFirstName,
      lastName: benLastName,
      email: benEmail || undefined,
      phone: benPhone || undefined,
    });
  };

  // Filtered lists
  const staffMembers = people.filter((p: any) => p.staff !== null && p.staff?.employmentType !== 'volunteer');
  const volunteers = people.filter((p: any) => p.staff !== null && p.staff?.employmentType === 'volunteer');
  const beneficiaries = people.filter((p: any) => p.profile !== null || p.staff === null);

  const filteredStaff = staffMembers.filter((p: any) => {
    if (typeFilter !== 'all' && p.staff?.employmentType !== typeFilter) return false;
    if (deptFilter !== 'all' && p.staff?.departmentId !== deptFilter) return false;
    if (statusFilter !== 'all' && p.staff?.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const fullName = `${p.firstName || ''} ${p.lastName || ''}`.toLowerCase();
      const job = (p.staff?.jobTitle || '').toLowerCase();
      const email = (p.email || '').toLowerCase();
      const phone = (p.phone || '').toLowerCase();
      return fullName.includes(q) || job.includes(q) || email.includes(q) || phone.includes(q);
    }
    return true;
  });

  const filteredVolunteers = volunteers.filter((p: any) => {
    if (deptFilter !== 'all' && p.staff?.departmentId !== deptFilter) return false;
    if (statusFilter !== 'all' && p.staff?.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const fullName = `${p.firstName || ''} ${p.lastName || ''}`.toLowerCase();
      const job = (p.staff?.jobTitle || '').toLowerCase();
      const email = (p.email || '').toLowerCase();
      const notes = (p.staff?.notes || '').toLowerCase();
      return fullName.includes(q) || job.includes(q) || email.includes(q) || notes.includes(q);
    }
    return true;
  });

  const filteredBeneficiaries = beneficiaries.filter((p: any) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const fullName = `${p.firstName || ''} ${p.lastName || ''}`.toLowerCase();
      const email = (p.email || '').toLowerCase();
      const phone = (p.phone || '').toLowerCase();
      return fullName.includes(q) || email.includes(q) || phone.includes(q);
    }
    return true;
  });

  // KPI stats
  const totalEmployees = staffMembers.filter((s: any) => s.staff?.employmentType === 'employee').length;
  const totalBoard = staffMembers.filter((s: any) => s.staff?.employmentType === 'board_member').length;
  const totalContractors = staffMembers.filter((s: any) => s.staff?.employmentType === 'contractor' || s.staff?.employmentType === 'intern').length;
  const activeVolunteersCount = volunteers.filter((v: any) => v.staff?.status === 'active').length;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="mx-auto max-w-7xl p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Users className="h-7 w-7 text-indigo-600" />
              {t('people.title')}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {t('people.staff')} • {t('people.volunteers')} • {t('people.beneficiaries')}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'staff' && (
              <Button onClick={() => { resetStaffForm('staff'); setShowStaffModal(true); }}>
                <Plus className="mr-2 h-4 w-4" />
                {t('people.modals.newStaff')}
              </Button>
            )}
            {activeTab === 'volunteers' && (
              <Button onClick={() => { resetStaffForm('volunteer'); setShowStaffModal(true); }} className="bg-emerald-600 hover:bg-emerald-700">
                <HeartHandshake className="mr-2 h-4 w-4" />
                {t('people.modals.newVolunteer')}
              </Button>
            )}
            {activeTab === 'departments' && (
              <Button onClick={() => { setEditingDept(null); setNewDeptName(''); setNewDeptCode(''); setNewDeptParentId(''); setShowDeptModal(true); }}>
                <Building2 className="mr-2 h-4 w-4" />
                {t('people.modals.newDept')}
              </Button>
            )}
            {activeTab === 'beneficiaries' && (
              <Button onClick={() => { setBenWarnings([]); setShowBeneficiaryModal(true); }}>
                <UserPlus className="mr-2 h-4 w-4" />
                {t('people.modals.newBeneficiary')}
              </Button>
            )}
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 overflow-x-auto">
          <button
            onClick={() => { setActiveTab('staff'); setSearchQuery(''); setTypeFilter('all'); setDeptFilter('all'); setStatusFilter('all'); }}
            className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-bold transition whitespace-nowrap ${
              activeTab === 'staff'
                ? 'border-indigo-600 text-indigo-600 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Briefcase className="h-4 w-4" />
            {t('people.staff')} ({staffMembers.length})
          </button>
          <button
            onClick={() => { setActiveTab('volunteers'); setSearchQuery(''); setDeptFilter('all'); setStatusFilter('all'); }}
            className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-bold transition whitespace-nowrap ${
              activeTab === 'volunteers'
                ? 'border-emerald-600 text-emerald-600 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <HeartHandshake className="h-4 w-4 text-emerald-600" />
            {t('people.volunteers')} ({volunteers.length})
          </button>
          <button
            onClick={() => { setActiveTab('departments'); setSearchQuery(''); }}
            className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-bold transition whitespace-nowrap ${
              activeTab === 'departments'
                ? 'border-indigo-600 text-indigo-600 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building2 className="h-4 w-4" />
            {t('people.departments')} ({departments.length})
          </button>
          <button
            onClick={() => { setActiveTab('beneficiaries'); setSearchQuery(''); }}
            className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-bold transition whitespace-nowrap ${
              activeTab === 'beneficiaries'
                ? 'border-indigo-600 text-indigo-600 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="h-4 w-4 text-sky-600" />
            {t('people.beneficiaries')} ({beneficiaries.length})
          </button>
        </div>

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* TAB 1: PERSONNEL SALARIÉ & DIRECTION                              */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        {activeTab === 'staff' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
              <div className="rounded-xl border bg-white p-4 shadow-sm">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{t('people.stats.totalStaff')}</span>
                <p className="mt-1 text-2xl font-bold text-slate-900">{staffMembers.length}</p>
                <p className="text-xs text-slate-400 mt-0.5">{t('people.stats.totalStaffSub')}</p>
              </div>
              <div className="rounded-xl border bg-white p-4 shadow-sm">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{t('people.stats.regularEmployees')}</span>
                <p className="mt-1 text-2xl font-bold text-indigo-600">{totalEmployees}</p>
                <p className="text-xs text-slate-400 mt-0.5">{t('people.stats.regularEmployeesSub')}</p>
              </div>
              <div className="rounded-xl border bg-white p-4 shadow-sm">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{t('people.stats.boardMembers')}</span>
                <p className="mt-1 text-2xl font-bold text-purple-600">{totalBoard}</p>
                <p className="text-xs text-slate-400 mt-0.5">{t('people.stats.boardMembersSub')}</p>
              </div>
              <div className="rounded-xl border bg-white p-4 shadow-sm">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{t('people.stats.contractors')}</span>
                <p className="mt-1 text-2xl font-bold text-amber-600">{totalContractors}</p>
                <p className="text-xs text-slate-400 mt-0.5">{t('people.stats.contractorsSub')}</p>
              </div>
            </div>

            {/* Filter Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-slate-400" />
                  <span className="text-xs font-bold text-slate-700">{t('people.filters.contractType')}</span>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700"
                  >
                    <option value="all">{t('people.filters.allTypes')}</option>
                    <option value="employee">{t('people.types.employee')}</option>
                    <option value="board_member">{t('people.types.board_member')}</option>
                    <option value="contractor">{t('people.types.contractor')}</option>
                    <option value="intern">{t('people.types.intern')}</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">{t('people.filters.department')}</span>
                  <select
                    value={deptFilter}
                    onChange={(e) => setDeptFilter(e.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700"
                  >
                    <option value="all">{t('people.filters.allDepartments')}</option>
                    {departments.map((d: any) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">{t('people.filters.status')}</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700"
                  >
                    <option value="all">{t('people.filters.allStatuses')}</option>
                    <option value="active">{t('people.statuses.active')}</option>
                    <option value="on_leave">{t('people.statuses.on_leave')}</option>
                    <option value="inactive">{t('people.statuses.inactive')}</option>
                    <option value="archived">{t('people.statuses.archived')}</option>
                  </select>
                </div>
              </div>

              <div className="w-72">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('people.filters.searchPlaceholder')}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            {/* Staff Table */}
            <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
              {isLoading ? (
                <div className="p-8 text-center text-slate-500">{t('people.loading')}</div>
              ) : filteredStaff.length === 0 ? (
                <div className="p-10 text-center text-slate-400 space-y-2">
                  <Briefcase className="mx-auto h-8 w-8 text-slate-300" />
                  <p className="text-sm font-semibold">{t('people.emptyStates.noStaff')}</p>
                  <p className="text-xs">{t('people.emptyStates.noStaffDesc')}</p>
                </div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="border-b bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                    <tr>
                      <th className="px-6 py-3">{t('people.fullName')}</th>
                      <th className="px-6 py-3">{t('people.role')}</th>
                      <th className="px-6 py-3">{t('people.department')}</th>
                      <th className="px-6 py-3">{t('people.contractType')}</th>
                      <th className="px-6 py-3">{t('people.accountAccess')}</th>
                      <th className="px-6 py-3">{t('common.email')} / {t('common.actions')}</th>
                      <th className="px-6 py-3">{t('common.status')}</th>
                      <th className="px-6 py-3 text-right">{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStaff.map((p: any) => {
                      const typeCfg = EMPLOYMENT_TYPE_CONFIG[p.staff?.employmentType] || EMPLOYMENT_TYPE_CONFIG.employee;
                      const statusCfg = STAFF_STATUS_CONFIG[p.staff?.status] || STAFF_STATUS_CONFIG.active;
                      const hasAccount = !!p.staff?.userAccount;
                      const assignedRole = p.staff?.roles?.[0]?.name || (hasAccount ? t('people.activeAccount') : null);

                      return (
                        <tr key={p.id} className="hover:bg-slate-50 transition">
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-900">{p.firstName} {p.lastName}</div>
                            {p.staff?.hireDate && (
                              <div className="text-[11px] text-slate-400">{t('people.since')} {p.staff.hireDate}</div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-semibold text-slate-800">{p.staff?.jobTitle || '—'}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs text-slate-600">
                              {p.staff?.department?.name || '—'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${typeCfg.color}`}>
                              {t(typeCfg.labelKey)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {hasAccount ? (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                                  <ShieldCheck className="h-3.5 w-3.5" />
                                  {t('people.activeAccount')}
                                </span>
                                {assignedRole && (
                                  <div className="text-[11px] text-slate-500 font-medium">{assignedRole}</div>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                                  {t('people.noAccount')}
                                </span>
                                {p.email && (
                                  <button
                                    onClick={() => {
                                      setTargetStaffForAccount(p);
                                      setAccountPassword('OrgDash2026!');
                                      setAccountRoleId(roles[0]?.id || '');
                                      setShowAccountModal(true);
                                    }}
                                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
                                  >
                                    {t('people.createAccess')}
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-500">
                            {p.email && <div className="flex items-center gap-1"><Mail className="h-3 w-3 text-slate-400" /> {p.email}</div>}
                            {p.phone && <div className="flex items-center gap-1 mt-0.5"><Phone className="h-3 w-3 text-slate-400" /> {p.phone}</div>}
                            {!p.email && !p.phone && <span className="text-slate-400">—</span>}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusCfg.color}`}>
                              {t(statusCfg.labelKey)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
                                title={t('common.edit')}
                                onClick={() => openEditStaffModal(p)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/people/${p.id}`)}
                                title={t('common.viewProfile')}
                              >
                                {t('common.viewProfile')}
                                <ArrowRight className="ml-1 h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:bg-red-50 h-8 w-8 p-0"
                                title={t('common.delete')}
                                onClick={() => {
                                  if (confirm(`${t('common.confirm')} ${p.firstName} ${p.lastName} ?`)) {
                                    deleteStaffMutation.mutate(p.id);
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* TAB 2: BÉNÉVOLES & VOLONTAIRES                                    */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        {activeTab === 'volunteers' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-xl border bg-white p-4 shadow-sm border-l-4 border-l-emerald-500">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{t('people.stats.totalVolunteers')}</span>
                <p className="mt-1 text-2xl font-bold text-emerald-600">{volunteers.length}</p>
                <p className="text-xs text-slate-400 mt-0.5">{t('people.stats.totalVolunteersSub')}</p>
              </div>
              <div className="rounded-xl border bg-white p-4 shadow-sm">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{t('people.stats.activeVolunteers')}</span>
                <p className="mt-1 text-2xl font-bold text-indigo-600">{activeVolunteersCount}</p>
                <p className="text-xs text-slate-400 mt-0.5">{t('people.stats.activeVolunteersSub')}</p>
              </div>
              <div className="rounded-xl border bg-white p-4 shadow-sm">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{t('people.stats.volunteerDepts')}</span>
                <p className="mt-1 text-2xl font-bold text-purple-600">
                  {new Set(volunteers.map((v: any) => v.staff?.departmentId).filter(Boolean)).size}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">{t('people.stats.volunteerDeptsSub')}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-slate-400" />
                  <span className="text-xs font-bold text-slate-700">{t('people.filters.department')}</span>
                  <select
                    value={deptFilter}
                    onChange={(e) => setDeptFilter(e.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700"
                  >
                    <option value="all">{t('people.filters.allDepartments')}</option>
                    {departments.map((d: any) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">{t('people.filters.status')}</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700"
                  >
                    <option value="all">{t('people.filters.allStatuses')}</option>
                    <option value="active">{t('people.statuses.active')}</option>
                    <option value="on_leave">{t('people.statuses.on_leave')}</option>
                    <option value="inactive">{t('people.statuses.inactive')}</option>
                    <option value="archived">{t('people.statuses.archived')}</option>
                  </select>
                </div>
              </div>

              <div className="w-72">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('people.filters.searchVolunteerPlaceholder')}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
              {isLoading ? (
                <div className="p-8 text-center text-slate-500">{t('people.loading')}</div>
              ) : filteredVolunteers.length === 0 ? (
                <div className="p-10 text-center text-slate-400 space-y-2">
                  <HeartHandshake className="mx-auto h-8 w-8 text-emerald-300" />
                  <p className="text-sm font-semibold">{t('people.emptyStates.noVolunteers')}</p>
                  <p className="text-xs">{t('people.emptyStates.noVolunteersDesc')}</p>
                  <Button
                    size="sm"
                    className="mt-2 bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => { resetStaffForm('volunteer'); setShowStaffModal(true); }}
                  >
                    <HeartHandshake className="mr-2 h-4 w-4" />
                    {t('people.emptyStates.addFirstVolunteer')}
                  </Button>
                </div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="border-b bg-emerald-50/50 text-xs font-semibold uppercase text-slate-600">
                    <tr>
                      <th className="px-6 py-3">{t('people.fullName')}</th>
                      <th className="px-6 py-3">{t('people.role')}</th>
                      <th className="px-6 py-3">{t('people.department')}</th>
                      <th className="px-6 py-3">{t('people.email')}</th>
                      <th className="px-6 py-3">{t('people.notes')}</th>
                      <th className="px-6 py-3">{t('common.status')}</th>
                      <th className="px-6 py-3 text-right">{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredVolunteers.map((p: any) => {
                      const statusCfg = STAFF_STATUS_CONFIG[p.staff?.status] || STAFF_STATUS_CONFIG.active;

                      return (
                        <tr key={p.id} className="hover:bg-slate-50 transition">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                                {p.firstName?.[0]}{p.lastName?.[0]}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900">{p.firstName} {p.lastName}</div>
                                {p.staff?.hireDate && (
                                  <div className="text-[11px] text-slate-400">{t('people.enrolledOn')} {p.staff.hireDate}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-semibold text-slate-800">{p.staff?.jobTitle || t('people.types.volunteer')}</span>
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-600">
                            {p.staff?.department?.name || '—'}
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-500">
                            {p.email && <div className="flex items-center gap-1"><Mail className="h-3 w-3 text-slate-400" /> {p.email}</div>}
                            {p.phone && <div className="flex items-center gap-1 mt-0.5"><Phone className="h-3 w-3 text-slate-400" /> {p.phone}</div>}
                            {!p.email && !p.phone && <span className="text-slate-400">—</span>}
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-600 max-w-xs truncate">
                            {p.staff?.notes || '—'}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusCfg.color}`}>
                              {t(statusCfg.labelKey)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50"
                                onClick={() => openEditStaffModal(p)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => navigate(`/people/${p.id}`)}>
                                {t('common.viewProfile')}
                                <ArrowRight className="ml-1 h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:bg-red-50 h-8 w-8 p-0"
                                onClick={() => {
                                  if (confirm(`${t('common.confirm')} ${p.firstName} ${p.lastName} ?`)) {
                                    deleteStaffMutation.mutate(p.id);
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* TAB 3: DÉPARTEMENTS & PÔLES                                       */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        {activeTab === 'departments' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-800">{t('people.departments')}</h2>
                <p className="text-sm text-slate-500">{t('people.emptyStates.noDeptsDesc')}</p>
              </div>
              <Button onClick={() => { setEditingDept(null); setNewDeptName(''); setNewDeptCode(''); setNewDeptParentId(''); setShowDeptModal(true); }}>
                <Plus className="mr-2 h-4 w-4" />
                {t('people.modals.newDept')}
              </Button>
            </div>

            {departments.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center space-y-3">
                <Building2 className="mx-auto h-12 w-12 text-slate-300" />
                <h3 className="text-base font-bold text-slate-800">{t('people.emptyStates.noDepts')}</h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto">
                  {t('people.emptyStates.noDeptsDesc')}
                </p>
                <Button onClick={() => { setEditingDept(null); setNewDeptName(''); setNewDeptCode(''); setNewDeptParentId(''); setShowDeptModal(true); }}>
                  {t('people.emptyStates.addFirstDept')}
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {departments.map((dept: any) => {
                  const deptStaff = staffMembers.filter((s: any) => s.staff?.departmentId === dept.id);
                  const deptVolunteers = volunteers.filter((v: any) => v.staff?.departmentId === dept.id);
                  const totalMembers = deptStaff.length + deptVolunteers.length;

                  return (
                    <div key={dept.id} className="rounded-xl border bg-white p-5 shadow-sm space-y-4 hover:border-indigo-300 transition">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center border border-indigo-100">
                            {dept.code || <Building2 className="h-5 w-5" />}
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900 text-base">{dept.name}</h3>
                            {dept.code && <span className="text-xs font-mono font-semibold text-slate-400">Code: {dept.code}</span>}
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-slate-400 hover:text-slate-700"
                            onClick={() => {
                              setEditingDept(dept);
                              setNewDeptName(dept.name);
                              setNewDeptCode(dept.code || '');
                              setNewDeptParentId(dept.parentId || '');
                              setShowDeptModal(true);
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-400 hover:text-red-700"
                            onClick={() => {
                              if (confirm(`${t('common.confirm')} "${dept.name}" ?`)) {
                                deleteDeptMutation.mutate(dept.id);
                              }
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t text-xs">
                        <div className="rounded-lg bg-slate-50 p-2 text-center">
                          <span className="text-slate-400 block">{t('people.staff')}</span>
                          <span className="font-bold text-slate-800 text-sm">{deptStaff.length}</span>
                        </div>
                        <div className="rounded-lg bg-emerald-50 p-2 text-center">
                          <span className="text-emerald-600 block">{t('people.volunteers')}</span>
                          <span className="font-bold text-emerald-800 text-sm">{deptVolunteers.length}</span>
                        </div>
                      </div>

                      {totalMembers > 0 ? (
                        <div className="space-y-1">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">{t('people.title')}</span>
                          <div className="flex flex-wrap gap-1">
                            {[...deptStaff, ...deptVolunteers].slice(0, 5).map((m: any) => (
                              <span
                                key={m.id}
                                className={`inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium ${
                                  m.staff?.employmentType === 'volunteer'
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-100'
                                    : 'bg-indigo-50 text-indigo-800 border border-indigo-100'
                                }`}
                              >
                                {m.firstName} {m.lastName}
                              </span>
                            ))}
                            {totalMembers > 5 && (
                              <span className="inline-flex items-center rounded px-2 py-0.5 text-[11px] text-slate-400 bg-slate-100 font-medium">
                                +{totalMembers - 5}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">—</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* TAB 4: BÉNÉFICIAIRES & PERSONNES ACCOMPAGNÉES                    */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        {activeTab === 'beneficiaries' && (
          <div className="space-y-6">
            <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
              <div className="flex items-center justify-between border-b bg-slate-50 px-6 py-4">
                <div>
                  <h3 className="font-bold text-slate-800">{t('people.beneficiaries')}</h3>
                  <p className="text-xs text-slate-500">{t('people.emptyStates.noBeneficiariesDesc')}</p>
                </div>
                <div className="w-64">
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('people.filters.searchBeneficiaryPlaceholder')}
                    className="h-8 text-xs bg-white"
                  />
                </div>
              </div>

              {isLoading ? (
                <div className="p-6 text-center text-slate-500">{t('people.loading')}</div>
              ) : filteredBeneficiaries.length === 0 ? (
                <div className="p-8 text-center text-slate-500">{t('people.emptyStates.noBeneficiaries')}</div>
              ) : (
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-6 py-3">{t('people.fullName')}</th>
                      <th className="px-6 py-3">{t('people.email')}</th>
                      <th className="px-6 py-3">{t('people.phone')}</th>
                      <th className="px-6 py-3">{t('common.status')}</th>
                      <th className="px-6 py-3 text-right">{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredBeneficiaries.map((p: any) => (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 font-semibold text-slate-900">
                          {p.firstName} {p.lastName}
                        </td>
                        <td className="px-6 py-4">{p.email || '—'}</td>
                        <td className="px-6 py-4">{p.phone || '—'}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                            {t('people.statuses.active')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button variant="ghost" size="sm" onClick={() => navigate(`/people/${p.id}`)}>
                            {t('common.viewProfile')}
                            <ArrowRight className="ml-1 h-3 w-3" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* MODAL: CRÉER / MODIFIER UN COLLABORATEUR DU PERSONNEL / BÉNÉVOLE  */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        {showStaffModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b pb-3">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  {staffModalMode === 'volunteer' ? (
                    <>
                      <HeartHandshake className="h-5 w-5 text-emerald-600" />
                      {editingStaff ? t('people.modals.editVolunteer') : t('people.modals.newVolunteer')}
                    </>
                  ) : (
                    <>
                      <Briefcase className="h-5 w-5 text-indigo-600" />
                      {editingStaff ? t('people.modals.editStaff') : t('people.modals.newStaff')}
                    </>
                  )}
                </h2>
                <Button variant="ghost" size="sm" onClick={() => setShowStaffModal(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {error && <div className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</div>}

              {staffWarnings.length > 0 && (
                <div className="rounded bg-amber-50 p-4 text-xs text-amber-800 space-y-2 border border-amber-200">
                  <div className="font-bold text-amber-900">{t('people.modals.duplicateWarning')}</div>
                  {staffWarnings.map((w: any) => (
                    <div key={w.id} className="font-medium">• {w.firstName} {w.lastName} ({w.email || '—'})</div>
                  ))}
                </div>
              )}

              <form onSubmit={handleStaffSubmit} className="space-y-4">
                {/* Identity */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input label={`${t('people.firstName')} *`} value={staffFirstName} onChange={(e) => setStaffFirstName(e.target.value)} required />
                  <Input label={`${t('people.lastName')} *`} value={staffLastName} onChange={(e) => setStaffLastName(e.target.value)} required />
                  <Input
                    label={t('people.email')}
                    type="email"
                    value={staffEmail}
                    onChange={(e) => setStaffEmail(e.target.value)}
                    placeholder="personne@association.org"
                  />
                  <Input label={t('people.phone')} value={staffPhone} onChange={(e) => setStaffPhone(e.target.value)} placeholder="514-555-0199" />
                </div>

                {/* Professional Role */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 border-t pt-4">
                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-700">
                      {t('people.role')} *
                    </label>
                    <Input
                      value={staffJobTitle}
                      onChange={(e) => setStaffJobTitle(e.target.value)}
                      placeholder={staffModalMode === 'volunteer' ? 'Ex: Animation, Logistique...' : 'Ex: Directeur Général, Comptable...'}
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-700">{t('people.contractType')} *</label>
                    <select
                      value={staffEmploymentType}
                      onChange={(e) => setStaffEmploymentType(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    >
                      {staffModalMode === 'volunteer' ? (
                        <option value="volunteer">{t('people.types.volunteer')}</option>
                      ) : (
                        <>
                          <option value="employee">{t('people.types.employee')}</option>
                          <option value="board_member">{t('people.types.board_member')}</option>
                          <option value="contractor">{t('people.types.contractor')}</option>
                          <option value="intern">{t('people.types.intern')}</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700">{t('people.department')}</label>
                      <button
                        type="button"
                        onClick={() => { setEditingDept(null); setNewDeptName(''); setNewDeptCode(''); setNewDeptParentId(''); setShowDeptModal(true); }}
                        className="text-[11px] text-indigo-600 hover:underline font-medium"
                      >
                        + {t('people.modals.newDept')}
                      </button>
                    </div>
                    <select
                      value={staffDepartmentId}
                      onChange={(e) => setStaffDepartmentId(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="">— {t('common.all')} —</option>
                      {departments.map((d: any) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-700">{t('people.since')}</label>
                    <Input type="date" value={staffHireDate} onChange={(e) => setStaffHireDate(e.target.value)} />
                  </div>
                </div>

                {/* Additional details */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 border-t pt-4">
                  <Input label={t('people.emergencyContact')} value={staffEmergencyContact} onChange={(e) => setStaffEmergencyContact(e.target.value)} placeholder="Nom & Téléphone" />
                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-700">{t('common.status')}</label>
                    <select
                      value={staffStatus}
                      onChange={(e) => setStaffStatus(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                    >
                      <option value="active">{t('people.statuses.active')}</option>
                      <option value="on_leave">{t('people.statuses.on_leave')}</option>
                      <option value="inactive">{t('people.statuses.inactive')}</option>
                      <option value="archived">{t('people.statuses.archived')}</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-bold text-slate-700">{t('common.details')}</label>
                    <textarea
                      value={staffNotes}
                      onChange={(e) => setStaffNotes(e.target.value)}
                      rows={2}
                      className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs"
                      placeholder="..."
                    />
                  </div>
                </div>

                {/* User Account / Login Setup */}
                {staffEmail && (
                  <div className="rounded-xl bg-indigo-50/70 border border-indigo-100 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <KeyRound className="h-4 w-4 text-indigo-600" />
                        <span className="text-xs font-bold text-indigo-950">
                          {editingStaff?.staff?.userAccount ? t('people.modals.userAccountLinked') : t('people.modals.autoAccountCreate')}
                        </span>
                      </div>
                      {!editingStaff?.staff?.userAccount && (
                        <label className="flex items-center gap-2 text-xs font-bold text-indigo-900 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={staffCreateAccount}
                            onChange={(e) => setStaffCreateAccount(e.target.checked)}
                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          {t('people.modals.enableAccount')}
                        </label>
                      )}
                    </div>

                    {(staffCreateAccount || editingStaff?.staff?.userAccount) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        <div>
                          <label className="mb-1 block text-xs font-semibold text-slate-700">{t('people.modals.roleAssigned')}</label>
                          <select
                            value={staffRoleId}
                            onChange={(e) => setStaffRoleId(e.target.value)}
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                          >
                            <option value="">{t('people.modals.defaultRole')}</option>
                            {roles.map((r: any) => (
                              <option key={r.id} value={r.id}>{r.name} ({r.code})</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-semibold text-slate-700">
                            {t('people.modals.temporaryPassword')}
                          </label>
                          <Input
                            type="text"
                            value={staffPassword}
                            onChange={(e) => setStaffPassword(e.target.value)}
                            placeholder="OrgDash2026!"
                            className="h-8 text-xs"
                          />
                        </div>

                        <div className="sm:col-span-2 text-[11px] text-slate-500 flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          <span>{t('people.modals.loginSyncInfo')}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setShowStaffModal(false)}>
                    {t('common.cancel')}
                  </Button>
                  <Button
                    type="submit"
                    className={staffModalMode === 'volunteer' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                    disabled={createStaffMutation.isPending || updateStaffMutation.isPending || !staffFirstName.trim() || !staffLastName.trim() || !staffJobTitle.trim()}
                  >
                    {createStaffMutation.isPending || updateStaffMutation.isPending
                      ? t('common.saving')
                      : t('common.save')}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* MODAL: CRÉER RAPIDEMENT UN COMPTE UTILISATEUR D'ACCÈS             */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        {showAccountModal && targetStaffForAccount && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <KeyRound className="h-5 w-5 text-indigo-600" />
                  {t('people.modals.activateAccount')}
                </h3>
                <Button variant="ghost" size="sm" onClick={() => setShowAccountModal(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="rounded-lg bg-slate-50 p-3 border text-xs space-y-1">
                <div><strong>{t('people.fullName')} :</strong> {targetStaffForAccount.firstName} {targetStaffForAccount.lastName}</div>
                <div><strong>{t('people.email')} :</strong> {targetStaffForAccount.email}</div>
                <div><strong>{t('people.role')} :</strong> {targetStaffForAccount.staff?.jobTitle}</div>
              </div>

              {error && <div className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</div>}

              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">{t('people.modals.roleAssigned')}</label>
                  <select
                    value={accountRoleId}
                    onChange={(e) => setAccountRoleId(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="">{t('people.modals.defaultRole')}</option>
                    {roles.map((r: any) => (
                      <option key={r.id} value={r.id}>{r.name} ({r.code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">{t('people.modals.temporaryPassword')}</label>
                  <Input
                    type="text"
                    value={accountPassword}
                    onChange={(e) => setAccountPassword(e.target.value)}
                    placeholder="OrgDash2026!"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <Button variant="ghost" size="sm" onClick={() => setShowAccountModal(false)}>
                  {t('common.cancel')}
                </Button>
                <Button
                  size="sm"
                  onClick={() => createAccountMutation.mutate({
                    partyId: targetStaffForAccount.id,
                    password: accountPassword,
                    roleId: accountRoleId || undefined,
                  })}
                  disabled={createAccountMutation.isPending}
                >
                  {createAccountMutation.isPending ? t('common.loading') : t('people.modals.createAndActivate')}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* MODAL: CRÉER / MODIFIER DÉPARTEMENT / PÔLE                       */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        {showDeptModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-indigo-600" />
                {editingDept ? t('people.modals.editDept') : t('people.modals.newDept')}
              </h3>
              <div className="space-y-3">
                <Input
                  label={t('people.modals.deptName')}
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  placeholder="Ex: Direction des Programmes"
                  required
                />
                <Input
                  label={t('people.modals.deptCode')}
                  value={newDeptCode}
                  onChange={(e) => setNewDeptCode(e.target.value)}
                  placeholder="Ex: PROG"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <Button variant="ghost" size="sm" onClick={() => setShowDeptModal(false)}>{t('common.cancel')}</Button>
                <Button
                  size="sm"
                  onClick={() => saveDeptMutation.mutate({
                    id: editingDept?.id,
                    name: newDeptName,
                    code: newDeptCode || undefined,
                    parentId: newDeptParentId || undefined,
                  })}
                  disabled={!newDeptName.trim() || saveDeptMutation.isPending}
                >
                  {saveDeptMutation.isPending ? t('common.saving') : editingDept ? t('common.save') : t('common.create')}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* MODAL: AJOUTER UN BÉNÉFICIAIRE                                   */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        {showBeneficiaryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg space-y-4">
              <h2 className="text-lg font-bold text-slate-800">{t('people.modals.newBeneficiary')}</h2>

              {error && <div className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</div>}

              {benWarnings.length > 0 && (
                <div className="rounded bg-amber-50 p-4 text-xs text-amber-800 space-y-2 border border-amber-200">
                  <div className="font-bold text-amber-900">{t('people.modals.duplicateWarning')}</div>
                  {benWarnings.map((w: any) => (
                    <div key={w.id} className="font-medium">• {w.firstName} {w.lastName} ({w.email || '—'})</div>
                  ))}
                </div>
              )}

              <form onSubmit={handleBeneficiarySubmit} className="space-y-4">
                <Input label={`${t('people.firstName')} *`} value={benFirstName} onChange={(e) => setBenFirstName(e.target.value)} required />
                <Input label={`${t('people.lastName')} *`} value={benLastName} onChange={(e) => setBenLastName(e.target.value)} required />
                <Input label={t('people.email')} type="email" value={benEmail} onChange={(e) => setBenEmail(e.target.value)} />
                <Input label={t('people.phone')} value={benPhone} onChange={(e) => setBenPhone(e.target.value)} />

                <div className="flex justify-end space-x-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowBeneficiaryModal(false)}>
                    {t('common.cancel')}
                  </Button>
                  <Button type="submit" disabled={createBeneficiaryMutation.isPending || !benFirstName.trim() || !benLastName.trim()}>
                    {benWarnings.length > 0 ? t('common.confirm') : t('common.create')}
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
