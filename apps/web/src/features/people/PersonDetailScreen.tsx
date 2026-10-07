import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
        <div className="flex items-center justify-center p-8 text-slate-500">Chargement de la fiche...</div>
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
            Retour au répertoire
          </Button>

          {isStaff && (
            <Button size="sm" onClick={openEditModal}>
              <Pencil className="mr-2 h-4 w-4" />
              Modifier les informations
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
                    {employmentCfg.label}
                  </span>
                )}
                {!isStaff && (
                  <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                    Bénéficiaire / Usager
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500 mt-1 flex items-center gap-3">
                {personParty.email && <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5 text-slate-400" /> {personParty.email}</span>}
                {personParty.phone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5 text-slate-400" /> {personParty.phone}</span>}
                {!personParty.email && !personParty.phone && <span>Aucune coordonnée enregistrée</span>}
              </p>
            </div>
          </div>

          <div>
            {statusCfg && (
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${statusCfg.color}`}>
                {statusCfg.label}
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
                Informations Professionnelles & Rôle dans l'Organisation
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm mt-4">
                <div>
                  <span className="text-xs font-semibold uppercase text-slate-400">Poste / Fonction</span>
                  <p className="mt-1 font-bold text-slate-900 text-base">{staff.jobTitle}</p>
                </div>

                <div>
                  <span className="text-xs font-semibold uppercase text-slate-400">Département / Pôle</span>
                  <p className="mt-1 font-semibold text-slate-800 flex items-center gap-1">
                    <Building2 className="h-4 w-4 text-indigo-500" />
                    {staff.department?.name || 'Non rattaché'}
                  </p>
                </div>

                <div>
                  <span className="text-xs font-semibold uppercase text-slate-400">Date d'embauche / adhésion</span>
                  <p className="mt-1 font-semibold text-slate-800 flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-indigo-500" />
                    {staff.hireDate || 'Non renseignée'}
                  </p>
                </div>

                {staff.emergencyContact && (
                  <div className="sm:col-span-2">
                    <span className="text-xs font-semibold uppercase text-slate-400">Contact d'urgence</span>
                    <p className="mt-1 text-slate-800">{staff.emergencyContact}</p>
                  </div>
                )}

                {staff.notes && (
                  <div className="sm:col-span-3 rounded-lg bg-slate-50 p-4 border border-slate-100">
                    <span className="text-xs font-semibold uppercase text-slate-400">Notes RH & Compétences</span>
                    <p className="mt-1 text-slate-700 whitespace-pre-wrap text-xs leading-relaxed">{staff.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Account & Login Section */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
                <KeyRound className="h-4 w-4 text-indigo-600" />
                Compte Utilisateur & Accès Applicatif
              </h3>

              {hasAccount ? (
                <div className="rounded-xl bg-emerald-50/60 border border-emerald-200 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-emerald-600" />
                      <span className="font-bold text-emerald-950 text-sm">Compte d'accès activé</span>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                      Actif
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-emerald-900 pt-1">
                    <div><strong>Identifiant (Login) :</strong> {staff.userAccount.email}</div>
                    <div><strong>Rôle attribué :</strong> {staff.roles?.[0]?.name || 'Utilisateur standard'}</div>
                  </div>
                  <div className="text-[11px] text-slate-500 pt-1">
                    Toute modification de l'adresse courriel dans la fiche synchronise automatiquement l'identifiant de connexion.
                  </div>
                </div>
              ) : (
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <div className="font-bold text-slate-800 text-sm">Aucun compte applicatif associé</div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Ce collaborateur ne possède pas encore d'accès pour se connecter à la plateforme.
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
                      Activer le compte
                    </Button>
                  ) : (
                    <span className="text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded border border-amber-200">
                      Renseignez un courriel pour activer un compte
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
              Consentements & Conformité (Loi 25)
            </h2>
            {consents.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Aucun consentement spécifique consigné.</p>
            ) : (
              <div className="divide-y text-sm">
                {consents.map((c: any) => (
                  <div key={c.id} className="py-2.5 flex justify-between items-center">
                    <div>
                      <span className="font-semibold text-slate-800">Finalité : {c.purposeCode || 'Générale'}</span>
                      <div className="text-xs text-slate-400">Version {c.version}</div>
                    </div>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      c.status === 'granted' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {c.status === 'granted' ? 'Accordé' : c.status}
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
              Prestations & Services Rendus
            </h2>
            {serviceDeliveries.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Aucune prestation de service consignée.</p>
            ) : (
              <div className="divide-y text-sm">
                {serviceDeliveries.map((s: any) => (
                  <div key={s.id} className="py-2.5">
                    <div className="font-semibold text-slate-900">{s.serviceType || 'Service'}</div>
                    <div className="text-xs text-slate-500">{s.deliveredAt} — {s.notes || 'Sans note particulière'}</div>
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
                Modifier la fiche et les accès
              </h2>
              <Button variant="ghost" size="sm" onClick={() => setShowEditModal(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            {editError && <div className="rounded bg-red-50 p-3 text-sm text-red-700">{editError}</div>}

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input label="Prénom *" value={editFirstName} onChange={(e) => setEditFirstName(e.target.value)} required />
                <Input label="Nom *" value={editLastName} onChange={(e) => setEditLastName(e.target.value)} required />
                <Input
                  label="Courriel (Login)"
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="personne@association.org"
                />
                <Input label="Téléphone" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 border-t pt-4">
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">Titre du Poste / Fonction *</label>
                  <Input value={editJobTitle} onChange={(e) => setEditJobTitle(e.target.value)} required />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">Type d'engagement *</label>
                  <select
                    value={editEmploymentType}
                    onChange={(e) => setEditEmploymentType(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value="employee">Salarié(e)</option>
                    <option value="board_member">Conseil d'Administration / Direction</option>
                    <option value="contractor">Contractuel(le) / Consultant</option>
                    <option value="intern">Stagiaire</option>
                    <option value="volunteer">Bénévole</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">Département / Pôle</label>
                  <select
                    value={editDepartmentId}
                    onChange={(e) => setEditDepartmentId(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value="">— Aucun département —</option>
                    {departments.map((d: any) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">Statut</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value="active">Actif</option>
                    <option value="on_leave">En congé</option>
                    <option value="inactive">Inactif</option>
                    <option value="archived">Archivé</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">Date d'embauche</label>
                  <Input type="date" value={editHireDate} onChange={(e) => setEditHireDate(e.target.value)} />
                </div>

                <Input label="Contact d'urgence" value={editEmergencyContact} onChange={(e) => setEditEmergencyContact(e.target.value)} />
              </div>

              {/* Account sync section */}
              {editEmail && (
                <div className="rounded-xl bg-indigo-50/70 border border-indigo-100 p-4 space-y-3">
                  <div className="text-xs font-bold text-indigo-950 flex items-center gap-2">
                    <KeyRound className="h-4 w-4 text-indigo-600" />
                    Synchronisation du compte d'accès (Login)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700">Rôle système</label>
                      <select
                        value={editRoleId}
                        onChange={(e) => setEditRoleId(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs"
                      >
                        <option value="">— Rôle standard —</option>
                        {roles.map((r: any) => (
                          <option key={r.id} value={r.id}>{r.name} ({r.code})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700">Changer le mot de passe (laisser vide si inchangé)</label>
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
                  Annuler
                </Button>
                <Button type="submit" disabled={updateStaffMutation.isPending}>
                  {updateStaffMutation.isPending ? 'Enregistrement...' : 'Enregistrer les modifications'}
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
                Activer le compte d'accès
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setShowAccountModal(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="rounded-lg bg-slate-50 p-3 border text-xs space-y-1">
              <div><strong>Collaborateur :</strong> {personParty.firstName} {personParty.lastName}</div>
              <div><strong>Login (Courriel) :</strong> {personParty.email}</div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">Rôle d'accès</label>
                <select
                  value={accountRoleId}
                  onChange={(e) => setAccountRoleId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="">— Rôle standard —</option>
                  {roles.map((r: any) => (
                    <option key={r.id} value={r.id}>{r.name} ({r.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">Mot de passe temporaire initial</label>
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
                Annuler
              </Button>
              <Button
                size="sm"
                onClick={() => createAccountMutation.mutate({
                  password: accountPassword,
                  roleId: accountRoleId || undefined,
                })}
                disabled={createAccountMutation.isPending}
              >
                {createAccountMutation.isPending ? 'Création...' : 'Créer et activer le compte'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
