# Changelog

## v0.1.2 - Improve onboarding internationalization presets

- Translated timezone display labels while preserving stable timezone values.
- Removed personal numeric call type examples from generic helper text.
- Added language-aware frequent status suggestions and default selected statuses.
- Added language-aware success and rejection label defaults and suggestions.
- Preserved user-created statuses and custom labels when switching language.
- Kept Settings editable for the same onboarding configuration fields.

## v0.1.1 - Improve reusable onboarding configuration

- Changed the default Electron window to a compact side-by-side work-helper size.
- Tuned the responsive layout so onboarding and the main app remain usable at compact width.
- Documented compact CRM/Telegram side-by-side usage.
- Changed default timezone to local system time.
- Kept Spain/Madrid as an available timezone option.
- Removed personal operator placeholder from onboarding.
- Renamed call categories to generic call types.
- Replaced multiline call type and frequent status textareas with add/remove list controls.
- Added immediate language switching for onboarding labels, helpers, placeholders, and actions.
- Added compatibility conversion for legacy multiline settings and `callStatuses`.
- Added compact mode TODO for future side-by-side CRM usage.

## v0.1.0 - Initial functional MVP

- Added Electron app shell.
- Added first-run onboarding.
- Added local JSON persistence in Electron `userData`.
- Added fast call registration.
- Added CRM copy format.
- Added hourly report copy for supervisor or Telegram.
- Added daily statistics.
- Added callback reminders.
- Added Markdown cheat sheet draft.
- Added initial project documentation.
