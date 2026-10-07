import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { Button, Input } from '@orgdashio/ui';

export function RegisterTenantScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [tenantName, setTenantName] = useState('');
  const [adminFirstName, setAdminFirstName] = useState('');
  const [adminLastName, setAdminLastName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/v1/auth/register-tenant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantName,
          adminFirstName,
          adminLastName,
          adminEmail,
          password,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({
          message: 'Le serveur API NestJS n’a pas pu être atteint. Vérifiez que l’API est démarrée.',
        }));
        throw new Error(data.message || 'Erreur lors de la création');
      }

      navigate('/onboarding');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-8 shadow-md border border-slate-200">
        <h1 className="text-2xl font-black text-indigo-600 mb-1 tracking-tight">OrgDashio</h1>
        <h2 className="text-xl font-bold text-slate-800 mb-1">
          Créer un espace pour votre organisme
        </h2>
        <p className="text-xs text-slate-500 mb-6">
          Enregistrez votre organisme et créez votre compte administrateur principal.
        </p>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nom officiel de l'organisme / association"
            value={tenantName}
            onChange={(e) => setTenantName(e.target.value)}
            placeholder="Ex: Association Solidarité Montréal"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Prénom de l'administrateur"
              value={adminFirstName}
              onChange={(e) => setAdminFirstName(e.target.value)}
              placeholder="Ex: Jean"
              required
            />
            <Input
              label="Nom de famille"
              value={adminLastName}
              onChange={(e) => setAdminLastName(e.target.value)}
              placeholder="Ex: Tremblay"
              required
            />
          </div>

          <Input
            label="Courriel de connexion de l'administrateur"
            type="email"
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
            placeholder="admin@organisation.org"
            required
          />

          <Input
            label="Mot de passe sécurisé (12 caractères min.)"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimum 12 caractères"
            required
          />

          <Button type="submit" className="w-full font-bold" disabled={loading}>
            {loading ? 'Création en cours...' : 'Créer mon organisation et mon compte'}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-600">
          {t('auth.alreadyHaveAccount')}{' '}
          <Link to="/login" className="font-medium text-indigo-600 hover:underline">
            {t('auth.loginHere')}
          </Link>
        </div>
      </div>
    </div>
  );
}
