---
file: technical_specification.md
project: Christ Church in Bloomfield & Glen
chat: Church payment authorization and QuickBooks integration
date: 2026-0415
---

# ChurchOps: Technical Specification & Implementation Plan
## Payment Authorization & Counter Entry Platform

### Document Purpose
Complete technical blueprint for building a mobile-first progressive web application for Christ Episcopal Church Bloomfield/Glen Ridge. Covers tech stack, accessibility requirements, UI/UX standards, sprint plan, integration specifications, database schema, and Claude Code implementation instructions.

---

## 1. Tech Stack Selection

### Core Application

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Framework** | Next.js 15 (App Router) | Server-side rendering for fast first load on older phones; built-in API routes eliminate need for separate backend; native PWA support; largest ecosystem and talent pool |
| **Language** | TypeScript | Type safety catches errors before runtime; essential for financial data integrity; Claude Code produces higher quality output with typed codebases |
| **Styling** | Tailwind CSS 4 | Utility-first CSS scales without bloat; excellent accessibility tooling; responsive design primitives built in |
| **Component Library** | shadcn/ui + Radix UI primitives | Accessible by default (WAI-ARIA compliant); unstyled primitives allow full control of visual design; no vendor lock-in since components are copied into codebase |
| **State Management** | React Server Components + Zustand (client-side only where needed) | Minimize client JavaScript; keep financial state server-authoritative |

### Backend & Data

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Database** | Supabase (PostgreSQL) | Row-level security for role-based access; built-in auth with Google OAuth and phone/SMS support; real-time subscriptions for live dashboard updates; free tier covers church volume; open source |
| **Authentication** | Supabase Auth | Google OAuth 2.0 for staff/vestry; Phone (SMS OTP) for volunteers; session management built in; no separate auth service needed |
| **File Storage** | Supabase Storage | Receipt photos, check images stored in S3-compatible buckets; row-level security ties files to requisitions; CDN delivery for fast loading |
| **API Layer** | Next.js API Routes + Supabase Client | Server-side data fetching via Supabase SDK; API routes for webhook handlers and integrations |

### Infrastructure & Deployment

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Hosting** | Vercel | Zero-config deployment for Next.js; automatic HTTPS; edge network for fast global delivery; free tier sufficient for church traffic; preview deployments for testing |
| **SMS Provider** | Twilio Verify | Purpose-built OTP verification; ~$0.05/verification; no need to manage code generation or expiry logic |
| **Email Notifications** | Resend (or Supabase Edge Functions + SMTP) | Transactional email for approval notifications; React Email for templating; free tier = 100 emails/day |
| **Push Notifications** | Web Push API (native browser) | No app store required; works on all modern mobile browsers; free |
| **OCR (Future Phase)** | Tesseract.js (client-side) | Open source; runs in browser — no server round-trip for check reading; no API cost |
| **Domain & DNS** | Existing church domain (subdomain: ops.christchurchbg.org or similar) | Professional URL; SSL automatic via Vercel |

### Integration Layer

| System | Integration Method | Priority |
|--------|-------------------|----------|
| **QuickBooks Online** | Intuit OAuth 2.0 + QBO API v3 (expense side only) | Phase 2 — Sprint 7 |
| **ACS Realm** | No direct integration — counter module produces records for Bonnie's manual ACS entry | N/A — by design |
| **Vanco** | CSV export import or API (investigate) | Phase 3 |
| **Google Workspace** | OAuth 2.0 for authentication | Phase 1 — Sprint 1 |

### Why This Stack

1. **Next.js + Supabase is the most LLM-friendly stack available.** Claude Code has extensive training data on both; produces reliable, well-structured output. This is not hypothetical — it is the most documented combination for AI-assisted development in 2026.
2. **Supabase provides auth, database, storage, and real-time in one platform.** For a church with no IT department, fewer moving parts means fewer things to break.
3. **Free tiers cover this use case.** Vercel free tier handles up to 100GB bandwidth/month. Supabase free tier includes 50,000 monthly active users, 500MB database, 1GB storage. The church will use a fraction of this.
4. **Progressive Web App deployment** means no App Store approval, no separate iOS/Android codebases, and users install it like an app from the browser. Critical for non-technical users.

---

## 2. Accessibility & Design Standards

### The Users

Most users in this system are over 45, many over 60. The counter volunteers may be the least technically comfortable. The system must be usable by someone who:
- Wears reading glasses or has reduced vision
- Has limited experience with phone apps
- May have reduced fine motor control
- Is in a dimly lit church building on Sunday morning

