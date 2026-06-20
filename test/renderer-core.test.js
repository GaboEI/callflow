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

test("timer core tracks daily work separately from total work", () => {
  const working = {
    status: "working",
    workElapsedMs: 3600000,
    workStartedAt: "2026-06-18T10:00:00.000Z",
    dailyWorkDate: "2026-06-18",
    dailyWorkElapsedMs: 60000,
    dailyWorkStartedAt: "2026-06-18T10:00:00.000Z",
    breaks: []
  };
  const now = new Date("2026-06-18T10:05:00.000Z");

  assert.equal(timers.currentWorkElapsed(working, now.getTime()), 3900000);
  assert.equal(timers.currentDailyWorkElapsed(working, now.getTime()), 360000);

  const paused = timers.toggleShiftTimer(working, now, "2026-06-18");
  assert.equal(paused.status, "paused");
  assert.equal(paused.workElapsedMs, 3900000);
  assert.equal(paused.dailyWorkElapsedMs, 360000);

  const nextDay = timers.ensureDailyWorkTimer(paused, "2026-06-19", new Date("2026-06-19T08:00:00.000Z"));
  assert.equal(nextDay.workElapsedMs, 3900000);
  assert.equal(nextDay.dailyWorkElapsedMs, 0);
  assert.equal(nextDay.dailyWorkDate, "2026-06-19");
  assert.equal(nextDay.dailyWorkHistory["2026-06-18"], 360000);
  assert.deepEqual(timers.dailyWorkEntries(nextDay), { "2026-06-18": 360000, "2026-06-19": 0 });

  const activeNextDay = timers.ensureDailyWorkTimer(working, "2026-06-19", now);
  assert.equal(activeNextDay.dailyWorkHistory["2026-06-18"], 360000);
});

test("settings normalize dated finance transactions", () => {
  const normalized = validators.normalizeSettings({
    financial: {
      currency: "USD",
      hourlyRate: 7,
      transactions: [
        { id: "bonus-1", date: "2026-06-18", type: "bonus", amount: 10, note: "Quality" },
        { id: "invalid", date: "bad", type: "deduction", amount: 0 }
      ]
    }
  });
  assert.equal(normalized.financial.hourlyRate, 7);
  assert.deepEqual(normalized.financial.transactions.map((item) => item.id), ["bonus-1"]);
  assert.equal(settings.normalizeSettings(normalized, validators).financial.transactions.length, 1);

  const migrated = validators.normalizeSettings({ financial: { bonuses: 12, deductions: 3 } });
  assert.deepEqual(migrated.financial.transactions.map((item) => [item.type, item.amount]), [
    ["bonus", 12],
    ["deduction", 3]
  ]);
});

test("finance settings preserve paid breaks and custom movement directions", () => {
  const normalized = validators.normalizeSettings({
    financial: {
      currency: "EUR",
      hourlyRate: 12,
      paidBreaks: true,
      movementTypes: [{ id: "commission", label: "Commission", direction: "income" }],
      transactions: [{ id: "fee", date: "2026-06-20", type: "commission", direction: "expense", amount: 4 }]
    }
  });

  assert.equal(normalized.financial.paidBreaks, true);
  assert.equal(normalized.financial.movementTypes[0].direction, "income");
  assert.equal(normalized.financial.transactions[0].direction, "expense");
});

test("manual time adjustments are aggregated by day and never produce negative work", () => {
  const timer = {
    dailyWorkHistory: { "2026-06-19": 30 * 60000 },
    timeAdjustments: [
      { date: "2026-06-19", minutes: -120 },
      { date: "2026-06-19", minutes: 60 },
      { date: "2026-06-18", minutes: 90 }
    ]
  };

  assert.deepEqual(timers.dailyWorkEntries(timer), {
    "2026-06-19": 0,
    "2026-06-18": 90 * 60000
  });
  assert.equal(validators.normalizeWorkTimer(timer).timeAdjustments.length, 3);
});

test("manual schedules override a day and preserve work tracked after saving", () => {
  const timer = {
    dailyWorkHistory: { "2026-06-19": 4 * 3600000 },
    manualWorkSchedules: [{
      date: "2026-06-19",
      hours: [7, 8, 9, 10, 11, 12],
      targetMinutes: 360,
      trackedAtSaveMs: 3 * 3600000
    }]
  };

  assert.equal(timers.dailyWorkEntries(timer)["2026-06-19"], 7 * 3600000);
  assert.deepEqual(validators.normalizeWorkTimer(timer).manualWorkSchedules[0].hours, [7, 8, 9, 10, 11, 12]);
});
