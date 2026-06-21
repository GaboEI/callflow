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

- CallFlow is an MVP, not a hardened enterprise platform.
- The app is designed to work offline and locally by default.
- The current release does not rely on a backend service or cloud sync for implemented features.
- The repository documentation intentionally treats unfinished surfaces as unfinished.
