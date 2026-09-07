# KARE — Product Specification

## 1. Product summary

KARE is a mobile-first personal cinema library and movie-decision product. It lets a user build a durable record of watched films, watchlist, favorites, ratings, notes and lists; discover cinema through automatic shelves; and answer the recurring question **“Bu gece ne izlemeliyim?”** with a small, explainable recommendation set.

The MVP is intentionally not a social network. Its proof of value is whether a user can discover a suitable movie, save it, watch it, record the result and receive better future suggestions.

## 2. Primary user

### Primary persona — regular cinema explorer
- Watches movies regularly but does not necessarily identify as a cinephile expert.
- Has watched-history and watchlist information spread across memory, streaming services or other apps.
- Frequently loses time deciding what to watch.
- Values taste, curation and personal history more than raw catalog size.
- Uses a phone as the main planning/discovery surface.

### Jobs to be done
1. “İzlediğim filmleri kaybetmeden tek yerde tutmak istiyorum.”
2. “İzlemek istediğim filmleri düzenlemek istiyorum.”
3. “Bu akşamki ruh halime ve zamanıma uygun birkaç iyi seçenek istiyorum.”
4. “Sinema tarihinde hangi alanları keşfettiğimi ve neleri kaçırdığımı görmek istiyorum.”

## 3. Product principles

1. **Decision quality over catalog volume.** Recommendation surfaces should reduce choice, not create another infinite catalog.
2. **Poster-first navigation.** Posters are primary discovery/navigation objects; metadata supports rather than dominates them.
3. **Personal context first.** Film pages prioritize “sen bu filmle ne yaptın?” alongside general metadata.
4. **Explain recommendations.** KARE must provide a concise reason for a recommendation when it uses user/history/request signals.
5. **Fast logging.** Marking watched/watchlist/favorite/rating must require minimal friction.
6. **Progressive depth.** Rating is fast; detailed notes are optional.
7. **No fake intelligence.** If personalization is weak, KARE states that it is using a cold-start/curated fallback rather than fabricating a personal reason.
8. **Small MVP.** Social feed, taste matching, partner matching, AI chat, payments and advanced awards/streaming features remain outside MVP.

## 4. MVP scope

- Account/session lifecycle.
- Taste onboarding.
- Movie search and metadata-backed movie details.
- Watched/watchlist/favorite states.
- Rating and optional personal review/note with spoiler flag.
- Personal lists.
- Automatic shelves/categories.
- Personal library with filters/sort.
- Discover home.
- Personal profile/statistics.
- `Ne İzlesem?` guided recommendation flow with explainable results.
- Cross-cutting loading/empty/error/retry/offline behavior.
- Analytics for the core value loop.

## 5. Non-goals

- Public social graph, followers or activity feed.
- Direct messaging.
- Public review community in MVP; reviews are personal/private until a later moderation-ready social release.
- Taste matching between people.
- “Birlikte İzle”.
- Gamification / Sinema Pasaportu.
- Director learning routes or a full cinema-history course.
- AI chat curator.
- Premium/payment/subscription.
- User-editable canonical movie metadata.
- Full awards ingest/archive.
- Full streaming-provider discovery/filtering.

---

## 6. Feature specifications

### F-001 — Account and session

- **User goal:** Keep a private, persistent cinema library across sessions/devices.
- **Trigger:** First launch, sign-in prompt or session restoration.
- **Preconditions:** Network is required for account creation/sign-in and server-backed session establishment.
- **Happy path:**
  1. User chooses sign up or sign in.
  2. User provides a supported credential method.
  3. Credentials are validated.
  4. Session is created securely.
  5. New users continue to taste onboarding; returning users reach Discover.
