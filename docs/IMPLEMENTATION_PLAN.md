# KARE — Implementation Plan

**Plan date:** 2026-09-07  
**Planning gate:** Stage 07  
**Source of truth:** `README.md` → `docs/PRODUCT_SPEC.md` → `docs/USER_FLOWS.md` → `docs/ARCHITECTURE.md` → `docs/DATABASE.md` → `docs/UI_UX.md`.

## Planning rules

- Dependency order is mandatory.
- Tasks should be small enough for one focused implementation/review run where practical.
- No feature enters the plan unless it maps to approved MVP behavior.
- Security/testing/error states are delivered with features, not postponed to the end.
- A task is complete only after its stated verification passes.
- Do not claim a real integration/vertical slice when required external credentials are missing.
- Social/community, payments, public UGC, LLM curator, advanced streaming and awards ingest are post-MVP and remain out of this beta plan.

## First vertical slice

**VS-1:**

`sign up/sign in → search a real TMDB movie through a real server boundary → open Movie Detail → mark Watchlist → mark Watched → reload app/data → observe persisted owner state under real Supabase RLS`

This is implemented in **Phase 3** after repository foundation, app shell, database/auth and TMDB boundaries exist. It must not use hidden production-critical mocks.

---

# Phase 0 — Repository / tooling foundation

## TASK-000 — Scaffold current Expo TypeScript application
- **Purpose:** Create the minimal runnable mobile foundation using the architecture-approved current Expo stack.
- **Work:**
  - Scaffold with the current official `create-expo-app` flow rather than hand-picking package versions from memory.
  - Verify generated Expo SDK / React Native / React versions against `docs/ARCHITECTURE.md` and current official Expo docs.
  - Use `src/app` routing layout.
  - Remove demo/template screens/assets not required by KARE.
  - Keep project identifier/display name `KARE`; do not configure store signing/submission.
  - Commit `package-lock.json`.
- **Likely affected files/modules:** `package.json`, `package-lock.json`, `app.json|app.config.ts`, `tsconfig.json`, `src/app/*`, `.gitignore`.
- **Dependencies:** Stage 07 plan gate only.
- **Acceptance criteria:**
  - [ ] Repository contains a minimal Expo app using the current architecture-approved SDK family.
  - [ ] No template/demo product behavior remains in main navigation.
  - [ ] TypeScript is enabled and strict mode is on or explicitly extended from an Expo strict baseline.
  - [ ] No secret or real credential is committed.
  - [ ] Generated dependency versions are recorded by lockfile.
- **Verification:** `node --version`; `npm ci`; `npx expo config --type public`; TypeScript smoke check; start/export command available.
- **Complexity:** Medium
- **Risk notes:** SDK 57 is newly current; generated template is the authority for compatible package matrix. If local package network access is unavailable, mark verification PARTIAL and continue only with repository-safe independent work.

## TASK-001 — Establish lint, formatting, typecheck and test baseline
- **Purpose:** Make every later task mechanically verifiable.
- **Work:**
  - Keep/configure current Expo ESLint baseline.
  - Add formatting rules only if needed; avoid overlapping style tools.
  - Add explicit scripts: `lint`, `typecheck`, `test`, `test:ci`, and a non-signing build/export smoke script.
  - Add Jest + `jest-expo` + React Native Testing Library baseline.
  - Add one meaningful smoke test for the root shell/config rather than a placeholder assertion.
- **Likely affected files/modules:** `package.json`, ESLint config, Jest config/setup, `src/test/*`.
- **Dependencies:** TASK-000.
- **Acceptance criteria:**
  - [ ] `npm run lint` passes.
  - [ ] `npm run typecheck` passes.
  - [ ] `npm run test:ci` passes.
  - [ ] Build/export smoke command exits successfully in supported environment.
- **Verification:** run all scripts from clean install.
- **Complexity:** Small
- **Risk notes:** Use Expo-supported Jest package versions; do not force incompatible test packages.

## TASK-002 — Environment validation and secrets hygiene
- **Purpose:** Fail safely when public config is missing and guarantee server secrets never enter the app/repo.
- **Work:**
  - Add `.env.example` with only `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` placeholders.
  - Ensure `.env*` secret files are ignored while `.env.example` remains committed.
  - Create typed/Zod environment parser for public app config.
  - Add deterministic development/config-error behavior for missing/invalid public variables.
  - Add comments/docs naming server-only variables (`TMDB_READ_ACCESS_TOKEN`, `SUPABASE_SERVICE_ROLE_KEY`) without values.
- **Likely affected files/modules:** `.env.example`, `.gitignore`, `src/lib/env/*`, tests.
- **Dependencies:** TASK-000, TASK-001.
- **Acceptance criteria:**
  - [ ] No server secret name is prefixed `EXPO_PUBLIC_`.
  - [ ] Missing required public config produces an intentional typed error, not a later null crash.
  - [ ] No real key/token appears in git.
  - [ ] Environment parser has success/failure tests.
- **Verification:** lint/typecheck/tests; repository secret-string scan for known prefixes/patterns where practical.
- **Complexity:** Small
- **Risk notes:** Current repository is public.

## TASK-003 — Add design tokens and core primitives
- **Purpose:** Make the approved KARE visual system reusable before screens proliferate.
- **Work:**
  - Add semantic color, spacing, radius and typography tokens from `docs/UI_UX.md`.
  - Add core primitives for screen container, text, button, loading skeleton/state, error/empty state and poster surface.
  - Use platform/system font fallback initially if bundled editorial fonts are not yet available.
  - Add accessibility labels/roles and selected-state semantics to primitives.
