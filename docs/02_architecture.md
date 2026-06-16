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
- `exportNote(payload)`
- `getDataDir()`

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
- Knowledge base editor.
- Settings screen.

Settings compatibility:

- `callTypes` and `frequentStatuses` are stored as arrays.
- Legacy multiline strings are converted to arrays in the renderer.
- Legacy `callStatuses` values are migrated to `frequentStatuses`.
- Onboarding separates system presets, user-created values, and saved settings so language switching can translate untouched presets without rewriting custom user data.
- Timezone labels are translated in the renderer; stored timezone values remain stable IDs.

## Persistence

User data is stored as JSON files in Electron `userData`:

- `settings.json`
- `calls.json`
- `templates.json`
- `reminders.json`
- `knowledge_base.json`

The `storage/` directory remains in the repository only as a placeholder and is not used for runtime user data.

## Compact Layout Note

The compact layout is optimized for call center work next to CRM, Telegram, or other operator tools. Wider dashboard-style layouts can still be reached by resizing or maximizing the window.
