# CallFlow

CallFlow is a local Windows-oriented desktop app for call center operators and remote workers who need to register calls, generate hourly reports, copy CRM-ready comments, manage callback reminders, and keep a fast Markdown cheat sheet.

## Tech Stack

- Electron
- HTML
- CSS
- JavaScript
- Node.js
- Local JSON persistence

No React, Vue, Angular, or web backend is used in this MVP.

## Development

```bash
npm install
npm run dev
```

Run static JavaScript syntax checks:

```bash
npm run check
```

## Current Status

Version `0.1.16` adds primary call outcome controls for success, rejection, and callback, including automatic callback reminder creation.

The default window opens in a compact work-helper size optimized for side-by-side use with CRM, Telegram, or other call center tools. It remains resizable and maximizable.

User data is stored in Electron's `app.getPath("userData")`, not inside the source tree.

## GitHub Repository

The repository is `https://github.com/GaboEI/callflow`.

The local workspace uses a normal `.git` directory and tracks `origin/main`:

```bash
git status --short --branch
git remote -v
git push
```

## Roadmap

- MVP 1: Call registration, reports, CRM copy, history.
- MVP 2: Statistics and reminders.
- MVP 3: Markdown cheat sheet.
- MVP 4: Windows `.exe` packaging.
- MVP 5: Complete multilingual UI and visual improvements.
