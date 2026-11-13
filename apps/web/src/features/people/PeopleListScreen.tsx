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
  Home,
  GraduationCap,
  FolderKanban,
  Target,
  FileCheck2,
  PieChart,
  Layers,
  ChevronDown,
  ExternalLink,
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
  const [benType, setBenType] = useState<'individual' | 'household' | 'community' | 'organization' | 'institution'>('individual');
  const [benFirstName, setBenFirstName] = useState('');
  const [benLastName, setBenLastName] = useState('');
  const [benEntityName, setBenEntityName] = useState('');
  const [benEmail, setBenEmail] = useState('');
  const [benPhone, setBenPhone] = useState('');
  const [benBirthDate, setBenBirthDate] = useState('');
  const [benGender, setBenGender] = useState('');
  const [benMemberCount, setBenMemberCount] = useState('');
  const [benChildCount, setBenChildCount] = useState('');
  const [benMenCount, setBenMenCount] = useState('');
  const [benWomenCount, setBenWomenCount] = useState('');
  const [benOtherCount, setBenOtherCount] = useState('');
  const [benBoysCount, setBenBoysCount] = useState('');
  const [benGirlsCount, setBenGirlsCount] = useState('');
  const [benOtherChildrenCount, setBenOtherChildrenCount] = useState('');
  const [benLocation, setBenLocation] = useState('');
  const [benContactPerson, setBenContactPerson] = useState('');
  const [benSubCategory, setBenSubCategory] = useState('');
  const [benWarnings, setBenWarnings] = useState<any[]>([]);
  const [staffWarnings, setStaffWarnings] = useState<any[]>([]);
  const [error, setError] = useState('');

  // Beneficiary Filters & Grouping State
  const [benCategoryFilter, setBenCategoryFilter] = useState<string>('all');
  const [benProjectFilter, setBenProjectFilter] = useState<string>('all');
  const [benConsentFilter, setBenConsentFilter] = useState<string>('all');
  const [benGroupingMode, setBenGroupingMode] = useState<'flat' | 'by_project'>('flat');

  // Fetch Projects for filter & project grouping
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await fetch('/api/v1/projects');
      if (!res.ok) return [];
      return res.json();
    },
  });

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
        setBenType('individual');
        setBenFirstName('');
        setBenLastName('');
        setBenEntityName('');
        setBenEmail('');
        setBenPhone('');
        setBenBirthDate('');
        setBenGender('');
        setBenMemberCount('');
        setBenChildCount('');
        setBenMenCount('');
        setBenWomenCount('');
        setBenOtherCount('');
        setBenBoysCount('');
        setBenGirlsCount('');
        setBenOtherChildrenCount('');
        setBenLocation('');
        setBenContactPerson('');
        setBenSubCategory('');
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

    const isIndiv = benType === 'individual';
    const customFields: Record<string, any> = {
      beneficiaryType: benType,
    };

    if (benMemberCount) customFields.memberCount = parseInt(benMemberCount, 10);
    if (benChildCount) customFields.childCount = parseInt(benChildCount, 10);
    if (benMenCount) customFields.menCount = parseInt(benMenCount, 10);
    if (benWomenCount) customFields.womenCount = parseInt(benWomenCount, 10);
    if (benOtherCount) customFields.otherCount = parseInt(benOtherCount, 10);
    if (benBoysCount) customFields.boysCount = parseInt(benBoysCount, 10);
    if (benGirlsCount) customFields.girlsCount = parseInt(benGirlsCount, 10);
    if (benOtherChildrenCount) customFields.otherChildrenCount = parseInt(benOtherChildrenCount, 10);
    if (benLocation) customFields.location = benLocation;
    if (benContactPerson) customFields.contactPerson = benContactPerson;
    if (benSubCategory) customFields.subCategory = benSubCategory;

    createBeneficiaryMutation.mutate({
      kind: isIndiv ? 'person' : 'organization',
      beneficiaryType: benType,
      firstName: isIndiv ? benFirstName : undefined,
      lastName: isIndiv ? benLastName : benEntityName,
      name: isIndiv ? undefined : benEntityName,
      email: benEmail || undefined,
      phone: benPhone || undefined,
      birthDate: isIndiv && benBirthDate ? benBirthDate : undefined,
      genderCode: isIndiv && benGender ? benGender : undefined,
      customFields,
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
    const custom = p.profile?.customFields;
    const bType = custom?.beneficiaryType || (p.kind === 'organization' ? 'community' : 'individual');

    // 1. Category Filter
    if (benCategoryFilter !== 'all' && bType !== benCategoryFilter) {
      return false;
    }

    // 2. Project Filter
    const pDeliveries: any[] = p.serviceDeliveries || [];
    if (benProjectFilter === 'unassigned') {
      if (pDeliveries.length > 0) return false;
    } else if (benProjectFilter !== 'all') {
      const isLinkedToProject = pDeliveries.some((d: any) => d.projectId === benProjectFilter);
      if (!isLinkedToProject) return false;
    }

    // 3. Loi 25 Consent Filter
    const pConsents: any[] = p.consents || [];
    const hasGrantedConsent = pConsents.some((c: any) => c.status === 'granted');
    if (benConsentFilter === 'granted' && !hasGrantedConsent) return false;
    if (benConsentFilter === 'missing' && hasGrantedConsent) return false;

    // 4. Text Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const fullName = (p.kind === 'organization' ? (p.lastName || p.firstName) : `${p.firstName || ''} ${p.lastName || ''}`).toLowerCase();
      const email = (p.email || '').toLowerCase();
      const phone = (p.phone || '').toLowerCase();
      const location = (custom?.location || '').toLowerCase();
      const contactPerson = (custom?.contactPerson || '').toLowerCase();
      return (
        fullName.includes(q) ||
        email.includes(q) ||
        phone.includes(q) ||
        location.includes(q) ||
        contactPerson.includes(q)
      );
    }
    return true;
  });

  // Beneficiary Analytics / KPIs
  const benStats = (() => {
    let individualCount = 0;
    let householdCount = 0;
    let communityCount = 0;
    let orgCount = 0;
    let institutionCount = 0;
    let totalDirectPersons = 0;
    let totalMen = 0;
    let totalWomen = 0;
    let totalOther = 0;
    let totalBoys = 0;
    let totalGirls = 0;
    let totalChildren = 0;
    let assignedCount = 0;
    let consentGrantedCount = 0;

    for (const b of beneficiaries) {
      const custom = b.profile?.customFields;
      const bType = custom?.beneficiaryType || (b.kind === 'organization' ? 'community' : 'individual');
      const deliveries = b.serviceDeliveries || [];
      const consents = b.consents || [];

      let entityPersons = 0;

      if (bType === 'individual') {
        individualCount++;
        entityPersons = 1;
        const g = b.profile?.genderCode || b.genderCode;
        if (g === 'M') totalMen++;
        else if (g === 'F') totalWomen++;
        else if (g) totalOther++;
      } else {
        if (bType === 'household') householdCount++;
        else if (bType === 'community') communityCount++;
        else if (bType === 'organization') orgCount++;
        else if (bType === 'institution') institutionCount++;

        const mMen = Number(custom?.menCount) || 0;
        const mWomen = Number(custom?.womenCount) || 0;
        const mOther = Number(custom?.otherCount) || 0;
        const mBoys = Number(custom?.boysCount) || 0;
        const mGirls = Number(custom?.girlsCount) || 0;
        const mOtherKids = Number(custom?.otherChildrenCount) || 0;
        const sumGenders = mMen + mWomen + mOther + mBoys + mGirls + mOtherKids;

        const defaultFallback = bType === 'household' ? 4 : bType === 'community' ? 50 : bType === 'organization' ? 10 : 30;
        const explicitCount = custom?.memberCount ? Number(custom.memberCount) : 0;
        entityPersons = sumGenders > 0 ? Math.max(sumGenders, explicitCount) : (explicitCount > 0 ? explicitCount : defaultFallback);

        totalMen += mMen;
        totalWomen += mWomen;
        totalOther += mOther;
        totalBoys += mBoys;
        totalGirls += mGirls;
        const explicitKids = custom?.childCount ? Number(custom.childCount) : 0;
        totalChildren += (mBoys + mGirls + mOtherKids) > 0 ? (mBoys + mGirls + mOtherKids) : explicitKids;
      }

      totalDirectPersons += entityPersons;

      if (deliveries.length > 0) {
        assignedCount++;
      }
      if (consents.some((c: any) => c.status === 'granted')) {
        consentGrantedCount++;
      }
    }

    return {
      totalCount: beneficiaries.length,
      individualCount,
      householdCount,
      communityCount,
      orgCount,
      institutionCount,
      totalDirectPersons,
      totalMen,
      totalWomen,
      totalOther,
      totalBoys,
      totalGirls,
      totalChildren,
      assignedCount,
      unassignedCount: beneficiaries.length - assignedCount,
      assignedPct: beneficiaries.length > 0 ? Math.round((assignedCount / beneficiaries.length) * 100) : 0,
      consentGrantedCount,
      consentPct: beneficiaries.length > 0 ? Math.round((consentGrantedCount / beneficiaries.length) * 100) : 0,
    };
  })();

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
            <span>{t('people.beneficiaries')}</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200" title={`${benStats.totalDirectPersons} personnes touchées à travers ${beneficiaries.length} cibles répertoriées`}>
              <Users className="h-3 w-3 inline" />
              {benStats.totalDirectPersons} pers.
              <span className="text-[10px] font-normal text-indigo-600">({beneficiaries.length} cibles)</span>
            </span>
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
            {/* ── 1. TABLEAU DE BORD & INDICATEURS CLÉS (KPIS) ── */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border bg-white p-4 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Personnes Touchées (Impact Réel)
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <p className="text-2xl font-black text-indigo-600">{benStats.totalDirectPersons.toLocaleString()}</p>
                    <span className="text-xs font-semibold text-slate-500">personnes</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Sur un total de <strong className="text-slate-700 font-bold">{benStats.totalCount}</strong> entités cibles
                  </p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Users className="h-5 w-5" />
                </div>
              </div>

              {/* KPI 2: Répartition par Genre & Enfants */}
              <div className="rounded-xl border bg-white p-4 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Répartition Genre & Âge
                  </span>
                  <div className="mt-1 flex flex-wrap gap-1.5 text-xs font-semibold">
                    <span className="bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded" title="Hommes déclarés">
                      👨 {benStats.totalMen} H
                    </span>
                    <span className="bg-pink-50 text-pink-700 border border-pink-200 px-1.5 py-0.5 rounded" title="Femmes déclarées">
                      👩 {benStats.totalWomen} F
                    </span>
                    {benStats.totalOther > 0 && (
                      <span className="bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.5 rounded" title="Autre genre">
                        ⚧ {benStats.totalOther} Autre
                      </span>
                    )}
                    {benStats.totalChildren > 0 && (
                      <span className="bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded" title={`Enfants : ${benStats.totalBoys} garçons, ${benStats.totalGirls} filles`}>
                        🧒 {benStats.totalChildren} Enfants
                        {(benStats.totalBoys > 0 || benStats.totalGirls > 0) && (
                          <span className="text-[10px] text-amber-600 ml-1">({benStats.totalBoys}G / {benStats.totalGirls}F)</span>
                        )}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Ventilation consolidée des effectifs
                  </p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center">
                  <HeartHandshake className="h-5 w-5" />
                </div>
              </div>

              <div className="rounded-xl border bg-white p-4 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Affectation aux Projets
                  </span>
                  <p className="mt-1 text-2xl font-bold text-emerald-600">{benStats.assignedPct}%</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    <strong>{benStats.assignedCount}</strong> rattaché(s) • <strong>{benStats.unassignedCount}</strong> sans projet
                  </p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <FolderKanban className="h-5 w-5" />
                </div>
              </div>

              <div className="rounded-xl border bg-white p-4 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Typologies des Cibles ({benStats.totalCount})
                  </span>
                  <div className="mt-1 flex flex-wrap gap-1 text-[11px] font-semibold">
                    <span className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded">
                      {benStats.individualCount} indiv.
                    </span>
                    <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded">
                      {benStats.householdCount} ménages
                    </span>
                    <span className="bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded">
                      {benStats.communityCount} vill.
                    </span>
                    <span className="bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded">
                      {benStats.orgCount + benStats.institutionCount} struct.
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Loi 25: <strong>{benStats.consentPct}%</strong> conformes
                  </p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <PieChart className="h-5 w-5" />
                </div>
              </div>
            </div>

            {/* ── 2. BARRE D'ORGANISATION, FILTRES & MODE DE VUE ── */}
            <div className="rounded-xl border bg-white p-4 shadow-sm space-y-3">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                {/* Switcher Mode: Vue Regroupée par Projet vs Vue Linéaire */}
                <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setBenGroupingMode('flat')}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-bold transition ${
                      benGroupingMode === 'flat'
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Users className="h-3.5 w-3.5" />
                    Vue Liste globale ({filteredBeneficiaries.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setBenGroupingMode('by_project')}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-bold transition ${
                      benGroupingMode === 'by_project'
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <FolderKanban className="h-3.5 w-3.5" />
                    Vue par Projet
                  </button>
                </div>

                {/* Champ de recherche */}
                <div className="w-full md:w-80">
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher par nom, ville, référent, courriel..."
                    className="h-9 text-xs bg-white"
                  />
                </div>
              </div>

              {/* Filtres multicritères */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Projet rattaché
                  </label>
                  <select
                    value={benProjectFilter}
                    onChange={(e) => setBenProjectFilter(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800 focus:bg-white"
                  >
                    <option value="all">Tous les projets</option>
                    <option value="unassigned">⚠️ Non affectés à un projet</option>
                    {projects.map((proj: any) => (
                      <option key={proj.id} value={proj.id}>
                        {proj.code ? `[${proj.code}] ` : ''}{proj.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Typologie de bénéficiaire
                  </label>
                  <select
                    value={benCategoryFilter}
                    onChange={(e) => setBenCategoryFilter(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800 focus:bg-white"
                  >
                    <option value="all">Toutes les typologies</option>
                    <option value="individual">👤 Individu (personne physique)</option>
                    <option value="household">🏡 Ménage / Foyer familial</option>
                    <option value="community">🏘️ Village / Communauté locale</option>
                    <option value="organization">🏢 Organisation / Coopérative</option>
                    <option value="institution">🎓 Établissement / École / Hôpital</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Consentement Loi 25
                  </label>
                  <select
                    value={benConsentFilter}
                    onChange={(e) => setBenConsentFilter(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800 focus:bg-white"
                  >
                    <option value="all">Tous les statuts de consentement</option>
                    <option value="granted">✅ Consentement valide accordé</option>
                    <option value="missing">⏳ En attente / Non consigné</option>
                  </select>
                </div>
              </div>
            </div>

            {/* ── 3. LISTES ET AFFICHAGE DES RÉSULTATS ── */}
            {isLoading ? (
              <div className="rounded-xl border bg-white p-12 text-center text-slate-500">
                {t('people.loading')}
              </div>
            ) : filteredBeneficiaries.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center space-y-3">
                <Users className="mx-auto h-12 w-12 text-slate-300" />
                <h3 className="text-base font-bold text-slate-800">Aucun bénéficiaire correspondant aux critères</h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto">
                  Modifiez vos filtres ou cliquez sur « + Nouveau Bénéficiaire » pour en ajouter un nouveau.
                </p>
              </div>
            ) : benGroupingMode === 'by_project' ? (
              /* VUE PAR PROJET */
              <div className="space-y-6">
                {(() => {
                  // Group beneficiaries by project
                  const projectGroups: Record<string, { project: any; beneficiaries: any[] }> = {};
                  const unassigned: any[] = [];

                  for (const b of filteredBeneficiaries) {
                    const deliveries: any[] = b.serviceDeliveries || [];
                    if (deliveries.length === 0) {
                      unassigned.push(b);
                    } else {
                      const seenProjects = new Set<string>();
                      for (const d of deliveries) {
                        if (d.projectId && !seenProjects.has(d.projectId)) {
                          seenProjects.add(d.projectId);
                          if (!projectGroups[d.projectId]) {
                            const pObj = projects.find((p: any) => p.id === d.projectId) || {
                              id: d.projectId,
                              name: d.projectName || 'Projet',
                              code: d.projectCode || '',
                            };
                            projectGroups[d.projectId] = { project: pObj, beneficiaries: [] };
                          }
                          projectGroups[d.projectId].beneficiaries.push(b);
                        }
                      }
                    }
                  }

                  const groupEntries = Object.values(projectGroups);

                  return (
                    <>
                      {groupEntries.map(({ project: pInfo, beneficiaries: groupBens }) => (
                        <div key={pInfo.id} className="rounded-xl border bg-white shadow-sm overflow-hidden">
                          <div className="bg-slate-50 border-b px-6 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                                {pInfo.code || 'PROJ'}
                              </span>
                              <h3 className="font-bold text-slate-900 text-base">{pInfo.name}</h3>
                              <span className="text-xs text-slate-500 font-semibold">
                                ({groupBens.length} bénéficiaire{groupBens.length > 1 ? 's' : ''})
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs text-indigo-600 hover:text-indigo-800"
                              onClick={() => navigate(`/projects/${pInfo.id}`)}
                            >
                              Ouvrir le projet
                              <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                            </Button>
                          </div>

                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-600">
                              <thead className="bg-slate-50/50 text-[11px] uppercase tracking-wider text-slate-500 border-b">
                                <tr>
                                  <th className="px-6 py-3">Bénéficiaire / Cible</th>
                                  <th className="px-6 py-3">Dernière Prestation / Service</th>
                                  <th className="px-6 py-3">Zone / Localisation</th>
                                  <th className="px-6 py-3">Loi 25</th>
                                  <th className="px-6 py-3 text-right">Fiche</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {groupBens.map((p: any) => {
                                  const custom = p.profile?.customFields;
                                  const bType = custom?.beneficiaryType || (p.kind === 'organization' ? 'community' : 'individual');
                                  const displayName = p.kind === 'organization' ? (p.lastName || p.firstName) : `${p.firstName || ''} ${p.lastName || ''}`.trim();
                                  const projDeliveries = (p.serviceDeliveries || []).filter((d: any) => d.projectId === pInfo.id);
                                  const latestDeliv = projDeliveries[projDeliveries.length - 1];
                                  const hasConsent = (p.consents || []).some((c: any) => c.status === 'granted');

                                  const TYPE_BADGES: Record<string, { label: string; icon: any; color: string }> = {
                                    individual: { label: 'Individu', icon: Users, color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
                                    household: { label: 'Ménage', icon: Home, color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
                                    community: { label: 'Village', icon: Building2, color: 'bg-amber-100 text-amber-800 border-amber-200' },
                                    organization: { label: 'Organisation', icon: Users, color: 'bg-purple-50 text-purple-800 border-purple-200' },
                                    institution: { label: 'Établissement', icon: GraduationCap, color: 'bg-sky-50 text-sky-800 border-sky-200' },
                                  };
                                  const badgeCfg = TYPE_BADGES[bType] || TYPE_BADGES.individual;
                                  const BadgeIcon = badgeCfg.icon;

                                  return (
                                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                                      <td className="px-6 py-4 font-semibold text-slate-900">
                                        <div className="flex items-center gap-2">
                                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold border ${badgeCfg.color}`}>
                                            <BadgeIcon className="h-3 w-3" /> {badgeCfg.label}
                                          </span>
                                          <span>{displayName}</span>
                                        </div>
                                      </td>
                                      <td className="px-6 py-4 text-xs">
                                        {latestDeliv ? (
                                          <div>
                                            <span className="font-semibold text-slate-800 block">{latestDeliv.serviceType}</span>
                                            <span className="text-slate-400">
                                              {latestDeliv.deliveredAt ? new Date(latestDeliv.deliveredAt).toLocaleDateString() : ''}
                                              {latestDeliv.notes ? ` • ${latestDeliv.notes}` : ''}
                                            </span>
                                          </div>
                                        ) : (
                                          <span className="text-slate-400 italic">Associé au projet</span>
                                        )}
                                      </td>
                                      <td className="px-6 py-4 text-xs text-slate-600">
                                        <div className="space-y-0.5">
                                          <div>📍 {custom?.location || '—'}</div>
                                          {bType !== 'individual' && custom?.memberCount && (
                                            <div className="text-slate-700 font-semibold text-[11px]">
                                              👥 {custom.memberCount} pers.
                                              {(custom?.menCount || custom?.womenCount) && (
                                                <span className="text-slate-500 font-normal ml-1">
                                                  ({custom.menCount || 0}H / {custom.womenCount || 0}F)
                                                </span>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      </td>
                                      <td className="px-6 py-4 text-xs">
                                        {hasConsent ? (
                                          <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-semibold text-[11px]">
                                            <ShieldCheck className="h-3 w-3" /> Conforme
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-semibold text-[11px]">
                                            <ShieldAlert className="h-3 w-3" /> En attente
                                          </span>
                                        )}
                                      </td>
                                      <td className="px-6 py-4 text-right">
                                        <Button variant="ghost" size="sm" onClick={() => navigate(`/people/${p.id}`)}>
                                          Voir fiche
                                          <ArrowRight className="ml-1 h-3 w-3" />
                                        </Button>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}

                      {/* Section Non Affectés */}
                      {unassigned.length > 0 && (
                        <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50/40 shadow-sm overflow-hidden">
                          <div className="bg-amber-100/60 border-b border-amber-200 px-6 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-amber-900 text-sm">
                                ⚠️ Bénéficiaires non affectés à un projet ({unassigned.length})
                              </span>
                            </div>
                            <span className="text-xs text-amber-700">À rattacher via la fiche ou dans l'onglet du projet</span>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-600">
                              <tbody className="divide-y divide-amber-100">
                                {unassigned.map((p: any) => {
                                  const custom = p.profile?.customFields;
                                  const bType = custom?.beneficiaryType || (p.kind === 'organization' ? 'community' : 'individual');
                                  const displayName = p.kind === 'organization' ? (p.lastName || p.firstName) : `${p.firstName || ''} ${p.lastName || ''}`.trim();

                                  return (
                                    <tr key={p.id} className="hover:bg-amber-100/30">
                                      <td className="px-6 py-3 font-semibold text-slate-900">
                                        {displayName}
                                      </td>
                                      <td className="px-6 py-3 text-xs text-slate-500">
                                        {custom?.location ? `Zone: ${custom.location}` : '—'}
                                      </td>
                                      <td className="px-6 py-3 text-right">
                                        <Button variant="ghost" size="sm" onClick={() => navigate(`/people/${p.id}`)}>
                                          Voir fiche
                                          <ArrowRight className="ml-1 h-3 w-3" />
                                        </Button>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            ) : (
              /* VUE LINÉAIRE GLOBALE AVEC PROJETS ASSOCIÉS */
              <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b">
                      <tr>
                        <th className="px-6 py-3">Bénéficiaire & Typologie</th>
                        <th className="px-6 py-3">Projet(s) Associé(s)</th>
                        <th className="px-6 py-3">Détails Cibles & Localisation</th>
                        <th className="px-6 py-3">Loi 25</th>
                        <th className="px-6 py-3">Contact</th>
                        <th className="px-6 py-3 text-right">{t('common.actions')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredBeneficiaries.map((p: any) => {
                        const custom = p.profile?.customFields;
                        const bType = custom?.beneficiaryType || (p.kind === 'organization' ? 'community' : 'individual');
                        const displayName = p.kind === 'organization' ? (p.lastName || p.firstName) : `${p.firstName || ''} ${p.lastName || ''}`.trim();
                        const pDeliveries: any[] = p.serviceDeliveries || [];
                        const hasConsent = (p.consents || []).some((c: any) => c.status === 'granted');

                        const TYPE_BADGES: Record<string, { label: string; icon: any; color: string }> = {
                          individual: { label: 'Individu', icon: Users, color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
                          household: { label: 'Ménage / Foyer', icon: Home, color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
                          community: { label: 'Village / Communauté', icon: Building2, color: 'bg-amber-100 text-amber-800 border-amber-200' },
                          organization: { label: 'Organisation / Coop', icon: Users, color: 'bg-purple-50 text-purple-800 border-purple-200' },
                          institution: { label: 'Établissement / École', icon: GraduationCap, color: 'bg-sky-50 text-sky-800 border-sky-200' },
                        };

                        const badgeCfg = TYPE_BADGES[bType] || TYPE_BADGES.individual;
                        const BadgeIcon = badgeCfg.icon;

                        return (
                          <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 font-semibold text-slate-900">
                              <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold border ${badgeCfg.color}`}>
                                  <BadgeIcon className="h-3 w-3" /> {badgeCfg.label}
                                </span>
                                <span className="text-base text-slate-900 font-bold">{displayName}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-xs">
                              {pDeliveries.length === 0 ? (
                                <span className="inline-flex items-center text-slate-400 italic">
                                  Non rattaché
                                </span>
                              ) : (
                                <div className="flex flex-wrap gap-1">
                                  {pDeliveries.map((del: any) => (
                                    <span
                                      key={del.id}
                                      className="inline-flex items-center gap-1 rounded bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 border border-indigo-100"
                                      title={del.notes ? `Prestation: ${del.serviceType} (${del.notes})` : `Prestation: ${del.serviceType}`}
                                    >
                                      <FolderKanban className="h-3 w-3 text-indigo-500" />
                                      {del.projectCode ? `[${del.projectCode}] ` : ''}{del.projectName || 'Projet'}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 text-xs text-slate-600">
                              <div className="space-y-1">
                                {custom?.location && (
                                  <div>📍 Zone : <strong>{custom.location}</strong></div>
                                )}
                                {bType === 'individual' ? (
                                  <div className="text-slate-500">
                                    👤 Individu {p.profile?.genderCode ? `• Genre: ${p.profile.genderCode === 'F' ? 'Femme' : p.profile.genderCode === 'M' ? 'Homme' : 'Autre'}` : ''}
                                  </div>
                                ) : (
                                  <div>
                                    <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                                      👥 Effectif : <span className="text-indigo-700 font-bold">{custom?.memberCount || '—'} personnes</span>
                                    </div>
                                    {(custom?.menCount || custom?.womenCount || custom?.otherCount || custom?.boysCount || custom?.girlsCount || custom?.childCount) && (
                                      <div className="flex flex-wrap gap-1 text-[10px] mt-0.5">
                                        {custom?.menCount && <span className="bg-blue-50 text-blue-700 px-1 py-0.2 rounded border border-blue-200">👨 {custom.menCount} H</span>}
                                        {custom?.womenCount && <span className="bg-pink-50 text-pink-700 px-1 py-0.2 rounded border border-pink-200">👩 {custom.womenCount} F</span>}
                                        {custom?.otherCount && <span className="bg-purple-50 text-purple-700 px-1 py-0.2 rounded border border-purple-200">⚧ {custom.otherCount} Autre</span>}
                                        {(custom?.boysCount || custom?.girlsCount || custom?.otherChildrenCount) ? (
                                          <span className="bg-amber-50 text-amber-800 px-1 py-0.2 rounded border border-amber-200">
                                            🧒 Enfants: {custom?.boysCount || 0}G / {custom?.girlsCount || 0}F {custom?.otherChildrenCount ? `+ ${custom.otherChildrenCount}A` : ''}
                                          </span>
                                        ) : custom?.childCount ? (
                                          <span className="bg-amber-50 text-amber-800 px-1 py-0.2 rounded border border-amber-200">
                                            🧒 {custom.childCount} enfants
                                          </span>
                                        ) : null}
                                      </div>
                                    )}
                                  </div>
                                )}
                                {custom?.contactPerson && (
                                  <div className="text-slate-500 text-[11px]">👤 Référent : <strong>{custom.contactPerson}</strong></div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-xs">
                              {hasConsent ? (
                                <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-semibold text-[11px]">
                                  <ShieldCheck className="h-3 w-3" /> Conforme
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-semibold text-[11px]">
                                  <ShieldAlert className="h-3 w-3" /> En attente
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-xs text-slate-500">
                              <div>{p.email || '—'}</div>
                              {p.phone && <div className="text-[11px] text-slate-400">{p.phone}</div>}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <Button variant="ghost" size="sm" onClick={() => navigate(`/people/${p.id}`)}>
                                {t('common.viewProfile')}
                                <ArrowRight className="ml-1 h-3 w-3" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
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
            <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b pb-3">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-indigo-600" />
                  {t('people.modals.newBeneficiary')}
                </h2>
                <Button variant="ghost" size="sm" onClick={() => setShowBeneficiaryModal(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

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
                {/* Choix des 5 types de bénéficiaires */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Type de bénéficiaire</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { key: 'individual', label: 'Individu', icon: Users, desc: 'Personne physique' },
                      { key: 'household', label: 'Ménage / Famille', icon: Home, desc: 'Foyer partagé' },
                      { key: 'community', label: 'Village / Quartier', icon: Building2, desc: 'Communauté locale' },
                      { key: 'organization', label: 'Organisation / Coop', icon: Users, desc: 'Collectif ou GIE' },
                      { key: 'institution', label: 'Établissement', icon: GraduationCap, desc: 'École, Dispensaire' },
                    ].map((item) => {
                      const Icon = item.icon;
                      const isSelected = benType === item.key;
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => setBenType(item.key as any)}
                          className={`flex flex-col items-start p-2.5 rounded-lg border text-left transition-all ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 ring-2 ring-indigo-500/20'
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 font-bold text-xs">
                            <Icon className={`h-3.5 w-3.5 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`} />
                            <span>{item.label}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 mt-0.5">{item.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Formulaire spécifique selon le type */}
                {benType === 'individual' ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <Input label={`${t('people.firstName')} *`} value={benFirstName} onChange={(e) => setBenFirstName(e.target.value)} required />
                      <Input label={`${t('people.lastName')} *`} value={benLastName} onChange={(e) => setBenLastName(e.target.value)} required />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Input label="Date de naissance" type="date" value={benBirthDate} onChange={(e) => setBenBirthDate(e.target.value)} />
                      <div>
                        <label className="mb-1 block text-xs font-bold text-slate-700">Genre</label>
                        <select
                          value={benGender}
                          onChange={(e) => setBenGender(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                        >
                          <option value="">— Non spécifié —</option>
                          <option value="F">Femme</option>
                          <option value="M">Homme</option>
                          <option value="O">Autre</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ) : benType === 'household' ? (
                  <div className="space-y-3 bg-emerald-50/40 p-3.5 rounded-lg border border-emerald-200/60">
                    <Input
                      label="Nom de famille ou du ménage *"
                      placeholder="Ex: Famille Diallo (Foyer A)"
                      value={benEntityName}
                      onChange={(e) => setBenEntityName(e.target.value)}
                      required
                    />

                    {/* Identification des effectifs & Genre (Adultes et Enfants) */}
                    <div className="p-3 bg-white rounded-lg border border-emerald-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                          Composition & Ventilation par Genre
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          Total membres : <strong>{benMemberCount || (Number(benMenCount || 0) + Number(benWomenCount || 0) + Number(benOtherCount || 0) + Number(benBoysCount || 0) + Number(benGirlsCount || 0) + Number(benOtherChildrenCount || 0)) || '0'}</strong>
                        </span>
                      </div>

                      <div className="text-[11px] font-semibold text-slate-600 pt-1">Adultes :</div>
                      <div className="grid grid-cols-3 gap-2">
                        <Input
                          label="Hommes (H)"
                          type="number"
                          placeholder="0"
                          value={benMenCount}
                          onChange={(e) => {
                            setBenMenCount(e.target.value);
                            const m = Number(e.target.value) || 0;
                            const w = Number(benWomenCount) || 0;
                            const o = Number(benOtherCount) || 0;
                            const b = Number(benBoysCount) || 0;
                            const g = Number(benGirlsCount) || 0;
                            const ok = Number(benOtherChildrenCount) || 0;
                            setBenMemberCount(String(m + w + o + b + g + ok));
                          }}
                        />
                        <Input
                          label="Femmes (F)"
                          type="number"
                          placeholder="0"
                          value={benWomenCount}
                          onChange={(e) => {
                            setBenWomenCount(e.target.value);
                            const m = Number(benMenCount) || 0;
                            const w = Number(e.target.value) || 0;
                            const o = Number(benOtherCount) || 0;
                            const b = Number(benBoysCount) || 0;
                            const g = Number(benGirlsCount) || 0;
                            const ok = Number(benOtherChildrenCount) || 0;
                            setBenMemberCount(String(m + w + o + b + g + ok));
                          }}
                        />
                        <Input
                          label="Autre genre"
                          type="number"
                          placeholder="0"
                          value={benOtherCount}
                          onChange={(e) => {
                            setBenOtherCount(e.target.value);
                            const m = Number(benMenCount) || 0;
                            const w = Number(benWomenCount) || 0;
                            const o = Number(e.target.value) || 0;
                            const b = Number(benBoysCount) || 0;
                            const g = Number(benGirlsCount) || 0;
                            const ok = Number(benOtherChildrenCount) || 0;
                            setBenMemberCount(String(m + w + o + b + g + ok));
                          }}
                        />
                      </div>

                      <div className="text-[11px] font-semibold text-slate-600 pt-1">Enfants / Jeunes dépendants :</div>
                      <div className="grid grid-cols-3 gap-2">
                        <Input
                          label="Garçons"
                          type="number"
                          placeholder="0"
                          value={benBoysCount}
                          onChange={(e) => {
                            setBenBoysCount(e.target.value);
                            const b = Number(e.target.value) || 0;
                            const g = Number(benGirlsCount) || 0;
                            const ok = Number(benOtherChildrenCount) || 0;
                            setBenChildCount(String(b + g + ok));
                            const m = Number(benMenCount) || 0;
                            const w = Number(benWomenCount) || 0;
                            const o = Number(benOtherCount) || 0;
                            setBenMemberCount(String(m + w + o + b + g + ok));
                          }}
                        />
                        <Input
                          label="Filles"
                          type="number"
                          placeholder="0"
                          value={benGirlsCount}
                          onChange={(e) => {
                            setBenGirlsCount(e.target.value);
                            const b = Number(benBoysCount) || 0;
                            const g = Number(e.target.value) || 0;
                            const ok = Number(benOtherChildrenCount) || 0;
                            setBenChildCount(String(b + g + ok));
                            const m = Number(benMenCount) || 0;
                            const w = Number(benWomenCount) || 0;
                            const o = Number(benOtherCount) || 0;
                            setBenMemberCount(String(m + w + o + b + g + ok));
                          }}
                        />
                        <Input
                          label="Autre enfant"
                          type="number"
                          placeholder="0"
                          value={benOtherChildrenCount}
                          onChange={(e) => {
                            setBenOtherChildrenCount(e.target.value);
                            const b = Number(benBoysCount) || 0;
                            const g = Number(benGirlsCount) || 0;
                            const ok = Number(e.target.value) || 0;
                            setBenChildCount(String(b + g + ok));
                            const m = Number(benMenCount) || 0;
                            const w = Number(benWomenCount) || 0;
                            const o = Number(benOtherCount) || 0;
                            setBenMemberCount(String(m + w + o + b + g + ok));
                          }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        label="Chef de famille / Référent"
                        placeholder="Ex: Amadou Diallo"
                        value={benContactPerson}
                        onChange={(e) => setBenContactPerson(e.target.value)}
                      />
                      <Input
                        label="Adresse / Localisation"
                        placeholder="Ex: Rue 14, Porte 3"
                        value={benLocation}
                        onChange={(e) => setBenLocation(e.target.value)}
                      />
                    </div>
                  </div>
                ) : benType === 'community' ? (
                  <div className="space-y-3 bg-amber-50/40 p-3.5 rounded-lg border border-amber-200/60">
                    <Input
                      label="Nom du village ou de la communauté *"
                      placeholder="Ex: Population du village Fatou"
                      value={benEntityName}
                      onChange={(e) => setBenEntityName(e.target.value)}
                      required
                    />

                    {/* Identification des effectifs & Genre (Adultes et Enfants) */}
                    <div className="p-3 bg-white rounded-lg border border-amber-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                          Identification des Effectifs & Genre
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          Total habitants : <strong>{benMemberCount || (Number(benMenCount || 0) + Number(benWomenCount || 0) + Number(benOtherCount || 0) + Number(benBoysCount || 0) + Number(benGirlsCount || 0) + Number(benOtherChildrenCount || 0)) || '0'}</strong>
                        </span>
                      </div>

                      <div className="text-[11px] font-semibold text-slate-600 pt-1">Population Adulte :</div>
                      <div className="grid grid-cols-3 gap-2">
                        <Input
                          label="Hommes (H)"
                          type="number"
                          placeholder="0"
                          value={benMenCount}
                          onChange={(e) => {
                            setBenMenCount(e.target.value);
                            const m = Number(e.target.value) || 0;
                            const w = Number(benWomenCount) || 0;
                            const o = Number(benOtherCount) || 0;
                            const b = Number(benBoysCount) || 0;
                            const g = Number(benGirlsCount) || 0;
                            const ok = Number(benOtherChildrenCount) || 0;
                            setBenMemberCount(String(m + w + o + b + g + ok));
                          }}
                        />
                        <Input
                          label="Femmes (F)"
                          type="number"
                          placeholder="0"
                          value={benWomenCount}
                          onChange={(e) => {
                            setBenWomenCount(e.target.value);
                            const m = Number(benMenCount) || 0;
                            const w = Number(e.target.value) || 0;
                            const o = Number(benOtherCount) || 0;
                            const b = Number(benBoysCount) || 0;
                            const g = Number(benGirlsCount) || 0;
                            const ok = Number(benOtherChildrenCount) || 0;
                            setBenMemberCount(String(m + w + o + b + g + ok));
                          }}
                        />
                        <Input
                          label="Autre"
                          type="number"
                          placeholder="0"
                          value={benOtherCount}
                          onChange={(e) => {
                            setBenOtherCount(e.target.value);
                            const m = Number(benMenCount) || 0;
                            const w = Number(benWomenCount) || 0;
                            const o = Number(e.target.value) || 0;
                            const b = Number(benBoysCount) || 0;
                            const g = Number(benGirlsCount) || 0;
                            const ok = Number(benOtherChildrenCount) || 0;
                            setBenMemberCount(String(m + w + o + b + g + ok));
                          }}
                        />
                      </div>

                      <div className="text-[11px] font-semibold text-slate-600 pt-1">Enfants & Jeunes :</div>
                      <div className="grid grid-cols-3 gap-2">
                        <Input
                          label="Garçons"
                          type="number"
                          placeholder="0"
                          value={benBoysCount}
                          onChange={(e) => {
                            setBenBoysCount(e.target.value);
                            const b = Number(e.target.value) || 0;
                            const g = Number(benGirlsCount) || 0;
                            const ok = Number(benOtherChildrenCount) || 0;
                            setBenChildCount(String(b + g + ok));
                            const m = Number(benMenCount) || 0;
                            const w = Number(benWomenCount) || 0;
                            const o = Number(benOtherCount) || 0;
                            setBenMemberCount(String(m + w + o + b + g + ok));
                          }}
                        />
                        <Input
                          label="Filles"
                          type="number"
                          placeholder="0"
                          value={benGirlsCount}
                          onChange={(e) => {
                            setBenGirlsCount(e.target.value);
                            const b = Number(benBoysCount) || 0;
                            const g = Number(e.target.value) || 0;
                            const ok = Number(benOtherChildrenCount) || 0;
                            setBenChildCount(String(b + g + ok));
                            const m = Number(benMenCount) || 0;
                            const w = Number(benWomenCount) || 0;
                            const o = Number(benOtherCount) || 0;
                            setBenMemberCount(String(m + w + o + b + g + ok));
                          }}
                        />
                        <Input
                          label="Autre"
                          type="number"
                          placeholder="0"
                          value={benOtherChildrenCount}
                          onChange={(e) => {
                            setBenOtherChildrenCount(e.target.value);
                            const b = Number(benBoysCount) || 0;
                            const g = Number(benGirlsCount) || 0;
                            const ok = Number(e.target.value) || 0;
                            setBenChildCount(String(b + g + ok));
                            const m = Number(benMenCount) || 0;
                            const w = Number(benWomenCount) || 0;
                            const o = Number(benOtherCount) || 0;
                            setBenMemberCount(String(m + w + o + b + g + ok));
                          }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        label="Commune / Région"
                        placeholder="Ex: Région Centre"
                        value={benLocation}
                        onChange={(e) => setBenLocation(e.target.value)}
                      />
                      <Input
                        label="Chef de village / Référent"
                        placeholder="Ex: Amadou Traoré"
                        value={benContactPerson}
                        onChange={(e) => setBenContactPerson(e.target.value)}
                      />
                    </div>
                  </div>
                ) : benType === 'organization' ? (
                  <div className="space-y-3 bg-purple-50/40 p-3.5 rounded-lg border border-purple-200/60">
                    <Input
                      label="Nom de l'organisation ou de la coopérative *"
                      placeholder="Ex: Coopérative des maraîchères de Fatou"
                      value={benEntityName}
                      onChange={(e) => setBenEntityName(e.target.value)}
                      required
                    />

                    {/* Identification des effectifs & Genre */}
                    <div className="p-3 bg-white rounded-lg border border-purple-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                          Membres & Répartition par Genre
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          Total membres : <strong>{benMemberCount || (Number(benMenCount || 0) + Number(benWomenCount || 0) + Number(benOtherCount || 0)) || '0'}</strong>
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <Input
                          label="Hommes (H)"
                          type="number"
                          placeholder="0"
                          value={benMenCount}
                          onChange={(e) => {
                            setBenMenCount(e.target.value);
                            const m = Number(e.target.value) || 0;
                            const w = Number(benWomenCount) || 0;
                            const o = Number(benOtherCount) || 0;
                            setBenMemberCount(String(m + w + o));
                          }}
                        />
                        <Input
                          label="Femmes (F)"
                          type="number"
                          placeholder="0"
                          value={benWomenCount}
                          onChange={(e) => {
                            setBenWomenCount(e.target.value);
                            const m = Number(benMenCount) || 0;
                            const w = Number(e.target.value) || 0;
                            const o = Number(benOtherCount) || 0;
                            setBenMemberCount(String(m + w + o));
                          }}
                        />
                        <Input
                          label="Autre"
                          type="number"
                          placeholder="0"
                          value={benOtherCount}
                          onChange={(e) => {
                            setBenOtherCount(e.target.value);
                            const m = Number(benMenCount) || 0;
                            const w = Number(benWomenCount) || 0;
                            const o = Number(e.target.value) || 0;
                            setBenMemberCount(String(m + w + o));
                          }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        label="Secteur / Domaine d'activité"
                        placeholder="Ex: Agriculture maraîchère"
                        value={benSubCategory}
                        onChange={(e) => setBenSubCategory(e.target.value)}
                      />
                      <Input
                        label="Représentant(e) légal(e)"
                        placeholder="Ex: Aminata Sow"
                        value={benContactPerson}
                        onChange={(e) => setBenContactPerson(e.target.value)}
                      />
                    </div>
                    <Input
                      label="Siège / Adresse"
                      placeholder="Ex: Case communautaire"
                      value={benLocation}
                      onChange={(e) => setBenLocation(e.target.value)}
                    />
                  </div>
                ) : (
                  <div className="space-y-3 bg-sky-50/40 p-3.5 rounded-lg border border-sky-200/60">
                    <Input
                      label="Nom de l'établissement (École, Centre de santé) *"
                      placeholder="Ex: École primaire publique Fatou"
                      value={benEntityName}
                      onChange={(e) => setBenEntityName(e.target.value)}
                      required
                    />

                    {/* Effectifs de l'établissement */}
                    <div className="p-3 bg-white rounded-lg border border-sky-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                          Effectif & Ventilation des usagers / élèves
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          Total : <strong>{benMemberCount || (Number(benMenCount || 0) + Number(benWomenCount || 0) + Number(benOtherCount || 0) + Number(benBoysCount || 0) + Number(benGirlsCount || 0)) || '0'}</strong>
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <Input
                          label="Garçons / Hommes"
                          type="number"
                          placeholder="0"
                          value={benMenCount}
                          onChange={(e) => {
                            setBenMenCount(e.target.value);
                            const m = Number(e.target.value) || 0;
                            const w = Number(benWomenCount) || 0;
                            const o = Number(benOtherCount) || 0;
                            setBenMemberCount(String(m + w + o));
                          }}
                        />
                        <Input
                          label="Filles / Femmes"
                          type="number"
                          placeholder="0"
                          value={benWomenCount}
                          onChange={(e) => {
                            setBenWomenCount(e.target.value);
                            const m = Number(benMenCount) || 0;
                            const w = Number(e.target.value) || 0;
                            const o = Number(benOtherCount) || 0;
                            setBenMemberCount(String(m + w + o));
                          }}
                        />
                        <Input
                          label="Autre"
                          type="number"
                          placeholder="0"
                          value={benOtherCount}
                          onChange={(e) => {
                            setBenOtherCount(e.target.value);
                            const m = Number(benMenCount) || 0;
                            const w = Number(benWomenCount) || 0;
                            const o = Number(e.target.value) || 0;
                            setBenMemberCount(String(m + w + o));
                          }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1 block text-xs font-bold text-slate-700">Type d'établissement</label>
                        <select
                          value={benSubCategory}
                          onChange={(e) => setBenSubCategory(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                        >
                          <option value="ecole">École / Éducation</option>
                          <option value="sante">Centre de santé / Dispensaire</option>
                          <option value="formation">Centre de formation professionnelle</option>
                          <option value="autre">Autre établissement public</option>
                        </select>
                      </div>
                      <Input
                        label="Directeur / Responsable"
                        placeholder="Ex: Mamadou Diop"
                        value={benContactPerson}
                        onChange={(e) => setBenContactPerson(e.target.value)}
                      />
                    </div>
                    <Input
                      label="Localisation"
                      placeholder="Ex: Village Fatou"
                      value={benLocation}
                      onChange={(e) => setBenLocation(e.target.value)}
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <Input label={t('people.email')} type="email" placeholder="contact@..." value={benEmail} onChange={(e) => setBenEmail(e.target.value)} />
                  <Input label={t('people.phone')} placeholder="+221..." value={benPhone} onChange={(e) => setBenPhone(e.target.value)} />
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setShowBeneficiaryModal(false)}>
                    {t('common.cancel')}
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      createBeneficiaryMutation.isPending ||
                      (benType === 'individual' && (!benFirstName.trim() || !benLastName.trim())) ||
                      (benType !== 'individual' && !benEntityName.trim())
                    }
                  >
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
