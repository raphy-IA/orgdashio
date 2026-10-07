import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  numeric,
  integer,
  date,
  unique,
  foreignKey,
  jsonb,
} from 'drizzle-orm/pg-core';

// ---------------------------------------------------------------------------
// Plan de Contrôle (Control Plane)
// ---------------------------------------------------------------------------
export const tenantRegistry = pgTable('tenant_registry', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  mode: text('mode', { enum: ['shared', 'dedicated', 'self_hosted'] })
    .notNull()
    .default('shared'),
  status: text('status', { enum: ['active', 'suspended', 'pending_deletion'] })
    .notNull()
    .default('active'),
  logoUrl: text('logo_url'),
  acronym: text('acronym'),
  description: text('description'),
  orgType: text('org_type').default('OBNL / NPO (Organisme à but non lucratif)'),
  neqNumber: text('neq_number'),
  address: text('address'),
  phone: text('phone'),
  email: text('email'),
  website: text('website'),
  privacyOfficerName: text('privacy_officer_name'),
  privacyOfficerEmail: text('privacy_officer_email'),
  dataRetentionMonths: integer('data_retention_months').default(60),
  onboardingCompleted: boolean('onboarding_completed').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const userAccount = pgTable('user_account', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  avatarUrl: text('avatar_url'),
  phone: text('phone'),
  jobTitle: text('job_title'),
  locale: text('locale').notNull().default('fr-CA'),
  isPlatformAdmin: boolean('is_platform_admin').notNull().default(false),
  status: text('status', { enum: ['active', 'pending_verification', 'suspended'] })
    .notNull()
    .default('active'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const userCredential = pgTable('user_credential', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => userAccount.id, { onDelete: 'cascade' }),
  type: text('type').notNull().default('password'),
  secretHash: text('secret_hash').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const userSession = pgTable('user_session', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => userAccount.id, { onDelete: 'cascade' }),
  tenantId: uuid('tenant_id').references(() => tenantRegistry.id, {
    onDelete: 'cascade',
  }),
  tokenHash: text('token_hash').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ---------------------------------------------------------------------------
// Plan de Données (Data Plane - Protected by RLS)
// ---------------------------------------------------------------------------

export const membership = pgTable(
  'membership',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenantRegistry.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => userAccount.id, { onDelete: 'cascade' }),
    status: text('status', { enum: ['active', 'invited', 'suspended'] })
      .notNull()
      .default('active'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    tenantIdIdUk: unique().on(table.tenantId, table.id),
    tenantIdUserUk: unique().on(table.tenantId, table.userId),
  })
);

export const role = pgTable(
  'role',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenantRegistry.id, { onDelete: 'cascade' }),
    code: text('code').notNull(),
    name: text('name').notNull(),
    isSystem: boolean('is_system').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    tenantIdIdUk: unique().on(table.tenantId, table.id),
    tenantIdCodeUk: unique().on(table.tenantId, table.code),
  })
);

export const permission = pgTable('permission', {
  code: text('code').primaryKey(),
  description: text('description').notNull(),
});

export const rolePermission = pgTable('role_permission', {
  roleId: uuid('role_id')
    .notNull()
    .references(() => role.id, { onDelete: 'cascade' }),
  permissionCode: text('permission_code')
    .notNull()
    .references(() => permission.code, { onDelete: 'cascade' }),
});

export const membershipRole = pgTable(
  'membership_role',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    membershipId: uuid('membership_id').notNull(),
    roleId: uuid('role_id').notNull(),
    validFrom: timestamp('valid_from', { withTimezone: true }),
    validTo: timestamp('valid_to', { withTimezone: true }),
  },
  (table) => ({
    membershipFk: foreignKey({
      columns: [table.tenantId, table.membershipId],
      foreignColumns: [membership.tenantId, membership.id],
    }).onDelete('cascade'),
    roleFk: foreignKey({
      columns: [table.tenantId, table.roleId],
      foreignColumns: [role.tenantId, role.id],
    }).onDelete('cascade'),
    tenantIdIdUk: unique().on(table.tenantId, table.id),
  })
);

export const auditLog = pgTable('audit_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenantRegistry.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => userAccount.id),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').notNull(),
  payload: jsonb('payload'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Module CORE: Invitations (CORE-05)
export const invitation = pgTable(
  'invitation',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    email: text('email').notNull(),
    roleId: uuid('role_id').notNull(),
    tokenHash: text('token_hash').notNull().unique(),
    status: text('status', {
      enum: ['pending', 'accepted', 'expired', 'revoked'],
    })
      .notNull()
      .default('pending'),
    invitedBy: uuid('invited_by')
      .notNull()
      .references(() => userAccount.id),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    roleFk: foreignKey({
      columns: [table.tenantId, table.roleId],
      foreignColumns: [role.tenantId, role.id],
    }),
    tenantIdIdUk: unique().on(table.tenantId, table.id),
  })
);

