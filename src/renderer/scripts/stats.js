(function () {
  function countMatching(calls, label) {
    const needle = String(label || "").toLowerCase();
    return calls.filter((call) => call.description.toLowerCase().includes(needle)).length;
  }

  function countBy(calls, key) {
    return calls.reduce((result, call) => {
      const value = call[key] || "N/A";
      result[value] = (result[value] || 0) + 1;
      return result;
    }, {});
  }

  function buildStats(calls, reminders, settings) {
    const pendingReminders = reminders.filter((reminder) => reminder.status !== "completed").length;
    return {
      total: calls.length,
      success: countMatching(calls, settings.successLabel),
      rejections: countMatching(calls, settings.rejectionLabel),
      noAnswer: countMatching(calls, "Sin_respuesta"),
      byType: countBy(calls, "callType"),
      byHour: countBy(calls, "block"),
      pendingReminders
    };
  }

  window.CallFlowStats = { buildStats };
})();
