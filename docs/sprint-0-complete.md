---
file: sprint-0-complete.md
project: Christ Church in Bloomfield & Glen Ridge — ChurchOps
sprint: 0 (Project Setup)
date: 2026-04-16
---

# Sprint 0 — Scaffold complete

This sprint set up the project skeleton. No feature logic was built. Every
route renders a "Coming in Sprint N" placeholder.

## What was set up

### Framework + tooling
- **Next.js 16.2.4** (Turbopack) with App Router, TypeScript strict mode, `src/` layout, `@/*` alias.
- **Tailwind CSS v4** via `@tailwindcss/postcss`, configured CSS-first in `src/app/globals.css`.
- **ESLint 9** with `eslint-config-next`. `npm run lint` passes clean.
- **TypeScript** with `strict: true`, `noEmit` typecheck via `npm run typecheck`. Passes clean.
- Production build (`npm run build`) succeeds — 16 routes, proxy registered.

### Component library
- **shadcn/ui** initialized with the Radix preset (`radix-nova` style).
  Installed components: `button`, `input`, `label`, `card`, `badge` —
  enough for Sprint 1 to start without re-running `shadcn add`.
- `cn()` helper at `src/lib/utils.ts`.

### Dependencies installed
- Runtime: `next`, `react`, `react-dom`, `zod`, `date-fns`, `date-fns-tz`,
  `lucide-react`, `@supabase/supabase-js`, `@supabase/ssr`,
  `clsx`, `class-variance-authority`, `tailwind-merge` (the last three pulled in
  by shadcn for variant composition).
- Dev: `typescript`, `eslint`, `tailwindcss`, `@tailwindcss/postcss`, `@types/*`.

Nothing outside the kickoff prompt's allow-list was added.

### Design tokens (per `docs/technical_specification.md` §2)
- Episcopal Blue palette: `--color-primary-50 / 100 / 500 / 600 / 700`.
- Warm gray neutrals: `--color-gray-50 / 200 / 500 / 700 / 900`.
- Status colors: `success`, `warning`, `danger` (each with a 100/700 pair).
- Typography scale resized: `text-base = 18px`, full scale 14 → 32 px with
  appropriate line heights. Body floor is 18px (root `font-size: 18px`).
- Inter loaded via `next/font/google` and exposed as `--font-inter`.
- Visible `:focus-visible` ring on every interactive element.
- `prefers-reduced-motion` honored.

### Supabase
- `src/lib/supabase/client.ts` — browser client (`createBrowserClient`).
- `src/lib/supabase/server.ts` — request-scoped `createClient()` and
  `createAdminClient()` (service role, server-only via `import "server-only"`).
- `src/lib/supabase/middleware.ts` — `updateSession()` helper that refreshes
  the session cookie and gates protected routes.
- `src/proxy.ts` — Next.js Proxy entry point that delegates to the helper.
  See **Decision #1** below for why this is `proxy.ts`, not `middleware.ts`.

### Database
- `supabase/migrations/001_initial_schema.sql` — all 11 tables from the spec:
  `profiles`, `accounts`, `vendors`, `requisition_templates`, `requisitions`,
  `approvals`, `attachments`, `deposits`, `deposit_items`, `audit_log`,
  `members`.
- Constraints: amount > 0; status enums; entity ∈ {church, nscc};
  `requisitions.requires_dual_approval` is a generated column tied to the
  $500 threshold (canonical per CLAUDE.md).
- Triggers: `updated_at` auto-stamping on profiles/vendors/requisitions/deposits.
- `handle_new_user()` trigger auto-creates a `profiles` row when a user signs
  up via Supabase Auth.
- **RLS enabled on every table.** Per-role policies use a SECURITY DEFINER
  helper `current_user_has_role(text)` to avoid recursive lookups into
  `profiles`. Policy coverage matches the spec's §3 examples and extends
  them where the spec was sparse (writes for treasurer, attachment uploader
  scopes, audit insert/read).

### App shell + routes
- Root layout (`src/app/layout.tsx`) — Inter font, PWA viewport
  (theme color `#1B4F72`), skip-to-content link, manifest reference.
- `(app)` layout — sticky `AppHeader`, max-width content column,
  `BottomNav` (4 tabs: Dashboard / Requisitions / Deposits / More).
  All tabs are 64px tall; icons are 24px; labels are 14px.
- `(auth)` layout — single-column centered for login/verify.
- Routes (every one is a placeholder):
  - `/dashboard` (Sprint 6)
  - `/requisitions`, `/requisitions/new`, `/requisitions/[id]`,
    `/requisitions/templates` (Sprint 2/3)
  - `/deposits`, `/deposits/new`, `/deposits/[id]` (Sprint 5)
  - `/admin/users` (Sprint 1), `/admin/accounts` (Sprint 2)
  - `/reports` (Sprint 7)
  - `/more` — index of admin/report links visible to all
  - `/login`, `/verify` (Sprint 1)
- Root `/` redirects to `/dashboard`; the proxy intercepts before that and
  sends unauthenticated visitors to `/login` first.

### Constants + manifest
- `src/lib/constants.ts` — `DUAL_APPROVAL_THRESHOLD = 500`, `ENTITIES`,
  `ROLES`, `REQUISITION_STATUSES`, `DEPOSIT_STATUSES`, `APP_TIMEZONE`.
- `public/manifest.webmanifest` — name "ChurchOps", theme `#1B4F72`,
  start URL `/dashboard`, references icons at `/icons/icon-192.png` and
  `/icons/icon-512.png`. **PNG icons not yet committed** — see Issues.
- `.gitignore` already excludes `.env*`. Added IDE / Supabase CLI entries.

## Verification