// Module ORG: Org Units (CORE-07)
export const orgUnit = pgTable(
  'org_unit',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    parentId: uuid('parent_id'),
    name: text('name').notNull(),
    code: text('code'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    parentFk: foreignKey({
      columns: [table.tenantId, table.parentId],
      foreignColumns: [table.tenantId, table.id],
    }),
    tenantIdIdUk: unique().on(table.tenantId, table.id),
  })
);

// Module DOC: Documents (CORE-14 / TEC-DOC-01)
export const document = pgTable(
  'document',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    entityType: text('entity_type').notNull(),
    entityId: text('entity_id').notNull(),
    fileName: text('file_name').notNull(),
    mimeType: text('mime_type').notNull(),
    fileSize: integer('file_size').notNull(),
    storageKey: text('storage_key').notNull().unique(),
    currentVersion: integer('current_version').notNull().default(1),
    uploadedBy: uuid('uploaded_by').notNull().references(() => userAccount.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    tenantIdIdUk: unique().on(table.tenantId, table.id),
  })
);

// Module NOTIF: Notifications (CORE-15)
export const notification = pgTable(
  'notification',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    userId: uuid('user_id').notNull().references(() => userAccount.id, { onDelete: 'cascade' }),
    eventType: text('event_type').notNull(),
    title: text('title').notNull(),
    message: text('message').notNull(),
    isRead: boolean('is_read').notNull().default(false),
    linkUrl: text('link_url'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    tenantIdIdUk: unique().on(table.tenantId, table.id),
  })
);

// Module ADMIN: Support Access Grant (CORE-24)
export const supportAccessGrant = pgTable('support_access_grant', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenantRegistry.id, { onDelete: 'cascade' }),
  adminId: uuid('admin_id').notNull().references(() => userAccount.id),
  reason: text('reason').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Module PEO: Party & Person (PEO-01)
export const party = pgTable(
  'party',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    kind: text('kind', { enum: ['person', 'organization'] }).notNull().default('person'),
    firstName: text('first_name'),
    lastName: text('last_name'),
    email: text('email'),
    phone: text('phone'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    tenantIdIdUk: unique().on(table.tenantId, table.id),
  })
);

export const beneficiaryProfile = pgTable(
  'beneficiary_profile',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    partyId: uuid('party_id').notNull(),
    status: text('status', { enum: ['active', 'inactive', 'archived'] }).notNull().default('active'),
    birthDate: date('birth_date'),
    genderCode: text('gender_code'),
    preferredLang: text('preferred_lang').default('fr'),
    intakeDate: date('intake_date').notNull().defaultNow(),
    customFields: jsonb('custom_fields'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    partyFk: foreignKey({
      columns: [table.tenantId, table.partyId],
      foreignColumns: [party.tenantId, party.id],
    }).onDelete('cascade'),
    tenantIdIdUk: unique().on(table.tenantId, table.id),
  })
);

// Module PEO: Staff & Personnel Profile (PEO-10)
export const staffProfile = pgTable(
  'staff_profile',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    partyId: uuid('party_id').notNull(),
    userId: uuid('user_id'),
    jobTitle: text('job_title').notNull(),
    departmentId: uuid('department_id'),
    employmentType: text('employment_type', {
      enum: ['employee', 'volunteer', 'board_member', 'contractor', 'intern'],
    }).notNull().default('employee'),
    status: text('status', {
      enum: ['active', 'on_leave', 'inactive', 'archived'],
    }).notNull().default('active'),
    hireDate: date('hire_date'),
    emergencyContact: text('emergency_contact'),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    partyFk: foreignKey({
      columns: [table.tenantId, table.partyId],
      foreignColumns: [party.tenantId, party.id],
    }).onDelete('cascade'),
    departmentFk: foreignKey({
      columns: [table.tenantId, table.departmentId],
      foreignColumns: [orgUnit.tenantId, orgUnit.id],
    }).onDelete('set null'),
    tenantIdIdUk: unique().on(table.tenantId, table.id),
    tenantPartyUk: unique().on(table.tenantId, table.partyId),
  })
);

// Module PEO: Household (PEO-02)
export const household = pgTable(
  'household',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    name: text('name').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    tenantIdIdUk: unique().on(table.tenantId, table.id),
  })
);

export const householdMember = pgTable(
  'household_member',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    householdId: uuid('household_id').notNull(),
    partyId: uuid('party_id').notNull(),
    roleInHousehold: text('role_in_household'),
  },
  (table) => ({
    householdFk: foreignKey({
      columns: [table.tenantId, table.householdId],
      foreignColumns: [household.tenantId, household.id],
    }).onDelete('cascade'),
    partyFk: foreignKey({
      columns: [table.tenantId, table.partyId],
      foreignColumns: [party.tenantId, party.id],
    }).onDelete('cascade'),
    tenantIdIdUk: unique().on(table.tenantId, table.id),
  })
);

