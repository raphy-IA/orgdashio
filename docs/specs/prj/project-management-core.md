# Spécification Fonctionnelle & Technique — Module PRJ & FIN-LITE (Jalon M1)

**Module** : `PRJ` (Programmes, Projets, Cadre Logique, Planification) & `FIN-LITE` (Budgets & Dépenses)  
**Version** : 1.0  
**Statut** : En attente de validation  
**Exigences liées** : `PRJ-01` à `PRJ-21`, `FIN-01` à `FIN-08`, `CORE-07`, `CORE-19`  

---

## 1. User Stories

1. **US-PRJ-01 (Programmes & Portefeuilles)** : En tant que gestionnaire de programme, je veux regrouper mes projets sous des programmes et portefeuilles hiérarchisés afin d'avoir une vue consolidée de l'avancement et du budget.
2. **US-PRJ-02 (Création guidée & Financement)** : En tant que chef de projet, je veux créer un projet avec son responsable, sa période, et ses sources de financement (bailleur, type, montant, restrictions, date de rapport).
3. **US-PRJ-03 (Cadre Logique)** : En tant que chef de projet, je veux définir l'arbre des résultats du projet (Impact → Effets → Produits → Activités) afin d'aligner la planification sur les objectifs d'impact.
4. **US-PRJ-04 (Planification WBS & Dépendances)** : En tant que membre de l'équipe projet, je veux créer des phases, activités, tâches et jalons avec des dépendances typées (FS, SS, FF, SF) et récalcul automatique des dates.
5. **US-PRJ-05 (Ligne de Base)** : En tant que chef de projet, je veux figer la planification initiale (ligne de base) pour pouvoir mesurer les écarts réels par rapport au plan d'origine.
6. **US-FIN-01 (Budget de projet & Versions)** : En tant que responsable financier / chef de projet, je veux définir un budget par poste (personnel, matériel, transport, etc.) et gérer les révisions budgétaires soumises à approbation.
7. **US-FIN-02 (Cycle des Dépenses)** : En tant que membre d'équipe, je veux saisir une dépense rattachée à une ligne budgétaire et suivre son workflow de validation (saisie → soumise → approuvée → payée).
8. **US-PRJ-06 (Registre RAID & Décisions)** : En tant que chef de projet, je veux consigner les risques, problèmes, hypothèses et dépendances (RAID) avec calcul automatique de la sévérité (Probabilité × Impact).

---

## 2. Critères d'acceptation & Règles de gestion

- **CA-PRJ-01 (Numérotation & Code auto)** : Chaque projet génère un code unique auto-numéroté par tenant (ex. `PRJ-2026-001`).
- **CA-PRJ-02 (Sources de financement `PRJ-21`)** : Un projet peut posséder une ou plusieurs sources de financement. La somme des montants alloués par bailleur ne peut pas dépasser le budget total révisé sans avertissement.
- **CA-PRJ-03 (Dépendances circulaires `PRJ-06`)** : La création ou modification d'une dépendance entre tâches effectue un contrôle de cycle (algorithme de détection de cycle graph). Toute tentative de boucle est rejetée avec un message d'erreur explicite.
- **CA-PRJ-04 (Ligne de base immuable `PRJ-08`)** : Une fois la ligne de base figée, ses dates et coûts ne peuvent plus être modifiés. Toute ré-évaluation crée une nouvelle version historisée.
- **CA-FIN-01 (Séparation des tâches `FIN-04`)** : L'utilisateur qui saisit une dépense ne peut pas l'approuver lui-même.
- **CA-FIN-02 (Dépassement budgétaire `FIN-06`)** : Si une dépense soumise fait dépasser la ligne budgétaire de plus de 10%, une alerte visuelle est affichée et une double approbation (Finance Manager) est requise.
- **CA-FIN-03 (Export comptable CSV `FIN-08`)** : Génération d'un fichier CSV normalisé contenant : date, poste budgétaire, montant, taxes (TPS/TVQ), projet, source de financement et référence.

---

## 3. Modèle de données (Drizzle / PostgreSQL avec RLS)

