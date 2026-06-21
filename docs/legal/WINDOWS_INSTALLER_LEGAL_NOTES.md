# Windows installer legal notes

Status: implementation notes, not final legal text.

Relevant packaging reference:

- electron-builder NSIS documentation: https://www.electron.build/docs/nsis/
- NSIS `license` option: https://www.electron.build/docs/api/electron-builder.Interface.NsisOptions

## Installer items to prepare

For the Windows `.exe` installer, CallFlow should eventually include or reference:

- Application name: CallFlow.
- Application version from `package.json`.
- Author/project: GaboEI / CallFlow.
- Repository: https://github.com/GaboEI/callflow
- Repository license: Apache 2.0.
- Terms and conditions.
- Privacy policy / local data notice.
- Third-party notices.
- Local data folder behavior.
- NSIS installer license screen text, currently provided by `WINDOWS_INSTALLER_EULA_PLACEHOLDER.txt`.

## Current packaging state

`package.json` currently uses `electron-builder` with NSIS, `perMachine: true`, and `deleteAppDataOnUninstall: false`, which is appropriate for an all-users Windows install while avoiding accidental removal of user data on uninstall.

The repository license is already Apache 2.0. The remaining installer text should continue to reference the finalized license plus the still-draft terms and privacy notices before a public release.

## Local data folder note

The app should continue showing the local data folder in diagnostics/about so users know where settings, reports, reminders, scripts, backups, and other local records live.
