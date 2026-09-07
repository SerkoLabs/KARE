# KARE — Database, Auth, RLS and Data Ownership Design

**Design date:** 2026-09-07  
**Backend:** Supabase Postgres + Auth + Edge Functions  
**Migration status:** **DESIGN ONLY — no migration has been run yet.**

## 1. Goals and invariants

1. KARE user data is private by default.
2. Client filtering is never the authorization boundary; Postgres grants + RLS are.
3. Every client-exposed table has explicit grants and RLS.
4. `service_role` is server/Edge-Function only.
5. Canonical user data is normalized enough to prevent duplication, but movie metadata is intentionally denormalized where arrays are more practical than a large metadata schema.
6. TMDB movie identity is represented by one KARE cache row with a unique TMDB ID; the same movie is referenced from many user/list/shelf/recommendation records.
7. Public/social UGC does not exist in MVP. Reviews and lists are owner-private.
8. Recommendation items are immutable server-generated facts; client cannot rewrite scores/evidence/explanations.
9. Account deletion cascades owner-private product data; shared movie/shelf content is not owned by a user.
10. Database constraints enforce core state rules even if a buggy/malicious client bypasses normal UI.

---

## 2. Roles

### `anon`
- May use Supabase Auth endpoints as provided by Auth.
- **No direct read/write grants to KARE `public` tables in MVP.**

### `authenticated`
- Read/update own profile within allowed columns.
- CRUD own library state, private review, taste selections, lists and list memberships under RLS.
- Read shared movie cache and active shelf content.
- Read own recommendation runs/items/acceptance facts.
- Insert constrained product telemetry for self if telemetry table is enabled.
- Cannot write canonical/shared movie metadata, shelves or server-generated recommendation artifacts.

### `service_role`
- Trusted server/Edge Function context only.
- Used narrowly for:
  - normalized TMDB movie-cache upsert;
  - shared curated content maintenance when not done by migration/seed;
  - recommendation run/item generation and acceptance transaction after validating caller;
  - Auth Admin account deletion.
- Never stored in Expo client environment or git.

### Database owner / migration role
- Schema migrations, grants, policies, triggers and seeds.
- Not an application runtime identity.

---

## 3. Data classification

| Data | Classification | Owner | Client visibility |
|---|---|---|---|
| Supabase `auth.users` email/auth data | private identity/auth | user / auth system | via Auth SDK only |
| `profiles` | private personal | user | self only |
| `user_movie_state` | private behavioral | user | self only |
| `personal_reviews` | private free text; may contain sensitive content | user | self only |
| `taste_selections` | private preference signal | user | self only |
| `lists`, `list_movies` | private user-generated collection | user | self only |
| `recommendation_runs/items/acceptances` | private derived preference/behavior | user | self only |
| `product_events` | private telemetry | user/account-linked | insert self; no client read required |
| `movies` | shared external metadata cache | KARE/TMDB source | authenticated read |
| `shelves`, `shelf_movies` | shared KARE content/config | KARE | authenticated read |

No private free-text review body is copied into analytics or shared metadata tables.

---

## 4. Common conventions

### IDs
- User ID: Supabase `auth.users.id` (`uuid`).
- Product entity IDs: `uuid` generated with `gen_random_uuid()`.
- TMDB ID: `bigint`, unique on `movies.tmdb_id`.

### Timestamps
- `created_at timestamptz not null default now()`.
- Mutable rows also have `updated_at timestamptz not null default now()` maintained by a trigger.
- User movie state uses nullable semantic timestamps (`watched_at`, `watchlisted_at`, `favorited_at`).

### Updated-at trigger
One internal trigger function, e.g. `public.set_updated_at()`, sets `new.updated_at = now()`.
- `SECURITY INVOKER` is sufficient for a simple row trigger.
- Function is not granted for arbitrary client RPC use.

### Text validation
- Trim/length validated in app/Edge Function for UX.
- Critical maximum/non-empty constraints also exist in DB using `char_length(btrim(...))` checks.

### JSONB
JSONB is used only for bounded server-generated/config payloads whose shape is also validated in trusted code. It is not a substitute for core relational ownership columns.

---

# 5. Tables

## T-001 — `profiles`

Purpose: one owner-private product profile per Supabase Auth user.

