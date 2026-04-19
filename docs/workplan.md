---
file: workplan.md
project: Christ Church in Bloomfield & Glen
chat: Church payment authorization and QuickBooks integration
date: 2026-0415
---

# ChurchOps Workplan
## Payment Authorization & Counter Entry Platform
### Christ Episcopal Church Bloomfield/Glen Ridge

---

## Project Summary

Build a mobile-first progressive web app that replaces the church's paper-based payment requisition and Sunday collection counting processes. The system serves two entities (Christ Church and Nursery School of Christ Church) through a single platform with shared approval workflows.

**Repository:** https://github.com/Randomtom83/Christ-Church-Payment-Authorization.git

**Core Deliverables:**
1. Digital payment requisition submission, routing, and approval
2. Digital Sunday collection counter entry with check imaging
3. Sunday dashboard for signers and leadership
4. Clean data export for QuickBooks (or direct API integration if QuickBooks Online)
5. Recurring expense templates for staff

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS 4, shadcn/ui, Supabase (database, auth, storage, real-time), Vercel (hosting), Twilio (SMS auth), Google OAuth (SSO)

**Reference Documents:**
- `payment_system_discovery.md` — Current process, pain points, people, roles, chart of accounts
- `technical_specification.md` — Tech stack, accessibility standards, database schema, sprint details, Claude Code guide

---

## Phase 0: Decisions & Prerequisites

These items must be resolved before any code is written. Nothing moves forward until Phase 0 is complete.

### 0.1 — Open Decisions

| # | Decision | Owner | Status |
|---|----------|-------|--------|
| 1 | QuickBooks Desktop or Online? | Tom + Bonnie | **CLOSED — QuickBooks Online confirmed. Both church and NSCC are separate QBO companies.** |
| 2 | Blue Foundry mobile deposit? | Tom | **CLOSED — Not pursuing. Check images are for record-keeping only.** |
| 3 | Vanco fund categories match QuickBooks? | Tom + Bonnie | OPEN — asked Bonnie, awaiting response |
| 4 | Domain/subdomain for the app | Tom | OPEN |
| 5 | Counter volunteer names for UAT | Tom | Not urgent until Sprint 8 |
| 6 | **ACS Realm role in contribution tracking** | Tom + Bonnie | **CLOSED — ACS is the system of record for contributions. Counter module feeds ACS via Bonnie's manual entry. QBO integration is expense-side only.** |
| 7 | **Chart of accounts renumbering** | Bonnie | **IN PROGRESS — Bonnie is renumbering from 300-series to 4000-series. Do not seed accounts until complete.** |

### 0.2 — Account Setup

Each of these takes 10-30 minutes. Tom can do them or delegate.

| # | Task | Status |
|---|------|--------|
| 1 | Create Supabase project | ✅ DONE |
| 2 | Create Twilio account | ✅ DONE |
| 3 | Register Google OAuth app | NOT STARTED |
| 4 | Connect Vercel to GitHub repo | NOT STARTED |
| 5 | Gather environment variables | IN PROGRESS |

### 0.3 — Data Gathering

| # | Task | Status |
|---|------|--------|
| 1 | Full chart of accounts — Church | ✅ RECEIVED (renumbering in progress — do not seed yet) |
| 2 | Full chart of accounts — NSCC | ✅ RECEIVED |
| 3 | Member/pledge list | ✅ RECEIVED (83 members from ACS export) |
| 4 | Church vendor list | ✅ RECEIVED |
| 5 | NSCC vendor list | ✅ RECEIVED |
| 6 | Current paper requisition form | NOT STARTED |
| 7 | Current counter paper form | NOT STARTED |
| 8 | Bank signature card confirmation | NOT STARTED |
| 9 | QBO plan level | OPEN — asked Bonnie |

---

## Phase 1: Foundation (Sprints 1-2, Weeks 1-4)
**Goal:** Users can log in and submit payment requisitions from their phones.

