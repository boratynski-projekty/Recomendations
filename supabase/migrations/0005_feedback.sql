-- =====================================================================
-- Tabela feedback (zgłoszenia z formularza Contact)
-- =====================================================================
create table public.feedback (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.profiles(id) on delete set null,
  email      text,
  kind       text not null check (kind in ('bug', 'suggestion', 'other')),
  subject    text not null,
  body       text not null,
  created_at timestamptz not null default now()
);

create index feedback_created_idx on public.feedback(created_at desc);

alter table public.feedback enable row level security;

-- Każdy (anon też) może wysyłać feedback (formularz publiczny)
create policy "feedback_insert_any"
  on public.feedback for insert
  with check (true);

-- Tylko admini (sprawdzane po liście email-i w profilach) mogą czytać
-- Wykorzystujemy funkcję, która odpyta listę admin emaili z env.
-- Zamiast tego: konkretne admin emaile dopisujemy ręcznie w tabeli helper.

create table if not exists public.admin_emails (
  email text primary key
);

-- Wstaw swój email jako admin (zmień jeśli inny):
insert into public.admin_emails (email)
values ('boratynski.adam@gmail.com')
on conflict (email) do nothing;

create policy "feedback_select_admin"
  on public.feedback for select
  using (
    auth.uid() in (
      select u.id from auth.users u
      where lower(u.email) in (select lower(email) from public.admin_emails)
    )
  );