- **Alternate paths:** Returning valid session restores without forcing login. User may sign out from settings.
- **Validation:** Normalize/validate email where email auth is used; password rules come from chosen auth provider configuration and are surfaced before submission.
- **Permissions:** Only the authenticated owner may read/write their private library/profile data.
- **Loading:** Disable duplicate submit while request is pending; show progress.
- **Empty:** N/A.
- **Error/retry:** Show actionable auth errors without exposing sensitive internals; allow retry.
- **Offline/degraded:** Existing locally cached app shell may open, but new auth cannot complete offline.
- **Analytics:** `auth_signup_started`, `auth_signup_succeeded`, `auth_login_succeeded`, `auth_failed`, `auth_signed_out` without credentials/PII payloads.
- **Acceptance criteria:**
  - [ ] A new user can create an account and reach onboarding.
  - [ ] A returning user can sign in and retrieve their server-backed library.
  - [ ] A valid session restores after app restart.
  - [ ] Signing out removes local authenticated access.
  - [ ] One user cannot read another user’s private library through normal client access.
  - [ ] Auth errors provide retry and never reveal secrets/tokens.
- **Out of scope:** Social login providers unless architecture selects them as a low-cost supported method; multi-account switching.

### F-002 — Taste onboarding

- **User goal:** Give KARE enough early signal to avoid a completely generic first recommendation.
- **Trigger:** First successful account creation, or profile/settings option to revisit later.
- **Preconditions:** Authenticated user; movie seed set is available.
- **Happy path:**
  1. User sees a poster grid containing deliberately varied movies.
  2. User selects movies they like.
  3. UI shows selection count and selected state.
  4. User completes onboarding after meeting the minimum selection threshold.
  5. Selections become initial preference signals.
- **Alternate paths:** User may skip after being informed that initial recommendations will be less personalized.
- **Validation:** Minimum recommended selection: 5 liked films when not skipping. Duplicate selections are impossible.
- **Permissions:** Selections are private to the user.
- **Loading:** Seed loading uses skeletons; completion shows progress while preferences persist.
- **Empty:** If seed content cannot load, provide retry and a “continue without personalization” degraded route.
- **Error/retry:** Persist atomically where practical; retry failed save without losing local selections.
- **Offline/degraded:** If seed data is already cached, selection may be staged locally; server persistence occurs when online. Otherwise allow skip/deferred onboarding rather than blocking the whole app.
- **Analytics:** `taste_onboarding_viewed`, `taste_onboarding_completed`, `taste_onboarding_skipped`, count of selected films only (not raw sensitive profile inference).
- **Acceptance criteria:**
  - [ ] Selected posters have an unambiguous visual selected state.
  - [ ] User can select/deselect without duplicates.
  - [ ] Completion persists initial signals and does not reappear as mandatory next launch.
  - [ ] Skip path is available and clearly explains weaker personalization.
  - [ ] Failure to load seed movies does not permanently block app entry.
- **Out of scope:** Long personality quiz; free-text taste analysis.

### F-003 — Movie search

- **User goal:** Find a known movie quickly and add/view it.
- **Trigger:** Search action from Discover or global add flow.
- **Preconditions:** App can reach the movie metadata integration or has a relevant cached result.
- **Happy path:**
  1. User enters a movie title.
  2. Results show poster, title, release year and enough context to disambiguate.
  3. User taps a result.
  4. Movie detail opens.
- **Alternate paths:** Search by partial title; localized/original titles may both be matched when provider supports them.
- **Validation:** Ignore empty/whitespace-only query; safely encode external requests; cap client result rendering/pagination.
- **Permissions:** Search metadata itself is non-user-private; user actions from results remain private.
- **Loading:** Inline loading/skeleton; previous valid UI should not crash while a new query runs.
- **Empty:** “Sonuç bulunamadı” with query-edit guidance.
- **Error/retry:** Distinguish no-results from provider/network failure; retry button.
- **Offline/degraded:** Search cached recently viewed movies when available; otherwise explain that search requires connection.
- **Analytics:** `movie_search_performed` (query text should not be sent to analytics by default), `movie_search_result_opened` with provider movie ID.
- **Acceptance criteria:**
  - [ ] Empty query sends no provider request.
  - [ ] Results visually distinguish same-name movies with year/poster where available.
  - [ ] No-result and request-failure states are different.
  - [ ] Opening a result resolves to a stable internal/provider movie identifier, not title text alone.