// Module CMP: Loi 25 Consent Management (CMP-05)
export const consentPurpose = pgTable(
  'consent_purpose',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    code: text('code').notNull(),
    title: text('title').notNull(),
    version: text('version').notNull().default('1.0'),
    description: text('description'),
    isMandatory: boolean('is_mandatory').notNull().default(false),
  },
  (table) => ({
    tenantIdIdUk: unique().on(table.tenantId, table.id),
    tenantIdCodeUk: unique().on(table.tenantId, table.code),
  })
);

export const consentRecord = pgTable(
  'consent_record',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    partyId: uuid('party_id').notNull(),
    purposeCode: text('purpose_code').notNull(),
    status: text('status', { enum: ['granted', 'refused', 'withdrawn'] }).notNull(),
    grantedAt: timestamp('granted_at', { withTimezone: true }).notNull().defaultNow(),
    withdrawnAt: timestamp('withdrawn_at', { withTimezone: true }),
    version: text('version').notNull().default('1.0'),
  },
  (table) => ({
    partyFk: foreignKey({
      columns: [table.tenantId, table.partyId],
      foreignColumns: [party.tenantId, party.id],
    }).onDelete('cascade'),
    tenantIdIdUk: unique().on(table.tenantId, table.id),
  })
);

// Module PEO: Service Delivery (PEO-04)
export const serviceDelivery = pgTable(
  'service_delivery',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    partyId: uuid('party_id').notNull(),
    deliveredByUserId: uuid('delivered_by_user_id').notNull().references(() => userAccount.id),
    serviceType: text('service_type').notNull(),
    deliveredAt: timestamp('delivered_at', { withTimezone: true }).notNull().defaultNow(),
    notes: text('notes'),
  },
  (table) => ({
    partyFk: foreignKey({
      columns: [table.tenantId, table.partyId],
      foreignColumns: [party.tenantId, party.id],
    }).onDelete('cascade'),
    tenantIdIdUk: unique().on(table.tenantId, table.id),
  })
);

// Module FOR: Training Program (FOR-00)
export const trainingProgram = pgTable(
  'training_program',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    code: text('code').notNull(),
    title: text('title').notNull(),
    objectives: text('objectives'),
    prerequisites: text('prerequisites'),
    targetAudience: text('target_audience'),
    totalHours: integer('total_hours').notNull().default(0),
    status: text('status', { enum: ['draft', 'published', 'archived'] })
      .notNull()
      .default('published'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    tenantIdIdUk: unique().on(table.tenantId, table.id),
    tenantIdCodeUk: unique().on(table.tenantId, table.code),
  })
);

// Module FOR: Course Catalogue (FOR-01 - Autonome)
export const course = pgTable(
  'course',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    code: text('code').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    objectives: text('objectives'),
    durationHours: integer('duration_hours').notNull().default(1),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    tenantIdIdUk: unique().on(table.tenantId, table.id),
    tenantIdCodeUk: unique().on(table.tenantId, table.code),
  })
);

// Module FOR: Many-to-Many Training Program <-> Course (FOR-01B)
export const trainingProgramCourse = pgTable(
  'training_program_course',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    trainingProgramId: uuid('training_program_id').notNull(),
    courseId: uuid('course_id').notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
  },
  (table) => ({
    programFk: foreignKey({
      columns: [table.tenantId, table.trainingProgramId],
      foreignColumns: [trainingProgram.tenantId, trainingProgram.id],
    }).onDelete('cascade'),
    courseFk: foreignKey({
      columns: [table.tenantId, table.courseId],
      foreignColumns: [course.tenantId, course.id],
    }).onDelete('cascade'),
    tenantProgramCourseUk: unique().on(table.tenantId, table.trainingProgramId, table.courseId),
    tenantIdIdUk: unique().on(table.tenantId, table.id),
  })
);

// Module FOR: Training Sessions (FOR-02 - Planifiée pour un Programme avec Période)
export const trainingSession = pgTable(
  'training_session',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    trainingProgramId: uuid('training_program_id'),
    courseId: uuid('course_id'), // Optionnel si session par cours unique
    projectId: uuid('project_id'),
    title: text('title').notNull(),
    startDate: date('start_date'),
    endDate: date('end_date'),
    capacity: integer('capacity').notNull().default(20),
    status: text('status', {
      enum: ['planned', 'open', 'in_progress', 'completed', 'cancelled'],
    })
      .notNull()
      .default('planned'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    programFk: foreignKey({
      columns: [table.tenantId, table.trainingProgramId],
      foreignColumns: [trainingProgram.tenantId, trainingProgram.id],
    }).onDelete('set null'),
    courseFk: foreignKey({
      columns: [table.tenantId, table.courseId],
      foreignColumns: [course.tenantId, course.id],
    }).onDelete('cascade'),
    tenantIdIdUk: unique().on(table.tenantId, table.id),
  })
);

