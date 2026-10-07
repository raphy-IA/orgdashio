import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Input, Badge } from '@orgdashio/ui';
import { User, Lock, Save, CheckCircle, ShieldCheck, Phone, Briefcase, Mail, Camera } from 'lucide-react';
import { Navbar } from '../../components/Navbar';

export function UserProfileSettingsScreen() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarInputMode, setAvatarInputMode] = useState<'upload' | 'url'>('upload');
  const [phone, setPhone] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [locale, setLocale] = useState('fr-CA');
  
  // Password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("L'image est trop volumineuse (max. 5 Mo).");
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Format invalide. Veuillez sélectionner une image (PNG, JPG, WEBP).');
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

  const { data: meData, isLoading } = useQuery({
    queryKey: ['authMe'],
    queryFn: async () => {
      const res = await fetch('/api/v1/auth/me');
      if (!res.ok) throw new Error('Erreur de chargement du profil');
      return res.json();
    },
  });

  useEffect(() => {
    if (meData?.user) {
      setFirstName(meData.user.firstName || '');
      setLastName(meData.user.lastName || '');
      setAvatarUrl(meData.user.avatarUrl || '');
      setPhone(meData.user.phone || '');
      setJobTitle(meData.user.jobTitle || '');
      setLocale(meData.user.locale || 'fr-CA');
    }
  }, [meData]);

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
      setSuccess('Votre profil personnel a été mis à jour avec succès.');
      setError('');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
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

    if (newPassword) {
      if (newPassword.length < 12) {
        setError('Le nouveau mot de passe doit comporter au moins 12 caractères.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setError('Les mots de passe ne correspondent pas.');
        return;
      }
      if (!currentPassword) {
        setError('Veuillez saisir votre mot de passe actuel pour en définir un nouveau.');
        return;
      }
    }

    const payload: any = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      avatarUrl: avatarUrl.trim() || null,
      phone: phone.trim() || null,
      jobTitle: jobTitle.trim() || null,
      locale,
    };

    if (newPassword) {
      payload.currentPassword = currentPassword;
      payload.newPassword = newPassword;
    }

    updateProfileMutation.mutate(payload);
  };

  const getInitials = () => {
    if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase();
    if (firstName) return firstName.substring(0, 2).toUpperCase();
    if (meData?.user?.email) return meData.user.email.substring(0, 2).toUpperCase();
    return 'U';
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="mx-auto max-w-4xl p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-3 border-b pb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <User className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Mon Profil & Sécurité</h1>
            <p className="text-xs text-slate-500">
              Gérez vos informations personnelles, votre photo de profil et vos identifiants d'accès.
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

        <form onSubmit={handleSave} className="space-y-6">
          {/* Card: Identity & Avatar */}
          <div className="rounded-xl border bg-white p-6 shadow-sm space-y-6">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <User className="h-4 w-4 text-indigo-600" />
              1. Informations Personnelles
            </h2>

            {/* Avatar Preview */}
            <div className="flex items-center space-x-5 bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div className="relative">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="h-16 w-16 rounded-full object-cover border-2 border-indigo-200 shadow-sm"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-800 text-white font-bold text-xl shadow-sm">
                    {getInitials()}
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-semibold text-slate-800">
                  {firstName || lastName ? `${firstName} ${lastName}` : 'Votre Nom'}
                </p>
                <p className="text-xs text-slate-500 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  {meData?.user?.email}
                </p>
                {meData?.user?.roles && meData.user.roles.length > 0 && (
                  <div className="flex gap-1.5 pt-1">
                    {meData.user.roles.map((r: any) => (
                      <span key={r.id} className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-100 text-indigo-800">
                        {r.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Prénom"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Ex: Sophie"
              />
              <Input
                label="Nom de famille"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Ex: Tremblay"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Titre du poste / Fonction"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="Ex: Directrice des programmes"
              />
              <Input
                label="Numéro de téléphone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ex: 514-555-0199"
              />
            </div>

            {/* Avatar Mode Selector: Upload vs URL */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-slate-700">Photo de profil / Avatar</label>
                <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs">
                  <button
                    type="button"
                    onClick={() => setAvatarInputMode('upload')}
                    className={`px-3 py-1 rounded-md font-medium transition-all ${
                      avatarInputMode === 'upload'
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    📁 Importer un fichier
                  </button>
                  <button
                    type="button"
                    onClick={() => setAvatarInputMode('url')}
                    className={`px-3 py-1 rounded-md font-medium transition-all ${
                      avatarInputMode === 'url'
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🔗 Lien URL web
                  </button>
                </div>
              </div>

              {avatarInputMode === 'upload' ? (
                <div className="border-2 border-dashed border-slate-300 hover:border-indigo-400 bg-slate-50/70 rounded-xl p-4 text-center transition-colors">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    className="hidden"
                    id="avatar-file-upload"
                  />
                  <div className="flex flex-col items-center justify-center space-y-1.5">
                    <div className="p-2 rounded-full bg-indigo-50 text-indigo-600">
                      <Camera className="h-5 w-5" />
                    </div>
                    <div>
                      <label
                        htmlFor="avatar-file-upload"
                        className="cursor-pointer text-sm font-semibold text-indigo-600 hover:text-indigo-700 underline underline-offset-2"
                      >
                        Sélectionner une photo
                      </label>
                      <span className="text-xs text-slate-500"> depuis votre appareil</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Formats acceptés : PNG, JPG, WEBP (Max 5 Mo).
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <Input
                    label="URL de la photo de profil"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://exemple.org/photos/mon-avatar.jpg"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Insérez un lien direct vers votre photo ou avatar hébergé en ligne.
                  </p>
                </div>
              )}

              {avatarUrl && (
                <div className="flex items-center justify-between bg-indigo-50/50 border border-indigo-100 px-3 py-2 rounded-lg text-xs">
                  <span className="text-indigo-900 font-medium truncate max-w-md">
                    ✓ Photo chargée et prête à être enregistrée
                  </span>
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="text-red-600 hover:text-red-700 font-semibold text-xs ml-2 hover:underline"
                  >
                    Supprimer la photo
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Card: Password Change */}
          <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Lock className="h-4 w-4 text-indigo-600" />
              2. Sécurité & Mot de Passe
            </h2>
            <p className="text-xs text-slate-500">
              Laissez ces champs vides si vous ne souhaitez pas modifier votre mot de passe.
            </p>

            <div className="space-y-3 pt-2">
              <Input
                label="Mot de passe actuel"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••••••"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Nouveau mot de passe (min. 12 caractères)"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••••••"
                />
                <Input
                  label="Confirmer le nouveau mot de passe"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={updateProfileMutation.isPending}>
              <Save className="mr-2 h-4 w-4" />
              {updateProfileMutation.isPending ? 'Enregistrement...' : 'Enregistrer mon profil'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
