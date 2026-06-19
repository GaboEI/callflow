const test = require("node:test");
const assert = require("node:assert/strict");

const markdown = require("../src/renderer/scripts/core/markdown");
const recurrence = require("../src/renderer/scripts/core/recurrence");
const settings = require("../src/renderer/scripts/core/settings");
const timers = require("../src/renderer/scripts/core/timers");
const timezones = require("../src/renderer/scripts/core/timezones");
const validators = require("../src/shared/validators");
const schema = require("../src/shared/schema");

test("settings core applies language presets and keeps unique list values", () => {
  assert.deepEqual(settings.uniqueItems("Ventas, Ventas\nSoporte"), ["Ventas", "Soporte"]);
  const normalized = settings.normalizeSettings({ language: "en", frequentStatuses: [] }, validators);

  assert.equal(settings.defaultSuccessLabel("en"), "Successful");
  assert.equal(settings.defaultRejectionLabel("en"), "Rejected");
  assert.deepEqual(normalized.frequentStatuses, ["No_answer", "Voicemail", "Answers_and_hangs_up", "Phone_off"]);
  assert.equal(settings.defaultCallbackLabel("en"), "Callback");
  assert.deepEqual(normalized.outcomePresets.callback.items, ["Callback"]);
  assert.deepEqual(schema.normalizeData("settings", { language: "ru", outcomePresets: { callback: { items: ["Rellamada"] } } }).outcomePresets.callback.items, [
    "Повторный_звонок"
  ]);
});

test("timezone core normalizes search text and localizes city labels", () => {
  assert.equal(timezones.normalizeTimezoneSearch("America/New_York — UTC-04:00"), "america new york utc 04:00");
  assert.equal(timezones.localizedCity("New_York", "en"), "New York");
  assert.equal(timezones.localizedCity("New_York", "ru"), "Нью-Йорк");
  assert.match(
    timezones.timezoneOption("Europe/Madrid", "es", (key) => ({ localSystemTime: "Hora local" })[key] || key).searchText,
    /spain madrid/
  );
});

test("markdown preview escapes html before applying lightweight formatting", () => {
  assert.equal(markdown.escapeHtml("<script>alert('x')</script>"), "&lt;script&gt;alert(&#039;x&#039;)&lt;/script&gt;");
  assert.equal(markdown.markdownPreview("# Title\n**Safe** <b>x</b>"), "<h1>Title</h1><br /><strong>Safe</strong> &lt;b&gt;x&lt;/b&gt;");
});

test("recurrence core creates the next pending reminder by repeat mode", () => {
  const baseOptions = {
    createId: () => "next-id",
    now: new Date("2026-06-18T12:00:00.000Z"),
    resolveTimezone: () => "UTC",
    zonedDateTimeToUtc: validators.zonedDateTimeToUtc
  };

  const weekly = recurrence.nextRecurringReminder(
    { id: "old", date: "2026-06-18", time: "15:00", repeat: "weekly", timezone: "UTC", status: "completed" },
    baseOptions
  );
  assert.equal(weekly.id, "next-id");
  assert.equal(weekly.date, "2026-06-25");
  assert.equal(weekly.status, "pending");
  assert.equal(weekly.previousReminderId, "old");

  const monthly = recurrence.nextRecurringReminder(
    { id: "month", date: "2026-01-31", time: "10:00", repeat: "monthly", timezone: "UTC" },
    { ...baseOptions, now: new Date("2026-01-31T11:00:00.000Z") }
  );
  assert.equal(monthly.date, "2026-02-28");
});

test("timer core calculates work, break, toggle and freeze states", () => {
  const working = {
    status: "working",
    workElapsedMs: 60000,
    workStartedAt: "2026-06-18T10:00:00.000Z",
    breaks: []
  };
  const now = new Date("2026-06-18T10:05:00.000Z");

  assert.equal(timers.formatDuration(3661000), "01:01:01");
  assert.equal(timers.currentWorkElapsed(working, now.getTime()), 360000);

  const paused = timers.toggleShiftTimer(working, now);
  assert.equal(paused.status, "paused");
  assert.equal(paused.workElapsedMs, 360000);
  assert.equal(paused.currentBreakStartedAt, now.toISOString());

  const frozen = timers.freezeWorkTimer(paused, new Date("2026-06-18T10:07:00.000Z"));
  assert.equal(frozen.status, "stopped");
  assert.equal(frozen.previousStatus, "paused");
  assert.equal(frozen.breaks[0].durationMs, 120000);
});
