#!/usr/bin/env node
/**
 * Phase 30J-F: Supabase inventory runner.
 * 1) Prints instructions and writes inventory_queries.sql path.
 * 2) Does NOT run destructive SQL.
 * 3) If supabase/inventory_output.txt exists, parses and suggests safe-to-uncomment drops.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const root = join(__dirname, '..');
const outputPath = join(root, 'supabase', 'inventory_output.txt');
const queriesPath = join(root, 'supabase', 'inventory_queries.sql');

const CODE_REFERENCED_TABLES = new Set([
  'admin_users', 'analytics_events', 'about_content', 'about_photos', 'about_timeline',
  'booking_content', 'booking_inquiries', 'events', 'external_media_assets', 'gallery_media',
  'galleries', 'hero_sections', 'media_carousel_slides', 'order_items', 'orders', 'page_settings',
  'presskit', 'product_images', 'products', 'product_variants', 'site_settings', 'videos',
]);

function main() {
  console.log('Supabase inventory (Phase 30J-F)\n');
  console.log('1. Run the read-only queries in Supabase SQL Editor:');
  console.log('   File: supabase/inventory_queries.sql');
  console.log('   Dashboard → SQL Editor → paste → Run');
  console.log('');
  console.log('2. Copy the full result set (all sections) and save to:');
  console.log('   supabase/inventory_output.txt');
  console.log('');
  console.log('3. Run this script again after saving the output to get safe-to-uncomment suggestions.\n');

  if (!existsSync(outputPath)) {
    const placeholder = `# Supabase inventory output
# Paste here the full text output from running supabase/inventory_queries.sql in Supabase SQL Editor.
# Then run: node scripts/supabase-inventory.mjs
# This file will be parsed to suggest safe-to-uncomment DROP lines for 019_phase30i_cleanup_audit.sql Section 3.
`;
    writeFileSync(outputPath, placeholder, 'utf8');
    console.log('Created supabase/inventory_output.txt (placeholder). Replace with actual query output.\n');
    return;
  }

  const content = readFileSync(outputPath, 'utf8');
  if (content.startsWith('#') || content.includes('Paste here')) {
    console.log('inventory_output.txt still contains placeholder. Replace with actual SQL output and re-run.\n');
    return;
  }

  const zeroRowTables = [];
  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    const parts = line.split(/\|/).map((p) => p.trim());
    if (parts.length >= 2) {
      const first = parts[0];
      const last = parts[parts.length - 1];
      if (last === '0' && /^[a-z_]+$/.test(first) && first.length > 0) {
        if (!CODE_REFERENCED_TABLES.has(first)) zeroRowTables.push(first);
      }
    }
  }
  const unique = [...new Set(zeroRowTables)];

  console.log('--- Safe-to-uncomment suggestions (Section 3 of 019_phase30i_cleanup_audit.sql) ---\n');
  if (unique.length === 0) {
    console.log('No 0-row tables found that are outside the code-referenced list.');
    console.log('Destructive Section 3 should remain commented.\n');
    return;
  }
  console.log('Tables with 0 rows that are NOT in code-referenced list (confirm before uncommenting):');
  unique.forEach((t) => console.log('  -', t));
  console.log('\nTo remove one, add to Section 3 (still commented):');
  console.log('  -- DROP TABLE IF EXISTS public.<table_name>;');
  console.log('Then after manual confirmation, uncomment that line only.\n');
}

main();