```sql
-- Program & Portfolio
CREATE TABLE portfolio (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenant_registry(id) ON DELETE CASCADE,
  name        text NOT NULL,
  description text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, id)
);
ALTER TABLE portfolio ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON portfolio USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE TABLE program (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid NOT NULL REFERENCES tenant_registry(id) ON DELETE CASCADE,
  portfolio_id uuid,
  name         text NOT NULL,
  code         text NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, id),
  FOREIGN KEY (tenant_id, portfolio_id) REFERENCES portfolio(tenant_id, id)
);
ALTER TABLE program ENABLE ROW LEVEL SECURITY;
ALTER TABLE program FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON program USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- Project Funding Source (PRJ-21)
CREATE TABLE funding_source (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid NOT NULL REFERENCES tenant_registry(id) ON DELETE CASCADE,
  project_id   uuid NOT NULL,
  donor_name   text NOT NULL,
  funding_type text NOT NULL CHECK (funding_type IN ('grant', 'restricted_donation', 'unrestricted', 'other')),
  amount       numeric(19,4) NOT NULL,
  currency     char(3) NOT NULL DEFAULT 'CAD',
  report_due_at date,
  notes        text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (tenant_id, project_id) REFERENCES project(tenant_id, id) ON DELETE CASCADE
);
ALTER TABLE funding_source ENABLE ROW LEVEL SECURITY;
ALTER TABLE funding_source FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON funding_source USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- Result Node (Cadre Logique PRJ-04)
CREATE TABLE result_node (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenant_registry(id) ON DELETE CASCADE,
  project_id  uuid NOT NULL,
  parent_id   uuid,
  level       text NOT NULL CHECK (level IN ('impact', 'outcome', 'output')),
  title       text NOT NULL,
  description text,
  FOREIGN KEY (tenant_id, project_id) REFERENCES project(tenant_id, id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id, parent_id) REFERENCES result_node(tenant_id, id)
);
ALTER TABLE result_node ENABLE ROW LEVEL SECURITY;
ALTER TABLE result_node FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON result_node USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- Plan Item / Tasks (WBS PRJ-05)
CREATE TABLE plan_item (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         uuid NOT NULL REFERENCES tenant_registry(id) ON DELETE CASCADE,
  project_id        uuid NOT NULL,
  parent_id         uuid,
  result_node_id    uuid,
  type              text NOT NULL CHECK (type IN ('phase', 'activity', 'task', 'milestone', 'deliverable')),
  wbs               text NOT NULL,
  title             text NOT NULL,
  start_date        date,
  end_date          date,
  duration_days     integer DEFAULT 1,
  progress_pct      integer NOT NULL DEFAULT 0 CHECK (progress_pct BETWEEN 0 AND 100),
  status            text NOT NULL CHECK (status IN ('todo', 'in_progress', 'blocked', 'completed', 'cancelled')) DEFAULT 'todo',
  assignee_party_id uuid,
  created_at        timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (tenant_id, project_id) REFERENCES project(tenant_id, id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id, parent_id) REFERENCES plan_item(tenant_id, id),
  FOREIGN KEY (tenant_id, result_node_id) REFERENCES result_node(tenant_id, id)
);
ALTER TABLE plan_item ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_item FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON plan_item USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- Dependencies (PRJ-06)
CREATE TABLE plan_dependency (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL REFERENCES tenant_registry(id) ON DELETE CASCADE,
  predecessor_id uuid NOT NULL,
  successor_id   uuid NOT NULL,
  type           text NOT NULL CHECK (type IN ('FS', 'SS', 'FF', 'SF')) DEFAULT 'FS',
  lag_days       integer NOT NULL DEFAULT 0,
  FOREIGN KEY (tenant_id, predecessor_id) REFERENCES plan_item(tenant_id, id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id, successor_id) REFERENCES plan_item(tenant_id, id) ON DELETE CASCADE
);
ALTER TABLE plan_dependency ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_dependency FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON plan_dependency USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- Budget & Line Items (FIN-01)
CREATE TABLE budget (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenant_registry(id) ON DELETE CASCADE,
  project_id  uuid NOT NULL UNIQUE,
  currency    char(3) NOT NULL DEFAULT 'CAD',
  status      text NOT NULL CHECK (status IN ('draft', 'submitted', 'approved', 'revised')) DEFAULT 'draft',
  created_at  timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (tenant_id, project_id) REFERENCES project(tenant_id, id) ON DELETE CASCADE
);
ALTER TABLE budget ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON budget USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE TABLE budget_line (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL REFERENCES tenant_registry(id) ON DELETE CASCADE,
  budget_id     uuid NOT NULL,
  category_code text NOT NULL CHECK (category_code IN ('personnel', 'material', 'transport', 'premises', 'communication', 'training', 'subcontracting', 'administrative', 'direct_aid')),
  description   text NOT NULL,
  amount        numeric(19,4) NOT NULL CHECK (amount >= 0),
  FOREIGN KEY (tenant_id, budget_id) REFERENCES budget(tenant_id, id) ON DELETE CASCADE
);
ALTER TABLE budget_line ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_line FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON budget_line USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- Expenses (FIN-03 / FIN-04)
CREATE TABLE expense (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL REFERENCES tenant_registry(id) ON DELETE CASCADE,
  project_id     uuid NOT NULL,
  budget_line_id uuid NOT NULL,
  date           date NOT NULL,
  vendor         text NOT NULL,
  amount         numeric(19,4) NOT NULL CHECK (amount > 0),
  currency       char(3) NOT NULL DEFAULT 'CAD',
  tax_tps        numeric(19,4) DEFAULT 0,
  tax_tvq        numeric(19,4) DEFAULT 0,
  status         text NOT NULL CHECK (status IN ('draft', 'submitted', 'approved', 'paid', 'rejected')) DEFAULT 'draft',
  submitted_by   uuid NOT NULL REFERENCES user_account(id),
  approved_by    uuid REFERENCES user_account(id),
  notes          text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (tenant_id, project_id) REFERENCES project(tenant_id, id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id, budget_line_id) REFERENCES budget_line(tenant_id, id)
);
ALTER TABLE expense ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON expense USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- RAID Items (PRJ-11)
CREATE TABLE raid_item (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenant_registry(id) ON DELETE CASCADE,
  project_id  uuid NOT NULL,
  type        text NOT NULL CHECK (type IN ('risk', 'issue', 'assumption', 'dependency')),
  title       text NOT NULL,
  description text,
  probability integer CHECK (probability BETWEEN 1 AND 5),
  impact      integer CHECK (impact BETWEEN 1 AND 5),
  status      text NOT NULL CHECK (status IN ('open', 'mitigated', 'closed')) DEFAULT 'open',
  owner_name  text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (tenant_id, project_id) REFERENCES project(tenant_id, id) ON DELETE CASCADE
);
ALTER TABLE raid_item ENABLE ROW LEVEL SECURITY;
ALTER TABLE raid_item FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON raid_item USING (tenant_id = current_setting('app.tenant_id')::uuid);
```

