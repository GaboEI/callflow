# Product Specification

## Purpose

CallFlow helps operators register calls quickly during long shifts, copy clean CRM comments, prepare supervisor or Telegram reports, create callback reminders, and maintain a compact knowledge base.

## MVP Features

- First-run onboarding for language, timezone, operator name, call providers, frequent statuses, success label, and rejection label.
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
