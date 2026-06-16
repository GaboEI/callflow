# Changelog

## v0.1.8 - Refine report line spacing and prefix format

- Removed blank lines between calls inside report block content.
- Added configurable call line prefix mode in Settings.
- Kept `#` as the default prefix.
- Added options for no prefix and daily numbering in `001` format.
- Applied the configured line prefix to dashboard previews and copied supervisor reports.

## v0.1.7 - Refine dashboard inline type and status controls

- Changed call type management from a plus action to a compact `...` configuration control.
- Kept the call type manager hidden until explicitly opened.
- Removed the extra frequent status management panel from quick registration.
- Added direct `+` and `-` actions beside the description/status field.
- Let Enter in the description/status field save the current text as a frequent status.

## v0.1.6 - Improve quick registration optional fields and inline status management

- Made only call ID required in quick registration.
- Allowed empty call type, empty frequent status, and empty custom comment.
- Omitted missing call type cleanly from generated full call lines.
- Combined frequent status and custom comment with a clear separator when both are present.
- Added inline Dashboard management for frequent statuses and call types using the same settings source of truth.
- Added a live green work-time clock based on the configured timezone with 24-hour, 12-hour, and military formats.

## v0.1.5 - Fix timezone combobox selection behavior

- Rebuilt timezone picker interaction around separate search text and selected timezone state.
- Added reliable open, close, outside-click, Escape, ArrowUp, ArrowDown, and Enter behavior.
- Made timezone option clicks select the technical timezone value and close the dropdown immediately.
- Kept the search input clear after selection so users do not need to delete the selected timezone label.
- Preserved stable stored values such as `local`, `Europe/Madrid`, and `America/New_York`.

## v0.1.4 - Improve timezone searchable combobox UX

- Changed timezone search so the selected value is shown separately from the search text.
- Kept the timezone results closed by default and opened them on focus or dropdown action.
- Added a clean dropdown-arrow combobox interaction for Onboarding and Settings.
- Improved timezone search matching for city names, IANA IDs, localized labels, and UTC offsets.
- Preserved stable stored values such as `local` and `Europe/Madrid`.

## v0.1.3 - Add professional IANA timezone selector

- Replaced the small manual timezone dropdown with a searchable timezone selector.
- Used runtime IANA timezone IDs via `Intl.supportedValuesOf("timeZone")` with a safe fallback list.
- Kept `local` as the first/default stable value and resolved it at runtime.
- Localized visible timezone labels while preserving technical stored values.
- Added UTC offset and current time context to timezone options.
- Reused the same timezone selector in Settings.

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
