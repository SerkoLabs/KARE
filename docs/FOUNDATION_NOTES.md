# Foundation implementation notes

## Source verification — 2026-09-07

The Phase 0 scaffold was aligned to current first-party sources before code was written:

- Expo SDK 57 is the current stable SDK family selected for KARE.
- The current official SDK 57 default template uses Expo `~57.0.20`, React Native `0.86.3`, React `19.2.3`, TypeScript `~6.0.3`, Expo Router and a `src/app` layout.
- Expo recommends `create-expo-app` with `--template default@sdk-57` during the SDK 57 transition.
- Expo unit-testing guidance uses `jest-expo`, Jest and React Native Testing Library.
- TanStack Query v5 documents React Native support.
- KARE uses only client-readable Supabase project URL/publishable-key placeholders in `.env.example`; service-role and TMDB credentials remain server-only.

## Runtime limitation in this execution environment

Node and npm are available, but npm registry DNS failed with `EAI_AGAIN registry.npmjs.org`. Therefore:

- the repository could not actually run `create-expo-app` here;
- `npm install` / `npm ci` could not produce a trustworthy `package-lock.json`;
- dependency-backed lint/typecheck/Jest/Expo export cannot honestly be reported as passed in this run.

The scaffold is based on the official SDK 57 template package matrix and repository-safe Phase 0 work continues. The missing package-lock and package-backed verification remain a Phase 0 blocker that must be resolved before the foundation gate can pass.

## Security posture

- No real credential is committed.
- `.env` and `.env.*` are ignored while `.env.example` remains versioned.
- Public environment parsing fails intentionally and visibly.
- Logging accepts only allowlisted operational metadata and drops common sensitive fields.
- Query persistence is opt-in by query family; blanket persistence is impossible by default.
- Owner-private cache clear hooks exist before authentication is wired.
