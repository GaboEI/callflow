(function () {
  function startOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  function daysBetween(target, base = new Date()) {
    return Math.floor((startOfDay(target) - startOfDay(base)) / 86400000);
  }

  function normalizeReminder(reminder) {
    if (reminder.status === "completed") {
      return reminder;
    }
    const due = new Date(`${reminder.date}T${reminder.time || "00:00"}`);
    return { ...reminder, status: due < new Date() ? "overdue" : "pending" };
  }

  function filterReminders(reminders, filter) {
    const normalized = reminders.map(normalizeReminder);
    return normalized.filter((reminder) => {
      if (filter === "completed") return reminder.status === "completed";
      if (filter === "overdue") return reminder.status === "overdue";
      if (reminder.status === "completed") return false;

      const diff = daysBetween(new Date(`${reminder.date}T00:00`));
      if (filter === "today") return diff === 0;
      if (filter === "tomorrow") return diff === 1;
      if (filter === "week") return diff >= 0 && diff <= 7;
      return true;
    });
  }

  window.CallFlowReminders = { normalizeReminder, filterReminders };
})();
