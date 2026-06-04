-- =====================================================================
-- Rozluźnienie edycji requestów
-- =====================================================================
-- Wcześniej autor mógł edytować TYLKO do pierwszego głosu i jeśli nie
-- zrealizowane. Nowa zasada: autor może edytować artist/title/comment
-- w każdym momencie. Tylko link YouTube zostaje immutable (egzekwowane
-- w server action — RLS column-level nie używamy dla prostoty).
--
-- Polityka DELETE pozostaje stara: autor może usunąć tylko do pierwszego
-- głosu (żeby ludzie nie tracili wpłaconych głosów).

drop policy if exists "requests_update_owner_or_author_before_votes"
  on public.requests;

create policy "requests_update_owner_or_author"
  on public.requests for update
  using (
    auth.uid() = (select owner_id from public.lists where id = list_id)
    or auth.uid() = created_by
  );
