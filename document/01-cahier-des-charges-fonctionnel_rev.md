# Cahier des charges fonctionnel — Plateforme SaaS de gestion intégrée pour associations et OBNL

**Version** 1.0 (3 octobre 2026) · **Statut** Proposition à valider · **Langue** Français
**Documents liés** `02-exigences-techniques.md`, `03-benchmark-et-tarification.md`

> Ce document est conçu pour être lu par des humains **et** servir d'entrée à un assistant de développement IA. Chaque exigence a un identifiant stable (ex. `PRJ-05`), une priorité MoSCoW (M = Must, S = Should, C = Could) et, pour les plus structurantes, des critères d'acceptation. Les identifiants ne doivent jamais être réutilisés.

---

## 1. Contexte, vision, périmètre

### 1.1 Vision
Une plateforme SaaS multi-associations, modulaire et configurable, où chaque association crée son compte, se configure et pilote ses projets, ses formations, ses personnes accompagnées et ses suivis de cas. Marché de départ : **Canada** (bilingue FR/EN, Québec inclus).

### 1.2 Objectifs mesurables (à valider en phase pilote)
| Objectif | Indicateur | Cible indicative |
|---|---|---|
| Onboarding rapide | Temps entre création du compte et premier projet créé | < 30 min |
| Adoption | Utilisateurs actifs hebdomadaires / utilisateurs invités | ≥ 60 % à 8 semaines |
| Valeur de pilotage | Rapport d'avancement de projet produit sans ressaisie | ≥ 80 % des projets pilotes |
| Fiabilité | Incidents de fuite inter-tenant | 0 |
| Satisfaction | Score de satisfaction des pilotes | ≥ 8/10 |

### 1.3 Hors périmètre de la version 1 (R1)
**R1A (MVP commercial)** exclut :

- Dons et reçus fiscaux, cycle complet des subventions ;
- Bénévolat, membres et cotisations, événements, gouvernance (CA) ;
- Portails participants, partenaires et bailleurs ;
- Collecte hors-ligne, SSO SAML, API publique ;
- Intégrations comptables bidirectionnelles ;
- Module bailleur, distributions et stocks humanitaires.

**R1B** ajoute :

- Suivi de cas complet (CAS) avec chiffrement par champ et bris de glace ;
- Indicateurs et rapports avancés ;
- Facturation SaaS de base ;
- Paquet autohébergé alpha (structurel, non commercialisé).

Ces éléments sont planifiés en R2 et suivants (section 10) et **le modèle de données les anticipe**.

---

## 2. Décisions actées (D-xx)

| ID | Décision | Source |
|---|---|---|
| D-01 | SaaS multi-tenant, **trois modes de déploiement** : mutualisé (base partagée avec isolation par ligne), dédié (base de données dédiée), autohébergé chez l'association avec **système de licence** | Validé par le porteur |
| D-02 | Marché initial : **Canada**. Interface FR/EN, devise par défaut CAD, hébergement au Canada | Validé |
| D-03 | **Un seul code source** pour les trois modes. Aucun fork par client. Le sur-mesure passe par configuration, extensions et services | Recommandation |
| D-04 | **MVP élargi (R1)** livré en trois jalons (M1, M2, M3) : noyau + projets, personnes + formation, suivi de cas + indicateurs | Validé : développement assisté par IA |
| D-05 | Le **suivi de cas** est inclus dans R1 | Validé |
| D-06 | Comptabilité : exports normalisés en R1, **QuickBooks Online en R2**, Xero et Sage Intacct ensuite. La comptabilité externe reste le livre de référence | Meilleure pratique (voir 03) |
| D-07 | Tarification hybride : forfait par palier + utilisateurs supplémentaires + modules | Voir 03 |
| D-08 | Développement assisté par IA avec garde-fous de qualité et de sécurité | Voir 02, section 14 |
| D-09 | Pas de LMS complet : le module formation gère inscriptions, présences, évaluations, certificats. L'hébergement de contenu pédagogique passe par des liens | Recommandation |
| D-10 | Une seule identité de personne (`party`) réutilisée par bénéficiaires, formateurs, agents, donateurs et bénévoles | Recommandation |
| D-11 | Les reçus fiscaux de dons (R2) ne sont activables que si l'organisme a un numéro d'enregistrement d'organisme de bienfaisance | Exigence réglementaire (voir 03) |

---

## 3. Personas et rôles

| Persona | Besoin principal | Rôle par défaut |
|---|---|---|
| Administrateur de l'association | Configurer, inviter, contrôler | `admin` |
| Direction | Vue d'ensemble, décisions | `direction` |
| Gestionnaire de programme | Piloter plusieurs projets | `program_manager` |
| Chef de projet | Planifier, suivre, rapporter | `project_manager` |
| Membre d'équipe | Exécuter ses tâches | `team_member` |
| Responsable formation | Catalogue, sessions, inscriptions | `training_manager` |
| Formateur | Présences, évaluations | `trainer` |
| Intervenant (travailleur social) | Dossiers de cas | `case_worker` |
| Superviseur de cas | Supervision, accès renforcé | `case_supervisor` |
| Agent d'accueil / saisie | Créer et mettre à jour des personnes | `intake_agent` |
| Responsable financier | Budgets, dépenses | `finance_manager` |
| Lecteur | Consultation limitée | `viewer` |
| Super-administrateur plateforme (nous) | Exploitation du SaaS | `platform_admin` (hors tenant) |

