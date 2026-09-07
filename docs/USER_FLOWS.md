# KARE — User Flows

## 1. Navigation model

### Authenticated bottom navigation
1. **Keşfet** — home, `Ne İzlesem?`, curated/automatic shelves, search entry.
2. **Kütüphanem** — watched, watchlist, favorites and filters.
3. **＋** — global quick action that opens movie search/add sheet.
4. **Listeler** — personal lists.
5. **Profil** — personal statistics, recent activity and settings entry.

### Global routes / overlays
- Search
- Movie Detail
- Rating / Personal Note sheet
- `Ne İzlesem?` wizard
- Recommendation Result
- Automatic Shelf
- Personal List Detail
- Settings / Account

No MVP route exists solely for a social feed, public profile or messaging.

---

## 2. Flow coverage matrix

| Feature | Primary flow(s) |
|---|---|
| F-001 Account/session | UF-001, UF-002, UF-013 |
| F-002 Taste onboarding | UF-001 |
| F-003 Search | UF-003 |
| F-004 Movie detail | UF-003, UF-004, UF-007, UF-009 |
| F-005 Watched/watchlist/favorite | UF-004, UF-005 |
| F-006 Rating/private note | UF-005 |
| F-007 Personal lists | UF-006 |
| F-008 Automatic shelves | UF-007 |
| F-009 Personal library | UF-008 |
| F-010 Discover | UF-002, UF-007, UF-009 |
| F-011 Ne İzlesem? | UF-009, UF-010 |
| F-012 Recommendation result | UF-009, UF-010 |
| F-013 Profile/stats | UF-011 |
| Error/offline/recovery | UF-012, UF-013 |

---

## UF-001 — First run → account → taste onboarding

### Starting state
Fresh install or signed-out user with no valid session.

### Flow
`Launch`
→ Splash while app/bootstrap state resolves
→ no valid session
→ short product onboarding (max 3 screens; skippable to auth)
→ `Giriş Yap` / `Hesap Oluştur`
→ user chooses account action
→ credentials submitted
→ auth request pending

**If auth succeeds and account is new:**
→ Taste Onboarding poster grid
→ user selects liked movies
→ selection count updates
→ decision:
- `5+ selected` → `Devam et`
- fewer than minimum → continue selecting or explicit `Atla`
→ preference save pending
→ onboarding completion persisted
→ Discover

**If user skips taste onboarding:**
→ confirm/inline message: “İlk öneriler daha genel olacak; bunu daha sonra tamamlayabilirsin.”
→ mark onboarding as skipped/deferred
→ Discover with curated cold-start modules

### Failure branches
- Seed movies fail to load → error state with `Tekrar Dene` + `Şimdilik Atla`.
- Auth invalid → remain on auth form, preserve non-sensitive form state as appropriate, show actionable error.
- Network unavailable during auth → offline message + retry; do not pretend account/session exists.
- Preference save fails → keep current selections in UI/session and retry; user may enter degraded Discover only if server/account state is valid and onboarding can be deferred safely.

### Terminal outcomes
- Authenticated + taste onboarding completed.
- Authenticated + taste onboarding skipped/deferred.
- Signed out after unrecoverable/user-cancelled auth.

---

## UF-002 — Returning launch / session restoration

### Starting state
App launches with previously authenticated user.

### Flow
`Launch`
→ bootstrap reads secure/local session state
→ validate/refresh session using chosen auth SDK

**Valid/restorable session:**
→ load minimal user state
→ Discover

**Expired but refreshable:**
→ refresh silently
→ Discover

**Expired/invalid and cannot refresh:**
→ clear authenticated local access
→ sign-in screen with “Oturumun sona erdi” message

**Network unavailable:**
→ if architecture supports safe cached session + cached private data, enter read-only/degraded shell with offline banner
→ auth-sensitive writes disabled or explicitly queued only if sync semantics exist
→ when network returns, session is revalidated before server writes

### Terminal outcomes
- Authenticated Discover.
- Read-only/degraded cached shell.
- Signed-out auth screen.

---

## UF-003 — Search → movie detail

### Starting state
Authenticated user on Discover or global `＋` action.

### Flow
`Search`
→ input focused
→ user types title
→ valid non-empty query
→ request pending
→ results list/grid with poster + title + year
→ user taps movie
→ Movie Detail

