# Spécification Fonctionnelle et Technique — Indicateurs & Rapports (IND)

**Module** : `IND` — Indicateurs de performance, mesure d'impact & tableaux de bord  
**Jalon** : `M3-T2`  
**Statut** : Proposé (en attente de validation)  

---

## 1. User Stories & Exigences Métier

### User Story 1 : Définition d'indicateurs et rattachement (`IND-01`, `IND-02`)
En tant que **responsable de programme ou chef de projet**,  
Je veux définir des indicateurs d'impact, d'effet et de produit avec des valeurs de référence, cibles et périodes,  
Afin de les rattacher aux nœuds du cadre logique des projets.

### User Story 2 : Saisie des cibles et valeurs observées (`IND-03`, `IND-05`)
En tant que **chargé de suivi et évaluation (M&E)**,  
Je veux enregistrer les valeurs observées (manuellement ou calculées à partir des personnes atteintes sans doublons),  
Afin de mesurer le taux de réalisation réel par rapport à la cible.

### User Story 3 : Tableaux de bord & rapports consolidés (`IND-07`, `IND-08`)
En tant que **directeur ou bailleur de fonds**,  
Je veux consulter un tableau de bord consolidé synthétisant les indicateurs clés et exporter des rapports PDF/Excel,  
Afin d'évaluer l'impact global de l'organisation sans divulguer d'informations nominatives.

---

## 2. Critères d'Acceptation

1. **Calcul des personnes atteintes sans doublon (`IND-05`)** :
   - Le système doit agréger le nombre de personnes uniques (`party_id`) ayant bénéficié d'au moins un service rendu (`service_delivery`), d'une formation (`enrollment`) ou d'un suivi de cas (`case_file`) sur une période donnée pour éviter le double comptage.

2. **Suivi Cible vs Réel (`IND-01`, `IND-03`)** :
   - Chaque indicateur possède une valeur de référence (`baselineValue`), une cible (`targetValue`) et une valeur observée actuelle (`actualValue`).
   - Le taux de réalisation est calculé : `(actualValue / targetValue) * 100`.

3. **Confidentialité dans les Rapports (`IND-10`)** :
   - Les rapports et agrégations respectent le seuil minimal d'effectif ($\ge 5$) pour masquer les petites cohortes si configuré.

---

## 3. Modèle de Données (PostgreSQL / Drizzle ORM)

```typescript
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
    level: text('level', { enum: ['impact', 'outcome', 'output', 'activity'] }).notNull(),
    unit: text('unit').notNull().default('count'),
    baselineValue: numeric('baseline_value', { precision: 19, scale: 4 }).notNull().default('0'),
    targetValue: numeric('target_value', { precision: 19, scale: 4 }).notNull(),
    actualValue: numeric('actual_value', { precision: 19, scale: 4 }).notNull().default('0'),
    frequency: text('frequency', { enum: ['monthly', 'quarterly', 'annual', 'total'] })
      .notNull()
      .default('quarterly'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    tenantIdIdUk: unique().on(table.tenantId, table.id),
  })
);

// Module IND: Indicator Value Observation (IND-03)
export const indicatorObservation = pgTable(
  'indicator_observation',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    indicatorId: uuid('indicator_id').notNull(),
    periodLabel: text('period_label').notNull(), // ex: "2026-Q1"
    recordedValue: numeric('recorded_value', { precision: 19, scale: 4 }).notNull(),
    notes: text('notes'),
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
```

---

## 4. Contrat d'API (Zod & Endpoints NestJS)

### Schemas Zod
```typescript
export const CreateIndicatorSchema = z.object({
  projectId: z.string().uuid().optional(),
  resultNodeId: z.string().uuid().optional(),
  code: z.string().min(2),
  name: z.string().min(2),
  level: z.enum(['impact', 'outcome', 'output', 'activity']).default('output'),
  unit: z.string().default('count'),
  baselineValue: z.number().default(0),
  targetValue: z.number().positive(),
  frequency: z.enum(['monthly', 'quarterly', 'annual', 'total']).default('quarterly'),
});

export const RecordObservationSchema = z.object({
  periodLabel: z.string().min(2),
  recordedValue: z.number(),
  notes: z.string().optional(),
});
```

### Endpoints
- `POST /api/v1/indicators` : Créer un indicateur.
- `GET /api/v1/indicators` : Lister tous les indicateurs.
- `GET /api/v1/indicators/dashboard` : Synthèse globale du tableau de bord d'impact.
- `POST /api/v1/indicators/:id/observations` : Enregistrer une mesure d'observation.
- `GET /api/v1/indicators/unique-reached-count` : Calculer le nombre de personnes uniques atteintes sans doublons (`IND-05`).

---

## 5. Écrans Concernés (`apps/web`)

1. **`IndicatorListScreen.tsx`** (`/indicators`) :
   - Catalogue des indicateurs avec jauges de progression Cible vs Réel.
   - Formulaire de création d'indicateur et de saisie d'observations.
2. **`ImpactDashboardScreen.tsx`** (`/dashboard/impact`) :
   - Tableau de bord consolidé d'impact (KPIs, personnes uniques atteintes, synthèse par projet).

---

## 6. Tests Attendus

1. **Test TDD du calcul d'avancement (`calculateIndicatorProgress`)** :
   - Vérifie le calcul exact du % de réalisation `(actual / target) * 100`.
2. **Test TDD d'unicité des personnes atteintes (`countUniqueReachedParties`)** :
   - Vérifie l'élimination des doublons entre services, formations et cas.
