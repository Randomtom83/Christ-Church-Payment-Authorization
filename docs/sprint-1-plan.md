---
file: sprint-1-plan.md
project: Christ Church in Bloomfield & Glen Ridge — ChurchOps
sprint: 1 (Authentication & App Shell)
date: 2026-04-16
---

# Sprint 1 Plan — Authentication & App Shell

## Scope Change

Google OAuth is **deferred** — the Google Workspace admin is not available yet. Sprint 1 builds SMS OTP authentication only. The login page layout will leave space for a "Sign in with Google" button to be added later without restructuring.

---

## File Inventory

### New Files (14)

| # | File | Purpose |
|---|------|---------|
| 1 | `src/lib/validators/auth.ts` | Zod schemas for phone number and OTP code validation. Shared between client form and server actions. |
| 2 | `src/lib/actions/auth.ts` | Server Actions: `sendOtp(phone)` — calls `supabase.auth.signInWithOtp({ phone })`; `verifyOtp(phone, token)` — calls `supabase.auth.verifyOtp()`; `signOut()` — calls `supabase.auth.signOut()`. Each returns a typed `{ success, error }` result. |
| 3 | `src/lib/auth/index.ts` | Server-side helper: `getCurrentUser()` — reads the session from cookies, fetches the profile row from `profiles`, returns `{ user, profile }` or `null`. Used by server components and the app layout. |
| 4 | `src/lib/db/profiles.ts` | Database query functions for the `profiles` table: `getProfileById(id)`, `getProfileByUserId(id)`, `getAllProfiles()`, `updateProfile(id, data)`, `updateProfileRoles(id, roles)`. All use the server Supabase client. |
| 5 | `src/lib/db/audit.ts` | `writeAuditLog(entry)` — inserts into `audit_log`. Used by every mutation action. Takes `{ userId, action, entityType, entityId, details }`. |
| 6 | `src/hooks/use-auth.ts` | Client-side React hook: `useAuth()` — subscribes to `onAuthStateChange`, fetches the user's profile, returns `{ user, profile, roles, isLoading }`. Uses the browser Supabase client. |
| 7 | `src/app/(auth)/login/login-form.tsx` | Client component: the login form. Two-step flow — phone input → OTP input. Calls the server actions. Handles loading/error states. Renders the "Google coming soon" placeholder area with divider. |
| 8 | `src/app/(auth)/login/otp-input.tsx` | Client component: 6 individual digit `<input>` boxes (48px each) with auto-advance focus. Controlled component that calls back with the complete 6-digit string. |
| 9 | `src/components/shared/loading-spinner.tsx` | Reusable accessible loading spinner (animated SVG circle). Used inside buttons during async operations. |
| 10 | `src/app/(app)/admin/users/user-list.tsx` | Client component: renders the list of all users with name, phone, roles, and active status. Each row is tappable to open the edit view. |
| 11 | `src/app/(app)/admin/users/user-role-editor.tsx` | Client component: role editing form for a single user. Checkboxes for each role, active/inactive toggle. Calls a server action to save. |
| 12 | `src/lib/actions/admin.ts` | Server Actions for admin: `updateUserRoles(userId, roles)` and `toggleUserActive(userId, isActive)`. Both verify the caller has `admin` role, write to `profiles`, and create `audit_log` entries. |
| 13 | `src/lib/validators/profile.ts` | Zod schema for profile updates: `profileNameSchema` (for the welcome/name-entry step), `profileRolesSchema` (for admin role editing). |
| 14 | `src/app/(app)/admin/layout.tsx` | Server component layout for `/admin/*` routes. Checks that the current user has `admin` role; if not, redirects to `/dashboard`. This is the server-side role gate. |

### Modified Files (8)

