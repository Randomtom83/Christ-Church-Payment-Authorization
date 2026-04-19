# CLAUDE.md — ChurchOps Payment Authorization Platform

## Project Overview

A mobile-first progressive web app for Christ Episcopal Church Bloomfield/Glen Ridge. Two core workflows:

1. **Payment Requisitions**: Submit → Prepare (Treasurer) → Approve (Signers) → Pay → Record
2. **Sunday Counter Entry**: Count → Enter digitally → Verify (2nd counter) → Submit → Record

Serves two entities (Christ Church + Nursery School of Christ Church) that are the same legal organization with separate bank accounts and separate QuickBooks files. One shared approval workflow, one shared signer pool.

**Important: ACS Realm is the system of record for contributions and pledge tracking — NOT QuickBooks.** QuickBooks Online handles accounting (expenses, bills, financial statements). ACS handles member giving (who gave what, envelope tracking, giving statements). The counter module replaces the paper process that feeds ACS — it does not replace ACS itself. Bonnie enters counter data into ACS manually. The counter module produces clean, organized digital records to make that entry faster.

## Tech Stack

- **Framework**: Next.js 16 (App Router) with TypeScript (strict mode)
- **Styling**: Tailwind CSS 4 with custom design tokens
- **Components**: shadcn/ui (Radix UI primitives) — already copied into `/src/components/ui/`
- **Database**: Supabase (PostgreSQL with Row-Level Security)
- **Auth**: Supabase Auth (Google OAuth + Phone/SMS OTP via Twilio)
- **Storage**: Supabase Storage (receipt photos, check images)
- **Real-time**: Supabase Realtime (live dashboard updates)
- **Hosting**: Vercel
- **Email**: Resend (transactional notifications)

## Repository

- **GitHub**: https://github.com/Randomtom83/Christ-Church-Payment-Authorization.git
- **Branch strategy**: `main` is production. Feature branches for each sprint: `sprint-1/auth`, `sprint-2/requisitions`, etc. PR into main when sprint is tested.

## Architecture Rules

### Data Flow
- All data mutations use Server Actions (`'use server'`), never client-side API calls for writes
- All reads from server components where possible; client components only for interactivity
- Supabase Row-Level Security enforces authorization — never trust the client
- Every state change writes to the `audit_log` table. No exceptions.

### Financial Data
- All monetary amounts are `DECIMAL(10,2)` in PostgreSQL
- Never use JavaScript floating point for money. Use integer cents for calculations, format for display only.
- When displaying money, always use `Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })`
- Approval threshold is $500. Under $500 = 1 signer. $500 and above = 2 different signers. This is not configurable — it's canonical policy.

### Authentication
- Google OAuth for staff and vestry (church Google Workspace accounts)
- Phone SMS OTP for volunteers without Google accounts
- Sessions managed by Supabase Auth — do not build custom session handling
- Roles stored in `profiles.role` as a text array: `submitter`, `treasurer`, `signer`, `counter`, `admin`
- Role checks happen server-side. Client-side role checks are for UI display only, never security.

### Timestamps
- All timestamps stored as `TIMESTAMPTZ` in UTC
- Display in `America/New_York` timezone
- Use `date-fns` or `date-fns-tz` for formatting, not `moment`

### QuickBooks Integration
QuickBooks Online is confirmed. Both the church and nursery school have separate QBO companies (separate subscriptions). Sprint 7 will implement direct API integration via Intuit OAuth 2.0 + QBO API v3 for the expense/payment side. Contribution data stays in ACS — QBO integration is for requisitions and deposit totals only, not individual member giving.

## File Structure

