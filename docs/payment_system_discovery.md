---
file: payment_system_discovery.md
project: Christ Church in Bloomfield & Glen
chat: Church payment authorization and QuickBooks integration
date: 2026-0415
---

# Payment Authorization & Counter Entry System
## Discovery Summary & Requirements Specification

### Document Purpose
This document captures the complete findings from the discovery conversation between Tom Reynolds (Warden) and Claude regarding the modernization of Christ Episcopal Church Bloomfield/Glen Ridge's payment authorization and Sunday collection processes. It serves as the foundation for system design and eventual Claude Code implementation.

---

## 1. Organization Overview

### Entities
The church operates as a **single legal entity** with **two separate bank accounts** and **two separate QuickBooks files**:

| Entity | Bank | QuickBooks File | Fiscal Year |
|--------|------|-----------------|-------------|
| Christ Episcopal Church Bloomfield/Glen Ridge | Blue Foundry Bank (AL102 BF Checking) | Church books | Jan 1 - Dec 31 (canonical requirement) |
| Nursery School of Christ Church (NSCC) | Blue Foundry Bank (AL104 BF Checking) | Separate NSCC books | July 1 - June 30 |

The nursery school is **not a separately incorporated entity** — it is a ministry of the parish operating under the same tax-exempt status. Expenses for both are processed through the same payment authorization workflow.

**Financial Scale (12-month actuals):**
- Church operating income: ~$113,230/year (plus ~$136,000 in NSCC transfers)
- Church operating expenses: ~$298,598/year
- NSCC revenue: ~$522,071/year (annualized from 8 months)
- NSCC expenses: ~$452,353/year (annualized from 8 months)
- Combined: approximately $750K+ in annual expenditures requiring authorization

### Key Financial Relationship
The nursery school transfers surplus funds to the church (~$106K over the 8-month period shown, ~$136K projected annually). These show as:
- NSCC: Account 455 "Transfer to Christ Church"
- Church: Account 363 "Income - Transfer from NSCC"

---

## 2. People & Roles

### Staff (Persistent System Users)
| Name | Title | System Role |
|------|-------|-------------|
| The Rev. Diana Wilcox | Rector | On bank signature card but self-excludes from signing; spiritual authority over building use and programming |
| The Rev. Deacon Jackie McLeod | Deacon | May submit requisitions |
| Bonnie VanOrnum | Director of Finance (Treasurer) | Prepares all payments; enters data into QuickBooks; does NOT sign checks |
| Candice Whitaker | Director of Communications & Family Ministries | Submitter |
| Ryan Bridge | Director of Music | Frequent submitter — recurring musician payments |
| Aazhae Coleman | Nursery School Director | Frequent submitter — recurring school expenses |
| Don Gibson | Sexton | Submitter |

### Authorized Signers (Bank Signature Card)
| Name | Role | Active Signer |
|------|------|---------------|
| Tom Reynolds | Warden | Yes |
| Michelle Ryndak | Warden | Yes |
| Bill Seeman | Vestry | Yes |
| Denise Massay-Williams | Vestry | Yes |
| Leo Toledo | Vestry | Yes |
| The Rev. Diana Wilcox | Rector | Authorized but self-excludes |

**Same five active signers approve expenses for both church and nursery school.**

### Vestry (May submit requisitions)
Tom Reynolds, Michelle Ryndak, Denise Massay-Williams, Carol Madden, Bill Seeman, Leo Toledo, Alex McClean, Laurie Calfo

### Counters
Volunteers (typically 2 per Sunday) who count the offering. May include older, less tech-savvy members. Need the simplest possible interface.

### Occasional Submitters
Any parishioner who spent money on behalf of the church. Temporary/lightweight access needed.

---

## 3. Current Process — Payment Requisitions

### How It Works Today
1. **Paper requisition** is filled out capturing:
   - Who submitted it
   - Amount
   - Which fund/account it draws from
   - Payment method (check or online)
   - Backup documentation (receipt, invoice, PO)
2. Requisition goes to **Bonnie (Treasurer)** who:
   - Prepares a check or pays online
   - Sends the paper form + check to church on Sundays
3. On **Sunday**, two people from the authorized signer list:
   - Review the check and backup documentation
   - Sign both the check and the paper requisition form
4. Signed materials go **back to Bonnie** to mail or distribute

### Approval Thresholds
- **Under $500**: Single signature permitted (dual preferred)
- **$500 and above**: Dual signatures required

