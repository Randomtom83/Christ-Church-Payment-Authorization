/**
 * Project-wide constants. Change here, never hardcode.
 *
 * Source: docs/CLAUDE.md "Common Mistakes to Avoid #5" — the $500 dual-approval
 * threshold is canonical policy and must live in exactly one place.
 */

/** Requisitions at or above this dollar amount need TWO different signers. */
export const DUAL_APPROVAL_THRESHOLD = 500;

/** Display timezone for all date formatting (CLAUDE.md → Timestamps). */
export const APP_TIMEZONE = "America/New_York";

/** App identity. */
export const APP_NAME = "ChurchOps";
export const APP_DESCRIPTION =
  "Payment authorization & Sunday counter entry for Christ Episcopal Church Bloomfield/Glen Ridge.";

/** The two entities sharing this platform. Same legal org, separate books. */
export const ENTITIES = [
  {
    code: "church",
    name: "Christ Episcopal Church",
    bankAccount: "Blue Foundry — AL102",
    qbFile: "Church books",
    fiscalYear: "Jan–Dec",
  },
  {
    code: "nscc",
    name: "Nursery School of Christ Church",
    bankAccount: "Blue Foundry — AL104",
    qbFile: "NSCC books",
    fiscalYear: "Jul–Jun",
  },
] as const;

export type EntityCode = (typeof ENTITIES)[number]["code"];

/** Full role list. Roles are stored as a text[] on profiles. */
export const ROLES = [
  "submitter",
  "treasurer",
  "signer",
  "counter",
  "admin",
] as const;

export type Role = (typeof ROLES)[number];

/** Requisition status state machine.
 *  submitted → pending_approval → approved → paid
 *  submitted → returned → (submitter edits) → submitted
 *  submitted → cancelled (by submitter)
 *  (rejected may occur at pending_approval — Sprint 4) */
export const REQUISITION_STATUSES = [
  "submitted",
  "returned",
  "pending_approval",
  "approved",
  "paid",
  "recorded",
  "rejected",
  "cancelled",
] as const;

export type RequisitionStatus = (typeof REQUISITION_STATUSES)[number];

/** Deposit status state machine. */
export const DEPOSIT_STATUSES = [
  "in_progress",
  "pending_verification",
  "verified",
  "recorded",
] as const;

export type DepositStatus = (typeof DEPOSIT_STATUSES)[number];
