import React, { createContext, useContext, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

export interface UserRole {
  id: string;
  code: string;
  name: string;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
  phone?: string | null;
  jobTitle?: string | null;
  locale?: string;
  isPlatformAdmin?: boolean;
  roles?: UserRole[];
}

export interface AuthTenant {
  id: string;
  name: string;
  slug: string;
  mode?: string;
  logoUrl?: string | null;
  acronym?: string | null;
  description?: string | null;
  orgType?: string | null;
  neqNumber?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  privacyOfficerName?: string | null;
  privacyOfficerEmail?: string | null;
  dataRetentionMonths?: number | null;
  charityRegistrationNumber?: string | null;
  authorizedSignerName?: string | null;
  authorizedSignerTitle?: string | null;
  currency?: string;
  fiscalYearEnd?: string;
  timezone?: string;
}

export interface AuthContextType {
  user: AuthUser | null;
  tenant: AuthTenant | null;
  isAuthenticated: boolean;
  isPlatformAdmin: boolean;
  isLoading: boolean;
  refetchAuth: () => Promise<any>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data, isLoading, refetch } = useQuery<{ user: AuthUser | null; tenant: AuthTenant | null } | null>({
    queryKey: ['authMe'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/v1/auth/me');
        if (!res.ok) return null;
        return await res.json();
      } catch {
        return null;
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const user = data?.user ?? null;
  const tenant = data?.tenant ?? null;
  const isAuthenticated = !!user;
  const isPlatformAdmin = !!user?.isPlatformAdmin;

  const logout = async () => {
    try {
      await fetch('/api/v1/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error('Logout error', e);
    } finally {
      queryClient.setQueryData(['authMe'], null);
      queryClient.clear();
      navigate('/login', { replace: true });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        tenant,
        isAuthenticated,
        isPlatformAdmin,
        isLoading,
        refetchAuth: refetch,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
