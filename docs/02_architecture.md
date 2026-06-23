# Architecture

## Overview

CallFlow is an Electron desktop application with a strict split between the main process and renderer process.

The default window opens in a compact work-helper size, approximately matching a `55 x 50` terminal-cell reference as `620 x 760` pixels. The minimum size is `520 x 620`, and the window remains freely resizable and maximizable.

## Main Process

Responsibilities:

- Create the desktop window.
- Configure Electron security defaults.
- Read and write local JSON files in `app.getPath("userData")`.
- Write text to the system clipboard.
- Read text from the system clipboard for explicit user-triggered import actions.
- Export note files through a native save dialog.

Security configuration:

- `contextIsolation: true`
- `nodeIntegration: false`
- Renderer access goes through `preload.js`.

## Preload

`src/main/preload.js` exposes a minimal `window.callflow` API:

- `read(key)`
- `write(key, value)`
- `copyText(text)`
- `readClipboardCallId()`
- `exportNote(payload)`
- `exportBackup()`
- `importBackup()`
- `resetLocalData()`
- `restartApp()`
- `importKnowledgeDocument()`
- `getDiagnostics()`
- `getDataDir()`
- `getSystemLocale()`
- `getHealth()`

Only known storage keys are allowed.

## Renderer

Responsibilities:

- Interface and forms.
- Onboarding.
- Immediate onboarding i18n updates before saving.
- Call history rendering.
- Report formatting.
- Daily statistics.
- Reminder list and status changes.
- Script library, Markdown reader, and editor.
- Settings screen.

Renderer module boundaries:

- `src/renderer/scripts/app.js` is the runtime orchestrator: initial load, global subscriptions, navigation, shared context, and render coordination. It currently handles onboarding, settings application, theme/language switching, and global event wiring. As the app grows, these responsibilities should be extracted into focused modules following the same `context` pattern used by views.
- `src/renderer/scripts/core/` owns shared renderer primitives such as DOM helpers, state factory, action/error handling, date/time picker logic, settings, timers, timezones and markdown preview.
- `src/renderer/scripts/views/` owns view-specific rendering and events. New screens should be added as a `createXView(context)` module with `render()` and `bindEvents()` rather than adding more view logic directly to `app.js`.
- View modules receive shared dependencies through `context` and should not reach into private variables from another view.

Planned gradual refactor for `app.js`:

1. Extract onboarding helpers into a dedicated module.
2. Extract settings application and form sync helpers.
3. Extract global actions (navigation, theme, language switching).
4. Leave `app.js` as a minimal bootstrap/orchestrator that wires modules together.

Script library:

- `knowledge_base.json` remains the internal persistence source so existing notes are retained without a destructive migration.
- The renderer separates library, reader, and editor modes in `knowledge-view.js`.
- EasyMDE provides the local/offline Markdown parser; source editing uses a native textarea and a small formatting toolbar so Markdown remains literal until preview or reading mode.
- EasyMDE's GFM rendering is passed through DOMPurify before insertion into the document.
- Third-party runtime assets are installed as production dependencies and explicitly included in packaged builds; no CDN is required.

Settings compatibility:

- `callTypes` and `frequentStatuses` are stored as arrays.
- `outcomePresets` stores primary outcome labels for success, rejection, and callback categories.
- Calls may include `primaryOutcome`; missing `primaryOutcome` is treated as `null` for backward compatibility.
- Legacy multiline strings are converted to arrays in the renderer.
- Legacy `callStatuses` values are migrated to `frequentStatuses`.
- Onboarding separates system presets, user-created values, and saved settings so language switching can translate untouched presets without rewriting custom user data.
- Timezone labels are translated in the renderer; stored timezone values remain stable IANA IDs.
- The timezone combobox keeps search text separate from the selected technical timezone value to avoid storing or editing visible labels.
- `Intl.supportedValuesOf("timeZone")` is used when available, with a fallback list for older runtimes.
- The special `local` value resolves through `Intl.DateTimeFormat().resolvedOptions().timeZone` at runtime.
- Dashboard inline call type and frequent status edits write back to `settings.json`; Settings and Dashboard share one source of truth.
- Dashboard inline outcome preset edits also write back to `settings.json`.
- The dashboard work clock reads the configured timezone and `clockFormat` from settings.
- The work/break timer is stored separately in `work_timer.json` so future statistics can calculate worked time, breaks, and compensation without mixing timer state into calls.

## Persistence

User data is stored as JSON files in Electron `userData`:

- `settings.json`
- `calls.json`
- `templates.json`
- `reminders.json`
- `knowledge_base.json`
- `work_timer.json`

Versioned data:

- Runtime data files use a `schemaVersion` wrapper where supported.
- `src/shared/schema.js` owns migrations and normalization for persisted data.
- `src/main/storage-service.js` unwraps data for the renderer, applies migrations on read, and creates backups before migration or import.
- Backup bundles contain settings, calls, reminders, knowledge base and work timer data in one exportable JSON file.

The `storage/` directory remains in the repository only as a placeholder and is not used for runtime user data.

## Compact Layout Note

The compact layout is optimized for call center work next to CRM, Telegram, or other operator tools. Wider dashboard-style layouts can still be reached by resizing or maximizing the window.
