-- =========================================================================
-- Suivi des études — Row Level Security
-- =========================================================================
-- Ce fichier active RLS sur toutes les tables et définit les politiques
-- garantissant qu'un utilisateur ne peut lire, modifier ou supprimer que
-- ses propres données. À exécuter après `0001_init.sql`.
-- =========================================================================

alter table public.user_preferences enable row level security;
alter table public.academic_years enable row level security;
alter table public.academic_periods enable row level security;
alter table public.courses enable row level security;
alter table public.course_topics enable row level security;
alter table public.document_categories enable row level security;
alter table public.documents enable row level security;
alter table public.tasks enable row level security;
alter table public.exams enable row level security;
alter table public.study_sessions enable row level security;
alter table public.personal_notes enable row level security;

-- -------------------------------------------------------------------------
-- Tables directement reliées à owner_id : politique générique "owner only".
-- -------------------------------------------------------------------------

create policy "user_preferences_owner_all" on public.user_preferences
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "academic_years_owner_all" on public.academic_years
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "academic_periods_owner_all" on public.academic_periods
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "courses_owner_all" on public.courses
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "document_categories_owner_all" on public.document_categories
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "documents_owner_all" on public.documents
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "tasks_owner_all" on public.tasks
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "exams_owner_all" on public.exams
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "study_sessions_owner_all" on public.study_sessions
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "personal_notes_owner_all" on public.personal_notes
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- -------------------------------------------------------------------------
-- course_topics : pas de owner_id direct, la propriété est vérifiée via le
-- cours parent.
-- -------------------------------------------------------------------------

create policy "course_topics_owner_select" on public.course_topics
  for select using (
    exists (
      select 1 from public.courses c
      where c.id = course_topics.course_id and c.owner_id = auth.uid()
    )
  );

create policy "course_topics_owner_insert" on public.course_topics
  for insert with check (
    exists (
      select 1 from public.courses c
      where c.id = course_topics.course_id and c.owner_id = auth.uid()
    )
  );

create policy "course_topics_owner_update" on public.course_topics
  for update using (
    exists (
      select 1 from public.courses c
      where c.id = course_topics.course_id and c.owner_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.courses c
      where c.id = course_topics.course_id and c.owner_id = auth.uid()
    )
  );

create policy "course_topics_owner_delete" on public.course_topics
  for delete using (
    exists (
      select 1 from public.courses c
      where c.id = course_topics.course_id and c.owner_id = auth.uid()
    )
  );