| Column | Type | Null | Default / constraints |
|---|---|---:|---|
| `user_id` | `uuid` | no | PK; FK → `auth.users(id)` `ON DELETE CASCADE` |
| `display_name` | `text` | yes | when present: trimmed length 1–50 |
| `locale` | `text` | no | `'tr-TR'`; bounded length |
| `taste_onboarding_completed_at` | `timestamptz` | yes | — |
| `taste_onboarding_skipped_at` | `timestamptz` | yes | — |
| `created_at` | `timestamptz` | no | `now()` |
| `updated_at` | `timestamptz` | no | `now()`, trigger maintained |

Constraints:
- onboarding `completed_at` and `skipped_at` are not both non-null. If a previously skipped user later completes onboarding, completion update clears `skipped_at`.

Creation:
- A reviewed `auth.users` insert trigger creates the profile row.
- Trigger function should be `SECURITY DEFINER` only if required by auth schema permissions and must use a fixed/empty `search_path` plus fully qualified object names.
- Failure semantics must be tested so auth signup does not silently create a user without expected profile state.

Indexes:
- PK on `user_id` is sufficient for primary access.

Soft delete: no. Account deletion cascades hard delete.

---

## T-002 — `movies`

Purpose: shared normalized cache of TMDB movie metadata actually required by KARE.

| Column | Type | Null | Default / constraints |
|---|---|---:|---|
| `id` | `uuid` | no | PK, `gen_random_uuid()` |
| `tmdb_id` | `bigint` | no | unique; `> 0` |
| `title` | `text` | no | non-empty |
| `original_title` | `text` | yes | — |
| `overview` | `text` | yes | — |
| `release_date` | `date` | yes | — |
| `runtime_minutes` | `smallint` | yes | `> 0` when present |
| `poster_path` | `text` | yes | provider path, not arbitrary client URL |
| `backdrop_path` | `text` | yes | provider path |
| `original_language` | `text` | yes | bounded provider code |
| `genre_ids` | `smallint[]` | no | default `'{}'` |
| `origin_country_codes` | `text[]` | no | default `'{}'` |
| `director_name` | `text` | yes | denormalized MVP display field |
| `tmdb_vote_average` | `numeric(4,2)` | yes | 0–10 when present |
| `tmdb_popularity` | `numeric` | yes | `>= 0` when present |
| `adult` | `boolean` | no | `false` |
| `metadata_locale` | `text` | no | default `'tr-TR'` |
| `cache_refreshed_at` | `timestamptz` | no | `now()` |
| `is_active` | `boolean` | no | `true` |
| `created_at` | `timestamptz` | no | `now()` |
| `updated_at` | `timestamptz` | no | `now()` |

Why denormalized arrays:
- Genres/country codes are external metadata used for filtering/scoring; separate KARE genre/country tables add little ownership value in MVP.
- One canonical `movies` row prevents repeated title/poster/year copies in every user/list/shelf record.

Indexes:
- unique btree on `tmdb_id`.
- GIN on `genre_ids`.
- GIN on `origin_country_codes` if country filters enter implemented MVP shelf/recommendation queries; otherwise defer until query evidence.
- btree on `release_date` if dynamic decade/year shelves query cache.
- btree on `cache_refreshed_at` for stale-cache maintenance.
- optional btree on `tmdb_popularity` only if cold-start queries use it materially.

Writes:
- no authenticated client write.
- trusted Edge Functions or migrations/seeds only.

Deletion:
- do not routinely delete referenced movie rows; set `is_active=false` if a provider/legal/content issue requires hiding.
- user/list/shelf FKs use `ON DELETE RESTRICT` unless a later legal-delete procedure explicitly reconciles dependencies first.

Soft delete: functional suppression via `is_active`; no `deleted_at` needed in MVP.

---

## T-003 — `user_movie_state`

Purpose: one logical owner/movie row for watched, watchlist, favorite and rating state.