- **Out of scope:** Person search, director search and public list search in MVP.

### F-004 — Movie detail

- **User goal:** Understand the movie and immediately see/manage personal status.
- **Trigger:** Open movie from search, Discover, shelf, library, list or recommendation.
- **Preconditions:** Stable movie ID.
- **Happy path:**
  1. Show poster/backdrop and core metadata: title, year, runtime, director when available, genres, synopsis.
  2. Show personal state prominently: watched/watchlist/favorite/rating/note status.
  3. Allow watched/watchlist/favorite actions without leaving page.
  4. Show relevant automatic shelf/category labels conservatively.
- **Alternate paths:** Partial metadata remains usable; missing poster/backdrop uses non-breaking placeholder.
- **Validation:** External metadata is treated as untrusted input; IDs/types validated before persistence.
- **Permissions:** Personal state only for owner.
- **Loading:** Poster/text skeleton; personal state and metadata can load independently without contradictory final state.
- **Empty:** Missing optional fields are omitted rather than displaying false values.
- **Error/retry:** If remote metadata refresh fails but cached metadata exists, show cached data with degraded state; otherwise retry.
- **Offline/degraded:** Cached detail and personal state can be read; writes may be queued only if conflict semantics are explicitly implemented, otherwise disable with clear message.
- **Analytics:** `movie_detail_viewed`, source surface, movie ID.
- **Acceptance criteria:**
  - [ ] Detail always identifies movie by stable ID.
  - [ ] Personal state is visible and consistent after reload.
  - [ ] Missing optional metadata never displays invented placeholders such as fake ratings/awards.
  - [ ] User can reach watched/watchlist/favorite actions with one tap from the detail screen.
- **Out of scope:** Full cast/crew encyclopedia, trailers, streaming providers, full awards archive.

### F-005 — Watched, watchlist and favorite states

- **User goal:** Maintain the core personal library quickly.
- **Trigger:** Action from movie detail, library quick action or add flow.
- **Preconditions:** Authenticated user and valid movie ID.
- **Happy path:**
  - `İzledim`: create/update watched state and optional watched date (default current date, editable later if supported by UI).
  - `İzleyeceğim`: add to watchlist.
  - `Favori`: toggle favorite independently.
- **State rules:**
  - A movie may be watched and favorite simultaneously.
  - Marking a movie watched removes it from active watchlist by default to keep the watchlist actionable.
  - Undo is available immediately after destructive/removal-style transitions where practical.
- **Validation:** Idempotent toggles/upserts; one logical user-movie state record per movie.
- **Permissions:** Owner-only.
- **Loading:** Optimistic UI is allowed only with rollback on server failure; duplicate taps are protected.
- **Empty:** Library tabs explain how to add first item.
- **Error/retry:** Failed optimistic mutation rolls back and surfaces retry.
- **Offline/degraded:** Read cached state; do not silently claim persistence when offline.
- **Analytics:** `movie_marked_watched`, `movie_watchlisted`, `movie_favorited`, removals, source surface.
- **Acceptance criteria:**
  - [ ] Repeated action cannot create duplicate logical state rows.
  - [ ] Marking watchlist movie as watched removes it from active watchlist.
  - [ ] Mutation failure cannot leave UI showing a false persisted state after reconciliation.
  - [ ] State remains correct after app reload.
- **Out of scope:** Multiple watch diary entries for re-watches in MVP unless database plan proves it low-cost without complicating core state.

### F-006 — Rating and personal review/note

- **User goal:** Record what they thought without forcing a long review flow.
- **Trigger:** After marking watched or from an already-watched movie.
- **Preconditions:** Movie is marked watched before publishing a rating/note.
- **Happy path:**
  1. User chooses a 0.5-step rating from 0.5 to 5.0, or leaves rating unset.
  2. User may add optional text note/review.
  3. User may mark the text as containing spoilers.
  4. Save persists and profile/library updates.
