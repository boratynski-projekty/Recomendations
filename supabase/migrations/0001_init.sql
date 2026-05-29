-- =====================================================================
-- Recomendations — schemat bazy
-- =====================================================================
-- Tabele:
--   profiles  – publiczny profil użytkownika (1:1 z auth.users)
--   lists     – listy rekomendacji (wiele na konto)
--   requests  – pozycje na liście (zgłoszenia od użytkowników)
--   votes     – głosy (1 user × 1 request)
--   comments  – komentarze pod requestem
--
-- Reguły biznesowe:
--   - Każdy zalogowany user ma profil (tworzony triggerem).
--   - Profile i listy są publicznie czytelne.
--   - Edycja/usunięcie własnego requesta tylko do pierwszego głosu.
--   - Nie można głosować na własny request.
--   - Owner listy może w każdej chwili usuwać requesty i oznaczać jako
--     zrealizowane.
-- =====================================================================

create extension if not exists "pgcrypto";
create extension if not exists "citext";

-- ---------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  slug         citext unique not null,
  display_name text not null,
  avatar_url   text,
  created_at   timestamptz not null default now()
);

-- Trigger: po rejestracji w auth.users -> stwórz profil
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_slug text;
  candidate text;
  i int := 0;
begin
  base_slug := lower(regexp_replace(
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    '[^a-z0-9]+', '-', 'gi'
  ));
  base_slug := trim(both '-' from base_slug);
  if base_slug = '' then base_slug := 'user'; end if;

  candidate := base_slug;
  while exists(select 1 from public.profiles where slug = candidate) loop
    i := i + 1;
    candidate := base_slug || '-' || i::text;
  end loop;

  insert into public.profiles (id, slug, display_name, avatar_url)
  values (
    new.id,
    candidate,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- lists
-- ---------------------------------------------------------------------
create table public.lists (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references public.profiles(id) on delete cascade,
  slug        citext not null,
  title       text not null,
  description text,
  created_at  timestamptz not null default now(),
  unique (owner_id, slug)
);

create index lists_owner_idx on public.lists(owner_id);

-- ---------------------------------------------------------------------
-- requests
-- ---------------------------------------------------------------------
create table public.requests (
  id              uuid primary key default gen_random_uuid(),
  list_id         uuid not null references public.lists(id) on delete cascade,
  created_by      uuid not null references public.profiles(id) on delete cascade,
  artist          text not null,
  title           text not null,
  youtube_url     text not null,
  youtube_id      text not null,
  comment         text,
  completed_at    timestamptz,
  completion_url  text,
  created_at      timestamptz not null default now()
);

create index requests_list_idx on public.requests(list_id);
create index requests_created_by_idx on public.requests(created_by);

-- ---------------------------------------------------------------------
-- votes
-- ---------------------------------------------------------------------
create table public.votes (
  request_id uuid not null references public.requests(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (request_id, user_id)
);

create index votes_request_idx on public.votes(request_id);

-- ---------------------------------------------------------------------
-- comments
-- ---------------------------------------------------------------------
create table public.comments (
  id         uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  body       text not null,
  created_at timestamptz not null default now()
);

create index comments_request_idx on public.comments(request_id);

-- =====================================================================
-- VIEWS — wygodne odczyty z liczbą głosów
-- =====================================================================
create or replace view public.requests_with_counts as
select
  r.*,
  coalesce(v.vote_count, 0) as vote_count,
  coalesce(c.comment_count, 0) as comment_count
from public.requests r
left join (
  select request_id, count(*)::int as vote_count
  from public.votes group by request_id
) v on v.request_id = r.id
left join (
  select request_id, count(*)::int as comment_count
  from public.comments group by request_id
) c on c.request_id = r.id;

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================
alter table public.profiles enable row level security;
alter table public.lists    enable row level security;
alter table public.requests enable row level security;
alter table public.votes    enable row level security;
alter table public.comments enable row level security;

-- profiles ------------------------------------------------------------
create policy "profiles_select_public"
  on public.profiles for select using (true);

create policy "profiles_update_own"
  on public.profiles for update using (auth.uid() = id);

-- lists ---------------------------------------------------------------
create policy "lists_select_public"
  on public.lists for select using (true);

create policy "lists_insert_own"
  on public.lists for insert
  with check (auth.uid() = owner_id);

create policy "lists_update_own"
  on public.lists for update using (auth.uid() = owner_id);

create policy "lists_delete_own"
  on public.lists for delete using (auth.uid() = owner_id);

-- requests ------------------------------------------------------------
create policy "requests_select_public"
  on public.requests for select using (true);

create policy "requests_insert_authenticated"
  on public.requests for insert
  with check (auth.uid() = created_by);

-- update: właściciel listy zawsze; autor – tylko gdy 0 głosów i nie zrealizowane
create policy "requests_update_owner_or_author_before_votes"
  on public.requests for update
  using (
    auth.uid() = (select owner_id from public.lists where id = list_id)
    or (
      auth.uid() = created_by
      and completed_at is null
      and not exists (select 1 from public.votes where request_id = requests.id)
    )
  );

-- delete: właściciel listy zawsze; autor – tylko gdy 0 głosów i nie zrealizowane
create policy "requests_delete_owner_or_author_before_votes"
  on public.requests for delete
  using (
    auth.uid() = (select owner_id from public.lists where id = list_id)
    or (
      auth.uid() = created_by
      and completed_at is null
      and not exists (select 1 from public.votes where request_id = requests.id)
    )
  );

-- votes ---------------------------------------------------------------
create policy "votes_select_public"
  on public.votes for select using (true);

-- nie można głosować na własny request ani na zrealizowane
create policy "votes_insert_authenticated"
  on public.votes for insert
  with check (
    auth.uid() = user_id
    and not exists (
      select 1 from public.requests r
      where r.id = request_id
        and (r.created_by = auth.uid() or r.completed_at is not null)
    )
  );

create policy "votes_delete_own"
  on public.votes for delete using (auth.uid() = user_id);

-- comments ------------------------------------------------------------
create policy "comments_select_public"
  on public.comments for select using (true);

create policy "comments_insert_authenticated"
  on public.comments for insert with check (auth.uid() = user_id);

create policy "comments_delete_own_or_list_owner"
  on public.comments for delete
  using (
    auth.uid() = user_id
    or auth.uid() = (
      select l.owner_id
      from public.requests r
      join public.lists l on l.id = r.list_id
      where r.id = comments.request_id
    )
  );

-- =====================================================================
-- GRANTS dla widoku
-- =====================================================================
grant select on public.requests_with_counts to anon, authenticated;
