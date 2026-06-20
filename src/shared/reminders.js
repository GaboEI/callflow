(function () {
  const validators =
    typeof window !== "undefined" ? window.CallFlowValidators : typeof require !== "undefined" ? require("./validators") : null;

  function daysBetweenIso(targetIso, baseIso) {
    const target = new Date(`${targetIso}T00:00:00Z`);
    const base = new Date(`${baseIso}T00:00:00Z`);
    return Math.floor((target - base) / 86400000);
  }

  function normalizeReminder(reminder, settings) {
    if (reminder.status === "completed" || reminder.status === "deleted") {
      return reminder;
    }
    const due = validators ? validators.reminderDueDate(reminder, settings) : new Date(`${reminder.date}T${reminder.time || "00:00"}`);
    if (!due) return { ...reminder, status: "invalid" };
    return { ...reminder, status: due < new Date() ? "overdue" : "pending" };
  }

  function normalizeRange(range) {
    if (!range || typeof range !== "object") return null;
    const from = /^\d{4}-\d{2}-\d{2}$/.test(range.from || "") ? range.from : "";
    const to = /^\d{4}-\d{2}-\d{2}$/.test(range.to || "") ? range.to : "";
    if (!from && !to) return null;
    const start = from || to;
    const end = to || from;
    return start <= end ? { from: start, to: end } : { from: end, to: start };
  }

  function filterReminders(reminders, filter, settings, options = {}) {
    const range = normalizeRange(options.range || options);
    const normalized = reminders.map((reminder) => normalizeReminder(reminder, settings));
    return normalized.filter((reminder) => {
      if (filter === "deleted") return reminder.status === "deleted";
      if (reminder.status === "deleted") return false;

      if (filter === "completed") return reminder.status === "completed";
      if (filter === "overdue") return reminder.status === "overdue";
      if (reminder.status === "completed") return false;

      if (reminder.status === "invalid") return filter === "invalid" || filter === "all";
      const timezone = reminder.timezone || (settings && settings.timezone) || "local";
      const today = validators ? validators.isoDateInTimezone(new Date(), timezone) : new Date().toISOString().slice(0, 10);
      const diff = daysBetweenIso(reminder.date, today);
      if (filter === "today") return diff === 0;
      if (filter === "tomorrow") return diff === 1;
      if (filter === "week") return diff >= 0 && diff <= 7;
      if (filter === "range") return range ? reminder.date >= range.from && reminder.date <= range.to : true;
      return true;
    });
  }

  const api = { normalizeReminder, filterReminders };

  if (typeof window !== "undefined") {
    window.CallFlowReminders = api;
  }

  if (typeof module !== "undefined") {
    module.exports = api;
  }
})();