### 3.1 Matrice de permissions par défaut (R1)
C = créer, R = lire, U = modifier, D = supprimer/archiver, A = approuver, — = aucun accès. « Portée » : `own` = ses éléments, `team` = ses projets ou sa cohorte, `all` = tout le tenant.

| Module | admin | direction | program_mgr | project_mgr | team_member | training_mgr | trainer | case_worker | case_supervisor | intake_agent | finance_mgr | viewer |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Configuration / utilisateurs | CRUDA | R | — | — | — | — | — | — | — | — | — | — |
| Structure organisationnelle | CRUD | R | R | R | R | R | R | R | R | R | R | R |
| Programmes / portefeuilles | CRUD | R | CRUD | R | R | R | — | — | — | — | R | R |
| Projets | CRUDA | R | CRUDA | CRUD (team) | RU tâches (own) | R | — | — | — | — | R | R |
| Budget et dépenses de projet | CRUD | R | R | CRU (team) | C dépense (own) | R | — | — | — | — | CRUDA | R |
| Personnes / bénéficiaires | CRUD | R (agrégé) | R | R (team) | — | R | R (cohorte) | CRU (case) | CRU | CRU | — | — |
| Formation | CRUD | R | R | R | — | CRUDA | RU (own) | — | — | R | — | R |
| Suivi de cas | R (métadonnées) | R (agrégé) | — | — | — | — | — | CRU (team) | CRUDA | — | — | — |
| Indicateurs | CRUD | R | CRUD | CRU (team) | — | RU (formation) | — | RU | RU | — | R | R |
| Documents | selon objet | selon objet | selon objet | selon objet | selon objet | selon objet | selon objet | selon objet | selon objet | selon objet | selon objet | selon objet |
| Journal d'audit | R | — | — | — | — | — | — | — | R (cas) | — | — | — |

Règles : les permissions sont des codes (`project.create`, `case.read`, etc.). Les rôles système sont modifiables par copie. Un rôle personnalisé est possible (`CORE-12`). **L'administrateur ne lit pas le contenu des dossiers de cas** (séparation des pouvoirs).

---

## 4. Périmètre R1 et jalons

Le périmètre R1 est découpé en deux sous-ensembles :

- **R1A — MVP commercial utilisable** (M1 + M2 + partie de M3)
- **R1B — Fonctions sensibles et avancées** (complément de M3)

| Jalon | Contenu | Critère de sortie |
|---|---|---|
| **M1 — Noyau et projets** | CORE, ORG, PRJ, FIN-LITE (budget et dépenses de projet), documents, audit, notifications, onboarding, console plateforme minimale | 3 associations créent et suivent de vrais projets |
| **M2 — Personnes et formation** | PEO (personnes, ménages, consentements), FOR (catalogue, sessions, présences, certificats), formulaire public d’inscription, services rendus, import CSV, agents (RH légère) | Une cohorte réelle suivie de l’inscription au certificat |
| **M3 — Cas, impact, durcissement** | CAS (R1B : suivi de cas complet), IND (indicateurs et rapports), tableaux de bord, sécurité renforcée, accessibilité, performance, sauvegardes testées, facturation SaaS de base | Revue de sécurité passée, 0 anomalie critique, pilotes en production |

> **Porte de mise en production (go-live)** : tests d’isolation inter-tenants verts, test d’intrusion sans anomalie critique ou élevée ouverte, restauration de sauvegarde testée, WCAG 2.1 AA vérifié sur les parcours clés, évaluation des facteurs relatifs à la vie privée (EFVP) documentée, politique de confidentialité et conditions d’utilisation publiées.

**Hypothèse de rythme** : avec 1 à 2 personnes pilotant un assistant IA, chaque jalon représente environ 8 à 10 semaines. Le goulot réel est la validation avec les utilisateurs pilotes, la revue de sécurité humaine et l’UX, pas la production de code.

## 5. Exigences fonctionnelles R1

### 5.1 CORE — Plateforme, configuration, sécurité fonctionnelle