### WCAG 2.2 AA Compliance (Mandatory)

All interfaces must meet WCAG 2.2 Level AA as a minimum. Key requirements:

**Color Contrast**
- Normal text (under 18pt): minimum **4.5:1** contrast ratio against background
- Large text (18pt+ or 14pt bold): minimum **3:1** contrast ratio
- UI components (buttons, form borders, icons): minimum **3:1** against adjacent colors
- **Target: 7:1 for body text** (AAA level) given the older user base — this exceeds the legal requirement but matches our actual audience

**Touch Targets**
- All interactive elements: minimum **44×44 CSS pixels** (WCAG 2.5.8 Target Size)
- **Our standard: 48×48px minimum** with 8px spacing between targets
- Buttons on primary actions (Submit, Approve, Reject): **56px height minimum**
- Form inputs: **48px height minimum** with clear visible borders

**Typography**
- Body text: **18px minimum** (not the standard 16px — our users need larger)
- Button labels: **18px bold**
- Form labels: **16px semibold**
- Headings: **24-32px bold**
- Captions/timestamps: **14px minimum**, only for non-critical metadata
- Line height: **1.5x font size** for body text, **1.3x** for headings
- Letter spacing: **0.01em minimum** for body text
- **All text must support 200% zoom** without layout breaking

**Focus & Navigation**
- Visible focus indicators on all interactive elements (2px solid outline, high contrast)
- Logical tab order
- No keyboard traps
- Skip links where appropriate

**Authentication Accessibility (WCAG 2.2 specific)**
- 3.3.8 Accessible Authentication: Google SSO satisfies this (no cognitive function test)
- SMS OTP: 6-digit code with large input fields, auto-read from SMS where supported

### Color Palette

The palette is designed for warmth (this is a church, not a bank) while exceeding AA contrast requirements on all text combinations.

```css
:root {
  /* Primary — Deep Episcopal Blue */
  --primary-700: #1B4F72;    /* Primary buttons, headings — 9.2:1 on white */
  --primary-600: #21618C;    /* Interactive elements — 7.1:1 on white */
  --primary-500: #2980B9;    /* Links, accents — 4.6:1 on white (large text only) */
  --primary-100: #D4E6F1;    /* Light backgrounds, selected states */
  --primary-50:  #EBF5FB;    /* Subtle backgrounds */

  /* Neutral — Warm Gray (not cold/clinical) */
  --gray-900: #1C1C1C;       /* Primary text — 16.4:1 on white */
  --gray-700: #4A4A4A;       /* Secondary text — 9.7:1 on white */
  --gray-500: #767676;       /* Placeholder text — 4.6:1 on white (AA compliant) */
  --gray-200: #E5E5E5;       /* Borders, dividers */
  --gray-50:  #FAFAFA;       /* Page background */

  /* Success — Muted Green */
  --success-700: #1E6B3A;    /* Approved status text — 7.8:1 on white */
  --success-100: #D4EDDA;    /* Approved background */

  /* Warning — Warm Amber */
  --warning-700: #856404;    /* Pending status text — 6.1:1 on white */
  --warning-100: #FFF3CD;    /* Pending background */

  /* Danger — Clear Red */
  --danger-700: #922B21;     /* Rejected/error text — 8.6:1 on white */
  --danger-100: #F5C6CB;     /* Error background */

  /* Surface */
  --white: #FFFFFF;
  --card-bg: #FFFFFF;
  --page-bg: #F8F9FA;        /* Slight warmth, not stark white */
}
```

**Why Episcopal Blue:** It is the traditional liturgical color associated with the Episcopal Church, feels familiar and trustworthy to the congregation, and has excellent contrast properties for accessibility.

### Typography

```css
:root {
  /* Font Family — System fonts for zero load time, maximum readability */
  --font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 
                   Roboto, 'Helvetica Neue', Arial, sans-serif;
  
  /* 
   * Inter is the recommended choice:
   * - Designed specifically for screen readability
   * - Variable font with optical sizing
   * - Excellent legibility at all sizes
   * - Free, open source (Google Fonts)
   * - Fallback to system fonts = zero FOUT on first load
   */

  /* Type Scale — deliberately larger than standard */
  --text-xs:    14px;   /* Timestamps only — never for critical content */
  --text-sm:    16px;   /* Captions, helper text */
  --text-base:  18px;   /* Body text, form inputs, list items */
  --text-lg:    20px;   /* Emphasized body, navigation labels */
  --text-xl:    24px;   /* Section headings */
  --text-2xl:   28px;   /* Page headings */
  --text-3xl:   32px;   /* Dashboard numbers, primary totals */

  /* Font Weights */
  --font-normal:   400;
  --font-medium:   500;
  --font-semibold: 600;
  --font-bold:     700;

  /* Line Heights */
  --leading-tight:  1.3;   /* Headings */
  --leading-normal: 1.5;   /* Body text */
  --leading-relaxed: 1.7;  /* Long-form reading */
}
```

