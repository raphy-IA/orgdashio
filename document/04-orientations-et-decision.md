# Orientations, analyses et décisions — Plateforme SaaS pour organismes et associations

**Version** 1.0 · **Date** 3 octobre 2026  
**Documents liés** `01-cahier-des-charges-fonctionnel.md`, `02-exigences-techniques.md`, `03-benchmark-et-tarification.md`

> Ce document synthétise les orientations stratégiques, les analyses et les décisions prises après revue des cahiers initiaux. Il complète et, sur certains points, affine les exigences fonctionnelles et techniques. Il doit être lu avant de lancer le développement.

---

## 1. Vision et positionnement

### 1.1 Vision produit

Une plateforme SaaS canadienne, bilingue (FR/EN), modulaire et configurable, permettant aux **organismes et associations de services** de :

- planifier et suivre leurs **programmes et projets** ;
- gérer les **personnes accompagnées** (bénéficiaires, participants) ;
- piloter des **formations** (catalogue, sessions, présences, certificats) ;
- assurer un **suivi de cas** sécurisé pour les activités sociales et d’accompagnement ;
- mesurer l’**impact** via des indicateurs et des rapports ;
- gérer les **budgets de projet**, les dépenses et les sources de financement.

La plateforme ne remplace pas un logiciel comptable complet, un LMS avancé ni un outil de gestion de stocks humanitaire. Elle se positionne comme un **système intégré de gestion de programmes, projets et services**, avec un fort accent sur la confidentialité, la conformité canadienne et l’ergonomie.

### 1.2 Segment initial

Le produit initial cible en priorité :

- organismes de formation et d’insertion ;
- organismes d’accompagnement des nouveaux arrivants ;
- organismes communautaires et sociaux de petite et moyenne taille ;
- ONG de services (sans dimension humanitaire complexe au départ).

Les **associations de membres** (cotisations, assemblées, gouvernance élective) et les **organismes humanitaires avancés** (stocks, distributions, hors-ligne, multi-pays) sont des segments ultérieurs (R3+).

### 1.3 Promesse de valeur

Pour les premiers clients, la plateforme doit démontrer :

1. Une capacité à **créer et suivre des projets** de bout en bout (cadre logique, planning, budget, indicateurs).
2. Une gestion unifiée des **personnes accompagnées** (profils, ménages, consentements, services, formations, historique).
3. Un module de **formation opérationnel** (sessions, présences, évaluations, certificats).
4. Un **suivi de cas sécurisé** pour les activités sensibles (équipe de dossier, confidentialité, audit).
5. Des **rapports et tableaux de bord** directement utilisables pour les bailleurs et la direction.

---

## 2. Périmètre R1 révisé : R1A et R1B

Conformément aux recommandations, le périmètre R1 est découpé en deux sous-ensembles :

### 2.1 R1A — MVP commercial utilisable

**Objectif** : livrer une version suffisante pour des pilotes réels dans des organismes de services.

**Modules inclus** :

- **CORE** : création d’association, utilisateurs, rôles, permissions, configuration, onboarding.
- **ORG** : structure organisationnelle légère (unités, postes, agents).
- **PRJ** : programmes, portefeuilles, projets, activités, tâches, jalons, dépendances, ligne de base, RAID, rapports d’avancement.
- **FIN-LITE** : budgets de projet, versions de budget, dépenses, validations, export comptable CSV.
- **PEO** : personnes (bénéficiaires, participants), ménages, consentements, services rendus, historique.
- **FOR** : catalogue de formation, sessions, présences, évaluations, certificats, formulaire public d’inscription.
- **IND** : indicateurs (définition, cibles, valeurs), tableaux de bord de base, rapports simples.
- **Documents, notifications, audit, imports/exports**.

**Hors R1A** :

- suivi de cas complet (CAS) ;
- chiffrement par champ des notes ;
- accès exceptionnel « bris de glace » ;
- facturation SaaS avancée ;
- autohébergement commercial ;
- subventions complètes ;
- bénévolat, membres, gouvernance CA, événements.

### 2.2 R1B — Fonctions sensibles et avancées

**Objectif** : enrichir le produit pour des contextes plus sensibles et des exigences de reporting plus fortes.

**Modules ajoutés** :

- **CAS** : suivi de cas complet (équipe de dossier, plans d’intervention, notes verrouillées, addenda, références, supervision, journal d’accès, bris de glace).
- **Chiffrement par champ** pour les notes et évaluations sensibles.
- **IND avancé** : désagrégation, bibliothèque d’indicateurs, rapports avancés.
- **Rapports et tableaux de bord** enrichis (direction, supervision de cas, indicateurs).
- **Facturation SaaS de base** (gestion des abonnements, factures manuelles, intégration paiement en « Should »).
- **Sécurité renforcée** : revue de sécurité, tests de charge, sauvegardes testées, durcissement général.
- **Paquet autohébergé alpha** (structurellement prêt, mais pas encore commercialisé).

**Décision** : R1A doit pouvoir être commercialisé et utilisé sans R1B. R1B est destiné à des pilotes spécialisés (travail social, accompagnement sensible) et à la consolidation avant une mise en production large.

