-- KARE owner-private personal lists and list membership.

create table public.lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lists_name_check check (
    name = btrim(name) and char_length(name) between 1 and 80
  ),
  constraint lists_description_check check (
    description is null or char_length(description) <= 1000
  )
);

create unique index lists_user_name_unique_idx
on public.lists (user_id, lower(btrim(name)));

create index lists_user_created_idx
on public.lists (user_id, created_at desc);

create trigger lists_set_updated_at
before update on public.lists
for each row execute function public.set_updated_at();

create table public.list_movies (
  list_id uuid not null references public.lists(id) on delete cascade,
  movie_id uuid not null references public.movies(id) on delete restrict,
  position integer,
  added_at timestamptz not null default now(),
  primary key (list_id, movie_id),
  constraint list_movies_position_check check (
    position is null or position >= 0
  )
);

alter table public.lists enable row level security;
alter table public.list_movies enable row level security;

revoke all privileges on table public.lists from public, anon, authenticated;
revoke all privileges on table public.list_movies from public, anon, authenticated;

grant select, insert, delete on table public.lists to authenticated;
grant update (name, description) on public.lists to authenticated;

grant select, insert, delete on table public.list_movies to authenticated;
grant update (position) on public.list_movies to authenticated;

grant all privileges on table public.lists, public.list_movies to service_role;

create policy lists_select_own
on public.lists for select to authenticated
using (user_id = (select auth.uid()));

create policy lists_insert_own
on public.lists for insert to authenticated
with check (user_id = (select auth.uid()));

create policy lists_update_own
on public.lists for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy lists_delete_own
on public.lists for delete to authenticated
using (user_id = (select auth.uid()));

create policy list_movies_select_own_parent
on public.list_movies for select to authenticated
using (
  exists (
    select 1
    from public.lists as l
    where l.id = list_movies.list_id
      and l.user_id = (select auth.uid())
  )
);

create policy list_movies_insert_own_parent
on public.list_movies for insert to authenticated
with check (
  exists (
    select 1
    from public.lists as l
    where l.id = list_movies.list_id
      and l.user_id = (select auth.uid())
  )
);

create policy list_movies_update_own_parent
on public.list_movies for update to authenticated
using (
  exists (
    select 1
    from public.lists as l
    where l.id = list_movies.list_id
      and l.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.lists as l
    where l.id = list_movies.list_id
      and l.user_id = (select auth.uid())
  )
);

create policy list_movies_delete_own_parent
on public.list_movies for delete to authenticated
using (
  exists (
    select 1
    from public.lists as l
    where l.id = list_movies.list_id
      and l.user_id = (select auth.uid())
  )
);
