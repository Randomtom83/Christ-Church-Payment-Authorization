-- Migration 003: Seed chart of accounts for both entities
-- Source: Bonnie's QBO exports (April 2026) in docs/FromBonnie/
-- CC uses new 4000/7000-series as code, old 300/400-series as legacy_code
-- NSCC uses existing numbering as code (no renumbering)

begin;

-- ============================================================
-- CHRIST CHURCH — INCOME ACCOUNTS (A. Parish Generated Income)
-- Used by counter module (Sprint 5) for categorizing deposits
-- ============================================================

insert into public.accounts (code, legacy_code, name, entity, category, account_type, is_active, display_order) values
  ('4005', '301',    'Plate',                        'church', 'A. Parish Generated Income', 'income', true, 100),
  ('4010', '310-01', 'Pledges - Current Year',       'church', 'A. Parish Generated Income', 'income', true, 110),
  ('4025', '315-01', 'Christmas',                    'church', 'A. Parish Generated Income', 'income', true, 120),
  ('4030', '315-03', 'Easter',                       'church', 'A. Parish Generated Income', 'income', true, 130),
  ('4035', '315-04', 'Thanksgiving',                 'church', 'A. Parish Generated Income', 'income', true, 140),
  ('4040', '315-07', 'Flower Donations',             'church', 'A. Parish Generated Income', 'income', true, 150),
  ('4045', '315-06', 'Offering',                     'church', 'A. Parish Generated Income', 'income', true, 160),
  ('4050', '315-08', 'Other Contributions',          'church', 'A. Parish Generated Income', 'income', true, 170),
  ('4055', '315-09', 'Memorial Offerings',           'church', 'A. Parish Generated Income', 'income', true, 180),
  ('4058', '315-05', 'Theological Education Offering','church', 'A. Parish Generated Income', 'income', true, 190),
  ('4060', '317',    'Designated Contributions',     'church', 'A. Parish Generated Income', 'income', true, 200),
  ('4065', '319',    'Outreach Contributions',       'church', 'A. Parish Generated Income', 'income', true, 210);

-- ============================================================
-- CHRIST CHURCH — EXPENSE ACCOUNTS
-- Used by requisition form for coding expenses
-- ============================================================

-- A. Clergy Expense
insert into public.accounts (code, legacy_code, name, entity, category, account_type, is_active, display_order) values
  ('7130', '404',    'Auto and Business Expenses',   'church', 'A. Clergy Expense', 'expense', true, 1000),
  ('7135', '404-01', 'Supply & Substitute Priest',   'church', 'A. Clergy Expense', 'expense', true, 1010),
  ('7140', '406',    'Health Insurance',              'church', 'A. Clergy Expense', 'expense', true, 1020),
  ('7145', '428',    'Clergy - Misc.',                'church', 'A. Clergy Expense', 'expense', true, 1030),
  ('7150', '436',    'Continuing Education',          'church', 'A. Clergy Expense', 'expense', true, 1040);

-- B. Building Expense
insert into public.accounts (code, legacy_code, name, entity, category, account_type, is_active, display_order) values
  ('7235', '410-a',  'Replacement and Repair',       'church', 'B. Building Expense', 'expense', true, 2000),
  ('7240', '410-b',  'General Maintenance',          'church', 'B. Building Expense', 'expense', true, 2010),
  ('7245', '410-c',  'Landscaping',                  'church', 'B. Building Expense', 'expense', true, 2020),
  ('7250', '410-01', 'Sexton Substitute',            'church', 'B. Building Expense', 'expense', true, 2030),
  ('7261', '412-02', 'Gas & Electricity - 72 Park',  'church', 'B. Building Expense', 'expense', true, 2040),
  ('7262', '412-04', 'Gas & Electricity - 74 Park',  'church', 'B. Building Expense', 'expense', true, 2050),
  ('7263', '412-05', 'Solar Expense',                'church', 'B. Building Expense', 'expense', true, 2060),
  ('7265', '413',    'Water-Sewer',                  'church', 'B. Building Expense', 'expense', true, 2070),
  ('7271', '414-01', 'Janitorial',                   'church', 'B. Building Expense', 'expense', true, 2080),
  ('7272', '414-02', 'Kitchen',                      'church', 'B. Building Expense', 'expense', true, 2090);