### Decision branches
- No result → “Sonuç bulunamadı” + edit query.
- Multiple same-name films → year/poster disambiguates; user chooses.
- Optional metadata missing → result still opens using stable movie ID.

### Failure/recovery
- Provider/network error → show request failure, not “no result”; `Tekrar Dene`.
- Offline with cached recent movies → cached results may be shown and labeled/degraded.
- Offline without cache → connection-required message; query text remains.

### Terminal outcomes
- Movie Detail opened from `source=search`.
- Search abandoned; user returns to prior route.

---

## UF-004 — Movie detail → quick library state

### Starting state
Movie Detail from any source.

### Flow
Detail loads metadata and personal state independently
→ user sees poster/title/core metadata + `Senin Durumun`
→ user chooses one or more:

**Watchlist**
`İzleme Listeme Ekle`
→ pending mutation
→ success → UI reflects watchlist
→ optional undo/removal

**Watched**
`İzledim`
→ pending mutation
→ success
→ movie becomes watched
→ if active watchlist membership exists, remove it automatically
→ prompt lightweight rating sheet

**Favorite**
`Favori`
→ pending toggle
→ success → favorite state updates

### Failure/recovery
- Optimistic mutation fails → rollback visual state + retry snackbar/message.
- Session expired → auth recovery path UF-013; do not silently discard intended action if it can safely be retried after re-auth.
- Offline → either read-only action disabled with clear explanation or explicit unsynced state if later sync is implemented; never display persisted-success state falsely.

### Terminal outcomes
- Personal state persisted and visible.
- User stays on detail without state change.
- Rating sheet opens after watched.

---

## UF-005 — Watched → rating → optional private note

### Starting state
Movie is marked watched, or user opens rating action for an already-watched movie.

### Flow
Rating sheet
→ user selects `0.5...5.0` or leaves rating unset
→ fast path: `Kaydet`
→ persistence
→ close sheet

**Detailed path:**
`Daha detaylı değerlendir`
→ optional private note/review text
→ optional `Spoiler içeriyor` toggle
→ `Kaydet`
→ validate rating/note limits
→ save
→ return to Movie Detail or prior route

### Edit/delete branch
Existing rating/note
→ `Düzenle`
→ modify/save
or
→ `Notu sil` / `Puanı kaldır`
→ confirmation only if destructive enough to risk accidental loss
→ mutation
→ UI reconciles

### Failure/recovery
- Save failure → sheet remains; unsaved text remains in current session; retry.
- Invalid rating → impossible through normal UI and rejected server-side.
- Offline → allow local draft only; clearly label as unsaved until persistence succeeds.

### Terminal outcomes
- Rating and/or private note persisted.
- Watched state remains even if rating/note cancelled.

---

## UF-006 — Personal lists

### Starting state
Lists tab or `Listeye ekle` from Movie Detail.

### Create-list flow
`Listeler`
→ existing list cards or empty state
→ `Yeni Liste`
→ enter name + optional description
→ validate non-empty trimmed name
→ save
→ List Detail

### Add-from-movie flow
Movie Detail
→ `Listeye ekle`
→ bottom sheet of existing lists + `Yeni Liste`
→ choose list
→ add mutation
→ success checkmark/snackbar
→ duplicate membership remains a no-op/idempotent

### List detail flow
Open list
→ poster grid
→ tap movie → Movie Detail
→ remove movie via context action
→ list membership removed; personal watched/watchlist/favorite state is untouched

### Edit/delete flow
List settings
→ rename/description save
or
→ `Listeyi Sil`
→ destructive confirmation
→ delete list + memberships
→ return to Lists

### Failure/recovery
- Failed create/add/remove/delete → state rolls back/reconciles and retry is offered.
- Empty list → `Film Ekle` CTA opens search.
- Offline → cached list read; writes disabled unless explicit sync layer exists.

### Terminal outcomes
- Private list created/updated/deleted.
- No canonical movie/user library data is destroyed by deleting a list.

---

## UF-007 — Discover → automatic shelf → film

### Starting state
Discover.