| Column | Type | Null | Default / constraints |
|---|---|---:|---|
| `user_id` | `uuid` | no | FK → `auth.users(id)` `ON DELETE CASCADE` |
| `movie_id` | `uuid` | no | FK → `movies(id)` `ON DELETE RESTRICT` |
| `watched_at` | `timestamptz` | yes | — |
| `watchlisted_at` | `timestamptz` | yes | — |
| `favorited_at` | `timestamptz` | yes | — |
| `rating` | `numeric(2,1)` | yes | 0.5–5.0 in 0.5 steps |
| `created_at` | `timestamptz` | no | `now()` |
| `updated_at` | `timestamptz` | no | `now()` |

Primary key:
- `(user_id, movie_id)`.

Checks:
1. At least one of watched/watchlisted/favorited/rating is non-null; when the final state is removed, delete the row.
2. `watched_at is null OR watchlisted_at is null` — active watchlist and watched cannot coexist in MVP.
3. `rating is null OR watched_at is not null`.
4. Rating range/step: `rating between 0.5 and 5.0` and `(rating * 2) = trunc(rating * 2)` when non-null.

Indexes:
- PK covers owner/movie lookup and owner prefix scans.
- partial `(user_id, watched_at desc) WHERE watched_at IS NOT NULL`.
- partial `(user_id, watchlisted_at desc) WHERE watchlisted_at IS NOT NULL`.
- partial `(user_id, favorited_at desc) WHERE favorited_at IS NOT NULL`.
- optional `(user_id, rating desc) WHERE rating IS NOT NULL` if library sort query plan justifies it.

Soft delete: no. State removal is a hard row delete when empty.

---

## T-004 — `personal_reviews`

Purpose: separate private free-text note/review so generic offline library caching does not need to persist text.

| Column | Type | Null | Default / constraints |
|---|---|---:|---|
| `id` | `uuid` | no | PK, `gen_random_uuid()` |
| `user_id` | `uuid` | no | FK auth user `ON DELETE CASCADE` |
| `movie_id` | `uuid` | no | FK movie `ON DELETE RESTRICT` |
| `body` | `text` | no | trimmed length 1–5000 |
| `contains_spoiler` | `boolean` | no | `false` |
| `created_at` | `timestamptz` | no | `now()` |
| `updated_at` | `timestamptz` | no | `now()` |

Constraints:
- unique `(user_id, movie_id)` — one current private note per movie in MVP.
- A DB trigger/constraint strategy must ensure a review is only allowed when the same user/movie has `watched_at IS NOT NULL`. Preferred implementation: trusted transaction/RPC or constraint trigger if direct client writes cannot enforce safely; do **not** rely only on client UI.

Indexes:
- unique `(user_id, movie_id)`.
- `(user_id, updated_at desc)` only if profile/recent-note query is implemented.

Soft delete: no. User can hard-delete their note.

---

## T-005 — `taste_selections`

Purpose: liked-film signals from onboarding without silently marking films watched in the personal library.

| Column | Type | Null | Default / constraints |
|---|---|---:|---|
| `user_id` | `uuid` | no | FK auth user `ON DELETE CASCADE` |
| `movie_id` | `uuid` | no | FK movie `ON DELETE RESTRICT` |
| `created_at` | `timestamptz` | no | `now()` |

Primary key:
- `(user_id, movie_id)`.

Indexes:
- PK is sufficient.

Soft delete: no; deselection deletes row.

---

## T-006 — `lists`

Purpose: owner-private named film collections.

| Column | Type | Null | Default / constraints |
|---|---|---:|---|
| `id` | `uuid` | no | PK, `gen_random_uuid()` |
| `user_id` | `uuid` | no | FK auth user `ON DELETE CASCADE` |
| `name` | `text` | no | trimmed length 1–80 |
| `description` | `text` | yes | max 1000 chars when present |
| `created_at` | `timestamptz` | no | `now()` |
| `updated_at` | `timestamptz` | no | `now()` |

Indexes/uniqueness:
- `(user_id, created_at desc)`.
- unique expression index on `(user_id, lower(btrim(name)))` to prevent confusing same-owner case/space-equivalent duplicate names.

Soft delete: no. Delete list explicitly; memberships cascade.

---

## T-007 — `list_movies`

Purpose: many-to-many list membership.

| Column | Type | Null | Default / constraints |
|---|---|---:|---|
| `list_id` | `uuid` | no | FK `lists(id)` `ON DELETE CASCADE` |
| `movie_id` | `uuid` | no | FK `movies(id)` `ON DELETE RESTRICT` |
| `position` | `integer` | yes | `>= 0` when used; manual ordering not required initially |
| `added_at` | `timestamptz` | no | `now()` |