### Pain Points Identified
| Problem | Impact |
|---------|--------|
| Paper requisitions | Gets filled out incorrectly; fields in wrong spots; antiquated fields nobody uses |
| Sunday signing bottleneck | Checks pile up waiting for two signers to be physically present |
| Manual data entry | Bonnie re-keys everything from paper into QuickBooks |
| Counter process is slow | No check imaging; paper forms confusing for volunteers |
| Forms have outdated layout | Captures information that's never used; missing fields that are needed |
| No recurring payment templates | Staff re-create the same requisitions monthly (musicians, pizza, etc.) |

---

## 4. Current Process — Sunday Collections

### How It Works Today
1. **Two counters** work together to verify each other
2. They separate offerings into:
   - Pledges (tracked by person — name, address, envelope number, amount)
   - Plate offerings (loose/undesignated)
   - Special/designated donations
3. They:
   - Copy all checks
   - Count cash
   - Fill out bank deposit slips
   - Fill out a paper pledge tracking form
   - Stamp checks with deposit endorsement
4. Everything goes into an **envelope in the safe**
5. Bonnie picks it up on her office day and **manually enters** all data into QuickBooks

### Income Streams
| Source | How It Arrives | Current Recording Method |
|--------|---------------|------------------------|
| Checks (Sunday offering) | Physical in plate | Counters copy, deposit slip, paper forms |
| Cash (Sunday offering) | Physical in plate | Counters count, deposit slip |
| Vanco (electronic giving) | Online/mobile | Bonnie pulls Vanco reports; manual entry to QB |

### Pain Points
- Counting is slow with no technology assistance
- No check imaging (phone camera could capture check images)
- Paper pledge forms are confusing for less sophisticated volunteers
- All data re-keyed manually by Bonnie
- Vanco data not integrated (also manual entry)

---

## 5. Current Technology Landscape

| System | Purpose | Status |
|--------|---------|--------|
| QuickBooks (Desktop or Online — TBD) | Accounting/bookkeeping | Two separate files (church + NSCC) |
| Vanco | Electronic/mobile giving | Active; donors can designate by fund |
| Google Workspace | Email/productivity | Church-wide; basis for SSO |
| Blue Foundry Bank | Banking | Church and NSCC separate checking accounts |
| ACS Realm | Church management | Referenced in expenses ($52-54/month) |

### Critical Open Question
**Is QuickBooks Desktop or Online?** Tom is checking with Bonnie.
- If **Online**: Direct API integration possible — requisition data and counter entries can flow into QuickBooks automatically; Vanco can also auto-sync; bidirectional vendor sync possible
- If **Desktop**: System produces clean digital records and structured exports; Bonnie continues manual entry but from organized digital data instead of paper

---

## 6. Chart of Accounts (From Financial Data)

### Church Income Accounts
| Code | Account | Counter-Relevant |
|------|---------|-----------------|
| 301 | Plate | Yes — loose offerings |
| 310-01 | Pledges - Current Year | Yes — tracked by member |
| 315-01 | Christmas Special Envelope | Yes — seasonal |
| 315-03 | Easter Special Envelope | Yes — seasonal |
| 315-07 | Flower Donations | Yes |
| 315-08 | Other Contributions | Yes |
| 315-09 | Memorial Offerings | Yes |
| 319 | Outreach Contributions | Yes |
| 330 | Interest and Dividends | No — auto from bank |
| 340-30 | Other Users (building rental) | No — separate process |
| 363 | Income - Transfer from NSCC | No — inter-entity |
| 364 | Income for NSCC | Yes — designated giving |

### Church Expense Categories (Requisition Coding)
**A. Clergy Expense**
- 401p Rector Payroll (Gross, FICA Offset, Housing Allowance)
- 403-01 Pensions Clergy
- 404-01 Supply & Substitute Priest
- 406 Health Insurance
- 436 Continuing Education

**B. Building Expense**
- 401b Sexton Payroll
- 409b Insurance - Building (Comprehensive Coverage)
- 410 Maintenance (General, Landscaping)
- 412 Gas & Electricity (72 Park Ave, 74 Park Ave, Solar)
- 413 Water-Sewer

**C. Administration Expense**
- 401a Administrator Payroll
- 409a Insurance - Workers Compensation
- 421 Payroll Service Fees
- 422 Accounting Service Fees / ACS Realm
- 423 Office Supplies/Expenses
- 425 Computer Expenses
- 426 Copier Expenses
- 427 Telephone/Data
- 432 Deacon Expenses & Miscellaneous
- 452 Vanco Fees
- 453 Audit Fees

**D. Outreach Expense**
- 408 Diocesan Pledge
- 422-01 Outreach - Church
- 422-02 Outreach - Investing in Local Community

**E. Worship Expense**
- 401c Choirmaster Payroll
- 415-a Hired Music
- 415-b Holiday Music
- 415-c Sheet Music, Organ Maintenance, Misc
- 415-d Organist costs for users

