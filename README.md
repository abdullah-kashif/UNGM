# UNGM Code Finder

Complete source code for the published app, including the latest Excel-copy change.

## Open the app

1. Extract this ZIP file.
2. Open `dist/index.html` in your web browser.

No build step or package installation is required. If your browser blocks automatic clipboard copying when opened as a local file, the app shows selectable text for manual copying. Hosting the `dist` folder on HTTPS supports the normal clipboard workflow.

## Deploy to Netlify

The repository includes `netlify.toml`, which tells Netlify to publish the `dist` directory. There is no build command or package installation step. Connect this repository to Netlify and deploy with the default settings, or drag the `dist` folder into Netlify Drop.

## Files

- `dist/index.html` — page structure.
- `dist/styles.css` — styling and mobile layout.
- `dist/app.js` — navigation, search, list-copy controls and clipboard fallback.
- `dist/model.js` — hierarchy, search and two-column Excel export logic.
- `dist/data.js` — all 13,511 records from the UNGM export.
- `dist/favicon.svg` — app icon.
- `tests/check.cjs` — data and interaction checks, using built-in Node.js modules.
- `package.json` — test command; no external dependencies.

## Excel copying

Every category and group has one `Copy list for Excel` button at the bottom. It copies the immediate entries in that list as tab-separated `Code` and `Name` columns with a header row. Search copies every matching result, including results beyond the first displayed page. A final entry's detail view copies that one entry.

The source has 18 entries with missing parent references. They remain in a flagged section under category H; their exact original placement has not been invented.

## Run checks (optional)

With Node.js installed, open a terminal in this folder and run:

```sh
node tests/check.cjs
```

Checks cover all records, hierarchy navigation, search, one copy button per group, Excel's two-column text format, and clipboard fallback. Rendered browser appearance and a real Excel paste were not directly verified in the build environment.

## Data source

UNGM's official export: https://www.ungm.org/Public/UNSPSC

Data exported on 16 October 2026. This is an independent browsing tool.