// Module FOR: Session Occurrences (FOR-02, FOR-03)
export const sessionOccurrence = pgTable(
  'session_occurrence',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    sessionId: uuid('session_id').notNull(),
    trainerPartyId: uuid('trainer_party_id'),
    startTime: timestamp('start_time', { withTimezone: true }).notNull(),
    endTime: timestamp('end_time', { withTimezone: true }).notNull(),
    location: text('location'),
  },
  (table) => ({
    sessionFk: foreignKey({
      columns: [table.tenantId, table.sessionId],
      foreignColumns: [trainingSession.tenantId, trainingSession.id],
    }).onDelete('cascade'),
    tenantIdIdUk: unique().on(table.tenantId, table.id),
  })
);

// Module FOR: Enrollments (FOR-04)
export const enrollment = pgTable(
  'enrollment',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    sessionId: uuid('session_id').notNull(),
    partyId: uuid('party_id').notNull(),
    status: text('status', {
      enum: ['pending', 'confirmed', 'waitlist', 'completed', 'dropped'],
    })
      .notNull()
      .default('pending'),
    source: text('source', { enum: ['agent', 'public_form', 'csv_import'] })
      .notNull()
      .default('agent'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    sessionFk: foreignKey({
      columns: [table.tenantId, table.sessionId],
      foreignColumns: [trainingSession.tenantId, trainingSession.id],
    }).onDelete('cascade'),
    partyFk: foreignKey({
      columns: [table.tenantId, table.partyId],
      foreignColumns: [party.tenantId, party.id],
    }).onDelete('cascade'),
    tenantIdIdUk: unique().on(table.tenantId, table.id),
    sessionPartyUk: unique().on(table.tenantId, table.sessionId, table.partyId),
  })
);

// Module FOR: Attendance (FOR-06)
export const attendance = pgTable(
  'attendance',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    occurrenceId: uuid('occurrence_id').notNull(),
    enrollmentId: uuid('enrollment_id').notNull(),
    status: text('status', { enum: ['present', 'absent', 'late', 'excused'] })
      .notNull()
      .default('present'),
    notes: text('notes'),
  },
  (table) => ({
    occurrenceFk: foreignKey({
      columns: [table.tenantId, table.occurrenceId],
      foreignColumns: [sessionOccurrence.tenantId, sessionOccurrence.id],
    }).onDelete('cascade'),
    enrollmentFk: foreignKey({
      columns: [table.tenantId, table.enrollmentId],
      foreignColumns: [enrollment.tenantId, enrollment.id],
    }).onDelete('cascade'),
    tenantIdIdUk: unique().on(table.tenantId, table.id),
    occEnrollUk: unique().on(table.tenantId, table.occurrenceId, table.enrollmentId),
  })
);

// Module FOR: Certificate (FOR-09)
export const certificate = pgTable(
  'certificate',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    enrollmentId: uuid('enrollment_id').notNull(),
    certNumber: text('cert_number').notNull().unique(),
    issuedAt: timestamp('issued_at', { withTimezone: true }).notNull().defaultNow(),
    status: text('status', { enum: ['valid', 'revoked'] }).notNull().default('valid'),
  },
  (table) => ({
    enrollmentFk: foreignKey({
      columns: [table.tenantId, table.enrollmentId],
      foreignColumns: [enrollment.tenantId, enrollment.id],
    }).onDelete('cascade'),
    tenantIdIdUk: unique().on(table.tenantId, table.id),
  })
);

// Module PRJ: Program (PRJ-00)
export const program = pgTable(
  'program',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenantRegistry.id, { onDelete: 'cascade' }),
    code: text('code').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    status: text('status', {
      enum: ['planned', 'active', 'suspended', 'closed'],
    })
      .notNull()
      .default('active'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    tenantIdIdUk: unique().on(table.tenantId, table.id),
    tenantIdCodeUk: unique().on(table.tenantId, table.code),
  })
);

// Module PRJ: Program <-> Project Link (PRJ-00B - 1 Projet appartient à 0 ou 1 Programme)
export const programProject = pgTable(
  'program_project',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    programId: uuid('program_id').notNull(),
    projectId: uuid('project_id').notNull(),
  },
  (table) => ({
    programFk: foreignKey({
      columns: [table.tenantId, table.programId],
      foreignColumns: [program.tenantId, program.id],
    }).onDelete('cascade'),
    projectFk: foreignKey({
      columns: [table.tenantId, table.projectId],
      foreignColumns: [project.tenantId, project.id],
    }).onDelete('cascade'),
    tenantProjectUk: unique().on(table.tenantId, table.projectId),
    tenantIdIdUk: unique().on(table.tenantId, table.id),
  })
);

