# Supabase client boundary

Generated database types will live at `database.types.ts` after the local schema can be reset successfully:

```bash
npm run db:types
```

Do not hand-maintain generated database types and do not place `service_role`, TMDB tokens or other privileged credentials in this directory.
