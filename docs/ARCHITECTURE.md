# KARE — Architecture

**Architecture snapshot:** 2026-09-07  
**Lifecycle stage:** 05  
**Target:** iOS + Android mobile app; no required production web surface in MVP.

## 1. Architecture goals

- Deliver the smallest production-shaped mobile architecture that supports the approved KARE core loop.
- Keep privileged credentials and TMDB application authentication outside the mobile bundle.
- Make user ownership enforceable in the database, not merely in UI code.
- Make recommendation explanations deterministic and traceable to real signals.
- Avoid a large pre-ingested movie database; treat TMDB as external canonical metadata and KARE Postgres as a normalized cache + product/user data layer.
- Support a useful degraded/offline library without inventing a complex multi-master sync engine.
- Preserve reversibility: social, payments, AI chat, advanced awards and streaming are not architectural prerequisites for MVP.

---

## 2. Chosen stack

### Mobile
- **Expo SDK 57** with **React Native 0.86** and **React 19.2.3**, TypeScript strict mode.
- **Expo Router** for file-based navigation using `src/app`.
- **TanStack Query** for server state, request deduplication, cache invalidation and selective persisted read cache.
- Local React state/reducers for ephemeral UI and `Ne İzlesem?` wizard state; no general-purpose global-state library initially.
- `expo-image` for poster/backdrop rendering and image cache behavior.
- `@supabase/supabase-js` for authenticated Data API/Auth/Edge Function calls.
- `zod` at trust boundaries for environment and external-function response/request validation.

### Backend
- **Supabase**:
  - Postgres — KARE user data, movie metadata cache, curated shelf definitions, recommendation records and product measurement facts.
  - Auth — KARE account/session identity.
  - Edge Functions — TMDB proxy/normalization, recommendation orchestration, privileged account deletion and other logic requiring secrets.
  - Storage — **N/A in MVP** unless product scope later adds user-uploaded avatars. No bucket is created merely because Supabase provides Storage.

### External movie metadata
- **TMDB API v3** via server-side Edge Functions only.
- Mobile client never receives the TMDB read access token.
- KARE stores TMDB stable movie IDs and a normalized cache of fields it actually needs.

### Toolchain
- Node.js **22.13.x or later within the Expo SDK 57-supported Node 22 line** for repository tooling.
- npm + committed `package-lock.json` for lowest setup complexity.
- Jest + `jest-expo` + React Native Testing Library for unit/component tests.
- Supabase CLI for local migrations, Edge Functions and DB/RLS tests.
- GitHub Actions for repository CI.
- EAS Build for preview/production native binaries; store submission remains a later explicit external action.

### Why this stack
1. The product is explicitly mobile-first, and Expo provides a current React Native toolchain plus Router and EAS integration.
2. Supabase directly covers the approved requirements: auth, owner-private relational data, RLS and server-side functions without introducing a separate API server for routine CRUD.
3. TMDB credentials and normalization belong behind a trusted server boundary; Supabase Edge Functions are sufficient for MVP and avoid a second backend platform.
4. TanStack Query solves real product requirements—request lifecycle, caching, retry and selective offline persistence—without forcing domain state into a global store.

---

## 3. Current-source verification

Version-sensitive choices were checked against primary sources on 2026-09-07.

### Expo
- Expo’s current SDK matrix lists SDK 57 with React Native 0.86, React 19.2.3 and minimum Node 22.13.x: https://docs.expo.dev/versions/latest/
- Expo recommends Expo Router for Expo projects, and current Router docs use `src/app` for route files: https://docs.expo.dev/develop/app-navigation/ and https://docs.expo.dev/router/basics/core-concepts/
- EAS Build is the hosted Expo service for Android/iOS binaries: https://docs.expo.dev/build/introduction/
- Expo documents Jest through `jest-expo`: https://docs.expo.dev/develop/unit-testing/