---

## 4. Contrat d'API (Endpoints & Schemas Zod)

### 4.1 `GET /api/v1/projects/:id/full`
Récupère la vue consolidée d'un projet (métadonnées, sources de financement, cadre logique, tâches, budget, synthèse dépenses, risques RAID).

### 4.2 `POST /api/v1/projects/:id/tasks`
Création d'une tâche/activité.
- **Input Schema (Zod)** :
```typescript
z.object({
  title: z.string().min(2).max(100),
  type: z.enum(['phase', 'activity', 'task', 'milestone', 'deliverable']),
  parentId: z.string().uuid().optional(),
  resultNodeId: z.string().uuid().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  durationDays: z.number().int().min(1).default(1),
})
```

### 4.3 `POST /api/v1/projects/:id/dependencies`
Création d'une dépendance avec vérification anti-cycle.
- **Input Schema (Zod)** :
```typescript
z.object({
  predecessorId: z.string().uuid(),
  successorId: z.string().uuid(),
  type: z.enum(['FS', 'SS', 'FF', 'SF']).default('FS'),
  lagDays: z.number().int().default(0),
})
```

### 4.4 `POST /api/v1/projects/:id/expenses` & `PATCH /api/v1/projects/:id/expenses/:expenseId/status`
Saisie d'une dépense et transition de statut (`submitted` -> `approved` -> `paid`).

### 4.5 `GET /api/v1/projects/:id/expenses/export`
Exportation du journal des dépenses sous forme de fichier CSV normalisé (`FIN-08`).

---

## 5. Écrans Concernés (Vue Projet multi-onglets)

Fiche Projet réorganisée en onglets réutilisables :
1. **Onglet Vue d'ensemble** : Statut, responsable, dates, indicateurs financiers clés (budget approuvé, engagé, dépensé, solde).
2. **Onglet Cadre Logique** : Arbre hiérarchique Impact → Effets → Produits.
3. **Onglet Planification (Gantt & Kanban)** : Arbre WBS des tâches, vue Gantt interactive, gestion des dépendances.
4. **Onglet Budget & Dépenses** : Tableau budgétaire par poste, workflow d'approbation des dépenses, bouton d'export CSV.
5. **Onglet Financement** : Liste des bailleurs et dates d'échéance de rapport.
6. **Onglet Registre RAID** : Matrice Risques (Probabilité × Impact) & Problèmes ouverts.

---

## 6. Tests Attendus

1. **Tests Unitaires (Logique Métier & Anti-cycle)** :
   - Algorithme de calcul du graphe de dépendances et détection des cycles (`PRJ-06`).
   - Calcul des totaux budgétaires et alertes de dépassement (`FIN-06`).
   - Règle de séparation des tâches : interdiction pour le saisisseur d'approuver sa propre dépense (`FIN-04`).
2. **Tests d'Intégration API & Workflow** :
   - Cycle complet d'une dépense (création -> soumission -> approbation -> export CSV).
3. **Tests d'Isolation Inter-Tenants (RLS)** :
   - Vérification stricte que les tâches, dépendances, budgets et dépenses du `Tenant A` sont strictement invisibles depuis le `Tenant B`.
