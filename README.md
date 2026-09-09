# Instagram Connection Analyzer

Analyze your Instagram connection exports on your device to understand mutual and one-way connections.

## Features

- Followers, following, mutuals and reciprocity
- Multiple followers files, username normalization and duplicate detection
- Search, relationship filters and alphabetical or available follow-date sorting
- CSV export of the current category and search, including all accounts
- Local processing in a Web Worker; clear all files and results

## How it works

1. Export **Followers and following** from Instagram Accounts Center as **JSON**, with **All time** selected.
2. Extract the ZIP. Choose `following.json` and every `followers_*.json` from the same export.
3. Analyze, filter and export results.

This compares an export snapshot. It cannot identify historical unfollows or verify whether a profile still exists. Missing files and limited date ranges can skew results; file-number gaps are flagged, but completeness cannot be proven.

## Tech

HTML, CSS and vanilla JavaScript modules. File API, Web Workers, Web Crypto and Blob downloads. Node.js built-in test runner and static build tooling. No application dependencies, backend, database or Instagram API.

`src/parser.js` validates and normalizes known export shapes; `analyzer.js` classifies connections with maps; `exportCsv.js` escapes CSV and guards spreadsheet formulas. `worker.js` reads files off the main thread; `ui.js` manages accessible controls and paginated results.

Reciprocity = mutuals ÷ following × 100; shown as “—” when following is zero. Follow dates come only from valid Unix-second timestamps on the following side. Missing, conflicting and future dates are omitted. Dates display in UTC, with unknown dates last when sorting.

## Run locally

Node.js 22 or newer; no dependency installation needed.

```sh
npm run dev
# http://localhost:4173
npm test
npm run lint
npm run build
npm run preview
```

`lint` checks JavaScript syntax. `build` packages public assets into `dist/`. Vercel is configured for this static output; the former Flask functions and Python runtime are removed. Stop the dev server before starting preview on the same port.

## Privacy

Selected JSON is read in browser memory, never sent to a server or saved in browser storage. A worker is terminated after analysis or when clearing/changing files. “Clear all data” releases the app’s file and result references; reloading resets them too. CSV downloads and copied usernames remain wherever you save or paste them.

No analytics, remote fonts or third-party scripts. DM Sans and Lilita One are bundled locally under their included SIL Open Font Licenses. Content Security Policy blocks network connections from application code. The host still receives normal page/asset requests; opening a profile intentionally visits Instagram. Limits: 16 MB per JSON file, 64 MB total. Use HTTPS or localhost for browser features.

## Tests

`tests/fixtures/` contains synthetic, publicly safe examples of older value-based followers and newer title-based following structures. Tests cover normalization, malformed data, duplicate files, split files, dates, classification, reciprocity, filtering and CSV. See [audit and verification notes](docs/audit.md) for limitations and manual checks.

## Disclaimer

Not affiliated with Instagram or Meta. Uses user-exported data only; no login, scraping or live connection tracking.
