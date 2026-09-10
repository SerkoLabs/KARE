# KARE — Vertical Slice Gate

**Date:** 2026-09-10  
**Result:** PARTIAL

## Repository-proven local-first slice

1. App launches into the cinematic Discover shell.
2. The user answers mood, duration and attention questions.
3. The client requests candidates only through `EXPO_PUBLIC_KARE_API_URL/tmdb-discover`.
4. Deterministic scoring selects a result and renders evidence-backed `Neden bunu seçtik?` text.
5. Movie Detail supports Watchlist, Watched and Favorite state.
6. AsyncStorage persists validated library state, recommendation history and latest recommendation.
7. Storage failures are visible rather than silently represented as saved.

## Automated evidence

GitHub Actions passed locked install, lint, TypeScript, Jest and Expo export. Tests cover deterministic ordering, unseen-before-seen behavior, TMDB mapping/retry/failure classes, reducer invariants and serialized reopen restoration.

## Not proven

- A deployed Edge Function backed by a real `TMDB_READ_TOKEN`.
- A real mobile process kill/reopen on simulator or physical hardware.
- Authenticated Supabase/RLS persistence from the original VS-1 plan.

These gaps are external acceptance evidence. This document does not claim the original cloud VS-1 has passed.
