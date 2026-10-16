-- =========================================================================
-- Catégorisation des cours (domaine / option / autre catégorie) et
-- résultats d'examen.
-- =========================================================================
-- Un cours est soit un cours du tronc commun (`courses.category_id` nul),
-- soit rattaché à une catégorie :
--   - `domaine`  : catégorie nommée de premier niveau,
--   - `option`   : catégorie nommée de second niveau, toujours rattachée
--                  à un domaine (`parent_id` obligatoire),
--   - `autre`    : catégorie nommée libre de premier niveau, pour tout
--                  regroupement qui ne correspond pas à un domaine/option.
-- =========================================================================

create table public.course_categories (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  academic_year_id uuid not null references public.academic_years(id) on delete cascade,
  kind text not null check (kind in ('domaine', 'option', 'autre')),
  parent_id uuid,
  name text not null check (length(trim(name)) between 1 and 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, academic_year_id, owner_id),
  foreign key (parent_id, academic_year_id, owner_id)
    references public.course_categories(id, academic_year_id, owner_id)
);

create index idx_course_categories_year on public.course_categories(academic_year_id);
create index idx_course_categories_owner on public.course_categories(owner_id);
create index idx_course_categories_parent on public.course_categories(parent_id);
create trigger set_updated_at_course_categories before update on public.course_categories
  for each row execute function public.set_updated_at();

alter table public.course_categories enable row level security;
create policy course_categories_owner_all on public.course_categories
  for all using (auth.uid() = owner_id) with check (
    auth.uid() = owner_id and exists (
      select 1 from public.academic_years y
      where y.id = academic_year_id and y.owner_id = auth.uid()
    )
  );

alter table public.courses add column category_id uuid;
alter table public.courses add constraint courses_category_same_year_owner
  foreign key (category_id, academic_year_id, owner_id)
  references public.course_categories(id, academic_year_id, owner_id);
create index idx_courses_category on public.courses(category_id);

create function public.validate_course_category()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.kind = 'option' then
    if new.parent_id is null then
      raise exception 'Une option doit etre rattachee a un domaine.';
    end if;
    if not exists (
      select 1 from public.course_categories d
      where d.id = new.parent_id and d.academic_year_id = new.academic_year_id
        and d.owner_id = new.owner_id and d.kind = 'domaine'
    ) then
      raise exception 'Le parent d''une option doit etre un domaine de la meme annee.';
    end if;
  elsif new.parent_id is not null then
    raise exception 'Seule une option peut avoir un domaine parent.';
  end if;
  return new;
end;
$$;
create trigger validate_course_category before insert or update on public.course_categories
  for each row execute function public.validate_course_category();

create function public.validate_course_periods()
returns trigger language plpgsql set search_path = public as $$
begin
  if exists (
    select 1 from unnest(new.period_ids) pid
    where not exists (
      select 1 from public.academic_periods p
      where p.id = pid and p.academic_year_id = new.academic_year_id and p.owner_id = new.owner_id
    )
  ) then
    raise exception 'Les periodes doivent appartenir a l''annee du cours.';
  end if;
  return new;
end;
$$;
create trigger validate_course_periods before insert or update of academic_year_id, period_ids on public.courses
  for each row execute function public.validate_course_periods();

create function public.remove_deleted_course_period()
returns trigger language plpgsql set search_path = public as $$
begin
  update public.courses set period_ids = array_remove(period_ids, old.id)
    where old.id = any(period_ids);
  return old;
end;
$$;
create trigger remove_deleted_course_period after delete on public.academic_periods
  for each row execute function public.remove_deleted_course_period();

alter table public.exams add column result text
  check (result in ('pending', 'passed', 'failed'));

create function public.create_academic_year_with_periods(year_data jsonb, period_data jsonb)
returns jsonb language plpgsql security invoker set search_path = public as $$
declare
  created_year public.academic_years;
begin
  insert into public.academic_years(id, owner_id, label, start_date, end_date, is_active, archived_at)
  values (
    (year_data->>'id')::uuid, (year_data->>'owner_id')::uuid,
    year_data->>'label', (year_data->>'start_date')::date,
    (year_data->>'end_date')::date, (year_data->>'is_active')::boolean,
    (year_data->>'archived_at')::timestamptz
  ) returning * into created_year;
  if exists (
    select 1 from jsonb_array_elements(period_data) p
    where p->>'name' is null or length(trim(p->>'name')) not between 1 and 60
  ) or (
    select count(*) <> count(distinct lower(trim(p->>'name')))
    from jsonb_array_elements(period_data) p
  ) then
    raise exception 'Noms de periodes invalides ou dupliques.';
  end if;
  insert into public.academic_periods(id, owner_id, academic_year_id, name, start_date, end_date, sort_order)
  select (p->>'id')::uuid, created_year.owner_id, created_year.id,
    trim(p->>'name'), (p->>'start_date')::date, (p->>'end_date')::date, (p->>'sort_order')::integer
  from jsonb_array_elements(period_data) p;
  return to_jsonb(created_year);
end;
$$;
revoke all on function public.create_academic_year_with_periods(jsonb, jsonb) from public;
grant execute on function public.create_academic_year_with_periods(jsonb, jsonb) to authenticated;
