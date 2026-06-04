-- =====================================================================
-- Unikalność youtube_id w obrębie jednej listy
-- =====================================================================
-- Najpierw usuń ewentualne duplikaty (zostaw najstarszy wpis).
delete from public.requests r
using public.requests r2
where r.list_id = r2.list_id
  and r.youtube_id = r2.youtube_id
  and r.created_at > r2.created_at;

create unique index if not exists requests_list_youtube_unique
  on public.requests (list_id, youtube_id);
