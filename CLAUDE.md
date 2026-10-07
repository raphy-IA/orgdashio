# CLAUDE.md — Directives & Conventions de Développement OrgDashio

## 1. Présentation du produit & Architecture
**OrgDashio** est une plateforme SaaS multi-tenant intégrée pour la gestion des organismes à but non lucratif et associations (projets, bénéficiaires, formations, suivi de cas, indicateurs, finances).
- **Documents de référence** :
  - `document/01-cahier-des-charges-fonctionnel_rev.md`
  - `document/02-exigences-techniques.md`
  - `document/04-orientations-et-decision.md`

- **Pile technique** :
  - **Monorepo** : `pnpm` workspace + `Turborepo`
  - **Backend** : NestJS (`apps/api`), Node LTS, TypeScript
  - **Base de données & ORM** : PostgreSQL + **Drizzle ORM**
  - **Isolation multi-tenant** : Row-Level Security (RLS) native PostgreSQL via `tenant_id` sur chaque table métier, avec contexte par transaction (`SET LOCAL app.tenant_id = $1`)
  - **Authentification & Sessions** : Argon2id (`@node-rs/argon2`), sessions serveur en base (`user_session`), cookie `HttpOnly`, `Secure`, `SameSite=Lax`
  - **Frontend** : React + Vite + TanStack Query + React Hook Form + Zod + Tailwind CSS + Radix UI / shadcn (`apps/web` & `packages/ui`)
  - **Internationalisation** : `i18next` (FR/EN obligatoire dès le premier écran)

---

## 2. Carte du Dépôt & Frontières des Modules

```
OrgDashio/
├── apps/
│   ├── api/                     # API REST NestJS (Controllers, Services, RBAC, RLS Interceptors)
│   ├── web/                     # Frontend React + Vite
│   └── worker/                  # Executeur de tâches asynchrones (pg-boss, outbox)
├── packages/
│   ├── shared/                  # Drizzle Schema, Zod Schemas, Types, Client API généré
│   ├── ui/                      # Composants UI réutilisables, Tailwind Design System
│   └── config/                  # ESLint, Prettier, TypeScript shared configs
├── infra/                       # Docker Compose, scripts SQL RLS, seeds synthétiques
├── docs/                        # Spécifications, ADR, Prompts
│   ├── adr/                     # Architectural Decision Records
│   └── specs/                   # Spécifications par module
└── CLAUDE.md                    # Ce fichier
```

### Frontières de Modules :
- Aucun accès direct inter-tables métiers. Les modules communiquent via leurs services ou des événements `outbox`.
- `packages/shared` contient la source unique de vérité des types (Zod, Drizzle).

---

## 3. Commandes principales

```bash
# Installation des dépendances
pnpm install

# Développement local (API + Web)
pnpm dev

# Build de tous les paquets
pnpm build

# Commande de vérification CI/CD obligatoire (MUST BE GREEN BEFORE MERGE)
pnpm verify

# Tests unitaires et intégration
pnpm test

# Tests d'isolation inter-tenants RLS
pnpm test:isolation

# Contrôle strict du schéma RLS dans PostgreSQL
pnpm check:rls

# Migrations de base de données
pnpm db:generate
pnpm db:migrate
```

---

## 4. Conventions de Code & Modèles

### Nommage & Fichiers
- Fichiers et dossiers en `kebab-case` (`user-account.service.ts`, `tenant-context.interceptor.ts`).
- Classes et Interfaces en `PascalCase` (`UserAccountService`, `TenantContextInterceptor`).
- Variables et fonctions en `camelCase`.
- Tables et colonnes SQL en `snake_case` (anglais).

### Structure d'un module NestJS (`apps/api/src/modules/<module>/`)
- `<module>.module.ts`
- `<module>.controller.ts`
- `<module>.service.ts`
- `<module>.repository.ts` (utilisation de Drizzle ORM avec transaction `tenant_id`)
- `dto/` (schémas Zod provenant ou étendant `packages/shared`)
- `<module>.service.spec.ts` (tests unitaires / intégration)

---

## 5. Règles Absolues & Non Négociables 🛑

1. **Isolation RLS Obligatoire** :
   - Chaque table métier DOIT posséder `tenant_id uuid NOT NULL`.
   - Chaque table métier DOIT activer et forcer la RLS (`ENABLE ROW LEVEL SECURITY` et `FORCE ROW LEVEL SECURITY`).
   - AUCUNE requête SQL/Drizzle métier ne doit être exécutée hors du contexte de transaction posant `SET LOCAL app.tenant_id = $1`.

2. **Aucune donnée personnelle (PII) dans les logs** :
   - Ne jamais logger des adresses courriels, mots de passe, jetons, noms ou données de cas.
   - Utiliser la pseudonymisation ou des identifiants (ex: `user_id`, `tenant_id`).

3. **Sécurité & Authentification** :
   - Mots de passe hachés exclusivement avec **Argon2id**.
   - Toute route d'API doit posséder un décorateur d'authentification et de permission explicite (`@RequirePermission('project.read')`).
   - Aucun secret en dur dans le code (utiliser `.env` et gestionnaire de secrets).

4. **Spécification Avant Code** :
   - Ne jamais coder une fonctionnalité sans que son fichier `docs/specs/<module>/<feature>.md` ne soit rédigé et validé.

5. **Développement Assisté par IA & Garde-Fous** :
   - Uniquement des données synthétiques dans les tests et exemples.
   - Revue humaine obligatoire pour : Authentification, Autorisation, RLS, Chiffrement, Licence, Traitement de fichiers, Infrastructure.

6. **Internationalisation (i18n)** :
   - Aucun texte en dur dans le code frontend ou les courriels. Utiliser `i18next` (clés bilingues FR/EN).

---

## 6. Définition de « Terminé » (Definition of Done - DoD)

Une tranche ou tâche est considérée comme **Terminée** uniquement si :
- [ ] La spécification `docs/specs/<module>/<feature>.md` est rédigée et à jour.
- [ ] Les critères d'acceptation fonctionnels sont satisfaits et prouvés.
- [ ] Les tests unitaires, d'intégration et d'isolation inter-tenants sont écrits et passent à 100%.
- [ ] La commande `pnpm verify` s'exécute sans aucune erreur.
- [ ] La couverture de code sur la logique métier et les politiques est $\ge 85\%$.
- [ ] Les migrations SQL sont générées, relues et réversibles.
- [ ] Les clés de traduction FR et EN sont renseignées.
- [ ] Le journal d'audit est alimenté pour les actions de création, modification, suppression.

---

## 7. Quand demander clarification à l'utilisateur ?
Interrompez immédiatement l'exécution et posez une question à l'utilisateur si :
- Une exigence fonctionnelle est ambiguë ou contradictoire.
- Une décision touche à la sécurité fondamentale ou à la structure de licence.
- Une nouvelle dépendance externe non spécifiée semble nécessaire.
- Une modification du contrat d'API impacte d'autres modules.