### Supabase
- Current Expo/React Native quickstarts use a publishable key in the app and explicitly call out production RLS review: https://supabase.com/docs/guides/getting-started/quickstarts/expo-react-native
- Current RLS guidance states exposed tables require deliberate grants + RLS and recommends allow/deny database tests: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase documents Data API access with a publishable key protected by RLS and Edge Functions for logic/secrets: https://supabase.com/docs/guides/database/secure-data
- Supabase’s JavaScript initialization docs include React Native storage patterns and an encrypted AsyncStorage pattern with a SecureStore-held encryption key: https://supabase.com/docs/reference/javascript/initializing

### TMDB
- TMDB API v3 remains the documented movie API entry point: https://developer.themoviedb.org/reference/getting-started
- Application-level authentication supports a Bearer API read access token: https://developer.themoviedb.org/docs/authentication-application
- TMDB documents soft upper rate limits around the 40 requests/second range and requires clients to respect HTTP 429; the limit may change: https://developer.themoviedb.org/docs/rate-limiting
- TMDB’s FAQ states developer API use is free for non-commercial purposes with attribution, requires the approved TMDB logo and the notice “This product uses the TMDB API but is not endorsed or certified by TMDB,” and distinguishes commercial licensing: https://developer.themoviedb.org/docs/faq

**Product/business implication:** the repository can implement technical integration now, but commercial TMDB licensing/permission is a human/business gate before monetized public operation if KARE’s use becomes commercial.

---

## 4. System boundaries

```text
┌──────────────────────────────────────────────────────────┐
│ KARE Expo mobile app                                    │
│ UI / Expo Router / Query cache / local preferences      │
└───────────────┬───────────────────────┬──────────────────┘
                │                       │
       owner-scoped CRUD          function invocation
                │                       │
                ▼                       ▼
┌────────────────────────┐   ┌─────────────────────────────┐
│ Supabase Data API/Auth │   │ Supabase Edge Functions    │
│ publishable key + JWT  │   │ user JWT / server secrets  │
└────────────┬───────────┘   └──────────────┬──────────────┘
             │                               │
             ▼                               ├── TMDB API
┌────────────────────────┐                   │   Bearer token secret
│ Postgres + RLS         │◄──────────────────┘
│ user + shared content  │
│ normalized movie cache│
└────────────────────────┘
```

### Client is responsible for
- navigation and presentation;
- user input and client-side validation for UX;
- owner-scoped routine CRUD through Supabase client;
- query/cache lifecycle;
- local degraded read cache;
- emitting non-sensitive analytics signals;
- rendering recommendation explanations returned by trusted recommendation logic.

### Database is responsible for
- canonical KARE user-owned state;
- relational constraints and uniqueness;
- RLS + grants;
- shared shelf definitions/content references;
- normalized movie cache;
- recommendation run/item persistence and conversion facts;
- timestamps and ownership invariants.

### Edge Functions are responsible for
- TMDB credential use;
- TMDB request validation, normalization, retry/429 handling and cache upsert;
- recommendation candidate generation/scoring/explanation orchestration;
- actions that need privileged Auth Admin/service access such as final account deletion;
- any future vendor secret that must not ship to the app.

### TMDB is responsible for
- canonical external movie metadata/images/IDs as licensed by TMDB terms.

KARE does **not** use TMDB user authentication; KARE Auth/User data remains independent.

---

## 5. Repository structure

