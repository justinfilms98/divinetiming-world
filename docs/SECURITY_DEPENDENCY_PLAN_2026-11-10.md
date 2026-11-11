# Dependency security remediation plan (2026-11-10)

Status: **plan only, nothing upgraded yet.** It starts after the Next.js 16.4.6 security release (`main` c319a7c), which cleared all 39 Next.js advisories.

## Where we are

`npm audit` on `main` c319a7c reports 29 packages (0 critical, 11 high, 16 moderate, 2 low). Those 29 packages carry **64 distinct advisories**; the full list is in the appendix.

- **Runtime packages** ship with the site, in the browser or on the server: 14 packages. Their reachability is assessed below.
- **Development-only packages** are used only by lint, tests and the build tools, and never reach visitors: 15 packages.

How to read "used?":

- **Reachable** means production code calls the vulnerable function with input an outsider could influence.
- **Admin-only** means only a signed-in admin can supply the input.
- **Not reached** means the vulnerable function isn't called by our code paths.

Lowest patched versions were computed against each advisory's affected range, using the published versions on npm on 2026-11-10.

## Approach

Fix one batch at a time, each on its own branch, with its own staging pass and owner approval. Batches 1–3 change runtime packages and batch 4 changes only tooling. **Don't run `npm audit fix --force`.** It proposes downgrading `eslint-config-next` to 15.5.29, which is wrong for Next.js 16.

Except for Tiptap and the dev-only lint tooling, every fix below is a **lockfile-only update within the version ranges already in `package.json`**. Tiptap needs a version bump of its direct packages. Neither involves a new major version of anything we import.

## Batch 1: `sanitize-html` (highest priority)

| | |
|---|---|
| Installed | 2.17.1 (direct, `^2.17.1`) |
| Advisories | 5 moderate XSS: `javascript:` URIs in action/formaction/data/poster/background; SVG SMIL scheme bypass; `</textarea/>` mutation XSS; `nonTextTags` region ending early; `meta http-equiv=refresh` |
| Lowest patched | **2.18.0** fixes all five. Target **2.18.1**, the latest 2.x, which satisfies `^2.17.1` (lockfile-only) |
| Used? | **Admin-only, but output is public.** `lib/sanitize-bio-html.ts` cleans the About bio on save (`/api/admin/about-content`), and the result is rendered on the public About page |
| Exposure today | Our allowlist is strict: `p strong em a ul ol li br img`, attributes `href`/`src`/`alt`, schemes `http`/`https`, and images limited to our storage. That blocks the attribute, SVG and meta vectors. The two parser bugs (mutation XSS and `nonTextTags`) can bypass an allowlist, so they could apply if a malicious bio were saved. Only an admin can save one, so a stolen admin session would be needed first |
| Regression risk | Low. 2.18 tightens parsing; some odd markup may now be dropped |
| Testing | Existing `scripts/assert-bio-sanitize.mjs` and unit tests. Add regression cases for each advisory's proof-of-concept payload. Re-save the current production bio on staging and diff the sanitized output, which must be byte-identical or only safer. Check the public About page renders the same |

## Batch 2: Tiptap / ProseMirror editor (About page editor)

