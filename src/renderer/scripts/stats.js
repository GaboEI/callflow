(function () {
  function countMatching(calls, label) {
    const needle = String(label || "").toLowerCase();
    if (!needle) return 0;
    return calls.filter((call) => call.description.toLowerCase().includes(needle)).length;
  }

  function countBy(calls, key) {
    return calls.reduce((result, call) => {
      const value = String(call[key] || "").trim();
      if (!value) return result;
      result[value] = (result[value] || 0) + 1;
      return result;
    }, {});
  }

  function normalized(value) {
    return String(value || "").toLowerCase();
  }

  function noAnswerLabel(settings) {
    const knownLabels = ["Sin_respuesta", "No_answer", "Нет_ответа"];
    return (
      (settings.frequentStatuses || []).find((status) =>
        knownLabels.some((label) => normalized(label) === normalized(status))
      ) || "Sin_respuesta"
    );
  }

  function countFrequentStatuses(calls, settings, excludedLabels) {
    const excluded = new Set(excludedLabels.map(normalized));
    return (settings.frequentStatuses || []).reduce((result, status) => {
      if (!status || excluded.has(normalized(status))) return result;
      const count = countMatching(calls, status);
      if (count > 0) result[status] = count;
      return result;
    }, {});
  }

  function buildStats(calls, reminders, settings) {
    const pendingReminders = reminders.filter((reminder) => reminder.status !== "completed").length;
    const noAnswer = noAnswerLabel(settings);
    return {
      total: calls.length,
      success: countMatching(calls, settings.successLabel),
      rejections: countMatching(calls, settings.rejectionLabel),
      noAnswer: countMatching(calls, noAnswer),
      statusCounts: countFrequentStatuses(calls, settings, [
        settings.successLabel,
        settings.rejectionLabel,
        noAnswer
      ]),
      byType: countBy(calls, "callType"),
      pendingReminders
    };
  }

  window.CallFlowStats = { buildStats };
})();