- **Alternate paths:** Quick rating only; edit/delete own rating/note later.
- **Validation:** Rating range 0.5–5.0 in 0.5 increments when present; note length gets a documented sane limit in implementation; trim accidental surrounding whitespace.
- **Permissions:** Owner-only in MVP. Public review visibility is explicitly disabled.
- **Loading:** Save progress; prevent duplicate save races.
- **Empty:** No rating/note simply means unset.
- **Error/retry:** Preserve unsaved text locally during retry in the current session.
- **Offline/degraded:** Allow local draft but never show it as server-saved until sync succeeds.
- **Analytics:** Rating value may be used as product preference data; free-text note content must not be sent to analytics.
- **Acceptance criteria:**
  - [ ] Invalid rating values are rejected server-side as well as client-side.
  - [ ] Quick rating does not require note text.
  - [ ] User can edit/delete their own rating/note.
  - [ ] Another user cannot read the private note through client data access.
  - [ ] Spoiler flag persists with note for future social compatibility.
- **Out of scope:** Public likes/comments/replies, public moderation UI.

### F-007 — Personal lists

- **User goal:** Group movies into personally meaningful collections.
- **Trigger:** Lists tab, movie quick action or detail action.
- **Preconditions:** Authenticated user.
- **Happy path:**
  1. Create list with name and optional description.
  2. Add/remove movies.
  3. Reopen list and see saved movies.
  4. Rename/edit/delete list.
- **Alternate paths:** Add movie to an existing list directly from film detail.
- **Validation:** Non-empty trimmed list name; per-user duplicate names may be allowed or prohibited by database design, but UI behavior must be deterministic. Duplicate movie inside same list is prohibited.
- **Permissions:** Lists are private in MVP.
- **Loading:** Mutations show progress/optimistic rollback semantics.
- **Empty:** Empty list has instructional state and add CTA.
- **Error/retry:** Failed add/remove cannot silently diverge from persisted state.
- **Offline/degraded:** Cached read; writes require online unless an explicit sync layer exists.
- **Analytics:** `list_created`, `list_movie_added`, `list_deleted`; never send private list description text.
- **Acceptance criteria:**
  - [ ] User can create, rename and delete a list.
  - [ ] A movie can appear at most once per list.
  - [ ] Same movie may belong to multiple lists.
  - [ ] Deleted list membership disappears without deleting the movie from personal library state.
  - [ ] Other users cannot access private lists.
- **Out of scope:** Collaborative/public lists, follows, list comments.

### F-008 — Automatic cinema shelves

- **User goal:** Explore a structured cinema library without manually filing movies.
- **Trigger:** Discover/shelves entry or automatic labels on a movie.
- **Preconditions:** Shelf definitions and movie metadata are available.
- **Happy path:**
  1. User opens a shelf such as a decade, genre or curated canonical collection.
  2. Shelf presents poster grid and optional progress (`izlenen / toplam`).
  3. User can filter to all/watched/unwatched when meaningful.
- **Shelf sources in MVP:**
  - objective metadata rules: decade, genre, country/language only when provider data is reliable enough;
  - curated KARE sets: e.g. “Sinema Klasikleri” or “Kült Filmler”, maintained as explicit stable movie IDs rather than opaque AI classification.
- **Validation:** Shelf membership must be deterministic and explainable by rule/curated membership.
- **Permissions:** Shelf definitions may be public/shared app content; personal progress is private.
- **Loading:** Skeleton grid; progressive poster loading.
- **Empty:** Shelf definition with zero valid movies is hidden from production Discover and treated as content/configuration error.
- **Error/retry:** Partial metadata failure should not blank the whole shelf if cached/remaining items exist.
- **Offline/degraded:** Cached shelf can render; missing remote pages are unavailable with clear state.
- **Analytics:** `shelf_opened`, `shelf_movie_opened`, shelf ID.
- **Acceptance criteria:**
  - [ ] A movie may appear in multiple shelves without duplicated canonical movie records.
  - [ ] User never has to manually place a movie into automatic shelves.
  - [ ] Curated subjective shelves use explicit curated membership, not an unexplained model label.
  - [ ] Shelf progress is computed from the user’s watched state and remains private.