### Spacing & Layout

```css
:root {
  /* Generous spacing — prevents cramped feeling on mobile */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;

  /* Card/Container padding */
  --card-padding: 20px;
  
  /* Form element spacing */
  --form-gap: 20px;         /* Between form fields */
  --input-padding: 14px;    /* Inside input fields */
  --input-height: 48px;     /* Minimum interactive height */
  --button-height: 56px;    /* Primary action buttons */
  --button-height-sm: 44px; /* Secondary buttons */
}
```

### Mobile-First Responsive Breakpoints

```css
/* Mobile first — base styles are mobile */
/* sm: 640px  — large phones landscape */
/* md: 768px  — tablets */
/* lg: 1024px — desktops */
/* xl: 1280px — large desktops */

/* The app is designed for 375px width (iPhone SE) as the minimum */
/* All critical flows must work perfectly at this size */
```

### Interaction Design Principles

1. **One primary action per screen.** The counter doesn't see a dashboard AND an entry form AND settings. They see the entry form.
2. **Large, clearly labeled buttons.** "Approve" and "Reject" are full-width, 56px tall, with icons AND text.
3. **Confirmation on destructive actions.** Rejecting a requisition requires a confirmation step with reason field.
4. **Progress indicators.** Multi-step processes show "Step 2 of 4" with a visual progress bar.
5. **Error messages are specific and helpful.** Not "Invalid input" but "Amount must be a number greater than zero."
6. **Success feedback is immediate and clear.** Green checkmark animation + "Requisition submitted" text.
7. **Bottom navigation for primary actions.** Thumbs are at the bottom of phones; primary nav lives there.
8. **No horizontal scrolling ever.** All tables convert to card layouts on mobile.
9. **Auto-save on forms.** If a counter is interrupted mid-entry, their work is preserved.
10. **Offline capability** for counter entry — entries queue locally and sync when connection returns.

---

## 3. Database Schema (Supabase/PostgreSQL)

### Core Tables

