# Actually Free to Learn

A static, local-first directory of **genuinely free** learning resources — full courses,
free certificates, open textbooks, recorded lecture archives, language apps, and gentle
walks into coding. Plain-English, warm, and honest: every card says what you'll learn,
what is *actually* free, how long it takes, where the catches are, and when the free-ness
was last verified (plus when it should be rechecked).

Maintained by **Asdale Dynamics, LLC** in the spirit of *The Massive AI Manual* —
explaining things step by step, never condescending. No affiliate links, ever.

## How to use it

- **Open `index.html` directly** in any browser — double-clicking the file is enough.
  It works offline with no server, no internet, and no build step. (The page loads its
  data from a small generated file, `data.js`, rather than fetching JSON, because
  browsers block local `fetch()` on `file://` pages.)
- Use the **category chips** to narrow to one kind of resource, and the **search box**
  to filter by keyword (`python`, `german`, `certificate`, `math`…).
- Entries whose "check again by" date has passed get an amber note warning you the
  details may have drifted. That is by design — free-ness can quietly become freemium.

## How to keep it accurate (maintenance)

`data.json` is the single source of truth. `index.html` never contains content itself.

1. **Add or edit an entry**: open `data.json`, duplicate an entry in `resources`, and
   fill in every field (schema below). Keep the voice warm and honest — write like a
   friend, not a brochure.
2. **Re-verify**: when you check that a resource is still free, set
   `verifiedFreeOn` to today and `recheckBy` to roughly three months out. If an entry's
   `recheckBy` date passes, the page will flag it as "time to re-verify".
3. **Regenerate the offline data file** (required after any `data.json` change):
   ```
   npm run build        # or: node scripts/build.js
   ```
4. **Run the checks**:
   ```
   npm test             # or: node scripts/test.js  — schema, links, sync
   node scripts/smoke-test.js   # renders the page headlessly (jsdom)
   ```

### Data schema (every field is required)

| Field | What it holds |
| --- | --- |
| `id` | Unique lowercase-kebab identifier |
| `title` | Human name of the resource |
| `category` | One of `categories` in the file (courses, certificates, textbooks, lectures, language, coding walks) |
| `provider` | Who makes it (and if it's a nonprofit, say so) |
| `url` | The official https homepage or course page |
| `whatYouLearn` | One or two friendly sentences on the core skill |
| `whatsFree` | What is *actually* free — be specific about the free tier |
| `timeNeeded` | Honest time estimate, per day/week and overall |
| `honestLimits` | The catches: paid certificates, ads, aging content, etc. |
| `tags` | Lowercase keywords used by search |
| `verifiedFreeOn` | `YYYY-MM-DD` the free-ness was hand-checked |
| `recheckBy` | `YYYY-MM-DD` when it should be re-checked |

### What the test script validates

`scripts/test.js` fails if: the JSON doesn't parse; any required field is missing or
thin; ids duplicate; a category is undeclared or empty; any URL is http or carries
affiliate/tracking parameters (`tag=…-20`, `utm_`, affiliate parameters, link
shorteners, etc.); dates are malformed or `recheckBy` isn't after `verifiedFreeOn`;
`index.html` loses its offline wiring; or `data.js` falls out of sync with `data.json`.

Smoke test: `scripts/smoke-test.js` loads the page in jsdom and asserts that cards,
chips, search, filtering, and the empty state actually render.

### House rules

- **No affiliate links or tracking parameters.** The test script enforces this.
- **No secrets, API keys, or personal data** in any file.
- Stay **local-first**: no CDNs, no external fonts or scripts — the page must keep
  working straight from a folder on a laptop with no internet.

## Project layout

```
index.html          The whole app: styles + logic inline, nothing external
data.json           Source-of-truth directory data (edit this)
data.js             Generated mirror of data.json for offline use (never edit)
scripts/build.js    data.json -> data.js
scripts/test.js     Validation: JSON schema, links, no-affiliate, sync
scripts/smoke-test.js  Headless render test of the actual page
```

## License

MIT — see [LICENSE](LICENSE). Copyright (c) 2026 **Asdale Dynamics, LLC**.