### Sprint 1 — Authentication & App Shell (Weeks 1-2)

**What gets built:**
- Login page with Google SSO and SMS phone verification
- Role-based navigation (submitter sees different options than signer or treasurer)
- PWA setup so it installs like an app on phones
- Admin panel for managing users and assigning roles
- Base layout with accessible typography, colors, and spacing

**Who's involved:**
- Tom: Review and test on phone
- Claude Code: All implementation

**What you'll see at the end of Sprint 1:**
A working app at a staging URL. Staff and vestry can sign in with their church Google accounts. Volunteers can sign in with a text code. Everyone sees a navigation bar at the bottom of their screen with options appropriate to their role. It looks and feels like a real app.

**Blockers:** Supabase project + Google OAuth + Twilio must be set up (Phase 0.2 items 1-3).

---

### Sprint 2 — Requisition Submission (Weeks 3-4)

**What gets built:**
- Digital requisition form (entity, payee, amount, account code, payment method, description)
- Camera integration to photograph receipts and invoices
- "My Requisitions" list showing status of each submission
- Recurring expense templates for staff (save, load, submit-from-template)
- Chart of accounts seeded in database (both church and NSCC)

**Who's involved:**
- Tom: Review form design, test submission flow
- Ryan Bridge: Test music expense template workflow
- Aazhae Coleman: Test nursery school expense template workflow
- Claude Code: All implementation

**What you'll see at the end of Sprint 2:**
Anyone can open the app, fill out a requisition, snap a photo of a receipt, and submit. Staff members can save recurring expenses as templates and resubmit them with one tap. Ryan can tap "Jane Smith — Alto Section Leader" and submit a check request in under 30 seconds.

**Blockers:** Chart of accounts data from Bonnie (Phase 0.3 items 1-2).

---

## Phase 2: Workflow Engine (Sprints 3-4, Weeks 5-8)
**Goal:** The full requisition lifecycle works — submit through payment.

### Sprint 3 — Treasurer Workflow (Weeks 5-6)

**What gets built:**
- Treasurer dashboard showing all requisitions in a queue
- Requisition detail view with all fields and attached documents
- "Prepare" action where Bonnie enters the check number
- Routing logic: system determines 1 or 2 signers needed based on amount
- "Mark as Paid" action with date
- Email notification to Bonnie when new requisitions are submitted
- CSV export of processed requisitions formatted for QuickBooks entry

**Who's involved:**
- Bonnie VanOrnum: Review treasurer workflow, test the queue and export
- Tom: Review and test
- Claude Code: All implementation

**What you'll see at the end of Sprint 3:**
Bonnie opens the app and sees every submitted requisition in a clear queue. She taps one, reviews the details and receipt photo, enters the check number, and routes it for approval. When it's fully approved, she marks it paid. At the end of the week, she exports a clean CSV she can use to enter data into QuickBooks — no more deciphering paper forms.

**Blockers:** None beyond Sprints 1-2 being complete.

---

### Sprint 4 — Approval Workflow (Weeks 7-8)

**What gets built:**
- Signer approval queue with pending count badge
- Detail review screen with full requisition data and documents
- One-tap approve with confirmation
- Reject with required reason
- Approval logic: under $500 = 1 signer; $500+ = 2 different signers
- Notifications: email + push to signers when their action is needed
- Status updates pushed to submitter in real time

**Who's involved:**
- Tom, Michelle, Bill, Denise, Leo: Test approval flow on their phones
- Claude Code: All implementation

**What you'll see at the end of Sprint 4:**
Tom's phone buzzes with a notification: "Requisition #47 — $350 for hired musician — needs your approval." He taps it, reviews the details and invoice photo, taps Approve. Done in 15 seconds from his couch on a Tuesday — no waiting until Sunday. For a $600 requisition, after Tom approves, Michelle gets notified for the second signature. The Sunday bottleneck is eliminated.

**Blockers:** None beyond Sprint 3 being complete.

---