### Flow
Discover loads independent modules
→ user sees curated/automatic shelf card (`70'ler`, `Bilimkurgu`, curated `Sinema Klasikleri`, etc.)
→ taps shelf
→ Shelf Detail
→ heading + optional description + progress (`izlenen/toplam`)
→ filter `Tümü / İzlediklerim / İzlemediklerim` where applicable
→ poster grid
→ tap poster
→ Movie Detail with `source=shelf:<id>`

### Branches
- User has watched none → progress 0; grid still useful.
- User has completed shelf → progress reflects complete; no special gamification required.
- Curated shelf config resolves no valid movies → shelf should not appear in production Discover; configuration fault is observable.

### Failure/recovery
- One Discover module fails → other modules remain.
- Shelf pagination/metadata partially fails → keep valid cached/current items and expose retry for missing data.
- Offline → cached shelf can render; unavailable pages clearly blocked.

### Terminal outcomes
- Movie Detail opened from shelf.
- User returns to Discover/library with no state mutation.

---

## UF-008 — Personal library browse/filter

### Starting state
`Kütüphanem` tab.

### Flow
Library
→ default tab `İzlediklerim`
→ user can switch:
- İzlediklerim
- İzleyeceklerim
- Favoriler
→ poster grid
→ optional filter/sort
→ tap movie → Movie Detail

### Filter flow
`Filtrele/Sırala`
→ select supported filter(s): rating/year/genre/watched date where available
→ sort: recent activity/title/year/rating
→ `Uygula`
→ grid updates
→ clear filters restores tab baseline

### Empty states
- Watched empty → “İlk filmini ekle” + Search/Discover.
- Watchlist empty → “İzlemek istediğin filmleri burada biriktir” + Discover.
- Favorites empty → explanation + library/search path.
- Filter returns zero → `Filtreleri temizle` rather than generic empty library.

### Failure/recovery
- Request failure → preserve active tab/filters and retry.
- Offline → cached library remains browseable.

### Terminal outcomes
- Movie Detail opened.
- Library state unchanged after pure filtering.

---

## UF-009 — Discover → `Ne İzlesem?` → accepted recommendation

### Starting state
Authenticated user on Discover.

### Flow
Prominent `Ne İzlesem? / Bana bir film seç` CTA
→ Step 1: mood
→ Step 2: available time
→ Step 3: challenge level
→ optional simple filters / `yalnızca izlemediklerim` default ON
→ `Filmimi Bul`
→ request/scoring state `Film seçiliyor…`
→ Recommendation Result

Result:
→ one dominant recommendation + up to two alternatives
→ top movie shows `Neden bunu seçtik?`
→ user chooses:

**Accept/save**
`İzleme Listeme Ekle` / `Bunu Seç`
→ persist watchlist + recommendation attribution
→ success state
→ later when user marks watched, conversion is linkable to recommendation

**Inspect**
`Detayı Gör`
→ Movie Detail with recommendation source retained
→ user may save/mark watched there

### Personalization branches
- Enough user evidence → explanation cites real request + stored signals.
- Cold start/weak signal → curated/general fallback language; no fake “sen bunu sevdiğin için”.

### Failure/recovery
- No candidates → explain conflicting/narrow filters; offer `Süreyi genişlet`, `Zorluk filtresini kaldır`, etc. without restarting.
- Provider/recommendation error → preserve all selections and retry.
- Offline with no valid cached candidate index → explain connection need and preserve selections.

### Terminal outcomes
- Recommendation saved/accepted with attribution.
- Movie Detail opened with attribution.
- User requests another set (UF-010).
- User exits with choices preserved only for current flow as designed.

---

## UF-010 — Recommendation result → another set / relax constraints

### Starting state
Recommendation Result.

### Flow
`Başka Öner`
→ system records current set as skipped, not disliked unless user explicitly says so in a future feature
→ request next candidate set under same constraints
→ avoid immediate duplicate results where feasible
→ render new 1–3 result set

**No more candidates:**
→ message “Bu filtrelerle başka güçlü eşleşme kalmadı.”
→ show quick relax actions
→ user relaxes one constraint
→ rerun

### Rules
- Skipping a set must not automatically create a strong negative taste signal.
- Watched exclusion remains unless user explicitly disables it.
- Explanations remain evidence-backed.

### Terminal outcomes
- New set displayed.
- Constraints relaxed and new set displayed.
- User exits.

