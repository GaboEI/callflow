# Product Specification

## Purpose

CallFlow helps operators register calls quickly during long shifts, copy clean CRM comments, prepare supervisor or Telegram reports, create callback reminders, and maintain a compact knowledge base.

## MVP Features

- First-run onboarding for language, work timezone, operator name, configurable call types, frequent status presets, success label, and rejection label.
- Onboarding language switching updates visible labels, helpers, placeholders, and actions immediately before settings are saved.
- Timezone selection uses IANA timezone IDs from the runtime where available.
- Timezone display labels are translated and include useful UTC offset/current-time context, while stored values remain stable identifiers such as `local` or `Europe/Madrid`.
- Default timezone is local system time; Spain/Madrid remains available as an explicit option.
- The `local` timezone value means use the current system timezone at runtime, which supports remote workers whose work market differs from their physical location.
- Operator name is user-defined and no personal name is used as a default placeholder.
- Call type examples remain generic and are not tied to one operator workflow.
- Frequent status presets are language-aware; user-created statuses are preserved exactly as typed.
- Success and rejection labels are language-aware defaults with editable custom values.
- Fast call registration with ID, provider, description/status, and optional custom comment.
- Full internal call line format: `# ID TYPE DD.MM HH:mm Operator: Description`.
- CRM copy format: `DD.MM HH:mm Operator: Description`.
- Hourly grouping by configured timezone.
- Supervisor report copy in Markdown with one or more selected hourly blocks.
- Daily statistics for total calls, successes, rejections, no answer, provider totals, hourly totals, and pending reminders.
- Callback reminders with pending, completed, and overdue states.
- Markdown cheat sheet with create, edit, delete, search, preview, and export to `.md` or `.txt`.

## Out of Scope for v0.1.0

- Native notifications.
- PDF export.
- Cloud sync.
- Database server.
- Windows installer.
