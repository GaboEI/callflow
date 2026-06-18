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
    repeat: "once",
    note: "Call back"
  });
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
