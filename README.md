# Suivi des études universitaires

Application web de gestion et de suivi des études universitaires : cours,
documents, programme/progression, tâches et examens, calendrier, minuteur de
concentration, notes personnelles et statistiques.

Le cœur du produit est la page **Mes cours** et la fiche détaillée d'un
cours : chaque cours centralise ses documents, son programme (chapitres),
ses tâches/examens, ses notes et ses séances d'étude.

## Stack technique

- **Frontend** : React 19 + TypeScript, Vite 8.
- **Styles** : Tailwind CSS v4.
- **Routage** : React Router.
- **Formulaires / validation** : React Hook Form + Zod.
- **Icônes** : Lucide React. **Graphiques** : Recharts.
- **Backend cible** : Supabase (PostgreSQL, authentification, stockage
  privé des fichiers) — voir [`supabase/README.md`](./supabase/README.md).
- **Mode démonstration locale** : IndexedDB (via `idb`) pour les données et
  les fichiers, utilisé automatiquement quand Supabase n'est pas configuré.
- **Tests** : Vitest + React Testing Library.

L'accès aux données est centralisé dans une couche *repository*
(`src/lib/repositories`), elle-même pilotée par un store applicatif
(`src/data/store.ts`) qui expose les actions métier aux composants. Aucun
composant n'appelle directement IndexedDB ou Supabase.

## Installation

```bash
npm install
```

## Lancer le projet en local

```bash
npm run dev
```

Par défaut, aucune variable d'environnement n'est nécessaire : l'application
démarre en **mode démonstration locale**. Un bandeau en haut de l'écran le
rappelle en permanence. Les données sont stockées uniquement dans le
navigateur (IndexedDB/localStorage) et ne constituent pas une sauvegarde
réelle ni un système d'authentification sécurisé.

### Activer le mode backend (Supabase)

1. Copiez `.env.example` vers `.env.local` et renseignez
   `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`.
2. Exécutez les migrations SQL décrites dans
   [`supabase/README.md`](./supabase/README.md).
3. Relancez `npm run dev` : les pages de connexion/inscription deviennent
   actives et les données sont stockées côté Supabase, protégées par des
   politiques Row Level Security.

## Scripts disponibles

| Commande | Effet |
| --- | --- |
| `npm run dev` | Démarre le serveur de développement Vite. |
| `npm run build` | Vérifie les types (`tsc -b`) puis construit le bundle de production. |
| `npm run preview` | Sert le build de production localement. |
| `npm run lint` | Lint du code avec Oxlint. |
| `npm run test` | Exécute la suite de tests Vitest. |
| `npm run test:watch` | Exécute les tests en mode watch. |

## Fonctionnalités implémentées

- Navigation complète (barre latérale + routes) : tableau de bord, cours,
  calendrier, tâches/examens, documents, notes, statistiques, paramètres.
- Années académiques et périodes configurables, activation/archivage.
  Création d'années et de périodes directement depuis **Mes cours** ; le
  formulaire de nouvelle année propose Q1 et Q2, modifiables, supprimables
  et complétables (TA, sessions…). L'année et ses périodes sont enregistrées
  ensemble, sans création partielle.
- Cours : création, modification, archivage, suppression (avec confirmation
  et suppression en cascade des données associées), recherche et filtres,
  regroupement par période avec sections dépliables/repliables.
- Catégorisation des cours par année : chaque cours est soit un cours du
  **tronc commun** (aucune catégorie), soit rattaché à un **domaine** nommé,
  soit à une **option** nommée appartenant à un domaine, soit à une
  **autre catégorie** nommée libre. Un cours n'appartient qu'à une seule de
  ces catégories. Les domaines, options et autres catégories se créent et
  se modifient depuis **Mes cours** ; une catégorie déjà créée est proposée
  pour les cours suivants (menu déroulant du formulaire de cours). Une
  catégorie utilisée par des cours ou des options ne peut pas être
  supprimée avant d'avoir déplacé ces cours/options.
- Un même cours peut couvrir plusieurs périodes (Q1, Q2, TA…) et apparaît
  dans chacune sans dupliquer ses données. Changer l'année dans le formulaire
  réinitialise la catégorie et les périodes pour éviter les liens entre
  années.
- L'onglet **Mes cours** affiche, pour chaque période, la répartition des
  cours par catégorie (tronc commun, puis chaque domaine avec ses options,
  puis les autres catégories), avec le nombre de cours de chaque regroupement.
- Fiche de cours avec onglets : vue d'ensemble, documents, programme et
  progression, tâches et examens, notes personnelles, séances d'étude.
- Programme/progression : chapitres à cocher, calcul réel de la progression
  (aucun pourcentage affiché tant qu'aucun chapitre n'existe).
- Documents : téléversement, catégories configurables, renommage,
  changement de catégorie, téléchargement, suppression — stockage réel
  (IndexedDB en démo, Supabase Storage privé en backend).
- Tâches et examens : vue par cours et vue globale avec filtres ; statut
  cohérent entre la fiche du cours et le tableau de bord.