```sql
-- Users and Authentication (managed by Supabase Auth, extended here)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  role TEXT[] NOT NULL DEFAULT '{"submitter"}', 
    -- submitter, treasurer, signer, counter, admin
  entity_access TEXT[] DEFAULT '{"church","nscc"}',
    -- which entities they can submit for
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Chart of Accounts (synced from QuickBooks or manually maintained)
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,          -- e.g., "415-a"
  name TEXT NOT NULL,                 -- e.g., "Hired Music"
  entity TEXT NOT NULL,               -- "church" or "nscc"
  category TEXT NOT NULL,             -- "A. Clergy Expense", etc.
  account_type TEXT NOT NULL,         -- "income" or "expense"
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Vendors / Payees
CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  default_account_id UUID REFERENCES accounts(id),
  entity TEXT,                        -- "church", "nscc", or NULL for both
  is_active BOOLEAN DEFAULT true,
  qb_vendor_id TEXT,                  -- QuickBooks ID for sync
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Requisition Templates (for recurring expenses)
CREATE TABLE requisition_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID REFERENCES profiles(id) NOT NULL,
  name TEXT NOT NULL,                 -- "Jane Smith - Alto Section Leader"
  vendor_id UUID REFERENCES vendors(id),
  payee_name TEXT NOT NULL,
  amount DECIMAL(10,2),               -- NULL if amount varies
  entity TEXT NOT NULL,               -- "church" or "nscc"
  account_id UUID REFERENCES accounts(id) NOT NULL,
  payment_method TEXT NOT NULL,       -- "check" or "online"
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ,
  use_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Requisitions (the core transaction record)
CREATE TABLE requisitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  req_number SERIAL,                  -- Human-readable sequential number
  template_id UUID REFERENCES requisition_templates(id),
  
  -- Submitter info
  submitted_by UUID REFERENCES profiles(id) NOT NULL,
  submitted_at TIMESTAMPTZ DEFAULT now(),
  
  -- Payment details
  vendor_id UUID REFERENCES vendors(id),
  payee_name TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  entity TEXT NOT NULL,               -- "church" or "nscc"
  account_id UUID REFERENCES accounts(id) NOT NULL,
  payment_method TEXT NOT NULL,       -- "check" or "online"
  description TEXT NOT NULL,
  check_number TEXT,                  -- Filled by treasurer when prepared
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'submitted',
    -- submitted → prepared → pending_approval → approved → paid → recorded
    -- submitted → rejected (at any stage)
  
  -- Treasurer preparation
  prepared_by UUID REFERENCES profiles(id),
  prepared_at TIMESTAMPTZ,
  
  -- Approval tracking
  requires_dual_approval BOOLEAN GENERATED ALWAYS AS (amount >= 500) STORED,
  
  -- Final processing
  paid_at TIMESTAMPTZ,
  paid_by UUID REFERENCES profiles(id),
  recorded_in_qb BOOLEAN DEFAULT false,
  qb_transaction_id TEXT,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Approval records (one row per signer action)
CREATE TABLE approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requisition_id UUID REFERENCES requisitions(id) NOT NULL,
  signer_id UUID REFERENCES profiles(id) NOT NULL,
  action TEXT NOT NULL,               -- "approved" or "rejected"
  notes TEXT,                         -- Required if rejected
  signed_at TIMESTAMPTZ DEFAULT now()
);

-- File attachments (receipts, invoices, check images)
CREATE TABLE attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requisition_id UUID REFERENCES requisitions(id),
  deposit_id UUID,                    -- For counter check images
  file_path TEXT NOT NULL,            -- Supabase Storage path
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,            -- "receipt", "invoice", "check_image"
  file_size INTEGER,
  uploaded_by UUID REFERENCES profiles(id) NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

-- Deposit Sessions (one per counting session)
CREATE TABLE deposits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deposit_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Counter tracking
  counter_1_id UUID REFERENCES profiles(id) NOT NULL,
  counter_2_id UUID REFERENCES profiles(id),
  
  -- Totals (auto-calculated from line items but stored for quick access)
  total_checks DECIMAL(10,2) DEFAULT 0,
  total_cash DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) DEFAULT 0,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'in_progress',
    -- in_progress → pending_verification → verified → recorded
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES profiles(id),  -- Second counter confirms
  
  -- QuickBooks sync
  recorded_in_qb BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Deposit Line Items (individual contributions)
CREATE TABLE deposit_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deposit_id UUID REFERENCES deposits(id) NOT NULL,
  
  -- Contribution details
  item_type TEXT NOT NULL,            -- "check", "cash", "coin"
  amount DECIMAL(10,2) NOT NULL,
  account_id UUID REFERENCES accounts(id) NOT NULL,  -- Which fund
  
  -- Pledge tracking (for check/identified contributions)
  is_pledge_payment BOOLEAN DEFAULT false,
  member_name TEXT,                   -- For pledge tracking
  envelope_number TEXT,
  
  -- Check-specific
  check_number TEXT,
  check_image_path TEXT,              -- Supabase Storage path
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Audit Log (every action recorded)
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,               -- "requisition.submitted", "approval.granted", etc.
  entity_type TEXT NOT NULL,          -- "requisition", "deposit", "profile", etc.
  entity_id UUID,
  details JSONB,                      -- Additional context
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Member Directory (for pledge tracking in counter module)
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  envelope_number TEXT,
  address TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Row-Level Security Policies

```sql
-- Submitters can see their own requisitions
CREATE POLICY "Users see own requisitions" ON requisitions
  FOR SELECT USING (submitted_by = auth.uid());

-- Signers can see requisitions pending their approval
CREATE POLICY "Signers see pending requisitions" ON requisitions
  FOR SELECT USING (
    status IN ('prepared', 'pending_approval')
    AND 'signer' = ANY(
      (SELECT role FROM profiles WHERE id = auth.uid())
    )
  );

-- Treasurer sees all requisitions
CREATE POLICY "Treasurer sees all" ON requisitions
  FOR SELECT USING (
    'treasurer' = ANY(
      (SELECT role FROM profiles WHERE id = auth.uid())
    )
  );

-- Admin sees everything
CREATE POLICY "Admin full access" ON requisitions
  FOR ALL USING (
    'admin' = ANY(
      (SELECT role FROM profiles WHERE id = auth.uid())
    )
  );

-- Counter role can create and edit deposits
CREATE POLICY "Counters manage deposits" ON deposits
  FOR ALL USING (
    'counter' = ANY(
      (SELECT role FROM profiles WHERE id = auth.uid())
    )
  );
