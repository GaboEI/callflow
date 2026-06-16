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

Version `0.1.8` refines report line formatting. Report blocks now keep calls on consecutive lines, and the line prefix is configurable as `#`, no prefix, or a daily counter such as `001`.

The default window opens in a compact work-helper size optimized for side-by-side use with CRM, Telegram, or other call center tools. It remains resizable and maximizable.

User data is stored in Electron's `app.getPath("userData")`, not inside the source tree.

## GitHub Private Repository

The GitHub CLI is not currently available in this environment. The private repository is `https://github.com/GaboEI/callflow`. Push the local history with:

```bash
git --git-dir=.git-local --work-tree=. remote set-url origin git@github.com:GaboEI/callflow.git
git --git-dir=.git-local --work-tree=. branch -M main
git --git-dir=.git-local --work-tree=. push -u origin main
```

HTTPS alternative:

```bash
git --git-dir=.git-local --work-tree=. remote set-url origin https://github.com/GaboEI/callflow.git
git --git-dir=.git-local --work-tree=. branch -M main
git --git-dir=.git-local --work-tree=. push -u origin main
```

This workspace contains a reserved `.git` directory from the execution environment, so the local repository is stored in `.git-local`. The pushed GitHub repository will have normal Git history.

## Roadmap

- MVP 1: Call registration, reports, CRM copy, history.
- MVP 2: Statistics and reminders.
- MVP 3: Markdown cheat sheet.
- MVP 4: Windows `.exe` packaging.
- MVP 5: Complete multilingual UI and visual improvements.
