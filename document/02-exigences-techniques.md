# Cahier d'exigences techniques — Plateforme SaaS pour associations et OBNL

**Version** 1.0 (3 octobre 2026) · **Statut** Proposition à valider · **Langue** Français (identifiants techniques en anglais)
**Documents liés** `01-cahier-des-charges-fonctionnel.md`, `03-benchmark-et-tarification.md`

> Les identifiants `TEC-xx` sont stables. Les choix de technologie sont des décisions d'architecture (ADR) justifiées en section 2 ; ils peuvent être révisés par ADR écrit, jamais silencieusement. Les versions exactes des dépendances sont figées par le fichier de verrouillage, pas par ce document.

---

## 1. Principes directeurs

| # | Principe | Conséquence |
|---|---|---|
| P1 | **Sécurité et isolation d'abord** | L'isolation inter-tenants est imposée par la base de données, pas seulement par le code |
| P2 | **Un code, trois modes de déploiement** | Mutualisé, base dédiée, autohébergé : mêmes binaires, configuration différente |
| P3 | **Dépendances minimales pour l'autohébergement** | PostgreSQL + stockage objet compatible S3 + SMTP. Pas de service géré obligatoire |
| P4 | **Monolithe modulaire** | Frontières de modules strictes, extraction possible plus tard, pas de microservices prématurés |
| P5 | **Contrat d'API d'abord** | OpenAPI généré à partir de schémas partagés ; le frontend ne dépend que du contrat |
| P6 | **Tout est auditable et testable** | Journal d'audit, tests automatisés d'isolation, migrations revues |
| P7 | **Configuration plutôt que code client** | Modules, champs, vocabulaire, workflows ; jamais de branche par client |
| P8 | **Accessibilité et bilinguisme natifs** | FR/EN et WCAG 2.1 AA dès le premier écran |
| P9 | **Conçu pour être développé avec un assistant IA** | Conventions explicites, petites unités, vérifications automatiques (section 14) |

---

## 2. Décisions d'architecture (ADR initiaux)

