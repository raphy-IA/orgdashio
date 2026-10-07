# Spécification Fonctionnelle & Technique — Onboarding, Invitations & Journal d'Audit (Jalon M1)

**Module** : `CORE` / `ORG`  
**Version** : 1.0  
**Statut** : En attente de validation  
**Exigences liées** : `CORE-02`, `CORE-05`, `CORE-07`, `CORE-19`  

---

## 1. User Stories

1. **US-CORE-02 (Assistant d'Onboarding)** : En tant qu'administrateur d’une nouvelle association, je veux être guidé par un assistant en 6 étapes (profil, langue/devise, modules activés, structure, invitation d'équipe, création du 1ᵉʳ projet) afin de configurer mon espace en moins de 30 minutes.
2. **US-CORE-05 (Invitations d'équipe)** : En tant qu'administrateur, je veux inviter des collaborateurs par courriel avec l'attribution d'un rôle (ex. `project_manager`, `team_member`, `finance_manager`) et une date d'expiration pour sécuriser les accès.
3. **US-CORE-19 (Journal d'Audit Immuable)** : En tant que responsable de la vie privée ou administrateur, je veux consulter et exporter le journal d'audit des actions sensibles (qui, quoi, quand, avant/après) pour des fins de traçabilité.

---

## 2. Critères d'acceptation & Règles de gestion

- **CA-CORE-02 (Onboarding $\le 6$ étapes)** :
  - Étape 1 : Profil & Coordonnées (NEQ, No Organisme Bienfaisance optionnels).
  - Étape 2 : Préférences (Langue, Devise `CAD`, Fuseau horaire).
  - Étape 3 : Choix du Pack Sectoriel (Insertion/Formation, Social, Communautaire).
  - Étape 4 : Structure organisationnelle initiale (Départements/Équipes).
  - Étape 5 : Invitations d'équipe (Courriels + Rôles).
  - Étape 6 : Création du 1ᵉʳ projet.
- **CA-CORE-05 (Jetons d'invitation sécurisés)** :
  - Jeton d'invitation unique, chiffré/haché en base de données avec une validité de 7 jours.
  - Possibilité de révoquer ou renvoyer une invitation.
  - L'acceptation de l'invitation crée le profil `membership` et l'associe à l'utilisateur.
- **CA-CORE-19 (Audit Log Immuable)** :
  - L'enregistrement d'audit se fait automatiquement pour chaque action `CREATE`, `UPDATE`, `DELETE` sur les objets métier.
  - **Aucune donnée personnelle (PII)** n'est enregistrée dans le payload de l'audit log (pseudonymisation des identifiants).
  - La table `audit_log` est en ajout seul (append-only) et protégée par RLS par tenant.

---

## 3. Modèle de données (Drizzle / PostgreSQL RLS)

```sql
-- Invitations (CORE-05)
CREATE TABLE invitation (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid NOT NULL REFERENCES tenant_registry(id) ON DELETE CASCADE,
  email        text NOT NULL,
  role_id      uuid NOT NULL,
  token_hash   text NOT NULL UNIQUE,
  status       text NOT NULL CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')) DEFAULT 'pending',
  invited_by   uuid NOT NULL REFERENCES user_account(id),
  expires_at   timestamptz NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (tenant_id, role_id) REFERENCES role(tenant_id, id)
);
ALTER TABLE invitation ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitation FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON invitation USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- Structure Organisationnelle (CORE-07)
CREATE TABLE org_unit (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenant_registry(id) ON DELETE CASCADE,
  parent_id   uuid,
  name        text NOT NULL,
  code        text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (tenant_id, parent_id) REFERENCES org_unit(tenant_id, id)
);
ALTER TABLE org_unit ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_unit FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON org_unit USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- Audit Log (CORE-19 - déjà créé dans M0, raffiné pour filtres)
```

---

## 4. Contrat d'API (Endpoints & Schemas Zod)

### 4.1 `POST /api/v1/onboarding/complete-step`
Valide une étape de l'assistant d'onboarding.

### 4.2 `POST /api/v1/invitations`
Envoie une invitation par courriel.
- **Input Schema (Zod)** :
```typescript
z.object({
  email: z.string().email(),
  roleId: z.string().uuid(),
})
```

### 4.3 `POST /api/v1/invitations/accept`
Accepte une invitation via son jeton.
- **Input Schema (Zod)** :
```typescript
z.object({
  token: z.string(),
  password: z.string().min(12),
})
```

### 4.4 `GET /api/v1/audit-logs`
Consulte le journal d'audit du tenant avec filtres (`entityType`, `action`, `startDate`, `endDate`).

---

## 5. Écrans Concernés

1. **`OnboardingWizardScreen`** (`/onboarding`) : Assistant 6 étapes avec barre de progression.
2. **`TeamInvitationsScreen`** (`/settings/team`) : Tableau des membres et invitations en attente avec bouton d'invitation.
3. **`AcceptInvitationScreen`** (`/invite/accept?token=...`) : Formulaire d'acceptation et création de mot de passe.
4. **`AuditLogScreen`** (`/settings/audit`) : Journal d'audit avec filtres et export.

---

## 6. Tests Attendus

1. **Tests Unitaires (Jetons & Expiration)** :
   - Génération et validation des jetons d'invitation chiffrés.
   - Rejet des jetons expirés ou révoqués.
2. **Tests d'Intégration API** :
   - Émettre une invitation -> Accepter l'invitation -> Créer le `membership` et attribuer le rôle.
3. **Tests d'Isolation Inter-Tenants (RLS)** :
   - Vérification que l'administrateur du `Tenant A` ne peut ni voir ni révoquer les invitations du `Tenant B`.