```text
KARE/
├─ AGENTS.md
├─ README.md
├─ app.json / app.config.ts
├─ eas.json
├─ package.json
├─ package-lock.json
├─ tsconfig.json
├─ eslint.config.*
├─ jest.config.*
├─ .env.example
├─ src/
│  ├─ app/                         # Expo Router routes only
│  │  ├─ _layout.tsx
│  │  ├─ (auth)/
│  │  │  ├─ sign-in.tsx
│  │  │  └─ sign-up.tsx
│  │  ├─ onboarding/
│  │  │  └─ taste.tsx
│  │  ├─ (tabs)/
│  │  │  ├─ _layout.tsx
│  │  │  ├─ index.tsx             # Discover
│  │  │  ├─ library.tsx
│  │  │  ├─ lists.tsx
│  │  │  └─ profile.tsx
│  │  ├─ search.tsx
│  │  ├─ movie/[movieId].tsx
│  │  ├─ shelf/[shelfId].tsx
│  │  ├─ list/[listId].tsx
│  │  ├─ recommend/index.tsx
│  │  ├─ recommend/result/[runId].tsx
│  │  └─ settings.tsx
│  ├─ components/                 # reusable UI; never routes
│  ├─ features/
│  │  ├─ auth/
│  │  ├─ movies/
│  │  ├─ library/
│  │  ├─ lists/
│  │  ├─ shelves/
│  │  ├─ recommendations/
│  │  └─ profile/
│  ├─ lib/
│  │  ├─ supabase/
│  │  ├─ query/
│  │  ├─ analytics/
│  │  ├─ logger/
│  │  ├─ env/
│  │  └─ errors/
│  ├─ design/
│  │  ├─ tokens.ts
│  │  └─ typography.ts
│  └─ test/
├─ supabase/
│  ├─ config.toml
│  ├─ migrations/
│  ├─ functions/
│  │  ├─ movie-search/
│  │  ├─ movie-detail/
│  │  ├─ shelf-feed/
│  │  ├─ recommend/
│  │  └─ delete-account/
│  ├─ tests/
│  └─ seed.sql                    # development/test seed only
└─ docs/
```

Principles:
- `src/app` contains route composition, not reusable business implementation.
- Feature modules own components/hooks/query keys/schemas for their domain.
- Supabase-generated types live under `src/lib/supabase` and are regenerated from schema.
- Shared domain rules do not live in screen files.

---

## 6. Navigation and app bootstrap

### Root bootstrap order
1. Load/validate public environment configuration.
2. Initialize logger.
3. Initialize Supabase client and encrypted session adapter.
4. Initialize QueryClient + selective cache persistence.
5. Resolve auth session once.
6. Resolve user profile/onboarding completion when authenticated.
7. Route:
   - no session → `(auth)`;
   - new/incomplete onboarding → `onboarding/taste`;
   - ready user → `(tabs)` Discover.

The app must avoid a race where both authenticated and unauthenticated route trees briefly render.

### Router
- Expo Router route files under `src/app`.
- Auth and tab groups isolate navigation concerns.
- Movie IDs and run/list/shelf IDs are URL/route params and validated before use.
- Deep-link support is kept compatible with future auth recovery/verification callbacks, but no unrelated deep-link feature is added.

---

## 7. State model

### Server state — TanStack Query
Use Query for:
- movie search/detail function responses;
- user movie state/library;
- lists/memberships;
- shelves/feed;
- recommendation runs/results;
- profile statistics.

Rules:
- Query keys are centralized per feature.
- Mutations invalidate/update only relevant keys.
- Optimistic update is permitted for simple idempotent toggles only and must include rollback.
- Failed mutation can never remain visually “saved” after reconciliation.

### Ephemeral UI state
Use component state/useReducer for:
- `Ne İzlesem?` wizard selections;
- filter sheets before apply;
- form input;
- bottom sheet visibility.

No Zustand/Redux initially. Add a global client-state library only if repository evidence demonstrates cross-tree state that Router/Query/context cannot handle cleanly.

### Persisted local cache
Use TanStack Query persistence to AsyncStorage with a **whitelist** of safe query families.

May persist:
- normalized public movie metadata;
- automatic shelf responses/config;
- owner library state needed for offline poster grid (movie IDs, watched/watchlist/favorite, rating, dates);
- basic profile counts if derived from same cached state.

Do **not** persist through generic Query cache:
- private free-text notes/reviews;
- auth tokens/session (handled separately);
- server/service secrets;
- raw error payloads;
- arbitrary analytics payloads.

