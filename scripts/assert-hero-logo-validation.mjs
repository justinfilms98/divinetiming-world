#!/usr/bin/env node
/**
 * Lightweight runtime assertion for hero_logo_url validation behavior.
 * Run: node scripts/assert-hero-logo-validation.mjs
 * Mirrors lib/hero-validation.ts logic so we don't need to build first.
 */
function validateHeroLogoUrl(value) {
  if (value == null || value === '') return null;
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!/^https?:\/\/\S+$/i.test(trimmed)) return undefined;
  return trimmed;
}

const tests = [
  [null, null],
  ['', null],
  ['   ', null],
  ['https://ucarecdn.com/abc', 'https://ucarecdn.com/abc'],
  ['http://example.com/logo.png', 'http://example.com/logo.png'],
  ['not-a-url', undefined],
  [123, undefined],
  [{}, undefined],
];

let failed = 0;
for (const [input, expected] of tests) {
  const got = validateHeroLogoUrl(input);
  const ok = got === expected;
  if (!ok) {
    console.error(`FAIL: validateHeroLogoUrl(${JSON.stringify(input)}) => ${JSON.stringify(got)}, expected ${JSON.stringify(expected)}`);
    failed++;
  }
}
if (failed) {
  console.error(`\n${failed} assertion(s) failed.`);
  process.exit(1);
}
console.log('hero_logo_url validation: all assertions passed.');
