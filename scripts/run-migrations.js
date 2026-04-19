/**
 * Run pending migrations via Supabase JS client.
 * Usage: node scripts/run-migrations.js
 */
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

async function seedAccounts() {
  // Check if already seeded
  const { count } = await supabase.from('accounts').select('*', { count: 'exact', head: true });
  if (count > 10) {
    console.log(`Accounts: already have ${count} rows, skipping.`);
    return;
  }

  const sqlFile = fs.readFileSync(
    path.join(__dirname, '..', 'supabase', 'migrations', '003_seed_accounts.sql'),
    'utf8'
  );

  // Parse INSERT statements from the SQL file
  const insertRegex = /\('([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*true,\s*(\d+)\)/g;
  const accounts = [];
  let m;
  while ((m = insertRegex.exec(sqlFile)) !== null) {
    accounts.push({
      code: m[1],
      legacy_code: m[2],
      name: m[3],
      entity: m[4],
      category: m[5],
      account_type: m[6],
      is_active: true,
      display_order: parseInt(m[7]),
    });
  }

  console.log(`Accounts: parsed ${accounts.length} from SQL file`);

  // Insert in batches of 50
  for (let i = 0; i < accounts.length; i += 50) {
    const batch = accounts.slice(i, i + 50);
    const { error } = await supabase.from('accounts').upsert(batch, { onConflict: 'code' });
    if (error) {
      console.log(`  ERROR at batch ${i}: ${error.message}`);
    } else {
      console.log(`  Inserted batch ${i}-${i + batch.length}`);
    }
  }

  const { count: finalCount } = await supabase.from('accounts').select('*', { count: 'exact', head: true });
  console.log(`Accounts: now have ${finalCount} rows total`);
}

async function seedVendors() {
  const { count } = await supabase.from('vendors').select('*', { count: 'exact', head: true });
  if (count > 100) {
    console.log(`Vendors: already have ${count} rows, skipping.`);
    return;
  }

  const sqlFile = fs.readFileSync(
    path.join(__dirname, '..', 'supabase', 'migrations', '005_seed_vendors.sql'),
    'utf8'
  );

  // Parse INSERT statements
  const insertRegex = /insert into public\.vendors \(name, phone, email, address, entity, is_active\) values \((.+)\);/g;
  const vendors = [];
  let m;
  while ((m = insertRegex.exec(sqlFile)) !== null) {
    const vals = m[1];
    // Parse the values - they are SQL-escaped strings or null
    const parts = [];
    let current = '';
    let inQuote = false;
    let i = 0;
    while (i < vals.length) {
      if (vals[i] === "'" && !inQuote) {
        inQuote = true;
        i++;
        continue;
      }
      if (vals[i] === "'" && inQuote) {
        if (vals[i + 1] === "'") {
          current += "'";
          i += 2;
          continue;
        }
        inQuote = false;
        parts.push(current);
        current = '';
        i++;
        continue;
      }
      if (vals[i] === ',' && !inQuote) {
        if (current.trim() === 'null') parts.push(null);
        else if (current.trim() === 'true') parts.push(true);
        else if (current.trim() === 'false') parts.push(false);
        current = '';
        i++;
        // skip space after comma
        while (i < vals.length && vals[i] === ' ') i++;
        continue;
      }
      if (inQuote) {
        current += vals[i];
      } else {
        current += vals[i];
      }
      i++;
    }
    // Handle last value
    if (current.trim() === 'null') parts.push(null);
    else if (current.trim() === 'true') parts.push(true);
    else if (current.trim() === 'false') parts.push(false);
    else if (current.trim()) parts.push(current.trim());

    if (parts.length >= 6) {
      vendors.push({
        name: parts[0],
        phone: parts[1],
        email: parts[2],
        address: parts[3],
        entity: parts[4],
        is_active: parts[5] === true || parts[5] === 'true' ? true : !!parts[5],
      });
    }
  }

  console.log(`Vendors: parsed ${vendors.length} from SQL file`);

  // Insert in batches of 100
  let inserted = 0;
  for (let i = 0; i < vendors.length; i += 100) {
    const batch = vendors.slice(i, i + 100);
    const { error } = await supabase.from('vendors').insert(batch);
    if (error) {
      console.log(`  ERROR at batch ${i}: ${error.message}`);
    } else {
      inserted += batch.length;
    }
  }
  console.log(`Vendors: inserted ${inserted} rows`);
}

async function createStorageBucket() {
  // Check if bucket exists
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some(b => b.name === 'attachments');

  if (exists) {
    console.log('Storage: attachments bucket already exists');
    return;
  }

  const { error } = await supabase.storage.createBucket('attachments', {
    public: false,
    fileSizeLimit: 5242880,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/heic', 'image/heif', 'image/webp', 'application/pdf'],
  });

  if (error) console.log('Storage ERROR:', error.message);
  else console.log('Storage: created attachments bucket');
}

async function makeAccountOptional() {
  // We can't ALTER TABLE via the JS client — this needs SQL editor
  // But we can check if it's already nullable
  console.log('Migration 006 (optional account_id): Requires SQL editor or was applied during schema setup.');
  console.log('  Run this in Supabase SQL editor if not done:');
  console.log('  ALTER TABLE public.requisitions ALTER COLUMN account_id DROP NOT NULL;');
}

async function main() {
  console.log('=== Running migrations ===\n');
  await seedAccounts();
  console.log('');
  await createStorageBucket();
  console.log('');
  await seedVendors();
  console.log('');
  await makeAccountOptional();
  console.log('\n=== Done ===');
}

main().catch(e => console.error('FATAL:', e));
