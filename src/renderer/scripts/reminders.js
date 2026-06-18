(function () {
  const validators =
    typeof window !== "undefined" ? window.CallFlowValidators : typeof require !== "undefined" ? require("./validators") : null;

  function daysBetweenIso(targetIso, baseIso) {
    const target = new Date(`${targetIso}T00:00:00Z`);
    const base = new Date(`${baseIso}T00:00:00Z`);
    return Math.floor((target - base) / 86400000);
  }

  function normalizeReminder(reminder, settings) {
    if (reminder.status === "completed") {
      return reminder;
    }
    const due = validators ? validators.reminderDueDate(reminder, settings) : new Date(`${reminder.date}T${reminder.time || "00:00"}`);
    if (!due) return { ...reminder, status: "invalid" };
    return { ...reminder, status: due < new Date() ? "overdue" : "pending" };
  }

  function filterReminders(reminders, filter, settings) {
    const normalized = reminders.map((reminder) => normalizeReminder(reminder, settings));
    return normalized.filter((reminder) => {
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
