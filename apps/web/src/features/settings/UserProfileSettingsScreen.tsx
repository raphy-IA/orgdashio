import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Input, Badge } from '@orgdashio/ui';
import {
  User,
  Lock,
  Save,
  CheckCircle2,
  ShieldCheck,
  Phone,
  Briefcase,
  Mail,
  Camera,
  Upload,
  Trash2,
  KeyRound,
  Laptop,
  Smartphone,
  Globe,
  AlertCircle,
  ShieldAlert,
  LogOut,
  Sparkles,
  Eye,
  EyeOff,
  Bell,
  Check,
  X,
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';

type ProfileTab = 'personal' | 'security' | 'sessions' | 'preferences';

interface SessionItem {
  id: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  expiresAt: string;
  isCurrent: boolean;
}

export function UserProfileSettingsScreen() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<ProfileTab>('personal');

  // Form States - Personal Info
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [phone, setPhone] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [locale, setLocale] = useState('fr-CA');

  // Password Security
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  // Notifications
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [timesheetReminders, setTimesheetReminders] = useState(true);
  const [grantMilestoneAlerts, setGrantMilestoneAlerts] = useState(true);

  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // 1. Fetch user data
  const { data: meData, isLoading } = useQuery({
    queryKey: ['authMe'],
    queryFn: async () => {
      const res = await fetch('/api/v1/auth/me');
      if (!res.ok) throw new Error('Erreur de chargement du profil');
      return res.json();
    },
  });

  // 2. Fetch active sessions
  const { data: sessionsData = [], refetch: refetchSessions } = useQuery<SessionItem[]>({
    queryKey: ['userSessions'],
    queryFn: async () => {
      const res = await fetch('/api/v1/auth/sessions');
      if (!res.ok) return [];
      return res.json();
    },
  });

  const user = meData?.user;
  const tenant = meData?.tenant;

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setAvatarUrl(user.avatarUrl || '');
      setPhone(user.phone || '');
      setJobTitle(user.jobTitle || '');
      setLocale(user.locale || 'fr-CA');
    }
  }, [user]);

  // Handle Avatar file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("L'image est trop volumineuse (maximum 5 Mo).");
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Veuillez sélectionner un fichier image valide (PNG, JPG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAvatarUrl(reader.result as string);
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setAvatarUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: 'Vide', color: 'bg-slate-200' };
    let score = 0;
    if (pass.length >= 12) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 2) return { score: 25, label: 'Faible', color: 'bg-rose-500 text-rose-700' };
    if (score === 3) return { score: 50, label: 'Moyen', color: 'bg-amber-500 text-amber-700' };
    if (score === 4) return { score: 75, label: 'Bon', color: 'bg-blue-500 text-blue-700' };
    return { score: 100, label: 'Très fort', color: 'bg-emerald-500 text-emerald-700' };
  };

  const passwordStrength = getPasswordStrength(newPassword);

  // Mutation: Update Profile
  const updateProfileMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch('/api/v1/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Erreur lors de la mise à jour du profil');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authMe'] });
      setSuccess('Vos modifications ont été enregistrées avec succès.');
      setError('');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    onError: (err: any) => {
      setError(err.message);
      setSuccess('');
    },
  });

  // Mutation: Revoke other sessions
  const revokeSessionsMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/v1/auth/sessions/revoke-others', {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Erreur lors de la révocation des sessions');
      return res.json();
    },
    onSuccess: () => {
      refetchSessions();
      setSuccess('Toutes les autres sessions actives ont été déconnectées avec succès.');
      setError('');
    },
    onError: (err: any) => {
      setError(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess('');
    setError('');

    // Password validation if changing password
    if (newPassword) {
      if (newPassword.length < 12) {
        setError('Le nouveau mot de passe doit comporter au moins 12 caractères.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setError('La confirmation du mot de passe ne correspond pas.');
        return;
      }
      if (!currentPassword) {
        setError('Votre mot de passe actuel est requis pour autoriser le changement.');
        return;
      }
    }

    const payload: any = {
      firstName: firstName.trim() || null,
      lastName: lastName.trim() || null,
      avatarUrl: avatarUrl.trim() || null,
      phone: phone.trim() || null,
      jobTitle: jobTitle.trim() || null,
      locale: locale as 'fr-CA' | 'en-CA',
    };

    if (newPassword) {
      payload.currentPassword = currentPassword;
      payload.newPassword = newPassword;
    }

    updateProfileMutation.mutate(payload);
  };

  const getInitials = (fn: string, ln: string, em: string) => {
    if (fn || ln) {
      return `${fn?.[0] || ''}${ln?.[0] || ''}`.toUpperCase() || 'U';
    }
    return (em?.[0] || 'U').toUpperCase();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="mx-auto max-w-5xl w-full p-4 sm:p-6 lg:p-8 space-y-6 flex-1">
        {/* Header Title & Summary Banner */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={firstName || 'Avatar'}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-md ring-2 ring-blue-100"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-md">
                  {getInitials(firstName, lastName, user?.email || '')}
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 p-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 shadow transition-colors"
                title="Changer la photo"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-slate-900">
                  {firstName || lastName ? `${firstName} ${lastName}`.trim() : user?.email?.split('@')[0]}
                </h1>
                {user?.isPlatformAdmin ? (
                  <Badge variant="warning" className="bg-amber-100 text-amber-900 border-amber-300 font-bold">
                    SuperAdmin
                  </Badge>
                ) : (
                  <Badge variant="default" className="bg-blue-100 text-blue-800 border-blue-200">
                    {user?.roles?.[0]?.name || 'Membre actif'}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center space-x-2">
                <span>{user?.email}</span>
                <span>•</span>
                <span>{tenant?.name || 'Organisme'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              type="button"
              variant="default"
              onClick={handleSubmit}
              disabled={updateProfileMutation.isPending || isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm flex items-center space-x-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{updateProfileMutation.isPending ? 'Enregistrement...' : 'Enregistrer mon profil'}</span>
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
            { id: 'personal', label: 'Profil & Identité', icon: User },
            { id: 'security', label: 'Sécurité & Mot de Passe', icon: KeyRound },
            { id: 'sessions', label: 'Sessions Actives & Appareils', icon: Laptop },
            { id: 'preferences', label: 'Préférences & Alertes', icon: Bell },
          ].map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id as ProfileTab)}
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

        {/* Form Sections */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* TAB 1: INFORMATIONS PERSONNELLES */}
          {activeTab === 'personal' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
              {/* Left Column: Form Fields */}
              <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-5">
                <h3 className="text-base font-bold text-slate-900 border-b pb-3">
                  Informations Générales
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Prénom
                    </label>
                    <Input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Ex: Sophie"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Nom de famille
                    </label>
                    <Input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Ex: Tremblay"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Courriel de connexion
                  </label>
                  <div className="flex items-center space-x-2">
                    <Input
                      value={user?.email || ''}
                      disabled
                      className="bg-slate-100 text-slate-600 cursor-not-allowed font-mono text-xs"
                    />
                    <Badge variant="default" className="bg-emerald-100 text-emerald-800 border-emerald-200 whitespace-nowrap">
                      <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                      Vérifié
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    L'adresse courriel sert d'identifiant unique et ne peut être modifiée que par un administrateur système.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                      <span>Poste / Fonction</span>
                    </label>
                    <Input
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder="Ex: Direction Générale"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
                      <Phone className="w-3.5 h-3.5 text-blue-600" />
                      <span>Téléphone direct / Mobile</span>
                    </label>
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Ex: (514) 555-0144"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Avatar Upload Box */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-5 flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 border-b pb-3">
                    Photo de Profil
                  </h3>
                  <p className="text-xs text-slate-500 mt-2">
                    Votre photo apparaît dans les discussions de projet, les assignations de tâches et le menu supérieur.
                  </p>

                  <div className="mt-4 p-5 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-center">
                    {avatarUrl ? (
                      <div className="space-y-3">
                        <img
                          src={avatarUrl}
                          alt="Avatar aperçu"
                          className="w-24 h-24 rounded-2xl object-cover mx-auto shadow-md border-2 border-white ring-2 ring-blue-200"
                        />
                        <div className="flex items-center justify-center space-x-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            className="text-xs"
                          >
                            <Upload className="w-3.5 h-3.5 mr-1" />
                            <span>Changer</span>
                          </Button>
                          <Button
                            type="button"
                            variant="danger"
                            size="sm"
                            onClick={handleRemoveAvatar}
                            className="text-xs text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border-rose-200"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1" />
                            <span>Retirer</span>
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
                          <User className="w-8 h-8" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">Aucune photo</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">PNG, JPG ou WEBP (Max 5 Mo)</p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-xs font-semibold"
                        >
                          <Upload className="w-3.5 h-3.5 mr-1" />
                          <span>Importer une photo</span>
                        </Button>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                </div>

                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-blue-900 text-xs flex items-start space-x-2">
                  <Sparkles className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>
                    Votre photo personnalise votre présence auprès des membres de votre équipe.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SÉCURITÉ & MOT DE PASSE */}
          {activeTab === 'security' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
              {/* Left Column: Password update form */}
              <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-5">
                <div className="border-b pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Modifier mon Mot de Passe
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Protégez l'accès à votre espace avec un mot de passe robuste et unique.
                    </p>
                  </div>
                  <Badge variant="default" className="bg-indigo-100 text-indigo-800 border-indigo-200">
                    Chiffrement Argon2id
                  </Badge>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Mot de passe actuel
                  </label>
                  <div className="relative">
                    <Input
                      type={showCurrentPass ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Saisissez votre mot de passe actuel"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Nouveau mot de passe (12 car. min.)
                    </label>
                    <div className="relative">
                      <Input
                        type={showNewPass ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Nouveau mot de passe"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPass(!showNewPass)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                      >
                        {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Confirmer le mot de passe
                    </label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Retapez le nouveau mot de passe"
                    />
                  </div>
                </div>

                {/* Password Strength Meter */}
                {newPassword && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-700">Robustesse :</span>
                      <span className="font-bold">{passwordStrength.label}</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                        style={{ width: `${passwordStrength.score}%` }}
                      />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-600 pt-1">
                      <span className={newPassword.length >= 12 ? 'text-emerald-600 font-semibold' : ''}>
                        ✓ 12+ caractères
                      </span>
                      <span className={/[A-Z]/.test(newPassword) ? 'text-emerald-600 font-semibold' : ''}>
                        ✓ 1 Majuscule
                      </span>
                      <span className={/[0-9]/.test(newPassword) ? 'text-emerald-600 font-semibold' : ''}>
                        ✓ 1 Chiffre
                      </span>
                      <span className={/[^A-Za-z0-9]/.test(newPassword) ? 'text-emerald-600 font-semibold' : ''}>
                        ✓ 1 Symbole
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Security Checklist */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-slate-900 border-b pb-3 flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <span>État de Sécurité</span>
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center space-x-3">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <div>
                      <p className="font-bold text-slate-800">Authentification Sécurisée</p>
                      <p className="text-slate-500 text-[11px]">Cookies HTTP-Only & Chiffrement SSL</p>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center space-x-3">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <div>
                      <p className="font-bold text-slate-800">Isolation Multi-Tenant</p>
                      <p className="text-slate-500 text-[11px]">Accès strictement compartimenté RLS</p>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center space-x-3">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <div>
                      <p className="font-bold text-slate-800">Traçabilité & Audit</p>
                      <p className="text-slate-500 text-[11px]">Journal d'accès infalsifiable</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SESSIONS ACTIVES & APPAREILS */}
          {activeTab === 'sessions' && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Sessions Actives & Appareils Connectés
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Consultez les appareils actuellement connectés à votre compte et révoquez les accès non autorisés.
                  </p>
                </div>

                {sessionsData.length > 1 && (
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => revokeSessionsMutation.mutate()}
                    disabled={revokeSessionsMutation.isPending}
                    className="text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border-rose-200 flex items-center space-x-1.5"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Déconnecter les autres sessions</span>
                  </Button>
                )}
              </div>

              <div className="space-y-3">
                {sessionsData.map((session) => {
                  const isMobile = /mobile|android|iphone|ipad/i.test(session.userAgent);
                  const Icon = isMobile ? Smartphone : Laptop;

                  return (
                    <div
                      key={session.id}
                      className={`p-4 rounded-xl border transition-colors flex items-center justify-between ${
                        session.isCurrent
                          ? 'bg-blue-50/50 border-blue-200 ring-1 ring-blue-300'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center space-x-3.5">
                        <div
                          className={`p-2.5 rounded-xl ${
                            session.isCurrent ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-900 text-xs truncate max-w-xs">
                              {session.userAgent.includes('Mozilla')
                                ? session.userAgent.split(' ')[0] + ' Web Client'
                                : session.userAgent}
                            </span>
                            {session.isCurrent && (
                              <Badge variant="default" className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px]">
                                Cet appareil (Session actuelle)
                              </Badge>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5 flex items-center space-x-3">
                            <span>IP : {session.ipAddress}</span>
                            <span>•</span>
                            <span>
                              Connecté le {new Date(session.createdAt).toLocaleDateString('fr-CA')} à{' '}
                              {new Date(session.createdAt).toLocaleTimeString('fr-CA', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[11px] text-slate-400">
                          Expire le {new Date(session.expiresAt).toLocaleDateString('fr-CA')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: PRÉFÉRENCES & ALERTES */}
          {activeTab === 'preferences' && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-6 animate-fadeIn">
              <h3 className="text-base font-bold text-slate-900 border-b pb-3">
                Préférences Régionales & Notifications
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
                    <Globe className="w-3.5 h-3.5 text-blue-600" />
                    <span>Langue d’affichage de l’interface</span>
                  </label>
                  <select
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white focus:ring-2 focus:ring-blue-500 font-medium"
                    value={locale}
                    onChange={(e) => {
                      setLocale(e.target.value);
                      i18n.changeLanguage(e.target.value.startsWith('fr') ? 'fr' : 'en');
                    }}
                  >
                    <option value="fr-CA">Français (Canada)</option>
                    <option value="en-CA">English (Canada)</option>
                  </select>
                </div>
              </div>

              <div className="border-t pt-5 space-y-4">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
                  <Bell className="w-4 h-4 text-blue-600" />
                  <span>Notifications & Alertes par Courriel</span>
                </h4>

                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100/70 transition-colors">
                    <div>
                      <span className="text-xs font-bold text-slate-900">
                        Rappels hebdomadaires de feuilles de temps
                      </span>
                      <p className="text-[11px] text-slate-500">
                        Recevoir un rappel le vendredi pour soumettre vos heures de la semaine.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={timesheetReminders}
                      onChange={(e) => setTimesheetReminders(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100/70 transition-colors">
                    <div>
                      <span className="text-xs font-bold text-slate-900">
                        Alertes d'échéances de subventions & jalons
                      </span>
                      <p className="text-[11px] text-slate-500">
                        Notifications automatiques 15 jours avant la date limite de remise d'un rapport bailleur.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={grantMilestoneAlerts}
                      onChange={(e) => setGrantMilestoneAlerts(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Save Action */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 flex items-center justify-between shadow-sm">
            <p className="text-xs text-slate-500">
              Cliquez pour enregistrer vos modifications de profil et de sécurité.
            </p>
            <Button
              type="submit"
              variant="default"
              disabled={updateProfileMutation.isPending || isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm flex items-center space-x-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{updateProfileMutation.isPending ? 'Enregistrement...' : 'Enregistrer mon profil'}</span>
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
