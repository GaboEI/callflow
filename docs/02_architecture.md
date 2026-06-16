# Architecture

## Overview

CallFlow is an Electron desktop application with a strict split between the main process and renderer process.

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
- Call history rendering.
- Report formatting.
- Daily statistics.
- Reminder list and status changes.
- Knowledge base editor.
- Settings screen.

## Persistence

User data is stored as JSON files in Electron `userData`:

- `settings.json`
- `calls.json`
- `templates.json`
- `reminders.json`
- `knowledge_base.json`

The `storage/` directory remains in the repository only as a placeholder and is not used for runtime user data.
