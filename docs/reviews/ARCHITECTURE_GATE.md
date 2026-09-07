# Architecture Gate Review

- **Date:** 2026-09-07
- **Lifecycle gate:** Stage 05 — Architecture
- **Preferred reviewer:** `gpt-6-astra`
- **Actual reviewer:** `gpt-5.6-sol`
- **Status:** `FALLBACK — PASS`
- **Reason for fallback:** The active runtime is GPT-5.6 Sol; no Astra execution surface is available in this session. No claim is made that Astra reviewed the architecture.

## Review scope

Reviewed `README.md`, `docs/PRODUCT_SPEC.md`, `docs/USER_FLOWS.md` and `docs/ARCHITECTURE.md` for:
- product-scope consistency;
- mobile framework/version assumptions;
- auth/session design;
- authorization boundary;
- secret handling;
- TMDB integration and licensing/rate implications;
- recommendation explainability;
- offline behavior;
- testability/CI;
- deployment boundaries;
- P0/P1 architecture risks.

## Findings

### P0
None found.

### P1
None found.

### P2 — implementation must preserve secure session adapter semantics
The architecture deliberately uses the current Supabase-documented encrypted React Native session-storage pattern rather than generic plaintext app state. The implementation must not simplify this into putting privileged session material in an ordinary persisted query/global-state store. Native storage errors must be handled and sign-out must clear session material.

**Disposition:** Already represented as an architecture invariant. Verify in Foundation/Auth tasks.

### P2 — service-role scope needs explicit database/function tests
TMDB cache/content upserts and account deletion may need privileged server access. A future Edge Function must not use the service role as a shortcut for ordinary user-owned CRUD.

**Disposition:** Architecture requires user-scoped clients/RLS by default and narrow privileged operations. DATABASE.md must enumerate grants/policies and allow/deny tests.

### P2 — selective offline persistence must remain selective
Persistent Query cache is useful for offline library browsing, but private free-text review content and auth/session material are explicitly excluded. A blanket “persist all queries” implementation would create unnecessary privacy risk.

**Disposition:** Add a testable persisted-query allowlist in implementation plan.

### P2 — newly current Expo SDK should be scaffolded, not hand-composed
Expo SDK 57 is current per primary docs on the review date. Foundation should use `create-expo-app@latest`, then verify the generated SDK/RN/Router matrix and commit the lockfile rather than manually combining package versions from memory.

**Disposition:** Add to Phase 0 acceptance criteria.

### P2 — commercial TMDB use is not a technical auto-approval
TMDB’s current FAQ distinguishes non-commercial developer use and commercial licensing. Repository work can continue, but monetization/public commercial operation must not assume developer-key rights.

**Disposition:** Record as external business/release blocker, not an MVP coding blocker.

## Gate decision

`FALLBACK — PASS`

Rationale:
- all MVP user flows have a clear implementation boundary;
- authorization is enforced in Postgres/RLS rather than client filtering;
- privileged secrets stay server-side;
- recommendation logic is deterministic, evidence-backed and testable;
- offline behavior avoids an unplanned sync engine;
- no unresolved P0/P1 finding remains.

Proceed to Stage 06 — `docs/DATABASE.md`.
