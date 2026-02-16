#!/usr/bin/env node
/**
 * Phase 30J-A: Admin "no-legacy" proof.
 * Fails (exit 1) if any legacy admin routes/components exist or if code links to removed routes.
 * Allowed admin routes: /admin, /admin/media, /admin/events, /admin/shop, /admin/settings only.
 */

import { existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const root = join(__dirname, '..');

const legacyPaths = [
  'app/admin/heroes',
  'app/admin/pages',
  'app/admin/homepage',
  'app/admin/orders',
  'components/admin/Uploader.tsx',
];

const forbiddenHrefs = ['/admin/heroes', '/admin/pages', '/admin/homepage', '/admin/orders'];
const allowedRoutes = ['/admin', '/admin/media', '/admin/events', '/admin/shop', '/admin/settings'];

function checkPaths() {
  const found = [];
  for (const p of legacyPaths) {
    const full = join(root, p);
    if (existsSync(full)) {
      found.push(p);
    }
  }
  return found;
}

function checkHrefs() {
  const extensions = ['.tsx', '.ts', '.jsx', '.js'];
  const found = [];
  function scan(dir) {
    try {
      const entries = readdirSync(dir, { withFileTypes: true });
      for (const e of entries) {
        const full = join(dir, e.name);
        if (e.name === 'node_modules' || e.name === '.next' || e.name === '.git') continue;
        if (e.isDirectory()) {
          scan(full);
          continue;
        }
        if (!extensions.some((ext) => e.name.endsWith(ext))) continue;
        const content = readFileSync(full, 'utf8');
        for (const href of forbiddenHrefs) {
          const hasLink = content.includes(`"${href}"`) || content.includes(`'${href}'`) || content.includes(`${href}\``);
          if (hasLink) found.push({ file: full.replace(root, '').replace(/^\//, ''), href });
        }
      }
    } catch (_) {}
  }
  scan(root);
  return found;
}

const pathViolations = checkPaths();
const hrefViolations = checkHrefs();

if (pathViolations.length > 0 || hrefViolations.length > 0) {
  console.error('admin-audit: FAIL — legacy admin artifacts found.\n');
  if (pathViolations.length > 0) {
    console.error('Legacy paths (must be removed):');
    pathViolations.forEach((p) => console.error('  -', p));
    console.error('');
  }
  if (hrefViolations.length > 0) {
    console.error('Forbidden links to removed routes:');
    hrefViolations.forEach(({ file, href }) => console.error('  -', file, '→', href));
    console.error('');
  }
  process.exit(1);
}

console.log('admin-audit: OK — no legacy admin routes or components.');
console.log('Allowed admin routes:', allowedRoutes.join(', '));
process.exit(0);
