# STATUS.md

Last updated: 2026-10-25

## What was built

**Actually Free to Learn** — a static, local-first web directory of genuinely free
learning resources, maintained by **Asdale Dynamics, LLC**. A cousin of The Massive AI
Manual's tone especially relevant to the directory: plain English, honest about limits.

- `index.html` — the entire app in one file (no CDNs, no external fonts/scripts):
  - Card grid driven entirely by `data.json` (via generated `data.js`).
    30 entries across 6 categories: full courses, free certificates, open
    textbooks, lecture archives, language learning, gentle coding walks.
  - Each card shows: what you learn, what's actually free, time needed, honest
    limits, tags, plus card-flavored "verified free on … / check again by …" dates.
  - Category filter chips and keyword search (matches titles, providers,
    descriptions, tags). Count line and graceful empty state.
  - Entries with a past "check again by" date self-flag with an amber
    "time to re-verify — details may be out of date" note.
  - No affiliate links; all links https-only with `rel="noopener"`.
  - Works offline by double-clicking the file (`file://`), because data is loaded
    from a sibling script file instead of a `fetch()`.
- `data.json` — single source of truth (30 entries, full schema with
  `verifiedFreeOn` / `recheckBy` dates).
- `data.js` — generated from `data.json` by `scripts/build.js` (never edited by hand).
- `scripts/build.js` — regenerates `data.js` from `data.json`.
- `scripts/test.js` — validates JSON schema, unique ids, category integrity,
  https-only links, affiliate/tracking-parameter ban (Amazon tags, `utm_`,
  affiliate params, link shorteners), date sanity/ordering, overdue-recheck
  reporting, and `data.js`↔`data.json` sync.
- `scripts/smoke-test.js` — headless render test using jsdom (dev dependency).
- `README.md` — maintenance manual (schema, workflow, house rules).
- `LICENSE` — MIT. `Copyright (c) 2026 Asdale Dynamics, LLC`.
- `package.json` — `npm run build` and `npm test` (no runtime dependencies).

## How to run it

- **Use it:** open `index.html` in any browser — no server needed, works offline.
- **Edit data:** change `data.json` → run `npm run build` → run `npm test`
  and `node scripts/smoke-test.js`.
- **Optional serve:** any static server (`npx serve`) also works, but is not required.

## Verification results (2026-10-25)

- `node scripts/build.js` — writes `data.js` (27,842 bytes) from `data.json`. ✔
- `node scripts/test.js` — **all checks pass**: JSON parses, 30 entries with the
  full schema, unique ids, all 6 declared categories labeled and populated,
  https-only links, no affiliate/tracking parameters, dates valid with
  `recheckBy` after `verifiedFreeOn`, page wired for offline use, `data.js`
  in byte-exact sync with `data.json`. ✔
- `node scripts/smoke-test.js` — **passed**: data loads (30 resources), all 30
  cards render on first paint, 7 filter chips render, Language filter narrows to
  its 5 entries, search within a filter narrows correctly (e.g. "audio" → 1),
  nonsense search shows the empty state, all card links are https, and the
  free/limits/date fields and meta dates render. ✔
- Live link probe (curl HEAD of every entry URL): 27/30 providers reachable
  with HTTP 200. `www.ck12.org` returned 403 to a plain curl (site verified
  fine with a browser user-agent); `www.feynmanlectures.caltech.edu` and
  `www.open.edu/openlearn` return 403 to automated requests (bot protection;
  both load normally in a browser). All three are included with that caveat —
  re-verification instructions in the README cover this pattern.
- No secrets, API keys, or personal data appear in any file. ✔

## Known gaps

- **Free-ness is a snapshot, not a guarantee.** Every entry was verified free on
  2026-10-25 with the caveat above on three bot-protected sites; recheck dates
  (January 2027) make drift visible on-page and in the test output.
- `scripts/smoke-test.js` requires jsdom (`npm install`), but the *page itself*
  has zero dependencies.
- The directory is intentionally a hand-curated 30 (depth over a long tail);
  entries could be added per the README workflow without any code changes.
- No automated UI styling or mobile-visual regression tests — manual check on a
  narrow viewport looks correct, but isn't scripted.
- Recent-availability of specifics (e.g., Coursera aid policies, individual
  edX courses' audit windows) changes often; the cards say so in "honest limits".