```
src/
  app/                      # Next.js App Router
    (auth)/                 # Auth pages (login, phone verify)
      login/page.tsx
      verify/page.tsx
    (app)/                  # Authenticated app shell (layout with nav)
      dashboard/page.tsx    # Role-based dashboard
      requisitions/
        new/page.tsx        # Submit requisition form
        [id]/page.tsx       # Requisition detail / approval view
        page.tsx            # List view (filtered by role)
        templates/page.tsx  # Manage saved templates
      deposits/
        new/page.tsx        # Counter entry session
        [id]/page.tsx       # Deposit detail / verification
        page.tsx            # Deposit history
      admin/
        users/page.tsx      # User management
        accounts/page.tsx   # Chart of accounts management
      reports/page.tsx      # Export and reporting
    api/                    # API routes (webhooks only)
    layout.tsx              # Root layout
    globals.css             # Tailwind imports + CSS custom properties
  components/
    ui/                     # shadcn/ui components (do not edit directly)
    requisitions/           # Requisition-specific components
    deposits/               # Deposit-specific components
    dashboard/              # Dashboard widgets
    layout/                 # Nav, shell, headers, bottom bar
    shared/                 # Reusable: file upload, camera, search, etc.
  lib/
    supabase/
      client.ts             # Browser Supabase client
      server.ts             # Server Supabase client (with service role)
      middleware.ts          # Auth session refresh helper
    db/                     # Database query functions, one file per table
      requisitions.ts
      approvals.ts
      deposits.ts
      deposit-items.ts
      profiles.ts
      accounts.ts
      vendors.ts
      templates.ts
      members.ts
      audit.ts
    validators/             # Zod schemas (shared client + server)
      requisition.ts
      deposit.ts
      profile.ts
    actions/                # Server Actions
      requisitions.ts
      approvals.ts
      deposits.ts
      auth.ts
    utils/
      currency.ts           # Money formatting, never use floats
      dates.ts               # Timezone-aware date formatting
      notifications.ts      # Email + push notification helpers
    types/                  # Generated Supabase types + custom types
      database.ts           # Generated: `supabase gen types typescript`
      index.ts              # App-specific type extensions
  proxy.ts                    # Auth proxy (gates protected routes)
  hooks/                    # Custom React hooks
    use-realtime.ts         # Supabase realtime subscription hook
    use-auth.ts             # Current user + role hook
    use-camera.ts           # Camera capture hook
```

## Accessibility Requirements — NON-NEGOTIABLE

Most users are over 45, many over 60. This is not optional guidance.

### Typography
- Body text: `text-lg` (18px) minimum. Never smaller for readable content.
- Button labels: `text-lg font-semibold` (18px semibold)
- Form labels: `text-base font-medium` (16px medium)
- Headings: `text-xl` to `text-2xl` (24-28px) bold
- Timestamps/captions: `text-sm` (14px) — only for non-critical metadata
- Line height: `leading-relaxed` (1.625) for body, `leading-snug` (1.375) for headings
- Font: Inter variable, with system font fallback stack

### Touch Targets
- All interactive elements: minimum `h-12 w-12` (48×48px)
- Primary action buttons: `h-14` (56px) minimum, full width on mobile
- Form inputs: `h-12` (48px) minimum height
- Spacing between touch targets: minimum `gap-2` (8px)

