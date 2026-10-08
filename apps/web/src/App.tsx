import { Routes, Route, Navigate } from 'react-router-dom';
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
    <Routes>
      <Route path="/login" element={<LoginScreen />} />
      <Route path="/register" element={<RegisterTenantScreen />} />
      <Route path="/onboarding" element={<OnboardingWizardScreen />} />
      <Route path="/dashboard" element={<TenantDashboardScreen />} />
      <Route path="/projects" element={<ProjectListScreen />} />
      <Route path="/projects/:id" element={<ProjectDetailScreen />} />
      <Route path="/people" element={<PeopleListScreen />} />
      <Route path="/people/:id" element={<PersonDetailScreen />} />
      <Route path="/training" element={<TrainingCatalogScreen />} />
      <Route path="/training/sessions/:id" element={<TrainingSessionDetailScreen />} />
      <Route path="/public/register/:sessionId" element={<PublicRegistrationScreen />} />
      <Route path="/cases" element={<CaseListScreen />} />
      <Route path="/cases/:id" element={<CaseDetailScreen />} />
      <Route path="/indicators" element={<IndicatorListScreen />} />
      <Route path="/dashboard/impact" element={<ImpactDashboardScreen />} />
      <Route path="/grants" element={<GrantListScreen />} />
      <Route path="/grants/:id" element={<GrantDetailScreen />} />
      <Route path="/donations" element={<DonationListScreen />} />
      <Route path="/timesheets" element={<TimesheetScreen />} />
      <Route path="/billing" element={<BillingScreen />} />
      <Route path="/settings/billing" element={<BillingScreen />} />
      <Route path="/settings/profile" element={<UserProfileSettingsScreen />} />
      <Route path="/settings/organization" element={<OrganizationSettingsScreen />} />
      <Route path="/settings/privacy" element={<PrivacySettingsScreen />} />
      <Route path="/settings/team" element={<TeamInvitationsScreen />} />
      <Route path="/invite/accept" element={<AcceptInvitationScreen />} />
      <Route path="/settings/audit" element={<AuditLogScreen />} />
      <Route path="/platform/dashboard" element={<PlatformDashboardScreen />} />
      <Route path="/platform/tenants" element={<PlatformConsoleScreen />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