| ID | Exigence | P |
|---|---|---|
| CORE-01 | **Inscription et création d'association** : formulaire (nom, courriel admin, pays/province, langue), vérification du courriel, création du tenant et de l'administrateur | M |
| CORE-02 | **Assistant d'onboarding** (≤ 6 étapes) : profil, langue/devise/fuseau, modules, structure, inviter l'équipe, créer un premier projet. Packs sectoriels proposés (formation/insertion, humanitaire, communautaire) | M |
| CORE-03 | **Profil de l'association** : nom, mission, vision, valeurs, coordonnées, logo, numéro d'entreprise, numéro d'organisme de bienfaisance (optionnel), NEQ (optionnel) | M |
| CORE-04 | **Authentification** : courriel + mot de passe, vérification du courriel, réinitialisation, MFA (TOTP) activable, clés d'accès (WebAuthn) en Should ; verrouillage progressif | M |
| CORE-05 | **Invitations** : invitation par courriel avec rôle, expiration, révocation, renvoi | M |
| CORE-06 | **Appartenance multi-associations** : un même utilisateur peut appartenir à plusieurs associations et en changer sans se reconnecter | M |
| CORE-07 | **Structure organisationnelle** : unités (départements, équipes) hiérarchiques, postes, responsables | M |
| CORE-08 | **Modules activables** par association, avec dépendances (ex. Suivi de cas requiert Personnes) | M |
| CORE-09 | **Vocabulaire configurable** : renommer « bénéficiaire », « participant », « projet », « programme » (FR/EN) | S |
| CORE-10 | **Champs personnalisés** typés (texte, nombre, date, liste, case, personne) sur personnes, projets, sessions ; validation, obligatoire, visibilité par rôle | M |
| CORE-11 | **Listes de référence configurables** (statuts de situation, types de services, motifs de clôture, etc.) | M |
| CORE-12 | **Rôles et permissions** : rôles système, rôles personnalisés par copie, permissions granulaires, affectation à durée limitée | M |
| CORE-13 | **Approbations configurables** : étapes, rôles approbateurs, seuils (dépenses, changements, clôtures) | M |
| CORE-14 | **Documents** : téléversement, dossiers, versions, métadonnées, rattachement à un objet, contrôle d'accès hérité de l'objet, aperçu, antivirus | M |
| CORE-15 | **Notifications** : dans l'application et courriel, préférences par utilisateur, résumés quotidiens, rappels d'échéance | M |
| CORE-16 | **Commentaires et mentions** sur projets, tâches, sessions, dépenses | S |
| CORE-17 | **Recherche globale** (personnes, projets, sessions, documents) respectant les permissions | M |
| CORE-18 | **Import CSV** avec aperçu, correspondance de colonnes, validation, rapport d'erreurs, annulation ; **export CSV/Excel/PDF** des listes et fiches | M |
| CORE-19 | **Journal d'audit** consultable et exportable (qui, quoi, quand, avant/après), non modifiable | M |
| CORE-20 | **Vues et filtres sauvegardés**, tri, colonnes personnalisables | S |
| CORE-21 | **Modèles de documents** (lettres, attestations, rapports) avec variables | S |
| CORE-22 | **Aide en contexte** et centre d'aide | C |
| CORE-23 | **Paramètres de conservation** (durées par type de données) et **demandes d'accès/portabilité** traçables | M |
| CORE-24 | **Console plateforme (super-admin)** : liste des tenants, statut, plan, utilisation, suspension, support en lecture seule avec justification et audit | M |
| CORE-25 | **Abonnement et licence** : plans, droits (entitlements) par module et limites ; en autohébergé, validation d'une licence signée | M |
| CORE-26 | **Facturation** : factures manuelles en M3, intégration de paiement par carte et facturation récurrente en Should | S |

**Critères d'acceptation (extraits)**
- `CORE-06` : *Étant donné* un utilisateur membre de deux associations, *quand* il change d'association, *alors* il ne voit que les données de la nouvelle association et son rôle y est appliqué ; aucune donnée de l'autre n'est mise en cache côté client.
- `CORE-13` : *Étant donné* une dépense de plus de 1 000 $ et une règle exigeant l'approbation du responsable financier, *quand* un membre l'enregistre, *alors* elle reste « soumise » jusqu'à approbation et personne ne peut approuver sa propre dépense.
- `CORE-18` : *Étant donné* un fichier CSV avec 3 lignes invalides sur 200, *quand* je lance l'import, *alors* les 197 lignes valides sont proposées à l'import et un rapport indique ligne, colonne et motif pour les 3 autres.

### 5.2 PEO — Personnes, bénéficiaires, ménages, consentements (jalon M2)

| ID | Exigence | P |
|---|---|---|
| PEO-01 | **Personne unique** : fiche personne ou organisation réutilisée par tous les rôles (bénéficiaire, formateur, agent, contact) | M |
| PEO-02 | **Profil bénéficiaire** : identité, coordonnées, langue préférée, date de naissance, genre (liste configurable), situation (champs configurables), besoins, statut, date d'accueil | M |
| PEO-03 | **Ménages** : création, membres, rôle dans le ménage, adresse partagée | M |
| PEO-04 | **Consentements** : finalités configurables, version du texte, date, mode (écrit, verbal, électronique), retrait avec effet immédiat, preuve jointe | M |
| PEO-05 | **Détection de doublons** à la création (nom, date de naissance, courriel, téléphone) avec fusion tracée | M |
| PEO-06 | **Participation** à un programme ou projet (dates, rôle, statut) | M |
| PEO-07 | **Catalogue de services** et **services rendus** (qui, quel service, quand, quel projet, quel intervenant) | M |
| PEO-08 | **Historique** (chronologie) de la personne : participations, formations, services, documents | M |
| PEO-09 | **Segmentation** et recherche avancée (critères combinés) | S |
| PEO-10 | **Pseudonymisation** : code unique par personne affichable à la place du nom dans les rapports | S |
| PEO-11 | **Droit à l'oubli** : anonymisation tracée en conservant les statistiques agrégées | M |
| PEO-12 | **Accès restreint** : fiches marquées « confidentielles » visibles seulement par une liste de personnes | S |