**F. Education Expense**
- 417-01 Christian Ed - Sunday School
- 418 Christian Ed - Adult
- 435 Sunday Child Care

**G. Community Building Expense**
- 440 Conventions/Meetings

### Nursery School Expense Categories
**A. Instruction** — 401-o Teachers Payroll, 424 School Supplies, 425 Lunch/Snacks, 439 Educational Activities/Events
**B. Personnel** — 403 Pension, 428 Workers' Compensation
**C. Infrastructure** — 409 Insurance, 410 Maintenance, 411 Utilities, 413 Copier, 427 Telephone/Data, 428 Cleaning Supplies, 443 Cleaning Services, 446 Security/Fire
**D. Administration** — 401a Management Payroll, 417 Discounts, 423 Office Supplies, 426 Payroll Fees, 444 CC Fees, 447 Licenses

---

## 7. Refined Process Design

### 7A. Payment Requisition Flow

```
SUBMIT → PREPARE → APPROVE → PROCESS → RECORD
```

**Step 1: SUBMIT (Requester)**
- Staff member opens mobile web app, authenticates via Google SSO
- Occasional submitter uses shared link, authenticates via Google SSO or SMS code
- Fills out digital requisition:
  - Entity: Church or Nursery School
  - Payee name
  - Amount
  - Account code (dropdown from chart of accounts)
  - Description/purpose
  - Payment method: Check or Online
  - Attaches backup: photo of receipt/invoice from phone camera
- **Staff template feature**: Staff can save recurring requisitions as templates (e.g., "Jane Smith - Alto Section Leader - $X - 415a Hired Music - Check") and resubmit with one tap, editing only what changes (date, amount if variable)
- System validates required fields before submission

**Step 2: PREPARE (Bonnie)**
- Bonnie receives notification of new requisition
- Reviews for completeness and correct coding
- Prepares payment (cuts check or initiates online payment)
- Marks requisition as "Prepared" in system
- For checks: enters check number in system

**Step 3: APPROVE (Authorized Signers)**
- System routes based on amount:
  - **Under $500**: One signer required (from: Tom, Michelle, Bill, Denise, Leo)
  - **$500+**: Two signers required
- Signers receive push notification or see pending items on Sunday dashboard
- Signer reviews: amount, payee, account code, backup documentation (all visible on phone)
- Approves or rejects with note
- For physical checks: signer still signs the paper check, but the digital approval creates the audit trail
- Second signer (if required) gets notification after first approval

**Step 4: PROCESS (Bonnie)**
- Fully approved requisitions appear in Bonnie's queue
- Bonnie mails checks or confirms online payments
- Marks requisition as "Paid" with date

**Step 5: RECORD**
- If QuickBooks Online: system pushes transaction data to QB automatically
- If QuickBooks Desktop: system generates clean export/summary for Bonnie's manual entry
- Complete audit trail preserved: who submitted, who approved, when, all backup attached

### 7B. Counter Entry Flow

```
COUNT → ENTER → VERIFY → SUBMIT → RECORD
```

**Step 1: COUNT (Physical)**
- Two counters separate offering as today (pledges, plate, special)
- Count cash by denomination
- Sort and endorse checks

**Step 2: ENTER (Digital — on phone or tablet)**
- Counter logs into mobile web app (Google SSO or SMS code)
- **For each check:**
  - Takes photo of check with phone camera (captures image for records)
  - Enters or confirms amount
  - Selects category: Pledge, Plate, or specific fund
  - For pledges: selects member name from searchable dropdown (pre-loaded member list), amount auto-associated with their pledge record
- **For cash:**
  - Enters total cash amount
  - Selects category (typically Plate)
- **For special/designated:**
  - Enters amount and selects specific fund from dropdown (Altar Flowers, Building Fund, Outreach, etc.)
- System running total updates as entries are made

**Step 3: VERIFY (Second Counter)**
- Second counter reviews the digital entry summary
- Confirms totals match physical count
- Both counters digitally sign off

**Step 4: SUBMIT**
- Deposit summary is finalized and submitted
- Physical deposit materials (checks, cash, deposit slip) still go in the safe for Bonnie
- Bank deposit slip still filled out by hand (unless Blue Foundry supports mobile deposit — worth investigating)

**Step 5: RECORD**
- If QuickBooks Online: deposit data pushes to QB with proper account coding
- If QuickBooks Desktop: clean summary generated for Bonnie's entry
- Check images stored as permanent records
- Pledge payments automatically logged against member pledge commitments

### 7C. Sunday Dashboard

