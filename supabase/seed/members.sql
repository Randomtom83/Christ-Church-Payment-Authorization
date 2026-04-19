-- Test seed data. Production member list will be imported from ACS export before launch.
-- ACS Realm is the system of record for contributions and pledge tracking.
-- The giving_number column matches ACS's "Giving Number" field.

INSERT INTO members (full_name, giving_number, is_active) VALUES
('Tom Reynolds (Test)', '99', true),
('Test Member Two', '98', true),
('Test Member Three', '97', true);
