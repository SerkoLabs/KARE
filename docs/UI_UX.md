# KARE — UI/UX System

This document turns the approved KARE product flows into a consistent mobile visual/interaction system. It is subordinate to `README.md` and `docs/PRODUCT_SPEC.md`: visuals must not add unapproved product behavior.

## 1. Product feeling

KARE should feel like a modern cinema journal/editorial library, not like a streaming-service clone.

Target qualities:
- cinematic;
- artistic but usable;
- minimal;
- premium without being elitist;
- poster-first;
- calm, not gamified/noisy.

Reference blend: curated cinema magazine + personal journal + modern mobile library.

Core visual rule: **posters are navigation objects, not decoration.**

## 2. Color tokens

| Token | Value | Usage |
|---|---|---|
| `bg.primary` | `#101010` | root background |
| `bg.surface` | `#181818` | cards/sheets |
| `bg.surfaceRaised` | `#212121` | inputs/filter panels |
| `text.primary` | `#F3F0E8` | primary text |
| `text.secondary` | `#A7A49E` | year/runtime/supporting text |
| `accent.primary` | `#8E1F2D` | primary CTA, selected tab/filter |
| `state.success` | `#4F8A67` | watched/success state |
| `state.rating` | `#D8B35A` | rating stars |

Rules:
- Do not flood screens with burgundy; poster art supplies most screen color.
- Selected state must never rely on color alone.
- Contrast must be verified against accessibility requirements in implementation.

## 3. Typography

Two-family direction:
- **Editorial/display:** `DM Serif Display` or a technically suitable serif chosen in foundation. Used for film/editorial headings only.
- **UI:** `Inter` or a technically suitable modern sans-serif chosen in foundation.

Do not block Phase 0 on custom font download/licensing. If bundled fonts are not yet available, use platform-safe fallbacks behind semantic typography tokens and replace later without rewriting screens.

Semantic sizes, not arbitrary per-screen values:
- display/hero;
- page title;
- section title;
- body;
- secondary/meta;
- label/button.

## 4. Spacing and shape

Spacing scale: `4 / 8 / 12 / 16 / 24 / 32 / 48`.

Defaults:
- horizontal screen padding: `16`;
- section gap: `32`;
- poster radius: `6–8`;
- card/button radius: `10–12`;
- sheet top radius: `20–24`.

Poster ratio: **2:3**.

Grid baseline: 3 columns on common phone widths, adaptive where accessibility/font/device width requires it.

## 5. Button hierarchy

### Primary
Filled accent background. One visually dominant primary action per decision surface where possible.

Examples:
- `Filmimi Bul`
- `KARE'ye Başla`
- `Kaydet`

### Secondary
Border/surface action.

Examples:
- `İzleme Listeme Ekle`
- `Tekrar Dene`

### Ghost
Text/icon action for tertiary behavior.

Examples:
- `Daha sonra`
- `Atla`

Every button needs disabled/loading/pressed states and accessible label/role.

## 6. Poster card

Required minimum variants:
1. **Discovery poster** — poster + title + year + optional app/user rating.
2. **Library poster** — poster + user rating/status affordance.
3. **Selection poster** — onboarding/filters with visible border/check selected state.
4. **Hero recommendation** — larger poster/detail treatment plus reason.

Maximum visible overlay badge on a normal poster card: one concise badge such as `Cannes`, `Kült`, `Senin için`.

Do not stack many award/genre labels on the poster.

## 7. Main navigation

Bottom navigation:
- `Keşfet`
- `Kütüphanem`
- central `＋`
- `Listeler`
- `Profil`

Central `＋` opens quick-add/search sheet; it is not a separate persistent content tab.

Navigation state must remain obvious with icon + accessible label; do not depend on icon recognition alone.

## 8. MVP screen inventory

### First run/auth
1. Splash/bootstrap
2. Intro onboarding (max 3 pages)
3. Sign in
4. Sign up
5. Taste onboarding

### Main shell
6. Discover
7. Search
8. Movie detail
9. Library
10. Lists
11. Personal list detail/edit
12. Automatic shelf detail
13. Profile
14. Settings

### Logging
15. Rating/private note sheet

### Decision engine
16. `Ne İzlesem?` mood step
17. Time step
18. Challenge/filters step
19. Recommendation loading
20. Recommendation result
21. No-candidate/relax state

Screens may share route/layout components; this list describes user-visible states, not required code-file count.

## 9. Discover composition

Priority order:
1. greeting/context title;
2. large `NE İZLESEM? / Bana bir film seç` hero CTA;
3. `Senin İçin` only when evidence is strong enough;
4. `Çünkü Bunları Sevdin` only with truthful signal;
5. selected curated/automatic shelves;
6. additional discovery modules below.

