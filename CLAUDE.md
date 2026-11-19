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

## Release

`.github/workflows/build-and-release.yml` runs on every push to `main`: builds, zips `extension-build/`, and publishes a GitHub release tagged with a timestamp.