### 5.3 ORG-RH — Agents (RH légère, jalon M2)

| ID | Exigence | P |
|---|---|---|
| HR-01 | Fiche agent : poste, unité, type de contrat, dates, responsable | M |
| HR-02 | Compétences et disponibilités (pour affectation aux projets et formations) | S |
| HR-03 | Absences et vacances (demande, approbation, calendrier d'équipe) | S |
| HR-04 | Documents RH (contrats, évaluations) avec accès restreint | S |
| HR-05 | Charge de travail par agent (somme des allocations projets) | S |
| HR-06 | Arrivée et départ : listes de contrôle (accès, matériel) | C |

> Pas de paie. L'intégration à un fournisseur de paie est hors périmètre.

### 5.4 PRJ — Programmes, portefeuilles, projets (priorité n°1, jalon M1)

| ID | Exigence | P |
|---|---|---|
| PRJ-01 | **Axes stratégiques, portefeuilles, programmes** hiérarchisés, avec responsables, dates, statuts | M |
| PRJ-02 | **Création guidée d'un projet** (assistant) : identification, contexte, population cible, territoire, dates, responsable, budget, partenaires ; code projet auto-numéroté | M |
| PRJ-03 | **Modèles de projet** : enregistrer un projet comme modèle (structure, tâches, durées relatives, documents types) et en créer un à partir d'un modèle | M |
| PRJ-04 | **Cadre logique** : arbre impact → effets → produits ; objectifs et résultats attendus ; rattachement des activités et indicateurs | M |
| PRJ-05 | **Planification** : phases, activités, tâches, jalons, livrables ; hiérarchie, durée, dates, % d'avancement, priorité, responsable | M |
| PRJ-06 | **Dépendances** typées (FS, SS, FF, SF) avec décalage ; détection de cycles ; recalcul des dates en cascade | M |
| PRJ-07 | **Vues** : liste, Kanban, calendrier, par responsable, par phase ; **Gantt** interactif (glisser pour décaler) | M (Gantt : S) |
| PRJ-08 | **Ligne de base** : figer le plan, comparer plan / réel, historiser les replanifications | M |
| PRJ-09 | **Équipe projet** : membres, rôle (RACI), allocation en %, alerte de surcharge | S |
| PRJ-10 | **Suivi d'exécution** : statuts, règle de calcul de l'avancement (par tâches, par durée, manuel), tâches en retard, tâches bloquées | M |
| PRJ-11 | **Registre RAID** : risques (probabilité × impact, mitigation, propriétaire, date de révision), problèmes, hypothèses, dépendances externes | M |
| PRJ-12 | **Journal des décisions** (date, décideur, contexte, conséquences) | M |
| PRJ-13 | **Demandes de changement** (périmètre, budget, délai) avec impact estimé et approbation | S |
| PRJ-14 | **Rapports d'avancement périodiques** : modèle, génération PDF, validation, envoi | M |
| PRJ-15 | **Budget du projet** et **dépenses** (voir 5.5), alertes de dépassement | M |
| PRJ-16 | **Clôture** : liste de contrôle, bilan prévu/réel, indicateurs finaux, leçons apprises, verrouillage après clôture | M |
| PRJ-17 | **Vues consolidées** par programme et portefeuille (budget, avancement, risques, indicateurs) | S |
| PRJ-18 | **Partenaires de projet** (organisations liées, rôle, entente jointe) | S |
| PRJ-19 | **Feuilles de temps** par tâche | C |
| PRJ-20 | **Calendrier** exportable (ICS) des jalons et échéances | C |
| PRJ-21 | **Sources de financement de projet** : une ou plusieurs sources (bailleur, type, montant, période, restrictions, date de rapport, document) peuvent être rattachées à un projet | M |

**Critères d'acceptation (extraits)**
- `PRJ-06` : *Étant donné* la tâche B dépendante de A (FS, décalage 2 j), *quand* je décale la fin de A de 3 jours, *alors* le début de B se recalcule et le Gantt se met à jour ; *quand* j'essaie de créer une dépendance circulaire, *alors* le système refuse avec un message explicite.
- `PRJ-08` : *Étant donné* une ligne de base figée le 1ᵉʳ mars, *quand* je décale une tâche, *alors* l'écart par rapport à la base apparaît en jours et la base n'est pas modifiée.
- `PRJ-16` : *Étant donné* un projet avec une dépense non validée, *quand* je tente de le clôturer, *alors* la clôture est refusée tant que les dépenses ne sont pas validées ou rejetées.

### 5.5 FIN-LITE — Budget et dépenses de projet (jalon M1)

| ID | Exigence | P |
|---|---|---|
| FIN-01 | Budget par projet, par poste (personnel, matériel, transport, locaux, communication, formation, sous-traitance, frais administratifs, aide directe) ; postes configurables | M |
| FIN-02 | **Versions de budget** (initial, révisé) avec historique et approbation | M |
| FIN-03 | Saisie de **dépenses** (date, poste, montant, fournisseur, justificatif) rattachées à un projet et à une ligne budgétaire | M |
| FIN-04 | Cycle d'une dépense : saisie → soumise → approuvée → payée ; rejet motivé ; séparation des tâches | M |
| FIN-05 | **Ventilation** d'une dépense sur plusieurs projets ou lignes (pourcentage ou montant) | S |
| FIN-06 | Indicateurs : budget approuvé, engagé, dépensé, solde, écart, % d'exécution | M |
| FIN-07 | **Taxes** : montant avant taxes, TPS/TVH/TVQ saisis, part récupérable (information, pas de comptabilité fiscale) | S |
| FIN-08 | **Export comptable normalisé** (CSV) : date, poste, montant, taxes, projet, fonds, référence ; modèles de correspondance de comptes | M |
| FIN-09 | Devise par projet, CAD par défaut ; modèle prêt pour le multi-devise (taux de change), interface multi-devise en R2 | S |
| FIN-10 | Engagements (bons de commande simples) | C |

### 5.6 FOR — Formation (jalon M2, premier module vertical)

| ID | Exigence | P |
|---|---|---|
| FOR-01 | **Catalogue** : programme de formation → parcours → cours → module → leçon/activité ; durée, objectifs, prérequis | M |
| FOR-02 | **Cohortes et sessions** : dates, lieu ou lien visio, capacité, **séances datées** (occurrences), liste d'attente | M |
| FOR-03 | **Formateurs** : profil, compétences, disponibilités, affectation à session ou séance, **détection de conflits d'horaire**, heures enseignées | M |
| FOR-04 | **Inscription** : libre, sur approbation, selon critères d'admissibilité, par un agent, par import CSV, par cohorte ; consentements vérifiés | M |
| FOR-05 | **Formulaire public d'inscription** par session (lien partageable, CAPTCHA, consentement, courriel de confirmation, file d'approbation) | M |
| FOR-06 | **Présence par séance** (saisie rapide, adaptée mobile), justifications d'absence, alertes d'absences consécutives | M |
| FOR-07 | **Évaluations** : quiz simple, devoir, examen, projet ; barème, note, seuil de réussite, commentaires | M |
| FOR-08 | **Progression** : leçons terminées, devoirs remis, temps passé (si disponible) | S |
| FOR-09 | **Certificats et attestations** : règles d'émission (présence ≥ x %, note ≥ y), modèle personnalisable bilingue, numéro unique, vérification par QR | S |
| FOR-10 | **Satisfaction** : questionnaire de fin de session, score moyen | S |
| FOR-11 | **Indicateurs calculés** : taux de présence, complétion, réussite, abandon, satisfaction | M |
| FOR-12 | **Lien projet/subvention** : session rattachée à un projet ; coûts imputables ; personnes atteintes alimentent les indicateurs | M |
| FOR-13 | **Espace apprenant** (connexion personnelle, consultation du parcours et des attestations) | C (R3) |
| FOR-14 | **Inscription groupée** d'un ménage ou d'un groupe | C |

