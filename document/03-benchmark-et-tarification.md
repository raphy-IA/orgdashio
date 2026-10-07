# Benchmark, tarification et décisions de marché — Canada

**Version** 1.0 · **Recherche consultée le** 3 octobre 2026 · **Devise** indiquée pour chaque prix (USD ou CAD d'origine)
**Documents liés** `01-cahier-des-charges-fonctionnel.md`, `02-exigences-techniques.md`

> **Limites de cette recherche.** Les prix proviennent de pages publiques (sites d'éditeurs, agrégateurs comme Capterra, GetApp, G2, Software Advice, articles de comparaison). Plusieurs éditeurs ne publient pas leurs prix. Certaines comparaisons sont rédigées par des concurrents (donc promotionnelles). Les montants sont des **ordres de grandeur à re-vérifier** par démonstrations et demandes de devis en phase 0. Aucun prix de ce document ne doit être cité à un client sans vérification.

---

## 1. Panorama concurrentiel

### 1.1 Gestion de cas et services sociaux

| Produit | Positionnement | Prix observés | Remarques |
|---|---|---|---|
| **Bonterra Apricot / Penelope** | Gestion de cas pour organismes de toutes tailles ; paliers Fundamentals, Professional, Enterprise | Non publiés (sur devis). Estimations tierces pour les suites haut de gamme : environ 100 à 250 USD par utilisateur par mois, soit 35 000 à 100 000 USD par an | Fonctions riches (formulaires, flux de travail, portail client, SSO en Enterprise). Un utilisateur d'un avis public jugeait Apricot environ dix fois plus cher qu'une alternative |
| **Sumac** (éditeur canadien) | Gestion de cas avec extensions dons, bénévoles, adhésions, subventions | À partir de 109 USD par mois (agrégateurs) ; page de l'éditeur revendeur : à partir de 179 par mois avec 1 000 dossiers inclus ; modules en sus | Se déclare conforme à la LPRPDE ; **offert gratuitement via TechSoup Canada aux organismes de bienfaisance dont le budget est inférieur à 2 M$ CA** (selon un comparatif tiers) |
| **Casebook** | Petites équipes | À partir de 29 USD par mois (jusqu'à 3 utilisateurs) | Entrée de gamme |
| **CharityTracker** | Suivi de services simple | À partir de 20 USD par utilisateur par mois | Pas de gestion de dons ni de bénévoles |
| **PlanStreet** | Gestion de cas | À partir de 60 USD par utilisateur par mois | |
| **InfoFlo Impact** | Refuges et services sociaux | 44 à 59 USD par utilisateur par mois ; portail et bénévoles en sus | |
| **CaseWorthy** | Moyennes organisations (25 à 100 employés) | Estimation tierce : 10 000 à 35 000 USD par an | Prix non publics |

### 1.2 CRM, dons et subventions

| Produit | Prix observés | Remarques |
|---|---|---|
| **Salesforce Nonprofit Cloud** | Enterprise 60 USD, Unlimited 100 USD par utilisateur par mois, facturés annuellement ; **10 licences gratuites** pour les organismes admissibles ; plan de succès « Premier » à 30 % des frais de licence ; mise en œuvre en sus (non publiée) | Très configurable, coût total élevé par la mise en œuvre. Module d'octroi de subventions séparé, à partir de 175 USD par utilisateur par mois |
| **Keela** (éditeur canadien) | À partir d'environ 134 à 144 CAD par mois, par paliers de nombre de contacts ; pas de frais par utilisateur ; données stockées au Canada ; facturation en CAD ; reçus conformes à l'ARC | Spécialisé collecte de fonds. Ne couvre pas la gestion de projets ni de formation |
| **Bloomerang** | À partir d'environ 125 USD par mois (selon une page comparative d'un concurrent) | À traiter avec prudence (source promotionnelle) |

### 1.3 Suivi-évaluation et humanitaire

| Produit | Prix observés | Remarques |
|---|---|---|
| **ActivityInfo** | Solo : 545 € par utilisateur par an. Programme : 3 700 € par an (5 utilisateurs complets et 15 de base inclus selon un agrégateur). Accord d'entreprise sur devis | Spécialisé suivi-évaluation, gestion de cas et collecte. **Propose des licences de serveur autogéré au même tarif que le palier Programme**, ce qui valide le modèle d'autohébergement sous licence |
| **KoboToolbox, CommCare** | À évaluer en phase 0 (collecte hors-ligne) | Références pour R5 |

### 1.4 Ce que le benchmark nous apprend

1. **Le plancher de prix est proche de zéro pour les petits organismes** (licences gratuites ou fortement subventionnées). Entrer en concurrence sur les très petites associations est peu rentable. **Cible recommandée : organismes moyens** (5 à 50 employés, plusieurs programmes, bailleurs exigeants).
2. **Trois logiques de prix coexistent** : par utilisateur (cas, M&E), forfait par paliers de contacts ou de dossiers (CRM, Sumac), accords annuels par organisation (grands comptes). Une **grille hybride** est la plus répandue.
3. **Aucun concurrent identifié ne combine** gestion de projet complète (planification, ligne de base, RAID), formation, suivi de cas et indicateurs dans un seul produit à prix modéré, avec hébergement canadien et interface française complète. C'est l'espace de différenciation à valider (à confirmer par démonstrations).
4. **L'hébergement canadien et le français** sont des arguments de vente réels au Québec (Loi 25).
5. **L'autohébergement sous licence** a un précédent sur le marché des organismes humanitaires.

### 1.5 Actions de benchmark en phase 0
- Essais ou démonstrations : Sumac, Bonterra Apricot, Salesforce Nonprofit Cloud (organisation d'essai gratuite), Keela, ActivityInfo.
- Deux demandes de devis « client mystère » (Apricot, Penelope) pour un organisme de 15 utilisateurs.
- Grille de comparaison fonctionnelle (projets, formation, cas, indicateurs, FR, hébergement).
- Entretiens avec 5 à 8 organismes sur le budget logiciel actuel et les logiciels déjà payés.

---

## 2. Tarification recommandée (hypothèses de départ, en CAD)

### 2.1 Principes
- Grille **hybride** : forfait de palier (inclut des utilisateurs et des modules) + utilisateurs supplémentaires + options.
- Facturation **annuelle** avec remise (environ 15 %) et option mensuelle.
- **Tarif pour organismes à but non lucratif** appliqué par défaut (pas de grille « entreprise » commerciale pour eux).
- Montants **à valider avec les pilotes** et selon le coût réel d'exploitation et de support.
- Les taxes de vente (TPS/TVH/TVQ) s'ajoutent selon les règles applicables aux services en ligne ; **à valider avec un comptable**.

### 2.2 Grille proposée

| Palier | Prix indicatif | Inclus | Utilisateur supplémentaire |
|---|---|---|---|
| **Démarrage** | ≈ 89 CAD/mois | 3 utilisateurs, Projets + Personnes, 500 personnes, 5 Go | ≈ 20 CAD/mois |
| **Équipe** | ≈ 249 CAD/mois | 10 utilisateurs, + Formation + Indicateurs, 5 000 personnes, 25 Go | ≈ 18 CAD/mois |
| **Organisation** | ≈ 549 CAD/mois | 25 utilisateurs, + Suivi de cas, approbations avancées, MFA imposée, export d'audit, 25 000 personnes, 100 Go | ≈ 15 CAD/mois |
| **Entreprise** | à partir d'environ 15 000 CAD/an | Base dédiée, SSO, SLA, limites sur mesure, support prioritaire | Négocié |
| **Autohébergé (licence)** | à partir d'environ 9 000 à 15 000 CAD/an + support | Mêmes modules, plafonds par licence | Négocié |
| **Services** | À définir | Implémentation, migration de données, formation, développement d'extensions facturé séparément | |

### 2.3 Repères de comparaison (illustratifs)
- Une organisation de **10 utilisateurs** : Équipe ≈ 25 CAD par utilisateur et par mois, contre 60 USD par utilisateur pour PlanStreet ou 44 à 59 USD pour InfoFlo, sans compter les modules en sus chez la plupart des concurrents.
- Une organisation de **25 utilisateurs** : Organisation ≈ 22 CAD par utilisateur et par mois, contre une facture Salesforce qui, au-delà des 10 licences gratuites, est de l'ordre de 900 USD par mois pour 15 licences Enterprise avant mise en œuvre.

> Ces repères montrent un positionnement **compétitif et défendable**, à confirmer : il dépend de la couverture fonctionnelle réelle et du coût de support. À recalculer avec les coûts d'exploitation (hébergement, support, paiements, assurance cyber).

### 2.4 Options à évaluer plus tard
- Partenariat avec TechSoup Canada (visibilité, mais pression sur les prix pour les petits organismes).
- Tarif de lancement pour les 10 premiers clients (réduction contre témoignage et retours).
- Tarif « bailleur » (module octroi) en R5.

---

## 3. Décision : intégration comptable

### 3.1 Constats
- **QuickBooks Online** est présenté comme le choix le plus répandu auprès des organismes canadiens, notamment grâce aux « classes » et « emplacements » qui servent à suivre fonds, programmes et subventions ; les vérificateurs le connaissent bien. Sur Capterra Canada, il compte de loin le plus grand nombre d'avis (de l'ordre de 8 000, contre environ 3 300 pour Xero et 600 à 700 pour Sage Intacct).
- **Xero** est une alternative moderne pour les petits et moyens organismes.
- **Sage Intacct** vise les organismes plus grands et complexes ; **Microsoft Dynamics 365 Business Central** les organismes moyens à grands.
- Au Québec, des organismes utilisent aussi Sage 50 ou d'autres logiciels locaux ; l'export CSV les couvre.

### 3.2 Décision (meilleure pratique)

| Étape | Livrable |
|---|---|
| **R1** | **Export comptable normalisé** (CSV) des dépenses approuvées avec dimensions (projet, fonds, catégorie, taxes, référence), modèles de correspondance de comptes (profils d'export pour QuickBooks, Xero, Sage 50) |
| **R2** | **Connecteur QuickBooks Online** : authentification OAuth, **envoi à sens unique** des dépenses approuvées avec correspondance classe/emplacement, récupération du plan comptable, des fournisseurs et des classes, rapprochement par identifiant de référence, file d'erreurs rejouable |
| **R4** | Connecteurs Xero et Sage Intacct ; évaluation de Business Central selon la demande |

**Principes** : la comptabilité externe reste le **livre de référence** ; la plateforme n'est pas un logiciel comptable ; pas de synchronisation bidirectionnelle des paiements dans les premières versions (complexité et risque d'écart) ; opérations idempotentes avec journal de synchronisation.

---

## 4. Décision : marché Canada

| Sujet | Décision |
|---|---|
| Langues | Français et anglais complets dès M1 (le français est une condition d'accès au marché québécois) |
| Devise | CAD par défaut ; modèle prêt pour le multi-devise |
| Hébergement | Région canadienne (Montréal) ; mode dédié ou autohébergé pour les cas particuliers |
| Segment de départ | Organismes moyens de formation, d'insertion, de services sociaux et humanitaires, au Québec et en Ontario |
| Canaux | Démonstrations directes, réseaux sectoriels, partenaires de conception, puis réseaux de financeurs |
| Atouts à valoriser | Français natif, hébergement canadien, suivi de bout en bout projet → budget → personnes → indicateurs, reçus de l'ARC (R2) |

---

## 5. Exigences réglementaires retenues

### 5.1 Reçus fiscaux de dons (R2) — ARC

D'après les listes de contrôle de l'ARC, un reçu officiel pour un don en argent doit comporter notamment : la mention « reçu officiel aux fins de l'impôt sur le revenu » ; le nom et l'adresse de l'organisme tels que connus de l'ARC ; son numéro d'enregistrement ; un numéro de série unique ; le lieu d'émission ; la date du don (ou l'année) et la date d'émission si elle diffère ; le nom complet et l'adresse du donateur ; le montant du don ; la valeur et la description de tout avantage reçu ; le montant admissible ; la signature d'une personne autorisée ; le nom et l'adresse du site web de l'ARC. Les dons non monétaires exigent des éléments supplémentaires (description du bien, évaluateur, juste valeur marchande).

**Conséquences produit :**
1. Le module n'est activable que si l'association saisit un **numéro d'organisme de bienfaisance** valide ; les organismes à but non lucratif non enregistrés ne peuvent pas émettre de reçus officiels.
2. Numérotation séquentielle unique, immuable ; annulation par reçu de remplacement tracé.
3. Calcul du montant admissible et blocage lorsque l'avantage dépasse **80 %** d'un don en argent (règle indiquée dans les exemples de l'ARC).
4. Interdiction d'émettre un reçu au nom d'un autre organisme.
5. Signature autorisée configurable et reçus générés bilingues.

Sources : pages de l'ARC (liste de contrôle des reçus complets et exacts ; exemples de reçus officiels).

### 5.2 Protection des renseignements personnels — Loi 25 (Québec) et LPRPDE

Points retenus (d'après des synthèses juridiques publiques) : désignation et publication d'un responsable de la protection des renseignements personnels ; évaluation des facteurs relatifs à la vie privée avant certains projets, notamment ceux impliquant un transfert hors Québec ; registre des incidents de confidentialité et notification de l'organisme de réglementation et des personnes concernées en cas de risque de préjudice sérieux ; droits d'accès, de rectification et, depuis septembre 2024, de portabilité ; consentement explicite et par finalité ; sanctions pouvant atteindre 25 M$ ou 4 % du chiffre d'affaires mondial. La loi s'applique sans seuil de taille.

**Conséquences produit** : voir `01` section 11 (CMP-01 à CMP-09) et `02` section 7 (TEC-PRV-01 à TEC-PRV-10). **À faire valider par un juriste canadien** avant la mise en production.

---

## 6. Sources consultées (3 octobre 2026)

**Gestion de cas et prix**
- https://softwareconnect.com/roundups/best-nonprofit-case-management-software/
- https://www.softwareadvice.com/nonprofit/apricot-profile/
- https://www.g2.com/products/bonterra-penelope/pricing
- https://www.capterra.ca/software/144095/sumac
- https://www.societ.com/solutions/case-management/sumac/
- https://getzelos.com/free-volunteer-management-software-for-nonprofits

**CRM, dons**
- https://aitoolsbakery.com/blog/salesforce-nonprofit-cloud-pricing/
- https://softwarefinder.com/crm/salesforce-org-nonprofit-cloud
- https://www.keela.co/landing/keela-vs-canadahelps
- https://www.softwareadvice.com/nonprofit/keela-profile/

**Suivi-évaluation**
- https://www.activityinfo.org/about/pricing/index.html
- https://www.capterra.com/p/216057/ActivityInfo/

**Comptabilité**
- https://www.capterra.ca/directory/30114/fund-accounting/software
- https://www.enkel.ca/blog/bookkeeping/nonprofit-accounting-software-canada/
- https://www.gestisoft.com/en/blog/top-accounting-software-for-nonprofits

**Réglementation**
- https://www.canada.ca/en/revenue-agency/services/charities-giving/charities/checklists-charities/issuing-complete-accurate-donation-receipts.html
- https://www.canada.ca/en/revenue-agency/services/charities-giving/charities/sample-official-donation-receipts.html
- https://www.fasken.com/-/media/358f0370eeb443c182b27da974204fd1.pdf
- https://www.datagrail.io/glossary/quebec-bill-64/
- https://www.clym.io/blog/checklist-quebecs-law-25
