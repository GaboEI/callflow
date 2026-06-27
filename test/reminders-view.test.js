const test = require("node:test");
const assert = require("node:assert/strict");

const remindersView = require("../src/renderer/scripts/views/reminders-view");
const recurrence = require("../src/renderer/scripts/core/recurrence");

test("reminders-view exports helpers via module.exports", () => {
  assert.equal(typeof remindersView.createRemindersView, "function");
  assert.equal(typeof remindersView.sortedReminders, "function");
  assert.equal(typeof remindersView.compactDuration, "function");
});

test("reminders-view status helpers classify pending overdue and completed reminders", () => {
  const validators = {
    reminderDueDate(reminder) {
      return reminder.dueAt ? new Date(reminder.dueAt) : null;
    }
  };

  assert.equal(remindersView.reminderStatusKey({ status: "pending", dueAt: "2026-06-27T10:00:00Z" }, "2026-06-27T09:00:00Z", validators, {}), "pending");
  assert.equal(remindersView.reminderStatusKey({ status: "pending", dueAt: "2026-06-27T08:00:00Z" }, "2026-06-27T09:00:00Z", validators, {}), "overdue");
  assert.equal(remindersView.reminderStatusKey({ status: "completed", dueAt: "2026-06-27T08:00:00Z" }, "2026-06-27T09:00:00Z", validators, {}), "completed");
  assert.equal(remindersView.reminderStatusKey({ status: "deleted", dueAt: "2026-06-27T08:00:00Z" }, "2026-06-27T09:00:00Z", validators, {}), "deleted");
});

test("reminders-view labels are driven by injected translation", () => {
  const t = (key) => `tr:${key}`;
  const validators = { reminderDueDate: () => new Date("2026-06-27T10:00:00Z") };

  assert.equal(remindersView.alarmPhaseLabel("early", t), "tr:alarmEarly");
  assert.equal(remindersView.alarmPhaseLabel("overdue", t), "tr:alarmOverdue");
  assert.equal(remindersView.alarmPhaseLabel("exact", t), "tr:alarmNow");
  assert.equal(remindersView.reminderRepeatLabel({ repeat: "daily" }, t), "tr:repeatDaily");
  assert.equal(remindersView.reminderStatusLabel({ status: "completed" }, t, "2026-06-27T09:00:00Z", validators, {}), "tr:reminderCompleted");
});

test("reminders-view compact duration and due dates handle boundaries", () => {
  assert.equal(remindersView.compactDuration(0), "0s");
  assert.equal(remindersView.compactDuration(1000), "1s");
  assert.equal(remindersView.compactDuration(61_000), "1min 1s");
  assert.equal(remindersView.compactDuration(3_600_000), "1h");
  assert.equal(remindersView.compactDuration(90_061_000), "1d 1h");

  const validators = { reminderDueDate: (reminder) => reminder.dueAt ? new Date(reminder.dueAt) : null };
  assert.match(remindersView.reminderDueDate({ dueAt: "2026-06-27T10:00:00Z" }, validators, {} ).toISOString(), /^2026-06-27T10:00:00\.000Z$/);
});

test("reminders-view sorted reminders keep stable ordering for equal due dates", () => {
  const reminders = [
    { id: "b", createdAt: "2026-06-27T10:00:01Z", dueAt: "2026-06-28T00:00:00Z" },
    { id: "a", createdAt: "2026-06-27T10:00:02Z", dueAt: "2026-06-28T00:00:00Z" },
    { id: "c", createdAt: "2026-06-27T10:00:00Z", dueAt: "2026-06-27T23:00:00Z" }
  ];
  const ordered = remindersView.sortedReminders(reminders, (reminder) => new Date(reminder.dueAt));
  assert.deepEqual(ordered.map((item) => item.id), ["c", "a", "b"]);
});

test("reminders-view recurring reminders delegate to core recurrence", () => {
  const base = {
    id: "r1",
    repeat: "daily",
    date: "2026-06-27",
    time: "08:00",
    timezone: "UTC"
  };
  const next = remindersView.nextRecurringReminder(base, recurrence, {
    createId: () => "next-id",
    now: new Date("2026-06-27T09:00:00Z"),
    resolveTimezone: () => "UTC",
    zonedDateTimeToUtc: (date, time) => new Date(`${date}T${time}:00Z`)
  });

  assert.equal(next.id, "next-id");
  assert.equal(next.previousReminderId, "r1");
  assert.equal(next.date, "2026-06-28");
});
