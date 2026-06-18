const test = require("node:test");
const assert = require("node:assert/strict");

const reminders = require("../src/renderer/scripts/reminders");

test("normalizes non-completed reminders based on due date", () => {
  const originalNow = Date;
  const fixedNow = new originalNow("2026-06-18T12:00:00");

  global.Date = class extends originalNow {
    constructor(...args) {
      return args.length ? new originalNow(...args) : fixedNow;
    }

    static now() {
      return fixedNow.getTime();
    }
  };

  try {
    assert.equal(reminders.normalizeReminder({ date: "2026-06-18", time: "11:59", status: "pending" }).status, "overdue");
    assert.equal(reminders.normalizeReminder({ date: "2026-06-18", time: "12:01", status: "pending" }).status, "pending");
    assert.equal(reminders.normalizeReminder({ date: "2026-06-17", time: "09:00", status: "completed" }).status, "completed");
  } finally {
    global.Date = originalNow;
  }
});

test("filters reminders by today, tomorrow and overdue", () => {
  const originalNow = Date;
  const fixedNow = new originalNow("2026-06-18T12:00:00");

  global.Date = class extends originalNow {
    constructor(...args) {
      return args.length ? new originalNow(...args) : fixedNow;
    }

    static now() {
      return fixedNow.getTime();
    }
  };

  const items = [
    { id: "past", date: "2026-06-18", time: "11:00", status: "pending" },
    { id: "today", date: "2026-06-18", time: "13:00", status: "pending" },
    { id: "tomorrow", date: "2026-06-19", time: "09:00", status: "pending" },
    { id: "done", date: "2026-06-18", time: "10:00", status: "completed" }
  ];

  try {
    assert.deepEqual(reminders.filterReminders(items, "today").map((item) => item.id), ["past", "today"]);
    assert.deepEqual(reminders.filterReminders(items, "tomorrow").map((item) => item.id), ["tomorrow"]);
    assert.deepEqual(reminders.filterReminders(items, "overdue").map((item) => item.id), ["past"]);
    assert.deepEqual(reminders.filterReminders(items, "completed").map((item) => item.id), ["done"]);
  } finally {
    global.Date = originalNow;
  }
});

test("filters reminders using each reminder timezone", () => {
  const originalNow = Date;
  const fixedNow = new originalNow("2026-06-18T22:30:00.000Z");

  global.Date = class extends originalNow {
    constructor(...args) {
      return args.length ? new originalNow(...args) : fixedNow;
    }

    static now() {
      return fixedNow.getTime();
    }
  };

  const items = [
    { id: "madrid", date: "2026-06-19", time: "09:00", timezone: "Europe/Madrid", status: "pending" },
    { id: "bogota", date: "2026-06-18", time: "16:00", timezone: "America/Bogota", status: "pending" }
  ];

  try {
    assert.deepEqual(reminders.filterReminders(items, "today").map((item) => item.id), ["madrid", "bogota"]);
  } finally {
    global.Date = originalNow;
  }
});

test("preserves status in normalizeReminder if deleted", () => {
  assert.equal(reminders.normalizeReminder({ date: "2026-06-18", time: "11:59", status: "deleted" }).status, "deleted");
});

test("filters and excludes deleted reminders correctly", () => {
  const originalNow = Date;
  const fixedNow = new originalNow("2026-06-18T12:00:00");

  global.Date = class extends originalNow {
    constructor(...args) {
      return args.length ? new originalNow(...args) : fixedNow;
    }

    static now() {
      return fixedNow.getTime();
    }
  };

  const items = [
    { id: "active", date: "2026-06-18", time: "13:00", status: "pending" },
    { id: "trash", date: "2026-06-18", time: "14:00", status: "deleted" }
  ];

  try {
    assert.deepEqual(reminders.filterReminders(items, "today").map((item) => item.id), ["active"]);
    assert.deepEqual(reminders.filterReminders(items, "deleted").map((item) => item.id), ["trash"]);
  } finally {
    global.Date = originalNow;
  }
});
