import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Input, Badge } from '@orgdashio/ui';
import {
  Building2,
  Save,
  CheckCircle,
  Image,
  Globe,
  Mail,
  Phone,
  MapPin,
  Shield,
  FileText,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';

export function OrganizationSettingsScreen() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [logoInputMode, setLogoInputMode] = useState<'upload' | 'url'>('upload');
  const [acronym, setAcronym] = useState('');
  const [description, setDescription] = useState('');
  const [orgType, setOrgType] = useState('OBNL / NPO (Organisme à but non lucratif)');
  const [neqNumber, setNeqNumber] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  
  // Loi 25 fields
  const [privacyOfficerName, setPrivacyOfficerName] = useState('');
  const [privacyOfficerEmail, setPrivacyOfficerEmail] = useState('');
  const [dataRetentionMonths, setDataRetentionMonths] = useState(60);

  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("L'image est trop volumineuse. Veuillez sélectionner un fichier de moins de 5 Mo.");
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Format invalide. Veuillez sélectionner une image (PNG, JPG, SVG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setLogoUrl(reader.result as string);
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const { data: meData, isLoading } = useQuery({
    queryKey: ['authMe'],
    queryFn: async () => {
      const res = await fetch('/api/v1/auth/me');
      if (!res.ok) throw new Error('Erreur de chargement');
      return res.json();
    },
  });

  useEffect(() => {
    if (meData?.tenant) {
      const t = meData.tenant;
      setName(t.name || '');
      setLogoUrl(t.logoUrl || '');
      setAcronym(t.acronym || '');
      setDescription(t.description || '');
      setOrgType(t.orgType || 'OBNL / NPO (Organisme à but non lucratif)');
      setNeqNumber(t.neqNumber || '');
      setAddress(t.address || '');
      setPhone(t.phone || '');
      setEmail(t.email || '');
      setWebsite(t.website || '');
      setPrivacyOfficerName(t.privacyOfficerName || '');
      setPrivacyOfficerEmail(t.privacyOfficerEmail || '');
      setDataRetentionMonths(t.dataRetentionMonths || 60);
    }
  }, [meData]);

  const updateMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch('/api/v1/auth/tenant', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Erreur lors de la mise à jour');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authMe'] });
      setSuccess("Profil et paramètres de l'organisme mis à jour avec succès !");
      setError('');
    },
    onError: (err: any) => {
      setError(err.message);
      setSuccess('');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess('');
    setError('');

    const payload = {
      name: name.trim(),
      logoUrl: logoUrl.trim() || null,
      acronym: acronym.trim() || null,
      description: description.trim() || null,
      orgType,
      neqNumber: neqNumber.trim() || null,
      address: address.trim() || null,
      phone: phone.trim() || null,
      email: email.trim() || null,
      website: website.trim() || null,
      privacyOfficerName: privacyOfficerName.trim() || null,
      privacyOfficerEmail: privacyOfficerEmail.trim() || null,
      dataRetentionMonths: Number(dataRetentionMonths) || 60,
    };

    updateMutation.mutate(payload);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="mx-auto max-w-5xl p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-3 border-b pb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Paramètres de l'Organisme</h1>
            <p className="text-xs text-slate-500">
              Personnalisation de la marque, coordonnées officielles, statut juridique et conformité réglementaire Loi 25.
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

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Identité & Marque */}
          <div className="rounded-xl border bg-white p-6 shadow-sm space-y-5">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Image className="h-4 w-4 text-indigo-600" />
              1. Identité & Image de Marque (White-Label)
            </h2>

            {/* Logo Preview & Branding Banner */}
            <div className="flex flex-col sm:flex-row items-center gap-5 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-white shadow-sm overflow-hidden">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="Logo"
                    className="h-full w-full object-contain p-1"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <Building2 className="h-8 w-8 text-slate-400" />
                )}
              </div>
              <div className="flex-1 space-y-1 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <h3 className="text-base font-bold text-slate-900">{name || "Nom de l'organisme"}</h3>
                  {acronym && (
                    <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-0.5 rounded font-semibold">
                      {acronym}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  Ce logo et ce nom remplaceront toute marque sur l'en-tête de l'application pour vos utilisateurs.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Input
                  label="Nom officiel de l'organisme"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Centre d'Action Bénévole et Communautaire"
                  required
                />
              </div>
              <div>
                <Input
                  label="Sigle / Acronyme (Optionnel)"
                  value={acronym}
                  onChange={(e) => setAcronym(e.target.value)}
                  placeholder="Ex: CABC"
                />
              </div>
            </div>

            {/* Mode Selector for Logo: Upload vs URL */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-slate-700">Logo de l'organisme</label>
                <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs">
                  <button
                    type="button"
                    onClick={() => setLogoInputMode('upload')}
                    className={`px-3 py-1 rounded-md font-medium transition-all ${
                      logoInputMode === 'upload'
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    📁 Importer un fichier
                  </button>
                  <button
                    type="button"
                    onClick={() => setLogoInputMode('url')}
                    className={`px-3 py-1 rounded-md font-medium transition-all ${
                      logoInputMode === 'url'
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🔗 Lien URL web
                  </button>
                </div>
              </div>

              {logoInputMode === 'upload' ? (
                <div className="border-2 border-dashed border-slate-300 hover:border-indigo-400 bg-slate-50/70 rounded-xl p-5 text-center transition-colors">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/png, image/jpeg, image/jpg, image/svg+xml, image/webp"
                    className="hidden"
                    id="logo-file-upload"
                  />
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="p-2.5 rounded-full bg-indigo-50 text-indigo-600">
                      <Image className="h-6 w-6" />
                    </div>
                    <div>
                      <label
                        htmlFor="logo-file-upload"
                        className="cursor-pointer text-sm font-semibold text-indigo-600 hover:text-indigo-700 underline underline-offset-2"
                      >
                        Cliquez pour choisir un fichier
                      </label>
                      <span className="text-xs text-slate-500"> ou glissez-déposez ici</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Formats acceptés : PNG, JPG, SVG, WEBP (Max 5 Mo). Fond transparent recommandé.
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <Input
                    label="URL du Logo officiel"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://organisme.org/assets/logo.png"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Lien direct vers une image PNG, SVG ou JPG hébergée sur le web.
                  </p>
                </div>
              )}

              {logoUrl && (
                <div className="flex items-center justify-between bg-indigo-50/50 border border-indigo-100 px-3 py-2 rounded-lg text-xs">
                  <span className="text-indigo-900 font-medium truncate max-w-md">
                    ✓ Logo chargé et prêt à être enregistré
                  </span>
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="text-red-600 hover:text-red-700 font-semibold text-xs ml-2 hover:underline"
                  >
                    Supprimer le logo
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mission / Description sommaire</label>
              <textarea
                className="w-full rounded-md border border-slate-300 p-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Décrivez la mission principale, les bénéficiaires cibles et les orientations de l'organisme..."
              />
            </div>
          </div>

          {/* Section 2: Statut Juridique & Coordonnées */}
          <div className="rounded-xl border bg-white p-6 shadow-sm space-y-5">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="h-4 w-4 text-indigo-600" />
              2. Statut Juridique & Coordonnées Officielles
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Structure Juridique</label>
                <select
                  className="w-full rounded-md border border-slate-300 p-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500"
                  value={orgType}
                  onChange={(e) => setOrgType(e.target.value)}
                >
                  <option value="OBNL / NPO (Organisme à but non lucratif)">OBNL / NPO (Organisme à but non lucratif)</option>
                  <option value="Association Incorporée (Partie III)">Association Incorporée (Partie III)</option>
                  <option value="Organisme de Bienfaisance Enregistré (ARC)">Organisme de Bienfaisance Enregistré (ARC)</option>
                  <option value="Fondation Philanthropique">Fondation Philanthropique</option>
                  <option value="Coopérative de Solidarité / Économie Sociale">Coopérative de Solidarité / Économie Sociale</option>
                </select>
              </div>

              <Input
                label="Matricule / Numéro NEQ / Enregistrement"
                value={neqNumber}
                onChange={(e) => setNeqNumber(e.target.value)}
                placeholder="Ex: 1172839405"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Input
                  label="Adresse Civique"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ex: 1234, rue Principale, Montréal, QC"
                />
              </div>
              <div>
                <Input
                  label="Téléphone Officiel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ex: (514) 555-0100"
                />
              </div>
              <div>
                <Input
                  label="Courriel Institutionnel"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@organisme.org"
                />
              </div>
            </div>

            <div>
              <Input
                label="Site Web Officiel"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://www.organisme.org"
              />
            </div>
          </div>

          {/* Section 3: Gouvernance & Loi 25 */}
          <div className="rounded-xl border bg-white p-6 shadow-sm space-y-5">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Shield className="h-4 w-4 text-indigo-600" />
              3. Protection des Renseignements Personnels & Gouvernance (Loi 25)
            </h2>
            <p className="text-xs text-slate-500">
              Exigences de la Loi 25 (Québec) et de la LPRPDE pour la gouvernance des données personnelles des usagers et du personnel.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nom du Responsable de la Protection des Renseignements (RPRP)"
                value={privacyOfficerName}
                onChange={(e) => setPrivacyOfficerName(e.target.value)}
                placeholder="Ex: Marie-Ève Gagnon, Directrice Générale"
              />
              <Input
                label="Courriel officiel du Responsable RPRP"
                type="email"
                value={privacyOfficerEmail}
                onChange={(e) => setPrivacyOfficerEmail(e.target.value)}
                placeholder="confidentialite@organisme.org"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Durée de rétention des dossiers archivés (mois)
                </label>
                <Input
                  type="number"
                  value={dataRetentionMonths}
                  onChange={(e) => setDataRetentionMonths(Number(e.target.value))}
                  min={12}
                  max={360}
                />
              </div>
              <div className="text-xs text-slate-500 pt-5">
                <span className="font-semibold text-slate-700">Norme recommandée :</span> 60 mois (5 ans) pour les dossiers d'intervention et 84 mois (7 ans) pour les pièces comptables.
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={updateMutation.isPending}>
              <Save className="mr-2 h-4 w-4" />
              {updateMutation.isPending ? 'Enregistrement...' : 'Enregistrer les paramètres de l’organisme'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
