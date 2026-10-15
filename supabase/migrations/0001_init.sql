-- =========================================================================
-- Suivi des études — schéma initial Supabase (PostgreSQL)
-- =========================================================================
-- Ce fichier crée les tables, index et déclencheurs nécessaires au mode
-- backend. Il doit être exécuté une fois sur le projet Supabase cible
-- (via `supabase db push`, le SQL editor, ou la CLI Supabase).
--
-- Les politiques de sécurité (Row Level Security) sont définies dans le
-- fichier `0002_row_level_security.sql`, à exécuter juste après celui-ci.
-- =========================================================================

create extension if not exists "pgcrypto";

-- Fonction utilitaire : met à jour automatiquement `updated_at`.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -------------------------------------------------------------------------
-- user_preferences
-- -------------------------------------------------------------------------
create table if not exists public.user_preferences (
  owner_id uuid primary key references auth.users (id) on delete cascade,
  theme text not null default 'system' check (theme in ('light', 'dark', 'system')),
  focus_work_minutes integer not null default 25 check (focus_work_minutes between 5 and 180),
  focus_break_minutes integer not null default 5 check (focus_break_minutes between 1 and 60),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at_user_preferences
  before update on public.user_preferences
  for each row execute function public.set_updated_at();

-- -------------------------------------------------------------------------
-- academic_years
-- -------------------------------------------------------------------------
create table if not exists public.academic_years (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  label text not null,
  start_date date,
  end_date date,
  is_active boolean not null default false,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_academic_years_owner on public.academic_years (owner_id);

create trigger set_updated_at_academic_years
  before update on public.academic_years
  for each row execute function public.set_updated_at();

-- -------------------------------------------------------------------------
-- academic_periods
-- -------------------------------------------------------------------------
create table if not exists public.academic_periods (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  academic_year_id uuid not null references public.academic_years (id) on delete cascade,
  name text not null,
  start_date date,
  end_date date,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_academic_periods_owner on public.academic_periods (owner_id);
create index if not exists idx_academic_periods_year on public.academic_periods (academic_year_id);

create trigger set_updated_at_academic_periods
  before update on public.academic_periods
  for each row execute function public.set_updated_at();

-- -------------------------------------------------------------------------
-- courses
-- -------------------------------------------------------------------------
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  academic_year_id uuid not null references public.academic_years (id) on delete restrict,
  period_ids uuid[] not null default '{}',
  name text not null,
  professors text[] not null default '{}',
  description text,
  ects numeric(4, 1),
  status text not null default 'active' check (status in ('active', 'completed', 'archived')),
  exam_modalities text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_courses_owner on public.courses (owner_id);
create index if not exists idx_courses_year on public.courses (academic_year_id);

create trigger set_updated_at_courses
  before update on public.courses
  for each row execute function public.set_updated_at();

-- -------------------------------------------------------------------------
-- course_topics (chapitres / programme)
-- -------------------------------------------------------------------------
create table if not exists public.course_topics (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'done')),
  sort_order integer not null default 0,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_course_topics_course on public.course_topics (course_id);

create trigger set_updated_at_course_topics
  before update on public.course_topics
  for each row execute function public.set_updated_at();

-- -------------------------------------------------------------------------
-- document_categories
-- -------------------------------------------------------------------------
create table if not exists public.document_categories (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_document_categories_owner on public.document_categories (owner_id);

create trigger set_updated_at_document_categories
  before update on public.document_categories
  for each row execute function public.set_updated_at();

-- -------------------------------------------------------------------------
-- documents (métadonnées ; le binaire vit dans Supabase Storage)
-- -------------------------------------------------------------------------
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  category_id uuid not null references public.document_categories (id) on delete restrict,
  display_name text not null,
  file_name text not null,
  mime_type text not null,
  size_bytes bigint not null,
  storage_path text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_documents_owner on public.documents (owner_id);
create index if not exists idx_documents_course on public.documents (course_id);

create trigger set_updated_at_documents
  before update on public.documents
  for each row execute function public.set_updated_at();

-- -------------------------------------------------------------------------
-- tasks
-- -------------------------------------------------------------------------
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  title text not null,
  description text,
  type text not null default 'other' check (type in ('assignment', 'reading', 'revision', 'project', 'other')),
  due_date timestamptz,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'done')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_tasks_owner on public.tasks (owner_id);
create index if not exists idx_tasks_course on public.tasks (course_id);

create trigger set_updated_at_tasks
  before update on public.tasks
  for each row execute function public.set_updated_at();

-- -------------------------------------------------------------------------
-- exams
-- -------------------------------------------------------------------------
create table if not exists public.exams (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  title text not null,
  exam_date timestamptz,
  type text not null default 'written' check (type in ('written', 'oral', 'practical', 'project', 'other')),
  modalities text,
  preparation_status text not null default 'not_started' check (preparation_status in ('not_started', 'in_progress', 'ready')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_exams_owner on public.exams (owner_id);
create index if not exists idx_exams_course on public.exams (course_id);

create trigger set_updated_at_exams
  before update on public.exams
  for each row execute function public.set_updated_at();

-- -------------------------------------------------------------------------
-- study_sessions
-- -------------------------------------------------------------------------
create table if not exists public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  course_id uuid references public.courses (id) on delete set null,
  session_date date not null,
  start_time timestamptz not null,
  duration_minutes integer not null check (duration_minutes > 0),
  source text not null default 'manual' check (source in ('timer', 'manual')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_study_sessions_owner on public.study_sessions (owner_id);
create index if not exists idx_study_sessions_course on public.study_sessions (course_id);

create trigger set_updated_at_study_sessions
  before update on public.study_sessions
  for each row execute function public.set_updated_at();

-- -------------------------------------------------------------------------
-- personal_notes
-- -------------------------------------------------------------------------
create table if not exists public.personal_notes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  course_id uuid references public.courses (id) on delete set null,
  title text not null,
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_personal_notes_owner on public.personal_notes (owner_id);
create index if not exists idx_personal_notes_course on public.personal_notes (course_id);

create trigger set_updated_at_personal_notes
  before update on public.personal_notes
  for each row execute function public.set_updated_at();