| # | File | Changes |
|---|------|---------|
| 1 | `src/app/(auth)/login/page.tsx` | Replace placeholder content with the real `LoginForm` client component. Keep it as a server component that renders the client form. Pass the `next` search param through. |
| 2 | `src/app/(auth)/verify/page.tsx` | Repurpose as the "Welcome — what's your name?" profile completion page. Shown after first login when `profile.full_name` is the phone-derived default. Server component that checks the profile and renders a name input form. |
| 3 | `src/app/(app)/layout.tsx` | Add profile check: fetch current user via `getCurrentUser()`. If the profile exists but `full_name` looks auto-generated (derived from phone), redirect to `/verify` for name entry. Pass user/profile data to a context provider or pass as needed. |
| 4 | `src/app/(app)/admin/users/page.tsx` | Replace placeholder with real user management: fetch all profiles via `getAllProfiles()`, render the `UserList` component. |
| 5 | `src/app/(app)/more/page.tsx` | Add "Sign Out" button at the bottom. Update the links list to remove sprint labels from items that are now live (User management). |
| 6 | `src/components/layout/app-header.tsx` | Replace the "Beta" placeholder with the current user's name/initials (from profile). |
| 7 | `src/components/layout/bottom-nav.tsx` | Make role-aware: accept a `roles` prop (passed from the app layout) and filter nav items. Counters don't see Requisitions; submitter-only users don't see Deposits. Dashboard and More always visible. |
| 8 | `src/lib/supabase/middleware.ts` | Add role-based route protection for `/admin/*` paths at the proxy level (belt-and-suspenders with the admin layout). Fetch user profile to check for admin role; redirect non-admins to `/dashboard`. |

---

## Architecture Decisions

### 1. Auth Flow (SMS OTP)

```
User enters phone → "Send Code" button
  ↓
Server Action: supabase.auth.signInWithOtp({ phone })
  ↓ (Supabase → Twilio Verify → SMS delivered)
UI shows OTP input (6 digits in individual boxes)
  ↓
User enters code → "Verify" button
  ↓
Server Action: supabase.auth.verifyOtp({ phone, token, type: 'sms' })
  ↓ (Success: session cookie set by Supabase)
Redirect to `next` param OR /dashboard
  ↓ (handle_new_user trigger creates profiles row)
App layout checks if profile.full_name is auto-generated
  ↓ (If yes → redirect to /verify for name entry)
User enters name → saved to profiles → redirected to dashboard
```

### 2. Phone Number Handling

- Accept US phone numbers in common formats: `(201) 555-1234`, `201-555-1234`, `2015551234`
- Strip to digits, prepend `+1` before sending to Supabase
- Validate: must be exactly 10 digits after stripping
- Display the formatted number back to the user in the OTP step: "Code sent to (201) 555-1234"

### 3. Profile Completion Detection

The `handle_new_user` trigger (from migration 001) sets `full_name` to the email username or phone number when no name is provided. We detect "needs name" by checking if `full_name` starts with `+` (phone-derived) or looks like an auto-generated value. The app layout performs this check and redirects to `/verify` if needed.

### 4. Role-Based Navigation

The bottom nav filters items based on the user's roles:

| Tab | Visible to |
|-----|-----------|
| Dashboard | All roles |
| Requisitions | submitter, treasurer, signer, admin |
| Deposits | counter, treasurer, admin |
| More | All roles |

The `(app)` layout fetches the profile server-side and passes roles to the `BottomNav` component.

### 5. Admin Route Protection (Two Layers)

1. **Proxy layer** (`src/lib/supabase/middleware.ts`): For `/admin/*` routes, fetch the user's profile and check for `admin` role. Non-admins get redirected to `/dashboard`. This runs before the page renders.
2. **Layout layer** (`src/app/(app)/admin/layout.tsx`): Server component that redundantly checks admin role. Belt-and-suspenders — if the proxy check is bypassed somehow, the layout catches it.