```

---

## 4. Sprint Plan

### Methodology
Agile sprints, 2 weeks each. Each sprint produces a deployable increment. Total estimated timeline: **10 sprints (20 weeks)** from kickoff to production, with core functionality live by Sprint 6.

### Pre-Sprint: Project Setup (1 week)

**Deliverables:**
- Git repository initialized with Next.js 15, TypeScript, Tailwind CSS 4, shadcn/ui
- Supabase project created with database schema deployed
- Vercel project connected to repo with automatic deployments
- CLAUDE.md file written with project conventions, style rules, and architecture decisions
- Development, staging, and production environments configured
- Domain and DNS configured (ops.christchurchbg.org or equivalent)
- Google OAuth application registered in church Google Workspace admin
- Twilio Verify account created
- Design tokens (colors, typography, spacing) implemented as Tailwind config

---

### Sprint 1: Authentication & Shell (Weeks 1-2)
**Goal:** Users can log in and see the correct interface for their role.

**User Stories:**
- As a staff member, I can sign in with my church Google account
- As a volunteer, I can sign in with a code texted to my phone
- As any user, I see only the features my role permits
- As any user, I can install the app to my home screen (PWA)

**Technical Tasks:**
1. Supabase Auth configuration — Google OAuth provider + Phone provider
2. Login page with two clear paths: "Sign in with Google" button + "Sign in with Phone" option
3. Phone auth flow: enter number → receive SMS code → enter 6-digit code → authenticated
4. Profile creation on first login (name, role assignment by admin)
5. Role-based navigation shell with bottom tab bar
6. PWA manifest, service worker, and install prompt
7. Responsive layout shell with page transitions
8. Admin panel: user management (add/deactivate users, assign roles)

**Acceptance Criteria:**
- Google SSO works with church domain accounts
- SMS verification sends and validates codes
- Users see role-appropriate navigation
- App installable on iOS Safari and Android Chrome
- All touch targets meet 48px minimum
- Body text renders at 18px

---

### Sprint 2: Requisition Submission (Weeks 3-4)
**Goal:** Anyone can submit a payment requisition from their phone.

**User Stories:**
- As a submitter, I can create a new requisition with all required fields
- As a submitter, I can attach a photo of a receipt or invoice
- As a submitter, I can see the status of my submitted requisitions
- As a staff member, I can save a requisition as a reusable template
- As a staff member, I can submit from a saved template with one tap

**Technical Tasks:**
1. Requisition form: entity selector, payee, amount, account (searchable dropdown), payment method, description, file upload
2. Camera integration for receipt/invoice photos (HTML5 capture)
3. File upload to Supabase Storage with compression
4. Account code dropdown organized by category with search
5. Form validation with accessible error messages
6. "My Requisitions" list view with status badges
7. Template CRUD: save, list, submit-from-template, edit, delete
8. Seed database with full chart of accounts from both entities

**Acceptance Criteria:**
- Form submits successfully with all required fields
- Photo capture works from phone camera
- Account dropdown is searchable and organized by category
- Templates save and reload correctly
- Status list shows submitted, pending, approved, paid, rejected

---

### Sprint 3: Treasurer Workflow (Weeks 5-6)
**Goal:** Bonnie can review, prepare, and track all requisitions.

**User Stories:**
- As treasurer, I see all submitted requisitions in a queue
- As treasurer, I can mark a requisition as "prepared" and enter the check number
- As treasurer, I can route prepared requisitions for approval
- As treasurer, I can see which requisitions are fully approved and ready to process
- As treasurer, I can mark approved requisitions as "paid"

**Technical Tasks:**
1. Treasurer dashboard: queue of requisitions sorted by status
2. Requisition detail view with all fields + attached documents
3. "Prepare" action: check number entry, status update
4. Automatic routing: system determines 1 or 2 signers needed based on amount
5. "Mark as Paid" action with date and optional notes
6. Filter/sort requisitions by status, date, entity, amount
7. Export: generate CSV/PDF summary of processed requisitions (for QB entry)
8. Notification trigger when requisition is submitted (email to Bonnie)

**Acceptance Criteria:**
- Bonnie can process a requisition from submitted → prepared → paid
- Check number is captured and displayed
- CSV export contains all fields needed for QuickBooks entry
- Email notification arrives within 1 minute of submission

---

### Sprint 4: Approval Workflow (Weeks 7-8)
**Goal:** Signers can review and approve or reject requisitions from their phones.

**User Stories:**
- As a signer, I receive a notification when a requisition needs my approval
- As a signer, I can review all details and attached documents
- As a signer, I can approve with one tap
- As a signer, I can reject with a required reason
- As a signer, I see a clear count of items awaiting my action

**Technical Tasks:**
1. Approval queue: list of requisitions pending signer action
2. Detail view with all requisition data, backup images viewable at full size
3. Approve button with confirmation
4. Reject button with required reason text field
5. Approval logic: under $500 = one approval completes; $500+ = track two approvals
6. Notification system: email + push notification to next signer(s)
7. Status updates: submitter sees real-time status changes
8. Badge count on navigation icon showing pending approvals
9. Prevention: same person cannot be both approvals on a single requisition

**Acceptance Criteria:**
- Under-$500 requisitions move to approved after one signer
- $500+ requisitions require two different signers
- Rejection includes reason and notifies submitter and treasurer
- Push notifications deliver on mobile browsers

---

### Sprint 5: Counter Entry Module (Weeks 9-10)
**Goal:** Counters can record Sunday deposits digitally from a phone or tablet.

**Note: The counter module does NOT write to ACS Realm or QuickBooks directly.** It produces a clean digital record (with check images, categorized amounts, and member attributions) that replaces the current paper forms. Bonnie enters the data into ACS for contribution tracking and QBO for deposit accounting on her own schedule.

**User Stories:**
- As a counter, I can start a new deposit session
- As a counter, I can photograph each check and record its details
- As a counter, I can record cash totals by fund category
- As a counter, I can record pledge payments linked to members
- As the second counter, I can review and verify the deposit
- As a counter, I see running totals as I enter items

**Technical Tasks:**
1. New deposit session creation (auto-dates to today)
2. Check entry: camera capture, amount input, fund category selector
3. Cash entry: amount input per fund category
4. Pledge entry: member search/select, envelope number auto-fill, amount, fund
5. Running totals display (total checks, total cash, grand total, breakdown by fund)
6. Deposit summary screen with complete breakdown
7. Second counter verification flow: review, confirm, digital sign-off
8. Member directory: searchable list for pledge attribution
9. Auto-save: entries persist even if browser closes
10. Offline support: entries queue locally, sync when back online

**Acceptance Criteria:**
- Two counters can complete a full deposit entry session
- Check images are captured and stored
- Running totals update in real time
- Pledge payments associate with member records
- Summary matches expected deposit slip totals
- Works in low-connectivity environment (church building)

---

### Sprint 6: Sunday Dashboard (Weeks 11-12)
**Goal:** Signers and leadership see a real-time snapshot on Sundays.

**User Stories:**
- As a signer, I see how many checks are waiting for my signature
- As a warden, I see today's deposit totals after counters submit
- As anyone authorized, I see a quick financial snapshot

**Technical Tasks:**
1. Dashboard page with summary cards
2. "Pending Approvals" card with count and total dollar amount
3. "Today's Deposit" card with breakdown by category (real-time via Supabase subscriptions)
4. "Recent Activity" feed showing latest requisitions and deposits
5. Quick-action buttons: "Review Next Requisition", "Start Deposit"
6. Responsive layout: cards stack vertically on phone, grid on tablet
7. Real-time updates via Supabase Realtime (no page refresh needed)

**Acceptance Criteria:**
- Dashboard loads in under 2 seconds on mobile
- Deposit totals update live as counters enter items
- Pending approval count is accurate
- Works on phone screens at 375px width

---

### Sprint 7: Reporting & Export (Weeks 13-14)
**Goal:** Bonnie gets clean data for QuickBooks; leadership gets visibility.

**User Stories:**
- As treasurer, I can export requisition data formatted for QuickBooks
- As treasurer, I can export deposit data formatted for QuickBooks
- As treasurer, I can generate a report of all transactions for a date range
- As a warden, I can see a monthly summary of income and expenses processed

**Technical Tasks:**
1. Requisition export: CSV with QB-compatible columns (date, payee, amount, account code, check #, memo)
2. Deposit export: CSV with QB-compatible columns (date, account, amount, member, check #)
3. Date range filter for all reports
4. Monthly summary report: total by account category
5. PDF generation for formal reports (audit support)
6. Audit log export for annual audit compliance

**QuickBooks Integration (if Online confirmed):**
7. OAuth connection to QuickBooks Online
8. Push requisitions as Bills/Bill Payments
9. Push deposits as Sales Receipts or Deposit entries
10. Pull vendor list for bidirectional sync
11. Pull chart of accounts to keep local copy current

**Acceptance Criteria:**
- CSV exports open correctly in Excel/QuickBooks
- Date range filter works accurately
- Exports include all fields Bonnie needs for QB entry
- If QBO: transactions appear in QuickBooks within 5 minutes of sync

---

### Sprint 8: Polish & Edge Cases (Weeks 15-16)
**Goal:** Handle everything that wasn't covered, fix what breaks.

**Tasks:**
1. Error handling: graceful failures for network loss, storage limits, auth expiry
2. Accessibility audit using axe DevTools and manual screen reader testing
3. Performance optimization: image compression, lazy loading, bundle splitting
4. Keyboard navigation testing on all forms
5. Cross-browser testing: Safari iOS, Chrome Android, Edge, Firefox
6. Edge cases: duplicate submissions, concurrent approvals, session timeout during form entry
7. Notification preferences: allow users to choose email only, push only, or both
8. Help text and tooltips on form fields
9. "Forgot which button" failsafes — clear labels, undo options

---

### Sprint 9: User Acceptance Testing (Weeks 17-18)
**Goal:** Real users test in real conditions.

**Tasks:**
1. Deploy to staging environment with production-like data
2. Testing sessions with:
   - Bonnie (treasurer workflow)
   - Tom and Michelle (signer/admin workflow)
   - Ryan and Aazhae (staff template workflow)
   - 2-3 counter volunteers (deposit entry)
   - 1-2 occasional submitters (simple requisition)
3. Collect feedback, prioritize fixes
4. Fix critical issues
5. Document known limitations
6. Write user guides (simple, screenshot-heavy, large print)
7. Record 2-minute video walkthroughs for each role

---

### Sprint 10: Launch & Transition (Weeks 19-20)
**Goal:** Go live with parallel run, then cut over.

**Tasks:**
1. Production deployment with production Supabase instance
2. Data migration: chart of accounts, member directory, vendor list
3. User account creation for all staff, vestry, and counter volunteers
4. **Parallel run**: 2-4 Sundays where both paper and digital processes operate simultaneously
5. Monitor for issues, quick fixes
6. Cut over: retire paper forms when confidence is established
7. Post-launch support plan

---

## 5. Claude Code Implementation Guide

### CLAUDE.md File

This file goes in the project root. Claude Code reads it at the start of every session.

```markdown
# ChurchOps — Payment Authorization & Counter Entry Platform

