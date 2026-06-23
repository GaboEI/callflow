# Windows QA Results — CallFlow v0.2.0-beta.1

Validation performed on Windows 11 VM.

## Environment

| Item | Value |
| --- | --- |
| OS | Windows 11 (VM) |
| Installer | NSIS x64 |
| Node.js | 22.12+ |
| Electron | 42.4.1 |
| Build command | `npm run dist:win` |

## Test results

| # | Test | Result | Notes |
| --- | --- | --- | --- |
| 1 | Build installer (`npm run dist:win`) | Passed | NSIS x64 `.exe` generated successfully |
| 2 | Install (per-user mode) | Passed | NSIS installer completed without errors |
| 3 | First launch | Passed | App window opened, dark theme default |
| 4 | SmartScreen warning | Expected | Installer is unsigned; user must click "More info" then "Run anyway" |
| 5 | Onboarding wizard | Passed | All 7 steps completed, settings persisted |
| 6 | Legal terms blocking | Passed | Onboarding blocks until terms are accepted |
| 7 | Save settings | Passed | Language, timezone, operator name, call types persisted after restart |
| 8 | Create call | Passed | Call saved and visible in dashboard |
| 9 | CRM copy | Passed | CRM line copied to clipboard correctly |
| 10 | Supervisor report | Passed | Hourly report blocks rendered |
| 11 | Reminders | Passed | Create, snooze, complete, delete lifecycle works |
| 12 | Statistics | Passed | Daily stats, timesheets, and outcome charts render |
| 13 | Work/break timer | Passed | Start, pause, break, resume lifecycle works |
| 14 | Multi-timezone clocks | Passed | Pinned clocks display and update |
| 15 | Script library | Passed | Create, edit, pin, search, export Markdown notes |
| 16 | Document import (MD/TXT) | Passed | Markdown and plain text files imported correctly |
| 17 | Document import (PDF) | Passed | PDF imported with metadata, binary validated |
| 18 | Backup export | Passed | `.callflow-backup.json` created with full data |
| 19 | Backup import | Passed | Data restored from backup file, settings reapplied |
| 20 | Local data erase | Passed | `userData` cleared, app restarted to clean onboarding |
| 21 | Diagnostics | Passed | Version, paths, schema versions, and logs displayed |
| 22 | Light theme | Passed | Theme toggle works, all views render correctly |
| 23 | Uninstall | Passed | App removed; user data preserved in `%APPDATA%\CallFlow` |

## Known issues

- Installer is unsigned; SmartScreen warning appears on first run.
- AI Chat section is a placeholder with no live backend.
- Legal text is still in draft form.

## Validation date

2026-06-21 (initial beta validation cycle)