- Résultat distinct pour chaque examen : **en attente de résultat**,
  **réussi** ou **raté**, modifiable depuis l'onglet **Tâches et examens**
  du cours et depuis la liste globale. La saisie est disponible après la
  journée de l'examen (pas pour un examen sans date ou futur). Sans résultat
  renseigné, un examen passé apparaît en attente ; reporter l'examen à une
  date future efface son ancien résultat. Le résultat ne modifie pas
  automatiquement le statut actif/terminé/archivé du cours.
- Calendrier mensuel : séances, examens et échéances, création de séances
  manuelles.
- Minuteur de concentration (Pomodoro) : démarrer/pause/reprendre/arrêter,
  durées configurables, association à un cours, persistance de la séance en
  cours à travers la navigation (et au rechargement de page) ; les séances
  interrompues n'enregistrent que le temps réellement écoulé.
- Notes personnelles générales ou liées à un cours, avec recherche.
- Statistiques : temps d'étude total/par cours, séances, progression des
  programmes, tâches terminées, évolution sur 14 jours — à partir des
  données réellement enregistrées, avec états vides explicites.
- Tableau de bord : indicateurs calculés (cours actifs, tâches ouvertes/en
  retard, prochains examens), « à faire ensuite », cours nécessitant de
  l'attention, activité récente, derniers documents, cours récemment
  consultés.
- Thème clair/sombre (préférence persistée), mode démonstration clairement
  signalé.
- Authentification Supabase câblée (connexion/inscription) pour le mode
  backend ; en mode démo, un utilisateur local est créé automatiquement et
  clairement annoncé comme non sécurisé.

## Tests

```bash
npm run test
```

Les tests automatisés couvrent :

- la logique métier pure (`src/lib/selectors.test.ts`) : calcul de
  progression du programme, progression des tâches, détection des
  échéances, détection des cours nécessitant de l'attention ;
- le repository de démonstration (`src/lib/repositories/demoRepository.test.ts`) :
  persistance réelle via IndexedDB (`fake-indexeddb`), stockage/relecture
  d'un fichier, suppression en cascade d'un cours ;
- le store applicatif (`src/data/store.test.ts`) : réactivité, cohérence du
  statut d'une tâche, suppression en cascade, catégorisation des cours
  (tronc commun / domaine / option / autre catégorie), affectation
  multi-périodes, résultats d'examen ;
- les parcours de **Mes cours** (`src/features/courses/CoursesPage.test.tsx`) :
  création d'année avec périodes, ajout de période, création/modification de
  domaines et d'options, affectation d'un cours et persistance des résultats ;
- la migration IndexedDB (`src/lib/storage/db.test.ts`) : conservation des
  données existantes lors de l'ajout des catégories et des résultats
  (y compris la conversion des anciens groupes génériques en domaines/options) ;
- le minuteur de concentration (`src/context/FocusTimerContext.test.tsx`) :
  une séance interrompue n'enregistre que le temps réellement écoulé, le
  temps passé en pause n'est pas comptabilisé, une séance menée à son terme
  enregistre la durée complète.

`npm run build` (type-check + build) et `npm run lint` (Oxlint) ont été
exécutés et ne remontent aucune erreur bloquante (quelques avertissements de
style/heuristiques React Compiler subsistent, documentés comme non
bloquants).

## Fonctionnalités non terminées / limitations connues

- Les migrations Supabase (`supabase/migrations`) ont été écrites et
  relues manuellement mais **n'ont pas pu être exécutées contre un projet
  Supabase réel** dans cet environnement (aucun identifiant de projet
  disponible). Une vérification sur un projet réel est recommandée avant
  mise en production.
- Pas de récupération de mot de passe ni de fournisseurs OAuth (seule
  l'authentification e-mail/mot de passe est câblée).
- Pas de glisser-déposer pour réordonner les chapitres (l'ordre est stocké
  mais seule l'ordre de création est utilisé pour le moment).
- Pas de récurrence d'événements ni d'import de calendriers externes dans
  le calendrier, conformément au périmètre défini.
- Les notifications ne sont pas implémentées ; la structure de données
  (dates d'échéance, statuts) permet de les ajouter ultérieurement sans
  réécriture.
- Le bundle de production dépasse légèrement le seuil d'avertissement de
  Vite (~915 Ko avant gzip, ~266 Ko après) ; un découpage en chunks
  (`dynamic import`) pourrait être ajouté ultérieurement si nécessaire.

## Structure du projet

```
src/
  components/      Composants UI réutilisables (boutons, cartes, modales…) et mise en page
  context/          Authentification et minuteur de concentration (contexts React)
  data/             Store applicatif (logique métier + état réactif)
  features/         Pages et composants spécifiques à chaque domaine fonctionnel
  lib/              Logique métier pure, validation Zod, accès aux données (repositories)
  pages/            Pages génériques (404…)
  routes/           Garde de routes (authentification)
  test/             Configuration des tests
  types/            Modèle de données du domaine
supabase/
  migrations/       Schéma SQL, Row Level Security, stockage
```