-- C. Administration Expense
insert into public.accounts (code, legacy_code, name, entity, category, account_type, is_active, display_order) values
  ('7340', '423',    'Office Supplies/Expenses',     'church', 'C. Administration Expense', 'expense', true, 3000),
  ('7345', '425',    'Computer Expenses',            'church', 'C. Administration Expense', 'expense', true, 3010),
  ('7350', '426',    'Copier Expenses',              'church', 'C. Administration Expense', 'expense', true, 3020),
  ('7355', '427',    'Telephone/Data',               'church', 'C. Administration Expense', 'expense', true, 3030),
  ('7360', '432',    'Deacon Expenses & Miscellaneous','church','C. Administration Expense', 'expense', true, 3040),
  ('7365', '452',    'Vanco Fees',                   'church', 'C. Administration Expense', 'expense', true, 3050),
  ('7370', '453',    'Audit Fees',                   'church', 'C. Administration Expense', 'expense', true, 3060);

-- D. Outreach Expense
insert into public.accounts (code, legacy_code, name, entity, category, account_type, is_active, display_order) values
  ('7405', '408',    'Diocesan Pledge',              'church', 'D. Outreach Expense', 'expense', true, 4000),
  ('7410', '422-01', 'Outreach - Church',            'church', 'D. Outreach Expense', 'expense', true, 4010),
  ('7415', '422-02', 'Outreach - Local Community',   'church', 'D. Outreach Expense', 'expense', true, 4020),
  ('7420', '422-03', 'Outreach - Rector Disc. Fund', 'church', 'D. Outreach Expense', 'expense', true, 4030);

-- E. Worship Expense
insert into public.accounts (code, legacy_code, name, entity, category, account_type, is_active, display_order) values
  ('7525', '415-a',  'Hired Music',                  'church', 'E. Worship Expense', 'expense', true, 5000),
  ('7530', '415-b',  'Holiday Music',                'church', 'E. Worship Expense', 'expense', true, 5010),
  ('7535', '415-c',  'Sheet Music, Organ Maintenance','church', 'E. Worship Expense', 'expense', true, 5020),
  ('7540', '415-d',  'Organist Substitute',          'church', 'E. Worship Expense', 'expense', true, 5030),
  ('7545', '415-s',  'Music Director Substitute',    'church', 'E. Worship Expense', 'expense', true, 5040),
  ('7550', '416',    'Worship Supplies',             'church', 'E. Worship Expense', 'expense', true, 5050);

-- F. Education Expense
insert into public.accounts (code, legacy_code, name, entity, category, account_type, is_active, display_order) values
  ('7605', '417-01', 'Christian Ed - Sunday School',  'church', 'F. Education Expense', 'expense', true, 6000),
  ('7610', '418',    'Christian Ed - Adult',          'church', 'F. Education Expense', 'expense', true, 6010),
  ('7615', '435',    'Sunday Child Care',             'church', 'F. Education Expense', 'expense', true, 6020);

-- G. Community Building Expense
insert into public.accounts (code, legacy_code, name, entity, category, account_type, is_active, display_order) values
  ('7705', '419',    'Parish Life',                  'church', 'G. Community Building Expense', 'expense', true, 7000),
  ('7715', '420',    'PR & Communication',           'church', 'G. Community Building Expense', 'expense', true, 7010),
  ('7720', '440',    'Conventions/Meetings',         'church', 'G. Community Building Expense', 'expense', true, 7020);

-- ============================================================
-- NSCC — INCOME ACCOUNTS
-- ============================================================

