# Database test plan

`docs/DATABASE.md` defines 34 required authorization/data-integrity cases. The migrations in this branch deliberately pair grants + RLS with table creation.

The actual pgTAP suites are added next, before the database foundation is allowed to pass its gate. They require a functioning local Supabase CLI/Postgres runtime so user/JWT fixtures can be validated against the current local Auth schema rather than guessed.

Expected commands:

```bash
npm run db:reset
npm run db:test
npm run db:types
```

Do not mark the database gate as runtime-verified until those commands have executed successfully.
