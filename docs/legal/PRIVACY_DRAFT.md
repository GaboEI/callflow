# CallFlow privacy draft

Version: 2026-06-21

Status: editable draft, pending legal review.

## Summary

CallFlow is designed as a local desktop application. It is not designed to collect user data or send the user's call records, reports, scripts, reminders, configuration, or statistics to external servers by default.

## Data stored locally

CallFlow can store the following information on the user's computer:

- Local configuration and preferences.
- Call records and copied CRM/report lines.
- Reminders and alert preferences.
- Scripts, Markdown documents, imported text, and imported PDFs.
- Statistics, work timers, finance settings, and local backups.
- Support logs and diagnostic information needed to understand app state.

## User responsibility

The user is responsible for the information they enter, import, copy, export, or keep inside CallFlow. This is especially important if the data includes customer names, phone numbers, call identifiers, internal company procedures, scripts, PDFs, or other sensitive information.

The user should avoid storing information they are not allowed to keep locally and should follow company rules and applicable privacy laws.

## Internet and updates

The current foundation does not require an internet connection to use CallFlow. The update-check button is prepared visually and currently points users toward manual GitHub-based updates.

If a future automatic update or telemetry feature is added, this policy should be updated before release.

## Local data folder

The exact local data folder is shown inside the application diagnostics/about area. Users should treat this folder as containing application data and should back it up before reinstalling, deleting files, or moving data manually.

