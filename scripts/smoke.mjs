#!/usr/bin/env node
/**
 * Smoke test: GET key public routes, expect 200 and HTML.
 * Usage: node scripts/smoke.mjs [baseUrl]
 * Example: node scripts/smoke.mjs https://divine-timing.vercel.app
 */
const base = process.argv[2] || 'http://localhost:3000';
const routes = ['/', '/events', '/media', '/shop', '/cart', '/booking'];

async function run() {
  let failed = 0;
  for (const path of routes) {
    const url = `${base.replace(/\/$/, '')}${path}`;
    try {
      const res = await fetch(url, { redirect: 'follow' });
      const text = await res.text();
      const ok = res.ok && /<!DOCTYPE/i.test(text);
      console.log(ok ? `✓ ${path}` : `✗ ${path} (${res.status})`);
      if (!ok) failed++;
    } catch (e) {
      console.log(`✗ ${path} ${e.message}`);
      failed++;
    }
  }
  // Try one product URL if shop returns HTML (extract first product slug from page)
  try {
    const shopRes = await fetch(`${base.replace(/\/$/, '')}/shop`, { redirect: 'follow' });
    const shopHtml = await shopRes.text();
    const slugMatch = shopHtml.match(/href="\/shop\/([^"/]+)"/);
    if (slugMatch) {
      const productPath = `/shop/${slugMatch[1]}`;
      const prodRes = await fetch(`${base.replace(/\/$/, '')}${productPath}`, { redirect: 'follow' });
      const prodText = await prodRes.text();
      const prodOk = prodRes.ok && /<!DOCTYPE/i.test(prodText);
      console.log(prodOk ? `✓ ${productPath}` : `✗ ${productPath} (${prodRes.status})`);
      if (!prodOk) failed++;
    } else {
      console.log('⊘ /shop/[slug] (no products linked)');
    }
  } catch (e) {
    console.log(`✗ /shop/[slug] ${e.message}`);
  }
  console.log(failed ? `\nFailed: ${failed}` : '\nPassed.');
  process.exit(failed ? 1 : 0);
}

run();
