# KARE — Material Decisions

This log records decisions that materially shape product scope, architecture, data ownership or release constraints.

## D-001 — Product position
**Status:** Accepted  
**Decision:** KARE is a personal cinema library + curation + decision engine, not a Turkish Letterboxd clone.

## D-002 — Social/community is post-MVP
**Status:** Accepted  
**Decision:** Reviews, lists, taste history and profile are private in MVP. Followers, public feed, taste matching, public UGC and messaging are deferred.

## D-003 — Mobile architecture
**Status:** Accepted  
**Decision:** Expo / React Native / TypeScript with Expo Router; Supabase for Auth/Postgres/Edge Functions; TanStack Query for server state.

## D-004 — TMDB boundary
**Status:** Accepted  
**Decision:** TMDB calls are made from trusted Edge Functions; `TMDB_READ_TOKEN` never ships in the mobile app. KARE stores normalized movie metadata keyed by stable TMDB ID.

## D-005 — Recommendation engine v1
**Status:** Accepted  
**Decision:** `Ne İzlesem?` uses deterministic, versioned ranking with evidence-backed templates and returns at most three movies. No LLM is required for MVP.

## D-006 — Offline posture
**Status:** Accepted  
**Decision:** MVP supports selective cached reads but no general offline write queue.

## D-007 — Supabase authorization
**Status:** Accepted  
**Decision:** Client-exposed owner data is protected by explicit grants + RLS. `service_role` is server-only.

## D-008 — Storage
**Status:** Accepted  
**Decision:** No Supabase Storage bucket in MVP.

## D-009 — TMDB commercial operation
**Status:** External release/business gate  
**Decision:** Monetized/commercial public operation must confirm appropriate TMDB licensing/permission and attribution before activation.

## D-010 — Repository visibility
**Status:** Observed constraint  
**Decision:** Treat the public repository as hostile-to-secrets. No production credential, private user data or service secret may be committed.

## D-011 — Local-first recommendation proof
**Status:** Accepted for Stages 10–11 only  
**Decision:** The first repository-verifiable product proof uses AsyncStorage for library, recommendation history and latest-result restoration while keeping TMDB behind a server URL. It does not replace the approved authenticated Supabase/RLS target architecture. Authenticated cloud synchronization remains deferred until a development Supabase project and device test context exist.  
**Reason:** It proves KARE's differentiating decision loop without fabricating external credentials or claiming unavailable cloud evidence.
