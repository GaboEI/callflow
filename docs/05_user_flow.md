# User Flow

## Primer inicio

The operator opens CallFlow and sees the onboarding assistant. They choose language, work timezone, operator name, call types, frequent statuses, success label, and rejection label.

Changing the language selector updates visible onboarding labels, helper text, placeholders, and actions immediately before saving.

The default timezone is local system time. Spain/Madrid is available as a separate option for workflows that need it.

## Configuración

After onboarding, the same values can be edited from the Settings section. Call types and frequent statuses are managed as add/remove lists and saved locally.

## Registro de llamada

The operator enters a call ID, chooses a provider, writes or selects a status, optionally adds a custom comment, and saves.

Generated full line example:

```text
# 20506955 3333 16.06 14:05 Gabriel: Sin_respuesta
```

## Copia para CRM

The operator clicks `Guardar y copiar CRM` or `Copiar último CRM`.

CRM output example:

```text
16.06 14:05 Gabriel: Sin_respuesta
```

## Copia para supervisor

The operator opens Reports, selects one or more hourly blocks, and copies the Markdown report.

## Recordatorio

The operator creates a callback reminder with optional call ID, date, time, and note. The reminder appears in Today, Tomorrow, This week, Overdue, or Completed.

## Chuleta

The operator creates Markdown notes for products, scripts, objections, and quick answers. Notes can be searched, edited, deleted, previewed, and exported.
