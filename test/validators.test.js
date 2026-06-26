const test = require("node:test");
const assert = require("node:assert/strict");
const { Buffer } = require("node:buffer");

const validators = require("../src/shared/validators");

test("normalizes malformed settings into production-safe defaults", () => {
  const result = validators.normalizeSettings({
    language: "bad",
    callTypes: "Ventas, Ventas, Soporte",
    frequentStatuses: [null, " Sin_respuesta ", "sin_respuesta"],
    customComments: [" Cliente ocupado ", "Cliente ocupado", "No llamar más"],
    notifyBeforeMinutes: -10,
    reminderSound: "loud",
    linePrefixMode: "bad",
    clockFormat: "bad"
  });

  assert.equal(result.language, "es");
  assert.deepEqual(result.callTypes, ["Ventas", "Soporte"]);
  assert.deepEqual(result.frequentStatuses, ["Sin_respuesta"]);
  assert.deepEqual(result.customComments, ["Cliente ocupado", "No llamar más"]);
  assert.equal(result.notifyBeforeMinutes, 0);
  assert.equal(result.reminderSound, "soft");
  assert.equal(result.linePrefixMode, "hash");
  assert.equal(result.clockFormat, "24h");
});

test("exposes the shared plain object helper", () => {
  assert.equal(validators.isPlainObject({}), true);
  assert.equal(validators.isPlainObject([]), false);
  assert.equal(validators.isPlainObject(null), false);
});

test("bounds text normalization work without exact pre-slice truncation", () => {
  assert.equal(validators.text(`${" ".repeat(5000)}Keep me`, 7), "Keep me");
  assert.equal(validators.multilineText(`${"\r\n".repeat(4000)}Done`, 4), "\n\n\n\n");
  assert.equal(validators.text("A".repeat(2 * 1024 * 1024), 120), "A".repeat(120));
});

test("validates practical reminder payloads and rejects invalid dates", () => {
  assert.equal(
    validators.validateReminderPayload({
      callId: "123",
      date: "2026-02-30",
      time: "10:00",
      repeat: "once",
      note: "Call back"
    }).ok,
    false
  );

  const valid = validators.validateReminderPayload({
    callId: " 123 ",
    date: "2026-06-18",
    time: "10:00",
    repeat: "invalid",
    note: " Call back "
  });

  assert.equal(valid.ok, true);
  assert.deepEqual(valid.value, {
    callId: "123",
    date: "2026-06-18",
    time: "10:00",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    dueAt: validators.zonedDateTimeToUtc("2026-06-18", "10:00", "local").toISOString(),
    repeat: "once",
    note: "Call back"
  });
});

test("anchors reminder due time to the selected work timezone", () => {
  const valid = validators.validateReminderPayload({
    callId: "ESP-1",
    date: "2026-06-18",
    time: "15:00",
    timezone: "Europe/Madrid",
    repeat: "once",
    note: "Call Spain"
  });

  assert.equal(valid.ok, true);
  assert.equal(valid.value.timezone, "Europe/Madrid");
  assert.equal(valid.value.dueAt, "2026-06-18T13:00:00.000Z");
  assert.equal(validators.reminderDueDate(valid.value).toISOString(), "2026-06-18T13:00:00.000Z");
});

test("normalizes active timezones without forcing an old primary", () => {
  const result = validators.normalizeSettings({
    timezone: "Europe/Madrid",
    activeTimezones: [
      "Europe/Rome",
      "America/Argentina/Buenos_Aires",
      "America/Mexico_City",
      "America/Bogota",
      "America/New_York",
      "America/Los_Angeles",
      "Europe/London",
      "Europe/Paris",
      "Europe/Berlin",
      "Asia/Tokyo",
    "UTC"
    ],
    lastReminderTimezone: "America/Bogota",
    pinnedClockTimezones: ["Europe/Madrid", "America/Bogota", "UTC"]
  });

  assert.equal(result.activeTimezones.length, 10);
  assert.equal(result.timezone, "Europe/Rome");
  assert.equal(result.activeTimezones[0], "Europe/Rome");
  assert.equal(result.lastReminderTimezone, "America/Bogota");
  assert.equal(result.activeTimezones.includes("UTC"), false);
  assert.deepEqual(result.pinnedClockTimezones, ["America/Bogota"]);
});

test("allows no pinned clocks while keeping active timezones available", () => {
  const result = validators.normalizeSettings({
    timezone: "Europe/Madrid",
    activeTimezones: ["Europe/Rome"],
    pinnedClockTimezones: []
  });

  assert.equal(result.timezone, "Europe/Rome");
  assert.deepEqual(result.activeTimezones, ["Europe/Rome"]);
  assert.deepEqual(result.pinnedClockTimezones, []);
});

