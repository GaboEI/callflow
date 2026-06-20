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

## Future AI chat

CallFlow is preparing a future AI chat section intended to work with local user data such as reports, statistics, scripts, reminders, and relevant settings.

The intended privacy baseline is that AI features should use local context whenever possible and should not send user data to external services without explicit user consent and updated privacy text.

AI responses can be incomplete or incorrect. Users should review AI output before relying on it, especially when it involves customer information, internal company procedures, reports, calculations, or sensitive data.

## Local data folder

The exact local data folder is shown inside the application diagnostics/about area. Users should treat this folder as containing application data and should back it up before reinstalling, deleting files, or moving data manually.
