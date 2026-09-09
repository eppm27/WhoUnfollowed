# Audit and verification

## Original app

Audited the clean local checkout at `0f55ad5` and opened both the local Flask app and https://who-unfollowed.vercel.app/ on 9 September 2026. The live UI showed the same privacy claims and single-file workflow. Remote Git fetch was unavailable in the initial sandbox; this work is based on the existing checkout, not a verified latest remote branch.

- **Broken:** null entries return HTTP 500. Unknown containers and title-based following entries return successful zero counts. CSV rejects empty lists. The advertised sorting and charts do not exist. Startup instructions point to 5000 while the app uses 5001.
- **Fragile:** only the first string-list item is inspected, only one followers file is read, uploaded content is not validated by relationship type, duplicate handling loses display casing and all timestamps. Generic exceptions leak implementation details; oversized requests can return HTML where the frontend expects JSON.
- **Misleading:** the page/footer/console claim no upload, while `fetch('/analyze')` sends raw files and `/download_csv` receives usernames. The README alternately claims cloud privacy, local processing and unimplemented features; it claims an MIT license without a license file.
- **Security:** usernames and filenames flow into `innerHTML`; `/debug` exposes filesystem details. Local and production Python handlers duplicate almost all logic. Python 3.9 reached end of life on 31 October 2025.
- **Preserved:** two clear input roles, drag/drop, case-insensitive set comparison, CSV, no account or database requirement.
- **Removed:** Flask endpoints and dependencies, Python runtime/start script, template rendering, CDN icons, floating decorations, repeated instructions and unsupported claims.
- **Improved:** local worker pipeline, strict known shapes, title/value/profile-path variants, deduplication, split-file warnings, dashboard, filters, date sorting, pagination, accessible controls, export safety and accurate privacy copy.

## Format evidence and boundaries

Instagram does not provide a versioned export schema here. Supported formats are deliberately bounded to arrays or `relationships_followers`/`followers` and `relationships_following`/`following` arrays containing `string_list_data`. Usernames may be in `value`, `title`, or an HTTPS Instagram profile path (`/username` or `/_u/username`). Synthetic fixtures reproduce these structures, not actual personal data.

Examples inspected:

- [Title-based following and value-based followers](https://github.com/Allen-Pinto/Gram-Lens)
- [Older value-based wrapped following](https://github.com/ridwaanhall/instagram-following-followers)
- [Independent parser handling title-based following](https://github.com/Eusha425/insta-insights/blob/main/data_loader.py)
- [Python 3.9 lifecycle](https://peps.python.org/pep-0596/)
- [Vercel static configuration](https://vercel.com/docs/project-configuration/vercel-json)

The tool cannot detect an omitted final followers part, whether files belong to the same account/export, or whether a date range excludes connections. File-number gaps warn; a reminder asks for every part from one all-time export. Dates represent supplied follow timestamps, not unfollow events; conflicting duplicates have unknown dates. No live counts, avatars, or account-existence assertions are invented.

## Architecture decision

Keep the existing single-page workflow and static asset directory, port comparison into focused native JavaScript modules, and remove the duplicate Python servers. A static site is sufficient because all inputs originate on the device and no shared state exists. Worker parsing keeps the page responsive; 50-row pagination bounds DOM size. Building copies only HTML, application modules and static assets to `dist`, excluding tests and repository files. No framework or table library is necessary.

## Verification

Automated and browser results are recorded after final validation below. No deployment was performed, so production hosting behavior is configured but not verified on Vercel.

Final checks on 9 September 2026:

- All 17 Node tests passed on Node 22, including synthetic multi-file fixtures and a 45,000-unique-account comparison.
- JavaScript syntax checks, production static build and `git diff --check` passed.
- Browser fixture import produced 6 followers, 8 following, 4 mutuals and 50% reciprocity; categories contained 4 / 2 / 4 accounts, 10 total.
- Search, no-match state, keyboard arrow navigation between tabs, newest-first follow dates and username copying verified in the browser.
- Downloaded filtered CSV inspected on disk: one `alex.chen` mutual row with the correct ISO timestamp. The browser download-event listener timed out, but the saved file and contents confirmed success.
- Clear-all removed selected files and hid results. Unsupported JSON produced a corrective message and no results.
- DOM layout checks at 390, 768, 1024, 1280 and 1440 pixels found no horizontal overflow or offscreen controls. Mobile and desktop result screenshots inspected.
- No browser error/warning logs during successful analysis and CSV export. Worker analysis succeeds with `connect-src 'none'`; source has no upload, storage, analytics or external dependency calls.
- No real personal export was supplied. Fixtures are synthetic representations of documented examples; compatibility with every future Instagram shape is not claimed. Drag/drop and download behavior on Safari/Firefox were not separately tested.
- No commit, push, merge or deployment. Vercel deployment remains intentionally untested.

## Visual revision

The September 2026 revision takes inspiration from [Berrie Booth](https://berriebooth.vercel.app/): cream, berry, lilac, pastel blue, playful display typography and paper-like framing. The analyzer has its own stationery composition; no artwork or source code was copied from the reference. DM Sans and Lilita One are served locally, with licenses in `static/fonts/`. Existing analysis, privacy protections and interactions are unchanged. Responsive checks cover the original five viewport widths.