- **Likely affected files/modules:** `src/design/*`, `src/components/ui/*`, component tests.
- **Dependencies:** TASK-001.
- **Acceptance criteria:**
  - [ ] Screens can consume semantic tokens without repeating raw palette literals.
  - [ ] Primary/secondary/ghost button variants exist with loading/disabled states.
  - [ ] Selection/success states are not color-only.
  - [ ] Core primitive tests pass.
- **Verification:** lint/typecheck/component tests.
- **Complexity:** Medium
- **Risk notes:** Do not spend Phase 0 on visual polish or font procurement.

## TASK-004 — Add structured logging and safe error model
- **Purpose:** Make failures observable without leaking private content/secrets.
- **Work:**
  - Define typed app error categories from architecture.
  - Add logger interface with allowlisted metadata.
  - Development console transport only initially.
  - Add helpers that normalize Supabase/network/provider errors later.
  - Explicitly prohibit token/password/private-review logging in API.
- **Likely affected files/modules:** `src/lib/errors/*`, `src/lib/logger/*`, tests.
- **Dependencies:** TASK-001.
- **Acceptance criteria:**
  - [ ] Known error categories are typed.
  - [ ] Logger can be replaced by a future production transport without changing call sites.
  - [ ] Tests prove sensitive metadata keys are dropped/rejected where implemented.
- **Verification:** unit tests, lint/typecheck.
- **Complexity:** Small
- **Risk notes:** Avoid adding a third-party crash vendor before release gate.

## TASK-005 — Configure Query client and selective persistence boundary
- **Purpose:** Establish server-state lifecycle and future offline-read behavior without persisting sensitive text/session data.
- **Work:**
  - Configure TanStack Query provider/default retry policy.
  - Add query-key conventions.
  - Add persisted-cache adapter with an explicit allowlist interface.
  - Initial allowlist can remain empty until feature queries exist; architecture must make blanket persistence impossible by default.
  - Add utility to clear owner-private persisted queries on sign-out.
- **Likely affected files/modules:** `src/lib/query/*`, root providers, tests.
- **Dependencies:** TASK-001, TASK-004.
- **Acceptance criteria:**
  - [ ] Query provider wraps app shell.
  - [ ] 4xx/auth errors are not blindly retried by default.
  - [ ] Persistence requires explicit query-family opt-in.
  - [ ] Cache-clearing utility can target owner-private persisted data.
- **Verification:** unit/component tests; lint/typecheck.
- **Complexity:** Medium
- **Risk notes:** Private review text and auth session are never placed in generic persisted Query cache.

## TASK-006 — GitHub CI baseline
- **Purpose:** Make main/PR quality gates reproducible.
- **Work:**
  - Add GitHub Actions workflow for `npm ci`, lint, typecheck, tests and Expo export/config smoke.
  - No production deployment/store submission job.
  - Add dependency/cache strategy only if it remains simple and deterministic.
- **Likely affected files/modules:** `.github/workflows/ci.yml`.
- **Dependencies:** TASK-001, TASK-002.
- **Acceptance criteria:**
  - [ ] CI uses lockfile install.
  - [ ] CI runs all repository-local baseline checks.
  - [ ] CI contains no embedded secret values.
  - [ ] CI does not publish or deploy.
- **Verification:** workflow syntax review and first GitHub run when pushed.
- **Complexity:** Small
- **Risk notes:** Supabase/Docker jobs are added after schema exists.

### Phase 0 gate
- `npm ci`, lint, typecheck, tests and Expo smoke/export pass, or gate is explicitly `PARTIAL` only for an external/runtime blocker.
- No known secret exposure.
- `docs/PROJECT_STATUS.md` updated before Phase 1.

---

# Phase 1 — App shell / navigation

## TASK-100 — Build auth/bootstrap route guard
- **Purpose:** Prevent authenticated/unauthenticated route flicker and centralize bootstrap state.
- **Work:**
  - Root layout/provider composition.
  - Temporary typed auth-bootstrap interface that can be wired to real Supabase in Phase 2.
  - Splash/loading/config-error/unexpected-error states.
  - Route groups for `(auth)`, onboarding and `(tabs)`.
- **Likely affected files/modules:** `src/app/_layout.tsx`, route groups, `src/features/auth/bootstrap/*`.
- **Dependencies:** Phase 0.
- **Acceptance criteria:**
  - [ ] Root never renders both auth and tab trees simultaneously.
  - [ ] Loading/error states are deliberate.
  - [ ] No screen pretends the user is authenticated without real session wiring in Phase 2; temporary adapter is visibly development-only and has a removal task.
- **Verification:** component/navigation tests; lint/typecheck.
- **Complexity:** Medium
- **Risk notes:** Development adapter must not survive first vertical slice.

## TASK-101 — Implement bottom tab shell and global quick-add action
- **Purpose:** Match approved navigation model.
- **Work:**
  - Tabs: Discover, Library, Lists, Profile.
  - Central `＋` opens a quick-add/search modal/sheet rather than becoming a fake content tab.
  - Add empty but truthful feature-state screens; no social/paywall placeholders.
- **Likely affected files/modules:** `src/app/(tabs)/*`, `src/components/navigation/*`.
- **Dependencies:** TASK-100, TASK-003.
- **Acceptance criteria:**
  - [ ] All four persistent tabs navigate correctly.
  - [ ] `＋` opens/closes an accessible overlay/action.
  - [ ] Navigation labels are visible/accessible.
  - [ ] No out-of-MVP route appears in tab navigation.
