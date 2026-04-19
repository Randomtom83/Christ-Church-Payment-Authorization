---
file: sprint-6-plan.md
project: Christ Church in Bloomfield & Glen Ridge — ChurchOps
sprint: 6 (Sunday Dashboard)
date: 2026-04-18
---

# Sprint 6 Plan — Sunday Dashboard

## Scope

Replace the dashboard placeholder with a role-aware command center. Real-time updates via Supabase Realtime. Time-aware greeting. Fast server-side initial load with client-side live updates. Responsive layout (phone → tablet → desktop).

---

## File Inventory

### New Files (10)

| # | File | Purpose |
|---|------|---------|
| 1 | `src/lib/db/dashboard.ts` | Dashboard-specific query functions: `getPendingForSignerCount(signerId)`, `getPendingForSignerTotal(signerId)`, `getTreasurerCounts()`, `getTodaysDeposit()`, `getDepositCategoryBreakdown(depositId)`, `getRecentActivity(limit)`, `getWeeklySummary()`, `getUserActiveRequisitions(userId)`, `getSystemHealth()`. All server-only. |
| 2 | `src/components/dashboard/signer-cards.tsx` | Client component: Pending Approvals card (count, dollar total, "Review & Approve" button, green when clear). Today's Deposit card. Recent Activity feed. Real-time via `useRequisitionChanges`. |
| 3 | `src/components/dashboard/treasurer-cards.tsx` | Client component: Needs Review card, Pending Signatures card, Ready to Send card, Latest Deposit card, Weekly Summary card. Color-coded left borders. |
| 4 | `src/components/dashboard/counter-cards.tsx` | Client component: Today's Deposit card with context-aware content (Start Counting / Continue / Awaiting Verification / Complete). Single prominent action. |
| 5 | `src/components/dashboard/submitter-cards.tsx` | Client component: My Active Requisitions card (count, most recent with status), Quick Submit button (templates or new). |
| 6 | `src/components/dashboard/admin-cards.tsx` | Client component: System Health card (user count, accounts, vendors, last deposit, email config status). |
| 7 | `src/components/dashboard/dashboard-card.tsx` | Shared card wrapper component. White background, subtle shadow, 20px padding, colored left border (blue/green/amber), icon + heading, large number, action button slot. Consistent across all role cards. |
| 8 | `src/components/dashboard/greeting.tsx` | Server component: "Good morning, Tom" based on Eastern time. Today's date. Sunday indicator. |
| 9 | `src/components/dashboard/activity-feed.tsx` | Client component: compact list of recent audit log entries. Icon + description + relative time. Max 10 items. |
| 10 | `src/components/dashboard/dashboard-shell.tsx` | Client component: wrapper that manages real-time subscriptions and passes updated data to child cards. Handles reconnection indicator. |

### Modified Files (3)

| # | File | Changes |
|---|------|---------|
| 1 | `src/app/(app)/dashboard/page.tsx` | Replace placeholder. Server component that fetches all dashboard data based on user roles, renders Greeting + role-appropriate cards. Passes initial data to client components for real-time enhancement. |
| 2 | `src/hooks/use-realtime.ts` | Extend with `useDepositChanges()` for live deposit updates. Add `useMultiTableChanges(tables)` for subscribing to multiple tables at once. |
| 3 | `src/lib/db/deposits.ts` | Add `getTodaysDeposits()` (all deposits for today, not just in-progress). Add `getMostRecentVerified()`. |

---

## Architecture Decisions

### 1. Server-Side First, Client-Side Live

Initial dashboard render is entirely server-side (fast first paint, SEO-friendly):
- Server component fetches all counts, totals, and activity
- Passes data as props to client components
- Client components mount with data already visible (no loading flash)
- After mount, client components subscribe to Supabase Realtime
- On change events, client re-fetches specific data and updates

### 2. Real-Time Strategy

Rather than subscribing to every table individually, use a single `dashboard-shell` component:
- Subscribes to changes on `requisitions`, `deposits`, `approvals`
- Maintains a `refreshKey` counter that increments on any change
- Passes `refreshKey` to cards that need to refetch
- Cards use the `refreshKey` as a dependency in their data-fetch effects
- This avoids N separate subscriptions and N separate re-renders

