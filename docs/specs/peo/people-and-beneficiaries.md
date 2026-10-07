# Spécification Fonctionnelle & Technique — Personnes, Ménages & Consentements (Jalon M2)

**Module** : `PEO` (Personnes accompagnées, Ménages, Consentements, Services rendus)  
**Version** : 1.0  
**Statut** : En attente de validation  
**Exigences liées** : `PEO-01` à `PEO-12`, `CMP-05` (Consentement Loi 25)  

---

## 1. User Stories

1. **US-PEO-01 (Fiche Personne Unique `party`)** : En tant qu'agent d'accueil ou intervenant, je veux enregistrer une personne accompagnée (profil bénéficiaire/participant) sans lui créer obligatoirement un compte utilisateur, afin d'assurer son suivi.
2. **US-PEO-02 (Gestion des Ménages `PEO-03`)** : En tant qu'intervenant, je veux regrouper des personnes au sein d'un même ménage avec définition de leur rôle (chef de ménage, conjoint, enfant, dépendant) et adresse commune.
3. **US-PEO-03 (Consentements Versionnés `PEO-04` / `CMP-05`)** : En tant que responsable de la protection des renseignements personnels, je veux enregistrer et vérifier les consentements explicites des personnes par finalité (écrit, verbal, électronique), avec traçabilité de retrait à effet immédiat.
4. **US-PEO-04 (Catalogue & Services Rendus `PEO-07`)** : En tant qu'intervenant, je veux consigner les services rendus à une personne (qui, quel service, quand, quel projet, quel intervenant) pour alimenter automatiquement les indicateurs.
5. **US-PEO-05 (Détection de Doublons `PEO-05`)** : En tant qu'agent d'accueil, je veux que le système détecte les doublons potentiels (nom, prénom, date de naissance, courriel, téléphone) lors de la création d'un bénéficiaire.

---

## 2. Critères d'acceptation & Règles de gestion