// Module PRJ: Project
export const project = pgTable(
  'project',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenantRegistry.id, { onDelete: 'cascade' }),
    programId: uuid('program_id'),
    code: text('code').notNull(),
    name: text('name').notNull(),
    status: text('status', {
      enum: ['planned', 'active', 'suspended', 'closed', 'cancelled'],
    })
      .notNull()
      .default('planned'),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => userAccount.id),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => ({
    programFk: foreignKey({
      columns: [table.tenantId, table.programId],
      foreignColumns: [program.tenantId, program.id],
    }).onDelete('set null'),
    tenantIdIdUk: unique().on(table.tenantId, table.id),
    tenantIdCodeUk: unique().on(table.tenantId, table.code),
  })
);

// Module PRJ: Funding Sources (PRJ-21)
export const fundingSource = pgTable(
  'funding_source',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    projectId: uuid('project_id').notNull(),
    donorName: text('donor_name').notNull(),
    fundingType: text('funding_type', {
      enum: ['grant', 'restricted_donation', 'unrestricted', 'other'],
    }).notNull(),
    amount: numeric('amount', { precision: 19, scale: 4 }).notNull(),
    currency: text('currency').notNull().default('CAD'),
    reportDueAt: date('report_due_at'),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    projectFk: foreignKey({
      columns: [table.tenantId, table.projectId],
      foreignColumns: [project.tenantId, project.id],
    }).onDelete('cascade'),
    tenantIdIdUk: unique().on(table.tenantId, table.id),
  })
);

// Module PRJ: Result Nodes / Cadre Logique (PRJ-04)
export const resultNode = pgTable(
  'result_node',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    projectId: uuid('project_id').notNull(),
    parentId: uuid('parent_id'),
    level: text('level', { enum: ['impact', 'outcome', 'output'] }).notNull(),
    title: text('title').notNull(),
    description: text('description'),
  },
  (table) => ({
    projectFk: foreignKey({
      columns: [table.tenantId, table.projectId],
      foreignColumns: [project.tenantId, project.id],
    }).onDelete('cascade'),
    parentFk: foreignKey({
      columns: [table.tenantId, table.parentId],
      foreignColumns: [table.tenantId, table.id],
    }),
    tenantIdIdUk: unique().on(table.tenantId, table.id),
  })
);

// Module PRJ: Plan Items / WBS Tasks (PRJ-05)
export const planItem = pgTable(
  'plan_item',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    projectId: uuid('project_id').notNull(),
    parentId: uuid('parent_id'),
    resultNodeId: uuid('result_node_id'),
    type: text('type', {
      enum: ['phase', 'activity', 'task', 'milestone', 'deliverable'],
    }).notNull(),
    wbs: text('wbs').notNull(),
    title: text('title').notNull(),
    startDate: date('start_date'),
    endDate: date('end_date'),
    durationDays: integer('duration_days').default(1),
    progressPct: integer('progress_pct').notNull().default(0),
    status: text('status', {
      enum: ['todo', 'in_progress', 'blocked', 'completed', 'cancelled'],
    })
      .notNull()
      .default('todo'),
    assigneePartyId: uuid('assignee_party_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    projectFk: foreignKey({
      columns: [table.tenantId, table.projectId],
      foreignColumns: [project.tenantId, project.id],
    }).onDelete('cascade'),
    tenantIdIdUk: unique().on(table.tenantId, table.id),
  })
);

// Module PRJ: Plan Dependencies (PRJ-06)
export const planDependency = pgTable(
  'plan_dependency',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    predecessorId: uuid('predecessor_id').notNull(),
    successorId: uuid('successor_id').notNull(),
    type: text('type', { enum: ['FS', 'SS', 'FF', 'SF'] }).notNull().default('FS'),
    lagDays: integer('lag_days').notNull().default(0),
  },
  (table) => ({
    predFk: foreignKey({
      columns: [table.tenantId, table.predecessorId],
      foreignColumns: [planItem.tenantId, planItem.id],
    }).onDelete('cascade'),
    succFk: foreignKey({
      columns: [table.tenantId, table.successorId],
      foreignColumns: [planItem.tenantId, planItem.id],
    }).onDelete('cascade'),
    tenantIdIdUk: unique().on(table.tenantId, table.id),
  })
);

