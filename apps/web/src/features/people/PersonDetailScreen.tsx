import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Input, Badge } from '@orgdashio/ui';
import {
  ArrowLeft,
  User,
  ShieldCheck,
  HeartHandshake,
  Briefcase,
  Building2,
  Calendar,
  Phone,
  Mail,
  FileText,
  AlertCircle,
  Pencil,
  KeyRound,
  CheckCircle2,
  X,
} from 'lucide-react';
import { DocumentListWidget } from '../document/DocumentListWidget';
import { Navbar } from '../../components/Navbar';
import { EMPLOYMENT_TYPE_CONFIG, STAFF_STATUS_CONFIG } from './PeopleListScreen';

export function PersonDetailScreen() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showEditModal, setShowEditModal] = useState(false);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editJobTitle, setEditJobTitle] = useState('');
  const [editDepartmentId, setEditDepartmentId] = useState('');
  const [editEmploymentType, setEditEmploymentType] = useState('employee');
  const [editStatus, setEditStatus] = useState('active');
  const [editHireDate, setEditHireDate] = useState('');
  const [editEmergencyContact, setEditEmergencyContact] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRoleId, setEditRoleId] = useState('');
  const [editError, setEditError] = useState('');

  // Account creation modal
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [accountPassword, setAccountPassword] = useState('OrgDash2026!');
  const [accountRoleId, setAccountRoleId] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['person', id],
    queryFn: async () => {
      const res = await fetch(`/api/v1/people/${id}`);
      if (!res.ok) throw new Error('Erreur chargement personne');
      return res.json();
    },
    enabled: !!id,
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const res = await fetch('/api/v1/people/departments');
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await fetch('/api/v1/people/roles');
      if (!res.ok) return [];
      return res.json();
    },
  });

  const updateStaffMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch(`/api/v1/people/staff/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Erreur mise à jour');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['person', id] });
      queryClient.invalidateQueries({ queryKey: ['people'] });
      setShowEditModal(false);
    },
    onError: (err: any) => {
      setEditError(err.message);
    },
  });

  const createAccountMutation = useMutation({
    mutationFn: async ({ password, roleId }: { password?: string; roleId?: string }) => {
      const res = await fetch(`/api/v1/people/staff/${id}/account`, {
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
      queryClient.invalidateQueries({ queryKey: ['person', id] });
      queryClient.invalidateQueries({ queryKey: ['people'] });
      setShowAccountModal(false);
    },
    onError: (err: any) => {
      setEditError(err.message);
    },
  });

  if (isLoading || !data) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="flex items-center justify-center p-8 text-slate-500">{t('common.loading')}</div>
      </div>
    );
  }

  const { party: personParty, profile, staff, consents = [], serviceDeliveries = [] } = data;
  const isStaff = !!staff;
  const employmentCfg = staff ? (EMPLOYMENT_TYPE_CONFIG[staff.employmentType] || EMPLOYMENT_TYPE_CONFIG.employee) : null;
  const statusCfg = staff ? (STAFF_STATUS_CONFIG[staff.status] || STAFF_STATUS_CONFIG.active) : null;
  const hasAccount = !!staff?.userAccount;

  const openEditModal = () => {
    setEditFirstName(personParty.firstName || '');
    setEditLastName(personParty.lastName || '');
    setEditEmail(personParty.email || '');
    setEditPhone(personParty.phone || '');
    setEditJobTitle(staff?.jobTitle || '');
    setEditDepartmentId(staff?.departmentId || '');
    setEditEmploymentType(staff?.employmentType || 'employee');
    setEditStatus(staff?.status || 'active');
    setEditHireDate(staff?.hireDate || '');
    setEditEmergencyContact(staff?.emergencyContact || '');
    setEditNotes(staff?.notes || '');
    setEditPassword('');
    setEditRoleId(staff?.roles?.[0]?.id || '');
    setEditError('');
    setShowEditModal(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEditError('');
    updateStaffMutation.mutate({
      firstName: editFirstName,
      lastName: editLastName,
      email: editEmail || undefined,
      phone: editPhone || undefined,
      jobTitle: editJobTitle,
      departmentId: editDepartmentId || undefined,
      employmentType: editEmploymentType,
      status: editStatus,
      hireDate: editHireDate || undefined,
      emergencyContact: editEmergencyContact || undefined,
      notes: editNotes || undefined,
      password: editPassword || undefined,
      roleId: editRoleId || undefined,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="mx-auto max-w-5xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate('/people')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('common.back')}
          </Button>

          {isStaff && (
            <Button size="sm" onClick={openEditModal}>
              <Pencil className="mr-2 h-4 w-4" />
              {t('common.edit')}
            </Button>
          )}
        </div>

        {/* Profile Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl border bg-white p-6 shadow-sm">
          <div className="flex items-center space-x-4">
            <div className={`flex h-16 w-16 items-center justify-center rounded-2xl font-bold text-2xl ${
              isStaff ? 'bg-indigo-600 text-white shadow-md' : 'bg-emerald-600 text-white shadow-md'
            }`}>
              {personParty.firstName?.[0]}{personParty.lastName?.[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900">
                  {personParty.firstName} {personParty.lastName}
                </h1>
                {isStaff && employmentCfg && (
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${employmentCfg.color}`}>
                    {t(employmentCfg.labelKey)}
                  </span>
                )}
                {!isStaff && (
                  <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                    {t('people.beneficiaries')}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500 mt-1 flex items-center gap-3">
                {personParty.email && <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5 text-slate-400" /> {personParty.email}</span>}
                {personParty.phone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5 text-slate-400" /> {personParty.phone}</span>}
                {!personParty.email && !personParty.phone && <span>{t('people.noCoordinates')}</span>}
              </p>
            </div>
          </div>

          <div>
            {statusCfg && (
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${statusCfg.color}`}>
                {t(statusCfg.labelKey)}
              </span>
            )}
          </div>
        </div>

        {/* Staff Profile Section if applicable */}
        {isStaff && (
          <div className="rounded-xl border bg-white p-6 shadow-sm space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b pb-3">
                <Briefcase className="h-5 w-5 text-indigo-600" />
                {t('people.staff')}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm mt-4">
                <div>
                  <span className="text-xs font-semibold uppercase text-slate-400">{t('people.role')}</span>
                  <p className="mt-1 font-bold text-slate-900 text-base">{staff.jobTitle}</p>
                </div>

                <div>
                  <span className="text-xs font-semibold uppercase text-slate-400">{t('people.department')}</span>
                  <p className="mt-1 font-semibold text-slate-800 flex items-center gap-1">
                    <Building2 className="h-4 w-4 text-indigo-500" />
                    {staff.department?.name || '—'}
                  </p>
                </div>

                <div>
                  <span className="text-xs font-semibold uppercase text-slate-400">{t('people.since')}</span>
                  <p className="mt-1 font-semibold text-slate-800 flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-indigo-500" />
                    {staff.hireDate || '—'}
                  </p>
                </div>

                {staff.emergencyContact && (
                  <div className="sm:col-span-2">
                    <span className="text-xs font-semibold uppercase text-slate-400">{t('people.emergencyContact')}</span>
                    <p className="mt-1 text-slate-800">{staff.emergencyContact}</p>
                  </div>
                )}

                {staff.notes && (
                  <div className="sm:col-span-3 rounded-lg bg-slate-50 p-4 border border-slate-100">
                    <span className="text-xs font-semibold uppercase text-slate-400">{t('common.details')}</span>
                    <p className="mt-1 text-slate-700 whitespace-pre-wrap text-xs leading-relaxed">{staff.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Account & Login Section */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
                <KeyRound className="h-4 w-4 text-indigo-600" />
                {t('people.accountAccess')}
              </h3>

              {hasAccount ? (
                <div className="rounded-xl bg-emerald-50/60 border border-emerald-200 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-emerald-600" />
                      <span className="font-bold text-emerald-950 text-sm">{t('people.activeAccount')}</span>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                      {t('people.statuses.active')}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-emerald-900 pt-1">
                    <div><strong>{t('people.email')} :</strong> {staff.userAccount?.email}</div>
                    <div><strong>{t('people.role')} :</strong> {staff.roles?.[0]?.name || t('people.activeAccount')}</div>
                  </div>
                  <div className="text-[11px] text-slate-500 pt-1">
                    {t('people.modals.loginSyncInfo')}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <div className="font-bold text-slate-800 text-sm">{t('people.noAccount')}</div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {t('people.modals.autoAccountCreate')}
                    </p>
                  </div>
                  {personParty.email ? (
                    <Button
                      size="sm"
                      onClick={() => {
                        setAccountPassword('OrgDash2026!');
                        setAccountRoleId(roles[0]?.id || '');
                        setShowAccountModal(true);
                      }}
                    >
                      <KeyRound className="mr-2 h-4 w-4" />
                      {t('people.createAccess')}
                    </Button>
                  ) : (
                    <span className="text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded border border-amber-200">
                      {t('people.modals.loginSyncInfo')}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Beneficiary & Privacy (Loi 25) Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Consents Section */}
          <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b pb-3">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              {t('people.consentStatus')}
            </h2>
            {consents.length === 0 ? (
              <p className="text-xs text-slate-400 italic">{t('common.empty')}</p>
            ) : (
              <div className="divide-y text-sm">
                {consents.map((c: any) => (
                  <div key={c.id} className="py-2.5 flex justify-between items-center">
                    <div>
                      <span className="font-semibold text-slate-800">{c.purposeCode || 'Loi 25'}</span>
                      <div className="text-xs text-slate-400">v{c.version}</div>
                    </div>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      c.status === 'granted' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {c.status === 'granted' ? t('common.yes') : c.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Service Deliveries */}
          <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b pb-3">
              <HeartHandshake className="h-5 w-5 text-indigo-600" />
              {t('cases.interventionPlan')}
            </h2>
            {serviceDeliveries.length === 0 ? (
              <p className="text-xs text-slate-400 italic">{t('common.empty')}</p>
            ) : (
              <div className="divide-y text-sm">
                {serviceDeliveries.map((s: any) => (
                  <div key={s.id} className="py-2.5">
                    <div className="font-semibold text-slate-900">{s.serviceType || 'Service'}</div>
                    <div className="text-xs text-slate-500">{s.deliveredAt} — {s.notes || '—'}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Attached Documents */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <DocumentListWidget entityType="person" entityId={id!} />
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Pencil className="h-5 w-5 text-indigo-600" />
                {t('people.modals.editStaff')}
              </h2>
              <Button variant="ghost" size="sm" onClick={() => setShowEditModal(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            {editError && <div className="rounded bg-red-50 p-3 text-sm text-red-700">{editError}</div>}

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input label={`${t('people.firstName')} *`} value={editFirstName} onChange={(e) => setEditFirstName(e.target.value)} required />
                <Input label={`${t('people.lastName')} *`} value={editLastName} onChange={(e) => setEditLastName(e.target.value)} required />
                <Input
                  label={t('people.email')}
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="personne@association.org"
                />
                <Input label={t('people.phone')} value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 border-t pt-4">
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">{t('people.role')} *</label>
                  <Input value={editJobTitle} onChange={(e) => setEditJobTitle(e.target.value)} required />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">{t('people.contractType')} *</label>
                  <select
                    value={editEmploymentType}
                    onChange={(e) => setEditEmploymentType(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value="employee">{t('people.types.employee')}</option>
                    <option value="board_member">{t('people.types.board_member')}</option>
                    <option value="contractor">{t('people.types.contractor')}</option>
                    <option value="intern">{t('people.types.intern')}</option>
                    <option value="volunteer">{t('people.types.volunteer')}</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">{t('people.department')}</label>
                  <select
                    value={editDepartmentId}
                    onChange={(e) => setEditDepartmentId(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value="">— {t('common.all')} —</option>
                    {departments.map((d: any) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">{t('common.status')}</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value="active">{t('people.statuses.active')}</option>
                    <option value="on_leave">{t('people.statuses.on_leave')}</option>
                    <option value="inactive">{t('people.statuses.inactive')}</option>
                    <option value="archived">{t('people.statuses.archived')}</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">{t('people.since')}</label>
                  <Input type="date" value={editHireDate} onChange={(e) => setEditHireDate(e.target.value)} />
                </div>

                <Input label={t('people.emergencyContact')} value={editEmergencyContact} onChange={(e) => setEditEmergencyContact(e.target.value)} />
              </div>

              {/* Account sync section */}
              {editEmail && (
                <div className="rounded-xl bg-indigo-50/70 border border-indigo-100 p-4 space-y-3">
                  <div className="text-xs font-bold text-indigo-950 flex items-center gap-2">
                    <KeyRound className="h-4 w-4 text-indigo-600" />
                    {t('people.modals.userAccountLinked')}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700">{t('people.modals.roleAssigned')}</label>
                      <select
                        value={editRoleId}
                        onChange={(e) => setEditRoleId(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs"
                      >
                        <option value="">{t('people.modals.defaultRole')}</option>
                        {roles.map((r: any) => (
                          <option key={r.id} value={r.id}>{r.name} ({r.code})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700">{t('people.modals.temporaryPassword')}</label>
                      <Input
                        type="text"
                        value={editPassword}
                        onChange={(e) => setEditPassword(e.target.value)}
                        placeholder="Nouveau mot de passe..."
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setShowEditModal(false)}>
                  {t('common.cancel')}
                </Button>
                <Button type="submit" disabled={updateStaffMutation.isPending}>
                  {updateStaffMutation.isPending ? t('common.saving') : t('common.saveChanges')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Account Activation Modal */}
      {showAccountModal && (
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
              <div><strong>{t('people.fullName')} :</strong> {personParty.firstName} {personParty.lastName}</div>
              <div><strong>{t('people.email')} :</strong> {personParty.email}</div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">{t('people.modals.roleAssigned')}</label>
                <select
                  value={accountRoleId}
                  onChange={(e) => setAccountRoleId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
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
                  placeholder="Ex: OrgDash2026!"
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
    </div>
  );
}