## Phase 3: Counter Module & Dashboard (Sprints 5-6, Weeks 9-12)
**Goal:** Sunday collections go digital. Leadership gets real-time visibility.

### Sprint 5 — Counter Entry Module (Weeks 9-10)

**What gets built:**
- New deposit session creation
- Check entry: camera capture of check image, amount, fund category
- Cash entry: amount per fund category
- Pledge entry: member name search, envelope number auto-fill, amount
- Running totals that update as items are entered
- Second counter verification and sign-off
- Member directory loaded for pledge attribution
- Auto-save on every field change
- Offline capability: works without WiFi, syncs when reconnected

**Who's involved:**
- Tom: Design review, initial testing
- Counter volunteers: Will test in Sprint 9 (UAT)
- Claude Code: All implementation

**What you'll see at the end of Sprint 5:**
Two counters sit down after the service. Counter 1 opens the app on a tablet, starts a new deposit. For each check, they photograph it, enter the amount, and select the fund. For pledges, they type a few letters of the member's name, select from the list, and the envelope number fills in automatically. Cash gets entered as a lump sum per category. Running totals update live at the top of the screen. When done, Counter 2 reviews the summary, confirms it matches the physical count, and taps "Verify." The deposit is submitted. Bonnie gets a complete digital record with check images — no more paper forms.

**Blockers:** Member/pledge list data (Phase 0.3 item 3).

---

### Sprint 6 — Sunday Dashboard (Weeks 11-12)

**What gets built:**
- Dashboard with summary cards: pending approvals, today's deposit, recent activity
- Real-time updates (deposit totals change live as counters enter items)
- Quick-action buttons for common tasks
- Responsive layout for phone and tablet
- Role-specific dashboard views (signers see approvals, counters see deposits)

**Who's involved:**
- Tom, Michelle: Review dashboard design and real-time behavior
- Claude Code: All implementation

**What you'll see at the end of Sprint 6:**
Tom opens the app Sunday after the service. He sees: "3 checks waiting for your signature — $1,247 total." Below that: "Today's deposit: $4,832 (Pledges: $3,600 | Plate: $412 | Building Fund: $520 | Altar Flowers: $300)." The numbers update in real time as the counters finish entering items in the next room. He taps "Review Next Requisition" and starts approving.

**Milestone: Core functionality is live.** The church can begin parallel-running the digital system alongside paper.

---

## Phase 4: Integration & Reporting (Sprint 7, Weeks 13-14)
**Goal:** Data flows to QuickBooks cleanly. Leadership has reporting.

### Sprint 7 — Reporting & QuickBooks Integration (Weeks 13-14)

**What gets built (regardless of QB version):**
- Requisition export: CSV with date, payee, amount, account code, check number, memo
- Deposit export: CSV with date, account, amount, member, check number
- Date range filtering on all reports
- Monthly summary report by account category
- PDF generation for audit support
- Audit log export

**Additional if QuickBooks Online:**
- OAuth connection to QuickBooks Online
- Push requisitions as Bills/Bill Payments
- Push deposits as Deposit entries
- Pull vendor list for bidirectional sync
- Pull chart of accounts to keep local copy current

**Additional if QuickBooks Desktop:**
- IIF file generation as alternative to CSV
- Formatted export matching QB Desktop import requirements

**Who's involved:**
- Bonnie: Test exports, confirm they match what she needs for QB entry
- Tom: Review reports
- Claude Code: All implementation

**What you'll see at the end of Sprint 7:**
Bonnie clicks "Export This Week's Requisitions" and gets a CSV that opens perfectly in Excel with all the columns she needs. She can copy-paste or import directly into QuickBooks. If QBO — she clicks "Sync to QuickBooks" and the transactions appear in her books automatically, coded to the correct accounts.

**Blockers:** QuickBooks Desktop vs. Online decision (Phase 0.1 item 1).

---

## Phase 5: Hardening & Launch (Sprints 8-10, Weeks 15-20)
**Goal:** Bulletproof the system, test with real users, go live.

