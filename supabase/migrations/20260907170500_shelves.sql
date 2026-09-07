-- KARE shared automatic/curated shelf definitions and curated membership.

create table public.shelves (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  kind text not null,
  rule_key text,
  rule_config jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shelves_slug_check check (
    slug = lower(slug)
    and slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  ),
  constraint shelves_title_check check (
    title = btrim(title) and char_length(title) between 1 and 120
  ),
  constraint shelves_kind_check check (kind in ('curated', 'dynamic')),
  constraint shelves_rule_shape_check check (
    (kind = 'curated' and rule_key is null)
    or (
      kind = 'dynamic'
      and rule_key is not null
      and rule_key = btrim(rule_key)
      and char_length(rule_key) between 1 and 64
    )
  ),
  constraint shelves_rule_config_check check (
    jsonb_typeof(rule_config) = 'object'
  )
);

create index shelves_active_sort_idx
on public.shelves (is_active, sort_order, id);

create trigger shelves_set_updated_at
before update on public.shelves
for each row execute function public.set_updated_at();

create table public.shelf_movies (
  shelf_id uuid not null references public.shelves(id) on delete cascade,
  movie_id uuid not null references public.movies(id) on delete restrict,
  position integer not null,
  created_at timestamptz not null default now(),
  primary key (shelf_id, movie_id),
  constraint shelf_movies_position_check check (position >= 0),
  constraint shelf_movies_position_unique unique (shelf_id, position)
);

alter table public.shelves enable row level security;
alter table public.shelf_movies enable row level security;

revoke all privileges on table public.shelves from public, anon, authenticated;
revoke all privileges on table public.shelf_movies from public, anon, authenticated;

grant select on table public.shelves, public.shelf_movies to authenticated;
grant all privileges on table public.shelves, public.shelf_movies to service_role;

create policy shelves_select_active
on public.shelves for select to authenticated
using (is_active = true);

create policy shelf_movies_select_active_parent
on public.shelf_movies for select to authenticated
using (
  exists (
    select 1
    from public.shelves as s
    where s.id = shelf_movies.shelf_id
      and s.is_active = true
  )
);
