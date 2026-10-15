-- =========================================================================
-- Suivi des études — Stockage privé des documents (Supabase Storage)
-- =========================================================================
-- Crée le bucket privé `course-documents` et les politiques d'accès.
-- Convention de chemin utilisée par l'application :
--   {owner_id}/{course_id}/{document_id}-{nom_du_fichier}
-- Chaque utilisateur ne peut accéder qu'aux objets dont le premier segment
-- du chemin correspond à son propre `auth.uid()`.
-- =========================================================================

insert into storage.buckets (id, name, public)
values ('course-documents', 'course-documents', false)
on conflict (id) do nothing;

create policy "course_documents_owner_select" on storage.objects
  for select using (
    bucket_id = 'course-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "course_documents_owner_insert" on storage.objects
  for insert with check (
    bucket_id = 'course-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "course_documents_owner_update" on storage.objects
  for update using (
    bucket_id = 'course-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "course_documents_owner_delete" on storage.objects
  for delete using (
    bucket_id = 'course-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
