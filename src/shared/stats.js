(function () {
  function countMatching(calls, label) {
    const needle = String(label || "").toLowerCase();
    if (!needle) return 0;
    return calls.filter((call) => String(call.description || "").toLowerCase().includes(needle)).length;
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
    const pendingReminders = reminders.filter((reminder) => reminder.status !== "completed" && reminder.status !== "deleted").length;
    const noAnswer = noAnswerLabel(settings);
    const callsWithOutcome = calls.filter((call) => call.primaryOutcome && call.primaryOutcome.category);
    const callsWithoutOutcome = calls.filter((call) => !call.primaryOutcome || !call.primaryOutcome.category);
    return {
      total: calls.length,
      success:
        callsWithOutcome.filter((call) => call.primaryOutcome.category === "success").length +
        countMatching(callsWithoutOutcome, settings.successLabel),
      rejections:
        callsWithOutcome.filter((call) => call.primaryOutcome.category === "rejection").length +
        countMatching(callsWithoutOutcome, settings.rejectionLabel),
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

  const api = { buildStats };

  if (typeof window !== "undefined") {
    window.CallFlowStats = api;
  }

  if (typeof module !== "undefined") {
    module.exports = api;
  }
})();