- **CA-PEO-01 (Identité unique `party`)** :
  - La table `party` représente une personne physique ou morale.
  - La fiche `beneficiary_profile` est rattachée à un `party_id` et isolée par `tenant_id`.
  - Un bénéficiaire peut être créé **sans compte utilisateur** (`user_account` n'est pas requis).
- **CA-PEO-02 (Consentement explicite et retirable `CMP-05`)** :
  - Chaque consentement exige : finalité (`purpose_id`), version du texte, mode (`written`, `verbal`, `electronic`), date et preuve jointe optionnelle.
  - Si un consentement est retiré (`withdrawn_at`), tous les services ou traitements associés à cette finalité sont immédiatement bloqués pour cette personne.
- **CA-PEO-03 (Détection de doublons `PEO-05`)** :
  - À la création d'une personne, un algorithme de comparaison (Phonétique / Distance Levenshtein sur nom + prénom + date de naissance) cherche les candidats existants et affiche une alerte si le score de similitude est $> 80\%$.
- **CA-PEO-04 (Services rendus & Rapprochement `PEO-07`)** :
  - Chaque prestation de service génère un `service_delivery` lié à la personne, au type de service, au projet et à l'intervenant.

---

## 3. Modèle de données (Drizzle / PostgreSQL RLS)

```sql
-- Party & Person (PEO-01)
CREATE TABLE party (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenant_registry(id) ON DELETE CASCADE,
  kind        text NOT NULL CHECK (kind IN ('person', 'organization')),
  first_name  text,
  last_name   text,
  email       text,
  phone       text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, id)
);
ALTER TABLE party ENABLE ROW LEVEL SECURITY;
ALTER TABLE party FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON party USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- Beneficiary Profile (PEO-02)
CREATE TABLE beneficiary_profile (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL REFERENCES tenant_registry(id) ON DELETE CASCADE,
  party_id       uuid NOT NULL,
  status         text NOT NULL CHECK (status IN ('active', 'inactive', 'archived')) DEFAULT 'active',
  birth_date     date,
  gender_code    text,
  preferred_lang text DEFAULT 'fr',
  intake_date    date NOT NULL DEFAULT CURRENT_DATE,
  custom_fields  jsonb,
  created_at     timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (tenant_id, party_id) REFERENCES party(tenant_id, id) ON DELETE CASCADE
);
ALTER TABLE beneficiary_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE beneficiary_profile FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON beneficiary_profile USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- Household & Household Member (PEO-03)
CREATE TABLE household (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenant_registry(id) ON DELETE CASCADE,
  name        text NOT NULL,
  address     text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE household ENABLE ROW LEVEL SECURITY;
ALTER TABLE household FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON household USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE TABLE household_member (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid NOT NULL REFERENCES tenant_registry(id) ON DELETE CASCADE,
  household_id uuid NOT NULL,
  party_id     uuid NOT NULL,
  role         text NOT NULL CHECK (role IN ('head', 'spouse', 'child', 'dependent', 'other')),
  FOREIGN KEY (tenant_id, household_id) REFERENCES household(tenant_id, id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id, party_id) REFERENCES party(tenant_id, id) ON DELETE CASCADE
);
ALTER TABLE household_member ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_member FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON household_member USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- Consent Record (PEO-04 / CMP-05)
CREATE TABLE consent_purpose (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenant_registry(id) ON DELETE CASCADE,
  code        text NOT NULL,
  title       text NOT NULL,
  description text NOT NULL,
  is_required boolean NOT NULL DEFAULT false
);
ALTER TABLE consent_purpose ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_purpose FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON consent_purpose USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE TABLE consent_record (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid NOT NULL REFERENCES tenant_registry(id) ON DELETE CASCADE,
  party_id     uuid NOT NULL,
  purpose_id   uuid NOT NULL,
  version      text NOT NULL DEFAULT '1.0',
  status       text NOT NULL CHECK (status IN ('given', 'withdrawn', 'expired')) DEFAULT 'given',
  mode         text NOT NULL CHECK (mode IN ('written', 'verbal', 'electronic')),
  given_at     timestamptz NOT NULL DEFAULT now(),
  withdrawn_at timestamptz,
  FOREIGN KEY (tenant_id, party_id) REFERENCES party(tenant_id, id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id, purpose_id) REFERENCES consent_purpose(tenant_id, id)
);
ALTER TABLE consent_record ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_record FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON consent_record USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- Services Rendus (PEO-07)
CREATE TABLE service_type (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenant_registry(id) ON DELETE CASCADE,
  name        text NOT NULL,
  category    text
);
ALTER TABLE service_type ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_type FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON service_type USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE TABLE service_delivery (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        uuid NOT NULL REFERENCES tenant_registry(id) ON DELETE CASCADE,
  party_id         uuid NOT NULL,
  service_type_id  uuid NOT NULL,
  project_id       uuid,
  provider_party_id uuid NOT NULL,
  delivered_at     date NOT NULL DEFAULT CURRENT_DATE,
  notes            text,
  FOREIGN KEY (tenant_id, party_id) REFERENCES party(tenant_id, id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id, service_type_id) REFERENCES service_type(tenant_id, id),
  FOREIGN KEY (tenant_id, project_id) REFERENCES project(tenant_id, id)
);
ALTER TABLE service_delivery ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_delivery FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON service_delivery USING (tenant_id = current_setting('app.tenant_id')::uuid);
```

---

## 4. Contrat d'API (Endpoints & Schemas Zod)

### 4.1 `POST /api/v1/people`
Création d'une fiche personne / bénéficiaire avec vérification anti-doublons.
- **Input Schema (Zod)** :
```typescript
z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  genderCode: z.string().optional(),
  preferredLang: z.enum(['fr', 'en']).default('fr'),
})
```

### 4.2 `POST /api/v1/people/:id/consents`
Enregistrement ou retrait d'un consentement.

### 4.3 `POST /api/v1/service-deliveries`
Consignation d'un service rendu à une personne.

---

## 5. Écrans Concernés

1. **`PeopleListScreen`** (`/people`) : Liste des bénéficiaires/personnes avec filtres, recherche et statut de consentement.
2. **`PersonDetailScreen`** (`/people/:id`) : Fiche bénéficiaire complète (identité, ménage, consentements actifs/retirés, historique des services rendus).
3. **`DuplicateWarningModal`** : Pop-up d'avertissement affichant les doublons potentiels détectés avant confirmation de création.

---

## 6. Tests Attendus

1. **Tests Unitaires (Anti-doublons & Consentement)** :
   - Comparaison de similitude sur les profils pour détection des doublons (`PEO-05`).
   - Règle de blocage technique lors du retrait de consentement (`CMP-05`).
2. **Tests d'Isolation Inter-Tenants (RLS)** :
   - Validation que les bénéficiaires et consentements du `Tenant A` sont strictement inaccessibles depuis le `Tenant B`.