- **Verification:** navigation/component tests and Expo startup smoke.
- **Complexity:** Medium
- **Risk notes:** Keep routes shallow; feature detail routes stay outside tab files.

## TASK-102 — Implement shared poster grid/list states
- **Purpose:** Create the reusable visual/data states used by Discover, Library, Lists and shelves.
- **Work:**
  - Poster card variants.
  - Virtualized poster grid wrapper.
  - Loading skeleton, empty, provider-error, retry and offline banner components.
  - Missing-poster fallback.
- **Likely affected files/modules:** `src/components/movie/*`, shared state components.
- **Dependencies:** TASK-003, TASK-101.
- **Acceptance criteria:**
  - [ ] Poster ratio/layout matches UI spec.
  - [ ] Missing poster/title metadata fails gracefully.
  - [ ] Empty and error states are visually/semantically distinct.
  - [ ] Grid supports realistic item counts without mapping all items into a plain ScrollView.
- **Verification:** component tests, accessibility queries, lint/typecheck.
- **Complexity:** Medium
- **Risk notes:** Do not load real TMDB data yet.

### Phase 1 gate
- App starts.
- Shell navigation works.
- Startup/loading/error states do not crash.
- No unfinished feature is falsely represented as working.

---

# Phase 2 — Authentication / database foundation

## TASK-200 — Initialize Supabase repository configuration
- **Purpose:** Prepare repeatable local DB/function development before touching cloud production.
- **Work:**
  - Initialize `supabase/config.toml` and expected directories.
  - Add local-development docs/scripts.
  - Add generated-type command but do not commit credentials.
  - Add CI-ready DB test command that can run once migrations exist.
- **Likely affected files/modules:** `supabase/*`, `package.json`, docs.
- **Dependencies:** Phase 0.
- **Acceptance criteria:**
  - [ ] Local schema can be rebuilt by documented Supabase CLI commands in a compatible environment.
  - [ ] No cloud project ref/service key is committed as a secret.
  - [ ] Migration/test folders are ready.
- **Verification:** `supabase --version`; local init/config validation where CLI/Docker available.
- **Complexity:** Small
- **Risk notes:** If local Docker/Supabase CLI is unavailable, repository setup can proceed but DB runtime gate is PARTIAL.

## TASK-201 — Migration 001: profile, movie cache and shared helpers
- **Purpose:** Establish identity/product-content primitives with RLS from the start.
- **Work:**
  - `set_updated_at` helper.
  - `profiles` + secure auth-user trigger.
  - `movies` table/indexes/grants/RLS.
  - Seed a very small development-only movie set only when needed for DB tests; never label it production metadata.
- **Likely affected files/modules:** `supabase/migrations/*`, `supabase/tests/*`.
- **Dependencies:** TASK-200; approved DATABASE gate.
- **Acceptance criteria:**
  - [ ] Profile ownership and movie read/server-write policy match `DATABASE.md`.
  - [ ] Trigger uses fixed/qualified search path and minimal privilege.
  - [ ] anon/product-table deny and owner/shared allow/deny tests exist.
  - [ ] Local reset deterministically recreates schema.
- **Verification:** `supabase db reset`; `supabase test db`; migration lint if available.
- **Complexity:** Medium
- **Risk notes:** Never add `service_role` to client/test fixtures beyond trusted DB test setup.

## TASK-202 — Migration 002: user movie state, taste and private review invariants
- **Purpose:** Build the core owner-private library data model securely.
- **Work:**
  - `user_movie_state`, `taste_selections`, `personal_reviews`.
  - Checks for watched/watchlist exclusion, rating range/step, rating requires watched.
  - Concrete review-watched enforcement trigger/function required by DB gate review.
  - Grants/RLS + indexes.
- **Likely affected files/modules:** migrations, DB tests, generated types.
- **Dependencies:** TASK-201.
- **Acceptance criteria:**
  - [ ] User A owner CRUD works where intended.
  - [ ] User B/anon cannot read/write A data.
  - [ ] Rating without watched is rejected server-side.
  - [ ] Watched+watchlisted state is rejected.
  - [ ] Invalid rating increments are rejected.
  - [ ] Review insert/update without watched state is rejected by DB/trusted boundary.
- **Verification:** `supabase db reset`; all allow/deny DB tests.
- **Complexity:** Medium
- **Risk notes:** This is core security/data correctness; do not weaken checks to make UI easier.

## TASK-203 — Migration 003: lists and list membership ownership
- **Purpose:** Add private user collections with parent-derived RLS.
- **Work:** `lists`, `list_movies`, case/trim name uniqueness, membership uniqueness, grants/RLS and DB tests.
- **Likely affected files/modules:** migrations/tests/generated types.
- **Dependencies:** TASK-201.
- **Acceptance criteria:**
  - [ ] Owner can CRUD own list/membership.
  - [ ] Knowing another list UUID provides no access.
  - [ ] Duplicate movie membership is rejected/idempotent.
  - [ ] List deletion cascades memberships but not user movie state/movie cache.
- **Verification:** DB tests and reset.
- **Complexity:** Small
- **Risk notes:** Parent `EXISTS` policy must be query-plan reviewed after realistic data exists.

## TASK-204 — Migration 004: shelves and curated content model
- **Purpose:** Support deterministic automatic/curated shelves without user-side filing.
- **Work:** `shelves`, `shelf_movies`, rule-key checks, active read-only RLS, curated seed mechanism.
- **Likely affected files/modules:** migrations/seed/tests.
- **Dependencies:** TASK-201.
- **Acceptance criteria:**
  - [ ] Authenticated client can read active shelves/memberships.
  - [ ] Client cannot mutate shelf/shared content.
  - [ ] Subjective curated shelves use explicit movie membership.