| ADR | Décision | Justification | Alternative écartée |
|---|---|---|---|
| ADR-001 | **Monolithe modulaire** en TypeScript (Node.js LTS) avec NestJS | Écosystème riche, typage partagé avec le frontend, bien maîtrisé par les assistants IA, structure modulaire native | Microservices (complexité inutile) ; Django (très bon aussi, mais pas de types partagés avec le frontend) |
| ADR-002 | **PostgreSQL** (version majeure supportée) comme unique base de données | Isolation par ligne (RLS), JSONB, recherche plein texte, extensions éprouvées, disponible partout, y compris autohébergé | Base NoSQL ; une base par service |
| ADR-003 | Accès aux données par **Drizzle ORM** et migrations **SQL revues à la main** ; politiques RLS écrites en SQL | Typage fort, contrôle total du SQL sensible, migrations lisibles | Prisma (contrôle plus limité sur RLS et SQL avancé) |
| ADR-004 | **Isolation par RLS** : `tenant_id` sur chaque table, clés étrangères composites, rôle applicatif sans privilège de contournement | Défense en profondeur : un bug applicatif ne suffit pas à fuiter | Schéma par tenant (migrations lourdes à l'échelle) ; filtrage applicatif seul |
| ADR-005 | **Frontend** : React + TypeScript + Vite, TanStack Query et Router, React Hook Form + Zod, Tailwind + composants Radix/shadcn, i18next | Productivité, accessibilité des composants Radix, FR/EN, écosystème | Frameworks full-stack côté serveur (inutiles pour une application authentifiée) |
| ADR-006 | **Contrat** : schémas Zod partagés dans un paquet commun ; OpenAPI 3.1 généré ; client typé généré | Une seule source de vérité des types et validations | Types écrits à la main des deux côtés |
| ADR-007 | **Tâches asynchrones** avec une file basée sur PostgreSQL (pg-boss) | Pas de Redis obligatoire, transactionnel avec les données, simple en autohébergement | Redis/BullMQ (dépendance de plus) |
| ADR-008 | **Recherche** par PostgreSQL (plein texte français/anglais, trigrammes, suppression d'accents) | Suffisant pour R1, aucune infra supplémentaire | Elasticsearch/OpenSearch (à reconsidérer à grande échelle) |
| ADR-009 | **Fichiers** via l'API S3 (S3 en SaaS ; MinIO ou disque local en autohébergé), antivirus ClamAV, URL signées | Même code partout | Stockage en base |
| ADR-010 | **Authentification interne** : Argon2id, sessions serveur en base (cookie HttpOnly), TOTP et WebAuthn ; fédération OIDC en R2, SAML en R4 | Fonctionne hors ligne en autohébergé ; bibliothèques éprouvées uniquement, aucune cryptographie maison | IdP géré obligatoire (casse l'autohébergement) |
| ADR-011 | **Autorisation** : RBAC par codes de permission + portées (projet, équipe de dossier) évaluées par une couche de politiques centralisée | Lisible, testable, extensible | Contrôles dispersés dans les contrôleurs |
| ADR-012 | **PDF** : rendu HTML → PDF par Chromium sans interface dans un conteneur dédié | Fidélité (accents, mise en page, bilingue) | Bibliothèques PDF programmatiques (mise en page laborieuse) |
| ADR-013 | **Observabilité** : OpenTelemetry, journaux JSON structurés, métriques compatibles Prometheus, suivi d'erreurs compatible Sentry (auto-hébergeable) | Standards ouverts, valables SaaS et autohébergé | Outil propriétaire unique |
| ADR-014 | **Hébergement SaaS** : AWS, région Canada (Montréal) ; ECS Fargate, RDS PostgreSQL multi-AZ, S3, CloudFront + WAF, SES, KMS, Secrets Manager ; **infrastructure en code** (Terraform ou OpenTofu) | Résidence canadienne, services gérés matures, compétences du porteur | Kubernetes (surcoût opérationnel pour la taille de l'équipe) |
| ADR-015 | **Dépôt unique (monorepo)** pnpm + Turborepo : `apps/api`, `apps/web`, `apps/worker`, `packages/shared`, `packages/ui`, `infra`, `docs` | Cohérence des types, refactors atomiques, contexte complet pour l'assistant IA | Multi-dépôts |
| ADR-016 | **Développement par tranches verticales** livrables, avec indicateurs de fonctionnalité (feature flags) | Livraison continue sans branches longues | Branches de fonctionnalités de plusieurs semaines |

> **Note sur la pile** : si le porteur préfère Python/Django ou .NET, les principes P1 à P9 et les sections 3 à 13 restent valables ; seule la section 2 change. Le choix TypeScript ci-dessus maximise l'efficacité d'un développement assisté par IA (typage de bout en bout, contrat unique).

---

## 3. Multi-tenance et modes de déploiement

### 3.1 Plan de contrôle et plan de données
- **Plan de contrôle** (base `control`) : registre des tenants (`tenant_registry`), domaines, plans, abonnements, licences, droits, files de provisionnement, administrateurs plateforme. Aucune donnée métier.
- **Plan de données** : une ou plusieurs bases contenant les données métier. Le registre indique pour chaque tenant : mode, chaîne de connexion (référence de secret), région, version de schéma.

### 3.2 Les trois modes

| Mode | Isolation | Cas d'usage | Particularités |
|---|---|---|---|
| **Mutualisé** | Base partagée, RLS | Petites et moyennes associations | Défaut, coût minimal |
| **Dédié** | Base PostgreSQL dédiée (même application) | Exigences de confidentialité, volumes importants | Migrations orchestrées sur toutes les bases ; sauvegardes et clés de chiffrement séparées |
| **Autohébergé** | Instance mono-tenant chez le client, licence signée | Grandes ONG, bailleurs, contraintes de souveraineté | Paquet conteneurisé, mises à jour par canal, pas d'appel sortant obligatoire |

### 3.3 Exigences d'isolation (mode mutualisé)

| ID | Exigence |
|---|---|
| TEC-MT-01 | Toute table de données métier possède `tenant_id uuid NOT NULL` et `UNIQUE (tenant_id, id)` |
| TEC-MT-02 | Les clés étrangères entre tables métier sont **composites** `(tenant_id, x_id)` pour interdire tout lien inter-tenant |
| TEC-MT-03 | RLS **activé et forcé** sur toute table avec `tenant_id`, politique `USING` et `WITH CHECK` sur `tenant_id = current_setting('app.tenant_id')::uuid` |
| TEC-MT-04 | Le rôle de connexion applicatif n'est ni propriétaire des tables ni autorisé à contourner la RLS ; un rôle distinct exécute les migrations |
| TEC-MT-05 | Le contexte est posé **par transaction** (`set_config('app.tenant_id', $1, true)`), jamais par session de connexion partagée ; le gabarit d'accès aux données refuse de s'exécuter sans contexte |
| TEC-MT-06 | Le tenant est déterminé à partir de l'appartenance de la session, jamais d'un paramètre fourni par le client ; le sous-domaine ne sert qu'à la présélection |
| TEC-MT-07 | Un **test de CI** parcourt le catalogue de la base et échoue si une table avec `tenant_id` n'a pas la RLS forcée et une politique conforme |
| TEC-MT-08 | Une **suite de tests d'isolation** crée deux tenants et vérifie, pour chaque ressource exposée par l'API, qu'aucune lecture, écriture, recherche, export, fichier ou notification ne traverse la frontière |
| TEC-MT-09 | Fichiers : clé de stockage préfixée par `tenant_id`, URL signées de courte durée, contrôle d'accès vérifié avant la signature |
| TEC-MT-10 | Caches et files : toute clé de cache ou tâche porte le `tenant_id` ; le contexte est reposé à l'exécution des tâches |
| TEC-MT-11 | Les accès « support » de l'équipe plateforme exigent une justification, une durée limitée, sont en lecture seule par défaut et sont audités |

Exemple de gabarit (à reproduire par migration pour chaque table) :

```sql
CREATE TABLE project (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenant(id),
  program_id  uuid,
  code        text NOT NULL,
  name        text NOT NULL,
  status      text NOT NULL CHECK (status IN ('planned','active','suspended','closed','cancelled')),
  version     integer NOT NULL DEFAULT 1,
  created_at  timestamptz NOT NULL DEFAULT now(),
  created_by  uuid,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  updated_by  uuid,
  deleted_at  timestamptz,
  UNIQUE (tenant_id, id),
  UNIQUE (tenant_id, code),
  FOREIGN KEY (tenant_id, program_id) REFERENCES program (tenant_id, id)
);
ALTER TABLE project ENABLE ROW LEVEL SECURITY;
ALTER TABLE project FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON project
  USING      (tenant_id = current_setting('app.tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);
CREATE INDEX project_tenant_status_idx ON project (tenant_id, status);
```

### 3.4 Exigences du mode « base dédiée »

| ID | Exigence |
|---|---|
| TEC-DED-01 | Provisionnement automatisé : création de la base, rôles, migrations, secrets, enregistrement au registre |
| TEC-DED-02 | Orchestrateur de migrations : applique la même migration à toutes les bases, avec journal, reprise et retour arrière documenté ; version de schéma par tenant |
| TEC-DED-03 | Le code applicatif ne contient aucune condition « si dédié » : il obtient sa connexion via le registre (mode mutualisé = connexion partagée + RLS) |
| TEC-DED-04 | Clés de chiffrement et sauvegardes séparées par base ; restauration par tenant possible |
| TEC-DED-05 | Migration d'un tenant du mode mutualisé vers dédié par outil d'export/import validé (sans interruption longue) |

### 3.5 Exigences du mode « autohébergé » et licence

| ID | Exigence |
|---|---|
| TEC-SH-01 | Livrables : images de conteneurs signées, `docker-compose` de référence, chart Helm, documentation d'installation, de sauvegarde, de mise à jour et de restauration |
| TEC-SH-02 | Composants : API, tâches (worker), frontend statique, PostgreSQL, stockage objet (MinIO ou disque), relais SMTP, antivirus optionnel, Chromium pour les PDF |
| TEC-SH-03 | Variable `DEPLOYMENT_MODE=single_tenant` : un seul tenant, plan de contrôle réduit, console plateforme désactivée |
| TEC-SH-04 | **Aucun appel sortant obligatoire** (pas de « phone-home »). Télémétrie anonyme **désactivée par défaut**, activable par l'administrateur |
| TEC-SH-05 | Mises à jour : canaux (stable, correctifs de sécurité), notes de version, migrations automatiques avec sauvegarde préalable obligatoire, compatibilité ascendante sur N-1 |
| TEC-SH-06 | Support : paquet de diagnostic exportable (sans données personnelles) pour dépannage |

**Spécification de licence**

| Élément | Exigence |
|---|---|
| Format | Fichier signé (Ed25519) contenant : identifiant client, tenant autorisé, modules, plafonds (utilisateurs, enregistrements), dates de début et de fin, niveau de support, version minimale/maximale |
| Vérification | Hors ligne, par clé publique embarquée ; la clé privée n'est jamais dans le dépôt ni dans l'image |
| Expiration | Période de grâce de 30 jours avec bandeau d'alerte ; ensuite **lecture seule** et export disponible ; **aucune destruction ni verrouillage des données** |
| Renouvellement | Dépôt d'un nouveau fichier depuis l'interface, sans redémarrage |
| Altération | Détection de signature invalide, horloge anormale (retour arrière) ; journalisation et mode dégradé, jamais de suppression de données |
| Abstraction | Un **moteur de droits (entitlements)** unique : en SaaS les droits viennent de l'abonnement ; en autohébergé, de la licence. Le code métier interroge uniquement `entitlements.has('module.cases')` ou `entitlements.limit('users')` |

> Une licence logicielle n'empêche pas totalement la copie par un client déterminé ; elle sert de cadre contractuel et d'outil de gestion. Le contrat doit compléter la protection technique.

---

## 4. Conventions de données

### 4.1 Règles générales

| ID | Règle |
|---|---|
| TEC-DB-01 | Noms de tables et colonnes en anglais `snake_case`, singulier ; libellés français par i18n |
| TEC-DB-02 | Clés primaires `uuid` (v7 si disponible, sinon v4) ; jamais d'identifiants séquentiels exposés |
| TEC-DB-03 | Colonnes communes : `tenant_id`, `created_at`, `created_by`, `updated_at`, `updated_by`, `version` (concurrence optimiste), `deleted_at` (suppression logique là où requis) |
| TEC-DB-04 | Montants : `numeric(19,4)` + `currency char(3)` (ISO 4217). Jamais de flottants |
| TEC-DB-05 | Dates calendaires : `date` ; instants : `timestamptz` en UTC ; fuseau de l'association pour l'affichage |
| TEC-DB-06 | Statuts : `text` + contrainte `CHECK` ou type énuméré ; transitions validées par la couche métier et testées |
| TEC-DB-07 | JSONB uniquement pour : champs personnalisés validés par définition, paramètres, charges d'événements. Jamais pour des relations |
| TEC-DB-08 | Relations polymorphes (`entity_type`, `entity_id`) **uniquement** pour documents, commentaires, étiquettes, audit ; sinon clés étrangères explicites |
| TEC-DB-09 | Index : toute clé étrangère et tout filtre fréquent ; index composites commençant par `tenant_id` |
| TEC-DB-10 | Migrations : SQL versionné, à sens unique avec procédure de retour documentée, revue humaine obligatoire pour RLS, index volumineux, réécritures de données |
| TEC-DB-11 | Pas de logique métier dans les déclencheurs, sauf audit et colonnes calculées |
| TEC-DB-12 | Colonnes générées pour valeurs dérivées simples (ex. niveau de risque = probabilité × impact) |

### 4.2 Catalogue des tables R1 (colonnes clés ; toutes avec les colonnes communes)

**Plan de contrôle** : `tenant_registry(id, slug uk, name, mode, region, db_ref, status)`, `tenant_domain`, `plan`, `plan_entitlement`, `subscription(tenant_id, plan_id, status, period)`, `license_record`, `platform_admin`, `support_access_grant`.

**Identité et accès** : `user_account(id, email uk, locale, status)`, `user_credential(user_id, type, secret_hash)`, `mfa_factor`, `user_session`, `membership(tenant_id, user_id, status, party_id)`, `role(tenant_id, code, system)`, `permission(code)`, `role_permission`, `membership_role(membership_id, role_id, valid_from, valid_to)`, `invitation`, `api_key` (R2).

**Parties** : `party(kind: person|organization)`, `person(party_id, first_name, last_name, birth_date, gender_code, language)`, `organization(party_id, legal_name, registration_no)`, `contact_point(party_id, kind, value, is_primary)`, `address`.

**Structure** : `org_unit(parent_id, name, type, head_party_id)`, `position`, `staff_profile(party_id, position_id, org_unit_id, contract_type, start, end)`, `staff_absence`.

**Configuration** : `tenant_setting`, `tenant_module(module, enabled)`, `vocabulary_override`, `lookup_list`, `lookup_value`, `custom_field_def(entity, key, type, rules, visibility)`, `numbering_sequence`, `document_template`.

**Workflows** : `workflow_def(entity, rules)`, `approval_request(entity_type, entity_id, status)`, `approval_step`, `approval_decision`.

**Transversal** : `document`, `document_version`, `document_link`, `audit_log` (append-only, partitionné par mois), `comment`, `notification`, `notification_pref`, `tag`, `tagging`, `saved_view`, `import_job`, `export_job`, `report_run`, `outbox_event`.

**Stratégie et projets** : `strategic_axis`, `portfolio`, `program`, `project(code, program_id, manager_party_id, status, start, end, ...)`, `project_member(project_id, party_id, raci, allocation_pct)`, `result_node(project_id, parent_id, level: impact|outcome|output, name)`, `plan_item(project_id, parent_id, type: phase|activity|task|milestone|deliverable, wbs, start, end, progress, status, assignee_party_id, result_node_id)`, `plan_dependency(predecessor_id, successor_id, type, lag_days)`, `baseline`, `baseline_item`, `raid_item(type: risk|issue|assumption|dependency, probability, impact, level GENERATED, owner)`, `decision_log`, `change_request`, `status_report`, `lesson_learned`, `project_template`, `project_partner`.

**Finances de projet** : `currency`, `exchange_rate`, `budget(project_id)`, `budget_version(budget_id, number, status)`, `budget_line(version_id, category_code, amount)`, `expense(project_id, date, amount, currency, vendor, status)`, `expense_allocation(expense_id, project_id, budget_line_id, amount)`, `expense_attachment` (via `document_link`).

**Personnes accompagnées** : `beneficiary_profile(party_id, status, intake_date, situation jsonb, custom jsonb)`, `household`, `household_member(household_id, party_id, role)`, `consent_purpose`, `consent_record(party_id, purpose_id, version, status, given_at, withdrawn_at, mode)`, `program_enrollment(party_id, program_id|project_id, role, start, end)`, `service_type`, `service_delivery(party_id, service_type_id, project_id, date, provider_party_id)`, `duplicate_candidate`, `merge_log`.

**Formation** : `training_program`, `learning_path`, `course`, `course_module`, `lesson`, `trainer_profile(party_id, skills)`, `trainer_availability`, `cohort`, `training_session(course_id, cohort_id, capacity, status, project_id)`, `session_occurrence(session_id, start, end, location)`, `session_trainer`, `eligibility_rule`, `enrollment(session_id, party_id, status, source)`, `attendance(occurrence_id, enrollment_id, status)`, `assessment_def`, `assessment_result`, `lesson_progress`, `certificate_template`, `certificate(number uk, enrollment_id, status)`, `session_feedback`, `public_registration(session_id, token, payload, status)`.

**Suivi de cas** : `case_type`, `case_file(party_id|household_id, type_id, status, confidentiality, opened_at, closed_at)`, `case_team_member`, `assessment_template`, `case_assessment`, `service_plan`, `plan_goal`, `plan_action`, `case_note(case_id, author, occurred_at, body_encrypted, locked_at)`, `case_note_addendum`, `referral`, `safeguarding_flag`, `case_access_log`, `break_glass_grant(case_id, user_id, reason, expires_at)`.

**Indicateurs** : `indicator(level, unit, method, owner)`, `indicator_target(indicator_id, scope, baseline, target, period)`, `indicator_value(target_id, period, value, source, collected_by)`, `disaggregation_dimension`, `disaggregation_value`, `reached_person(project_id, party_id, first_date)` (vue matérialisée).

---

## 5. API

| ID | Exigence |
|---|---|
| TEC-API-01 | REST JSON, préfixe `/api/v1`, ressources au pluriel, JSON en `camelCase`, dates ISO 8601 |
| TEC-API-02 | **OpenAPI 3.1** généré et publié ; **vérification de compatibilité en CI** (rupture de contrat = échec) |
| TEC-API-03 | Pagination **par curseur** par défaut, limite maximale 100, tri et filtres standardisés (`filter[...]`, `sort`, `fields`) |
| TEC-API-04 | Erreurs au format **RFC 9457** (`application/problem+json`) avec code applicatif stable, identifiant de requête, messages localisables |
| TEC-API-05 | Concurrence optimiste : `ETag` / `If-Match` sur les mises à jour (colonne `version`) ; conflit = 412 |
| TEC-API-06 | Idempotence : en-tête `Idempotency-Key` sur les créations sensibles (dépenses, inscriptions, paiements) |
| TEC-API-07 | Limitation de débit par utilisateur et par tenant, en-têtes de quota |
| TEC-API-08 | Toute entrée validée par les schémas Zod ; rejet des champs inconnus ; taille maximale des corps de requête |
| TEC-API-09 | Opérations longues (imports, exports, rapports) : 202 + ressource de suivi + notification ; jamais de requête de plus de 30 s |
| TEC-API-10 | **Webhooks** signés (HMAC), avec relances exponentielles (R2) ; journal des livraisons |
| TEC-API-11 | Versionnement : changements compatibles dans `v1` ; rupture = `v2` avec période de coexistence de 6 mois minimum |
| TEC-API-12 | L'API interne (utilisée par le frontend) et l'API publique (R2+) partagent le même contrat ; la seconde expose un sous-ensemble documenté |

---

## 6. Sécurité

### 6.1 Authentification et sessions

| ID | Exigence |
|---|---|
| TEC-SEC-01 | Mots de passe : Argon2id (paramètres documentés et réévalués annuellement), longueur minimale 12, vérification contre les mots de passe compromis connus, aucune règle de composition arbitraire |
| TEC-SEC-02 | MFA par TOTP ; clés d'accès WebAuthn ; codes de secours chiffrés ; MFA **obligatoire** pour les rôles `admin`, `case_supervisor`, `finance_manager` et `platform_admin` |
| TEC-SEC-03 | Sessions serveur en base, cookie `HttpOnly`, `Secure`, `SameSite=Lax` ; rotation à la connexion et à l'élévation de privilège ; expiration inactive (30 min pour les rôles de cas) ; révocation à distance |
| TEC-SEC-04 | Protection CSRF (jeton synchronisé ou en-tête personnalisé) sur toute requête modifiante |
| TEC-SEC-05 | Verrouillage progressif et limitation de débit sur connexion, réinitialisation et invitation ; messages uniformes (pas d'énumération de comptes) |
| TEC-SEC-06 | Jetons de réinitialisation et d'invitation à usage unique, courte durée, stockés hachés |

### 6.2 Autorisation

| ID | Exigence |
|---|---|
| TEC-AUZ-01 | Toute route est protégée par défaut ; l'absence d'annotation de permission fait échouer le démarrage et la CI |
| TEC-AUZ-02 | Les décisions d'accès passent par une couche de politiques unique : permission du rôle **et** portée de l'objet (projet, équipe de dossier, confidentialité) |
| TEC-AUZ-03 | Contrôle d'accès au niveau objet vérifié à chaque lecture (jamais seulement à la liste) ; protection contre les références d'objets directes non autorisées |
| TEC-AUZ-04 | Séparation des tâches : l'auteur d'une dépense ou d'un changement ne peut pas l'approuver |
| TEC-AUZ-05 | Les champs sensibles (voir 6.3) sont filtrés par rôle dans les réponses et dans les exports |
| TEC-AUZ-06 | Matrice de permissions testée automatiquement : chaque rôle × chaque ressource × chaque action |

### 6.3 Protection des données

| ID | Exigence |
|---|---|
| TEC-DAT-01 | Chiffrement en transit : TLS 1.2 minimum (1.3 préféré), HSTS ; chiffrement au repos pour base, stockage objet et sauvegardes (KMS en SaaS ; chiffrement de disque ou de volume en autohébergé) |
| TEC-DAT-02 | **Chiffrement au niveau du champ** pour le contenu des notes de cas et des évaluations sensibles : chiffrement par enveloppe, clé de données par tenant, clé maître en KMS ; rotation documentée |
| TEC-DAT-03 | Les données personnelles n'apparaissent **jamais** dans les journaux applicatifs, les traces ni les messages d'erreur (masquage systématique) |
| TEC-DAT-04 | Secrets dans un gestionnaire de secrets ; aucun secret dans le dépôt, les images ou les variables d'environnement en clair en production |
| TEC-DAT-05 | Exports : journalisés, signés par l'utilisateur, limités par permission, fichiers à durée de vie courte |
| TEC-DAT-06 | Conservation : politiques par type de données, purge ou anonymisation planifiée et tracée ; suppression logique distincte de la destruction effective |
| TEC-DAT-07 | Environnements hors production : **uniquement des données synthétiques** ; jamais de copie de production |
| TEC-DAT-08 | Téléversements : liste blanche de types, limite de taille, analyse antivirus avant mise à disposition, noms de fichiers normalisés, jamais de service direct depuis le domaine applicatif sans en-têtes de protection |

### 6.4 Sécurité applicative et chaîne d'approvisionnement

| ID | Exigence |
|---|---|
| TEC-APP-01 | Référentiel de contrôles : **OWASP ASVS niveau 2** comme liste de vérification ; OWASP Top 10 couvert par des tests |
| TEC-APP-02 | En-têtes : CSP stricte, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, anti-clickjacking |
| TEC-APP-03 | Analyse de dépendances et de licences à chaque PR ; **liste blanche de paquets** pour les nouvelles dépendances (revue humaine) ; fichier de verrouillage obligatoire ; SBOM généré à chaque version |
| TEC-APP-04 | Analyse statique (SAST), détection de secrets et analyse d'images de conteneurs en CI ; échec bloquant sur gravité élevée ou critique |
| TEC-APP-05 | Modélisation des menaces par module sensible (authentification, cas, fichiers, licence) avant implémentation ; mise à jour à chaque changement majeur |
| TEC-APP-06 | Test d'intrusion externe avant la mise en production et à chaque version majeure ; programme de divulgation responsable publié |
| TEC-APP-07 | Journal d'audit : chaîné ou signé périodiquement, stockage en ajout seul, conservation minimale de 7 ans pour les journaux financiers et d'accès aux cas (à ajuster par politique) |
| TEC-APP-08 | Plan de réponse aux incidents, registre des incidents de confidentialité, procédure de notification (voir section 7) |

---

## 7. Confidentialité et conformité (Canada)

| ID | Exigence | Référence |
|---|---|---|
| TEC-PRV-01 | Hébergement primaire dans une **région canadienne** ; les sous-traitants (courriel, paiement, support) listés, localisés et couverts par entente | Loi 25, LPRPDE |
| TEC-PRV-02 | **Réplication ou sauvegarde hors du Québec** pour des tenants québécois : désactivée par défaut, activable seulement après analyse (EFVP) ; sauvegardes multi-zones dans la région par défaut | Loi 25 |
| TEC-PRV-03 | Registre des incidents de confidentialité et workflow de notification (organisme de réglementation et personnes concernées lorsque le risque de préjudice sérieux est présent) | Loi 25, LPRPDE |
| TEC-PRV-04 | Outils de **droits des personnes** : accès, rectification, retrait de consentement, portabilité (format structuré et lisible par machine), anonymisation | Loi 25 |
| TEC-PRV-05 | Consentement : texte versionné, preuve, par finalité, retrait respecté **techniquement** (filtrage des usages concernés) | Loi 25 |
| TEC-PRV-06 | Documentation fournie aux clients : description des flux de données, sous-traitants, mesures de sécurité, modèle d'EFVP, contrat de traitement | Loi 25 |
| TEC-PRV-07 | Pas de profilage ni de décision automatisée sur les personnes accompagnées en R1 | Loi 25 |
| TEC-PRV-08 | Accessibilité : **WCAG 2.1 AA** vérifié par outils automatiques et revue manuelle (clavier, lecteur d'écran) ; déclaration d'accessibilité publiée | Accessibilité Ontario / fédéral |
| TEC-PRV-09 | Langues : toutes les chaînes externalisées FR et EN ; formats de date, nombre et devise selon la langue ; courriels et documents générés bilingues | Marché Canada |
| TEC-PRV-10 | Reçus fiscaux (R2) : numérotation unique sans trou, champs obligatoires de l'ARC, immuabilité, annulation par reçu de remplacement | Voir 03 |

> Ces exigences sont techniques, non juridiques. Un conseiller juridique doit valider les engagements contractuels et les textes avant la mise en production.

---

## 8. Frontend

| ID | Exigence |
|---|---|
| TEC-UI-01 | Système de design unique (jetons de couleur, typographie, espacements) ; composants accessibles réutilisables dans `packages/ui` ; thème clair et sombre prévu |
| TEC-UI-02 | Internationalisation : toutes les chaînes dans des fichiers de ressources ; clés stables ; pluriels ; vérification CI qu'aucune clé FR ou EN ne manque |
| TEC-UI-03 | État serveur géré par TanStack Query (cache, invalidation) ; état local minimal ; aucune donnée sensible persistée dans le stockage du navigateur |
| TEC-UI-04 | Formulaires : schémas Zod partagés avec l'API ; erreurs au champ ; enregistrement automatique de brouillons pour les formulaires longs |
| TEC-UI-05 | Performance : budget de poids par route, découpage du code par module, LCP < 2,5 s sur connexion 4G type, interactions < 200 ms |
| TEC-UI-06 | Gantt et Kanban : composants isolés, accessibles au clavier ; la bibliothèque Gantt est choisie après un **spike** de 2 jours (critères : licence permissive, dépendances typées, accessibilité, performance à 1 000 éléments) ; repli sur une chronologie maison |
| TEC-UI-07 | Responsive : les parcours « présences », « notes de cas » et « saisie de dépense » doivent être utilisables sur téléphone |
| TEC-UI-08 | Gestion des erreurs : états vide, chargement, erreur réseau, refus d'accès sur chaque écran ; reprise après perte de connexion |
| TEC-UI-09 | Tests de composants et tests de bout en bout (Playwright) sur les parcours critiques ; tests d'accessibilité automatisés intégrés |
| TEC-UI-10 | Aucune dépendance à un CDN externe en production (autohébergé possible) ; polices et ressources servies par l'application |

---

## 9. Fichiers, documents, rapports, courriels

| ID | Exigence |
|---|---|
| TEC-DOC-01 | Téléversement direct vers le stockage par URL signée ; métadonnées créées à la confirmation ; statut `quarantine` jusqu'au résultat de l'antivirus |
| TEC-DOC-02 | Versions : toute modification crée une version ; restauration possible ; suppression logique puis purge selon la conservation |
| TEC-DOC-03 | Aperçu de PDF et d'images ; extraction de texte pour la recherche (documents non sensibles) |
| TEC-DOC-04 | Rapports : modèles HTML versionnés, rendu PDF par la tâche dédiée, nom de fichier normalisé, filigrane de confidentialité configurable |
| TEC-DOC-05 | Courriels : abstraction SMTP ; SES en SaaS ; modèles bilingues versionnés ; DKIM/SPF/DMARC ; désabonnement et préférences ; file d'envoi avec relances |
| TEC-DOC-06 | Exports volumineux : générés par tâche, stockés temporairement, lien de téléchargement signé et expirant |

---

## 10. Tâches asynchrones, événements, notifications

| ID | Exigence |
|---|---|
| TEC-JOB-01 | Toute tâche est idempotente, identifiée, reprenable, avec délai maximal et relances exponentielles ; file des échecs surveillée |
| TEC-JOB-02 | Motif **outbox** : les événements métier sont écrits dans la même transaction que la donnée, puis publiés ; les modules communiquent par événements internes, pas par accès croisé aux tables |
| TEC-JOB-03 | Tâches récurrentes : rappels d'échéance, résumés quotidiens, purge selon conservation, recalcul des vues matérialisées, expiration des accès exceptionnels |
| TEC-JOB-04 | Notifications : modèle unique (événement → règles → canaux), préférences par utilisateur, regroupement en résumés |
| TEC-JOB-05 | Aucune tâche ne s'exécute sans restaurer le contexte du tenant ; test dédié |

---

## 11. Observabilité, exploitation, continuité

### 11.1 Objectifs de service (SLO)

| Indicateur | Cible R1 | Cible visée |
|---|---|---|
| Disponibilité mensuelle | 99,5 % | 99,9 % |
| Latence API (p95) lectures / écritures | < 300 ms / < 600 ms | < 200 ms / < 400 ms |
| Latence des listes volumineuses (p95) | < 800 ms | < 500 ms |
| RPO (perte de données maximale) | ≤ 15 min | ≤ 5 min |
| RTO (rétablissement) | ≤ 4 h | ≤ 1 h |
| Délai de livraison des courriels transactionnels (p95) | < 2 min | < 1 min |
| Délai de correction d'une faille critique | ≤ 72 h | ≤ 24 h |

### 11.2 Exigences

| ID | Exigence |
|---|---|
| TEC-OPS-01 | Journaux JSON structurés avec identifiant de requête, de tenant (pseudonymisé) et d'utilisateur (pseudonymisé) ; aucune donnée personnelle |
| TEC-OPS-02 | Traces distribuées (OpenTelemetry) sur API, tâches et accès aux données ; métriques métier et techniques |
| TEC-OPS-03 | Alertes sur les SLO, les taux d'erreur, la saturation de la base, les files, les échecs d'antivirus et de sauvegarde ; astreinte documentée |
| TEC-OPS-04 | Sauvegardes : restauration à un instant donné (PITR) de la base, sauvegardes quotidiennes versionnées du stockage, copie chiffrée ; **test de restauration trimestriel** consigné |
| TEC-OPS-05 | Plan de reprise après sinistre documenté et exercé annuellement ; exigences de résidence respectées (voir TEC-PRV-02) |
| TEC-OPS-06 | Page d'état publique et procédure de communication d'incident |
| TEC-OPS-07 | Gestion de capacité : tests de charge avant chaque jalon (cible R1 : 200 tenants, 2 000 utilisateurs, 50 requêtes/s soutenues, marge ×10 par conception) |
| TEC-OPS-08 | Partitionnement des tables volumineuses (`audit_log`, `notification`) et archivage planifié |

---

## 12. Infrastructure, CI/CD, livraison

| ID | Exigence |
|---|---|
| TEC-INF-01 | Environnements : développement local (conteneurs), intégration continue, préproduction (identique à la production), production ; données synthétiques hors production |
| TEC-INF-02 | Infrastructure décrite en code, revue par PR, état distant verrouillé ; aucun changement manuel en production |
| TEC-INF-03 | Pipeline : vérification (format, lint, types), tests unitaires et d'intégration, tests d'isolation, tests de contrat OpenAPI, tests E2E de fumée, analyses de sécurité, construction d'images signées, déploiement automatisé en préproduction |
| TEC-INF-04 | Production : déploiement progressif avec retour arrière automatisé, migrations exécutées avant la bascule avec contrôle de compatibilité (« expand/contract ») |
| TEC-INF-05 | Fonctionnalités activables par indicateurs ; chaque indicateur a un propriétaire et une date de retrait |
| TEC-INF-06 | Réseau : base non exposée publiquement, sous-réseaux privés, WAF, limitation de débit en bordure, accès d'administration par bastion avec MFA |
| TEC-INF-07 | Gestion des coûts : étiquettes par environnement, budgets et alertes |
| TEC-INF-08 | Paquet autohébergé produit par le même pipeline que le SaaS ; test d'installation et de mise à jour automatisé à chaque version |

---

## 13. Qualité et tests

| ID | Exigence |
|---|---|
| TEC-QA-01 | **Pyramide** : unitaires (logique métier, politiques), intégration (API + base réelle PostgreSQL en conteneur), E2E (parcours critiques) |
| TEC-QA-02 | **Tests d'isolation inter-tenants** obligatoires pour toute nouvelle ressource (voir TEC-MT-08) ; échec de CI si une ressource exposée n'est pas couverte |
| TEC-QA-03 | **Tests de matrice de permissions** générés à partir de la définition des rôles |
| TEC-QA-04 | **Tests de machines à états** : chaque transition autorisée et chaque transition interdite |
| TEC-QA-05 | Couverture minimale : 85 % des lignes sur la logique métier et les politiques ; 100 % des branches des politiques d'accès et de la licence ; pas de baisse de couverture par PR |
| TEC-QA-06 | Tests d'accessibilité automatisés sur chaque écran + revue manuelle par jalon |
| TEC-QA-07 | Tests de charge et de régression de performance avant chaque jalon ; budgets de requêtes (pas de requêtes N+1 : alerte de CI) |
| TEC-QA-08 | Tests de migration : application sur une base contenant des données synthétiques volumineuses ; retour arrière testé |
| TEC-QA-09 | Jeux de données synthétiques réalistes bilingues (associations fictives de 3 types) versionnés |
| TEC-QA-10 | Revue d'architecture à chaque jalon (respect des frontières de modules, absence de dépendances circulaires, vérifié par outil) |

---

## 14. Développement assisté par IA (Claude Code ou équivalent)

> Objectif : tirer parti de la vitesse de l'assistant sans perdre la maîtrise de l'architecture, de la sécurité ni de la qualité. L'assistant exécute ; **le porteur décide et valide**. Vérifier dans la documentation de l'outil utilisé (pour Claude Code : https://docs.claude.com/en/docs/claude-code/overview) les fonctions disponibles (fichier de mémoire du projet, modes de planification, sous-agents, crochets, serveurs MCP).

### 14.1 Cadre de travail

| ID | Exigence |
|---|---|
| TEC-AI-01 | **Spécification d'abord** : chaque tâche part d'un fichier `docs/specs/<module>/<fonction>.md` (user story, critères d'acceptation, modèle de données, contrat d'API, écrans, tests attendus). Les cahiers de ce dépôt sont la source ; l'assistant ne **crée pas d'exigences** |
| TEC-AI-02 | **Fichier de conventions du projet** à la racine (pour Claude Code : `CLAUDE.md`) décrivant l'architecture, les commandes, les conventions, les interdits et la définition de « terminé » (contenu minimal en 14.2) |
| TEC-AI-03 | **Tranches verticales** : une tâche = une fonctionnalité de bout en bout (migration, API, test, écran), réalisable en une journée, PR de moins de 400 lignes modifiées hors fichiers générés |
| TEC-AI-04 | **Plan avant code** : l'assistant propose un plan (fichiers, tests, risques) ; le porteur l'approuve pour toute tâche touchant sécurité, données ou architecture |
| TEC-AI-05 | **Tests d'abord** pour la logique métier, les politiques d'accès et les transitions d'état ; l'assistant écrit le test qui échoue, puis le code |
| TEC-AI-06 | Une commande unique `pnpm verify` exécute : format, lint, types, tests unitaires et d'intégration, tests d'isolation, contrôle des migrations RLS, compatibilité OpenAPI, analyses de sécurité. **Aucun merge si elle échoue** |
| TEC-AI-07 | **Règles d'architecture automatisées** (frontières de modules, interdiction d'accès direct entre tables de modules, interdiction de SQL brut hors dossiers autorisés) vérifiées par outil dans `verify` |
| TEC-AI-08 | **Revue humaine obligatoire** pour : authentification, autorisation et politiques, migrations RLS et tout SQL brut, chiffrement et gestion de clés, licence et facturation, traitement de fichiers, nouvelles dépendances, infrastructure, tout code touchant les dossiers de cas |
| TEC-AI-09 | **Données synthétiques seulement** dans les invites, les journaux et les jeux de test ; aucun secret ni donnée réelle fournis à l'assistant |
| TEC-AI-10 | **Journal de décisions** (ADR) mis à jour par l'assistant sur instruction du porteur ; toute dérogation à une règle est écrite, datée et justifiée |
| TEC-AI-11 | **Vérification des dépendances proposées** : nom exact, ancienneté, licence, mainteneurs ; refus des paquets inconnus ou non vérifiés (risque de paquets inventés ou usurpés) |
| TEC-AI-12 | Les invites répétitives (nouvelle ressource, nouvel écran, nouvelle machine à états) sont **versionnées** comme modèles dans `docs/prompts/` pour garantir l'homogénéité |
| TEC-AI-13 | Le porteur relit chaque jalon avec une **liste de vérification** : isolation, permissions, audit, accessibilité, bilinguisme, performances, documentation à jour |

### 14.2 Contenu minimal du fichier de conventions du projet
1. Résumé du produit et des modules (un paragraphe) et liens vers les deux cahiers.
2. Carte du dépôt (dossiers, rôle de chacun) et frontières de modules.
3. Commandes : installation, démarrage local, tests, `pnpm verify`, génération du client d'API, migrations.
4. Conventions : nommage, structure d'un module (contrôleur, service, dépôt, politiques, schémas, tests), gestion d'erreurs, journalisation sans données personnelles, i18n obligatoire.
5. **Règles non négociables** : jamais d'accès à la base hors du gabarit qui pose le contexte de tenant ; toute table a `tenant_id` + RLS ; aucune donnée personnelle dans les journaux ; pas de dépendance non approuvée ; pas de secret dans le code ; chaque route a une permission.
6. Définition de « terminé » (voir 14.3).
7. Quand demander au porteur plutôt que décider (ambiguïté d'exigence, sécurité, coût, nouvelle dépendance, changement de contrat d'API).

### 14.3 Définition de « terminé » (DoD)
- Critères d'acceptation de la spécification satisfaits et démontrés.
- Tests écrits et verts (unitaires, intégration, isolation, permissions, accessibilité).
- `pnpm verify` vert ; couverture non réduite.
- Migrations relues ; retour arrière documenté.
- Chaînes FR et EN présentes.
- Journal d'audit alimenté pour les actions concernées.
- Documentation à jour (spécification, ADR, contrat d'API).
- Déployé en préproduction par le pipeline.

### 14.4 Risques propres au développement assisté par IA et parades

| Risque | Parade |
|---|---|
| Incohérence des motifs d'un module à l'autre | Modèles d'invites, règles d'architecture automatisées, revue de jalon |
| Tests qui valident le code plutôt que l'exigence | Tests dérivés des critères d'acceptation ; relecture humaine des tests de sécurité |
| Faille subtile d'autorisation ou d'isolation | Revue humaine obligatoire, tests d'isolation et de matrice générés, test d'intrusion |
| Dépendances inventées ou malveillantes | Liste blanche, vérification manuelle, analyse de la chaîne d'approvisionnement |
| Dérive de périmètre (« fonctionnalités bonus ») | Spécification d'abord, interdiction d'ajouter des exigences, revue de PR |
| Dette de documentation | La documentation fait partie de la définition de « terminé » |
| Confidentialité des données dans les invites | Données synthétiques seulement ; aucun secret ; politique écrite |
| Dépendance à un seul outil | Spécifications, ADR et conventions rédigées en texte brut, indépendantes de l'outil |

---

## 15. Plan de livraison technique

| Étape | Contenu | Sortie |
|---|---|---|
| **M0 — Fondations** (2 à 3 semaines) | Monorepo, CI/CD, infrastructure de base en code, gabarit de module, authentification, tenant et appartenances, RLS et tests d'isolation, journal d'audit, i18n, système de design, fichier de conventions, spikes (Gantt, PDF) | Une « tranche verticale » complète déployée en préproduction (création de compte → connexion → créer une ressource isolée) |
| **M1 — Noyau et projets** | CORE, ORG, PRJ, FIN-LITE, documents, notifications, console plateforme minimale | Voir cahier fonctionnel, section 4 |
| **M2 — Personnes et formation** | PEO, HR, FOR, formulaire public, import | Idem |
| **M3 — Cas, impact, durcissement** | CAS (chiffrement par champ, bris de glace), IND, rapports, tableaux de bord, facturation, test d'intrusion, tests de charge, sauvegardes testées, paquet autohébergé alpha | Porte de mise en production (cahier fonctionnel, section 4) |
| **R2** | Financement, QuickBooks Online, OIDC, API publique, mode autohébergé général | |

---

## 16. Exigences non fonctionnelles (récapitulatif chiffré)

| Catégorie | Exigence | Cible R1 |
|---|---|---|
| Disponibilité | Disponibilité mensuelle | 99,5 % |
| Continuité | RPO / RTO | ≤ 15 min / ≤ 4 h |
| Performance | p95 lectures / écritures | < 300 ms / < 600 ms |
| Performance | Chargement initial (LCP) | < 2,5 s |
| Capacité | Tenants / utilisateurs / débit | 200 / 2 000 / 50 req/s (marge ×10) |
| Sécurité | Isolation inter-tenants | 0 fuite ; tests en CI à chaque déploiement |
| Sécurité | Faille critique | correction ≤ 72 h |
| Confidentialité | Données de cas | Chiffrement par champ, accès par équipe, audit |
| Accessibilité | Norme | WCAG 2.1 AA |
| Langues | Interface et documents | FR et EN complets |
| Qualité | Couverture logique métier | ≥ 85 % |
| Portabilité | Export des données d'un tenant | Format ouvert, ≤ 30 jours (outil libre-service) |
| Exploitation | Test de restauration | Trimestriel, consigné |
| Déploiement | Modes pris en charge | Mutualisé en R1 ; dédié et autohébergé structurés dès M0, livrés en R2 |

---

## 17. Liste de vérification avant mise en production

- [ ] Suite d'isolation inter-tenants verte sur toutes les ressources
- [ ] RLS forcée sur 100 % des tables avec `tenant_id` (contrôle automatique)
- [ ] MFA obligatoire pour les rôles sensibles
- [ ] Chiffrement par champ vérifié sur les notes de cas ; rotation de clés testée
- [ ] Test d'intrusion terminé ; aucune anomalie critique ou élevée ouverte
- [ ] Restauration de sauvegarde testée et consignée
- [ ] Journaux exempts de données personnelles (échantillonnage vérifié)
- [ ] Accessibilité WCAG 2.1 AA vérifiée sur les parcours clés
- [ ] FR et EN complets, y compris courriels et PDF
- [ ] Politique de confidentialité, conditions d'utilisation, contrat de traitement et EFVP type publiés
- [ ] Registre des incidents et procédure de notification en place
- [ ] Page d'état, alertes, astreinte et procédure d'incident prêtes
- [ ] Licence et droits (entitlements) testés, y compris l'expiration en lecture seule
- [ ] Plan de reprise après sinistre exercé