On sign-out/account deletion:
- clear owner-private persisted query cache;
- public movie/image cache may remain if not keyed to the user;
- destroy local auth session storage.

No offline write queue in MVP. Offline mutations are blocked or fail visibly. This avoids conflict-resolution complexity while still allowing useful read-only library browsing.

---

## 8. Authentication and session security

### Auth method
MVP starts with Supabase email/password authentication. Other providers are not required for the first vertical slice.

### Client credentials
The app contains only:
- `EXPO_PUBLIC_SUPABASE_URL`;
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

These are not privileged secrets; database authorization is enforced through grants + RLS.

### Session storage
Do not store the Supabase session as plain generic app state.

Use the current Supabase-documented React Native secure-storage pattern:
- session payload encrypted in AsyncStorage;
- encryption key stored in Expo SecureStore;
- handle native SecureStore failures;
- clear on sign out.

Reason: Expo documents that SecureStore can reject large values on underlying platforms, while Supabase documents an encrypted AsyncStorage + SecureStore-key adapter pattern for React Native.

### Refresh lifecycle
- `persistSession: true`.
- `autoRefreshToken: true`.
- `detectSessionInUrl: false` for ordinary native operation, with dedicated deep-link callback handling added when email verification/password recovery requires it.
- App foreground/background hooks start/stop refresh according to current Supabase guidance during implementation.
- On one refreshable auth failure: refresh once then retry safe/idempotent request once.
- On unrecoverable session failure: clear protected local user cache and return to sign in.

---

## 9. Authorization boundary

### Default rule
Every client-exposed owner-private table has:
1. least-privilege grants; and
2. RLS enabled; and
3. explicit per-operation policies.

`auth.uid()` ownership is enforced in Postgres. Client filters such as `.eq('user_id', user.id)` are convenience/performance only and never the security boundary.

### Shared app content
Movie cache and shelf definitions can be readable to authenticated users (or public later if explicitly needed), but client write grants are denied. Server/Edge Function or reviewed migrations own those writes.

### Service role
- Never in Expo environment variables.
- Never in repository.
- May exist only as Supabase-managed/server secret in trusted Edge Function/admin context.
- Use only for operations that truly require privilege (e.g. Auth Admin deletion or controlled cache/content upsert).

### Edge Function auth
Functions that act on user-private data require a valid user JWT. Prefer user-scoped Supabase clients carrying the caller Authorization header so RLS remains active. If a service-role client is required for a narrow action, the function must independently validate JWT/ownership and keep the privileged operation minimal.

---

## 10. TMDB integration architecture

### Rule: no TMDB token in client
`TMDB_READ_ACCESS_TOKEN` is an Edge Function secret.

### `movie-search`
Input:
- sanitized non-empty query;
- language/region enum configured by app;
- page within bounded range.

Behavior:
1. Verify caller/app request shape.
2. Call TMDB search through server Bearer token.
3. Respect 429/5xx with bounded retry/backoff; no unbounded bulk crawling.
4. Normalize result to KARE schema.
5. Opportunistically upsert minimal movie cache by TMDB ID.
6. Return normalized result only.

### `movie-detail`
1. Validate TMDB movie ID integer.
2. Serve fresh-enough KARE cache when appropriate.
3. Otherwise call TMDB detail endpoints and normalize only fields KARE needs.
4. Upsert cache with source timestamp.
5. Return normalized detail.

Use TMDB `append_to_response` only when it measurably reduces required requests for approved metadata; do not fetch cast/video/image sets by default when MVP does not display them.

### Images
Store TMDB image path/config-derived URL metadata, not copied image binaries, unless future terms/performance needs justify another strategy.

### Attribution
The app Settings/About/Credits surface must include TMDB’s required attribution/logo/notice before public use. This is a release acceptance criterion, not optional polish.

### Commercial licensing blocker
TMDB’s current FAQ distinguishes developer/non-commercial use from commercial licensing. Monetization/payment implementation must not activate until the owner confirms appropriate TMDB commercial rights if required.