// Module PRJ: Project Members & Stakeholders (PRJ-30)
export const projectMember = pgTable(
  'project_member',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    projectId: uuid('project_id').notNull(),
    userId: uuid('user_id'),
    partyId: uuid('party_id'),
    name: text('name').notNull(),
    email: text('email'),
    role: text('role', {
      enum: ['manager', 'coordinator', 'contributor', 'stakeholder', 'expert', 'beneficiary_rep'],
    }).notNull().default('contributor'),
    raciRole: text('raci_role', { enum: ['R', 'A', 'C', 'I'] }).notNull().default('R'),
    allocationPct: integer('allocation_pct').notNull().default(100),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    projectFk: foreignKey({
      columns: [table.tenantId, table.projectId],
      foreignColumns: [project.tenantId, project.id],
    }).onDelete('cascade'),
    tenantIdIdUk: unique().on(table.tenantId, table.id),
  })
);

// Module PRJ: Plan Item RACI Matrix (PRJ-33)
export const planItemRaci = pgTable(
  'plan_item_raci',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    projectId: uuid('project_id').notNull(),
    planItemId: uuid('plan_item_id').notNull(),
    projectMemberId: uuid('project_member_id').notNull(),
    raciRole: text('raci_role', { enum: ['R', 'A', 'C', 'I'] }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    projectFk: foreignKey({
      columns: [table.tenantId, table.projectId],
      foreignColumns: [project.tenantId, project.id],
    }).onDelete('cascade'),
    planItemFk: foreignKey({
      columns: [table.tenantId, table.planItemId],
      foreignColumns: [planItem.tenantId, planItem.id],
    }).onDelete('cascade'),
    memberFk: foreignKey({
      columns: [table.tenantId, table.projectMemberId],
      foreignColumns: [projectMember.tenantId, projectMember.id],
    }).onDelete('cascade'),
    itemMemberUk: unique().on(table.tenantId, table.planItemId, table.projectMemberId),
    tenantIdIdUk: unique().on(table.tenantId, table.id),
  })
);

// Module PRJ: Task Evolution & Progress Log (PRJ-31)
export const planItemUpdate = pgTable(
  'plan_item_update',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    planItemId: uuid('plan_item_id').notNull(),
    authorName: text('author_name').notNull(),
    authorUserId: uuid('author_user_id'),
    progressPct: integer('progress_pct'),
    status: text('status', {
      enum: ['todo', 'in_progress', 'blocked', 'completed', 'cancelled'],
    }),
    comment: text('comment').notNull(),
    blockerReason: text('blocker_reason'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    planItemFk: foreignKey({
      columns: [table.tenantId, table.planItemId],
      foreignColumns: [planItem.tenantId, planItem.id],
    }).onDelete('cascade'),
    tenantIdIdUk: unique().on(table.tenantId, table.id),
  })
);

// Module PRJ: Task Deliverables & Validation (PRJ-32)
export const planItemDeliverable = pgTable(
  'plan_item_deliverable',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    planItemId: uuid('plan_item_id').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    fileUrl: text('file_url'),
    status: text('status', { enum: ['pending', 'approved', 'rejected'] }).notNull().default('pending'),
    verifiedBy: text('verified_by'),
    verifiedAt: timestamp('verified_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    planItemFk: foreignKey({
      columns: [table.tenantId, table.planItemId],
      foreignColumns: [planItem.tenantId, planItem.id],
    }).onDelete('cascade'),
    tenantIdIdUk: unique().on(table.tenantId, table.id),
  })
);

// Module FIN-LITE: Budget (FIN-01)
export const budget = pgTable(
  'budget',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    projectId: uuid('project_id').notNull(),
    currency: text('currency').notNull().default('CAD'),
    status: text('status', { enum: ['draft', 'submitted', 'approved', 'revised'] })
      .notNull()
      .default('draft'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    projectFk: foreignKey({
      columns: [table.tenantId, table.projectId],
      foreignColumns: [project.tenantId, project.id],
    }).onDelete('cascade'),
    tenantIdIdUk: unique().on(table.tenantId, table.id),
  })
);

export const budgetLine = pgTable(
  'budget_line',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    budgetId: uuid('budget_id').notNull(),
    categoryCode: text('category_code', {
      enum: [
        'personnel',
        'material',
        'transport',
        'premises',
        'communication',
        'training',
        'subcontracting',
        'administrative',
        'direct_aid',
      ],
    }).notNull(),
    description: text('description').notNull(),
    amount: numeric('amount', { precision: 19, scale: 4 }).notNull(),
  },
  (table) => ({
    budgetFk: foreignKey({
      columns: [table.tenantId, table.budgetId],
      foreignColumns: [budget.tenantId, budget.id],
    }).onDelete('cascade'),
    tenantIdIdUk: unique().on(table.tenantId, table.id),
  })
);