- **Verification:** DB tests/reset.
- **Complexity:** Small
- **Risk notes:** Do not populate a huge catalog during migration.

## TASK-205 — Migration 005: recommendations, acceptance transaction and telemetry
- **Purpose:** Add immutable recommendation facts and secure WSMD attribution.
- **Work:**
  - `recommendation_runs`, `recommendation_items`, `recommendation_acceptances`, `product_events`.
  - RLS/grants per DB spec.
  - Implement narrow atomic recommendation-acceptance DB function from DB gate review with fixed `search_path`, `auth.uid()` ownership validation and minimum execute grant.
  - Add JSON bounds/checks practical in Postgres.
  - Add event-table self-insert/no-read policy.
- **Likely affected files/modules:** migrations/DB tests/generated types.
- **Dependencies:** TASK-202.
- **Acceptance criteria:**
  - [ ] Users can read only own recommendation runs/items.
  - [ ] Direct client writes to server-generated recommendation facts are denied.
  - [ ] Acceptance of another user’s item fails.
  - [ ] Acceptance is atomic/idempotent and cannot create watched+watchlist invalid state.
  - [ ] Product-event client select/update/delete is denied.
- **Verification:** DB allow/deny/transaction tests.
- **Complexity:** Large
- **Risk notes:** High-consequence authorization task; later security review must revisit it.

## TASK-206 — Create Supabase client with encrypted React Native session storage
- **Purpose:** Wire real auth/session storage without plaintext generic persistence.
- **Work:**
  - Supabase client using public URL/publishable key.
  - Implement current documented encrypted AsyncStorage + SecureStore-key adapter.
  - Configure session persistence/refresh for native lifecycle.
  - App-state foreground/background refresh handling.
  - Clear secure session/private query cache on sign-out.
- **Likely affected files/modules:** `src/lib/supabase/*`, `src/features/auth/*`, tests.
- **Dependencies:** TASK-002, TASK-005, TASK-200.
- **Acceptance criteria:**
  - [ ] Session is not persisted inside generic Query cache/global state.
  - [ ] Sign-out clears protected local auth material + owner cache.
  - [ ] Storage/native failure returns a typed recoverable/fatal error path.
  - [ ] No service role/TMDB token exists in client config.
- **Verification:** unit/component tests; real auth integration once local/cloud Supabase is available.
- **Complexity:** Medium
- **Risk notes:** Follow current Supabase RN guidance; do not simplify to unencrypted AsyncStorage session storage without an approved architecture change.

## TASK-207 — Implement sign-up/sign-in/session restore/sign-out UI
- **Purpose:** Complete F-001 and replace Phase 1 bootstrap adapter with real Supabase Auth.
- **Work:** Auth forms, validation, pending/error states, session gate, profile bootstrap and sign-out.
- **Likely affected files/modules:** `(auth)` routes, auth feature modules, settings.
- **Dependencies:** TASK-201, TASK-206, TASK-100.
- **Acceptance criteria:**
  - [ ] New user reaches onboarding after successful signup.
  - [ ] Returning user session restores after app restart.
  - [ ] Invalid/expired session recovers or returns to sign-in safely.
  - [ ] Phase 1 fake/bootstrap auth adapter is removed.
- **Verification:** component tests + local/cloud integration test.
- **Complexity:** Medium
- **Risk notes:** Email confirmation behavior depends on Supabase project config; UX must represent actual configured behavior.

## TASK-208 — Implement taste onboarding persistence
- **Purpose:** Complete F-002 with real owner-private signals.
- **Work:** poster-selection UI, seed-movie source, minimum 5/skip path, persist `taste_selections`, profile completion/skip timestamp, failure retry.
- **Likely affected files/modules:** onboarding route/features/queries.
- **Dependencies:** TASK-202, TASK-207, TASK-102.
- **Acceptance criteria:**
  - [ ] Selection/deselection is duplicate-safe.
  - [ ] Complete/skip state persists across restart.
  - [ ] Seed-load failure offers retry + defer.
  - [ ] Another user cannot see selections.
- **Verification:** component + DB integration tests.
- **Complexity:** Medium
- **Risk notes:** Taste selection must not silently create watched history.

### Phase 2 gate
- Real auth/session path works against a real local or cloud Supabase environment.
- DB migrations rebuild cleanly.
- RLS allow/deny tests pass.
- No service credential is in client/repo.

---

# Phase 3 — First real vertical slice

## TASK-300 — Implement TMDB movie-search Edge Function
- **Purpose:** Establish the real provider/server boundary for the first core user action.
- **Work:**
  - Protected `movie-search` function.
  - Validate non-empty bounded query/page/language/region.
  - Use server-only `TMDB_READ_ACCESS_TOKEN`.
  - Call TMDB, normalize response, handle 429/transient 5xx with bounded behavior.
  - Upsert minimal movie cache with trusted server access.
  - Safe error mapping/logging.
- **Likely affected files/modules:** `supabase/functions/movie-search/*`, shared Edge helpers/tests.
- **Dependencies:** TASK-201, real TMDB server credential for live verification.
- **Acceptance criteria:**
  - [ ] Unauthenticated protected request is rejected where intended.
  - [ ] Empty/invalid input never reaches TMDB.
  - [ ] TMDB token is server secret only.
  - [ ] Returned objects use stable TMDB/internal movie identity and normalized fields.
  - [ ] 429/provider failure returns typed safe error.
- **Verification:** unit tests with fixtures + one live authorized smoke request when credential exists.
- **Complexity:** Medium
- **Risk notes:** External credential is a genuine blocker only for live verification, not for fixture/unit implementation.