## Project Overview
A mobile-first PWA for Christ Episcopal Church Bloomfield/Glen Ridge. 
Handles payment requisitions (submit → prepare → approve → pay) and 
Sunday collection counter entry (count → enter → verify → submit).

## Tech Stack
- Next.js 15 (App Router) with TypeScript
- Tailwind CSS 4 with custom design tokens
- shadcn/ui components (Radix UI primitives)
- Supabase (PostgreSQL, Auth, Storage, Realtime)
- Deployed on Vercel

## Architecture Rules
- All data mutations go through Server Actions (not API routes)
- Use Supabase Row-Level Security — never trust the client
- Financial amounts use DECIMAL(10,2) in database, never floating point
- All timestamps are TIMESTAMPTZ (UTC), displayed in America/New_York
- Every state change writes to audit_log table
- No inline styles — all styling via Tailwind classes
- Components live in /src/components, organized by feature
- Database queries live in /src/lib/db/ — one file per table
- Types generated from Supabase schema via supabase gen types

## Accessibility Requirements (NON-NEGOTIABLE)
- Body text: 18px minimum (text-lg in our Tailwind config)
- Touch targets: 48px minimum height and width
- Primary buttons: 56px height
- Color contrast: 7:1 for body text, 4.5:1 minimum for all text
- All form inputs have visible labels (not placeholder-only)
- All images have alt text
- Focus indicators visible on all interactive elements
- Error messages associated with inputs via aria-describedby
- No color as sole indicator of state — use icons + color + text