Primary key:
- `(list_id, movie_id)` prevents duplicates.

Indexes:
- PK.
- `(movie_id)` only if reverse membership query is actually used; otherwise defer.

RLS ownership is derived through parent `lists.user_id`.

Soft delete: no.

---

## T-008 — `shelves`

Purpose: shared KARE automatic/curated shelf definitions.

| Column | Type | Null | Default / constraints |
|---|---|---:|---|
| `id` | `uuid` | no | PK, `gen_random_uuid()` |
| `slug` | `text` | no | unique; stable lowercase app key |
| `title` | `text` | no | Turkish MVP title |
| `description` | `text` | yes | — |
| `kind` | `text` | no | check `curated` or `dynamic` |
| `rule_key` | `text` | yes | trusted predefined rule key for dynamic shelf |
| `rule_config` | `jsonb` | no | `'{}'::jsonb`; server/config only |
| `sort_order` | `integer` | no | `0` |
| `is_active` | `boolean` | no | `true` |
| `created_at` | `timestamptz` | no | `now()` |
| `updated_at` | `timestamptz` | no | `now()` |

Checks:
- `kind='curated'` → `rule_key IS NULL`.
- `kind='dynamic'` → non-empty `rule_key`.
- `rule_config` must be a JSON object.
- Client never submits arbitrary rule config.

Indexes:
- unique `slug`.
- `(is_active, sort_order, id)` for Discover shelf ordering.

Writes:
- migrations/seed or trusted server only.

Soft delete: use `is_active=false`.

---

## T-009 — `shelf_movies`

Purpose: explicit membership/order for subjective curated shelves.

| Column | Type | Null | Default / constraints |
|---|---|---:|---|
| `shelf_id` | `uuid` | no | FK `shelves(id)` `ON DELETE CASCADE` |
| `movie_id` | `uuid` | no | FK `movies(id)` `ON DELETE RESTRICT` |
| `position` | `integer` | no | `>= 0` |
| `created_at` | `timestamptz` | no | `now()` |

Primary key:
- `(shelf_id, movie_id)`.

Unique:
- `(shelf_id, position)`.

Writes: trusted server/migration only.

Soft delete: no; shelf inactivity happens on parent.

---

## T-010 — `recommendation_runs`

Purpose: immutable record of a guided decision request and algorithm version.

| Column | Type | Null | Default / constraints |
|---|---|---:|---|
| `id` | `uuid` | no | PK, `gen_random_uuid()` |
| `user_id` | `uuid` | no | FK auth user `ON DELETE CASCADE` |
| `mood` | `text` | no | check approved enum values |
| `runtime_bucket` | `text` | no | check approved enum values |
| `challenge_level` | `text` | no | check `easy`,`medium`,`hard` |
| `exclude_watched` | `boolean` | no | `true` |
| `filters` | `jsonb` | no | `'{}'`; bounded validated object |
| `algorithm_version` | `text` | no | e.g. `rules-v1` |
| `status` | `text` | no | `completed`,`no_candidates`,`failed` |
| `created_at` | `timestamptz` | no | `now()` |

Example approved mood keys are app-owned stable enums such as:
`sakin`, `eglenceli`, `duygusal`, `gerilim`, `dusundurucu`, `romantik`, `ilham`, `agir`.
Exact final keys are frozen in implementation constants + DB check in the same migration.

Checks:
- `filters` JSON object and bounded serialized size (target <= 4 KiB).

Indexes:
- `(user_id, created_at desc)`.
- `(algorithm_version, created_at)` only if experiment reporting later requires it.

Writes:
- server `recommend` Edge Function only.
- authenticated client select own; no direct insert/update/delete.

Soft delete: no. Deleted with user/account.

---

## T-011 — `recommendation_items`

Purpose: immutable ranked recommendations and evidence for a run.