---

## 3. Déploiement et modes d’hébergement

### 3.1 Modes de déploiement

Trois modes sont prévus dans l’architecture, mais avec un déploiement commercial progressif :

1. **SaaS mutualisé** (mode par défaut en R1)  
   - Base de données partagée avec isolation par ligne (RLS).  
   - Hébergement au Canada (région Montréal ou équivalent).  
   - Mode par défaut pour tous les nouveaux clients.

2. **Base dédiée** (R2)  
   - Une base PostgreSQL dédiée par client.  
   - Même code applicatif, orchestration des migrations sur plusieurs bases.  
   - Pour clients exigeant une isolation physique ou ayant des volumes importants.

3. **Autohébergé** (R3+, après validation du produit et du modèle de support)  
   - Instance mono-tenant chez le client.  
   - Licence signée, validation hors ligne, mises à jour par canal.  
   - Non commercialisé en R1 ; l’architecture doit néanmoins le prévoir dès M0.

### 3.2 Décision

- **R1** : seul le mode SaaS mutualisé est commercialisé.
- **R2** : ajout du mode base dédiée.
- **R3+** : autohébergement commercial, après validation du produit, du support et des processus de mise à jour.

L’architecture technique doit rester compatible avec les trois modes dès le départ (ADR-001 à ADR-004), mais l’effort de documentation, de support et de validation pour l’autohébergement est reporté.

---

## 4. Finances, subventions et comptabilité

### 4.1 Périmètre financier R1

La plateforme n’est **pas un logiciel comptable**. Elle se concentre sur :

- budgets de projet (par poste, versions, approbations) ;
- dépenses (saisie, validation, lien avec projet et ligne budgétaire) ;
- indicateurs financiers (budget approuvé, engagé, dépensé, solde, écart) ;
- export comptable normalisé (CSV) pour intégration dans un système externe (QuickBooks, Xero, etc.).

Les états financiers officiels, la paie, les rapprochements bancaires et la comptabilité générale restent dans le système comptable externe.

### 4.2 Subventions

Contrairement au cahier initial qui plaçait les subventions en R2, il est décidé d’introduire dès **R1 un modèle minimal de financement** :

- objet `funding_source` ou `project_funding` :
  - nom du bailleur ;
  - type de financement (subvention, don affecté, autre) ;
  - montant ;
  - période ;
  - projet ou programme lié ;
  - restrictions éventuelles ;
  - date de rapport ;
  - document d’entente (optionnel).

Le **cycle complet des subventions** (opportunités, demandes, ententes, décaissements, rapports détaillés) reste en R2, mais l’architecture de base doit permettre de lier un projet à une ou plusieurs sources de financement dès R1A.

### 4.3 Dons et reçus fiscaux

- Les dons, donateurs, campagnes et reçus fiscaux conformes à l’ARC restent en **R2**.
- En R1, un don peut être enregistré comme une source de financement simple, sans émission de reçu officiel.

---

## 5. Personnes, bénéficiaires et identité

### 5.1 Bénéficiaire sans compte

Il est acté qu’un **bénéficiaire peut être enregistré sans créer de compte utilisateur**.

- Un agent ou un intervenant crée et gère le profil d’un bénéficiaire.
- Le bénéficiaire n’a pas nécessairement d’accès direct à la plateforme.
- Un portail bénéficiaire (espace personnel) est prévu en R3+, pas en R1.

### 5.2 Modèle d’identité

Le modèle `party` est conservé, avec les clarifications suivantes :

- `user_account` : identité de connexion globale (email, authentification).
- `party` : personne ou organisation connue par la plateforme.
- `membership` : relation entre un `user_account` et un tenant (association).
- Profils fonctionnels (`beneficiary_profile`, `staff_profile`, `trainer_profile`, etc.) liés à un `party` et à un tenant.

Règles :

- Une même `party` peut être connue de plusieurs tenants, mais les données métier (bénéficiaire, dossier de cas, etc.) restent strictement isolées par `tenant_id`.
- Un `user_account` peut appartenir à plusieurs tenants, avec des rôles différents.
- Un bénéficiaire n’a pas besoin d’avoir un `user_account`.

---

## 6. Formation : LMS léger ou gestion de présence ?

Il est décidé que le module formation en R1 est un **LMS léger**, centré sur :

- catalogue (programmes, cours, modules) ;
- sessions et séances datées ;
- inscriptions (par agent, par import, par formulaire public) ;
- présences par séance ;
- évaluations (quiz simples, devoirs, examens, projets) ;
- certificats et attestations ;
- indicateurs de présence, complétion, réussite, abandon, satisfaction.

Le contenu pédagogique est principalement **externe** (liens vers documents, vidéos, plateformes). La gestion fine des leçons, du temps passé et de l’espace apprenant complet est reportée en R3.

---

## 7. Suivi de cas : R1A vs R1B

- **R1A** : suivi de cas minimal ou absent selon la charge. Si présent, il se limite à :
  - ouverture de dossier ;
  - équipe de dossier ;
  - plan d’intervention simple ;
  - notes de suivi basiques (sans chiffrement par champ ni verrouillage avancé).