## TASK-301 — Implement TMDB movie-detail Edge Function
- **Purpose:** Resolve search result to complete KARE MVP movie detail and refresh cache.
- **Work:** validate movie ID, serve suitable cache/refetch, normalize approved metadata only, upsert cache, map failures.
- **Likely affected files/modules:** `supabase/functions/movie-detail/*`, movie Edge shared helpers/tests.
- **Dependencies:** TASK-300.
- **Acceptance criteria:**
  - [ ] Invalid ID is rejected before provider call.
  - [ ] Missing optional metadata does not produce fabricated values.
  - [ ] Cache timestamp reflects KARE refresh.
  - [ ] Live/fixture tests cover success + provider failure.
- **Verification:** Edge tests + live smoke with credential.
- **Complexity:** Medium
- **Risk notes:** Do not fetch cast/trailers/streaming data outside MVP.

## TASK-302 — Build real Search → Movie Detail UI/data path
- **Purpose:** Connect mobile UI to real Edge Functions and normalized movie cache.
- **Work:** debounced/bounded search, result states, movie detail route/query, source attribution, poster/image sizing.
- **Likely affected files/modules:** search route, movie feature/query/schema, detail route.
- **Dependencies:** TASK-300, TASK-301, TASK-102, TASK-207.
- **Acceptance criteria:**
  - [ ] Empty query makes no provider request.
  - [ ] no-result vs provider-error are distinct.
  - [ ] Same-name movies can be disambiguated with year/poster where available.
  - [ ] Detail route uses stable ID.
- **Verification:** component/integration tests + live device/simulator smoke.
- **Complexity:** Medium
- **Risk notes:** Keep provider response validation at trust boundary.

## TASK-303 — Implement watched/watchlist/favorite repository + mutations
- **Purpose:** Complete the persistence half of the first vertical slice under real RLS.
- **Work:** typed queries/mutations for `user_movie_state`, idempotent upsert/delete behavior, optimistic rollback, mark-watched removes active watchlist, detail-state rendering.
- **Likely affected files/modules:** `src/features/library/*`, Movie Detail, tests.
- **Dependencies:** TASK-202, TASK-302.
- **Acceptance criteria:**
  - [ ] Watchlist persists after reload.
  - [ ] Mark watched removes watchlist in one coherent mutation path.
  - [ ] Favorite can coexist independently.
  - [ ] Failed mutation rolls back false optimistic UI.
  - [ ] Cross-user access remains blocked by DB tests.
- **Verification:** unit/component + live/local integration against RLS.
- **Complexity:** Medium
- **Risk notes:** Prefer one server-safe state mutation shape rather than client race-prone sequential updates.

## TASK-304 — Verify VS-1 end to end and record evidence
- **Purpose:** Prove the architecture before broad MVP implementation.
- **Work:** execute exact VS-1 on realistic target/environment; test success and failure/reload; document commands/environment/results.
- **Likely affected files/modules:** tests, `docs/reviews/VERTICAL_SLICE_GATE.md`, `docs/PROJECT_STATUS.md`.
- **Dependencies:** TASK-207, TASK-300, TASK-301, TASK-302, TASK-303.
- **Acceptance criteria:**
  - [ ] Real user authenticates.
  - [ ] Real TMDB search passes through server function.
  - [ ] Real RLS-protected state persists.
  - [ ] App reload shows canonical persisted state.
  - [ ] Provider/mutation failure has visible recovery.
  - [ ] No hidden production-critical mock participates.
- **Verification:** scripted/manual reproducible test + automated coverage around components/DB/Edge; architecture audit afterward.
- **Complexity:** Medium
- **Risk notes:** If cloud/user-owned credentials/project are not available, this task remains PARTIAL and Audit #1 cannot be truthfully passed as a real vertical-slice audit.

### Phase 3 / Stage 10 gate
- VS-1 completes end to end with real auth/provider/data/RLS.
- Then run independent Audit #1 per model routing; fix P0/P1 automatically.

---

# Phase 4 — Core MVP product features

## TASK-400 — Rating and private review/note
- **Purpose:** Complete F-006 without making public UGC.
- **Work:** 0.5-step rating UI, private note/spoiler sheet, DB-safe review write path, edit/delete, unsaved retry preservation.
- **Likely affected files/modules:** rating/review features, detail sheet, tests.
- **Dependencies:** TASK-202, TASK-303, Audit #1 pass.
- **Acceptance criteria:** Product Spec F-006 criteria all pass; private note never enters generic analytics/persisted query cache.
- **Verification:** component + DB integration tests; lint/typecheck.
- **Complexity:** Medium
- **Risk notes:** Review text remains private; no public review UI.

## TASK-401 — Personal library tabs, filters and sorting
- **Purpose:** Complete F-009.
- **Work:** watched/watchlist/favorite queries, virtualized grids, approved filters/sorts, specific empty/filter-empty/error/offline states, selective cache persistence.
- **Likely affected files/modules:** Library route/features/query persistence allowlist.
- **Dependencies:** TASK-303, TASK-102.
- **Acceptance criteria:** Product Spec F-009 criteria; cached read-only library works offline without false writes.
- **Verification:** component/query tests + offline simulation.
- **Complexity:** Medium
- **Risk notes:** Avoid N+1 remote movie-detail requests; use normalized cache/joined query data.

