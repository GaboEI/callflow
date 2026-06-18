# Product Specification

## Purpose

CallFlow helps operators register calls quickly during long shifts, copy clean CRM comments, prepare supervisor or Telegram reports, create callback reminders, and maintain a compact knowledge base.

## MVP Features

- First-run onboarding for language, work timezone, operator name, configurable call types, frequent status presets, success label, and rejection label.
- Onboarding language switching updates visible labels, helpers, placeholders, and actions immediately before settings are saved.
- Timezone selection uses IANA timezone IDs from the runtime where available.
- Timezone selection is exposed through a searchable combobox so users can search by city, region, IANA ID, or UTC offset without editing the selected value text.
- Timezone display labels are translated and include useful UTC offset/current-time context, while stored values remain stable identifiers such as `local` or `Europe/Madrid`.
- Default timezone is local system time; Spain/Madrid remains available as an explicit option.
- The `local` timezone value means use the current system timezone at runtime, which supports remote workers whose work market differs from their physical location.
- Operator name is user-defined and no personal name is used as a default placeholder.
- Call type examples remain generic and are not tied to one operator workflow.
- Frequent status presets are language-aware; user-created statuses are preserved exactly as typed.
- Success and rejection labels are language-aware defaults with editable custom values.
- Fast call registration where only call ID is required; call type, frequent status, and custom comment are optional.
- Quick registration can import a call ID from the system clipboard through the secure preload bridge.
- Operators can capture the incoming call time before saving so the final call record uses the real entry time instead of the moment the CRM comment is copied.
- Quick registration includes a primary call outcome layer with success, rejection, and callback categories.
- Primary outcome is separate from call type, frequent status, and custom comment.
- Generated descriptions follow this hierarchy: primary outcome, frequent status/description, then custom comment.
- Custom comments can be saved as user-managed presets from Dashboard, start empty by default, are searchable, and do not affect statistics.
- Callback outcome requires callback date/time and automatically creates a pending reminder linked to the saved call.
- Frequent statuses are shortcuts/presets, not mandatory fields.
- Call types and frequent statuses can be managed from both Dashboard and Settings using one shared settings source of truth.
- Dashboard includes a live green work-time clock using the configured work timezone, with 24-hour, 12-hour, and military display options.
- Dashboard header includes an optional work/break timer. Work time accumulates across play/resume actions; each pause starts a break counter from zero and stores the completed break for future statistics.
- Full internal call line format: `# ID TYPE DD.MM HH:mm Operator: Description`.
- Line prefix is configurable: `#` by default, no prefix, or daily numbering such as `001`.
- CRM copy format: `DD.MM HH:mm Operator: Description`.
- CRM copy still starts from the original call date/time, even when the description includes callback date/time.
- Hourly grouping by configured timezone.
- Today's hourly blocks use a compact grid and can visually mark the most productive hour in green and the least productive hour in red when enough data exists.
- Supervisor report copy in Markdown with one or more selected hourly blocks; calls inside a block are listed on consecutive lines without blank spacing.
- Reports default to today's calls and can be filtered by yesterday, last 7 days, last 30 days, or a custom date range.
- Reports include an in-section text search with match count, previous/next navigation, and visual highlighting for reviewing repeated words or exact phrases.
- Report blocks can be edited in place for small corrections, or deleted as a complete hourly block when needed.
- Daily statistics for total calls, successes, rejections, no answer, provider totals, frequent status counts with activity, and pending reminders.
- Callback reminders with pending, completed, and overdue states.
- Quick registration can hand off a saved call to Reminders by copying CRM text and preloading the call ID.
- Markdown cheat sheet with create, edit, delete, search, preview, and export to `.md` or `.txt`.

## Configuration Notes

- Outcome presets are stored under `outcomePresets` with success, rejection, and callback categories.
- Dashboard can manage outcome presets inline for the current MVP.
- TODO: expose full success/rejection/callback preset management in Onboarding and Settings with the same data model.
- Existing call records without `primaryOutcome` are treated as compatible legacy records.

## Out of Scope for v0.1.0

- Native notifications.
- PDF export.
- Cloud sync.
- Database server.
- Windows installer.
