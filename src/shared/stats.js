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

  function pct(value, total) {
    return total > 0 ? Math.round((value / total) * 1000) / 10 : 0;
  }

  function sortedEntries(counts, direction = "desc") {
    return Object.entries(counts).sort((a, b) =>
      direction === "asc" ? a[1] - b[1] || a[0].localeCompare(b[0]) : b[1] - a[1] || a[0].localeCompare(b[0])
    );
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

  function outcomeCategory(call, settings) {
    if (call.primaryOutcome && call.primaryOutcome.category) return call.primaryOutcome.category;
    const description = String(call.description || "").toLowerCase();
    if (settings.successLabel && description.includes(String(settings.successLabel).toLowerCase())) return "success";
    if (settings.rejectionLabel && description.includes(String(settings.rejectionLabel).toLowerCase())) return "rejection";
    return "neutral";
  }

  function callHour(call) {
    const hour = Number(call.hour);
    if (Number.isInteger(hour) && hour >= 0 && hour <= 23) return hour;
    if (call.createdAt) {
      const date = new Date(call.createdAt);
      if (!Number.isNaN(date.getTime())) return date.getHours();
    }
    return 0;
  }

  function defaultCallDate(call) {
    if (call.createdAt) {
      const date = new Date(call.createdAt);
      if (!Number.isNaN(date.getTime())) return date.toISOString().slice(0, 10);
    }
    const [day, month] = String(call.date || "").split(".");
    const year = new Date().getFullYear();
    return day && month ? `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}` : "";
  }

  function addCount(target, key, amount = 1) {
    if (!key && key !== 0) return;
    target[key] = (target[key] || 0) + amount;
  }

  function topLabel(entries, empty = "") {
    return entries.length ? entries[0][0] : empty;
  }

  function buildStatsAnalysis(calls, reminders, settings, options = {}) {
    const callDate = typeof options.callDate === "function" ? options.callDate : defaultCallDate;
    const callHourValue = typeof options.callHour === "function" ? options.callHour : callHour;
    const noAnswer = noAnswerLabel(settings);
    const byType = {};
    const byHour = {};
    const byDay = {};
    const byDaySuccess = {};
    const byDayRejection = {};
    const statusCounts = {};
    const outcomeLabels = { success: {}, rejection: {}, callback: {}, neutral: {} };
    const outcomeTotals = { success: 0, rejection: 0, callback: 0, neutral: 0 };

    calls.forEach((call) => {
      const category = outcomeCategory(call, settings);
      const hour = callHourValue(call);
      const isoDate = callDate(call);
      const label = call.primaryOutcome?.label || call.rawDescription || call.description || category;

      addCount(outcomeTotals, category);
      addCount(outcomeLabels[category] || outcomeLabels.neutral, label);
      addCount(byType, String(call.callType || "").trim());
      addCount(byHour, String(hour).padStart(2, "0"));
      addCount(byDay, isoDate);
      if (category === "success") addCount(byDaySuccess, isoDate);
      if (category === "rejection") addCount(byDayRejection, isoDate);

      (settings.frequentStatuses || []).forEach((status) => {
        if (!status) return;
        const description = String(call.description || "").toLowerCase();
        const raw = String(call.rawDescription || "").toLowerCase();
        if (description.includes(String(status).toLowerCase()) || raw === String(status).toLowerCase()) {
          addCount(statusCounts, status);
        }
      });
    });

    const total = calls.length;
    const callback = outcomeTotals.callback || 0;
    const success = outcomeTotals.success || 0;
    const rejections = outcomeTotals.rejection || 0;
    const noAnswerCount = countMatching(calls, noAnswer);
    const hourEntries = sortedEntries(byHour);
    const dayEntries = sortedEntries(byDay);
    const rejectionDayEntries = sortedEntries(byDayRejection);
    const successDayEntries = sortedEntries(byDaySuccess);
    const productiveHours = Object.values(byHour).filter((value) => value > 0);

    return {
      total,
      success,
      rejections,
      callback,
      noAnswer: noAnswerCount,
      neutral: Math.max(0, total - success - rejections - callback),
      rates: {
        success: pct(success, total),
        rejection: pct(rejections, total),
        callback: pct(callback, total),
        noAnswer: pct(noAnswerCount, total)
      },
      averages: {
        callsPerActiveHour: productiveHours.length ? Math.round((total / productiveHours.length) * 10) / 10 : 0,
        callsPerDay: dayEntries.length ? Math.round((total / dayEntries.length) * 10) / 10 : 0
      },
      byType,
      byHour,
      byDay,
      byDaySuccess,
      byDayRejection,
      statusCounts,
      outcomeLabels,
      pendingReminders: reminders.filter((reminder) => reminder.status !== "completed" && reminder.status !== "deleted").length,
      insights: {
        bestDay: topLabel(dayEntries),
        worstDay: topLabel(sortedEntries(byDay, "asc")),
        strongestHour: topLabel(hourEntries),
        weakestHour: topLabel(sortedEntries(byHour, "asc")),
        bestSuccessDay: topLabel(successDayEntries),
        mostRejectionsDay: topLabel(rejectionDayEntries),
        fewestRejectionsDay: topLabel(sortedEntries(byDayRejection, "asc"))
      }
    };
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

  const api = { buildStats, buildStatsAnalysis };

  if (typeof window !== "undefined") {
    window.CallFlowStats = api;
  }

  if (typeof module !== "undefined") {
    module.exports = api;
  }
})();