| Column | Type | Null | Default / constraints |
|---|---|---:|---|
| `id` | `uuid` | no | PK, `gen_random_uuid()` |
| `run_id` | `uuid` | no | FK `recommendation_runs(id)` `ON DELETE CASCADE` |
| `movie_id` | `uuid` | no | FK `movies(id)` `ON DELETE RESTRICT` |
| `rank` | `smallint` | no | 1–3 |
| `score` | `numeric` | no | server-generated |
| `explanation` | `text` | no | non-empty, max 500 chars |
| `evidence` | `jsonb` | no | server-generated bounded JSON object/array |
| `created_at` | `timestamptz` | no | `now()` |

Constraints:
- unique `(run_id, rank)`.
- unique `(run_id, movie_id)`.
- `evidence` bounded serialized size (target <= 8 KiB).

Indexes:
- `(run_id, rank)` covered by unique index.
- `(movie_id)` only if reverse analysis needs it.

Writes:
- server only; client select through parent run ownership.

Soft delete: no.

---

## T-012 — `recommendation_acceptances`

Purpose: trusted attribution fact that a user accepted/saved a specific recommendation item.

Why separate:
- avoids giving the client write access to immutable recommendation items;
- avoids exposing a cross-user recommendation-item FK column in general-purpose `user_movie_state` writes;
- makes WSMD attribution explicit.

| Column | Type | Null | Default / constraints |
|---|---|---:|---|
| `recommendation_item_id` | `uuid` | no | PK; FK item `ON DELETE CASCADE` |
| `user_id` | `uuid` | no | FK auth user `ON DELETE CASCADE` |
| `movie_id` | `uuid` | no | FK movie `ON DELETE RESTRICT` |
| `accepted_at` | `timestamptz` | no | `now()` |

Write path:
- `recommendation-accept` Edge Function validates caller JWT.
- Loads item → run and verifies `run.user_id = caller`.
- Verifies item movie ID.
- In one trusted transaction/RPC, records acceptance and upserts watchlist state as appropriate.
- Repeated acceptance is idempotent.

Read:
- owner may select own acceptance rows if UI/measurement needs it.

Indexes:
- PK item.
- `(user_id, accepted_at desc)`.
- `(user_id, movie_id, accepted_at)` for conversion query.

Primary WSMD relationship:
`acceptance(user,movie,accepted_at)` joined to `user_movie_state(user,movie,watched_at)` where `watched_at >= accepted_at` within the defined measurement window.

Soft delete: no; account deletion cascades.

---

## T-013 — `product_events`

Purpose: small, privacy-constrained funnel/diagnostic telemetry supplemental to canonical DB facts.

| Column | Type | Null | Default / constraints |
|---|---|---:|---|
| `id` | `uuid` | no | PK, `gen_random_uuid()` |
| `user_id` | `uuid` | no | FK auth user `ON DELETE CASCADE` |
| `event_name` | `text` | no | non-empty, max 64 |
| `app_session_id` | `uuid` | yes | analytics session identifier, **not auth token** |
| `context` | `jsonb` | no | `'{}'`, object, bounded target <= 4 KiB |
| `created_at` | `timestamptz` | no | `now()` |

Rules:
- No review/list free text, credentials, auth tokens, email or TMDB secret in context.
- Event names and allowed context keys are validated in a typed application analytics layer.
- Client telemetry is not considered security/audit truth and may be spoofed by the account owner.

Indexes:
- `(user_id, created_at desc)`.
- `(event_name, created_at desc)` for aggregate beta funnels, if query evidence warrants it.

Client access:
- authenticated INSERT self only.
- no authenticated SELECT/UPDATE/DELETE grant required.
- service/admin analysis uses trusted access.

Soft delete: no; cascades with user.

---

# 6. Relationships

```text
auth.users 1 ── 1 profiles
    │
    ├── * user_movie_state * ── 1 movies
    ├── * personal_reviews * ── 1 movies
    ├── * taste_selections * ── 1 movies
    ├── * lists 1 ── * list_movies * ── 1 movies
    ├── * recommendation_runs 1 ── * recommendation_items * ── 1 movies
    │                                      │
    │                                      └── 0..1 recommendation_acceptances
    └── * product_events

shelves 1 ── * shelf_movies * ── 1 movies
```

`movies` is shared; user-owned tables reference it rather than copying provider metadata.

---

# 7. Grants and RLS

## Baseline migration posture