| Check | Result |
|---|---|
| `npm run lint` | ✅ clean |
| `npm run typecheck` | ✅ clean |
| `npm run build` | ✅ 16 routes, proxy compiled, 1.5s |
| `npm run dev` smoke test | ✅ ready in 367ms, `/dashboard` → 307 → `/login?next=/dashboard` |
| Bottom nav at 375px viewport | ✅ four tabs render across full width, 64px tall |
| Body text size | ✅ root `font-size: 18px` (CLAUDE.md non-negotiable) |
| Touch targets | ✅ nav tabs 64px, header link 56px, buttons inherit shadcn `lg = 56px` |

## Decisions made during this sprint

1. **`src/proxy.ts` instead of `src/middleware.ts`.** Next.js 16 deprecated
   the `middleware.ts` convention and renamed it to `proxy.ts` (the file
   exports a function called `proxy`). Functionally identical for our
   purposes. CLAUDE.md still says "middleware.ts" — that section reflects
   the Next 15 convention the spec was written against. The auth helper is
   still located at `src/lib/supabase/middleware.ts` (matching CLAUDE.md's
   file-structure section), and `proxy.ts` is a thin wrapper over it.
   *Recommendation:* update CLAUDE.md to mention `proxy.ts` when convenient.

2. **`cookies()` is async in Next.js 16** — used `await cookies()` everywhere
   in `lib/supabase/server.ts`. The `setAll` callback is wrapped in
   try/catch so Server Components can call our supabase client without
   blowing up on the cookie-write attempt (the proxy handles refresh).

3. **shadcn theme colors stay neutral; the brand palette is layered on top.**
   shadcn writes `--primary` etc. as oklch grays. I overrode them in the
   `:root` block of `globals.css` to point at our Episcopal Blue
   (`--primary: #1B4F72`). The full named palette (`primary-50/100/...`)
   is also exposed via `@theme inline` so we can use Tailwind classes like
   `bg-primary-700` as the spec suggests.

4. **shadcn base preset = `radix-nova`** (the new default in shadcn 4.x).
   This is a small departure from the earlier "default" preset, but the
   ergonomics are identical and the Radix primitives are unchanged.

5. **Generated column for `requires_dual_approval`.** The spec listed it as
   a column; making it `generated always as (amount >= 500) stored` enforces
   the rule at the database level so app code can never drift from the
   $500 threshold.

6. **No QuickBooks integration scaffolding yet.** Sprint 7 work — the
   schema has `recorded_in_qb` and `qb_transaction_id` columns ready.

## Issues that need attention

1. **Supabase migration not yet applied.** Run `npx supabase db push` once
   you link the project, or paste the SQL into the dashboard SQL editor.
2. **`SUPABASE_SERVICE_ROLE_KEY` is not set in `.env.local`.** Required
   before any admin-scoped action runs. `createAdminClient()` throws a
   clear error if it's missing.
3. **`TWILIO_VERIFY_SERVICE_SID` and Google OAuth credentials missing.**
   Sprint 1 will block until these are filled in (per Phase 0.2 in the
   workplan).
4. **PWA icons not committed.** `manifest.webmanifest` references
   `/icons/icon-192.png` and `/icons/icon-512.png` but those files don't
   exist yet. Add 192 and 512 PNG exports of the church mark before the
   first install-to-home-screen test. Browsers will currently 404 on the
   icon fetch but the app still loads.
5. **No automated tests yet.** Playwright will be added in Sprint 1 alongside
   the auth flow per the testing convention in CLAUDE.md.
6. **CLAUDE.md still references `middleware.ts`.** Mentioned above — small
   doc update worth making once.

## File inventory (created or non-trivially modified this sprint)

```
CLAUDE.md                                          (restored — overwritten by create-next-app)
README.md                                          (replaced template with project README)
package.json                                       (renamed to "churchops", added typecheck script)
.gitignore                                         (added IDE / supabase CLI entries)
components.json                                    (shadcn config)
public/manifest.webmanifest

src/app/layout.tsx                                 (Inter font, PWA viewport, skip link)
src/app/globals.css                                (full design-token rewrite)
src/app/page.tsx                                   (root redirect to /dashboard)

src/app/(auth)/layout.tsx
src/app/(auth)/login/page.tsx
src/app/(auth)/verify/page.tsx

src/app/(app)/layout.tsx                           (header + bottom nav shell)
src/app/(app)/dashboard/page.tsx
src/app/(app)/requisitions/page.tsx
src/app/(app)/requisitions/new/page.tsx
src/app/(app)/requisitions/[id]/page.tsx
src/app/(app)/requisitions/templates/page.tsx
src/app/(app)/deposits/page.tsx
src/app/(app)/deposits/new/page.tsx
src/app/(app)/deposits/[id]/page.tsx
src/app/(app)/admin/users/page.tsx
src/app/(app)/admin/accounts/page.tsx
src/app/(app)/reports/page.tsx
src/app/(app)/more/page.tsx

src/components/ui/{button,input,label,card,badge}.tsx   (shadcn-generated)
src/components/layout/app-header.tsx
src/components/layout/bottom-nav.tsx
src/components/layout/page-placeholder.tsx

src/lib/utils.ts                                   (cn helper from shadcn)
src/lib/constants.ts                               (DUAL_APPROVAL_THRESHOLD etc.)
src/lib/supabase/client.ts
src/lib/supabase/server.ts
src/lib/supabase/middleware.ts

src/proxy.ts                                       (auth gating)

supabase/migrations/001_initial_schema.sql         (full schema + RLS + triggers)
```

## Ready for Sprint 1

The scaffold compiles, lints, type-checks, builds, and serves. The proxy
correctly gates protected routes. Sprint 1 (Authentication & App Shell) can
begin once the Supabase migration is applied and the OAuth/Twilio credentials
are filled in.
