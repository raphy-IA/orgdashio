# Spécification Technique & Fonctionnelle — Jalon M0 (Fondations & Multi-Tenancy)

**Module** : `CORE` / `AUTH` / `TENANT`  
**Version** : 1.0  
**Statut** : En cours d'implémentation  

---

## 1. User Stories

1. **US-M0-01 (Création d'association)** : En tant qu'administrateur d'un nouvel organisme, je veux créer mon compte et mon association sur la plateforme afin de commencer l'onboarding et d'inviter mon équipe.
2. **US-M0-02 (Connexion & Session)** : En tant qu'utilisateur enregistré, je veux me connecter de manière sécurisée avec mon courriel et mot de passe et obtenir une session serveur isolée.
3. **US-M0-03 (Bascule d'association)** : En tant qu'utilisateur membre de plusieurs associations, je veux pouvoir basculer entre mes associations sans ré-authentification, en changeant mon contexte de sécurité.
4. **US-M0-04 (Isolation multi-tenant)** : En tant que responsable de la vie privée d'un organisme, je veux garantir qu'aucun utilisateur d'une autre association ne puisse accéder à nos données, même en cas de bogue applicatif (isolation RLS).
5. **US-M0-05 (Gabarit de ressource isolée)** : En tant que membre d'équipe, je veux pouvoir créer, consulter et lister des projets au sein de mon association, en vérifiant que les règles d'isolation sont appliquées.

---

## 2. Critères d'acceptation

- **CA-01** : L'inscription d'une association crée simultanément le `tenant_registry`, le `user_account`, le `user_credential` (haché Argon2id), le `party`, le `membership` et attribue le rôle `admin` système.
- **CA-02** : Le mot de passe doit faire au moins 12 caractères et être haché avec Argon2id.
- **CA-03** : La connexion renvoie un cookie `HttpOnly`, `Secure`, `SameSite=Lax` contenant un identifiant de session serveur.
- **CA-04** : Toutes les requêtes SQL sur les tables métier sont exécutées dans une transaction fixant `SET LOCAL app.tenant_id = '<tenant_uuid>'`.
- **CA-05** : Un utilisateur du `Tenant A` tentant de lire, modifier ou créer un projet dans le `Tenant B` reçoit un échec ou un résultat vide (politique RLS `USING` et `WITH CHECK`).
- **CA-06** : La commande `pnpm verify` valide les types, les lints, les tests unitaires/intégration, les tests d'isolation et le schéma RLS PostgreSQL.
- **CA-07** : L'interface web propose la sélection de la langue (FR/EN) dès l'écran de connexion et d'inscription.

---

## 3. Modèle de données (Tables, Colonnes, RLS)

### 3.1 Tables Plan de Contrôle (Globales)
```sql
CREATE TABLE tenant_registry (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text NOT NULL UNIQUE,
  name        text NOT NULL,
  mode        text NOT NULL CHECK (mode IN ('shared', 'dedicated', 'self_hosted')),
  status      text NOT NULL CHECK (status IN ('active', 'suspended', 'pending_deletion')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE user_account (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email       text NOT NULL UNIQUE,
  locale      text NOT NULL DEFAULT 'fr-CA',
  status      text NOT NULL CHECK (status IN ('active', 'pending_verification', 'suspended')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE user_credential (
  user_id     uuid PRIMARY KEY REFERENCES user_account(id) ON DELETE CASCADE,
  type        text NOT NULL CHECK (type = 'password'),
  secret_hash text NOT NULL,
  updated_at  timestamptz NOT NULL DEFAULT now()
);
```

### 3.2 Tables Plan de Données (Isolées par RLS)
```sql
-- Structure d'appartenance et droits
CREATE TABLE membership (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenant_registry(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES user_account(id) ON DELETE CASCADE,
  status      text NOT NULL CHECK (status IN ('active', 'invited', 'suspended')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, id),
  UNIQUE (tenant_id, user_id)
);
ALTER TABLE membership ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON membership
  USING (tenant_id = current_setting('app.tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE TABLE role (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenant_registry(id) ON DELETE CASCADE,
  code        text NOT NULL,
  name        text NOT NULL,
  is_system   boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, id),
  UNIQUE (tenant_id, code)
);
ALTER TABLE role ENABLE ROW LEVEL SECURITY;
ALTER TABLE role FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON role
  USING (tenant_id = current_setting('app.tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE TABLE membership_role (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL,
  membership_id uuid NOT NULL,
  role_id       uuid NOT NULL,
  FOREIGN KEY (tenant_id, membership_id) REFERENCES membership(tenant_id, id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id, role_id) REFERENCES role(tenant_id, id) ON DELETE CASCADE,
  UNIQUE (tenant_id, id)
);
ALTER TABLE membership_role ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_role FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON membership_role
  USING (tenant_id = current_setting('app.tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);

-- Sessions utilisateur
CREATE TABLE user_session (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES user_account(id) ON DELETE CASCADE,
  tenant_id   uuid REFERENCES tenant_registry(id) ON DELETE CASCADE,
  token_hash  text NOT NULL UNIQUE,
  expires_at  timestamptz NOT NULL,
  ip_address  text,
  user_agent  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Table Gabarit : Projets
CREATE TABLE project (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenant_registry(id) ON DELETE CASCADE,
  code        text NOT NULL,
  name        text NOT NULL,
  status      text NOT NULL CHECK (status IN ('planned','active','suspended','closed','cancelled')),
  created_by  uuid NOT NULL REFERENCES user_account(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  deleted_at  timestamptz,
  UNIQUE (tenant_id, id),
  UNIQUE (tenant_id, code)
);
ALTER TABLE project ENABLE ROW LEVEL SECURITY;
ALTER TABLE project FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON project
  USING (tenant_id = current_setting('app.tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);
```

---

## 4. Contrat d'API (Endpoints & Schemas Zod)

### 4.1 `POST /api/v1/auth/register-tenant`
Inscription d'un organisme + compte administrateur.
- **Input Schema (Zod)** :
```typescript
z.object({
  tenantName: z.string().min(2).max(100),
  adminEmail: z.string().email(),
  password: z.string().min(12).max(100),
  locale: z.enum(['fr-CA', 'en-CA']).default('fr-CA'),
})
```
- **Response 201** :
```json
{
  "tenant": { "id": "uuid", "name": "Association Soleil", "slug": "association-soleil" },
  "user": { "id": "uuid", "email": "admin@soleil.org" }
}
```

### 4.2 `POST /api/v1/auth/login`
Connexion et initialisation de session.
- **Input Schema (Zod)** :
```typescript
z.object({
  email: z.string().email(),
  password: z.string(),
})
```
- **Response 200** (Set-Cookie: `orgdashio_session=...; HttpOnly; Secure; SameSite=Lax`) :
```json
{
  "user": { "id": "uuid", "email": "admin@soleil.org" },
  "tenants": [
    { "id": "uuid", "name": "Association Soleil", "role": "admin" }
  ],
  "activeTenantId": "uuid"
}
```

### 4.3 `POST /api/v1/auth/switch-tenant`
Changement de tenant actif pour la session.
- **Input Schema (Zod)** :
```typescript
z.object({
  tenantId: z.string().uuid()
})
```

### 4.4 `GET /api/v1/projects` & `POST /api/v1/projects`
Ressources projet isolées.
- **Create Input Schema (Zod)** :
```typescript
z.object({
  code: z.string().min(2).max(20),
  name: z.string().min(2).max(100),
  status: z.enum(['planned','active','suspended','closed','cancelled']).default('planned'),
})
```

---

## 5. Écrans Concernés

1. **`LoginScreen`** (`/login`) : Formulaire de connexion, sélection de langue, lien réinitialisation.
2. **`RegisterTenantScreen`** (`/register`) : Formulaire d'inscription organisme + administrateur.
3. **`TenantSwitchModal`** : Modal/Sélecteur d'organisation active dans le header.
4. **`ProjectListScreen`** (`/projects`) : Tableau des projets avec filtres et bouton création.
5. **`ProjectCreateModal`** : Formulaire de création de projet (code, nom, statut).

---

## 6. Tests Attendus

1. **Tests Unitaires** :
   - Hachage et vérification de mots de passe Argon2id.
   - Validation des schémas Zod (email, mot de passe < 12 caractères).
2. **Tests d'Intégration API** :
   - Flux complet Inscription → Connexion → Obtenir Session → Bascule Tenant.
   - Création de projet dans l'association active.
3. **Tests d'Isolation RLS Inter-Tenants** :
   - Création de `Tenant A` et `Tenant B`.
   - Utilisateur `UserA` crée `ProjectA1` dans `Tenant A`.
   - Connexion en tant que `UserB` (Tenant B).
   - Tenter `GET /api/v1/projects` -> Doit retourner `[]` (aucun projet de Tenant A).
   - Tenter `GET /api/v1/projects/:id_project_A1` -> Doit retourner 404 (non trouvé / filtré par RLS).
   - Tenter `POST /api/v1/projects` avec `tenant_id` forcé à `Tenant A` -> Doit échouer par RLS (`WITH CHECK`).