---

## 11. Recommendation architecture

MVP recommendation is **deterministic server-side ranking, not LLM generation**.

### Endpoint
`recommend` Edge Function.

### Request
Typed enum/filter payload:
- mood;
- runtime bucket;
- challenge level;
- exclude-watched flag default true;
- optional approved filters.

### Inputs to ranking
1. current request constraints;
2. explicit user ratings;
3. favorites;
4. taste-onboarding likes;
5. weaker watch/list interaction signals;
6. curated/cold-start priors.

### Candidate generation
Use a bounded combination of:
- cached/shared KARE movie candidates;
- TMDB Discover/search requests mapped from explicit request filters and known preferred genres/metadata;
- curated shelf candidates for cold start.

No bulk crawl.

### Scoring
Implementation plan must define a versioned pure scoring module with tests. Scoring returns:
- numeric score;
- evidence tokens (e.g. `runtime_match`, `genre_preference:18`, `liked_movie:<id>`, `curated_fallback`);
- human-readable explanation generated from fixed templates based on those evidence tokens.

The function may return at most 3 results.

### Explainability invariant
Text is generated from actual evidence, not free-form model output. A claim such as “Black Swan’ı sevdiğin için” is valid only when persisted onboarding/favorite/rating evidence satisfies the defined positive threshold.

### Persistence
Persist recommendation run + items/evidence server-side so:
- the exact result can be reopened by run ID;
- conversion to watchlist/watched can be attributed;
- algorithm versions can be compared later.

### Another recommendation
A skipped set is recorded as skipped exposure, not automatically a strong dislike. Next-set generation excludes immediate duplicate item IDs for that run/session where feasible.

---

## 12. Automatic shelves architecture

Two shelf kinds:

### Curated shelves
Examples: `Sinema Klasikleri`, `Kült Filmler`.
- Shared `shelves` record.
- Explicit `shelf_movies` membership by TMDB movie ID/order.
- Seeded/maintained by reviewed repository seed/content scripts or trusted admin path, never user client.

### Dynamic shelves
Examples: decade or genre.
- Shared `shelves` record contains a validated predefined rule identifier/config—not arbitrary executable SQL or arbitrary TMDB query from client.
- `shelf-feed` Edge Function maps known rule to safe TMDB/cache queries.
- User progress is computed by joining/merging owner watched state, not stored as global shelf mutation.

A film may appear in multiple shelves while retaining one canonical KARE movie cache record.

---

## 13. Data fetching and cache policy

### Remote retry
- Client Query retry is conservative; do not multiply retries with Edge Function retries.
- 4xx validation/auth errors are not blindly retried.
- transient network/5xx may receive bounded retry.
- TMDB 429 is respected with server backoff and user-friendly failure if exhausted.

### Staleness
- User mutation state: invalidate/reconcile immediately.
- Static movie metadata: cache for a materially longer interval than user state; exact TTL defined in implementation constants and covered by tests.
- Recommendation results: immutable by run ID after creation.

### Pagination
Poster grids paginate/infinite-load; never fetch full large catalogs into a single render.

### Images
Use explicit sizes suited to card/detail surfaces; do not request original-resolution poster for every grid item.

---

## 14. Error handling

### Typed error families
- `AuthError`
- `AuthorizationError`
- `OfflineError`
- `MovieProviderError`
- `ValidationError`
- `Conflict/MutationError`
- `UnexpectedError`

Boundary adapters convert Supabase/TMDB/raw network errors into safe app errors.

### User behavior
- Empty != error.
- Provider failure != no search result.
- One Discover section failure does not fail the whole screen.
- Forms preserve safe unsaved input on retry.
- Raw stack traces/provider bodies never render.

### Error boundaries
- root unexpected error boundary;
- route/feature recovery where Expo Router supports it;
- section-level Query error states for independent Discover modules.

---

## 15. Observability and analytics