// Module FIN-LITE: Expenses (FIN-03 / FIN-04)
export const expense = pgTable(
  'expense',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    projectId: uuid('project_id').notNull(),
    budgetLineId: uuid('budget_line_id').notNull(),
    date: date('date').notNull(),
    vendor: text('vendor').notNull(),
    amount: numeric('amount', { precision: 19, scale: 4 }).notNull(),
    currency: text('currency').notNull().default('CAD'),
    taxTps: numeric('tax_tps', { precision: 19, scale: 4 }).default('0'),
    taxTvq: numeric('tax_tvq', { precision: 19, scale: 4 }).default('0'),
    status: text('status', {
      enum: ['draft', 'submitted', 'approved', 'paid', 'rejected'],
    })
      .notNull()
      .default('draft'),
    submittedBy: uuid('submitted_by').notNull().references(() => userAccount.id),
    approvedBy: uuid('approved_by').references(() => userAccount.id),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    projectFk: foreignKey({
      columns: [table.tenantId, table.projectId],
      foreignColumns: [project.tenantId, project.id],
    }).onDelete('cascade'),
    budgetLineFk: foreignKey({
      columns: [table.tenantId, table.budgetLineId],
      foreignColumns: [budgetLine.tenantId, budgetLine.id],
    }),
    tenantIdIdUk: unique().on(table.tenantId, table.id),
  })
);

// Module PRJ: RAID Items (PRJ-11)
export const raidItem = pgTable(
  'raid_item',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    projectId: uuid('project_id').notNull(),
    type: text('type', { enum: ['risk', 'issue', 'assumption', 'dependency'] }).notNull(),
    title: text('title').notNull(),
    description: text('description'),
    probability: integer('probability'),
    impact: integer('impact'),
    status: text('status', { enum: ['open', 'mitigated', 'closed'] })
      .notNull()
      .default('open'),
    ownerName: text('owner_name'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    projectFk: foreignKey({
      columns: [table.tenantId, table.projectId],
      foreignColumns: [project.tenantId, project.id],
    }).onDelete('cascade'),
    tenantIdIdUk: unique().on(table.tenantId, table.id),
  })
);

// Module CAS: Case File (CAS-01)
export const caseFile = pgTable(
  'case_file',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    partyId: uuid('party_id').notNull(),
    caseNumber: text('case_number').notNull(),
    title: text('title').notNull(),
    status: text('status', { enum: ['open', 'active', 'under_review', 'closed'] })
      .notNull()
      .default('open'),
    confidentialityLevel: text('confidentiality_level', {
      enum: ['standard', 'restricted', 'highly_confidential'],
    })
      .notNull()
      .default('restricted'),
    primaryWorkerUserId: uuid('primary_worker_user_id')
      .notNull()
      .references(() => userAccount.id),
    openedAt: timestamp('opened_at', { withTimezone: true }).notNull().defaultNow(),
    closedAt: timestamp('closed_at', { withTimezone: true }),
  },
  (table) => ({
    partyFk: foreignKey({
      columns: [table.tenantId, table.partyId],
      foreignColumns: [party.tenantId, party.id],
    }).onDelete('cascade'),
    tenantIdIdUk: unique().on(table.tenantId, table.id),
    tenantIdCaseNumUk: unique().on(table.tenantId, table.caseNumber),
  })
);

// Module CAS: Case Assignment (CAS-02)
export const caseAssignment = pgTable(
  'case_assignment',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    caseFileId: uuid('case_file_id').notNull(),
    userId: uuid('user_id').notNull().references(() => userAccount.id),
    role: text('role', { enum: ['primary_worker', 'co_worker', 'supervisor'] })
      .notNull()
      .default('co_worker'),
  },
  (table) => ({
    caseFk: foreignKey({
      columns: [table.tenantId, table.caseFileId],
      foreignColumns: [caseFile.tenantId, caseFile.id],
    }).onDelete('cascade'),
    tenantIdIdUk: unique().on(table.tenantId, table.id),
  })
);

// Module CAS: Case Note (CAS-05)
export const caseNote = pgTable(
  'case_note',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    caseFileId: uuid('case_file_id').notNull(),
    authorUserId: uuid('author_user_id')
      .notNull()
      .references(() => userAccount.id),
    noteType: text('note_type', { enum: ['meeting', 'phone_call', 'home_visit', 'assessment', 'other'] })
      .notNull()
      .default('meeting'),
    content: text('content').notNull(),
    parentNoteId: uuid('parent_note_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    caseFk: foreignKey({
      columns: [table.tenantId, table.caseFileId],
      foreignColumns: [caseFile.tenantId, caseFile.id],
    }).onDelete('cascade'),
    tenantIdIdUk: unique().on(table.tenantId, table.id),
  })
);

// Module CAS: Break-the-Glass Log (CAS-08)
export const breakGlassLog = pgTable(
  'break_glass_log',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    caseFileId: uuid('case_file_id').notNull(),
    userId: uuid('user_id').notNull().references(() => userAccount.id),
    reason: text('reason').notNull(),
    accessedAt: timestamp('accessed_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    caseFk: foreignKey({
      columns: [table.tenantId, table.caseFileId],
      foreignColumns: [caseFile.tenantId, caseFile.id],
    }).onDelete('cascade'),
    tenantIdIdUk: unique().on(table.tenantId, table.id),
  })
);