### Sprint 8 — Polish & Edge Cases (Weeks 15-16)

**Tasks:**
- Comprehensive error handling (network loss, storage limits, auth expiry)
- Accessibility audit using axe DevTools + manual testing
- Performance optimization (image compression, lazy loading, bundle splitting)
- Cross-browser testing: iOS Safari, Android Chrome, Edge, Firefox
- Edge cases: duplicate submissions, concurrent approvals, session timeouts
- Notification preferences (email, push, or both)
- Help text and contextual guidance on forms

---

### Sprint 9 — User Acceptance Testing (Weeks 17-18)

**Testing sessions (in person at church when possible):**

| Session | Who | What They Test | Duration |
|---------|-----|---------------|----------|
| 1 | Bonnie | Treasurer workflow: queue, prepare, export, mark paid | 1 hour |
| 2 | Tom + Michelle | Signer workflow: review, approve, reject, dashboard | 45 min |
| 3 | Ryan | Staff template: create music expense templates, submit recurring | 30 min |
| 4 | Aazhae | Staff template: create NSCC expense templates, submit recurring | 30 min |
| 5 | 2-3 counter volunteers | Counter entry: checks, cash, pledges, verify | 1 hour |
| 6 | 1-2 vestry or parishioners | Occasional submitter: simple requisition with receipt photo | 20 min |
| 7 | Mother Diana | Submitter flow: submit a requisition (she is submitter-only role) | 15 min |