For every new public table:
1. `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`
2. revoke broad defaults from `anon` and `authenticated`;
3. grant only required table/column operations;
4. add explicit policies;
5. add automated allow/deny tests.

Do not assume “RLS enabled” alone is sufficient; grants and policies are both reviewed.

## Policy matrix

### `profiles`
Authenticated grants:
- `SELECT` self row.
- column-limited `UPDATE` for mutable profile/onboarding columns; no client update of `user_id`, `created_at`.
- no client `INSERT` if auth trigger owns creation.
- no ordinary client `DELETE`; account deletion path is server-side.

Policies:
- SELECT: `user_id = auth.uid()`.
- UPDATE USING: `user_id = auth.uid()`.
- UPDATE WITH CHECK: `user_id = auth.uid()`.

### `movies`
Authenticated:
- SELECT only.

Policy:
- SELECT to authenticated `USING (is_active = true)` for normal client reads.
- No anon policy.
- No authenticated insert/update/delete grants.

Trusted server can access inactive rows when needed.

### `user_movie_state`
Authenticated grants: SELECT, INSERT, UPDATE, DELETE.

Policies:
- SELECT `user_id = auth.uid()`.
- INSERT `WITH CHECK (user_id = auth.uid())`.
- UPDATE `USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())`.
- DELETE `USING (user_id = auth.uid())`.

### `personal_reviews`
Same owner policy pattern as `user_movie_state`.

Additionally, watched prerequisite must be enforced in DB/trusted transaction, not merely RLS UI.

### `taste_selections`
Same owner policy pattern.

### `lists`
Same owner policy pattern.

### `list_movies`
Ownership derived from parent list.

SELECT/INSERT/UPDATE/DELETE policies use:
`EXISTS (SELECT 1 FROM public.lists l WHERE l.id = list_movies.list_id AND l.user_id = auth.uid())`
with equivalent `WITH CHECK` for inserts/updates.

No policy grants access merely because a user knows a list UUID.

### `shelves`
Authenticated SELECT only:
- `USING (is_active = true)`.

No authenticated writes.

### `shelf_movies`
Authenticated SELECT only if parent shelf is active:
`EXISTS (SELECT 1 FROM public.shelves s WHERE s.id=shelf_id AND s.is_active=true)`.

No authenticated writes.

### `recommendation_runs`
Authenticated SELECT own only: `user_id = auth.uid()`.
No client insert/update/delete grants.

### `recommendation_items`
Authenticated SELECT only when parent run belongs to user:
`EXISTS (SELECT 1 FROM public.recommendation_runs r WHERE r.id=run_id AND r.user_id=auth.uid())`.
No client writes.

### `recommendation_acceptances`
Authenticated SELECT own if UI requires: `user_id = auth.uid()`.
No client insert/update/delete. Trusted acceptance function writes after validating item/run ownership.

### `product_events`
Authenticated INSERT only with `WITH CHECK (user_id = auth.uid())`.
No client SELECT/UPDATE/DELETE.

### `anon`
No policies/grants on product tables.

---

# 8. Column-level grant considerations

Use column grants where they meaningfully reduce mutation surface:
- `profiles`: update only display/onboarding/locale columns intended for user change.
- Shared/server-generated tables: no authenticated mutation grant at all.

For owner tables where most fields are legitimately mutable, table UPDATE + RLS + DB checks is acceptable. Do not grant update to immutable owner/FK/created-at fields if the generated API can practically express narrower column grants; otherwise add immutable-field triggers/checks and tests.

---

# 9. Functions / triggers / trusted transactions

## `handle_new_user`
- trigger on `auth.users` insert;
- creates `profiles(user_id)`.
- fixed search path / fully qualified names;
- minimal privileges;
- tested for one profile per user.

## `set_updated_at`
- internal trigger for mutable tables.

## Watched prerequisite for private review
Preferred options, in order:
1. Exposed RPC that transactionally validates owner + watched state then upserts review, with normal owner privileges/RLS where possible; or
2. constraint trigger that rejects review row without matching watched state.

Do not ship only a client-side check.

## `recommendation-accept`
Implemented as Edge Function plus a narrow transaction/RPC if needed:
1. validate JWT;
2. resolve recommendation item and owning run;
3. verify caller owns run;
4. insert acceptance idempotently;
5. upsert watchlist state, respecting the “already watched means no active watchlist” invariant;
6. return canonical state.

