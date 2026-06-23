# Security Policy

CallFlow is a local-first desktop app for call-center workflows. It can store operational notes, reminders, call outcomes, reports, and internal scripts on the user machine, so security reports should assume sensitive business data may be involved.

## Reporting a vulnerability

- Do not open a public issue with exploit details, secrets, tokens, or customer data.
- Use GitHub Security Advisories if the repository allows private reporting.
- If private reporting is not available, contact the repository owner through GitHub and share only a minimal summary first.
- Include reproduction steps, affected version, platform details, and the smallest possible proof of concept.

## What not to share publicly

- Customer or agent personal data
- Call recordings, call notes, or CRM exports containing sensitive information
- Screenshots with real names, phone numbers, tokens, or file paths
- Backup files, logs, or configuration files that contain private data

## Project posture

- CallFlow is a beta-stage local-first desktop app, not a hardened enterprise platform.
- The app is designed to work offline and locally by default.
- The current release does not rely on a backend service or cloud sync for implemented features.
- The repository documentation intentionally treats unfinished surfaces as unfinished.

## Import and document handling policy

Imported documents (Markdown, plain text, PDF) are treated as user-provided untrusted content:

- **Allowed types:** `.md`, `.txt`, `.pdf` only. All other extensions are rejected.
- **Size limits:** text files up to 500 KB, PDFs up to 15 MB.
- **Text validation:** binary content inside `.md`/`.txt` files is rejected (null byte detection).
- **PDF validation:** files must begin with a valid `%PDF-` header; content is stored as base64 but not executed or rendered inline.
- **No script execution:** embedded scripts, macros, or active content inside imported documents are never executed.
- **No automatic link opening:** links inside imported documents are not automatically opened; external links require explicit user action and only `https:` URLs are allowed through `shell.openExternal`.

## External link policy

- Only `https:` URLs are opened externally via `shell.openExternal`.
- `http:`, `mailto:`, `javascript:`, `data:`, `file:`, `ftp:`, and all other protocols are blocked and logged.
- Internal navigation is restricted to `file:` protocol only (the app's own pages).

## Clipboard policy

- The renderer does not have generic clipboard read access.
- Clipboard reading is limited to a specific `readClipboardCallId` API that sanitizes the input to a bounded, single-line call identifier before returning it to the renderer.

## Destructive operations

- Local data erase requires a dedicated confirmation modal with a typed confirmation token (e.g., "BORRAR" / "ERASE" / "УДАЛИТЬ").
- An automatic backup is offered before erase by default.
- Double-click protection prevents accidental repeated execution.
