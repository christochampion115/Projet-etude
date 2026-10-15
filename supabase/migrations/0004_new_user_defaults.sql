-- =========================================================================
-- Suivi des études — initialisation automatique d'un nouveau compte
-- =========================================================================
-- À la création d'un compte (inscription Supabase Auth), on crée
-- automatiquement : une ligne de préférences par défaut et les catégories
-- de documents par défaut, pour reproduire le comportement du mode
-- démonstration local.
-- =========================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_preferences (owner_id)
  values (new.id)
  on conflict (owner_id) do nothing;

  insert into public.document_categories (owner_id, name, is_default)
  values
    (new.id, 'Notes de cours', true),
    (new.id, 'Synthèses des années précédentes', true),
    (new.id, 'Supports de cours', true),
    (new.id, 'Exercices et corrigés', true),
    (new.id, 'Autres documents', true);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
