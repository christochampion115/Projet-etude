# Backend Supabase — migrations et sécurité

Ce dossier contient tout ce qui est nécessaire pour activer le mode backend
de l'application (au lieu du mode démonstration locale).

## Contenu

- `migrations/0001_init.sql` — tables, index et déclencheurs `updated_at`.
- `migrations/0002_row_level_security.sql` — active RLS et définit les
  politiques d'accès (chaque utilisateur ne voit que ses propres données).
- `migrations/0003_storage.sql` — crée le bucket privé `course-documents`
  et ses politiques d'accès.
- `migrations/0004_new_user_defaults.sql` — initialise automatiquement les
  préférences et les catégories de documents par défaut à la création d'un
  compte.
- `migrations/0005_course_categories_and_exam_results.sql` — catégorisation
  des cours par année (domaine / option / autre catégorie), affectation
  unique des cours, résultats d'examen et création transactionnelle d'une
  année avec ses périodes.

Sur une installation existante ayant déjà appliqué les migrations 0001 à
0004, appliquez uniquement **0005** avant d'utiliser cette version du frontend.
En mode démonstration, la base IndexedDB passe automatiquement en version 3
en conservant les cours et examens existants (et en convertissant les
anciens groupes génériques en domaines/options le cas échéant).

## Mise en place

1. Créez un projet sur [supabase.com](https://supabase.com).
2. Dans l'éditeur SQL du projet (ou via `supabase db push` avec la CLI),
   exécutez les fichiers de `migrations/` **dans l'ordre numérique**.
3. Copiez l'URL du projet et la clé publique **anon** dans un fichier
   `.env.local` à la racine du projet frontend (voir `.env.example`) :

   ```env
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```

4. Activez la confirmation par e-mail ou désactivez-la selon vos besoins
   dans Authentication → Providers → Email.
5. Redémarrez `npm run dev`. L'application bascule automatiquement en mode
   backend et affiche les pages de connexion / inscription.

## Sécurité

- La sécurité réelle repose sur les politiques RLS définies en base de
  données, pas sur le code frontend : un utilisateur authentifié ne peut
  lire/modifier que les lignes dont `owner_id = auth.uid()`.
- Les documents sont stockés dans un bucket **privé** ; l'accès aux fichiers
  est limité par chemin (`{owner_id}/...`), vérifié par les politiques de
  `storage.objects`.
- Ne placez jamais la clé `service_role` dans le frontend : seule la clé
  publique `anon` doit être utilisée côté client.
- Les catégories de cours utilisent RLS et des clés étrangères composites
  pour empêcher de rattacher un cours ou une option à un domaine d'une autre
  année ou d'un autre propriétaire ; un trigger impose en base qu'une option
  soit toujours rattachée à un domaine (jamais à une autre option ou une
  autre catégorie). La création d'année avec périodes utilise une fonction
  `security invoker` : les politiques RLS restent applicables.
- Le store applicatif refuse les résultats pour une date absente ou non
  passée et les réinitialise si l'examen est reporté. Cette règle utilise
  la journée locale du navigateur, de façon identique en démo et en backend.
  La base contraint les valeurs possibles du résultat ; la vérification
  de la date reste une règle applicative, pas une restriction d'accès SQL.

## Limites connues

- Les migrations n'ont pas pu être exécutées ni vérifiées contre un projet
  Supabase réel dans cet environnement (aucun identifiant de projet n'était
  disponible). Elles ont été relues manuellement et suivent les conventions
  Supabase standard, mais une vérification sur un projet réel est
  recommandée avant mise en production.
- Les migrations ne gèrent pas la récupération de mot de passe ni les
  fournisseurs OAuth : seule l'authentification par e-mail/mot de passe est
  câblée dans l'interface actuelle.
