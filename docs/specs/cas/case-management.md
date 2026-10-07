# Spécification Fonctionnelle et Technique — Suivi de Cas (CAS)

**Module** : `CAS` — Suivi de cas, dossiers confidentiels & bris de glace  
**Jalon** : `M3-T1`  
**Statut** : Proposé (en attente de validation)  

---

## 1. User Stories & Exigences Métier

### User Story 1 : Ouverture et gestion d'équipe de dossier (`CAS-01`, `CAS-02`)
En tant qu'**intervenant social**,  
Je veux ouvrir un dossier de cas pour un bénéficiaire ou un ménage et définir l'équipe d'intervenants autorisés,  
Afin d'assurer la confidentialité et la continuité de l'accompagnement.

### User Story 2 : Notes de suivi et verrouillage d'addenda (`CAS-05`)
En tant qu'**intervenant social**,  
Je veux consigner des notes de suivi (rencontres, appels, interventions),  
Afin de garder une trace horodatée de l'accompagnement, tout en sachant que les notes sont verrouillées après 7 jours et ne peuvent être modifiées que par addenda.

### User Story 3 : Accès exceptionnel « Bris de glace » (`CAS-08`, `CAS-09`)
En tant qu'**intervenant d'urgence** non membre de l'équipe du dossier,  
Je veux pouvoir effectuer un « bris de glace » avec motif obligatoire en cas de crise,  
Afin d'accéder temporairement au dossier, tout en déclenchant un audit et une alerte automatique au responsable de la vie privée.

---

## 2. Critères d'Acceptation

1. **Isolation & Confidentialité (`CAS-02`)** :
   - Un dossier marqué confidentiel n'est accessible en lecture/écriture qu'aux membres désignés dans `case_assignment` ou au superviseur.
   - Les administrateurs globaux du tenant ne peuvent pas lire le contenu des notes de cas (seules les métadonnées sont visibles).

2. **Immuabilité & Verrouillage après 7 jours (`CAS-05`)** :
   - Toute note créée peut être modifiée librement pendant 7 jours.
   - Passé le délai de 7 jours, la note devient strictement immuable (`isLocked = true`). Les modifications ultérieures doivent être ajoutées sous forme d'addenda relié à la note initiale.

3. **Procédure de Bris de Glace (`CAS-08`, `CAS-09`)** :
   - Un utilisateur non assigné tentant de consulter un dossier restreint se voit refuser l'accès immédiat et proposer le bouton « Bris de glace ».
   - La soumission du bris de glace exige un motif d'au moins 10 caractères et enregistre une entrée dans `break_glass_access_log`.
   - Une notification d'audit est transmise aux superviseurs et une entrée non modifiable est inscrite dans le journal d'audit (`CORE-19`).

---

## 3. Modèle de Données (PostgreSQL / Drizzle ORM)

```typescript
// Module CAS: Case File
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
    tenantIdIdUk: unique().on(table.tenantId, table.id),
    tenantIdCaseNumUk: unique().on(table.tenantId, table.caseNumber),
  })
);

// Module CAS: Case Assignment
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

// Module CAS: Case Notes
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
    parentNoteId: uuid('parent_note_id'), // pour les addendas
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

// Module CAS: Break-the-Glass Log
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
```

---

## 4. Contrat d'API (Zod & Endpoints NestJS)

### Schemas Zod
```typescript
export const CreateCaseSchema = z.object({
  partyId: z.string().uuid(),
  title: z.string().min(3),
  confidentialityLevel: z.enum(['standard', 'restricted', 'highly_confidential']).default('restricted'),
});

export const CreateCaseNoteSchema = z.object({
  noteType: z.enum(['meeting', 'phone_call', 'home_visit', 'assessment', 'other']).default('meeting'),
  content: z.string().min(5),
  parentNoteId: z.string().uuid().optional(),
});

export const BreakGlassSchema = z.object({
  reason: z.string().min(10, 'Le motif de bris de glace doit comporter au moins 10 caractères'),
});
```

### Endpoints
- `POST /api/v1/cases` : Créer un dossier de cas.
- `GET /api/v1/cases` : Lister les dossiers accessibles par l'utilisateur.
- `GET /api/v1/cases/:id` : Récupérer le dossier (vérification d'assignation ou bris de glace).
- `POST /api/v1/cases/:id/notes` : Ajouter une note ou un addenda.
- `POST /api/v1/cases/:id/break-glass` : Déclencher un accès exceptionnel motivé.

---

## 5. Écrans Concernés (`apps/web`)

1. **`CaseListScreen.tsx`** (`/cases`) :
   - Liste filtrable des dossiers de cas avec indicateurs de confidentialité.
2. **`CaseDetailScreen.tsx`** (`/cases/:id`) :
   - Vue restreinte/complète avec onglets Notes de suivi, Équipe de dossier, et bouton "Bris de glace" en cas d'accès bloqué.

---

## 6. Tests Attendus

1. **Test TDD d'immuabilité des notes (`isNoteEditable`)** :
   - Une note créée depuis < 7 jours est modifiable.
   - Une note créée depuis > 7 jours renvoie `false` pour l'édition et exige un addenda.
2. **Test TDD d'accès restreint & Bris de glace (`canUserAccessCase`)** :
   - Un membre de l'équipe a un accès direct.
   - Un utilisateur non assigné n'a pas d'accès sauf s'il existe une entrée valide dans `break_glass_log`.