If a `SECURITY DEFINER` RPC is used, it must:
- fix `search_path`;
- validate `auth.uid()` inside SQL;
- expose only the narrow operation;
- have explicit execute grants;
- have allow/deny tests.

## Account deletion
`delete-account` Edge Function:
- requires valid recent user session/re-auth behavior chosen at implementation;
- uses Auth Admin/service role only after caller identity validation;
- deleting `auth.users` causes user-owned FK cascades;
- clears/invalidates auth session;
- shared `movies/shelves` unaffected.

---

# 10. Storage buckets

**MVP: N/A.**

Reason:
- no user-uploaded avatar/media is required by README/PRODUCT_SPEC;
- poster/backdrop media is referenced from TMDB provider paths/CDN;
- creating a bucket without a feature need would increase authorization surface.

If avatar upload becomes approved later, DATABASE.md must be amended before bucket creation with:
- private/public decision;
- object naming/ownership convention;
- MIME/size limits;
- insert/select/update/delete object policies;
- account deletion cleanup.

---

# 11. Cascade and deletion behavior

| Parent deletion | Child behavior |
|---|---|
| `auth.users` | CASCADE profile, state, reviews, taste, lists, recommendation runs/acceptances, product events |
| `lists` | CASCADE `list_movies` |
| `recommendation_runs` | CASCADE `recommendation_items`; item deletion CASCADE acceptance |
| `shelves` | CASCADE `shelf_movies` |
| `movies` | RESTRICT while referenced; prefer `is_active=false` |

Account deletion expectation:
- One Auth user deletion eliminates owner-private relational content through tested cascades.
- No “soft-deleted but still readable via API” user content remains.
- External telemetry/log retention outside these tables, if introduced later, must be separately documented in privacy/release work.

---

# 12. Retention

### Active account data
- Library/list/review/taste data: retained while account exists because it is the product itself.
- Recommendation runs/items/acceptances: retained while account exists during beta to compute product value and improve deterministic ranking; public release should apply a bounded operational retention if privacy review determines full history is unnecessary.
- Product events: target maximum **365 days** for beta/product analysis unless a shorter operational window proves sufficient.

### Before public release
Phase 8/Stage 14 must implement/document a cleanup mechanism for telemetry older than the approved retention period (scheduled DB job or trusted maintenance function using current Supabase-supported mechanism).

### Account deletion
Owner-linked rows above delete immediately with account cascade, regardless of normal retention window, except records that must legally be retained; no such legal-retention requirement is currently specified.

---

# 13. Movie cache freshness

- `cache_refreshed_at` records KARE’s last successful provider refresh, not a claim about TMDB’s internal update timestamp.
- Edge Function decides TTL by endpoint/use case.
- Stale cache may serve as degraded data while refresh fails, where product behavior allows it.
- No raw TMDB API response archive by default; store only normalized fields needed by approved features.
- Provider attribution requirements are presentation/release requirements, not DB ownership claims.

---

# 14. Recommendation data integrity

Server-generated `recommendation_items.evidence` must use a versioned allowlisted schema such as:
- current request matches (`runtime_match`, `mood_mapping`, `challenge_mapping`);
- positive genre signals;
- explicit positive source movie IDs when truthfully supported;
- `curated_fallback`.

Do not store generated psychological/user-trait labels.

The explanation renderer must be reproducible from evidence + algorithm version sufficiently for audits/tests.

`recommendation_runs/items` are immutable from the app client so users cannot rewrite history/evidence through Data API.

---

# 15. Index rationale / anti-over-indexing

Create only indexes tied to known flows/RLS:
- owner + timestamps for library/profile queries;
- parent FKs used by RLS joins;
- TMDB unique lookup;
- GIN genre array used by filter/recommendation;
- run/item parent lookup.

Every FK column not already covered by a leftmost btree/PK should be reviewed for an index during migration implementation using actual query shapes.

Do not add indexes for hypothetical social/public queries outside MVP.

---

# 16. Migration strategy

