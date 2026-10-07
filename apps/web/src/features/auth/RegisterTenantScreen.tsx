import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { Button, Input } from '@orgdashio/ui';

export function RegisterTenantScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [tenantName, setTenantName] = useState('');
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
        body: JSON.stringify({ tenantName, adminEmail, password }),
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
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h1 className="text-2xl font-bold text-indigo-600 mb-2">OrgDashio</h1>
        <h2 className="text-xl font-semibold text-slate-800 mb-6">
          {t('auth.registerTitle')}
        </h2>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={t('auth.tenantName')}
            value={tenantName}
            onChange={(e) => setTenantName(e.target.value)}
            placeholder="Ex: Association Solidarité Montréal"
            required
          />

          <Input
            label={t('auth.adminEmail')}
            type="email"
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
            required
          />

          <Input
            label={t('common.password')}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimum 12 caractères"
            required
          />

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t('common.loading') : t('common.create')}
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