**Critères d'acceptation (extraits)**
- `FOR-04` : *Étant donné* une session de 20 places complète, *quand* un 21ᵉ participant s'inscrit, *alors* il est placé en liste d'attente ; *quand* un inscrit se désiste, *alors* le premier de la liste est proposé à l'agent pour confirmation.
- `FOR-05` : *Étant donné* un formulaire public, *quand* une personne soumet une inscription sans cocher le consentement obligatoire, *alors* la soumission est refusée ; sinon une personne « en attente » est créée et rapprochée des doublons éventuels.
- `FOR-06` : *Étant donné* un participant absent de trois séances consécutives, *alors* le responsable formation reçoit une alerte et le statut de l'inscrit est signalé « à risque ».
- `FOR-09` : *Étant donné* une règle « présence ≥ 80 % et note ≥ 60 », *quand* une cohorte se termine, *alors* les certificats sont proposés uniquement aux inscrits qui remplissent les deux conditions et chaque certificat porte un numéro unique vérifiable.

### 5.7 CAS — Suivi de cas - précision R1A vs R1B (jalon M3 ; sécurité renforcée)

> **Précision R1A vs R1B** : en R1A, le suivi de cas peut être limité ou absent. En R1B, le module CAS est complet et inclut le chiffrement par champ, le verrouillage des notes, l’accès exceptionnel « bris de glace » et le journal d’accès.
	
