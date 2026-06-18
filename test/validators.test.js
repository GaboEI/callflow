const test = require("node:test");
const assert = require("node:assert/strict");

const validators = require("../src/renderer/scripts/validators");

test("normalizes malformed settings into production-safe defaults", () => {
  const result = validators.normalizeSettings({
    language: "bad",
    callTypes: "Ventas, Ventas, Soporte",
    frequentStatuses: [null, " Sin_respuesta ", "sin_respuesta"],
    notifyBeforeMinutes: -10,
    reminderSound: "loud",
    linePrefixMode: "bad",
    clockFormat: "bad"
  });

  assert.equal(result.language, "es");
  assert.deepEqual(result.callTypes, ["Ventas", "Soporte"]);
  assert.deepEqual(result.frequentStatuses, ["Sin_respuesta"]);
  assert.equal(result.notifyBeforeMinutes, 0);
  assert.equal(result.reminderSound, "soft");
  assert.equal(result.linePrefixMode, "hash");
  assert.equal(result.clockFormat, "24h");
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

test("normalizes active timezones with primary first and a max of ten", () => {
  const result = validators.normalizeSettings({
    timezone: "Europe/Madrid",
    activeTimezones: [
      "Europe/Rome",
      "Europe/Madrid",
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
  assert.equal(result.activeTimezones[0], "Europe/Madrid");
  assert.equal(result.lastReminderTimezone, "America/Bogota");
  assert.equal(result.activeTimezones.includes("UTC"), false);
  assert.deepEqual(result.pinnedClockTimezones, ["Europe/Madrid", "America/Bogota"]);
});

test("allows no pinned clocks while keeping active timezones available", () => {
  const result = validators.normalizeSettings({
    timezone: "Europe/Madrid",
    activeTimezones: ["Europe/Rome"],
    pinnedClockTimezones: []
  });

  assert.deepEqual(result.activeTimezones, ["Europe/Madrid", "Europe/Rome"]);
  assert.deepEqual(result.pinnedClockTimezones, []);
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