---

## UF-011 — Profile / personal statistics

### Starting state
Profile tab.

### Flow
Profile
→ display name/basic account identity
→ watched count / favorites / rating or note count / current-year activity
→ favorite poster block if available
→ recent watched poster block
→ settings/account entry

### Empty branch
No watched movies
→ no fake averages or taste percentages
→ CTA `Film keşfet` / `İlk filmini ekle`

### Data correctness branch
Some movies unrated
→ average uses rated movies only
→ UI may display number of ratings to avoid ambiguity.

### Terminal outcomes
- Movie detail from favorite/recent poster.
- Settings/account route.
- Discover via empty-state CTA.

---

## UF-012 — Network loss and external provider failure

### A. Network lost while browsing cached private library
Existing cached content remains visible
→ offline banner/status
→ navigation among cached screens continues
→ server-dependent writes are either disabled or explicitly shown unsynced according to architecture
→ network returns
→ session revalidated
→ refresh/reconcile

### B. Network lost during mutation
User action pending
→ request fails/timeouts
→ optimistic state rolls back unless durable sync queue is deliberately implemented
→ message `Kaydedilemedi`
→ `Tekrar Dene`
→ retry uses idempotent server behavior

### C. TMDB/movie-data provider failure
Movie-data module fails
→ private library state remains accessible where local/cached metadata exists
→ provider-dependent search/discover section displays provider/network failure
→ `Tekrar Dene`
→ raw provider error is not shown.

### D. Partial Discover failure
One module fails
→ other modules continue
→ failed module gets section-level retry
→ no global blank screen unless bootstrap itself failed.

### Terminal outcomes
- Recovered online state.
- Safe degraded read-only state.
- Explicit retryable failure.

---

## UF-013 — Session expiry / authorization failure recovery

### Starting state
Authenticated UI attempts a private read/write and backend reports invalid/expired session or authorization failure.

### Flow
Request fails
→ distinguish authentication expiry from generic network failure

**Refresh possible:**
→ refresh token/session once through auth SDK
→ retry original request once if safe/idempotent
→ success → continue

**Refresh impossible:**
→ clear authenticated local access tokens/state according to security architecture
→ route to Sign In
→ message `Oturumun sona erdi. Tekrar giriş yap.`

**Authorization denied despite valid auth:**
→ do not retry infinitely
→ show safe error
→ record observable security/authorization failure metadata without private content
→ user remains unable to access forbidden resource.

### Terminal outcomes
- Session restored and original safe action completed.
- User returns to sign-in.
- Authorization denial safely contained.

---

## UF-014 — Sign out and account deletion readiness

### Sign out (MVP)
Profile → Settings → `Çıkış Yap`
→ confirmation only if there is unsaved local work
→ end remote/local session
→ clear protected local cached data according to architecture
→ Auth screen.

### Account deletion (required before public release when current policy applies)
Profile → Settings → `Hesabı Sil`
→ clear explanation of consequence
→ explicit destructive confirmation/re-auth if architecture/provider requires it
→ server-side deletion/anonymization workflow
→ user private content handled per `docs/DATABASE.md` retention/cascade design
→ session invalidated
→ signed-out terminal screen.

Deletion cannot be implemented as a client-only logout. Exact workflow is gated by architecture/database/current platform policy research.

---

## 3. Screen/state inventory

### Auth/first-run
- Splash/bootstrap
- Intro onboarding
- Sign in
- Sign up
- Taste onboarding

### Main shell
- Discover
- Library
- Quick Add/Search sheet
- Lists
- Profile

### Content/detail
- Search results
- Movie Detail
- Rating/Private Note sheet
- Automatic Shelf Detail
- Personal List Detail/Edit

### Decision engine
- `Ne İzlesem?` Mood
- Time
- Challenge/filters
- Recommendation loading
- Recommendation Result
- No-candidate/relax state

### Account
- Settings
- Sign-out confirmation when needed
- Account deletion route before release

### Cross-cutting states
- Skeleton/loading
- Empty
- Offline/degraded
- Retryable request error
- Session expired
- Authorization denied
- Unexpected error boundary

Every major MVP screen/state above maps to an explicit product feature or recovery need; no social/community-only screen is part of MVP.
