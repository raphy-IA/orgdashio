# Spécification Fonctionnelle & Technique — Module FOR (Formation) (Jalon M2)

**Module** : `FOR` (Catalogue, Sessions, Formateurs, Présences, Certificats, Formulaire Public)  
**Version** : 1.0  
**Statut** : En attente de validation  
**Exigences liées** : `FOR-01` à `FOR-14`  

---

## 1. User Stories

1. **US-FOR-01 (Catalogue & Parcours `FOR-01`)** : En tant que responsable formation, je veux créer un catalogue de formations (programme, cours, modules, leçons) avec durées et objectifs.
2. **US-FOR-02 (Sessions, Cohortes & Formateurs `FOR-02`, `FOR-03`)** : En tant que responsable formation, je veux planifier une session de formation avec des séances datées, lui affecter un formateur et vérifier automatiquement qu'aucun conflit d'horaire n'existe pour le formateur.
3. **US-FOR-03 (Inscriptions & Formulaire Public `FOR-04`, `FOR-05`)** : En tant que participant externe ou agent, je veux inscrire une personne à une session (soit par un agent, soit via un formulaire public d'inscription avec consentement obligatoire).
4. **US-FOR-04 (Présences par Séance `FOR-06`)** : En tant que formateur, je veux enregistrer rapidement les présences par séance (présent, absent, retard, justifié) sur mobile ou ordinateur.
5. **US-FOR-05 (Certificats & Évaluations `FOR-07`, `FOR-09`)** : En tant que responsable formation, je veux générer des certificats numérotés uniques pour les participants remplissant les règles de présence ($\ge 80\%$) et de réussite ($\ge 60\%$).

---

## 2. Critères d'acceptation & Règles de gestion

- **CA-FOR-01 (Détection de conflits d'horaire formateur `FOR-03`)** :
  - Lors de l'affectation d'un formateur à une séance datée, le système vérifie s'il est déjà affecté à une autre séance qui se chevauche dans le temps.
  - Tout conflit entraîne l'affichage d'un message bloquant avec le détail de la séance en conflit.
- **CA-FOR-02 (Gestion de la capacité & Liste d'attente `FOR-04`)** :
  - Si la capacité maximale d'une session est atteinte, l'inscription est placée automatiquement en statut `waitlist` (liste d'attente).
- **CA-FOR-03 (Formulaire public d'inscription `FOR-05`)** :
  - Génération d'un jeton public d'inscription par session (`/public/register/:token`).
  - Validation obligatoire de la case de consentement Loi 25 avant soumission.
- **CA-FOR-04 (Règles d'émission des certificats `FOR-09`)** :
  - Un certificat ne peut être émis que si `taux_presence >= 80%` ET `note_evaluation >= 60%`.
  - Chaque certificat possède un numéro unique vérifiable.

---

## 3. Modèle de données (Drizzle / PostgreSQL RLS)

```sql
-- Course & Catalogue (FOR-01)
CREATE TABLE course (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenant_registry(id) ON DELETE CASCADE,
  code        text NOT NULL,
  title       text NOT NULL,
  description text,
  duration_hours integer NOT NULL DEFAULT 1,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, id),
  UNIQUE (tenant_id, code)
);
ALTER TABLE course ENABLE ROW LEVEL SECURITY;
ALTER TABLE course FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON course USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- Training Session (FOR-02)
CREATE TABLE training_session (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenant_registry(id) ON DELETE CASCADE,
  course_id   uuid NOT NULL,
  project_id  uuid,
  title       text NOT NULL,
  capacity    integer NOT NULL DEFAULT 20,
  status      text NOT NULL CHECK (status IN ('planned', 'open', 'in_progress', 'completed', 'cancelled')) DEFAULT 'planned',
  created_at  timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (tenant_id, course_id) REFERENCES course(tenant_id, id) ON DELETE CASCADE
);
ALTER TABLE training_session ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_session FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON training_session USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- Session Occurrence / Séances datées (FOR-02, FOR-03)
CREATE TABLE session_occurrence (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid NOT NULL REFERENCES tenant_registry(id) ON DELETE CASCADE,
  session_id   uuid NOT NULL,
  trainer_party_id uuid,
  start_time   timestamptz NOT NULL,
  end_time     timestamptz NOT NULL,
  location     text,
  FOREIGN KEY (tenant_id, session_id) REFERENCES training_session(tenant_id, id) ON DELETE CASCADE
);
ALTER TABLE session_occurrence ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_occurrence FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON session_occurrence USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- Enrollment (FOR-04)
CREATE TABLE enrollment (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenant_registry(id) ON DELETE CASCADE,
  session_id  uuid NOT NULL,
  party_id    uuid NOT NULL,
  status      text NOT NULL CHECK (status IN ('pending', 'confirmed', 'waitlist', 'completed', 'dropped')) DEFAULT 'pending',
  source      text NOT NULL CHECK (source IN ('agent', 'public_form', 'csv_import')) DEFAULT 'agent',
  created_at  timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (tenant_id, session_id) REFERENCES training_session(tenant_id, id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id, party_id) REFERENCES party(tenant_id, id) ON DELETE CASCADE,
  UNIQUE (tenant_id, session_id, party_id)
);
ALTER TABLE enrollment ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollment FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON enrollment USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- Attendance (FOR-06)
CREATE TABLE attendance (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL REFERENCES tenant_registry(id) ON DELETE CASCADE,
  occurrence_id uuid NOT NULL,
  enrollment_id uuid NOT NULL,
  status        text NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')) DEFAULT 'present',
  notes         text,
  FOREIGN KEY (tenant_id, occurrence_id) REFERENCES session_occurrence(tenant_id, id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id, enrollment_id) REFERENCES enrollment(tenant_id, id) ON DELETE CASCADE,
  UNIQUE (tenant_id, occurrence_id, enrollment_id)
);
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON attendance USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- Certificate (FOR-09)
CREATE TABLE certificate (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL REFERENCES tenant_registry(id) ON DELETE CASCADE,
  enrollment_id uuid NOT NULL UNIQUE,
  cert_number   text NOT NULL UNIQUE,
  issued_at     timestamptz NOT NULL DEFAULT now(),
  status        text NOT NULL CHECK (status IN ('valid', 'revoked')) DEFAULT 'valid',
  FOREIGN KEY (tenant_id, enrollment_id) REFERENCES enrollment(tenant_id, id) ON DELETE CASCADE
);
ALTER TABLE certificate ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificate FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON certificate USING (tenant_id = current_setting('app.tenant_id')::uuid);
```

---

## 4. Contrat d'API (Endpoints & Schemas Zod)

### 4.1 `POST /api/v1/training/courses` & `POST /api/v1/training/sessions`
Création d'un cours et planification d'une session de formation.

### 4.2 `POST /api/v1/training/sessions/:id/occurrences`
Ajout d'une séance datée avec contrôle de conflit d'horaire pour le formateur.
- **Input Schema (Zod)** :
```typescript
z.object({
  trainerPartyId: z.string().uuid().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  location: z.string().optional(),
})
```

### 4.3 `POST /api/v1/training/sessions/:id/attendances`
Saisie rapide des présences pour une séance.

### 4.4 `POST /api/v1/training/enrollments/:id/issue-certificate`
Émission d'un certificat avec vérification du seuil de présence ($\ge 80\%$).

---

## 5. Écrans Concernés

1. **`TrainingCatalogScreen`** (`/training/courses`) : Catalogue des cours et programmes.
2. **`TrainingSessionDetailScreen`** (`/training/sessions/:id`) : Vue détaillée de session (onglets Séance/Horaires, Liste des inscrits, Saisie des présences, Certificats).
3. **`PublicRegistrationScreen`** (`/public/register/:token`) : Formulaire public responsive d'inscription avec case de consentement obligatoire.

---

## 6. Tests Attendus

1. **Tests Unitaires (Conflits & Certificats)** :
   - Algorithme de détection de chevauchement d'horaires pour un formateur (`FOR-03`).
   - Règle d'éligibilité à l'émission du certificat (calcul du taux de présence $\ge 80\%$) (`FOR-09`).
2. **Tests d'Isolation Inter-Tenants (RLS)** :
   - Validation que le catalogue et les présences du `Tenant A` sont inaccessibles par le `Tenant B`.