| ID | Exigence | P |
|---|---|---|
| CAS-01 | **Ouverture de dossier** pour une personne ou un ménage : type de dossier configurable, motif, dates, niveau de confidentialité | M |
| CAS-02 | **Équipe de dossier** : intervenant principal, co-intervenants, superviseur ; accès limité à l'équipe | M |
| CAS-03 | **Accueil et évaluation** (formulaires modèles configurables par type de dossier) | M |
| CAS-04 | **Plan d'intervention** : objectifs, actions, échéances, responsables, statut, révisions | M |
| CAS-05 | **Notes de suivi** : date, type (rencontre, appel, visite), contenu, prochaines étapes ; **verrouillées après un délai**, corrections par addenda ; chiffrées au niveau du champ | M |
| CAS-06 | **Références (orientations)** vers d'autres organismes, avec suivi du retour | S |
| CAS-07 | **Alertes de sauvegarde** (drapeaux de sécurité) visibles de l'équipe | S |
| CAS-08 | **Accès exceptionnel (bris de glace)** : un utilisateur hors équipe accède avec justification obligatoire, notification au superviseur et au responsable de la vie privée, audit | M |
| CAS-09 | **Journal d'accès** : qui a consulté quel dossier et quand, consultable par le superviseur | M |
| CAS-10 | **Transfert et fermeture** : motif, bilan, résultat, archivage, calendrier de conservation et destruction | M |
| CAS-11 | **Charge de dossiers** par intervenant, rappels d'échéances, tableau de bord de supervision | M |
| CAS-12 | **Partage de consentement** avec d'autres organismes (désactivé par défaut) | C |
| CAS-13 | **Services rendus** liés automatiquement à `PEO-07` et aux indicateurs | M |
| CAS-14 | **Dossiers de ménage** avec membres et plans individuels liés | S |

**Critères d'acceptation (extraits)**
- `CAS-02/08` : *Étant donné* un dossier restreint à l'équipe A, *quand* un intervenant hors équipe cherche la personne, *alors* le système masque le contenu du dossier et propose l'accès exceptionnel ; *quand* il le demande avec justification, *alors* l'accès est accordé pour une durée limitée, une notification est envoyée et l'événement est inscrit au journal.
- `CAS-05` : *Étant donné* une note vieille de plus de 7 jours (délai configurable), *quand* l'intervenant veut la corriger, *alors* seule l'ajout d'un addenda est possible, la note originale reste intacte.
- Un administrateur de l'association **ne peut pas** lire le contenu des notes (seulement les métadonnées).

### 5.8 IND — Indicateurs et rapports (jalon M3)