test("falls back to the primary timezone when active timezones are missing", () => {
  const result = validators.normalizeSettings({
    timezone: "America/Bogota"
  });

  assert.equal(result.timezone, "America/Bogota");
  assert.deepEqual(result.activeTimezones, ["America/Bogota"]);
  assert.equal(result.lastReminderTimezone, "America/Bogota");
});

test("normalizes stats timezone separately from reminder timezone", () => {
  const result = validators.normalizeSettings({
    timezone: "Europe/Madrid",
    activeTimezones: ["Europe/Madrid", "America/Bogota"],
    lastReminderTimezone: "America/Bogota",
    statsTimezone: "America/Denver",
    statsCycleStartDay: 15
  });

  assert.equal(result.timezone, "Europe/Madrid");
  assert.equal(result.lastReminderTimezone, "America/Bogota");
  assert.equal(result.statsTimezone, "America/Denver");
  assert.equal(result.statsCycleStartDay, 15);
});

test("keeps at least one active timezone when active values are invalid", () => {
  const result = validators.normalizeSettings({
    timezone: "America/Bogota",
    activeTimezones: ["", "   "]
  });

  assert.equal(result.timezone, "America/Bogota");
  assert.deepEqual(result.activeTimezones, ["America/Bogota"]);
});

test("normalizes legacy call records without throwing", () => {
  const result = validators.normalizeCall(
    {
      callId: 55,
      description: null,
      createdAt: null,
      time: "99:99",
      date: "bad",
      hour: 44
    },
    { operatorName: "Ana" }
  );

  assert.equal(result.callId, "55");
  assert.equal(result.description, "");
  assert.equal(result.operatorName, "Ana");
  assert.equal(result.time, "00:00");
  assert.equal(result.date, "01.01");
  assert.equal(result.hour, 23);
  assert.ok(result.createdAt);
});

test("cleans clipboard call IDs to a single bounded line", () => {
  assert.equal(validators.cleanClipboardCallId("  ABC-123  \nignore this"), "ABC-123");
  assert.equal(validators.cleanClipboardCallId("ABC_456"), "ABC_456");
  assert.equal(validators.cleanClipboardCallId("CALL.2026.07"), "CALL.2026.07");
  assert.equal(validators.cleanClipboardCallId("id<script>alert(1)</script>"), "idscriptalert1script");
  assert.equal(validators.cleanClipboardCallId("contraseña!@#$%^&*()"), "contrasea");
  assert.equal(validators.cleanClipboardCallId(""), "");
  assert.equal(validators.cleanClipboardCallId(null), "");
  assert.equal(validators.cleanClipboardCallId("A".repeat(300)), "A".repeat(120));
});

test("preserves existing Markdown documents when normalizing the Script library", () => {
  const note = validators.normalizeNote({
    id: "script-1",
    title: "Guion de venta",
    content: "# Producto\n\n- Beneficio\n- **Oferta**",
    createdAt: "2026-06-01T12:00:00.000Z",
    updatedAt: "2026-06-20T14:30:00.000Z"
  });

  assert.equal(note.id, "script-1");
  assert.equal(note.title, "Guion de venta");
  assert.match(note.content, /\*\*Oferta\*\*/);
  assert.equal(note.documentType, "markdown");
  assert.equal(note.updatedAt, "2026-06-20T14:30:00.000Z");
});

test("normalizes plain text and embedded PDF documents without losing their type", () => {
  const plain = validators.normalizeNote({ title: "Plain", content: "Call the customer tomorrow." });
  const pdf = validators.normalizeNote({
    title: "Policy",
    documentType: "pdf",
    pdfData: ` \n${Buffer.from("%PDF-test").toString("base64")}@#$`,
    pinned: true,
    originalName: "policy.pdf"
  });

  assert.equal(plain.documentType, "txt");
  assert.equal(validators.normalizeNote({ title: "Italic", content: "Call *tomorrow*." }).documentType, "markdown");
  assert.equal(validators.normalizeNote({ title: "Code", content: "Use `CTRL+C`." }).documentType, "markdown");
  assert.equal(pdf.documentType, "pdf");
  assert.equal(pdf.pinned, true);
  assert.equal(Buffer.from(pdf.pdfData, "base64").toString(), "%PDF-test");
});

test("preserves full-pause timer state without active start timestamps", () => {
  const timer = validators.normalizeWorkTimer({
    status: "stopped",
    previousStatus: "working",
    workElapsedMs: 5400000,
    workStartedAt: null,
    currentBreakStartedAt: null,
    breaks: []
  });

  assert.equal(timer.status, "stopped");
  assert.equal(timer.previousStatus, "working");
  assert.equal(timer.workElapsedMs, 5400000);
  assert.equal(timer.workStartedAt, null);
  assert.equal(timer.currentBreakStartedAt, null);
});
