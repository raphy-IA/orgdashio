import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Input, Badge } from '@orgdashio/ui';
import {
  Building2,
  Save,
  CheckCircle2,
  Image as ImageIcon,
  Globe,
  Mail,
  Phone,
  MapPin,
  Shield,
  FileText,
  Clock,
  Sparkles,
  Upload,
  Trash2,
  DollarSign,
  Calendar,
  UserCheck,
  Award,
  AlertCircle,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';

type SettingsTab = 'general' | 'fiscal_legal' | 'contact' | 'regional' | 'privacy';

export function OrganizationSettingsScreen() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');

  // Form State
  const [name, setName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [acronym, setAcronym] = useState('');
  const [description, setDescription] = useState('');
  const [orgType, setOrgType] = useState('OBNL / NPO (Organisme à but non lucratif)');
  
  // Fiscal & Legal
  const [neqNumber, setNeqNumber] = useState('');
  const [charityRegistrationNumber, setCharityRegistrationNumber] = useState('');
  const [authorizedSignerName, setAuthorizedSignerName] = useState('');
  const [authorizedSignerTitle, setAuthorizedSignerTitle] = useState('');

  // Contact
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');

  // Regional & Accounting
  const [currency, setCurrency] = useState('CAD ($)');
  const [fiscalYearEnd, setFiscalYearEnd] = useState('12-31');
  const [timezone, setTimezone] = useState('America/Toronto');

  // Privacy & Governance
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
      setError("L'image est trop volumineuse (maximum 5 Mo).");
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Veuillez sélectionner un fichier image valide (PNG, JPG, SVG, WEBP).');
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

  // Fetch current tenant data
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
      setCharityRegistrationNumber(t.charityRegistrationNumber || '');
      setAuthorizedSignerName(t.authorizedSignerName || '');
      setAuthorizedSignerTitle(t.authorizedSignerTitle || '');
      setAddress(t.address || '');
      setPhone(t.phone || '');
      setEmail(t.email || '');
      setWebsite(t.website || '');
      setCurrency(t.currency || 'CAD ($)');
      setFiscalYearEnd(t.fiscalYearEnd || '12-31');
      setTimezone(t.timezone || 'America/Toronto');
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
      setSuccess("Paramètres et identité de l'organisme enregistrés avec succès !");
      setError('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
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

    if (!name.trim()) {
      setError("Le nom officiel de l'organisme est obligatoire.");
      return;
    }

    const payload = {
      name: name.trim(),
      logoUrl: logoUrl.trim() || null,
      acronym: acronym.trim() || null,
      description: description.trim() || null,
      orgType,
      neqNumber: neqNumber.trim() || null,
      charityRegistrationNumber: charityRegistrationNumber.trim() || null,
      authorizedSignerName: authorizedSignerName.trim() || null,
      authorizedSignerTitle: authorizedSignerTitle.trim() || null,
      address: address.trim() || null,
      phone: phone.trim() || null,
      email: email.trim() || null,
      website: website.trim() || null,
      currency,
      fiscalYearEnd,
      timezone,
      privacyOfficerName: privacyOfficerName.trim() || null,
      privacyOfficerEmail: privacyOfficerEmail.trim() || null,
      dataRetentionMonths: Number(dataRetentionMonths) || 60,
    };

    updateMutation.mutate(payload);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="mx-auto max-w-6xl w-full p-4 sm:p-6 lg:p-8 space-y-6 flex-1">
        {/* Header Title & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-md">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Paramètres de l’Organisme
                </h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  Gérez l’identité de marque, les informations fiscales et les préférences globales de votre espace.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              type="button"
              variant="default"
              onClick={handleSubmit}
              disabled={updateMutation.isPending || isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm flex items-center space-x-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{updateMutation.isPending ? 'Enregistrement...' : 'Enregistrer les modifications'}</span>
            </Button>
          </div>
        </div>

        {/* Success / Error Alerts */}
        {success && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl flex items-center space-x-3 shadow-sm animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span className="text-sm font-semibold">{success}</span>
          </div>
        )}

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-900 rounded-xl flex items-center space-x-3 shadow-sm animate-fadeIn">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <span className="text-sm font-semibold">{error}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 space-x-2 sm:space-x-8 overflow-x-auto">
          {[
            { id: 'general', label: 'Identité & Marque', icon: Sparkles },
            { id: 'fiscal_legal', label: 'Fiscalité & ARC', icon: Award },
            { id: 'contact', label: 'Coordonnées & Siège', icon: MapPin },
            { id: 'regional', label: 'Devise & Exercice', icon: DollarSign },
            { id: 'privacy', label: 'Gouvernance & PRP', icon: Shield },
          ].map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id as SettingsTab)}
                className={`pb-4 px-2 text-sm font-semibold flex items-center space-x-2 border-b-2 whitespace-nowrap transition-colors ${
                  isActive
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* TAB 1: IDENTITÉ & MARQUE */}
          {activeTab === 'general' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Form Fields */}
              <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-5">
                <h3 className="text-base font-bold text-slate-900 border-b pb-3">
                  Informations Générales
                </h3>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Nom officiel de l'organisme <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Centre d'Action Communautaire Montréal"
                    required
                    className="font-medium"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Ce nom apparaîtra sur vos en-têtes officiels, reçus fiscaux et rapports bailleurs.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Sigle / Acronyme court
                    </label>
                    <Input
                      value={acronym}
                      onChange={(e) => setAcronym(e.target.value)}
                      placeholder="Ex: CACM"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Structure juridique
                    </label>
                    <select
                      className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white focus:ring-2 focus:ring-blue-500 font-medium"
                      value={orgType}
                      onChange={(e) => setOrgType(e.target.value)}
                    >
                      <option value="OBNL / NPO (Organisme à but non lucratif)">OBNL / Association à but non lucratif</option>
                      <option value="Organisme de bienfaisance enregistré (ARC)">Organisme de bienfaisance enregistré (ARC)</option>
                      <option value="Fondation Caritative">Fondation Caritative</option>
                      <option value="Coopérative / Économie Sociale">Coopérative / Économie Sociale</option>
                      <option value="Organisation Communautaire">Organisation Communautaire locale</option>
                      <option value="Autre structure solidaire">Autre structure solidaire</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Énoncé de mission ou slogan
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ex: Favoriser l'autonomie, l'insertion sociale et la sécurité alimentaire des familles de notre communauté."
                    className="w-full text-xs rounded-lg border border-slate-300 p-3 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Présentez brièvement la vocation sociale et les objectifs fondamentaux de votre organisme.
                  </p>
                </div>
              </div>

              {/* Right Column: Logo Upload & Visual Preview */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-5 flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 border-b pb-3">
                    Logo & Identité Visuelle
                  </h3>
                  <p className="text-xs text-slate-500 mt-2">
                    Votre logo est automatiquement intégré dans la barre supérieure, sur les reçus fiscaux ARC et dans les exports PDF.
                  </p>

                  {/* Logo Display Box */}
                  <div className="mt-4 p-6 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-center">
                    {logoUrl ? (
                      <div className="space-y-4">
                        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm inline-block">
                          <img
                            src={logoUrl}
                            alt="Logo aperçu"
                            className="max-h-24 max-w-[180px] object-contain mx-auto"
                          />
                        </div>
                        <div className="flex items-center justify-center space-x-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            className="text-xs"
                          >
                            <Upload className="w-3.5 h-3.5 mr-1" />
                            <span>Remplacer</span>
                          </Button>
                          <Button
                            type="button"
                            variant="danger"
                            size="sm"
                            onClick={handleRemoveLogo}
                            className="text-xs text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border-rose-200"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1" />
                            <span>Supprimer</span>
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
                          <ImageIcon className="w-8 h-8" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">Aucun logo configuré</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">PNG, JPG, SVG ou WEBP (Max 5 Mo)</p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-xs font-semibold"
                        >
                          <Upload className="w-3.5 h-3.5 mr-1" />
                          <span>Parcourir une image</span>
                        </Button>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png, image/jpeg, image/svg+xml, image/webp"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                </div>

                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-blue-900 text-xs flex items-start space-x-2">
                  <Sparkles className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Astuce :</strong> Privilégiez un logo avec fond transparent au format PNG ou SVG pour un rendu optimal.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FISCALITÉ & ARC */}
          {activeTab === 'fiscal_legal' && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Enregistrement Officiel & Données Fiscales
                  </h3>
                  <p className="text-xs text-slate-500">
                    Ces informations sont indispensables pour l'émission des reçus officiels aux fins de l'impôt sur le revenu (ARC) et la reddition de comptes.
                  </p>
                </div>
                <Badge variant="default" className="bg-indigo-100 text-indigo-800 border-indigo-200">
                  Conforme ARC
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    N° d’Enregistrement d’Organisme de Bienfaisance (ARC)
                  </label>
                  <Input
                    value={charityRegistrationNumber}
                    onChange={(e) => setCharityRegistrationNumber(e.target.value)}
                    placeholder="Ex: 812345678RR0001"
                    className="font-mono font-bold text-slate-800"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Numéro de 15 caractères (9 chiffres + RR + 4 chiffres) assigné par l'Agence du Revenu du Canada.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Numéro d’Entreprise du Québec (NEQ)
                  </label>
                  <Input
                    value={neqNumber}
                    onChange={(e) => setNeqNumber(e.target.value)}
                    placeholder="Ex: 1178945612"
                    className="font-mono"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Numéro d'immatriculation au Registraire des entreprises du Québec.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
                  <UserCheck className="w-4 h-4 text-blue-600" />
                  <span>Signataire Officiel Autorisé (Reçus fiscaux & attestations)</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Nom complet du signataire
                    </label>
                    <Input
                      value={authorizedSignerName}
                      onChange={(e) => setAuthorizedSignerName(e.target.value)}
                      placeholder="Ex: Sophie Tremblay"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Titre / Fonction officielle
                    </label>
                    <Input
                      value={authorizedSignerTitle}
                      onChange={(e) => setAuthorizedSignerTitle(e.target.value)}
                      placeholder="Ex: Directrice Générale ou Trésorier"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: COORDONNÉES & SIÈGE */}
          {activeTab === 'contact' && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-6">
              <h3 className="text-base font-bold text-slate-900 border-b pb-3">
                Coordonnées Officielles & Siège Social
              </h3>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  <span>Adresse complète du siège social</span>
                </label>
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ex: 450 Boulevard René-Lévesque Ouest, Bureau 300, Montréal, QC H2Z 1Z2"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Adresse légale imprimée sur les reçus fiscaux de dons et les conventions de subvention.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
                    <Mail className="w-3.5 h-3.5 text-blue-600" />
                    <span>Courriel officiel de contact</span>
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@organisme.org"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
                    <Phone className="w-3.5 h-3.5 text-blue-600" />
                    <span>Téléphone principal</span>
                  </label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(514) 555-0199"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
                    <Globe className="w-3.5 h-3.5 text-blue-600" />
                    <span>Site web public</span>
                  </label>
                  <Input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://mon-organisme.org"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DEVISE & EXERCICE */}
          {activeTab === 'regional' && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-6">
              <h3 className="text-base font-bold text-slate-900 border-b pb-3">
                Préférences Régionales, Devises & Exercice Financier
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-blue-600" />
                    <span>Devise Comptable Principale</span>
                  </label>
                  <select
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white focus:ring-2 focus:ring-blue-500 font-semibold"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                  >
                    <option value="CAD ($)">Dollar Canadien (CAD $)</option>
                    <option value="EUR (€)">Euro (EUR €)</option>
                    <option value="USD ($)">Dollar US (USD $)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    <span>Fin de l'Exercice Financier</span>
                  </label>
                  <select
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white focus:ring-2 focus:ring-blue-500 font-semibold"
                    value={fiscalYearEnd}
                    onChange={(e) => setFiscalYearEnd(e.target.value)}
                  >
                    <option value="12-31">31 Décembre (Année Civile)</option>
                    <option value="03-31">31 Mars (Standard Gouvernemental)</option>
                    <option value="06-30">30 Juin (Standard Scolaire)</option>
                    <option value="09-30">30 Septembre (Automne)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    <span>Fuseau Horaire</span>
                  </label>
                  <select
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white focus:ring-2 focus:ring-blue-500 font-semibold"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                  >
                    <option value="America/Toronto">Est (Montréal, Toronto, Québec)</option>
                    <option value="America/Winnipeg">Centre (Winnipeg)</option>
                    <option value="America/Edmonton">Montagnes (Calgary, Edmonton)</option>
                    <option value="America/Vancouver">Pacifique (Vancouver)</option>
                    <option value="America/Halifax">Atlantique (Halifax, Moncton)</option>
                    <option value="Europe/Paris">Europe de l'Ouest (Paris, Bruxelles)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: GOUVERNANCE & PROTECTION DES DONNÉES */}
          {activeTab === 'privacy' && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Protection des Renseignements Personnels & Gouvernance
                  </h3>
                  <p className="text-xs text-slate-500">
                    Désignation du responsable légal de la protection des données et politique de rétention (Loi 25 / LPRPDE).
                  </p>
                </div>
                <Badge variant="default" className="bg-emerald-100 text-emerald-800 border-emerald-200">
                  Loi 25 Conforme
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Nom du responsable PRP / DPO
                  </label>
                  <Input
                    value={privacyOfficerName}
                    onChange={(e) => setPrivacyOfficerName(e.target.value)}
                    placeholder="Ex: Sophie Tremblay"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Par défaut, la plus haute autorité de l'organisme (Direction Générale) assure cette fonction.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Courriel officiel du responsable PRP
                  </label>
                  <Input
                    type="email"
                    value={privacyOfficerEmail}
                    onChange={(e) => setPrivacyOfficerEmail(e.target.value)}
                    placeholder="prp@organisme.org"
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Durée de rétention des données d'intervention (mois)
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Période de conservation recommandée avant archivage ou purge légale (60 mois = 5 ans).
                    </p>
                  </div>
                  <div className="w-28">
                    <Input
                      type="number"
                      min={12}
                      max={360}
                      value={dataRetentionMonths}
                      onChange={(e) => setDataRetentionMonths(parseInt(e.target.value, 10) || 60)}
                      className="text-center font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Submit Action Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 flex items-center justify-between shadow-sm">
            <p className="text-xs text-slate-500">
              Assurez-vous d'enregistrer vos modifications pour qu'elles soient appliquées sur toute la plateforme.
            </p>
            <Button
              type="submit"
              variant="default"
              disabled={updateMutation.isPending || isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm flex items-center space-x-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{updateMutation.isPending ? 'Enregistrement...' : 'Enregistrer les modifications'}</span>
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
