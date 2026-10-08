import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './features/auth/AuthContext';
import { ProtectedRoute, PlatformAdminRoute, PublicOnlyRoute } from './features/auth/ProtectedRoute';

import { LoginScreen } from './features/auth/LoginScreen';
import { RegisterTenantScreen } from './features/auth/RegisterTenantScreen';
import { ProjectListScreen } from './features/project/ProjectListScreen';
import { ProjectDetailScreen } from './features/project/ProjectDetailScreen';
import { OnboardingWizardScreen } from './features/onboarding/OnboardingWizardScreen';
import { TeamInvitationsScreen } from './features/team/TeamInvitationsScreen';
import { AcceptInvitationScreen } from './features/team/AcceptInvitationScreen';
import { AuditLogScreen } from './features/audit/AuditLogScreen';
import { PlatformConsoleScreen } from './features/platform/PlatformConsoleScreen';
import { PlatformDashboardScreen } from './features/platform/PlatformDashboardScreen';
import { TenantDashboardScreen } from './features/dashboard/TenantDashboardScreen';
import { PeopleListScreen } from './features/people/PeopleListScreen';
import { PersonDetailScreen } from './features/people/PersonDetailScreen';
import { TrainingCatalogScreen } from './features/training/TrainingCatalogScreen';
import { TrainingSessionDetailScreen } from './features/training/TrainingSessionDetailScreen';
import { PublicRegistrationScreen } from './features/training/PublicRegistrationScreen';
import { CaseListScreen } from './features/cases/CaseListScreen';
import { CaseDetailScreen } from './features/cases/CaseDetailScreen';
import { IndicatorListScreen } from './features/indicators/IndicatorListScreen';
import { ImpactDashboardScreen } from './features/indicators/ImpactDashboardScreen';
import { OrganizationSettingsScreen } from './features/settings/OrganizationSettingsScreen';
import { PrivacySettingsScreen } from './features/settings/PrivacySettingsScreen';
import { UserProfileSettingsScreen } from './features/settings/UserProfileSettingsScreen';
import { BillingScreen } from './features/billing/BillingScreen';
import { GrantListScreen } from './features/grants/GrantListScreen';
import { GrantDetailScreen } from './features/grants/GrantDetailScreen';
import { DonationListScreen } from './features/donations/DonationListScreen';
import { TimesheetScreen } from './features/timesheets/TimesheetScreen';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public-only routes (redirects to dashboard if already authenticated) */}
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <LoginScreen />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicOnlyRoute>
              <RegisterTenantScreen />
            </PublicOnlyRoute>
          }
        />

        {/* Public open utility routes */}
        <Route path="/public/register/:sessionId" element={<PublicRegistrationScreen />} />
        <Route path="/invite/accept" element={<AcceptInvitationScreen />} />

        {/* Protected Tenant Workspace routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <TenantDashboardScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <OnboardingWizardScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects"
          element={
            <ProtectedRoute>
              <ProjectListScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/:id"
          element={
            <ProtectedRoute>
              <ProjectDetailScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/people"
          element={
            <ProtectedRoute>
              <PeopleListScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/people/:id"
          element={
            <ProtectedRoute>
              <PersonDetailScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/training"
          element={
            <ProtectedRoute>
              <TrainingCatalogScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/training/sessions/:id"
          element={
            <ProtectedRoute>
              <TrainingSessionDetailScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cases"
          element={
            <ProtectedRoute>
              <CaseListScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cases/:id"
          element={
            <ProtectedRoute>
              <CaseDetailScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/indicators"
          element={
            <ProtectedRoute>
              <IndicatorListScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/impact"
          element={
            <ProtectedRoute>
              <ImpactDashboardScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/grants"
          element={
            <ProtectedRoute>
              <GrantListScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/grants/:id"
          element={
            <ProtectedRoute>
              <GrantDetailScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/donations"
          element={
            <ProtectedRoute>
              <DonationListScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/timesheets"
          element={
            <ProtectedRoute>
              <TimesheetScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/billing"
          element={
            <ProtectedRoute>
              <BillingScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/billing"
          element={
            <ProtectedRoute>
              <BillingScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/profile"
          element={
            <ProtectedRoute>
              <UserProfileSettingsScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/organization"
          element={
            <ProtectedRoute>
              <OrganizationSettingsScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/privacy"
          element={
            <ProtectedRoute>
              <PrivacySettingsScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/team"
          element={
            <ProtectedRoute>
              <TeamInvitationsScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/audit"
          element={
            <ProtectedRoute>
              <AuditLogScreen />
            </ProtectedRoute>
          }
        />

        {/* SuperAdmin SaaS Platform Console routes */}
        <Route
          path="/platform/dashboard"
          element={
            <PlatformAdminRoute>
              <PlatformDashboardScreen />
            </PlatformAdminRoute>
          }
        />
        <Route
          path="/platform/tenants"
          element={
            <PlatformAdminRoute>
              <PlatformConsoleScreen />
            </PlatformAdminRoute>
          }
        />

        {/* Catch-all fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}