- **Out of scope:** Automated scraping of award/festival websites; user-generated public shelves.

### F-009 — Personal library

- **User goal:** Review and navigate their personal collection quickly.
- **Trigger:** Bottom navigation `Kütüphanem`.
- **Preconditions:** Authenticated session.
- **Happy path:**
  1. Tabs expose watched, watchlist and favorites.
  2. Poster grid renders user’s movies.
  3. User can filter/sort using MVP-supported dimensions.
  4. Tap opens movie detail.
- **MVP filters/sort:** user rating, release year, genre, watched date where data exists; sort by recent activity/title/year/rating.
- **Permissions:** Owner-only.
- **Loading:** Skeleton grid with stable layout.
- **Empty:** Each empty tab includes a specific CTA to search/discover.
- **Error/retry:** Retry and preserve currently selected tab/filter.
- **Offline/degraded:** Cached library remains browseable.
- **Analytics:** `library_viewed`, tab/filter identifiers only.
- **Acceptance criteria:**
  - [ ] Each library tab reflects persisted state after reload.
  - [ ] Empty states lead to a relevant next action.
  - [ ] Filters do not change underlying state.
  - [ ] Library rendering does not require fetching full remote movie detail one movie at a time when cached metadata exists.
- **Out of scope:** Complex custom query builder.

### F-010 — Discover home

- **User goal:** Open KARE and immediately have useful paths to a movie.
- **Trigger:** Authenticated app entry.
- **Preconditions:** Session; some content modules may require network.
- **Happy path:** Home includes:
  1. prominent `Ne İzlesem?` hero;
  2. `Senin İçin` personalized/fallback recommendations;
  3. `Çünkü Bunları Sevdin` when evidence exists;
  4. selected automatic shelf/editorial modules.
- **Alternate paths:** Cold-start user sees curated starter content and an explanation instead of fake personalization.
- **Validation:** Modules with insufficient data hide or use an explicitly labeled fallback.
- **Permissions:** Personalized modules use owner-private signals.
- **Loading:** Independent section skeletons; one failed module must not crash entire home.
- **Empty:** If all personalized modules lack data, show curated starter shelves and CTA to rate/select movies.
- **Error/retry:** Section-level retry where feasible; global retry only for global failure.
- **Offline/degraded:** Cached Discover modules can render; personalized recomputation may wait for network.
- **Analytics:** module impressions/clicks, recommendation IDs, source surface.
- **Acceptance criteria:**
  - [ ] `Ne İzlesem?` is reachable from initial Discover without scrolling through a large catalog.
  - [ ] Personalized language is not used when no personalization evidence exists.
  - [ ] Failure of one remote module does not blank the entire screen.
  - [ ] Recommendation source is retained so downstream conversion can be attributed.
- **Out of scope:** Social/community activity feed.

### F-011 — `Ne İzlesem?` guided decision flow

- **User goal:** Receive a small set of suitable movies for the current viewing context.
- **Trigger:** `Ne İzlesem?` CTA.
- **Preconditions:** Authenticated user; recommendation candidate data available.
- **Inputs:**
  - mood (e.g. sakin, eğlenmek, ağlamak, gerilmek, düşündürsün, romantik, ilham, ağır);
  - available time bucket;
  - desired challenge level (kolay/orta/zor);
  - optional `yalnızca izlemediklerim` (default true);
  - optional small set of MVP metadata filters if implementation remains simple.
- **Happy path:**
  1. User selects context in a short guided sequence.
  2. System validates constraints.
  3. Candidate set excludes disallowed/watched movies according to selection.
  4. User receives at most 3 ranked movies.
  5. Top result includes a concise `Neden bunu seçtik?` explanation.
  6. User can open/save the movie or request another set.
- **Recommendation evidence hierarchy:**
  1. current request constraints;
  2. explicit ratings/favorites/taste-onboarding signals;
  3. watch/list interactions as weaker signals;
  4. curated/cold-start fallback.