After this design gate passes:
1. Initialize Supabase project files locally.
2. Create small dependency-ordered migrations, not one opaque mega-migration.
3. Suggested order:
   - extensions/common trigger helpers;
   - profile + auth trigger;
   - movies/shared cache;
   - user state/review/taste;
   - lists/memberships;
   - shelves/content;
   - recommendation tables/transaction helper;
   - telemetry;
   - grants/RLS paired with each table migration where practical;
   - seed only development/curated content.
4. Never edit already-applied production migrations; add forward migration.
5. Local reset must rebuild schema deterministically.
6. Production migration requires backup/rollback/recovery plan at release gate.

No migrations are executed during Stage 06 design.

---

# 17. Required RLS / authorization tests

At minimum, automated Supabase DB tests must prove the following before the relevant vertical slice/core phase passes.

## Auth baseline
1. `anon` cannot select any owner-private table.
2. `anon` cannot select shared movie/shelf tables unless product scope later explicitly makes them public.

## Profiles
3. User A can select own profile.
4. User A cannot select User B profile.
5. User A cannot update User B profile.
6. User A cannot mutate immutable profile ownership/created-at fields through exposed API.

## Movie state
7. User A can insert/update/delete own movie state satisfying constraints.
8. User A cannot read User B movie state.
9. User A cannot write a row with `user_id = B`.
10. Rating without watched is rejected.
11. Watched + active watchlist combination is rejected.
12. Invalid 0.7 or 5.5 rating is rejected.

## Reviews
13. User A can read own review.
14. User B cannot read A review.
15. Review for a movie not watched by the caller is rejected by DB/trusted write boundary.

## Lists
16. User A can CRUD own list.
17. User B cannot read A list.
18. User B cannot insert a membership into A list even with its UUID.
19. Duplicate same movie/list membership is rejected/idempotent.
20. Deleting a list deletes membership rows but not user movie state.

## Taste
21. User A cannot read B taste selections.

## Shared content
22. Authenticated user can read active movie/shelf content.
23. Authenticated user cannot insert/update/delete `movies`, `shelves`, `shelf_movies`.
24. Inactive shared content is hidden from normal client policy where specified.

## Recommendations
25. User A can read own run/items.
26. User A cannot read User B run/items even if UUID is known.
27. Authenticated client cannot directly insert/update recommendation run/item.
28. Recommendation acceptance rejects item owned by another user.
29. Recommendation acceptance is idempotent for same item.
30. Acceptance of already-watched movie does not create an invalid watched+watchlist state.

## Telemetry
31. User A may insert event only with own `user_id`.
32. User A cannot select/update/delete telemetry through client grants.

## Account deletion
33. Test user deletion cascades all user-owned tables.
34. Shared `movies/shelves` survive test user deletion.

---

# 18. Public/private API summary

### Mobile may query directly under RLS
- own `profiles` (selected mutable fields);
- own `user_movie_state`;
- own `personal_reviews` through safe watched-enforcing write path;
- own `taste_selections`;
- own `lists`/`list_movies`;
- shared read-only `movies`, `shelves`, `shelf_movies`;
- own recommendation run/item/acceptance reads;
- insert-only own product events.

### Edge Function only
- TMDB calls/token;
- movie-cache upserts;
- dynamic shelf remote feed orchestration;
- recommendation generation;
- recommendation acceptance transaction/attribution;
- account deletion/Auth Admin;
- any future privileged content maintenance.

---

# 19. Database gate checklist

- [x] Tables map to approved MVP features only.
- [x] PK/FK/unique/check/null/default rules are defined.
- [x] Owner-private vs shared/derived data is classified.
- [x] RLS and grants are explicit for every client-exposed table.
- [x] `service_role` is server-only and narrowly scoped.
- [x] Storage is explicitly N/A rather than left undefined.
- [x] Cascade/account-deletion behavior is defined.
- [x] Soft-delete decisions are explicit.
- [x] Known indexes are tied to actual product/RLS queries.
- [x] Allow/deny security tests are enumerated.
- [x] No migration has been run before design review.

A focused data-ownership/RLS review is required next. Preferred reviewer per `MODEL_ROUTING.md` is `gpt-6-astra`; if unavailable, a GPT-5.6 Sol high-reasoning review must be labeled `FALLBACK` and may pass only with no unresolved P0/P1 finding.
