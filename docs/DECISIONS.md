# KARE — Material Decisions

This log records decisions that materially shape product scope, architecture, data ownership or release constraints. Routine implementation choices belong in code/plan rather than here.

## D-001 — Product position
**Status:** Accepted  
**Decision:** KARE is a personal cinema library + curation + decision engine, not a Turkish Letterboxd clone.  
**Reason:** The repeatable product value is reducing the “what should I watch now?” decision while improving a durable personal archive.

## D-002 — Social/community is post-MVP
**Status:** Accepted  
**Decision:** Reviews, lists, taste history and profile are private in MVP. Followers, public feed, taste matching, public UGC and messaging are deferred.  
**Reason:** Keeps the first release centered on the core loop and avoids premature moderation/store-policy surface.

## D-003 — Mobile architecture
**Status:** Accepted  
**Decision:** Expo / React Native / TypeScript with Expo Router; Supabase for Auth/Postgres/Edge Functions; TanStack Query for server state.  
**Reason:** Direct fit for mobile-first product, owner-private relational data, RLS and small server boundaries without a separate API platform.

## D-004 — TMDB boundary
**Status:** Accepted  
**Decision:** TMDB API calls are made from trusted Edge Functions; the TMDB read token does not ship in the mobile app. KARE stores normalized movie metadata keyed by stable TMDB ID.  
**Reason:** Centralizes credentials, normalization, caching/rate behavior and future provider replacement.

## D-005 — Recommendation engine v1
**Status:** Accepted  
**Decision:** `Ne İzlesem?` uses deterministic, versioned server-side ranking with evidence-backed explanation templates and returns at most 3 movies. No LLM is required for MVP.  
**Reason:** The core promise must be explainable, cheap, testable and auditable before adding generative AI.

## D-006 — Offline posture
**Status:** Accepted  
**Decision:** MVP supports selective cached reads but no general offline write queue.  
**Reason:** Useful degraded browsing without introducing conflict resolution/multi-master sync complexity.

## D-007 — Supabase authorization
**Status:** Accepted  
**Decision:** Client-exposed owner data is protected by explicit grants + RLS. `service_role` is server-only. Shared movie/shelf content is client-read/server-write.  
**Reason:** Authorization belongs at the data boundary, not in client filters.

## D-008 — Storage
**Status:** Accepted  
**Decision:** No Supabase Storage bucket in MVP.  
**Reason:** No approved upload feature requires one; adding a bucket would create unnecessary authorization surface.

## D-009 — TMDB commercial operation
**Status:** External release/business gate  
**Decision:** Repository development may use the technical TMDB integration, but monetized/commercial public operation must confirm the appropriate TMDB licensing/permission and required attribution before activation.  
**Reason:** Current TMDB developer documentation distinguishes non-commercial developer use from commercial licensing.

## D-010 — Repository visibility
**Status:** Observed constraint  
**Decision:** Treat the current public GitHub repository as hostile-to-secrets. No production credential, private user data or service secret may ever be committed.  
**Reason:** Repository `serkandnc/KARE` is currently public.
