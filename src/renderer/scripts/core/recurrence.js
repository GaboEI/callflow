(function () {
  function addDaysIso(isoDate, days) {
    const [year, month, day] = isoDate.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day + days));
    return date.toISOString().slice(0, 10);
  }

  function isoWeekday(isoDate) {
    const [year, month, day] = isoDate.split("-").map(Number);
    return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  }

  function addOneMonthClampedIso(isoDate) {
    const [year, month, day] = isoDate.split("-").map(Number);
    const target = new Date(Date.UTC(year, month, 1));
    const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
    target.setUTCDate(Math.min(day, lastDay));
    return target.toISOString().slice(0, 10);
  }

  function nextRecurringReminder(reminder, options) {
    const repeat = reminder.repeat || "once";
    if (repeat === "once") return null;
    const timezone = reminder.timezone || options.resolveTimezone();
    let nextDate = reminder.date;
    let nextDueAt = options.zonedDateTimeToUtc(nextDate, reminder.time, timezone);
    if (!nextDueAt) return null;
    const now = options.now || new Date();
    do {
      if (repeat === "daily") {
        nextDate = addDaysIso(nextDate, 1);
      } else if (repeat === "weekdays") {
        nextDate = addDaysIso(nextDate, 1);
        while (isoWeekday(nextDate) === 0 || isoWeekday(nextDate) === 6) {
          nextDate = addDaysIso(nextDate, 1);
        }
      } else if (repeat === "weekly") {
        nextDate = addDaysIso(nextDate, 7);
      } else if (repeat === "monthly") {
        nextDate = addOneMonthClampedIso(nextDate);
      } else {
        return null;
      }
      nextDueAt = options.zonedDateTimeToUtc(nextDate, reminder.time, timezone);
    } while (nextDueAt && nextDueAt <= now);
    if (!nextDueAt) return null;
    return {
      ...reminder,
      id: options.createId(),
      date: nextDate,
      time: reminder.time,
      timezone,
      dueAt: nextDueAt.toISOString(),
      status: "pending",
      createdAt: now.toISOString(),
      previousReminderId: reminder.id,
      completedAt: undefined,
      updatedAt: undefined
    };
  }

  const api = { addDaysIso, addOneMonthClampedIso, isoWeekday, nextRecurringReminder };

  if (typeof window !== "undefined") {
    window.CallFlowRecurrence = api;
  }

  if (typeof module !== "undefined") {
    module.exports = api;
  }
})();