**After each session:**
- Collect feedback (what was confusing, what was easy, what's missing)
- Prioritize fixes (critical vs. nice-to-have)
- Fix critical issues before next testing session

**Deliverables:**
- User guides: simple, screenshot-heavy, large font (one per role)
- 2-minute video walkthroughs for each role
- Known limitations document

---

### Sprint 10 — Launch & Transition (Weeks 19-20)

**Week 19: Parallel Run Begins**
- Production deployment with real data (accounts, members, vendors)
- All user accounts created
- Both paper and digital processes run simultaneously
- Counters do paper AND digital for 2 Sundays
- Requisitions submitted on paper AND in the app
- Bonnie compares digital records against her paper-based QB entries

**Week 20: Evaluation & Cutover**
- Review parallel run results with Bonnie, Mother Diana, and vestry leadership
- Address any remaining issues
- If confidence is established: retire paper forms
- If not: extend parallel run 2 more weeks

**Post-Launch Support Plan:**
- Tom monitors the system for 4 weeks post-cutover
- Quick-fix capability via Claude Code for bugs that surface
- Monthly check-in with Bonnie on export/reporting needs
- Quarterly review: is anything not working, what would make it better

---

## Timeline Summary

```
PHASE 0          PHASE 1           PHASE 2           PHASE 3           PHASE 4       PHASE 5
Decisions &      Foundation        Workflow Engine    Counter &         Integration   Hardening &
Prerequisites                                        Dashboard         & Reporting   Launch
                                                                        
|--- 1-2 wks ---|--- 4 weeks ------|--- 4 weeks ------|--- 4 weeks ------|--- 2 wks ---|--- 6 weeks ------|

                 Sprint 1  Sprint 2  Sprint 3  Sprint 4  Sprint 5  Sprint 6  Sprint 7  S8    S9    S10
                 Auth      Reqs      Treasurer Approval  Counter   Dashboard Reports   Polish UAT   Launch
                 |---------|---------|---------|---------|---------|---------|---------|------|------|------|
                 Wk 1-2    Wk 3-4    Wk 5-6    Wk 7-8    Wk 9-10   Wk 11-12  Wk 13-14  15-16  17-18  19-20

                                                                     ↑
                                                              CORE LIVE
                                                         (parallel run can
                                                          start here)
```

**Estimated total: ~22 weeks** from Phase 0 start to full cutover.

Early parallel running can begin after Sprint 6 (Week 12) for the requisition workflow. Counter module testing begins Sprint 9 (Week 17) on actual Sundays.

---

## Budget Summary

### One-Time Costs
| Item | Cost |
|------|------|
| Development | $0 (Claude Code + Tom's time) |
| Domain (if new subdomain needed) | $0 (use existing) |
| Twilio initial credit | $20 (pre-loaded, lasts months) |
| **Total one-time** | **~$20** |

### Monthly Operating Costs
| Service | Cost |
|---------|------|
| Supabase Pro (database, auth, storage) | $25 |
| Vercel (hosting) | $0-20 |
| Twilio SMS (pay-per-use) | ~$5 |
| Resend email (free tier) | $0 |
| **Total monthly** | **$30-50** |

### Potential Future Costs
| Item | Cost | Trigger |
|------|------|---------|
| QuickBooks Online subscription | ~$30/month | If migrating from Desktop |
| Supabase scale-up | $25 → $50 | If storage exceeds 8GB (unlikely) |
| Custom domain SSL | $0 | Automatic via Vercel |

---

## Roles & Responsibilities

| Person | Project Role | Responsibilities |
|--------|-------------|-----------------|
| **Tom Reynolds** | Project Lead, Primary Tester, Admin | Oversee all phases; make decisions on open items; test every sprint; manage accounts and credentials; coordinate with Bonnie and volunteers |
| **Claude (AI)** | Discovery & Specification | Discovery interviews, requirements gathering, document creation, research, technical specification |
| **Claude Code** | Implementation | All coding, testing, deployment per sprint plans and CLAUDE.md |
| **Bonnie VanOrnum** | Subject Matter Expert, Treasurer UAT | Provide chart of accounts, vendor lists, member data; test treasurer workflow; validate exports match QB needs |
| **Michelle Ryndak** | Co-Lead, Signer UAT | Test signer workflow; provide feedback on dashboard; co-manage parallel run |
| **Ryan Bridge** | Staff UAT | Test music expense template workflow |
| **Aazhae Coleman** | Staff UAT | Test NSCC expense template workflow |
| **Counter Volunteers** | Counter UAT | Test deposit entry in Sprint 9 |
| **Mother Diana** | Stakeholder | Final approval on launch; spiritual authority alignment |

---

## Risk Management

| Risk | Likelihood | Impact | Mitigation | Owner |
|------|-----------|--------|------------|-------|
| QuickBooks Desktop limits integration | Medium | Medium | Build clean export first; QBO migration can happen later | Tom + Bonnie |
| Older volunteers struggle with interface | High | Medium | Oversized UI elements; in-person training sessions; pair with experienced user first few Sundays | Tom |
| Church WiFi unreliable | Medium | High | Offline-capable counter module; pre-authenticate before service starts | Claude Code |
| Bonnie uncomfortable with change | Low | High | Parallel run; her workload decreases; involve in UAT early; CSV export matches her current workflow | Tom |
| Scope creep (pledge tracking, giving statements, etc.) | Medium | Medium | Strict sprint scope; future features go in a backlog, not into current sprints | Tom |
| Tom's time availability | Medium | High | Sprints are 2 weeks each, not rigid deadlines; can pause between sprints without losing work | Tom |

---

## Next Steps (Immediate)

**Tom's action items right now:**

1. ☐ Ask Bonnie: QuickBooks Desktop or Online?
2. ☐ Ask Bonnie: Can she export chart of accounts, vendor list, and member list as CSV?
3. ☐ Call Blue Foundry: Does the church account qualify for mobile deposit?
4. ☐ Create Supabase account (supabase.com — sign up with GitHub)
5. ☐ Create Twilio account (twilio.com — will need credit card for $20 initial credit)
6. ☐ Decide on subdomain (e.g., ops.christchurchbg.org)
7. ☐ Scan or photograph the current paper requisition form and counter form

**Once items 1-5 are done, Phase 1 development can begin.**

---

*Workplan prepared April 15, 2026. Living document — updated as decisions are made and sprints progress.*