insert into public.accounts (code, legacy_code, name, entity, category, account_type, is_active, display_order) values
  ('N-301', '301',  'Tuition',             'nscc', 'A. Tuition & Fees', 'income', true, 100),
  ('N-302', '302',  'Registration Fees',   'nscc', 'A. Tuition & Fees', 'income', true, 110),
  ('N-303', '303',  'Extended Care',       'nscc', 'A. Tuition & Fees', 'income', true, 120),
  ('N-304', '304',  'Late Fees',           'nscc', 'A. Tuition & Fees', 'income', true, 130),
  ('N-305', '305',  'Investment Income',   'nscc', 'B. Other Income',   'income', true, 200),
  ('N-340', '340',  'Fundraising Income',  'nscc', 'B. Other Income',   'income', true, 210),
  ('N-350', '350',  'Gifts',              'nscc', 'B. Other Income',   'income', true, 220),
  ('N-355', '355',  'Grants Received',     'nscc', 'B. Other Income',   'income', true, 230);

-- ============================================================
-- NSCC — EXPENSE ACCOUNTS
-- ============================================================

-- A. Instruction
insert into public.accounts (code, legacy_code, name, entity, category, account_type, is_active, display_order) values
  ('N-424', '424',  'School Supplies',              'nscc', 'A. Instruction', 'expense', true, 1000),
  ('N-425', '425',  'Lunch/Snacks',                 'nscc', 'A. Instruction', 'expense', true, 1010),
  ('N-433', '433',  'First Aid Expenses',           'nscc', 'A. Instruction', 'expense', true, 1020),
  ('N-439', '439',  'Educational Activities/Events', 'nscc', 'A. Instruction', 'expense', true, 1030),
  ('N-461', '461',  'Music/Spanish',                'nscc', 'A. Instruction', 'expense', true, 1040);

-- C. Infrastructure
insert into public.accounts (code, legacy_code, name, entity, category, account_type, is_active, display_order) values
  ('N-409', '409',  'Insurance',                    'nscc', 'C. Infrastructure', 'expense', true, 3000),
  ('N-410', '410',  'Maintenance',                  'nscc', 'C. Infrastructure', 'expense', true, 3010),
  ('N-411', '411',  'Utilities',                    'nscc', 'C. Infrastructure', 'expense', true, 3020),
  ('N-412', '412',  'Building Usage',               'nscc', 'C. Infrastructure', 'expense', true, 3030),
  ('N-413', '413',  'Copier Expenses',              'nscc', 'C. Infrastructure', 'expense', true, 3040),
  ('N-427', '427',  'Telephone/Data',               'nscc', 'C. Infrastructure', 'expense', true, 3050),
  ('N-428', '428',  'Cleaning & Other Supplies',    'nscc', 'C. Infrastructure', 'expense', true, 3060),
  ('N-443', '443',  'Cleaning Services',            'nscc', 'C. Infrastructure', 'expense', true, 3070),
  ('N-446', '446',  'Security/Fire',                'nscc', 'C. Infrastructure', 'expense', true, 3080);

-- D. Administration
insert into public.accounts (code, legacy_code, name, entity, category, account_type, is_active, display_order) values
  ('N-404', '404',  'Audit Fee',                    'nscc', 'D. Administration', 'expense', true, 4000),
  ('N-407', '407',  'Management Fees',              'nscc', 'D. Administration', 'expense', true, 4010),
  ('N-423', '423',  'Office Supplies & Expenses',   'nscc', 'D. Administration', 'expense', true, 4020),
  ('N-426', '426',  'Payroll Fees',                 'nscc', 'D. Administration', 'expense', true, 4030),
  ('N-442', '442',  'Computer Consultant',          'nscc', 'D. Administration', 'expense', true, 4040),
  ('N-444', '444',  'Credit Card Fees',             'nscc', 'D. Administration', 'expense', true, 4050),
  ('N-445', '445',  'PR/Communications',            'nscc', 'D. Administration', 'expense', true, 4060),
  ('N-447', '447',  'Licenses',                     'nscc', 'D. Administration', 'expense', true, 4070);

-- E. Miscellaneous
insert into public.accounts (code, legacy_code, name, entity, category, account_type, is_active, display_order) values
  ('N-432', '432',  'Miscellaneous Expenses',       'nscc', 'E. Miscellaneous', 'expense', true, 5000),
  ('N-440', '440',  'Fundraising Expenses',         'nscc', 'E. Miscellaneous', 'expense', true, 5010);

commit;
