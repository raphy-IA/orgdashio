import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button, Badge } from '@orgdashio/ui';
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
} from 'lucide-react';
import { DocumentListWidget } from '../document/DocumentListWidget';
import { Navbar } from '../../components/Navbar';
import { EMPLOYMENT_TYPE_CONFIG, STAFF_STATUS_CONFIG } from './PeopleListScreen';

export function PersonDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['person', id],
    queryFn: async () => {
      const res = await fetch(`/api/v1/people/${id}`);
      if (!res.ok) throw new Error('Erreur chargement personne');
      return res.json();
    },
    enabled: !!id,
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

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="mx-auto max-w-5xl p-6 space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/people')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour au répertoire
        </Button>

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
          <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b pb-3">
              <Briefcase className="h-5 w-5 text-indigo-600" />
              Informations Professionnelles & Rôle dans l'Organisation
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
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
              <p className="text-xs text-slate-400 italic">Aucune prestation de service consignée.</p>
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
    </div>
  );
}
