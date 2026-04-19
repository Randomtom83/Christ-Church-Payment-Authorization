# ChurchOps — Payment Authorization & Counter Entry

Mobile-first progressive web app for Christ Episcopal Church Bloomfield/Glen Ridge.

Two workflows:

1. **Payment Requisitions** — submit → prepare (Treasurer) → approve (Signers) → pay → record.
2. **Sunday Counter Entry** — count → enter digitally → verify (2nd counter) → submit → record.

See [`CLAUDE.md`](./CLAUDE.md) for the full project brain and [`docs/`](./docs)
for the technical specification, workplan, and discovery findings.

## Tech stack

- **Next.js 16** (App Router) · TypeScript strict mode
- **Tailwind CSS v4** with custom design tokens (Episcopal Blue palette)
- **shadcn/ui** components (Radix primitives) — under `src/components/ui/`
- **Supabase** — Postgres + Auth + Storage + Realtime, with Row-Level Security
- **Vercel** hosting · **Resend** email · **Twilio Verify** SMS

## Local development

```bash
npm install
npm run dev          # http://localhost:3000
npm run lint
npm run typecheck
npm run build
```

Required env vars live in `.env.local` (gitignored). See the file for the
expected keys.

## Database

The initial schema lives at
[`supabase/migrations/001_initial_schema.sql`](./supabase/migrations/001_initial_schema.sql).
Apply it either by:

- Running `npx supabase db push` against your linked project, or
- Pasting the SQL into the Supabase SQL editor.

All tables have Row-Level Security enabled — see `current_user_has_role()` and
the per-table policies in the migration.

## Project layout

```
src/
  app/
    (app)/        Authenticated app shell — dashboard, requisitions, deposits, admin, reports
    (auth)/       Login, phone verify
  components/
    ui/           shadcn/ui primitives
    layout/       App header, bottom nav, page placeholder
  lib/
    supabase/     Browser + server clients, proxy auth helper
    constants.ts  DUAL_APPROVAL_THRESHOLD, ENTITIES, ROLES, statuses
  proxy.ts        Next.js Proxy (formerly middleware) — auth gating
supabase/
  migrations/     SQL migrations
docs/
  CLAUDE.md, technical_specification.md, workplan.md, sprint-N-plan.md, sprint-N-complete.md
```

## Contributing

Sprint-by-sprint workflow, plan-then-execute pattern. See `docs/workplan.md`.