### Color Contrast
- Body text on white: use `text-gray-900` (#1C1C1C) — ratio 16.4:1
- Secondary text: use `text-gray-700` (#4A4A4A) — ratio 9.7:1
- Primary buttons: `bg-primary-700 text-white` (#1B4F72 on white text)
- Never use color alone to indicate status. Always pair with icon + text.
- Status pattern: icon + colored badge + text label (e.g., ✓ green badge + "Approved")

### Forms
- Every input has a visible `<label>` element. Never use placeholder as the only label.
- Error messages use `aria-describedby` to associate with their input
- Required fields marked with "(required)" text, not just an asterisk
- Form submissions show loading state on the button (spinner + "Submitting...")
- Success feedback: green banner + specific message ("Requisition #47 submitted")
- Error feedback: red banner at top + inline errors on specific fields

### Navigation
- Bottom tab bar for primary navigation on mobile (thumb-friendly)
- Visible focus rings on all interactive elements: `focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2`
- Logical tab order matching visual order
- Skip-to-content link on every page

## Component Patterns

### Buttons
```tsx
// Primary action — large, full width on mobile
<Button size="lg" className="w-full h-14 text-lg font-semibold">
  Submit Requisition
</Button>

// Approve action
<Button size="lg" className="w-full h-14 text-lg font-semibold bg-success-700 hover:bg-success-800">
  <CheckIcon className="mr-2 h-5 w-5" />
  Approve
</Button>

// Reject action
<Button size="lg" variant="destructive" className="w-full h-14 text-lg font-semibold">
  <XIcon className="mr-2 h-5 w-5" />
  Reject
</Button>

// Never use a small button for a primary action.
// Never use icon-only buttons without aria-label.
```

### Form Inputs
```tsx
// Always this pattern — label above, full width, tall input
<div className="space-y-2">
  <Label htmlFor="amount" className="text-base font-medium">
    Amount (required)
  </Label>
  <Input
    id="amount"
    type="number"
    step="0.01"
    min="0"
    className="h-12 text-lg"
    aria-describedby={errors.amount ? "amount-error" : undefined}
  />
  {errors.amount && (
    <p id="amount-error" className="text-sm text-danger-700" role="alert">
      {errors.amount.message}
    </p>
  )}
</div>
```

### Status Badges
```tsx
// Always icon + color + text — never color alone
<Badge variant="success"><CheckIcon className="mr-1 h-4 w-4" /> Approved</Badge>
<Badge variant="warning"><ClockIcon className="mr-1 h-4 w-4" /> Pending</Badge>
<Badge variant="destructive"><XIcon className="mr-1 h-4 w-4" /> Rejected</Badge>
```

## Validation

- Use Zod for all form validation
- Schemas defined once in `/src/lib/validators/` and shared between client and server
- Client-side: validate on blur and on submit
- Server-side: always re-validate in Server Actions — client validation is UX, server validation is security

```tsx
// Example: /src/lib/validators/requisition.ts
import { z } from 'zod';

export const requisitionSchema = z.object({
  entity: z.enum(['church', 'nscc']),
  payee_name: z.string().min(1, 'Payee name is required'),
  amount: z.number().positive('Amount must be greater than zero'),
  account_id: z.string().uuid('Select an account'),
  payment_method: z.enum(['check', 'online']),
  description: z.string().min(1, 'Description is required'),
});
```

## Testing

- Playwright for E2E tests on critical flows
- Test files live next to what they test: `requisitions.test.ts` alongside the page
- Test at iPhone SE viewport (375px width) as minimum
- Every sprint's acceptance criteria should have a corresponding test
- Run `npx playwright test` before merging any PR

## Common Mistakes to Avoid

These are things Claude Code tends to get wrong on this project. If you catch yourself doing any of these, stop and fix.

1. **Using `float` or `number` for money.** Always DECIMAL in the database, integer cents in JavaScript.
2. **Putting auth checks only on the client.** RLS and server-side checks are the real security layer.
3. **Making buttons smaller than 48px.** Check every interactive element.
4. **Using placeholder text instead of labels.** Every input needs a visible label above it.
5. **Hardcoding the $500 threshold.** Use a constant: `const DUAL_APPROVAL_THRESHOLD = 500;` in a config file.
6. **Forgetting audit log entries.** Every create, update, delete, approve, reject must log.
7. **Skipping the loading/error states.** Every async action needs a loading spinner and error handling.
8. **Using `any` type.** This is a TypeScript strict project. Type everything.
9. **Creating API routes for data mutations.** Use Server Actions instead.
10. **Putting Supabase service_role key in client code.** Service role key is server-only, always.
11. **Treating the counter module as a replacement for ACS.** The counter module produces a digital record that Bonnie enters into ACS. It does not write to ACS directly. The member search dropdown uses a local copy of the ACS member list, not a live connection.
12. **Building against the old account numbering.** The church chart of accounts is being renumbered from a 300-series (301, 310, 315) to a 4000-series (4005, 4010, 4020). Both numbering systems currently exist. The `accounts` table should store both `code` (new) and `legacy_code` (old) so the system works during the transition. Seed data should include both when available.

## Entity Context

The app manages two entities. They are NOT separate organizations — same church, same signers, same approval process. Just different bank accounts and different QuickBooks files.

| Entity | Code | Bank Account | QB File | Contribution System | Fiscal Year |
|--------|------|-------------|---------|---------------------|-------------|
| Christ Episcopal Church | `church` | Blue Foundry - AL102 | QBO (separate company) | ACS Realm | Jan-Dec |
| Nursery School of Christ Church | `nscc` | Blue Foundry - AL104 | QBO (separate company) | N/A | Jul-Jun |

When a user submits a requisition, they select the entity. This determines which chart of accounts dropdown to show and which bank account the payment comes from. The approval process is identical for both.

## People Reference

**Authorized Signers (bank signature card):**
Tom Reynolds (Warden), Michelle Ryndak (Warden), Bill Seeman (Vestry), Denise Massay-Williams (Vestry), Leo Toledo (Vestry)

**Treasurer (prepares, does NOT sign):** Bonnie VanOrnum

**Rector (on signature card, self-excludes):** The Rev. Diana Wilcox

**Staff who submit frequently:** Ryan Bridge (Music — recurring musician payments), Aazhae Coleman (Nursery School — recurring supplies/food)

## Sprint Reference

See `/docs/workplan.md` for the full sprint plan. See `/docs/technical_specification.md` for database schema, integration details, and design tokens.

When starting a new sprint:
1. Read the relevant sprint section in the workplan
2. Create a plan file: `/docs/sprint-[N]-plan.md`
3. Implement one component at a time
4. Run linter + type check after each file
5. Write tests for acceptance criteria
6. Review for accessibility violations before marking complete

@AGENTS.md
