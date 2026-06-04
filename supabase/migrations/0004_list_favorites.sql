-- =====================================================================
-- Ulubione listy
-- =====================================================================
create table public.list_favorites (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  list_id    uuid not null references public.lists(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, list_id)
);

create index list_favorites_user_idx on public.list_favorites(user_id);
create index list_favorites_list_idx on public.list_favorites(list_id);

alter table public.list_favorites enable row level security;

create policy "list_favorites_select_own"
  on public.list_favorites for select
  using (auth.uid() = user_id);

create policy "list_favorites_insert_own"
  on public.list_favorites for insert
  with check (auth.uid() = user_id);

create policy "list_favorites_delete_own"
  on public.list_favorites for delete
  using (auth.uid() = user_id);
