# Spécification Fonctionnelle & Technique — Documents, Notifications & Console Plateforme (Jalon M1)

**Module** : `CORE` / `DOC` / `NOTIF` / `ADMIN`  
**Version** : 1.0  
**Statut** : En attente de validation  
**Exigences liées** : `CORE-14`, `CORE-15`, `CORE-24`, `TEC-DOC-01` à `TEC-DOC-06`  

---

## 1. User Stories

1. **US-CORE-14 (Gestion des Documents)** : En tant que membre d’équipe ou chef de projet, je veux téléverser des documents rattachés à un projet, un budget ou une association, avec versionnement et contrôle d'accès hérité de l'objet.
2. **US-CORE-15 (Notifications In-App & Courriels)** : En tant qu'utilisateur, je veux recevoir des notifications dans l'application et par courriel pour les événements importants (ex: approbation de dépense, nouvelle tâche attribuée, invitation) selon mes préférences.
3. **US-CORE-24 (Console Plateforme Super-Admin)** : En tant que super-administrateur de la plateforme (nous), je veux visualiser la liste des tenants (statut, plan, utilisation) et accéder à un mode support audité sans accès direct aux données sensibles de cas.

---

## 2. Critères d'acceptation & Règles de gestion

- **CA-CORE-14 (Stockage Objet S3 & Métadonnées)** :
  - La clé de stockage objet est préfixée par `tenant_id` (`<tenant_id>/<entity_type>/<entity_id>/<file_name>`).
  - Génération d'URL signées à durée de vie courte (15 min).
  - Validation du type de fichier (liste blanche MIME) et de la taille maximale (50 Mo).
- **CA-CORE-15 (Notifications multi-canaux)** :
  - Chaque notification a un type d'événement (`expense.submitted`, `expense.approved`, `project.assigned`, `invitation.received`).
  - Préférences modifiables par l'utilisateur (In-App activé/désactivé, Courriel résumé quotidien ou immédiat).
- **CA-CORE-24 (Console Super-Admin & Audit Support)** :
  - Accessible uniquement au rôle `platform_admin`.
  - Visualisation du registre `tenant_registry` (nom, slug, mode, statut, nombre d'utilisateurs actifs, nombre de projets).
  - Tout accès support exige une justification écrite enregistrée de façon immuable dans `support_access_grant`.

---

## 3. Modèle de données (Drizzle / PostgreSQL RLS)

```sql
-- Documents & Versionnement (CORE-14)
CREATE TABLE document (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL REFERENCES tenant_registry(id) ON DELETE CASCADE,
  entity_type    text NOT NULL, -- ex: 'project', 'expense', 'tenant'
  entity_id      text NOT NULL,
  file_name      text NOT NULL,
  mime_type      text NOT NULL,
  file_size      integer NOT NULL,
  storage_key    text NOT NULL UNIQUE,
  current_version integer NOT NULL DEFAULT 1,
  uploaded_by    uuid NOT NULL REFERENCES user_account(id),
  created_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, id)
);
ALTER TABLE document ENABLE ROW LEVEL SECURITY;
ALTER TABLE document FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON document USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- Notifications (CORE-15)
CREATE TABLE notification (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenant_registry(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES user_account(id) ON DELETE CASCADE,
  event_type  text NOT NULL,
  title       text NOT NULL,
  message     text NOT NULL,
  is_read     boolean NOT NULL DEFAULT false,
  link_url    text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, id)
);
ALTER TABLE notification ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON notification USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- Console Support Access (CORE-24)
CREATE TABLE support_access_grant (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenant_registry(id) ON DELETE CASCADE,
  admin_id    uuid NOT NULL REFERENCES user_account(id),
  reason      text NOT NULL,
  expires_at  timestamptz NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
```

---

## 4. Contrat d'API (Endpoints & Schemas Zod)

### 4.1 `POST /api/v1/documents/upload-url`
Génère une URL signée pour le téléversement direct d'un fichier.
- **Input Schema (Zod)** :
```typescript
z.object({
  entityType: z.string(),
  entityId: z.string(),
  fileName: z.string().min(1),
  mimeType: z.string(),
  fileSize: z.number().max(52428800), // 50MB
})
```

### 4.2 `GET /api/v1/notifications` & `PATCH /api/v1/notifications/:id/read`
Récupération des notifications in-app et marquage comme lues.

### 4.3 `GET /api/v1/platform/tenants` (Console Super-Admin)
Liste les tenants et statistiques d'utilisation (réservé `platform_admin`).

---

## 5. Écrans Concernés

1. **`DocumentListWidget`** : Widget de téléversement et liste de fichiers rattachés à un projet ou une dépense.
2. **`NotificationPopover`** : Menu de notifications in-app dans le header (cloche avec badge non lues).
3. **`PlatformConsoleScreen`** (`/platform/tenants`) : Vue console super-admin listant les associations et leur statut.

---

## 6. Tests Attendus

1. **Tests Unitaires (Sanitation & Tailles)** :
   - Validation de la liste blanche MIME et limite de taille de 50 Mo.
   - Génération déterministe de la clé de stockage avec prefix `tenant_id`.
2. **Tests d'Intégration API** :
   - Flux de création de document -> Notification automatique générée pour l'utilisateur destinataire.
3. **Tests d'Isolation Inter-Tenants (RLS)** :
   - Validation stricte que les documents et notifications d'un tenant sont inaccessibles par un autre tenant.
