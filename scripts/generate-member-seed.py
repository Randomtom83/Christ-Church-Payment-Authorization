#!/usr/bin/env python3
"""
Generate 010_seed_members.sql from ACS CSV export.
Usage: python3 scripts/generate-member-seed.py
"""

import csv
import os

CSV_PATH = os.path.join(os.path.dirname(__file__), '..', 'docs', 'FromBonnie', 'ACS - Copy.csv')
OUTPUT = os.path.join(os.path.dirname(__file__), '..', 'supabase', 'migrations', '010_seed_members.sql')


def escape_sql(val):
    if val is None or val.strip() == '':
        return 'null'
    return "'" + val.replace("'", "''") + "'"


def main():
    members = []
    with open(CSV_PATH, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            giving_number = row.get('Giving Number', '').strip()
            name = row.get('Name', '').strip()
            if not name:
                continue

            # Build address from parts
            addr_parts = []
            for key in ['Address 1', 'Address 2', 'City', 'Region', 'PostalCode']:
                val = row.get(key, '').strip()
                if val:
                    addr_parts.append(val)
            address = ', '.join(addr_parts) if addr_parts else None

            email = row.get('Email', '').strip() or None
            phone = row.get('Phone', '').strip() or None

            # Format phone if 10 digits
            if phone and len(phone) == 10 and phone.isdigit():
                phone = f"({phone[:3]}) {phone[3:6]}-{phone[6:]}"

            members.append({
                'giving_number': giving_number,
                'full_name': name,
                'address': address,
                'email': email,
                'phone': phone,
            })

    print(f"Parsed {len(members)} members from ACS CSV")

    lines = [
        "-- Migration 010: Seed full member list from ACS Realm export",
        f"-- Source: docs/FromBonnie/ACS - Copy.csv ({len(members)} members)",
        "-- Replaces the 3-member test seed from Sprint 0",
        "",
        "begin;",
        "",
        "-- Clear test seed data",
        "delete from public.members;",
        "",
        "-- Insert all ACS members",
    ]

    for m in members:
        lines.append(
            f"insert into public.members (giving_number, full_name, address, email, phone, is_active) "
            f"values ({escape_sql(m['giving_number'])}, {escape_sql(m['full_name'])}, "
            f"{escape_sql(m['address'])}, {escape_sql(m['email'])}, {escape_sql(m['phone'])}, true);"
        )

    lines.extend(["", "commit;", ""])

    with open(OUTPUT, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))

    print(f"Wrote {OUTPUT}")


if __name__ == '__main__':
    main()