## Code Style
- Prefer named exports over default exports
- Use 'use server' directive for all data mutations
- Zod for all form validation (shared between client and server)
- Descriptive variable names — no abbreviations except well-known (id, url, etc.)
- Comments explain WHY, not WHAT
- Each component file < 200 lines — extract sub-components

## Testing
- Playwright for E2E tests on critical flows
- Each sprint has acceptance criteria — write tests for them
- Test on iPhone SE viewport (375px) as minimum

## File Structure
src/
  app/                  # Next.js App Router pages
    (auth)/             # Login, phone verification
    (dashboard)/        # Role-based dashboard
    requisitions/       # Submit, list, detail, approve
    deposits/           # Counter entry, verification
    admin/              # User management, settings
    api/                # Webhook handlers only
  components/
    ui/                 # shadcn/ui components
    requisitions/       # Requisition-specific components
    deposits/           # Deposit-specific components
    dashboard/          # Dashboard widgets
    layout/             # Navigation, shell, headers
  lib/
    db/                 # Database query functions
    auth/               # Auth utilities
    validators/         # Zod schemas
    utils/              # Helpers, formatters
    types/              # Generated + custom TypeScript types
  hooks/                # Custom React hooks
```

### Sprint-by-Sprint Prompting Strategy

For each sprint, create a focused prompt file that Claude Code reads. Structure:

**Phase 1: Plan**
```
Read the spec at docs/technical_specification.md, Sprint [N] section.
Create a detailed implementation plan. List every file that needs to be 
created or modified. For each file, describe what it does in 1-2 sentences. 
Do not write code yet. Output the plan to docs/sprint-[N]-plan.md.
```

**Phase 2: Implement (one component at a time)**
```
Implement [specific component] per the plan in docs/sprint-[N]-plan.md.
Follow the rules in CLAUDE.md. After writing, run the linter and fix issues.
Then run existing tests. Do not proceed if tests fail.
```

**Phase 3: Test**
```
Write Playwright E2E tests for the acceptance criteria in Sprint [N].
Run them. Fix any failures in the code, not by weakening the tests.
```

**Phase 4: Review**
```
Review all files created or modified in Sprint [N]. Check for:
- Accessibility violations (missing labels, small targets, contrast)
- SQL injection or RLS bypass
- Financial calculation using floating point instead of DECIMAL
- Missing audit log entries
- Hardcoded values that should be configurable
Report findings. Fix critical issues.
```

### Critical Claude Code Practices

1. **Start each session with `/clear`.** Context degrades over long sessions. Each task gets a fresh start.
2. **One feature per session.** Don't build the entire requisition module in one session. Build the form, test it, `/clear`, then build the list view.
3. **Feed context before asking for code.** Reference specific files with `@` rather than describing them. Let Claude read the schema, the type definitions, and the adjacent components before writing new ones.
4. **Use the plan-then-execute pattern.** Have Claude write a plan first, review it, then execute. This catches architectural misunderstandings before they propagate.
5. **Run tests after every change.** Set up a PostToolUse hook that runs the linter and type checker after every file edit.
6. **Keep CLAUDE.md updated.** When Claude makes a mistake and you correct it, add the correction to CLAUDE.md so it doesn't repeat.

---

## 6. Deployment Checklist

### Before First Deploy
- [ ] Supabase project on paid plan (Pro — $25/month for production reliability)
- [ ] Vercel project connected to Git repo
- [ ] Environment variables set in Vercel (Supabase URL, anon key, service role key)
- [ ] Google OAuth configured in Supabase with church domain
- [ ] Twilio Verify service configured
- [ ] Custom domain DNS pointing to Vercel
- [ ] SSL certificate active (automatic via Vercel)

### Before Production Launch
- [ ] All RLS policies tested with multiple roles
- [ ] Rate limiting on auth endpoints
- [ ] Image upload size limits enforced (5MB max)
- [ ] CORS configured to allow only production domain
- [ ] Supabase database backups enabled (automatic on Pro plan)
- [ ] Error monitoring configured (Sentry free tier or Vercel Analytics)
- [ ] User accounts created for all initial users
- [ ] Chart of accounts seeded from QuickBooks data
- [ ] Member directory imported for counter pledge tracking
- [ ] Vendor list imported

### Estimated Monthly Costs (Production)

| Service | Tier | Monthly Cost |
|---------|------|-------------|
| Supabase | Pro | $25 |
| Vercel | Free (or Pro if needed) | $0-20 |
| Twilio Verify | Pay as you go | ~$5 |
| Resend (email) | Free tier | $0 |
| Domain (if new subdomain) | Existing | $0 |
| **Total** | | **$30-50/month** |

---

## 7. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| QuickBooks Desktop has no API | Medium | High | Build clean export system; defer direct integration to potential QBO migration |
| Older volunteers struggle with phone interface | High | Medium | User testing in Sprint 9; simplified counter flow; pair tech-savvy person with new users initially |
| Church WiFi unreliable during services | Medium | High | Offline-capable counter module; auto-sync when reconnected |
| Bonnie resistant to workflow change | Low | High | Parallel run period; her workload decreases, not increases; involve her in UAT |
| SMS delivery delays on Sundays | Low | Medium | Allow Google SSO as backup; pre-authenticate counters before service |
| Data loss during entry | Low | High | Auto-save every field change; Supabase real-time sync; local storage backup |

---

*Document prepared April 15, 2026 — to be updated as sprints progress and decisions are made.*
