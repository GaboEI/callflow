# User Flow

## Primer inicio

The operator opens CallFlow and sees the onboarding assistant. They choose language, work timezone, operator name, call types, frequent statuses, success label, and rejection label.

Changing the language selector updates visible onboarding labels, helper text, placeholders, and actions immediately before saving.

The default timezone is local system time. The timezone combobox lets the operator search by city, region, IANA ID, country alias, or UTC offset while the selected value is shown separately. Search text and selected timezone value are separate states, so the operator does not need to erase the current selection before searching. It stores stable values such as `local` or `Europe/Madrid`. The `local` value means CallFlow resolves the current system timezone at runtime, while a remote worker can choose a different market timezone when needed.

Frequent status presets and success/rejection defaults follow the selected language before onboarding is saved. User-created call types, statuses, and custom labels are preserved exactly as typed.

## Configuración

After onboarding, the same values can be edited from the Settings section. Call types and frequent statuses are managed as add/remove lists and saved locally. The same lists can also be adjusted from the Dashboard during active work, using the same settings source of truth. Call types are managed from a compact `...` control, while frequent statuses are added or removed directly beside the description/status field.

## Registro de llamada

The operator enters a call ID and saves. Call type, frequent status, and custom comment are optional. A frequent status is a shortcut for repeated outcomes, while the custom comment can be used alone for unique situations.

To add a frequent status during work, the operator types it in `Descripción / estado` and clicks `+` or presses Enter. To remove a frequent status, the operator selects or types that status and clicks `-`.

Generated full line example:

```text
# 20506955 Soporte 16.06 14:05 Ana: Sin_respuesta
```

If the operator saves only an ID, CallFlow keeps the line valid and leaves the description empty instead of inventing a status:

```text
# 20506955 16.06 14:05 Ana:
```

If both frequent status and custom comment are present, they are combined:

```text
# 20506955 Soporte 16.06 14:05 Ana: Sin_respuesta — Cliente pidió rellamada
```

The prefix before the call ID is configurable in Settings. The default is `#`, but the operator can choose no prefix or a daily counter such as `001`.

## Copia para CRM

The operator clicks `Guardar y copiar CRM` or `Copiar último CRM`.

CRM output example:

```text
16.06 14:05 Ana: Sin_respuesta
```

## Copia para supervisor

The operator opens Reports, selects one or more hourly blocks, and copies the Markdown report.

Inside each report block, calls are listed on consecutive lines without a blank line between them.

## Recordatorio

The operator creates a callback reminder with optional call ID, date, time, and note. The reminder appears in Today, Tomorrow, This week, Overdue, or Completed.

## Chuleta

The operator creates Markdown notes for products, scripts, objections, and quick answers. Notes can be searched, edited, deleted, previewed, and exported.
