import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Input, Badge } from '@orgdashio/ui';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Building2,
  Heart,
  FolderKanban,
  Landmark,
  HeartHandshake,
  Clock,
  GraduationCap,
  ShieldCheck,
  BarChart3,
  Users,
  CheckCircle2,
  Shield,
  Lock,
  Server,
  Upload,
  Image as ImageIcon,
  Check,
  Zap,
  Smile,
  Compass,
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';

export function OnboardingWizardScreen() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [saveError, setSaveError] = useState('');

  // 1. Fetch current tenant info
  const { data: meData } = useQuery({
    queryKey: ['authMe'],
    queryFn: async () => {
      const res = await fetch('/api/v1/auth/me');
      if (!res.ok) return null;
      return res.json();
    },
  });

  // Step 1: Organisation & Identité
  const [orgName, setOrgName] = useState('');
  const [acronym, setAcronym] = useState('');
  const [orgType, setOrgType] = useState('OBNL / NPO (Organisme à but non lucratif)');
  const [mission, setMission] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');

  // Step 2: Préférences & Modules d'impact
  const [currency, setCurrency] = useState('CAD ($)');
  const [locale, setLocale] = useState('fr-CA');
  const [selectedModules, setSelectedModules] = useState<string[]>([
    'projects',
    'grants',
    'donations',
    'timesheets',
    'impact',
  ]);

  // Step 3: Première Initiative & Équipe
  const [createInitialProject, setCreateInitialProject] = useState(true);
  const [projectName, setProjectName] = useState('');
  const [projectCode, setProjectCode] = useState('');
  const [teamEmails, setTeamEmails] = useState('');

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Pre-fill tenant data if available
  useEffect(() => {
    if (meData?.tenant) {
      if (!orgName) setOrgName(meData.tenant.name || '');
      if (!acronym) setAcronym(meData.tenant.acronym || '');
      if (!logoUrl) setLogoUrl(meData.tenant.logoUrl || '');
      if (!mission) setMission(meData.tenant.description || '');
      if (!phone) setPhone(meData.tenant.phone || '');
      if (!website) setWebsite(meData.tenant.website || '');
      if (meData.tenant.orgType) setOrgType(meData.tenant.orgType);
    }
  }, [meData]);

  // Handle Logo file upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      setSaveError("L'image est trop volumineuse (maximum 3 Mo).");
      return;
    }

    if (!file.type.startsWith('image/')) {
      setSaveError('Veuillez sélectionner un fichier image valide (PNG, JPG, SVG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setLogoUrl(reader.result as string);
      setSaveError('');
    };
    reader.readAsDataURL(file);
  };

  const toggleModule = (id: string) => {
    if (selectedModules.includes(id)) {
      setSelectedModules(selectedModules.filter((m) => m !== id));
    } else {
      setSelectedModules([...selectedModules, id]);
    }
  };

  // Mutation: Save Tenant Settings
  const saveTenantMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: orgName.trim() || 'Mon Organisme',
        acronym: acronym.trim() || null,
        description: mission.trim() || null,
        orgType,
        logoUrl: logoUrl || null,
        phone: phone.trim() || null,
        website: website.trim() || null,
      };

      const res = await fetch('/api/v1/auth/tenant', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Erreur lors de l'enregistrement de l'organisme");
      }
      return res.json();
    },
  });

  // Mutation: Create First Project
  const createProjectMutation = useMutation({
    mutationFn: async () => {
      if (!createInitialProject || !projectName.trim()) return;
      const code = projectCode.trim() || `PRJ-${new Date().getFullYear()}-01`;
      const res = await fetch('/api/v1/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: projectName.trim(),
          code: code.toUpperCase().replace(/\s+/g, '-'),
          status: 'active',
        }),
      });
      if (!res.ok) {
        // Continue gracefully if project code exists or non-blocking
        console.warn('Initial project creation skipped or already exists');
      }
      return res.json();
    },
  });

  // Mutation: Send team invitations
  const sendInvitationsMutation = useMutation({
    mutationFn: async () => {
      if (!teamEmails.trim()) return;
      const emails = teamEmails
        .split(/[,;\n]/)
        .map((e) => e.trim())
        .filter((e) => e.includes('@'));

      for (const email of emails) {
        try {
          await fetch('/api/v1/invitations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, role: 'member' }),
          });
        } catch (e) {
          console.warn('Invitation error for', email, e);
        }
      }
    },
  });

  const handleNextStep = async () => {
    setSaveError('');
    if (step === 1 && !orgName.trim()) {
      setSaveError("Veuillez renseigner le nom officiel de votre organisme pour continuer.");
      return;
    }

    // Auto-save on moving forward
    try {
      if (step === 1) {
        await saveTenantMutation.mutateAsync();
      } else if (step === 3) {
        if (createInitialProject && projectName.trim()) {
          await createProjectMutation.mutateAsync();
        }
        if (teamEmails.trim()) {
          await sendInvitationsMutation.mutateAsync();
        }
      }
      setStep((prev) => Math.min(prev + 1, 4));
    } catch (err: any) {
      setSaveError(err.message || 'Une erreur est survenue lors de la sauvegarde.');
    }
  };

  const handleFinish = async () => {
    queryClient.invalidateQueries({ queryKey: ['authMe'] });
    queryClient.invalidateQueries({ queryKey: ['projects'] });
    navigate('/dashboard');
  };

  // Modules catalog
  const modulesList = [
    {
      id: 'projects',
      title: 'Projets & Plans d’Action',
      desc: 'Ordonnancement des tâches, budgets prévisionnels et suivi d’avancement.',
      icon: FolderKanban,
      color: 'text-blue-600 bg-blue-50 border-blue-200',
    },
    {
      id: 'grants',
      title: 'Subventions & Bailleurs',
      desc: 'Gestion des subventions publiques et fondations, jalons et rapports financiers.',
      icon: Landmark,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
    },
    {
      id: 'donations',
      title: 'Dons & Reçus Fiscaux ARC',
      desc: 'Collecte de dons et génération automatisée de reçus fiscaux conformes.',
      icon: HeartHandshake,
      color: 'text-rose-600 bg-rose-50 border-rose-200',
    },
    {
      id: 'timesheets',
      title: 'Feuilles de Temps & RH',
      desc: 'Suivi hebdomadaire, imputation par projet et valorisation du bénévolat.',
      icon: Clock,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    },
    {
      id: 'training',
      title: 'Formations & Inscriptions',
      desc: 'Catalogues d’ateliers, gestion des cohortes et portail public d’inscription.',
      icon: GraduationCap,
      color: 'text-amber-600 bg-amber-50 border-amber-200',
    },
    {
      id: 'cases',
      title: 'Accompagnement & Suivi Social',
      desc: 'Dossiers bénéficiaires confidentiels, plans d’intervention et notes d’évolution.',
      icon: ShieldCheck,
      color: 'text-purple-600 bg-purple-50 border-purple-200',
    },
    {
      id: 'impact',
      title: 'Impact & Cadre Logique',
      desc: 'Mesure des résultats, indicateurs désagrégés et tableaux de bord d’impact.',
      icon: BarChart3,
      color: 'text-cyan-600 bg-cyan-50 border-cyan-200',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 flex flex-col justify-center">
        {/* Top Progress & Friendly Encouragement Banner */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-2 bg-blue-100/80 text-blue-900 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-3 shadow-sm">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>Bienvenue dans votre nouvel espace OrgDashio</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Configurons ensemble votre organisme en quelques clics
          </h1>
          <p className="text-slate-600 text-sm mt-2 max-w-xl mx-auto">
            Une interface intuitive et performante pour vous faire gagner un temps précieux et démultiplier votre impact social.
          </p>

          {/* Stepper Dots */}
          <div className="flex items-center justify-center space-x-3 mt-6">
            {[
              { num: 1, label: 'Identité' },
              { num: 2, label: 'Vos Priorités' },
              { num: 3, label: 'Premier Projet' },
              { num: 4, label: 'Célébration' },
            ].map((s) => (
              <div key={s.num} className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => s.num < step && setStep(s.num)}
                  disabled={s.num > step}
                  className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    s.num === step
                      ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-300'
                      : s.num < step
                      ? 'bg-emerald-100 text-emerald-800 cursor-pointer'
                      : 'bg-white text-slate-400 border border-slate-200'
                  }`}
                >
                  {s.num < step ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <span>{s.num}</span>
                  )}
                  <span className="hidden sm:inline">{s.label}</span>
                </button>
                {s.num < 4 && <div className="w-4 h-0.5 bg-slate-200" />}
              </div>
            ))}
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xl overflow-hidden backdrop-blur-sm">
          {/* Card Header with Positive Tone */}
          <div className="bg-slate-900 text-white px-6 sm:px-8 py-5 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-600/30 text-blue-400 rounded-lg border border-blue-500/30">
                {step === 1 && <Building2 className="w-5 h-5 text-blue-400" />}
                {step === 2 && <Compass className="w-5 h-5 text-indigo-400" />}
                {step === 3 && <FolderKanban className="w-5 h-5 text-emerald-400" />}
                {step === 4 && <Smile className="w-5 h-5 text-amber-400" />}
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-100">
                  {step === 1 && "1. L'identité & la mission de votre organisme"}
                  {step === 2 && '2. Vos outils & modules d’impact clés'}
                  {step === 3 && '3. Lancez votre premier projet d’action'}
                  {step === 4 && '4. Votre plateforme est prête à l’action !'}
                </h2>
                <p className="text-xs text-slate-400">
                  {step === 1 && 'Donnez une image soignée et professionnelle à votre organisme.'}
                  {step === 2 && 'Activez les fonctionnalités adaptées à vos besoins actuels.'}
                  {step === 3 && 'Démarrez dès aujourd’hui avec une structure claire et organisée.'}
                  {step === 4 && 'Tout est en place pour collaborer en toute simplicité.'}
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-slate-800 text-slate-300 border-slate-700">
              Étape {step} / 4
            </Badge>
          </div>

          {/* Form Content Area */}
          <div className="p-6 sm:p-8 space-y-6">
            {saveError && (
              <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center space-x-2 animate-fadeIn">
                <span className="font-bold">Attention :</span>
                <span>{saveError}</span>
              </div>
            )}

            {/* STEP 1: Identité & Logo */}
            {step === 1 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div className="sm:col-span-2 space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Nom officiel de l’organisme <span className="text-rose-500">*</span>
                      </label>
                      <Input
                        value={orgName}
                        onChange={(e) => setOrgName(e.target.value)}
                        placeholder="Ex: Centre d'Action Communautaire Montréal"
                        required
                        className="font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Sigle / Acronyme (Court)
                        </label>
                        <Input
                          value={acronym}
                          onChange={(e) => setAcronym(e.target.value)}
                          placeholder="Ex: CACM"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Type de structure
                        </label>
                        <select
                          className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white focus:ring-2 focus:ring-blue-500 font-medium"
                          value={orgType}
                          onChange={(e) => setOrgType(e.target.value)}
                        >
                          <option value="OBNL / NPO (Organisme à but non lucratif)">OBNL / Association à but non lucratif</option>
                          <option value="Organisme de bienfaisance enregistré">Organisme de bienfaisance enregistré (ARC)</option>
                          <option value="Fondation Caritative">Fondation Caritative</option>
                          <option value="Coopérative / Économie Sociale">Coopérative / Économie Sociale</option>
                          <option value="Organisation Communautaire">Organisation Communautaire locale</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Logo Upload Box */}
                  <div className="flex flex-col items-center justify-center p-4 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl hover:border-blue-400 transition-colors text-center">
                    {logoUrl ? (
                      <div className="space-y-2">
                        <img
                          src={logoUrl}
                          alt="Logo aperçu"
                          className="max-h-20 max-w-[140px] object-contain mx-auto rounded p-1 bg-white border border-slate-200 shadow-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setLogoUrl('')}
                          className="text-[11px] text-rose-600 hover:underline font-semibold block mx-auto"
                        >
                          Changer de logo
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
                          <ImageIcon className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">Logo de l'organisme</p>
                          <p className="text-[10px] text-slate-500">PNG, JPG ou SVG (Max 3 Mo)</p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-xs"
                        >
                          <Upload className="w-3.5 h-3.5 mr-1" />
                          <span>Importer</span>
                        </Button>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png, image/jpeg, image/svg+xml, image/webp"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Mission ou slogan inspirant de votre équipe (Optionnel)
                  </label>
                  <textarea
                    rows={2}
                    value={mission}
                    onChange={(e) => setMission(e.target.value)}
                    placeholder="Ex: Soutenir l'épanouissement, l'insertion sociale et la solidarité dans notre communauté."
                    className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Téléphone principal (Optionnel)
                    </label>
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Ex: (514) 555-0123"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Site web public (Optionnel)
                    </label>
                    <Input
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://mon-organisme.org"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Choix des Modules Clés */}
            {step === 2 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Préférences Régionales & Comptables
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Adaptez l'affichage financier selon vos standards.
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <select
                      className="rounded-lg border border-slate-300 py-1.5 px-3 text-xs bg-white font-semibold"
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                    >
                      <option value="CAD ($)">Dollar Canadien (CAD $)</option>
                      <option value="EUR (€)">Euro (EUR €)</option>
                      <option value="USD ($)">Dollar US (USD $)</option>
                    </select>

                    <select
                      className="rounded-lg border border-slate-300 py-1.5 px-3 text-xs bg-white font-semibold"
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

                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1">
                    Sélectionnez les volets prioritaires pour votre organisme
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">
                    Tous les modules restent disponibles et personnalisables à tout moment depuis vos paramètres.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {modulesList.map((m) => {
                      const isSelected = selectedModules.includes(m.id);
                      const Icon = m.icon;
                      return (
                        <div
                          key={m.id}
                          onClick={() => toggleModule(m.id)}
                          className={`cursor-pointer rounded-xl border p-4 transition-all duration-150 flex items-start space-x-3 ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50/50 shadow-sm ring-1 ring-blue-400/40'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <div className={`p-2 rounded-lg ${m.color} flex-shrink-0 mt-0.5`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900 text-xs">{m.title}</span>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}}
                                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                              />
                            </div>
                            <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">{m.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Première Initiative & Collaborateurs */}
            {step === 3 && (
              <div className="space-y-6 animate-fadeIn">
                {/* Project creation option */}
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                        <FolderKanban className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">
                          Initialiser votre première initiative / projet
                        </h3>
                        <p className="text-xs text-slate-500">
                          Commencez dès maintenant à suivre vos activités et vos budgets.
                        </p>
                      </div>
                    </div>
                    <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={createInitialProject}
                        onChange={(e) => setCreateInitialProject(e.target.checked)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>Créer ce projet</span>
                    </label>
                  </div>

                  {createInitialProject && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Titre du projet / initiative
                        </label>
                        <Input
                          value={projectName}
                          onChange={(e) => {
                            setProjectName(e.target.value);
                            if (!projectCode) {
                              const autoCode = e.target.value
                                .substring(0, 8)
                                .toUpperCase()
                                .replace(/[^A-Z0-9]/g, '');
                              if (autoCode) setProjectCode(`PRJ-${autoCode}`);
                            }
                          }}
                          placeholder="Ex: Programme d'Action Communautaire 2026"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Code court
                        </label>
                        <Input
                          value={projectCode}
                          onChange={(e) => setProjectCode(e.target.value)}
                          placeholder="Ex: PRJ-COM-26"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Invite Team Members */}
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-3">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Inviter vos premiers collaborateurs (Optionnel)
                      </h3>
                      <p className="text-xs text-slate-500">
                        Saisissez les courriels de vos collègues pour leur envoyer un accès sécurisé.
                      </p>
                    </div>
                  </div>

                  <textarea
                    rows={3}
                    value={teamEmails}
                    onChange={(e) => setTeamEmails(e.target.value)}
                    placeholder="direction@organisme.org, coordination@organisme.org, intervenant@organisme.org"
                    className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                  <p className="text-[11px] text-slate-500">
                    Séparez les adresses par des virgules ou des retours à la ligne. Vous pourrez en ajouter d'autres à tout moment.
                  </p>
                </div>
              </div>
            )}

            {/* STEP 4: Célébration & Succès */}
            {step === 4 && (
              <div className="text-center py-6 space-y-6 animate-fadeIn">
                <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
                  <CheckCircle2 className="w-10 h-10 animate-bounce" />
                </div>

                <div>
                  <h3 className="text-2xl font-black text-slate-900">
                    Félicitations ! Votre espace est prêt.
                  </h3>
                  <p className="text-sm text-slate-600 max-w-md mx-auto mt-2">
                    L'organisme <strong className="text-blue-600">{orgName || 'Votre Organisme'}</strong> est configuré avec succès. Vous disposez désormais de tous les outils pour piloter vos projets et maximiser votre impact social.
                  </p>
                </div>

                {/* Summary highlights */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto text-left">
                  <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-xl">
                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Identité</p>
                    <p className="text-xs font-black text-slate-900 mt-1 truncate">{orgName}</p>
                    <p className="text-[11px] text-slate-500">{acronym || orgType}</p>
                  </div>

                  <div className="p-3.5 bg-emerald-50/70 border border-emerald-100 rounded-xl">
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Modules Actifs</p>
                    <p className="text-xs font-black text-slate-900 mt-1">{selectedModules.length} volets activés</p>
                    <p className="text-[11px] text-slate-500">Projets, RH, Dons, Impact</p>
                  </div>

                  <div className="p-3.5 bg-purple-50/70 border border-purple-100 rounded-xl">
                    <p className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">Démarrage</p>
                    <p className="text-xs font-black text-slate-900 mt-1 truncate">
                      {projectName ? projectName : 'Tableau de bord'}
                    </p>
                    <p className="text-[11px] text-slate-500">Prêt pour l'action</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Controls */}
          <div className="bg-slate-50 px-6 sm:px-8 py-4 border-t border-slate-200 flex items-center justify-between">
            {step > 1 && step < 4 ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setStep(step - 1)}
                className="text-xs font-semibold"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
                <span>Précédent</span>
              </Button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={handleNextStep}
                disabled={saveTenantMutation.isPending || createProjectMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm"
              >
                <span>{saveTenantMutation.isPending ? 'Enregistrement...' : 'Continuer'}</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            ) : (
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={handleFinish}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md mx-auto sm:mx-0"
              >
                <span>Accéder à mon Tableau de Bord</span>
                <Sparkles className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Reassuring Security & Trust Banner (Modern, Clean & Sovereign) */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center sm:text-left">
          <div className="flex items-start space-x-3 p-3.5 rounded-xl bg-white/70 border border-slate-200/60 shadow-sm">
            <div className="p-2 bg-blue-100/80 text-blue-700 rounded-lg flex-shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Sécurité & Chiffrement</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Chiffrement de bout en bout et isolation stricte de vos données.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-3.5 rounded-xl bg-white/70 border border-slate-200/60 shadow-sm">
            <div className="p-2 bg-emerald-100/80 text-emerald-700 rounded-lg flex-shrink-0">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Hébergement Souverain</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Données hébergées en conformité avec les normes canadiennes et québécoises.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-3.5 rounded-xl bg-white/70 border border-slate-200/60 shadow-sm">
            <div className="p-2 bg-purple-100/80 text-purple-700 rounded-lg flex-shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Sauvegardes Quotidiennes</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Continuité de service et disponibilité garantie à 99.9%.
              </p>
            </div>
          </div>
        </div>

        {/* Discrete Legal & Privacy Notice Footer */}
        <p className="text-center text-[10px] text-slate-400 mt-6">
          OrgDashio respecte rigoureusement la confidentialité et la protection des renseignements personnels (Loi 25 / LPRPDE). Vos données restent votre propriété exclusive.
        </p>
      </main>
    </div>
  );
}
