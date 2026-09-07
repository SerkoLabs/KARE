# Database / RLS Authorization Gate Review

- **Date:** 2026-09-07
- **Lifecycle gate:** Stage 06 — Database / Data Ownership
- **Preferred reviewer:** `gpt-6-astra`
- **Actual reviewer:** `gpt-5.6-sol`
- **Status:** `FALLBACK — PASS`
- **Reason for fallback:** The active runtime is GPT-5.6 Sol; no Astra execution surface is available in this session. No claim is made that Astra reviewed the database design.

## Review scope

Reviewed `README.md`, `docs/PRODUCT_SPEC.md`, `docs/USER_FLOWS.md`, `docs/ARCHITECTURE.md` and `docs/DATABASE.md` for:
- ownership and public/private classification;
- table relationships and constraint coverage;
- grants + RLS allow/deny behavior;
- cross-user UUID abuse paths;
- service-role scope;
- recommendation attribution integrity;
- account deletion/cascade behavior;
- private free-text handling;
- indexes used by ownership/RLS predicates;
- migration/testability.

## Findings

### P0
None found.

### P1
None found.

### P2 — watched prerequisite for private reviews must be a database invariant
`personal_reviews` correctly states that client UI alone is insufficient, but implementation must choose a concrete enforcement mechanism before the review feature ships.

**Required implementation decision:** use a `BEFORE INSERT OR UPDATE` trigger/function that rejects a review unless a matching `(user_id, movie_id)` row exists in `user_movie_state` with `watched_at IS NOT NULL`. The function must not bypass RLS/ownership and must be covered by allow/deny DB tests. If implementation later prefers a narrow RPC, it must provide equivalent server-side enforcement and tests.

**Gate impact:** not P1 because the design already requires DB/trusted enforcement and no migration/code exists yet. This becomes an acceptance criterion in the implementation plan.

### P2 — recommendation acceptance must be atomic and ownership-checked
The design correctly prevents clients from mutating immutable recommendation items. The acceptance path must avoid two independent privileged writes that can partially succeed.

**Required implementation decision:** create one narrow transactional database function used by the acceptance flow. It must:
1. obtain the caller identity from authenticated request context;
2. verify the recommendation item belongs to a run owned by that caller;
3. insert acceptance idempotently;
4. upsert watchlist state only when the movie is not already watched;
5. preserve the watched/watchlist mutual-exclusion constraint;
6. run with fixed `search_path`, minimum grants and explicit allow/deny tests.

If `SECURITY DEFINER` is required, grant `EXECUTE` only to `authenticated` and validate `auth.uid()` inside the function. `service_role` must not be accepted as a reason to omit caller ownership checks.

### P2 — parent-ownership RLS predicates require supporting indexes
`list_movies`, `recommendation_items` and `shelf_movies` use parent-table existence checks. Their parent PKs already support ID lookup, and ownership indexes/PKs are mostly adequate. Migration implementation must run query-plan review for the policy predicates and add only the missing indexes justified by actual queries.

### P2 — product telemetry context is privacy-constrained by code, not by arbitrary JSON semantics
`product_events.context` intentionally allows bounded JSONB. Database size/type checks cannot prove that a buggy client never sends private free text.

**Required implementation decision:** the mobile analytics API must expose typed named events with allowlisted context keys; no generic `track(name, arbitraryObject)` export is allowed outside the analytics module. DB RLS still limits insertion to self and denies client reads.

### P2 — inactive shared movies can degrade owner library rendering
Normal authenticated `movies` policy hides `is_active=false`. If a user-owned row still references such a movie, a library join may lack metadata.

**Disposition:** acceptable for MVP as a rare provider/legal suppression condition. UI must tolerate missing metadata. Do not weaken shared-content policy merely to guarantee poster rendering.

## Authorization-path review

The design can state and test the critical deny paths:
- anon has no product-table access;
- User A cannot read/write User B profile, state, review, taste, list, recommendation or acceptance data;
- knowing another user’s list/run/item UUID does not grant access because ownership is checked through parent rows;
- authenticated clients cannot write canonical `movies`, shelves or recommendation artifacts;
- recommendation acceptance re-validates item → run → caller ownership;
- account deletion cascades owner data but not shared movie/shelf data;
- `service_role` remains outside the client.

## Gate decision

`FALLBACK — PASS`

Rationale:
- ownership for every client-exposed table is defined;
- grants and RLS are explicit, not implicit;
- critical cross-user deny cases are enumerable and testable;
- privileged writes are isolated to narrow trusted boundaries;
- no unresolved P0/P1 authorization or data-loss defect remains;
- no migration has been run before design approval.

Proceed to Stage 07 — `docs/IMPLEMENTATION_PLAN.md`.