- **R1B** : suivi de cas complet, avec :
  - confidentialité renforcée ;
  - chiffrement par champ des notes ;
  - verrouillage et addenda ;
  - références ;
  - accès exceptionnel « bris de glace » ;
  - journal d’accès ;
  - supervision.

**Décision** : R1A peut être commercialisé sans le module CAS complet. CAS complet est destiné à des pilotes spécialisés et à la consolidation en R1B.

---

## 8. Intelligence artificielle

### 8.1 IA dans le produit

- En R1, le produit **n’intègre pas de fonctionnalités d’IA** destinées aux utilisateurs finaux.
- Aucune donnée n’est envoyée vers des modèles d’IA externes dans le cadre du fonctionnement normal.

### 8.2 Développement assisté par IA

- Le développement est **assisté par IA** (génération de code, tests, documentation).
- Les règles de la section 14 de `02-exigences-techniques.md` s’appliquent pleinement :
  - spécification avant code ;
  - tests avant implémentation pour la logique sensible ;
  - revue humaine obligatoire pour sécurité, données, RLS, chiffrement, licence ;
  - données synthétiques uniquement dans les invites.

Une section « Politique d’IA » pourra être ajoutée ultérieurement si des fonctionnalités d’IA sont introduites dans le produit.

---

## 9. Points d’attention et risques

### 9.1 Dérive de périmètre

- Risque : vouloir tout faire en R1 (projets, formation, cas, subventions, bénévolat, membres, humanitaire).
- Parade : respecter strictement le périmètre R1A/R1B ; créer un backlog séparé pour R2+.

### 9.2 Complexité de configuration

- Risque : trop de champs personnalisés, listes, vocabulaire, workflows, rendant le produit difficile à tester et à documenter.
- Parade : limiter les options configurables en R1, documenter chaque option, prévoir un mécanisme de versionnement des formulaires et définitions.

### 9.3 Confusion entre finances et comptabilité

- Risque : que les utilisateurs croient que la plateforme remplace leur logiciel comptable.
- Parade : communication claire, libellés explicites (« budget », « dépense », « export comptable »), documentation et onboarding.

### 9.4 Protection des données de cas

- Risque : faille d’autorisation ou de configuration permettant un accès non autorisé à des dossiers sensibles.
- Parade :
  - RLS stricte ;
  - tests d’isolation automatisés ;
  - chiffrement par champ en R1B ;
  - revue de sécurité humaine ;
  - journal d’accès et bris de glace tracé.

### 9.5 Support et SLA

- Risque : sous-estimer la charge de support, surtout avec des utilisateurs peu technophiles.
- Parade :
  - définir clairement les canaux de support, horaires et délais de réponse ;
  - prévoir des documents d’aide, tutoriels et webinaires ;
  - limiter le nombre de pilotes initiaux.

---

## 10. Décisions récapitulatives

| Sujet | Décision |
|---|---|
| Segment initial | Organismes et associations de services (formation, insertion, accompagnement) |
| Associations de membres | Segment ultérieur (R3+) |
| Humanitaire complexe | Segment ultérieur (R3–R5) |
| R1 | Découpé en R1A (MVP) et R1B (fonctions sensibles) |
| Modes de déploiement | SaaS mutualisé en R1, base dédiée en R2, autohébergement commercial en R3+ |
| Finances | Budgets et dépenses de projet, export CSV ; pas de comptabilité complète |
| Subventions | Modèle minimal de financement en R1, cycle complet en R2 |
| Dons et reçus | R2 |
| Bénéficiaire sans compte | Oui, profil créé par un agent sans compte utilisateur |
| Module formation | LMS léger (sessions, présences, évaluations, certificats) |
| Suivi de cas | R1A minimal ou absent, R1B complet et sécurisé |
| IA dans le produit | Non en R1 |
| Développement assisté par IA | Oui, avec garde-fous (spécification, tests, revue humaine) |
| Portails externes | R3+ |
| Formulaires génériques | Moteur minimal en R1, formulaires publics avancés en R4 |
| Support et SLA | À définir avant les pilotes (canaux, délais, plans) |

---

## 11. Prochaines étapes recommandées

1. **Valider ce document** avec les parties prenantes (porteurs, futurs pilotes).
2. **Mettre à jour `01-cahier-des-charges-fonctionnel.md`** pour refléter R1A/R1B et les décisions ci-dessus.
3. **Produire une matrice de traçabilité** liant :
   - objectifs métier ;
   - modules ;
   - exigences (CORE, PRJ, PEO, FOR, CAS, IND, FIN) ;
   - tables de données ;
   - écrans ;
   - tests d’acceptation.
4. **Lancer la phase M0** (fondations, architecture, CI/CD, RLS, authentification, i18n) en s’appuyant sur le prompt de développement (voir `05-prompt-developpement-ia.md`).
5. **Identifier 3 à 5 organismes pilotes** correspondant au segment initial et préparer des scénarios de recette par jalon.