| ID | Exigence | P |
|---|---|---|
| IND-01 | **Définition d'indicateur** : nom, niveau (activité, produit, effet, impact), unité, source, fréquence, responsable, méthode de calcul ; **champs obligatoires imposés** : valeur de référence, cible, période | M |
| IND-02 | **Rattachement** d'un indicateur à un nœud du cadre logique d'un projet ou d'un programme | M |
| IND-03 | **Cibles et valeurs observées** par période ; saisie manuelle, import CSV, calcul automatique depuis formation, services rendus et cas | M |
| IND-04 | **Désagrégation** (sexe, tranche d'âge, lieu, autres dimensions configurables) | S |
| IND-05 | **Personnes atteintes sans doublon** par projet et par programme | M |
| IND-06 | **Bibliothèque d'indicateurs** par pack sectoriel (modifiable) | S |
| IND-07 | **Tableaux de bord** : direction, chef de projet, formation, supervision de cas, indicateurs (cible vs réel) | M |
| IND-08 | **Rapports** : avancement de projet, bilan de projet, rapport de formation, rapport d'activité (services rendus), rapport d'indicateurs ; export PDF/Excel ; modèles configurables | M |
| IND-09 | **Collecte par enquête** (formulaires), théorie du changement structurée | C (R2) |
| IND-10 | **Anonymat dans les rapports** : seuil minimal d'effectif (ex. masquer les cellules < 5) | S |

---

## 6. États et règles de gestion principaux

| Objet | États | Transitions et règles |
|---|---|---|
| Projet | planifié → actif ↔ suspendu → clôturé ; annulé | Activation : budget approuvé et chef de projet défini. Clôture : dépenses résolues, bilan rempli. Clôturé = lecture seule. |
| Tâche | à faire → en cours ↔ bloquée → terminée | Terminer une tâche dont un prédécesseur FS n'est pas terminé : avertissement. |
| Dépense | saisie → soumise → approuvée → payée ; rejetée | L'approbateur ≠ le saisisseur. Dépassement de ligne : approbation supplémentaire. |
| Session | planifiée → ouverte aux inscriptions → en cours → terminée ; annulée | Annulation : notification des inscrits. |
| Inscription | en attente → confirmée → complétée ou abandonnée ; refusée ; liste d'attente | Confirmation : consentement valide et admissibilité vérifiée. |
| Dossier de cas | ouvert → actif → en révision → fermé | Fermeture : motif et bilan requis. Notes verrouillées après délai. |
| Consentement | valide → retiré ou expiré | Retrait : bloque immédiatement les usages liés à la finalité. |
| Demande de changement | brouillon → soumise → approuvée ou rejetée → appliquée | Approuvée : mise à jour du plan/budget et nouvelle version de ligne de base proposée. |

**Règles transversales** : tout objet métier est horodaté et attribué (créé par, modifié par) ; suppression logique pour les objets à valeur d'audit ; les montants ne sont jamais en virgule flottante ; les dates sont en UTC en base et affichées selon le fuseau de l'association ; les statuts sont des énumérations contrôlées.

---

## 7. Écrans R1 (inventaire)

| Module | Écrans |
|---|---|
| Accès | Connexion, MFA, mot de passe oublié, acceptation d'invitation, choix d'association |
| Onboarding | Assistant en 6 étapes |
| Accueil | Tableau de bord par rôle, mes tâches, mes approbations, notifications |
| Configuration | Profil, modules, structure, rôles, utilisateurs, champs, listes, vocabulaire, conservation, modèles |
| Projets | Liste, fiche (onglets : aperçu, cadre logique, planification, suivi, budget, équipe, RAID, documents, rapports), assistant de création, Gantt, Kanban, calendrier, vue programme/portefeuille |
| Budget | Budget par projet, versions, dépenses, approbations |
| Personnes | Liste, fiche (identité, ménage, consentements, participation, services, formations, documents, historique), doublons, import |
| Formation | Catalogue, programme, cours, cohorte, session, séances, présences, évaluations, certificats, formulaire public |
| Cas | Liste de mes dossiers, dossier (évaluation, plan, notes, références, documents, accès), supervision, journal d'accès |
| Indicateurs | Liste, fiche, saisie, tableaux de bord |
| Rapports | Bibliothèque, génération, historique |
| Plateforme | Console tenants, plans, support |

**Exigences d'interface** : FR/EN, états vide/chargement/erreur/refus d'accès sur chaque écran, responsive (mobile pour présences et notes), accessibilité WCAG 2.1 AA, navigation clavier, messages d'erreur actionnables, confirmation avant actions destructrices, enregistrement automatique des brouillons longs.

---

## 8. Packs sectoriels (livrés en R1, contenu léger)

| Pack | Modules activés | Contenu préconfiguré |
|---|---|---|
| Formation et insertion | Projets, Personnes, Formation, Indicateurs | Types de services, listes de situation, indicateurs d'emploi et de compétences, modèles d'attestation |
| Humanitaire et social | Projets, Personnes, Cas, Indicateurs | Types de dossiers, formulaires d'accueil, plans d'intervention, indicateurs de portée (personnes atteintes, désagrégation) |
| Communautaire | Projets, Personnes, Indicateurs | Types d'activités, modèles de rapport d'activité |

---

## 9. Rapports et tableaux de bord R1

| Tableau de bord | Contenu |
|---|---|
| Direction | Projets actifs par statut, projets en retard, budget approuvé / dépensé, risques élevés, personnes atteintes, sessions en cours |
| Chef de projet | Avancement vs ligne de base, tâches en retard, jalons à venir, budget, RAID ouverts, décisions récentes |
| Formation | Inscrits, présence, complétion, réussite, abandon, satisfaction, sessions à venir |
| Supervision de cas | Dossiers par intervenant, échéances de plan, dossiers sans activité récente, accès exceptionnels |
| Indicateurs | Cible vs réel par niveau, tendance, écarts |

Rapports : avancement de projet, bilan de projet, budget vs dépenses, rapport de session, liste des participants (avec filtres de confidentialité), rapport d'activité (services rendus), rapport d'indicateurs. Tous exportables en PDF et Excel, avec les modèles personnalisables (en-tête, logo, langue).

---

## 10. Feuille de route après R1

| Release | Contenu | Remarque |
|---|---|---|
| **R2** | Financement (cycle complet des subventions), dons, donateurs, campagnes, reçus fiscaux conformes ARC, connecteur QuickBooks Online, multi-devise en interface, SSO OIDC | Reçus voir `03` section 5 |
| **R3** | Vie associative et gouvernance (bénévolat, membres et cotisations, assemblées, événements, conseil d’administration), partenaires et ententes, communication, risques organisationnels, espace apprenant | Répond au besoin « associations de membres » |
| **R4** | Plateforme (formulaires publics génériques, registres personnalisés, portails participant, partenaire, bailleur), API publique et webhooks, SAML, connecteurs Xero et Sage Intacct | |
| **R5** | Spécialisations (collecte hors-ligne, distributions et stocks, partenaires d’exécution, protection renforcée, module bailleur octroi de subventions) | Selon la demande des clients |

---

## 11. Exigences de conformité fonctionnelle (Canada)

| ID | Exigence | Détail |
|---|---|---|
| CMP-01 | **Responsable de la protection des renseignements personnels** désigné et publié, configurable par association | Loi 25 (Québec) |
| CMP-02 | **Registre des incidents de confidentialité** par association et outil de notification | Loi 25, LPRPDE |
| CMP-03 | **Évaluation des facteurs relatifs à la vie privée (EFVP)** : modèle fourni à l'association et documentation de la plateforme | Loi 25 |
| CMP-04 | **Portabilité** : export des données d'une personne dans un format structuré et lisible par machine, en moins de 30 jours (outil en libre-service pour l'administrateur) | Loi 25 |
| CMP-05 | **Consentement explicite, par finalité, retirable**, avec preuve | Loi 25, LPRPDE |
| CMP-06 | **Hébergement au Canada**, région indiquée dans le contrat et la politique de confidentialité | Loi 25 (transferts hors Québec) |
| CMP-07 | **Langue** : interface complète en français (le français est obligatoire pour une offre au Québec) et en anglais | Marché Canada |
| CMP-08 | **Accessibilité** WCAG 2.1 AA | Accessibilité (Ontario, fédéral) |
| CMP-09 | **Reçus fiscaux de dons** (R2) : numéro de série unique, mentions obligatoires de l'ARC, annulation par reçu de remplacement, uniquement pour les organismes de bienfaisance enregistrés | Voir 03 |

