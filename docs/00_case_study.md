# CallFlow case study

## Problem

CallFlow was built for a repetitive, high-friction call-center workflow where operators need to register calls, produce supervisor-ready summaries, keep reminders visible, and preserve useful internal notes without switching between multiple web tools.

## Target users

- Call-center agents who need to log calls quickly during live shifts
- Team leads who need hourly or block-based reports
- Supervisors who review operational output after the fact
- Technical recruiters who want to evaluate a real desktop product, not a toy demo

## Constraints

- Desktop-first, local-only MVP
- Windows packaging target, with Linux used during development
- No backend service for the implemented features
- No cloud sync or telemetry pipeline in the current release
- Honest scope: only document what is actually implemented

## Product decisions

- Keep the app compact and side-by-side friendly for call-center work
- Use local JSON persistence instead of a server or database
- Separate fast call logging from reporting, reminders, stats, and scripts
- Keep Markdown scripts editable and readable inside the app
- Make reminders, timers, and clocks visible in the same shell as call logging

## Technical architecture

- Electron main process manages the window, IPC, clipboard, dialogs, and reminder scheduling
- Renderer logic is split into feature views and shared UI helpers
- Shared domain modules handle normalization, reminders, reports, stats, outcomes, and validation
- Persistent state lives under Electron `userData` as versioned JSON files
- Renderer access stays behind a minimal preload bridge with `contextIsolation` enabled

## Security/privacy posture

- Data stays local by default
- No backend is required for implemented features
- No cloud sync is part of the MVP
- The app can hold sensitive operational information, so user discretion matters
- The AI shell in the UI is a placeholder and should not be treated as a live AI integration

## Tradeoffs

- Local-first design improves privacy and offline use, but does not provide multi-device sync
- A compact single-window workflow keeps the product fast, but limits how much can be shown at once
- JSON persistence is simple and transparent, but not a substitute for a server-backed audit system
- The app is useful today, but remains an MVP rather than a full enterprise platform

## What I learned

- Product credibility comes from honest scope, not feature inflation
- Clear separation between main, renderer, and shared logic makes the app easier to reason about
- Recruiter-facing documentation matters as much as UI polish for a portfolio project
- Local data and privacy are strong differentiators when they are documented clearly

## Current limitations

- AI Chat is only a UI shell
- Cloud sync is not implemented
- There is no backend service
- Windows packaging exists, but installer validation still depends on real Windows QA
- The legal drafts are informational and still need human review before public release

## Next steps

- Run and record Windows QA results
- Generate and validate the Windows installer
- Publish a real release only after installer evidence exists
- Keep the roadmap and legal text synchronized with the actual product state