A quick-view screen available to signers on Sundays showing:
- **Checks awaiting signature** — count and total, with ability to tap into each for review
- **Today's deposit summary** — what the counters just entered (totals by category)
- **Running totals** — income received today, payments going out today
- **Pending requisitions** — anything in the queue not yet fully approved

---

## 8. Authentication & Security

### Authentication Methods
| User Type | Method | Rationale |
|-----------|--------|-----------|
| Staff & Vestry | Google SSO (via church Google Workspace) | Already have Google accounts; single sign-on convenience |
| Volunteers without Google | SMS verification code | No password to remember or compromise; phone number as identity |

### Security Requirements
- All data encrypted in transit (HTTPS/TLS)
- Role-based access control:
  - **Submitter**: Can create requisitions, view own submissions
  - **Treasurer**: Can view all requisitions, mark as prepared/paid, access all records
  - **Signer**: Can view and approve/reject requisitions routed to them
  - **Counter**: Can enter deposit data, take check photos, submit deposits
  - **Admin**: Can manage users, roles, templates, chart of accounts
- Audit trail on every action (who, what, when, from what device/IP)
- Check images and receipt photos stored securely
- Session timeouts for inactive users
- No shared passwords or shared accounts

### Role Assignments
| Person | Roles |
|--------|-------|
| Tom Reynolds | Admin, Signer, Submitter |
| Michelle Ryndak | Admin, Signer, Submitter |
| Bonnie VanOrnum | Treasurer, Submitter |
| Bill Seeman | Signer, Submitter |
| Denise Massay-Williams | Signer, Submitter |
| Leo Toledo | Signer, Submitter |
| Mother Diana | Submitter (signer capability available but inactive by choice) |
| Deacon Jackie | Submitter |
| Candice, Ryan, Aazhae, Don | Submitter |
| Counters | Counter role only |
| Occasional submitters | Submitter (temporary/limited) |

---

## 9. System Architecture — High Level

### Platform
- **Mobile-first progressive web app (PWA)** — no app store required; works on any phone browser
- Responsive design that also works on desktop/tablet
- Hosted cloud infrastructure (specifics TBD in implementation spec)

### Core Modules
1. **Requisition Module** — submit, template, route, approve, track
2. **Counter Entry Module** — deposit entry, check imaging, pledge tracking, verification
3. **Dashboard Module** — Sunday snapshot, pending items, running totals
4. **User Management Module** — roles, permissions, Google SSO, SMS auth
5. **Document Storage** — receipt photos, check images, requisition records
6. **Reporting/Export Module** — summaries for Bonnie, audit reports

### Integration Points
| System | Integration | Dependency |
|--------|-------------|------------|
| Google Workspace | SSO authentication | Google OAuth 2.0 |
| SMS Provider (e.g., Twilio) | Verification codes for non-Google users | API key + phone numbers |
| QuickBooks Online (if applicable) | Bidirectional sync — transactions, vendors | QBO API / OAuth |
| QuickBooks Desktop (if applicable) | Export formatted data for manual import | CSV/IIF export generation |
| Vanco | Reporting data pull (future phase) | Vanco reporting API or manual export |
| Blue Foundry Bank | Mobile deposit (if available) | Bank's mobile deposit API or manual |

---

## 10. Open Items & Next Steps

### Must Resolve Before Implementation
| Item | Owner | Status |
|------|-------|--------|
| Confirm QuickBooks Desktop vs. Online | Tom (checking with Bonnie) | OPEN |
| Check if Blue Foundry supports mobile deposit for nonprofits | Tom | OPEN |
| Full chart of accounts export from both QB files | Bonnie | OPEN |
| Confirm Vanco fund categories match QB accounts | Tom/Bonnie | OPEN |
| Member/pledge list for counter module dropdown | Bonnie/Candice | OPEN |
| Identify typical counter volunteers for UX testing | Tom | OPEN |

### Future Phase Considerations
- Vanco integration for automatic recording of electronic gifts
- Pledge management and tracking against committed amounts
- Year-end giving statements
- Budget vs. actual reporting dashboard
- Nursery school tuition tracking (currently separate)
- Migration path from QuickBooks Desktop to Online (if currently Desktop)

### Canonical & Legal Compliance Notes
Per the bylaws research document and Episcopal Canon I.7:
- Annual audit requirement must be maintained — system audit trail supports this
- Dual signature requirement for $500+ is canonical best practice; system enforces this digitally
- All financial records must support the September 1 audit filing deadline
- Fiscal year January 1 for church (nursery school operates July 1)
- Trust fund withdrawals require two signatures regardless of amount
- Bishop and Standing Committee approval required for property transactions (outside this system's scope)

---

*Document prepared April 15, 2026 — to be updated as open items are resolved.*