- **Explanation rule:** Never claim a user liked a movie unless the persisted user signal supports it. If using fallback, say so.
- **Validation:** Runtime must satisfy chosen bucket with documented tolerance; watched exclusion is deterministic; invalid empty candidate set handled explicitly.
- **Permissions:** User preference/history signals are private.
- **Loading:** Dedicated “film seçiliyor” state without fake progress percentage.
- **Empty:** Explain which constraints produced no result and offer to relax the narrowest constraints.
- **Error/retry:** Preserve chosen inputs and allow retry.
- **Offline/degraded:** If a valid cached candidate/index exists, a degraded local recommendation may run; otherwise explain connection requirement without losing selections.
- **Analytics:** `decision_flow_started`, selected enum/filter IDs, `recommendation_set_shown`, `recommendation_opened`, `recommendation_saved`, `recommendation_marked_watched`; do not log free-text because MVP has none.
- **Acceptance criteria:**
  - [ ] Result set contains 1–3 movies, never an infinite list.
  - [ ] Default flow excludes watched movies.
  - [ ] Runtime/context constraints are respected within documented tolerance.
  - [ ] Every personalized explanation is traceable to real stored/request signals.
  - [ ] Cold-start fallback is labeled as curated/general rather than personalized.
  - [ ] No-result path lets user relax constraints without restarting the flow.
  - [ ] Source attribution survives save → watched so WSMD can be computed.
- **Out of scope:** Natural-language LLM conversation, generative plot analysis, automatic web scraping.

### F-012 — Recommendation result and decision acceptance

- **User goal:** Commit to a choice rather than keep browsing indefinitely.
- **Trigger:** Successful F-011 recommendation request.
- **Happy path:**
  1. Top recommendation is visually dominant.
  2. Show poster, title, year/runtime when available, and reason.
  3. Actions: `Detayı Gör`, `İzleme Listeme Ekle` / `Bunu Seç`, `Başka Öner`.
  4. Alternative 1–2 films remain secondary.
- **Validation:** Recommendation instance/set ID is retained for attribution.
- **Permissions:** Owner-private recommendation record where persisted.
- **Loading/error/offline:** Inherit F-011; saving decision uses mutation rollback semantics.
- **Analytics:** recommendation impression/open/save/next-set.
- **Acceptance criteria:**
  - [ ] Screen visually emphasizes one decision rather than equal-weight infinite choices.
  - [ ] Accepting/saving a recommendation records its recommendation source.
  - [ ] Later `İzledim` conversion can be linked to the originating decision event/set when available.
- **Out of scope:** Autoplay/trailer-first experience.

### F-013 — Personal profile and basic statistics

- **User goal:** See a concise portrait of personal cinema activity.
- **Trigger:** Profile tab.
- **Preconditions:** Authenticated user.
- **Happy path:** Show display name/avatar placeholder or optional avatar, total watched, favorites count, ratings/reviews count, current-year watched count, average rating when defined, selected favorite posters, recent watched items.
- **Alternate paths:** New user sees inviting empty profile with onboarding actions.
- **Validation:** Stats are derived from persisted data; no misleading average when no ratings exist.
- **Permissions:** Profile is private in MVP.
- **Loading:** Stats and poster sections load independently.
- **Empty:** “Henüz film yok” plus Discover/Search CTA.
- **Error/retry:** Section-level recovery.
- **Offline/degraded:** Cached profile/statistics may display with last-updated semantics if needed.
- **Analytics:** `profile_viewed`; no unnecessary personal fields.
- **Acceptance criteria:**
  - [ ] Counts match canonical library data.
  - [ ] Average rating ignores unrated movies.
  - [ ] Profile does not expose private data to unauthenticated/other users in MVP.
- **Out of scope:** Public follower profile, public taste compatibility, advanced taste-map percentages unless a later validated model defines them.

---

## 7. Cross-cutting behavior

### Onboarding
- Splash is visual only and must not delay startup unnecessarily.
- Product introduction is short (target 3 pages maximum).
- Taste onboarding is optional/deferable after failure/explicit skip.
- Returning authenticated users do not repeat mandatory onboarding after successful completion/skip.