### 3. Card Priority Order by Role

| Role | Card order (top to bottom) |
|------|---------------------------|
| Signer | Pending Approvals → Today's Deposit → Recent Activity |
| Treasurer | Needs Review → Ready to Send → Pending Signatures → Latest Deposit → Weekly Summary |
| Counter | Today's Deposit (with action button) |
| Submitter | My Active Requisitions → Quick Submit |
| Admin | System Health → (then all other role cards) |

Multi-role users get cards from all their roles, sorted by action priority.

### 4. Responsive Grid

```
Mobile (< 768px):   1 column, cards stack vertically
Tablet (768-1023px): 2 columns, cards flow into grid
Desktop (1024px+):   2 columns standard, 3 columns for admin
```

Using Tailwind: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`
Some cards span full width (Recent Activity) via `md:col-span-2`.

### 5. Pull-to-Refresh Alternative

True pull-to-refresh requires a service worker or complex touch handling. Instead:
- Show "Last updated: X minutes ago" at the bottom of the dashboard
- Tap to refresh → re-fetches all data
- Real-time updates mean the data stays current anyway

---

## Implementation Order

| Step | What | Files |
|------|------|-------|
| 1 | Dashboard DB queries | `db/dashboard.ts` |
| 2 | Extend deposits + realtime | `db/deposits.ts`, `hooks/use-realtime.ts` |
| 3 | Dashboard card wrapper | `dashboard/dashboard-card.tsx` |
| 4 | Greeting component | `dashboard/greeting.tsx` |
| 5 | Activity feed | `dashboard/activity-feed.tsx` |
| 6 | Signer cards | `dashboard/signer-cards.tsx` |
| 7 | Treasurer cards | `dashboard/treasurer-cards.tsx` |
| 8 | Counter cards | `dashboard/counter-cards.tsx` |
| 9 | Submitter cards | `dashboard/submitter-cards.tsx` |
| 10 | Admin cards | `dashboard/admin-cards.tsx` |
| 11 | Dashboard shell (realtime) | `dashboard/dashboard-shell.tsx` |
| 12 | Dashboard page | `dashboard/page.tsx` |
| 13 | Build verification + deploy | `npx tsc && npx next build && git push` |

---

## Acceptance Criteria

- [ ] Signer sees pending approvals count + dollar total, updating in real time
- [ ] Signer sees today's deposit card (if deposit exists)
- [ ] Treasurer sees queue counts (needs review, pending signatures, ready to send)
- [ ] Treasurer sees weekly summary (requisitions processed, amount paid, deposits)
- [ ] Counter sees appropriate action button (Start / Continue / Awaiting / Complete)
- [ ] Submitter sees active requisitions count and most recent status
- [ ] Admin sees system health metrics
- [ ] Multi-role users see cards from all their roles
- [ ] Greeting reflects time of day and user's name
- [ ] Sunday indicator shown on Sundays
- [ ] Recent activity feed shows last 10 events with relative timestamps
- [ ] Real-time: approving a requisition updates signer dashboard without refresh
- [ ] Real-time: counter entering items updates deposit card without refresh
- [ ] Responsive: single column mobile, 2-column tablet, 3-column admin desktop
- [ ] Dashboard loads meaningful content within 1 second (server-side render)
- [ ] Empty states show friendly messages, not errors
- [ ] All touch targets >= 48px, action buttons 56px
- [ ] All body text >= 18px, counts 32px, amounts 28px
- [ ] TypeScript compiles, Next.js builds

---

## What This Sprint Does NOT Include

- Push notifications — Sprint 8
- Pull-to-refresh gesture — using tap-to-refresh + real-time instead
- Historical charts/graphs — Sprint 7 reporting
- Customizable card order — fixed per role
- Dashboard widgets for deposits breakdown in real-time (Sprint 5 counter module handles the live entry)

---

## Dependencies

- **Sprints 1-5 complete** (confirmed)
- **Supabase Realtime enabled** on requisitions, deposits, approvals tables