Cold-start rule: use explicitly curated/general language instead of fake personalization.

One section failure does not blank the full screen.

## 10. `Ne İzlesem?` interaction

Use a short guided flow, not one dense form.

### Step 1 — Mood
Examples:
- Sakin
- Eğlenmek istiyorum
- Duygusal
- Gerilmek istiyorum
- Düşündürsün
- Romantik
- İlham ver
- Ağır bir şey

### Step 2 — Time
- 90 dk'dan az
- yaklaşık 2 saat
- 2–2.5 saat
- süre önemli değil

### Step 3 — Challenge
- Kolay
- Orta
- Zor

Default toggle: `Yalnızca izlemediklerim` ON.

Result principles:
- return only 1–3 movies;
- visually emphasize one top decision;
- show `Neden bunu seçtik?` using evidence-backed text;
- secondary actions: detail, save/accept, another set;
- no infinite swipe/feed.

## 11. Movie detail hierarchy

Order:
1. backdrop/gradient + poster;
2. title/year/runtime/director/core metadata;
3. primary personal actions: `İzledim`, `İzleyeceğim`, `Favori`;
4. **Senin Durumun** block when relevant;
5. synopsis;
6. selected shelf/category context.

MVP does not require full cast encyclopedia, trailers, streaming providers or full awards archive.

If metadata is missing, omit it rather than display fabricated placeholder values.

## 12. Rating/private note sheet

Fast path first:
- large 0.5-step star rating;
- `Kaydet`.

Optional depth:
- private text note;
- `Spoiler içeriyor` toggle.

Watched state persists even if user closes without rating.

On failed save, preserve unsaved note in current session and clearly show failure/retry.

## 13. Library

Tabs:
- İzlediklerim
- İzleyeceklerim
- Favoriler

Poster grid is primary. Filters/sort live behind one control.

Empty states are action-specific:
- no watched → `İlk filmini ekle`;
- no watchlist → `Film keşfet`;
- zero filtered result → `Filtreleri temizle`.

## 14. Lists and shelves

### Personal lists
Card uses small poster collage + name + count. Private by default with no public badge needed in MVP.

### Automatic shelves
Editorial cards may be wider and visually distinct from personal lists.

Shelf detail:
- title/short context;
- optional progress `24 / 79 filmi izledin`;
- `Tümü / İzlediklerim / İzlemediklerim` when applicable;
- poster grid.

Avoid childlike achievement language.

## 15. Profile

MVP profile is personal, not public/social.

Show only truthful derived values:
- watched count;
- favorites;
- rating/note count;
- current-year activity;
- average rating only when ratings exist;
- favorite posters;
- recent watched.

Do not show invented “taste percentages” until a validated model exists.

## 16. Loading, empty, error and offline states

### Loading
Use layout-preserving skeletons for poster grids and details. Do not show fake percentage progress for recommendation generation.

### Empty
Empty is a valid product state and gets a relevant next action.

### Error
Distinguish:
- offline/network;
- authentication/session expiry;
- TMDB/provider failure;
- mutation save failure;
- unexpected error.

Do not expose raw backend error bodies.

### Offline
Cached library may stay readable with a visible offline state. Mutations must not look persisted if no sync exists.

## 17. Motion/haptics

Motion is subtle and functional:
- 150–200 ms favorite scale;
- watched check feedback;
- light poster press scale;
- native-feeling sheet spring;
- rating feedback.

Haptics may be used for rating/favorite/watched/save confirmation if supported, but are enhancement-only and never the sole state signal.

Respect reduced-motion settings where applicable.

## 18. Accessibility baseline

- Minimum accessible labels/roles for every icon-only control.
- Selected/favorite/watched states include shape/icon/text semantics, not color alone.
- Poster navigation has readable accessible name (movie title + year where useful).
- Dynamic type/font scaling must not hide primary actions.
- Tap targets follow current iOS/Android accessibility guidance at implementation/release review.
- Focus/order makes modal/sheet flows usable with assistive tech.

## 19. Non-MVP visual surfaces

Do not build or fake:
- follower feed;
- public profiles;
- public review comments;
- chat/DM;
- taste-match percentage between users;
- `Birlikte İzle`;
- Sinema Pasaportu;
- premium paywall;
- AI chat screen.

Placeholders for these features should not appear in the beta navigation.

## 20. Implementation rule

All reusable colors, spacing, typography and shape values live behind design tokens/components. Screens may compose them but should not scatter literal palette values across route files.

Visual polish cannot override product truth: recommendation reason, personal state, ratings and progress must always come from actual data/state.
