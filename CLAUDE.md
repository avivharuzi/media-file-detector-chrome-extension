# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

A Manifest V3 Chrome extension that detects image and video files on the current page and lets the user preview, open, download, or bulk-download them as a zip. Built as an Nx workspace (single project: `extension` in `apps/extension`) with Vite, React 18, and MUI.

## Commands

- `npm run build` — `nx build`; outputs the unpacked extension to `extension-build/` at the repo root. Load that folder via `chrome://extensions` → "Load unpacked".
- `npm start` — `nx build --watch`, rebuilds on change (reload the extension in Chrome to pick up changes).
- `npx nx lint extension` — ESLint (targets are inferred by Nx plugins; `project.json` defines none). See all targets with `npx nx show project extension`.
- `npx nx test extension` — test runner. Both `@nx/vite` and `@nx/jest` plugins in `nx.json` register a `test` target, and there are currently no test files. For a single test: `npx nx test extension --testFile=<path>`.
- Formatting: Prettier with single quotes (`.prettierrc`).

## Architecture

Three Vite entry points (`apps/extension/vite.config.ts` `rollupOptions.input`), emitted with fixed names (`[name].js`) so `public/manifest.json` can reference them:

- **Content script** (`src/scripts/content.ts` → `content.js`): injected into every page at `document_start`. Listens for a `chrome.runtime` message `{ action: 'getMediaFiles' }` and responds with a deduped `MediaFile[]` collected from `<img>`, `<video>`/`<video source>`, and any `href`/`src` URL whose extension matches the image/video allowlists.
- **Popup** (`src/popup/index.html` → `main.tsx` → `app.tsx`): on open, queries the active tab and sends `getMediaFiles` via `chrome.tabs.sendMessage`. All UI state (Images/Videos tabs, min resolution filter, "require resolution", selection) lives in `App`. Bulk downloads go through `src/shared/download-files-as-zip.ts` (fetch → JSZip → file-saver), which runs in the popup context.
- **Background** (`src/scripts/background.ts` → `background.js`): service worker, currently empty.

`src/shared/media-file.ts` defines the `MediaFile` type shared by the content script and popup — it's the message contract between them.

Notes:
- The content script inlines its own copy of `getFileNameFromUrl` rather than importing from `src/shared/`. Content scripts are loaded as classic scripts, so a runtime import of a shared chunk produced by the multi-entry build would break; keep `content.ts` free of runtime imports from shared modules (type-only imports are fine).
- Static assets (`manifest.json`, icons in `public/images/`) are copied from `apps/extension/public/` into the build output as-is.

## Debugging the extension

When asked to run or debug the extension, set up this loop. The runner is not in the repo, so build it in the scratchpad directory and keep Playwright out of the project's `package.json`.

1. **Watch build:** run `npm start` in the background. It rebuilds `extension-build/` on every save.
2. **Playwright:** in a scratchpad folder, run `npm init -y && npm i playwright && npx playwright install chromium`.
3. **Test page:** serve a small local page over HTTP (for example on port 8765). Include:
   - `<img>` tags both above and below the popup's default 512px minimum; `sips -z <h> <w>` can resize `apps/extension/public/images/icon-128x128.png` to make them.
   - an `<a href>` to a `.jpg` with a query string;
   - a `<video src>` and a `<video><source>`.
4. **Runner script (Node):**
   - Launch with `chromium.launchPersistentContext(profileDir, { headless: false, channel: 'chromium', args: ['--disable-extensions-except=<repo>/extension-build', '--load-extension=<repo>/extension-build'] })`.
   - Get the extension ID from the host of `ctx.serviceWorkers()[0].url()`, waiting for the `serviceworker` event if there isn't one yet.
   - Open the test page, then open `chrome-extension://<id>/src/popup/index.html` in its own tab.
   - Log `console` and `pageerror` events from both pages to a log file.
   - Run it with `run_in_background`, and leave the window open for the user.
5. **Popup-as-tab shim:** a popup opened as a tab is itself the active tab, so `chrome.tabs.query({ active: true })` returns the popup instead of the page. Before opening the popup, use `ctx.addInitScript` to wrap `chrome.tabs.query` on `chrome-extension:` pages so that active queries return the test page's tab. The real toolbar popup doesn't need the shim.
6. **Hot reload:** `fs.watch` `extension-build/` recursively, wait about 1.5s after the last change, check that `manifest.json` exists, then **close the context and relaunch it**. Calling `chrome.runtime.reload()` on an extension loaded with `--load-extension` doesn't work: the extension never comes back (`ERR_BLOCKED_BY_CLIENT`). Don't exit the process on the context's `close` event during a relaunch, only when the user closes the window.
7. **Verifying a fix:** use a separate headless run with a different profile directory and port. Drive the popup with `getByLabel('Min Width and Height')`, `getByLabel('Require Resolution')` and `getByRole('tab', { name: 'Videos' })`, take a screenshot, and read the screenshot before reporting.

Expected harmless noise in the logs: 404s for media files the test page links to but doesn't have, and `ERR_FILE_NOT_FOUND` for `/favicon.ico`, which the popup HTML references but the build doesn't include.

## Release

`.github/workflows/build-and-release.yml` runs on every push to `main`: builds, zips `extension-build/`, and publishes a GitHub release tagged with a timestamp.
