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
- Final repository license after confirmation.
- Terms and conditions.
- Privacy policy / local data notice.
- Third-party notices.
- Local data folder behavior.

## Current packaging state

`package.json` currently uses `electron-builder` with NSIS and `deleteAppDataOnUninstall: false`, which is appropriate for avoiding accidental removal of user data on uninstall.

The project should not add a final installer EULA path until the license and legal text are confirmed. Once confirmed, `electron-builder` can be configured to include a license file in the NSIS installer.

## Local data folder note

The app should continue showing the local data folder in diagnostics/about so users know where settings, reports, reminders, scripts, backups, and other local records live.

