import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Badge } from '@orgdashio/ui';
import { Check, ArrowRight, Building2, Globe, Layers, Users, FolderPlus, ShieldCheck } from 'lucide-react';
import { Navbar } from '../../components/Navbar';

export function OnboardingWizardScreen() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  // Form States
  const [legalName, setLegalName] = useState('');
  const [orgType, setOrgType] = useState('OBNL / NPO (Organisme à but non lucratif)');
  const [neqNumber, setNeqNumber] = useState('');
  const [locale, setLocale] = useState('fr-CA');
  const [currency, setCurrency] = useState('CAD ($)');
  const [selectedSectors, setSelectedSectors] = useState<string[]>([
    'training_insertion',
    'humanitarian_social',
  ]);

  const [missionStatement, setMissionStatement] = useState('');
  const [privacyOfficerEmail, setPrivacyOfficerEmail] = useState('');
  const [teamEmails, setTeamEmails] = useState('');

  const toggleSector = (id: string) => {
    if (selectedSectors.includes(id)) {
      setSelectedSectors(selectedSectors.filter((s) => s !== id));
    } else {
      setSelectedSectors([...selectedSectors, id]);
    }
  };

  const nextStep = () => {
    if (step < 6) setStep(step + 1);
    else navigate('/dashboard');
  };

  const sectorPacks = [
    {
      id: 'npo_obnl',
      name: 'OBNL / NPO & Association',
      desc: 'Gestion des membres, bénévoles, assemblées générales et rapports annuels',
    },
    {
      id: 'training_insertion',
      name: 'Formation & Insertion Professionnelle',
      desc: 'Cohortes, ateliers, suivi de présence et certificats de réussite',
    },
    {
      id: 'humanitarian_social',
      name: 'Accompagnement Social & Communautaire',
      desc: 'Fiches bénéficiaires, dossiers de cas confidentiels et bris de glace',
    },
    {
      id: 'foundation_grants',
      name: 'Fondation & Bailleur de Fonds',
      desc: 'Gestion des subventions, projets, lignes budgétaires et suivi des indicateurs',
    },
    {
      id: 'social_enterprise',
      name: 'Économie Sociale & Entreprise Solidaire',
      desc: 'Activités génératrices de revenus, prestations de services et comptabilité analytique',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <Navbar />
      <div className="flex flex-1 items-center justify-center p-4 my-6">
        <div className="w-full max-w-2xl rounded-xl bg-white p-8 shadow-lg">
          {/* Header & Stepper */}
          <div className="mb-8 border-b pb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Building2 className="h-6 w-6 text-indigo-600" />
                <h1 className="text-xl font-bold text-slate-900">Assistant d'Accueil & Configuration</h1>
              </div>
              <Badge variant="default">Étape {step} sur 6</Badge>
            </div>
            <div className="mt-4 flex justify-between">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className={`h-2 flex-1 rounded-full mx-1 transition-colors ${
                    i <= step ? 'bg-indigo-600' : 'bg-slate-200'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Step 1: Profil de l'organisme */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-800">1. Identité de l'organisme (OBNL / NPO / Association)</h2>
              <Input
                label="Nom officiel ou raison sociale de l'organisme"
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                placeholder="Ex: Centre d'Action Communautaire Montréal (OBNL)"
                required
              />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Structure juridique</label>
                <select
                  className="w-full rounded-md border p-2 text-sm bg-white"
                  value={orgType}
                  onChange={(e) => setOrgType(e.target.value)}
                >
                  <option value="OBNL / NPO (Organisme à but non lucratif)">OBNL / NPO (Organisme à but non lucratif)</option>
                  <option value="Association Incorporée">Association Incorporée</option>
                  <option value="Fondation Caritative">Fondation Caritative</option>
                  <option value="Coopérative / Économie Sociale">Coopérative / Économie Sociale</option>
                  <option value="Autre organisme communautaire">Autre organisme communautaire</option>
                </select>
              </div>
              <Input
                label="Numéro d'entreprise / NEQ (Optionnel)"
                value={neqNumber}
                onChange={(e) => setNeqNumber(e.target.value)}
                placeholder="Ex: 1172839405"
              />
            </div>
          )}

          {/* Step 2: Langue & Devise */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-800">2. Langue, Région & Devise Principale</h2>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Langue d’affichage par défaut</label>
                <select
                  className="w-full rounded-md border p-2 text-sm bg-white"
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
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Devise de comptabilité financière</label>
                <select
                  className="w-full rounded-md border p-2 text-sm bg-white"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  <option value="CAD ($)">Dollar Canadien (CAD $)</option>
                  <option value="EUR (€)">Euro (EUR €)</option>
                  <option value="USD ($)">Dollar Américain (USD $)</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 3: Packs Sectoriels Multiples */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-slate-800">3. Secteurs & Volets d'intervention (Choix multiple)</h2>
                <p className="text-xs text-slate-500">Sélectionnez les volets d'activités exploités par votre organisme :</p>
              </div>

              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {sectorPacks.map((pack) => {
                  const isSelected = selectedSectors.includes(pack.id);
                  return (
                    <div
                      key={pack.id}
                      onClick={() => toggleSector(pack.id)}
                      className={`cursor-pointer rounded-lg border p-4 transition-all flex items-start space-x-3 ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/60 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div>
                        <div className="font-semibold text-slate-900 text-sm">{pack.name}</div>
                        <div className="mt-0.5 text-xs text-slate-600">{pack.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 4: Mission & Conformité Loi 25 */}
          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-800">4. Mission & Conformité des Données (Loi 25)</h2>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Énoncé de mission (Optionnel)</label>
                <textarea
                  className="w-full rounded-md border p-2 text-sm bg-white h-20"
                  value={missionStatement}
                  onChange={(e) => setMissionStatement(e.target.value)}
                  placeholder="Ex: Soutenir l'insertion sociale et professionnelle des jeunes familles de Montréal."
                />
              </div>
              <Input
                label="Courriel du responsable de la protection des renseignements personnels (PRP / Loi 25)"
                type="email"
                value={privacyOfficerEmail}
                onChange={(e) => setPrivacyOfficerEmail(e.target.value)}
                placeholder="prp@organisme.org"
              />
            </div>
          )}

          {/* Step 5: Invitations de l'équipe */}
          {step === 5 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-800">5. Inviter vos collaborateurs (Optionnel)</h2>
              <p className="text-xs text-slate-500">
                Saisissez les adresses courriel de votre équipe (séparées par une virgule) :
              </p>
              <textarea
                className="w-full rounded-md border p-2 text-sm bg-white h-24 font-mono"
                value={teamEmails}
                onChange={(e) => setTeamEmails(e.target.value)}
                placeholder="coordonnateur@organisme.org, intervenant@organisme.org"
              />
            </div>
          )}

          {/* Step 6: Confirmation */}
          {step === 6 && (
            <div className="space-y-4 text-center py-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                <Check className="h-8 w-8 text-emerald-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Espace de travail configuré avec succès !</h2>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                Votre organisme <strong className="text-indigo-600">{legalName || 'Mon Organisme'}</strong> est prêt avec l'isolation PostgreSQL RLS activée.
              </p>
              <div className="inline-flex items-center space-x-2 bg-slate-100 px-4 py-2 rounded-md text-xs text-slate-700 font-mono">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Rôles système créés : Administrateur, Membre d'équipe, Lecteur</span>
              </div>
            </div>
          )}

          {/* Footer actions */}
          <div className="mt-8 flex justify-between items-center pt-4 border-t">
            {step > 1 ? (
              <Button variant="outline" size="sm" onClick={() => setStep(step - 1)}>
                Précédent
              </Button>
            ) : <div />}

            <Button onClick={nextStep}>
              {step === 6 ? 'Accéder au Tableau de Bord' : 'Étape suivante'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
