-- KARE owner-private library state, private reviews and taste onboarding signals.

create table public.user_movie_state (
  user_id uuid not null references auth.users(id) on delete cascade,
  movie_id uuid not null references public.movies(id) on delete restrict,
  watched_at timestamptz,
  watchlisted_at timestamptz,
  favorited_at timestamptz,
  rating numeric(2,1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, movie_id),
  constraint user_movie_state_nonempty_check check (
    watched_at is not null
    or watchlisted_at is not null
    or favorited_at is not null
    or rating is not null
  ),
  constraint user_movie_state_watchlist_check check (
    watched_at is null or watchlisted_at is null
  ),
  constraint user_movie_state_rating_requires_watched_check check (
    rating is null or watched_at is not null
  ),
  constraint user_movie_state_rating_check check (
    rating is null
    or (
      rating between 0.5 and 5.0
      and (rating * 2) = trunc(rating * 2)
    )
  )
);

create index user_movie_state_watched_idx
on public.user_movie_state (user_id, watched_at desc)
where watched_at is not null;

create index user_movie_state_watchlisted_idx
on public.user_movie_state (user_id, watchlisted_at desc)
where watchlisted_at is not null;

create index user_movie_state_favorited_idx
on public.user_movie_state (user_id, favorited_at desc)
where favorited_at is not null;

create trigger user_movie_state_set_updated_at
before update on public.user_movie_state
for each row execute function public.set_updated_at();

create table public.personal_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  movie_id uuid not null references public.movies(id) on delete restrict,
  body text not null,
  contains_spoiler boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint personal_reviews_user_movie_unique unique (user_id, movie_id),
  constraint personal_reviews_body_check check (
    body = btrim(body) and char_length(body) between 1 and 5000
  )
);

create trigger personal_reviews_set_updated_at
before update on public.personal_reviews
for each row execute function public.set_updated_at();

create or replace function public.enforce_review_requires_watched()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.user_movie_state as ums
    where ums.user_id = new.user_id
      and ums.movie_id = new.movie_id
      and ums.watched_at is not null
  ) then
    raise exception using
      errcode = '23514',
      message = 'review_requires_watched';
  end if;

  return new;
end;
$$;

revoke execute on function public.enforce_review_requires_watched() from public, anon, authenticated;
grant execute on function public.enforce_review_requires_watched() to service_role;

create trigger personal_reviews_require_watched
before insert or update on public.personal_reviews
for each row execute function public.enforce_review_requires_watched();

create table public.taste_selections (
  user_id uuid not null references auth.users(id) on delete cascade,
  movie_id uuid not null references public.movies(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (user_id, movie_id)
);

alter table public.user_movie_state enable row level security;
alter table public.personal_reviews enable row level security;
alter table public.taste_selections enable row level security;

revoke all privileges on table public.user_movie_state from public, anon, authenticated;
revoke all privileges on table public.personal_reviews from public, anon, authenticated;
revoke all privileges on table public.taste_selections from public, anon, authenticated;

grant select, insert, delete on table public.user_movie_state to authenticated;
grant update (watched_at, watchlisted_at, favorited_at, rating)
on public.user_movie_state to authenticated;

grant select, insert, delete on table public.personal_reviews to authenticated;
grant update (body, contains_spoiler) on public.personal_reviews to authenticated;

grant select, insert, delete on table public.taste_selections to authenticated;

grant all privileges on table public.user_movie_state, public.personal_reviews, public.taste_selections to service_role;

create policy user_movie_state_select_own
on public.user_movie_state for select to authenticated
using (user_id = (select auth.uid()));

create policy user_movie_state_insert_own
on public.user_movie_state for insert to authenticated
with check (user_id = (select auth.uid()));

create policy user_movie_state_update_own
on public.user_movie_state for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy user_movie_state_delete_own
on public.user_movie_state for delete to authenticated
using (user_id = (select auth.uid()));

create policy personal_reviews_select_own
on public.personal_reviews for select to authenticated
using (user_id = (select auth.uid()));

create policy personal_reviews_insert_own
on public.personal_reviews for insert to authenticated
with check (user_id = (select auth.uid()));

create policy personal_reviews_update_own
on public.personal_reviews for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy personal_reviews_delete_own
on public.personal_reviews for delete to authenticated
using (user_id = (select auth.uid()));

create policy taste_selections_select_own
on public.taste_selections for select to authenticated
using (user_id = (select auth.uid()));

create policy taste_selections_insert_own
on public.taste_selections for insert to authenticated
with check (user_id = (select auth.uid()));

create policy taste_selections_delete_own
on public.taste_selections for delete to authenticated
using (user_id = (select auth.uid()));
