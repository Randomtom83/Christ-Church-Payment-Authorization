# Seed Data Notes

## Chart of Accounts

- The church chart of accounts is being renumbered by the Director of Finance (Bonnie VanOrnum)
- The old numbering is 300-series (301, 310, 315, etc.)
- The new numbering is 4000-series (4005, 4010, 4020, etc.)
- **Do NOT seed account data until renumbering is complete**
- When ready, accounts will be imported from the QBO chart of accounts export
- Both `code` (new number) and `legacy_code` (old number) should be populated during the transition
- The NSCC has a separate chart of accounts that will also be imported from its own QBO company

## Members

- `members.sql` contains test seed data only (3 test members)
- Production member list (83 members) will be imported from ACS Realm export before launch
- The `giving_number` column corresponds to ACS's "Giving Number" field

## Vendors

- Church and NSCC vendor lists have been received
- Vendor seed data will be created once the chart of accounts is finalized (vendors reference default accounts)