## TASK-402 — Personal lists
- **Purpose:** Complete F-007.
- **Work:** list create/edit/delete, detail grid, add/remove movie sheet, duplicate-safe mutations, private empty/error states.
- **Likely affected files/modules:** Lists routes/features.
- **Dependencies:** TASK-203, TASK-302.
- **Acceptance criteria:** Product Spec F-007 + DB ownership tests pass.
- **Verification:** component + integration tests.
- **Complexity:** Medium
- **Risk notes:** Deleting list never removes library state.

## TASK-403 — Automatic/curated shelves
- **Purpose:** Complete F-008.
- **Work:** curated shelf seed content, dynamic safe rule mapping where needed, `shelf-feed` function only if remote generation is needed, progress overlay from watched state, shelf detail grid/filter.
- **Likely affected files/modules:** shelf features/function/seed/routes.
- **Dependencies:** TASK-204, TASK-301, TASK-401.
- **Acceptance criteria:** Product Spec F-008; client cannot write shelf definition/membership; subjective shelves use explicit curated IDs.
- **Verification:** DB/Edge/component tests.
- **Complexity:** Medium
- **Risk notes:** Start with a small, defensible curated set; content quality is operational work, not bulk scraping.

## TASK-404 — Discover home modules
- **Purpose:** Complete F-010 and make core decision CTA dominant.
- **Work:** `Ne İzlesem?` hero, cold-start curated section, evidence-backed personalized sections when data exists, independent module loading/error states, source attribution.
- **Likely affected files/modules:** Discover route/features.
- **Dependencies:** TASK-401, TASK-403; basic recommendation capability may initially be absent but CTA routes to TASK-405 flow once delivered.
- **Acceptance criteria:** Product Spec F-010; no fake personalization; one module failure does not blank screen.
- **Verification:** component/integration tests.
- **Complexity:** Medium
- **Risk notes:** Do not create a Netflix-style endless home catalog.

## TASK-405 — Deterministic recommendation scoring module + Edge Function
- **Purpose:** Implement the product differentiator F-011 with truth-preserving explanations.
- **Work:**
  - Freeze mood/runtime/challenge enums.
  - Pure versioned scoring/candidate code.
  - Evidence tokens + fixed explanation renderer.
  - Candidate generation from cached/TMDB/curated sources within bounded calls.
  - Persist run/items.
  - Exclude watched by default.
  - no-candidate and next-set behavior.
- **Likely affected files/modules:** `supabase/functions/recommend/*`, shared recommendation module/tests, DB generated types.
- **Dependencies:** TASK-205, TASK-300/301, TASK-208, TASK-403.
- **Acceptance criteria:**
  - [ ] Returns 1–3 items only.
  - [ ] Watched exclusion works.
  - [ ] Runtime/filter tolerance is tested.
  - [ ] Every personal claim maps to persisted/request evidence.
  - [ ] Cold-start fallback never pretends to be personal.
  - [ ] Algorithm version is persisted.
- **Verification:** deterministic fixture/unit tests, DB integration tests, bounded live smoke.
- **Complexity:** Large
- **Risk notes:** Recommendation quality is product-critical; no LLM shortcut.

## TASK-406 — `Ne İzlesem?` wizard and recommendation result UI
- **Purpose:** Complete F-011/F-012 user-facing decision flow.
- **Work:** mood/time/challenge steps, exclude-watched toggle, loading/no-result/relax state, dominant top recommendation, evidence reason, accept/save/detail/another set.
- **Likely affected files/modules:** recommend routes/features/UI tests.
- **Dependencies:** TASK-405, TASK-205, TASK-003.
- **Acceptance criteria:** Product Spec F-011/F-012 all pass; selected filters survive retry/no-result relaxation.
- **Verification:** component + end-to-end integration tests.
- **Complexity:** Medium
- **Risk notes:** Do not add infinite swipe behavior.

## TASK-407 — Recommendation acceptance + WSMD attribution path
- **Purpose:** Make the primary product metric a trustworthy canonical fact.
- **Work:** invoke secure atomic acceptance transaction, retain recommendation source into detail/save flow, link later watched transition in query/report logic, idempotency.
- **Likely affected files/modules:** recommendation/lib/library integration, DB function tests.
- **Dependencies:** TASK-205, TASK-303, TASK-406.
- **Acceptance criteria:**
  - [ ] Accept/save creates valid watchlist state unless already watched.
  - [ ] Another user's item can never be accepted.
  - [ ] Later watched state can be joined to originating acceptance.
  - [ ] Repeat taps cannot duplicate acceptance.
- **Verification:** DB + integration test covering accept → watched → metric query.
- **Complexity:** Medium
- **Risk notes:** Metric must not depend solely on spoofable client analytics.

## TASK-408 — Profile and basic statistics
- **Purpose:** Complete F-013 with truthful derived values.
- **Work:** counts, current-year watched, average rating only from rated movies, favorite/recent posters, empty state/settings entry.
- **Likely affected files/modules:** Profile route/queries/stats helpers/tests.
- **Dependencies:** TASK-400, TASK-401.
- **Acceptance criteria:** Product Spec F-013; no fake taste percentages.
- **Verification:** unit tests for derived stats + component tests.
- **Complexity:** Small
- **Risk notes:** Keep profile private in MVP.

## TASK-409 — Taste-aware personalized Discover sections
- **Purpose:** Add `Senin İçin` / `Çünkü Bunları Sevdin` only when evidence is truthful.
- **Work:** reuse recommendation/scoring evidence for bounded home modules; explicit cold-start fallback; source attribution.
- **Likely affected files/modules:** Discover/recommendation modules.
- **Dependencies:** TASK-404, TASK-405.
- **Acceptance criteria:** Personalized section hides/falls back when evidence insufficient; personal claims are evidence-backed.
- **Verification:** deterministic tests for cold-start vs personalized rendering.
- **Complexity:** Medium
- **Risk notes:** Avoid duplicating scoring logic in the client.