### Navigation
MVP bottom navigation intent:
- `Keşfet`
- `Kütüphanem`
- central quick-add/search action
- `Listeler`
- `Profil`

Search is reachable from Discover and quick-add; `Ne İzlesem?` is prominent on Discover.

### Account lifecycle
- Sign up, sign in, session restore and sign out are MVP.
- Account deletion must be implemented before public store release if required by current platform policy and chosen auth model; exact behavior is finalized at architecture/release stages using current official policies.
- Data export is not an MVP product feature unless policy/legal requirements make it mandatory.

### Accessibility
- Interactive controls have accessible names/roles.
- Do not communicate selected/watched/favorite/rating state by color alone.
- Text respects platform font scaling within supported layouts.
- Poster images have meaningful accessible labels where they function as navigation.
- Tap targets follow platform accessibility guidance selected during implementation.

### Localization
- Initial product language is Turkish.
- Architecture must avoid hard-coding user-facing text so additional languages can be added later.
- Movie provider language/region handling must be explicit and must not corrupt stable IDs.

### Notifications
Not required for MVP. No notification permission request in initial release unless scope changes.

### Privacy and data classification
- **Private user data:** account link, watched/watchlist/favorite state, ratings, personal notes/reviews, personal lists, recommendation history/signals, onboarding choices.
- **Shared/app content:** automatic shelf definitions and curated movie-ID memberships.
- **External/public metadata:** movie metadata sourced from TMDB subject to provider terms/attribution.
- Free-text personal notes are not analytics payloads.
- Secrets/service credentials never live in repository or client bundle.

### Moderation
- Public UGC is disabled in MVP, substantially reducing moderation surface.
- If reviews/lists become public later, reporting/blocking/moderation and current store UGC policies become a gate before enabling visibility.

### Payments
Not in MVP. No payment SDK or paywall dependency should be introduced.

### Account deletion
Final deletion semantics belong in DATABASE/ARCHITECTURE. Product expectation: deletion should remove or anonymize owner-private user content in a predictable, testable way consistent with policy and retention requirements; no silent orphaned private content.

### Error taxonomy
User-visible classes should distinguish at least:
- no data / empty state;
- offline/no network;
- external movie-data provider failure;
- authentication/session expiration;
- authorization failure;
- write conflict or failed mutation;
- unexpected app error.

Do not expose raw backend/provider stack traces.

### Analytics and primary value attribution
The system must support attribution from:
`Discover/Ne İzlesem recommendation → movie opened/saved → marked watched`.

This is required to compute Weekly Successful Movie Decisions. Analytics event schemas must use stable IDs and enums and avoid secrets/free-text notes.

## 8. Product risks

1. **Weak differentiation:** If `Ne İzlesem?` is generic, KARE collapses into another tracker.
2. **Cold start:** New users may not provide enough signal; curated fallback must still be good.
3. **False personalization:** Incorrect “because you liked…” claims destroy trust; explanations must be evidence-backed.
4. **Metadata dependency:** Provider outage/terms/rate changes affect search/discover; integration must be isolated and cached appropriately.
5. **Scope expansion:** Social/AI/awards/streaming can delay the core loop; they remain explicitly post-MVP.
6. **Subjective shelves:** “Kült/klasik” cannot be derived reliably from generic genre metadata; curated membership is required.
7. **Public repository:** accidental secret exposure risk is elevated; secret-scanning/hygiene belongs in foundation work.

## 9. Open decisions for later lifecycle stages

These are technical/operational decisions, not blockers for product behavior:
- Exact mobile framework/runtime versions.
- Backend/auth/database vendor and deployment region.
- Exact TMDB proxy/cache strategy and attribution implementation.
- Exact recommendation scoring algorithm/data representation, provided it obeys F-011 behavior.
- Final account deletion/retention implementation based on current platform/provider policy.
- Crash/analytics vendors, if any, selected with privacy/cost discipline.

No product-scope decision is currently unresolved.