### App logger
Create a small structured logger interface with levels and metadata allowlist.
- Development: console transport.
- Production: transport can be added at release gate without changing call sites.
- Never log auth tokens, passwords, full user notes or TMDB secret.

### Edge Function logs
Log:
- request correlation ID;
- function name;
- normalized error category;
- provider status/rate-limit signals;
- timing;
- user ID only when operationally necessary and consistent with privacy policy.

Do not log free-text personal reviews.

### Product measurement
Prefer canonical DB facts for the primary metric:
`recommendation item → selected/watchlisted source → watched transition`.

Client analytics can supplement funnel diagnostics but must not be the sole source of truth for WSMD.

MVP can store small typed product events in Supabase rather than adding a third-party analytics vendor during foundation. Event taxonomy is versioned and constrained; arbitrary free text is prohibited.

---

## 16. Environment and secrets

### Committed `.env.example`
Only names/placeholders:
- `EXPO_PUBLIC_SUPABASE_URL=`
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=`

### Never committed / never shipped in client
- `TMDB_READ_ACCESS_TOKEN`
- `SUPABASE_SERVICE_ROLE_KEY`
- DB password/connection strings
- EAS/store credentials
- signing keys

### Server secrets
Use Supabase Edge Function secret management for TMDB and any privileged server secret.

### Configuration validation
Client validates required public variables during bootstrap and shows a deterministic development/config error rather than later null crashes.

---

## 17. Testing strategy

### Unit tests
- recommendation scoring/evidence/explanation pure functions;
- runtime/mood/challenge mapping;
- validators and normalization;
- query key/state helpers;
- derived profile stats.

### Component tests
With Jest + `jest-expo` + React Native Testing Library:
- auth form states;
- poster selection onboarding;
- watched/watchlist/favorite rollback behavior;
- rating validation;
- empty/error/retry states;
- recommendation result explanation rendering.

### Supabase database tests
For every client-exposed table:
- anon deny where intended;
- owner allow select/insert/update/delete as intended;
- other-user deny for every operation;
- shared content read / client-write deny;
- constraints (unique/check/FK/cascade).

Use `supabase test db` per current Supabase RLS guidance.

### Edge Function tests
- input validation;
- unauthenticated rejection for protected functions;
- TMDB normalization using recorded/synthetic fixtures, not live provider dependency in every CI run;
- 429/5xx handling;
- recommendation limits/exclusion/evidence truthfulness.

### Vertical slice verification
First real slice should prove:
`sign up/sign in → search movie through real Edge Function/TMDB → mark watchlist/watched through real Supabase RLS → reload → state persists`.

If external TMDB/Supabase credentials are not available in a local/CI environment, this gate is PARTIAL until user-owned credentials/project exist; no mock may be represented as the final real slice.

---

## 18. CI/CD

### GitHub Actions baseline
On pull request / main push:
1. `npm ci`
2. formatting/lint check
3. TypeScript check
4. Jest unit/component tests
5. Expo bundle/export smoke check appropriate to current SDK
6. when Supabase schema exists and CI environment supports Docker: local DB/RLS test job
7. Edge Function lint/test job

Secrets are GitHub/Supabase environment secrets, never repository files.

### EAS profiles
Later `eas.json` profiles:
- `development` — development client/internal;
- `preview` — internal beta;
- `production` — store candidate.

EAS build account/project setup and store signing/submission are external owner assets/actions and become explicit blockers only when a lifecycle gate actually requires them.

No automatic production/store submission from main during MVP development.

---

## 19. Security and privacy baseline

- OWASP MASVS categories are the mobile security baseline per repository contract.
- No privileged secret in mobile bundle.
- Auth session encrypted at rest using documented mobile adapter pattern.
- Owner-private tables use RLS + explicit grants.
- Public/shared content client writes denied.
- External input validated at both UI and server trust boundaries.
- Free-text review is private in MVP and excluded from analytics/log/cache persistence.
- No contacts, camera, location, microphone or notification permissions are requested in MVP.
- No public UGC means block/report moderation flows are N/A until social visibility is introduced.
- Account deletion is server-side and must be implemented/tested before store readiness when current policy requires it.
- Sign out clears owner-private persisted cache.

---

## 20. Localization

- Turkish is launch language.
- All app-owned UI strings go through a small localization abstraction from the beginning; do not hard-code Turkish throughout route components.
- Initial implementation can ship only `tr` resources.
- TMDB requests use explicit language/region defaults (planned `tr-TR` / `TR`) while stable TMDB IDs remain language-independent.
- Missing localized title/overview falls back to provider-supported original/default fields without creating a second movie identity.

No full i18n package is required until implementation evaluates whether Expo/Intl + a small typed dictionary is sufficient; avoid a dependency solely for one launch language.

---

## 21. Performance assumptions

- Poster grids use virtualized lists.
- Use thumbnail-sized TMDB image variants in grids and larger variants only on detail.
- Query responses are paginated/bounded.
- Movie cache prevents avoidable repeated metadata calls.
- Discover sections load independently/lazily below the fold.
- Recommendation endpoint bounds candidate counts and external requests.
- No background bulk movie sync on the phone.

Targets for beta instrumentation:
- cold app startup to usable shell should be measured, not guessed;
- search first result latency and recommendation latency logged by category;
- no fixed SLA is promised because TMDB currently documents no SLA.

---

## 22. Deployment topology

### Development
- Expo development build / simulator/device.
- Local Supabase CLI where feasible for migrations/tests.
- Optional dedicated development Supabase cloud project when real device integration is needed.

### Preview beta
- EAS preview build.
- Non-production Supabase environment with realistic RLS/data.
- TMDB credential configured as server secret.

### Production
- EAS production build.
- Production Supabase project/environment and reviewed migrations.
- TMDB attribution and appropriate commercial/developer rights confirmed.
- Store credentials/signing owned by user/org.

Environment isolation must prevent preview builds from silently writing production data.

---

## 23. Major decisions and reversibility

| Decision | Choice | Why | Reversibility |
|---|---|---|---|
| Mobile framework | Expo SDK 57 / RN 0.86 | current official stack, mobile-first | Medium |
| Navigation | Expo Router | current Expo recommendation, typed/file routes | Medium |
| Backend | Supabase | auth + Postgres + RLS + Edge Functions | Medium |
| TMDB access | Edge Function proxy | protects token, centralizes normalization/rate behavior | High |
| User CRUD | direct Data API under RLS | removes unnecessary API boilerplate | High |
| Recommendation | deterministic Edge Function | explainable/testable/no LLM cost | High |
| Client server state | TanStack Query | real cache/retry/offline need | High |
| General global state | none initially | avoid unnecessary abstraction | High |
| Offline writes | no queue in MVP | avoids conflict/sync complexity | High |
| Public reviews/social | disabled | avoids premature moderation/social scope | High |
| Storage bucket | none | no MVP upload requirement | High |
| Analytics vendor | none initially | use canonical DB facts; avoid extra vendor | High |

---

## 24. Architecture gate checklist

- [x] Every MVP flow has a client/backend/data boundary.
- [x] TMDB privileged credential is server-side only.
- [x] Auth/session lifecycle is explicit.
- [x] User authorization is database-enforced.
- [x] Recommendation algorithm is explainable and testable without LLM dependency.
- [x] Offline behavior is deliberately read-only rather than an implicit sync queue.
- [x] Logging/analytics exclude free-text notes and secrets.
- [x] Testing and CI boundaries are defined.
- [x] Store/deployment external actions are deferred to their lifecycle gates.
- [x] Current official sources were consulted for version-sensitive choices.

A focused architecture review is required before Stage 06. Per `docs/MODEL_ROUTING.md`, preferred reviewer is `gpt-6-astra`; if unavailable, record a GPT-5.6 Sol high-reasoning review as `FALLBACK` and proceed only with no unresolved P0/P1 findings.
