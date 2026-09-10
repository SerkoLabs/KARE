-- KARE foundation: profile ownership, shared movie cache, grants and RLS.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke execute on function public.set_updated_at() from public, anon, authenticated;

grant execute on function public.set_updated_at() to service_role;

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  locale text not null default 'tr-TR',
  taste_onboarding_completed_at timestamptz,
  taste_onboarding_skipped_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_check check (
    display_name is null
    or (
      display_name = btrim(display_name)
      and char_length(display_name) between 1 and 50
    )
  ),
  constraint profiles_locale_check check (
    locale = btrim(locale)
    and char_length(locale) between 2 and 16
  ),
  constraint profiles_onboarding_state_check check (
    not (
      taste_onboarding_completed_at is not null
      and taste_onboarding_skipped_at is not null
    )
  )
);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id) values (new.id);
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
grant execute on function public.handle_new_user() to service_role;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create table public.movies (
  id uuid primary key default gen_random_uuid(),
  tmdb_id bigint not null unique,
  title text not null,
  original_title text,
  overview text,
  release_date date,
  runtime_minutes smallint,
  poster_path text,
  backdrop_path text,
  original_language text,
  genre_ids smallint[] not null default '{}'::smallint[],
  origin_country_codes text[] not null default '{}'::text[],
  director_name text,
  tmdb_vote_average numeric(4,2),
  tmdb_popularity numeric,
  adult boolean not null default false,
  metadata_locale text not null default 'tr-TR',
  cache_refreshed_at timestamptz not null default now(),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint movies_tmdb_id_check check (tmdb_id > 0),
  constraint movies_title_check check (
    title = btrim(title) and char_length(title) between 1 and 500
  ),
  constraint movies_runtime_check check (
    runtime_minutes is null or runtime_minutes > 0
  ),
  constraint movies_language_check check (
    original_language is null or char_length(original_language) between 1 and 16
  ),
  constraint movies_vote_average_check check (
    tmdb_vote_average is null
    or tmdb_vote_average between 0 and 10
  ),
  constraint movies_popularity_check check (
    tmdb_popularity is null or tmdb_popularity >= 0
  ),
  constraint movies_metadata_locale_check check (
    metadata_locale = btrim(metadata_locale)
    and char_length(metadata_locale) between 2 and 16
  )
);

create index movies_genre_ids_idx on public.movies using gin (genre_ids);
create index movies_release_date_idx on public.movies (release_date);
create index movies_cache_refreshed_at_idx on public.movies (cache_refreshed_at);

create trigger movies_set_updated_at
before update on public.movies
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.movies enable row level security;

revoke all privileges on table public.profiles from public, anon, authenticated;
revoke all privileges on table public.movies from public, anon, authenticated;

grant select on table public.profiles to authenticated;
grant update (
  display_name,
  locale,
  taste_onboarding_completed_at,
  taste_onboarding_skipped_at
) on public.profiles to authenticated;

grant select on table public.movies to authenticated;

grant all privileges on table public.profiles, public.movies to service_role;

create policy profiles_select_own
on public.profiles
for select
to authenticated
using (user_id = (select auth.uid()));

create policy profiles_update_own
on public.profiles
for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy movies_select_active
on public.movies
for select
to authenticated
using (is_active = true);