// Module CAS: Intervention Plan (CAS-03)
export const interventionPlan = pgTable(
  'intervention_plan',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    caseFileId: uuid('case_file_id').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    status: text('status', { enum: ['draft', 'active', 'completed', 'archived'] })
      .notNull()
      .default('active'),
    startDate: date('start_date'),
    reviewDate: date('review_date'),
    createdByUserId: uuid('created_by_user_id')
      .notNull()
      .references(() => userAccount.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    caseFk: foreignKey({
      columns: [table.tenantId, table.caseFileId],
      foreignColumns: [caseFile.tenantId, caseFile.id],
    }).onDelete('cascade'),
    tenantIdIdUk: unique().on(table.tenantId, table.id),
  })
);

// Module CAS: Intervention Goal / Action Steps (CAS-03B)
export const interventionGoal = pgTable(
  'intervention_goal',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    planId: uuid('plan_id').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    targetDate: date('target_date'),
    status: text('status', { enum: ['not_started', 'in_progress', 'achieved', 'abandoned'] })
      .notNull()
      .default('in_progress'),
    achievedAt: timestamp('achieved_at', { withTimezone: true }),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    planFk: foreignKey({
      columns: [table.tenantId, table.planId],
      foreignColumns: [interventionPlan.tenantId, interventionPlan.id],
    }).onDelete('cascade'),
    tenantIdIdUk: unique().on(table.tenantId, table.id),
  })
);

// Module CAS: External Referrals / Aiguillage (CAS-06)
export const caseReferral = pgTable(
  'case_referral',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    caseFileId: uuid('case_file_id').notNull(),
    organizationName: text('organization_name').notNull(),
    serviceType: text('service_type').notNull(),
    contactPerson: text('contact_person'),
    contactPhone: text('contact_phone'),
    contactEmail: text('contact_email'),
    reason: text('reason').notNull(),
    status: text('status', { enum: ['pending', 'accepted', 'rejected', 'completed'] })
      .notNull()
      .default('pending'),
    referredAt: timestamp('referred_at', { withTimezone: true }).notNull().defaultNow(),
    outcomeNotes: text('outcome_notes'),
  },
  (table) => ({
    caseFk: foreignKey({
      columns: [table.tenantId, table.caseFileId],
      foreignColumns: [caseFile.tenantId, caseFile.id],
    }).onDelete('cascade'),
    tenantIdIdUk: unique().on(table.tenantId, table.id),
  })
);

// Module IND: Indicator Definition (IND-01)
export const indicator = pgTable(
  'indicator',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    projectId: uuid('project_id'),
    resultNodeId: uuid('result_node_id'),
    code: text('code').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    level: text('level', { enum: ['impact', 'outcome', 'output', 'activity'] }).notNull(),
    unit: text('unit').notNull().default('count'),
    baselineValue: numeric('baseline_value', { precision: 19, scale: 4 }).notNull().default('0'),
    targetValue: numeric('target_value', { precision: 19, scale: 4 }).notNull(),
    actualValue: numeric('actual_value', { precision: 19, scale: 4 }).notNull().default('0'),
    frequency: text('frequency', { enum: ['monthly', 'quarterly', 'annual', 'total'] })
      .notNull()
      .default('quarterly'),
    meansOfVerification: text('means_of_verification'),
    disaggregationDimensions: jsonb('disaggregation_dimensions').$type<string[]>(),
    status: text('status', { enum: ['active', 'archived', 'achieved'] }).notNull().default('active'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    tenantIdIdUk: unique().on(table.tenantId, table.id),
    tenantIdCodeUk: unique().on(table.tenantId, table.code),
  })
);

// Module IND: Indicator Observation (IND-03)
export const indicatorObservation = pgTable(
  'indicator_observation',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    indicatorId: uuid('indicator_id').notNull(),
    periodLabel: text('period_label').notNull(),
    recordedValue: numeric('recorded_value', { precision: 19, scale: 4 }).notNull(),
    disaggregationData: jsonb('disaggregation_data').$type<{
      gender?: Record<string, number>;
      ageGroup?: Record<string, number>;
      immigrationStatus?: Record<string, number>;
      region?: Record<string, number>;
      custom?: Record<string, number>;
    }>(),
    notes: text('notes'),
    sourceFileUrl: text('source_file_url'),
    recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    indicatorFk: foreignKey({
      columns: [table.tenantId, table.indicatorId],
      foreignColumns: [indicator.tenantId, indicator.id],
    }).onDelete('cascade'),
    tenantIdIdUk: unique().on(table.tenantId, table.id),
  })
);