> Ces points sont des exigences de produit, pas un avis juridique. Faire valider les textes (politique de confidentialité, conditions d'utilisation, contrat de traitement de données) par un juriste canadien avant la mise en production.

---

## 12. Stratégie de validation et de recette

1. **Partenaires de conception** : 3 à 5 organisations de types différents (formation/insertion, humanitaire/social, communautaire). Interviews de cadrage avant M1, démonstrations à la fin de chaque jalon.
2. **Recette par jalon** : scénarios de bout en bout rédigés à partir des critères d'acceptation ci-dessus, joués sur des données réalistes (jeux de données synthétiques, jamais de données réelles en développement).
3. **Scénarios transversaux obligatoires** : création d'une association → invitation de 5 utilisateurs avec rôles → création d'un projet depuis un modèle → exécution et clôture ; création d'une session → inscriptions publiques → présences → certificats ; ouverture d'un dossier de cas → note → accès exceptionnel → fermeture ; **tentatives d'accès croisé entre deux associations (doit échouer)**.
4. **Critères de sortie par jalon** : voir section 4.

---

## 13. Hypothèses, risques et questions ouvertes

### 13.1 Hypothèses retenues (à confirmer si elles ne conviennent pas)
- Les associations pilotes acceptent une interface bilingue sans mode hors-ligne en R1.
- L'hébergement SaaS est dans une région AWS canadienne ; les clients exigeant une autre localisation passent par le mode autohébergé.
- Les paiements en ligne par carte (abonnements) sont traités par un fournisseur de paiement tiers ; aucune donnée de carte n'est stockée.
- Le nom de domaine, la marque et les conditions commerciales seront fixés avant les pilotes.

### 13.2 Risques principaux
| Risque | Mitigation |
|---|---|
| Dérive de périmètre | Périmètre R1 figé, backlog R2+ géré séparément, un changement = une décision écrite |
| Biais d'échantillon (modèle issu d'une seule association) | Partenaires de conception de types variés, packs sectoriels, validation en phase 0 |
| Fuite de données inter-tenants | Isolation au niveau de la base (RLS), tests automatisés à chaque déploiement, revue humaine obligatoire |
| Données sensibles de cas | Chiffrement au niveau du champ, accès par équipe, bris de glace, audit, EFVP |
| Qualité du code généré par IA | Garde-fous de CI, revues humaines ciblées, tests (voir 02 section 14) |
| Concurrence établie et gratuité pour petits organismes | Cibler les organismes moyens, différenciation par le lien projet → budget → personnes → indicateurs → rapport (voir 03) |
| Adoption par des utilisateurs peu technophiles | Onboarding guidé, packs, vocabulaire configurable, formation intégrée à l'aide |

### 13.3 Questions encore ouvertes pour le porteur
1. Nom du produit et domaine ?
2. Qui seront les 3 à 5 associations pilotes (et leurs types) ?
3. Le Québec est-il ciblé dès le premier pilote (ce qui impose le français complet et la conformité Loi 25 dès M1) ?
4. Entité juridique et assureur pour le SaaS (assurance cyber, conditions d'utilisation) ?
5. Budget d'exploitation cible (hébergement, support) pour calibrer les paliers de prix ?

---

## 14. Glossaire

| Terme | Définition |
|---|---|
| Tenant | Une association cliente et l'ensemble de ses données dans la plateforme |
| Party | Fiche unique d'une personne ou d'une organisation, réutilisée par plusieurs rôles |
| Cadre logique | Hiérarchie impact, effets, produits, activités reliée à des indicateurs |
| Ligne de base | Version figée d'un plan, servant de référence de comparaison |
| RAID | Risques, problèmes (issues), hypothèses (assumptions), dépendances |
| Bris de glace | Accès exceptionnel à un dossier restreint, avec justification et audit |
| RLS | Isolation des lignes par tenant imposée par la base de données |
| EFVP | Évaluation des facteurs relatifs à la vie privée |
| Entitlement | Droit d'usage (module, limite) accordé par un plan ou une licence |