### Phase 4 gate
- All beta MVP product acceptance criteria implemented.
- Run full repository verification.
- Proceed to Audit #2 only after no known P0/P1 in changed scope.

---

# Phase 5 — Social / community

**N/A for KARE MVP.**

Explicitly deferred:
- followers/activity feed;
- public reviews/lists;
- taste compatibility;
- `Birlikte İzle`;
- messaging.

No hidden placeholders/routes should ship in beta.

---

# Phase 6 — Notifications / localization

Notifications: **N/A for MVP**. Do not request notification permission.

## TASK-600 — Turkish string abstraction and locale-safe TMDB behavior
- **Purpose:** Prevent hard-coded route/component text from making later localization expensive while keeping launch scope Turkish-only.
- **Work:** small typed string dictionary/helper, `tr` resources, explicit TMDB `tr-TR`/region mapping and original-title fallback.
- **Likely affected files/modules:** `src/lib/i18n/*`, app strings, movie provider mapping.
- **Dependencies:** Phase 1; execute before broad Phase 4 string proliferation if not already integrated.
- **Acceptance criteria:**
  - [ ] App-owned visible text is routed through one translation abstraction in production screens.
  - [ ] Stable movie identity is independent of locale.
  - [ ] Missing Turkish provider field falls back without creating duplicate movie.
- **Verification:** unit tests + typecheck.
- **Complexity:** Small
- **Risk notes:** Do not add multi-language content or a heavy dependency without need.

---

# Phase 7 — Moderation / security / account lifecycle

Public UGC moderation: **N/A while reviews/lists remain private.**

## TASK-700 — Account deletion server flow
- **Purpose:** Provide real destructive account lifecycle before store readiness where current policies require it.
- **Work:** protected `delete-account` Edge Function, explicit confirmation/re-auth behavior, Auth Admin delete, cascade verification, local cache/session cleanup.
- **Likely affected files/modules:** settings UI, Edge Function, DB tests.
- **Dependencies:** TASK-207, completed cascade schema.
- **Acceptance criteria:**
  - [ ] Caller can delete only own account.
  - [ ] User-owned rows cascade; shared movies/shelves survive.
  - [ ] Session and owner-private local cache are cleared.
  - [ ] Failure never leaves UI falsely signed-out while account definitely remains without explanation/recovery.
- **Verification:** local/cloud test user deletion + DB cascade tests.
- **Complexity:** Medium
- **Risk notes:** Destructive flow; tests use disposable users only.

## TASK-701 — Focused mobile/security review and fixes
- **Purpose:** Audit OWASP-MASVS-relevant storage/auth/network/secrets/data boundaries before release readiness.
- **Work:** inspect session storage, RLS/grants, Edge Function auth, logs, persisted cache, input validation, dependency advisories, permissions, deep-link/auth recovery handling; fix P0/P1.
- **Likely affected files/modules:** cross-cutting.
- **Dependencies:** Core features complete.
- **Acceptance criteria:** no unresolved P0/P1; no privileged secret in client/repo; private note not exposed to analytics/public API.
- **Verification:** security checklist + tests + dependency audit + independent reviewer per model routing.
- **Complexity:** Medium
- **Risk notes:** Preferred critical reviewer is Astra; fallback must be labeled if unavailable.

---

# Phase 8 — Analytics / performance / reliability

## TASK-800 — Typed product telemetry API
- **Purpose:** Measure funnels without arbitrary private payloads.
- **Work:** typed named event API with per-event allowlisted context keys; insert-only `product_events`; no generic arbitrary-object export; no review/list text.
- **Likely affected files/modules:** `src/lib/analytics/*`, DB integration tests.
- **Dependencies:** TASK-205; instrument alongside features, finalize here.
- **Acceptance criteria:**
  - [ ] Compiler/types prevent unsupported keys in normal calls.
  - [ ] Auth/email/token/free text is not an event payload.
  - [ ] Failed telemetry does not block the core user action.
- **Verification:** unit/type tests + DB RLS tests.
- **Complexity:** Small
- **Risk notes:** Client telemetry is diagnostic, not security truth.

## TASK-801 — Primary metric query / beta dashboard artifact
- **Purpose:** Make WSMD measurable from canonical data.
- **Work:** reviewed SQL/view or trusted report query joining recommendation acceptance to later watched state; define measurement window and double-count behavior; document interpretation.
- **Likely affected files/modules:** migration/report SQL, `docs/METRICS.md`.
- **Dependencies:** TASK-407.
- **Acceptance criteria:**
  - [ ] Same acceptance/watch conversion is not double counted.
  - [ ] Query can segment time period without exposing user private content.
  - [ ] Synthetic fixture produces expected WSMD result.
- **Verification:** DB test fixtures/query test.
- **Complexity:** Small
- **Risk notes:** Do not infer “watched because of KARE” without an attributable accepted source.

## TASK-802 — Performance pass
- **Purpose:** Keep poster-heavy mobile surfaces responsive.
- **Work:** profile list virtualization, image size/cache behavior, Query N+1 checks, Discover lazy sections, recommendation/provider request bounds, startup/search/recommend timing logs.
- **Likely affected files/modules:** cross-cutting performance hot paths.
- **Dependencies:** Phase 4 complete.
- **Acceptance criteria:**
  - [ ] No full-catalog unbounded render/fetch.
  - [ ] Library avoids one remote detail request per poster when cached normalized data is available.
  - [ ] Grid/detail images use fit-for-surface sizes.
  - [ ] Measured regressions are documented/fixed before release candidate.
