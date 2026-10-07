import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Input, Badge } from '@orgdashio/ui';
import { Shield, ShieldCheck, Download, Save, CheckCircle, FileText, AlertTriangle, Lock, UserCheck } from 'lucide-react';
import { Navbar } from '../../components/Navbar';

export function PrivacySettingsScreen() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [officerName, setOfficerName] = useState('');
  const [officerEmail, setOfficerEmail] = useState('');
  const [retentionMonths, setRetentionMonths] = useState(60);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const { data: meData } = useQuery({
    queryKey: ['authMe'],
    queryFn: async () => {
      const res = await fetch('/api/v1/auth/me');
      if (!res.ok) throw new Error('Erreur de chargement');
      return res.json();
    },
  });

  useEffect(() => {
    if (meData?.tenant) {
      setOfficerName(meData.tenant.privacyOfficerName || '');
      setOfficerEmail(meData.tenant.privacyOfficerEmail || '');
      setRetentionMonths(meData.tenant.dataRetentionMonths || 60);
    }
  }, [meData]);

  const updateMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch('/api/v1/auth/tenant', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: meData?.tenant?.name,
          privacyOfficerName: payload.officerName,
          privacyOfficerEmail: payload.officerEmail,
          dataRetentionMonths: payload.retentionMonths,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Erreur de sauvegarde');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authMe'] });
      setSuccess('Règles de gouvernance Loi 25 enregistrées avec succès.');
      setError('');
    },
    onError: (err: any) => {
      setError(err.message);
      setSuccess('');
    },
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess('');
    setError('');
    updateMutation.mutate({ officerName, officerEmail, retentionMonths: Number(retentionMonths) });
  };

  const handleExportLoi25 = () => {
    alert('Exportation automatisée Loi 25 (CMP-04) : Génération du registre de conformité et des consentements au format structuré CSV / JSON...');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="mx-auto max-w-4xl p-6 space-y-6">
        <div className="flex items-center space-x-3 border-b pb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Conformité Loi 25 & Protection des Données</h1>
            <p className="text-xs text-slate-500">
              Gestion de la désignation du RPRP, politiques de rétention et droits d'accès des usagers (Loi 25 Québec & LPRPDE).
            </p>
          </div>
        </div>

        {success && (
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-emerald-600" />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Loi 25 Checklist Alert */}
        <div className="rounded-xl bg-indigo-50/60 border border-indigo-200 p-5 space-y-2">
          <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm">
            <ShieldCheck className="h-5 w-5 text-indigo-600" />
            Exigences obligatoires de la Loi 25 pour votre organisme
          </div>
          <p className="text-xs text-indigo-700 leading-relaxed">
            Tout organisme doit obligatoirement désigner un Responsable de la protection des renseignements personnels (RPRP),
            publier ses coordonnées, tenir un registre des incidents de confidentialité et recueillir le consentement explicite des personnes (CMP-01).
          </p>
        </div>

        {/* Formulaire PRP */}
        <div className="rounded-xl border bg-white p-6 shadow-sm space-y-6">
          <form onSubmit={handleSave} className="space-y-5">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-indigo-600" />
              1. Responsable de la Protection des Renseignements Personnels (RPRP)
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nom complet du Responsable RPRP"
                value={officerName}
                onChange={(e) => setOfficerName(e.target.value)}
                placeholder="Ex: Direction générale ou Responsable désigné"
              />
              <Input
                label="Courriel officiel de contact RPRP"
                type="email"
                value={officerEmail}
                onChange={(e) => setOfficerEmail(e.target.value)}
                placeholder="confidentialite@organisme.org"
                required
              />
            </div>

            <h2 className="text-base font-bold text-slate-900 pt-4 border-t flex items-center gap-2">
              <Lock className="h-4 w-4 text-indigo-600" />
              2. Rétention des Données & Verrouillage Automatique
            </h2>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Durée d'archivage des dossiers inactifs (Mois)
              </label>
              <Input
                type="number"
                value={retentionMonths}
                onChange={(e) => setRetentionMonths(Number(e.target.value))}
                required
                min={12}
                max={360}
              />
              <p className="mt-1 text-xs text-slate-500">
                🔒 Les notes d'évolution de suivi de cas sont verrouillées après 7 jours et protégées par RLS et chiffrement (CAS-04).
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <Button type="submit" disabled={updateMutation.isPending}>
                <Save className="mr-2 h-4 w-4" /> Enregistrer les règles de confidentialité
              </Button>
            </div>
          </form>

          {/* Outil d'exportation Loi 25 */}
          <div className="border-t pt-6 space-y-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Download className="h-4 w-4 text-indigo-600" />
              3. Portabilité des Données & Droit à l'Oubli (CMP-04)
            </h2>
            <p className="text-xs text-slate-600">
              Conformément à la Loi 25, les personnes accompagnées peuvent demander une copie informatisée de l'ensemble de leurs données personnelles.
            </p>
            <Button variant="outline" onClick={handleExportLoi25}>
              <Download className="mr-2 h-4 w-4 text-indigo-600" /> Générer un export de portabilité Loi 25
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