| Package | Installed | Advisories | Lowest patched | Used? |
|---|---|---|---|---|
| `@tiptap/core` | 3.20.0 | moderate XSS / prototype pollution (`mergeAttributes`); high ReDoS (Markdown attribute parsing) | 3.30.4 / **3.30.5**. Target 3.33.1 | Admin-only (browser editor on `/admin/about`) |
| `prosemirror-view` | 1.41.6 | high XSS in paste handling | **1.42.3**. Target 1.42.9 (fits `@tiptap/pm`'s `^1.38.1`) | Admin-only. Pasting crafted HTML from a malicious page could run script in the admin's session |
| `markdown-it` | 14.1.1 | 5 DoS (1 high) | **14.3.3**. Fits `^14` (lockfile-only) | Not reached: pulled in by `prosemirror-markdown`; our editor doesn't parse Markdown |
| `linkify-it` | 5.0.0 | 2 high ReDoS | **5.0.2**. Fits `markdown-it`'s range | Not reached (only via `markdown-it`) |

- **Upgrade:** `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-link` and `@tiptap/extension-image` to 3.33.x together (same major). The ProseMirror and markdown packages come along.
- **Risk:** low to moderate. Tiptap 3.20 → 3.33 covers 13 minor releases. Link and image extension options and the HTML Tiptap generates can change slightly.
- **Testing:**
  - On staging: open `/admin/about`, type, bold, italic, lists, add a link and an image, paste from a web page and from Word, save, reload.
  - Compare the stored HTML before and after (it then passes through batch 1's sanitizer), and check the public About page.

## Batch 3: other runtime dependencies (transitive)

| Package | Installed | Via | Advisories | Lowest patched | Used? |
|---|---|---|---|---|---|
| `ws` | 8.18.3 | `@supabase/realtime-js` (`^8.18.2`) | moderate memory disclosure; high memory-exhaustion DoS | 8.20.1 / **8.21.0**. Target 8.22.x (lockfile-only) | Not reached: the site opens no Realtime channels (no `.channel(` in the code). Only active if Realtime is added later |
| `qs` | 6.14.0 | `stripe` (`^6.11.0`), `googleapis-common` (`^6.7.0`) | 5 DoS (low/moderate) in parse/stringify | **6.16.1**. Target 6.17.1 (lockfile-only) | Server-side, limited: Stripe and Google libraries stringify outgoing requests built by our code. Stripe isn't live yet |
| `gaxios` → `rimraf` → `glob` → `minimatch` 9.0.5 / `brace-expansion` 2.0.2 | 7.1.3 | `googleapis` (Drive and YouTube adapters) | `glob` moderate; `minimatch` 4 high ReDoS; `brace-expansion` 8 high/moderate DoS | **`gaxios` 7.3.1** fits `^7.0.0` and no longer depends on `rimraf`, which removes all four from runtime (lockfile-only). Individually: `minimatch` 9.0.7, `brace-expansion` 2.1.7; `glob` needs 14.0.2 (major), so removing the chain is better | Not reached: these are filesystem helpers inside the HTTP client; our Drive and YouTube calls never glob paths |
| `source-map-js` | 1.2.1 | `postcss` (Next.js build, and `sanitize-html` at runtime) | high DoS via indexed source maps | **1.2.2** (lockfile-only) | Not reached at runtime: `sanitize-html` uses `postcss` only for style attributes (none allowed) and never parses source maps |
| `deepmerge` | 4.3.1 | `sanitize-html` | low prototype poisoning | **No fixed version yet** (4.3.1 is the latest) | Not reached: our sanitizer options are a static object, not user input. Re-check when `sanitize-html` or `deepmerge` publishes |

- **Upgrade:** one lockfile refresh with `npm update ws qs gaxios source-map-js` and check the lockfile diff touches only these, or do it per package if the diff spreads.
- **Risk:** low. All are patch or minor updates within declared ranges.
- **Testing:**
  - Full test suite and build.
  - Staging: Google Drive asset listing and import in admin integrations; YouTube adapter in the content inbox (if enabled); Stripe checkout session creation in test mode once Stripe is configured; normal sign-in (`@supabase/realtime-js` loads with the client).

## Batch 4: development-only tooling

| Package | Installed | Advisories | Lowest patched | Notes |
|---|---|---|---|---|
| `vite` | 8.2.1 | 6 (command injection on Windows via `launch-editor`, dev-server file exposure) | **8.2.4** | Only the local Vitest/dev server; most relevant on Windows dev machines |
| `vitest`, `@vitest/mocker` | 4.1.10 | path traversal, mock-registration code injection | **4.1.12** | Test runner only |
| `flatted` | 3.3.3 | high DoS, prototype pollution | **3.4.2** | ESLint cache |
| `js-yaml` | 4.1.1 | 4 DoS | **4.3.2** | ESLint config loading |
| `ajv` | 6.12.6 | ReDoS with `$data` | **6.14.0** | ESLint |
| `@humanfs/node` | 0.16.7 | symlink copy | **0.16.8** | ESLint |
| `diff` | 4.0.2 | DoS | **4.0.4** | `ts-node` |
| `minimatch` 3.1.2 / 10.2.6, `brace-expansion` 1.1.12 / 5.0.12 | | ReDoS / DoS | 3.1.4, 1.1.21; 10.2.6 needs 11.0.1 (major) | ESLint and `@typescript-eslint` |
| `typescript-eslint` family, `eslint-config-next` | 8.72.2 / 16.4.6 | inherited from `minimatch` 10 | Needs a `typescript-eslint` release that moves to `minimatch` ≥ 11 | Wait for upstream. Not fixable by us without `--force` downgrades |

- **Upgrade:** `npm update` for the dev tree. `vitest` 4.1.12 is a patch release; don't move to Vitest 5 in this batch.
- **Risk:** very low for the site. Lint results may shift, so compare against `docs/LINT_BASELINE_2026-11-10.md`.
- **Testing:** `npm test`, `npx tsc --noEmit`, `npx eslint`, `next build`. No staging pass is needed, because nothing ships.

## Order and effort

1. Batch 1: about half a day including staging.
2. Batch 2: about 1 day.
3. Batch 3: about half a day.
4. Batch 4: about 2 hours, any time.

Each batch gets its own approval. Batches 1 and 2 touch the same About-page flow, so they could share one staging session, but they keep separate commits so either can be reverted.

## Appendix: every remaining advisory (`npm audit`, `main` c319a7c, 2026-11-10)

"Where" splits packages that have both runtime and dev copies. "Fixed in" is installed version → lowest published fixed version in the same major line, marked "(major)" if only a new major version fixes it.

| # | Package (installed) | Where | Severity | Type | Advisory | Fixed in |
|---|---|---|---|---|---|---|
| 1 | `@humanfs/node` | dev only | moderate | path traversal | [humanfs: Recursive copy follows symlinked files and copies data from outside the source tr](https://github.com/advisories/GHSA-p498-v437-472g) | 0.16.7 → 0.16.8 |
| 2 | `@tiptap/core` | runtime | moderate | XSS, prototype pollution | [Tiptap: mergeAttributes() turns an own __proto__ key into inherited executable DOM attribu](https://github.com/advisories/GHSA-cp6q-959q-f8rh) | 3.20.0 → 3.30.4 |
| 3 | `@tiptap/core` | runtime | high | denial of service, ReDoS | [Tiptap: Quadratic ReDoS in block and inline Markdown attribute parsing](https://github.com/advisories/GHSA-j95f-988m-3j2f) | 3.20.0 → 3.30.5 |
| 4 | `@vitest/mocker` | dev only | moderate | path traversal | [Vitest: Path Traversal / Arbitrary File Read via @vitest/mocker Redirect Mock](https://github.com/advisories/GHSA-82fw-gwwq-j7x9) | 4.1.10 → 4.1.11 |
| 5 | `@vitest/mocker` | dev only | moderate | code injection | [Vitest: Code injection via unauthenticated manual mock registration](https://github.com/advisories/GHSA-qxg6-89mg-rqv8) | 4.1.10 → 4.1.12 |
| 6 | `ajv` | dev only | moderate | denial of service, ReDoS | [ajv has ReDoS when using '$data' option](https://github.com/advisories/GHSA-2g4f-4pwh-qvx6) | 6.12.6 → 6.14.0 |
| 7 | `brace-expansion` | dev 1.1.12 | moderate | denial of service | [brace-expansion: Zero-step sequence causes process hang and memory exhaustion](https://github.com/advisories/GHSA-f886-m6hf-6m8v) | 1.1.12 → 1.1.13 |
| 8 | `brace-expansion` | runtime 2.0.2 | moderate | denial of service | [brace-expansion: Zero-step sequence causes process hang and memory exhaustion](https://github.com/advisories/GHSA-f886-m6hf-6m8v) | 2.0.2 → 2.0.3 |
| 9 | `brace-expansion` | runtime 2.0.2 | high | denial of service, denial of service (CPU) | [brace-expansion: DoS via exponential-time expansion of consecutive non-expanding {} groups](https://github.com/advisories/GHSA-3jxr-9vmj-r5cp) | 2.0.2 → 2.1.2 |
| 10 | `brace-expansion` | dev 1.1.12 | high | denial of service, denial of service (CPU) | [brace-expansion: DoS via exponential-time expansion of consecutive non-expanding {} groups](https://github.com/advisories/GHSA-3jxr-9vmj-r5cp) | 1.1.12 → 1.1.16 |
| 11 | `brace-expansion` | dev 1.1.12 | high | denial of service, denial of service (memory) | [brace-expansion: DoS via unbounded expansion length causing an out-of-memory process crash](https://github.com/advisories/GHSA-mh99-v99m-4gvg) | 1.1.12 → 1.1.17 |
| 12 | `brace-expansion` | runtime 2.0.2 | high | denial of service, denial of service (memory) | [brace-expansion: DoS via unbounded expansion length causing an out-of-memory process crash](https://github.com/advisories/GHSA-mh99-v99m-4gvg) | 2.0.2 → 2.1.3 |
| 13 | `brace-expansion` | runtime 2.0.2 | high | denial of service, denial of service (memory) | [brace-expansion: DoS via unbounded intermediate arrays, bypassing the CVE-2026-14257 mitig](https://github.com/advisories/GHSA-rgw5-rvv9-x895) | 2.0.2 → 2.1.4 |
| 14 | `brace-expansion` | dev 1.1.12 | high | denial of service, denial of service (memory) | [brace-expansion: DoS via unbounded intermediate arrays, bypassing the CVE-2026-14257 mitig](https://github.com/advisories/GHSA-rgw5-rvv9-x895) | 1.1.12 → 1.1.18 |
| 15 | `brace-expansion` | dev 1.1.12 | moderate | denial of service, denial of service (CPU) | [brace-expansion: Quadratic-time expansion of the '{a},b}' rewrite causes CPU denial of ser](https://github.com/advisories/GHSA-q2hr-2g5m-vwhr) | 1.1.12 → 1.1.21 |
| 16 | `brace-expansion` | runtime 2.0.2 | moderate | denial of service, denial of service (CPU) | [brace-expansion: Quadratic-time expansion of the '{a},b}' rewrite causes CPU denial of ser](https://github.com/advisories/GHSA-q2hr-2g5m-vwhr) | 2.0.2 → 2.1.7 |
| 17 | `brace-expansion` | dev 1.1.12 | high | denial of service, denial of service (recursion) | [brace-expansion: DoS via uncontrolled recursion on nested brace groups causing stack exhau](https://github.com/advisories/GHSA-qhr7-859c-m2p7) | 1.1.12 → 1.1.20 |
| 18 | `brace-expansion` | runtime 2.0.2 | high | denial of service, denial of service (recursion) | [brace-expansion: DoS via uncontrolled recursion on nested brace groups causing stack exhau](https://github.com/advisories/GHSA-qhr7-859c-m2p7) | 2.0.2 → 2.1.6 |
| 19 | `brace-expansion` | dev 1.1.12 | high | denial of service, denial of service (recursion) | [brace-expansion: DoS via uncontrolled recursion in parseCommaParts causing stack exhaustio](https://github.com/advisories/GHSA-6j4f-fj2g-mc7p) | 1.1.12 → 1.1.19 |
| 20 | `brace-expansion` | runtime 2.0.2 | high | denial of service, denial of service (recursion) | [brace-expansion: DoS via uncontrolled recursion in parseCommaParts causing stack exhaustio](https://github.com/advisories/GHSA-6j4f-fj2g-mc7p) | 2.0.2 → 2.1.5 |
| 21 | `deepmerge` | runtime | low | prototype pollution | [deepmerge mergeObject() allows prototype poisoning of returned objects](https://github.com/advisories/GHSA-gcqx-w48m-w2h4) | 4.3.1 → none yet |
| 22 | `diff` | dev only | low | denial of service, ReDoS | [jsdiff has a Denial of Service vulnerability in parsePatch and applyPatch](https://github.com/advisories/GHSA-73rr-hh4g-fpgx) | 4.0.2 → 4.0.4 |
| 23 | `flatted` | dev only | high | denial of service (recursion) | [flatted vulnerable to unbounded recursion DoS in parse() revive phase](https://github.com/advisories/GHSA-25h7-pfq9-p65f) | 3.3.3 → 3.4.0 |
| 24 | `flatted` | dev only | high | prototype pollution | [Prototype Pollution via parse() in NodeJS flatted](https://github.com/advisories/GHSA-rf6f-7fwh-wjgh) | 3.3.3 → 3.4.2 |
| 25 | `glob` | runtime | moderate | denial of service | [Glob: AbortSignal cancellation bypass allows post-timeout filesystem traversal](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4) | 10.5.0 → 14.0.2 (major) |
| 26 | `js-yaml` | dev only | moderate | denial of service (CPU) | [JS-YAML: Quadratic-complexity DoS in merge key handling via repeated aliases](https://github.com/advisories/GHSA-h67p-54hq-rp68) | 4.1.1 → 4.2.0 |
| 27 | `js-yaml` | dev only | high | denial of service, denial of service (CPU) | [js-yaml: YAML merge-key chains can force quadratic CPU consumption](https://github.com/advisories/GHSA-52cp-r559-cp3m) | 4.1.1 → 4.3.0 |
| 28 | `js-yaml` | dev only | high | denial of service (CPU) | [JS-YAML: Quadratic CPU consumption in !!omap resolution (3.x and 4.x) — CVE-2026-59870 fix](https://github.com/advisories/GHSA-5p4m-2wfm-xmqj) | 4.1.1 → 4.3.1 |
| 29 | `js-yaml` | dev only | high | denial of service, denial of service (CPU) | [js-yaml: maxTotalMergeKeys does not limit CPU use for empty merge sources](https://github.com/advisories/GHSA-2883-xcg3-v3hh) | 4.1.1 → 4.3.2 |
| 30 | `linkify-it` | runtime | high | ReDoS | [LinkifyIt#match scan loop has quadratic algorithmic complexity](https://github.com/advisories/GHSA-22p9-wv53-3rq4) | 5.0.0 → 5.0.1 |
| 31 | `linkify-it` | runtime | high | denial of service (CPU) | [linkify-it: Quadratic-complexity DoS via the 'mailto:' validator scan-loop on attacker tex](https://github.com/advisories/GHSA-v245-v573-v5vm) | 5.0.0 → 5.0.2 |
| 32 | `markdown-it` | runtime | moderate | denial of service, denial of service (CPU) | [markdown-it: Quadratic complexity DoS in smartquotes rule via replaceAt string operations](https://github.com/advisories/GHSA-6v5v-wf23-fmfq) | 14.1.1 → 14.2.0 |
| 33 | `markdown-it` | runtime | high | denial of service, denial of service (CPU) | [markdown-it: Quadratic complexity in smartquotes with unmatched closing quotes](https://github.com/advisories/GHSA-r7fv-28h4-cvq7) | 14.1.1 → 14.3.2 |
| 34 | `markdown-it` | runtime | low | denial of service, denial of service (CPU) | [markdown-it: Quadratic-time denial of service in inline HTML parsing with html enabled](https://github.com/advisories/GHSA-vfgh-jcmw-g37q) | 14.1.1 → 14.3.3 |
| 35 | `markdown-it` | runtime | high | denial of service, denial of service (CPU) | [markdown-it: Quadratic-time rendering of a single multi-line link reference definition wit](https://github.com/advisories/GHSA-gfr2-rv44-r23c) | 14.1.1 → 14.3.3 |
| 36 | `markdown-it` | runtime | moderate | denial of service, denial of service (CPU) | [markdown-it linkify: true has two quadratic paths, so a few hundred KB of markdown blocks ](https://github.com/advisories/GHSA-253c-mchw-3w2r) | 14.1.1 → 14.3.1 |
| 37 | `minimatch` | dev 3.1.2 | high | ReDoS | [minimatch has a ReDoS via repeated wildcards with non-matching literal in pattern](https://github.com/advisories/GHSA-3ppc-4f35-3m26) | 3.1.2 → 3.1.3 |
| 38 | `minimatch` | runtime 9.0.5 | high | ReDoS | [minimatch has a ReDoS via repeated wildcards with non-matching literal in pattern](https://github.com/advisories/GHSA-3ppc-4f35-3m26) | 9.0.5 → 9.0.6 |
| 39 | `minimatch` | dev 3.1.2 | high | denial of service (CPU) | [minimatch has ReDoS: matchOne() combinatorial backtracking via multiple non-adjacent GLOBS](https://github.com/advisories/GHSA-7r86-cg39-jmmj) | 3.1.2 → 3.1.3 |
| 40 | `minimatch` | runtime 9.0.5 | high | denial of service (CPU) | [minimatch has ReDoS: matchOne() combinatorial backtracking via multiple non-adjacent GLOBS](https://github.com/advisories/GHSA-7r86-cg39-jmmj) | 9.0.5 → 9.0.7 |
| 41 | `minimatch` | dev 3.1.2 | high | ReDoS | [minimatch ReDoS: nested *() extglobs generate catastrophically backtracking regular expres](https://github.com/advisories/GHSA-23c5-xmqv-rm74) | 3.1.2 → 3.1.4 |
| 42 | `minimatch` | runtime 9.0.5 | high | ReDoS | [minimatch ReDoS: nested *() extglobs generate catastrophically backtracking regular expres](https://github.com/advisories/GHSA-23c5-xmqv-rm74) | 9.0.5 → 9.0.7 |
| 43 | `minimatch` | dev 10.2.6, runtime 9.0.5 | moderate | denial of service | [minimatch has potential denial of service via globparts amplification](https://github.com/advisories/GHSA-g3hv-75wg-m249) | 10.2.6 → 11.0.1 (major); 9.0.5 → 11.0.1 (major) |
| 44 | `prosemirror-view` | runtime | high | XSS | [ProseMirror has a XSS vulnerability in prosemirror-view's paste handling](https://github.com/advisories/GHSA-c8x8-7fp4-3x9w) | 1.41.6 → 1.42.3 |
| 45 | `qs` | runtime | low | input validation (DoS) | [qs's arrayLimit bypass in comma parsing allows denial of service](https://github.com/advisories/GHSA-w7fw-mjwx-w883) | 6.14.0 → 6.14.2 |
| 46 | `qs` | runtime | moderate | input validation (DoS) | [qs's arrayLimit bypass in its bracket notation allows DoS via memory exhaustion](https://github.com/advisories/GHSA-6rw7-vpxm-498p) | 6.14.0 → 6.14.1 |
| 47 | `qs` | runtime | moderate | crash (DoS) | [qs has a remotely triggerable DoS: qs.stringify crashes with TypeError on null/undefined e](https://github.com/advisories/GHSA-q8mj-m7cp-5q26) | 6.14.0 → 6.15.2 |
| 48 | `qs` | runtime | moderate | crash (DoS) | [qs: Denial of Service via Attacker Controlled isBuffer](https://github.com/advisories/GHSA-4mjr-xmp4-gh2g) | 6.14.0 → 6.16.0 |
| 49 | `qs` | runtime | moderate | crash (DoS) | [qs : qs.stringify with arrayFormat 'comma' throws an uncaught TypeError on array elements ](https://github.com/advisories/GHSA-6pq8-jhm2-2vcw) | 6.14.0 → 6.16.1 |
| 50 | `sanitize-html` | runtime | moderate | XSS | [sanitize-html has incomplete URI scheme validation in that allows javascript: URIs through](https://github.com/advisories/GHSA-vccv-cmxp-4j9h) | 2.17.1 → 2.17.5 |
| 51 | `sanitize-html` | runtime | moderate | XSS | [ApostropheCMS: Stored XSS via SVG SMIL URI-list scheme-policy bypass](https://github.com/advisories/GHSA-g8qq-57p8-ggw5) | 2.17.1 → 2.17.7 |
| 52 | `sanitize-html` | runtime | moderate | XSS | [ApostropheCMS: Mutation-XSS / allowedTags bypass via literal '</textarea/>' solidus close](https://github.com/advisories/GHSA-jxwj-j7wr-gfrw) | 2.17.1 → 2.17.6 |
| 53 | `sanitize-html` | runtime | moderate | XSS | [ApostropheCMS sanitize-html: nonTextTags discard region ends early on an implied close, le](https://github.com/advisories/GHSA-x3q4-9hxx-gx8m) | 2.17.1 → 2.18.0 |
| 54 | `sanitize-html` | runtime | moderate | XSS | [ApostropheCMS: Incomplete CVE-2026-53606: 'meta http-equiv=refresh' 'content' still ships ](https://github.com/advisories/GHSA-cv27-6wvh-8x7j) | 2.17.1 → 2.18.0 |
| 55 | `source-map-js` | runtime | high | denial of service | [source-map-js allows event-loop denial of service through indexed source-map section offse](https://github.com/advisories/GHSA-68fv-2mgg-jv7q) | 1.2.1 → 1.2.2 |
| 56 | `vite` | dev only | moderate | command injection | [launch-editor: escapeCmdArgs() omits % escaping on Windows](https://github.com/advisories/GHSA-698v-4r3x-3vcv) | 8.2.1 → 8.2.4 |
| 57 | `vite` | dev only | moderate | argument injection | [launch-editor: Editor CLI flag misinterpretation causing arbitrary command execution for s](https://github.com/advisories/GHSA-r825-w8mm-5pxw) | 8.2.1 → 8.2.4 |
| 58 | `vite` | dev only | high | command injection | [launch-editor: 'fs.existsSync()' existence check can be bypassed on Windows](https://github.com/advisories/GHSA-587h-7wmj-h5pm) | 8.2.1 → 8.2.4 |
| 59 | `vite` | dev only | low | script injection | [Vite: Cross origin script execution through Vite custom middleware](https://github.com/advisories/GHSA-9jrq-w75r-8gcw) | 8.2.1 → 8.2.4 |
| 60 | `vite` | dev only | moderate | path traversal, access control | [Vite: Files outside 'server.fs.allow' could be served when project paths match system path](https://github.com/advisories/GHSA-rq7h-c2jc-7f22) | 8.2.1 → 8.2.4 |
| 61 | `vite` | dev only | moderate | path traversal, information disclosure | [Vite: First 4 bytes of files outside of 'server.fs' setting is exposed by '?vite-wasm-inst](https://github.com/advisories/GHSA-vfpm-58rq-9qcg) | 8.2.1 → 8.2.4 |
| 62 | `vitest` | dev only | moderate | path traversal | [Vitest: Path Traversal / Arbitrary File Read via @vitest/mocker Redirect Mock](https://github.com/advisories/GHSA-82fw-gwwq-j7x9) | 4.1.10 → 4.1.11 |
| 63 | `ws` | runtime | moderate | memory disclosure | [ws: Uninitialized memory disclosure](https://github.com/advisories/GHSA-58qx-3vcg-4xpx) | 8.18.3 → 8.20.1 |
| 64 | `ws` | runtime | high | denial of service, denial of service (memory) | [ws: Memory exhaustion DoS from tiny fragments and data chunks](https://github.com/advisories/GHSA-96hv-2xvq-fx4p) | 8.18.3 → 8.21.0 |