- **Verification:** profiler/device smoke + network/log inspection.
- **Complexity:** Medium
- **Risk notes:** Optimize measured paths only.

## TASK-803 — Telemetry retention cleanup
- **Purpose:** Enforce the approved maximum retention rather than documenting it only.
- **Work:** implement a reviewed scheduled/maintenance cleanup mechanism for `product_events` older than approved window (target ≤365 days, finalize during privacy review).
- **Likely affected files/modules:** migration/maintenance function/docs.
- **Dependencies:** TASK-800.
- **Acceptance criteria:** old test events are removable by trusted maintenance path; app client cannot invoke destructive global cleanup.
- **Verification:** DB test on disposable fixtures.
- **Complexity:** Small
- **Risk notes:** Use current Supabase-supported scheduling mechanism verified at implementation time.

---

# Phase 9 — Store / release readiness

## TASK-900 — Re-check current Apple/Google/TMDB policies and write release checklist
- **Purpose:** Avoid relying on stale policy memory at release time.
- **Work:** primary-source review for account deletion, privacy/data disclosures, UGC scope, permissions, TMDB attribution/licensing, target SDK/iOS requirements; write `docs/RELEASE_CHECKLIST.md` with dated sources.
- **Likely affected files/modules:** release docs, settings/about if policy requires changes.
- **Dependencies:** Audit #2 pass.
- **Acceptance criteria:** current policy facts are dated/sourced; concrete gaps become tasks, not assumptions.
- **Verification:** independent release/security review.
- **Complexity:** Medium
- **Risk notes:** Policy can change after this plan date.

## TASK-901 — TMDB attribution / credits surface
- **Purpose:** Satisfy provider attribution requirements before public use.
- **Work:** approved TMDB logo asset obtained from official source/license-safe integration, required notice, credits/about route, provider terms link where appropriate.
- **Likely affected files/modules:** Settings/About, assets, release docs.
- **Dependencies:** TASK-900.
- **Acceptance criteria:** attribution matches then-current TMDB requirements and is visible in release candidate.
- **Verification:** UI/release checklist review.
- **Complexity:** Small
- **Risk notes:** Do not invent or redraw required official brand asset when official asset is mandated.

## TASK-902 — EAS environments and reproducible preview/production build configuration
- **Purpose:** Produce signed-build configuration without performing an unauthorized store release.
- **Work:** `eas.json` development/preview/production profiles, environment separation, public config mapping, build docs; no secrets committed.
- **Likely affected files/modules:** `eas.json`, app config, docs.
- **Dependencies:** TASK-900; user/org EAS/store assets when actually building signed production artifact.
- **Acceptance criteria:** preview/prod configs cannot silently target wrong Supabase environment; build commands documented; repository checks pass.
- **Verification:** preview build when EAS credentials/project authorization exist; local Expo export regardless.
- **Complexity:** Medium
- **Risk notes:** EAS/store credentials/signing are user-owned external assets; do not create paid commitment without approval.

## TASK-903 — Release candidate smoke matrix
- **Purpose:** Verify realistic iOS/Android beta behavior.
- **Work:** test auth, onboarding, search/detail, library persistence, rating, lists, shelves, Ne İzlesem, offline/retry, account deletion and cold-start personalization on at least one realistic target per supported OS before store release.
- **Likely affected files/modules:** test docs/bug fixes.
- **Dependencies:** TASK-902 and release candidate build.
- **Acceptance criteria:** no release-blocking/P0/P1 issue; all core flows reproducible.
- **Verification:** documented device/simulator matrix + CI/build evidence.
- **Complexity:** Medium
- **Risk notes:** Real-device access may become an external blocker.

## TASK-904 — Beta readiness plan
- **Purpose:** Ensure beta measures product value rather than only technical stability.
- **Work:** define beta audience, onboarding expectations, WSMD success threshold, recommendation acceptance target, feedback/report channel, crash/error observation, rollback/hotfix path and seed/curation operations.
- **Likely affected files/modules:** `docs/BETA_PLAN.md`, `docs/PROJECT_STATUS.md`.
- **Dependencies:** Release candidate gate.
- **Acceptance criteria:** beta has measurable pass/fail criteria and an operational recovery path.
- **Verification:** Stage 15 review.
- **Complexity:** Small
- **Risk notes:** Public/store submission itself requires explicit external authorization.

---

# Deferred post-beta backlog — not eligible during MVP implementation

- Public social profiles/follow graph/activity feed.
- Public reviews/comments/moderation expansion.
- Taste compatibility and `Birlikte İzle`.
- Sinema Pasaportu/gamification.
- Director routes / cinema-history learning paths.
- Streaming-provider availability/filtering.
- Full awards ingest/archive.
- LLM conversational cinema curator.
- Premium/subscription/payments.

These require separate product approval and lifecycle reconciliation before implementation.

---

# Stage 07 gate evaluation

The plan is ready to pass when:
- every approved MVP feature maps to at least one task;
- tasks are dependency ordered;
- architecture/RLS decisions are not left for feature code to invent;
- VS-1 is explicit and uses real auth/provider/data paths;
- P2 requirements from Architecture/Database gate reviews are represented in acceptance criteria;
- social/payment/LLM scope remains excluded;
- the next task is executable without a new product decision.

**Current gate result:** `PASS`.

Next action per continuous-autonomy contract: begin Phase 0 / Stage 08 foundation at TASK-000 and continue until a genuine external blocker or later consequential release action is reached.