**Decision: Skip proxy-level role check.** After further thought, adding profile DB queries to the proxy on every request is expensive and adds latency to every page load. The proxy already gates authentication. Role-based route protection will use only the layout layer — a server component in `src/app/(app)/admin/layout.tsx` that reads the profile and redirects. This is sufficient because:
- The proxy ensures the user is authenticated
- The layout runs server-side before any client code
- RLS policies provide a third layer of protection on the data itself

This means we do **NOT** modify `src/lib/supabase/middleware.ts`.

### 6. Sign Out

A "Sign Out" link in the More page. Calls a server action that runs `supabase.auth.signOut()`, then redirects to `/login`. No confirmation dialog needed — signing out is easily reversible.

### 7. First Admin Bootstrap

There is no admin UI to create the first admin. After the first user logs in via SMS:
1. Find their profile ID in Supabase dashboard (or via SQL)
2. Run: `UPDATE profiles SET role = '{"admin","submitter","signer"}' WHERE id = '<uuid>';`
3. They now have access to `/admin/users` to manage everyone else

This is documented in the sprint completion doc.

---

## Implementation Order

Each step is a discrete unit that can be linted/typechecked independently.

| Step | What | Files |
|------|------|-------|
| 1 | Validators + DB helpers | `validators/auth.ts`, `validators/profile.ts`, `db/profiles.ts`, `db/audit.ts` |
| 2 | Server auth helper | `lib/auth/index.ts` |
| 3 | Server Actions (auth) | `actions/auth.ts` |
| 4 | Loading spinner component | `components/shared/loading-spinner.tsx` |
| 5 | OTP input component | `(auth)/login/otp-input.tsx` |
| 6 | Login form + page | `(auth)/login/login-form.tsx`, `(auth)/login/page.tsx` |
| 7 | Profile completion page | `(auth)/verify/page.tsx` |
| 8 | Client auth hook | `hooks/use-auth.ts` |
| 9 | App layout updates | `(app)/layout.tsx` — profile check + role passing |
| 10 | Role-aware bottom nav | `components/layout/bottom-nav.tsx` |
| 11 | App header with user name | `components/layout/app-header.tsx` |
| 12 | Admin layout (role gate) | `(app)/admin/layout.tsx` |
| 13 | Admin server actions | `actions/admin.ts` |
| 14 | Admin user management UI | `(app)/admin/users/page.tsx`, `user-list.tsx`, `user-role-editor.tsx` |
| 15 | More page + sign out | `(app)/more/page.tsx` |
| 16 | Lint + typecheck + build verification | — |

---

## Acceptance Criteria

From the workplan and tech spec, adapted for SMS-only scope:

- [ ] SMS OTP sends and validates codes
- [ ] New user gets a profile row automatically (trigger from migration 001)
- [ ] First-time user is prompted for their name
- [ ] Users see role-appropriate navigation items
- [ ] Non-admin users cannot access `/admin/*` routes
- [ ] Admin can view all users and edit roles
- [ ] Role changes are recorded in `audit_log`
- [ ] Sign out clears session and redirects to login
- [ ] All touch targets meet 48px minimum
- [ ] All body text renders at 18px minimum
- [ ] All form inputs have visible labels
- [ ] Loading states shown on all async buttons
- [ ] Error messages are specific and helpful
- [ ] Login page layout accommodates future "Sign in with Google" button

---

## What This Sprint Does NOT Include

- Google OAuth (deferred — no Workspace admin access)
- PWA install prompt (manifest exists from Sprint 0; service worker is a Sprint 8 task)
- Push notifications (Sprint 4)
- Profile photo/avatar upload
- Password-based auth (not in scope for this project)

---

## Dependencies / Blockers

- **Supabase Phone Auth must be enabled** in the Supabase dashboard: Auth → Providers → Phone → Enable. Twilio credentials (Account SID, Auth Token, Verify Service SID) must be entered there.
- **Environment variables** in `.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` must all be set.
- **Migrations 001 + 002** must be applied to Supabase before testing.
