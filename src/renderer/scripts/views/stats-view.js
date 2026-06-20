(function () {
  function createStatsView(context) {
    const {
      $$,
      $,
      activeCalls,
      callIsoDate,
      compareIsoDate,
      displayIsoDate,
      escapeHtml,
      i18n,
      runAction,
      setStatusMessage,
      state,
      stats,
      storage,
      timers,
      validators: V
    } = context;
    let scheduleDate = null;
    let scheduleEditing = false;
    let selectedScheduleHours = new Set();
    let timesheetAnchor = null;

    function language() {
      return state.settings.language || "es";
    }

    function t(key) {
      return i18n.t(key, language());
    }

    function addDays(isoDate, days) {
      const date = new Date(`${isoDate}T00:00:00`);
      date.setDate(date.getDate() + days);
      return date.toISOString().slice(0, 10);
    }

    function startOfWeek(isoDate) {
      const date = new Date(`${isoDate}T00:00:00`);
      const day = date.getDay() || 7;
      date.setDate(date.getDate() - day + 1);
      return date.toISOString().slice(0, 10);
    }

    function statsTimezone() {
      return state.settings.statsTimezone || state.settings.timezone || "local";
    }

    function isoDateInStatsTimezone(date = new Date()) {
      return V.isoDateInTimezone(date, statsTimezone());
    }

    function callIsoDateInStatsTimezone(call) {
      if (call.createdAt) return V.isoDateInTimezone(new Date(call.createdAt), statsTimezone());
      return callIsoDate(call);
    }

    function callHourInStatsTimezone(call) {
      if (call.createdAt) {
        return Number(V.timeInTimezone(new Date(call.createdAt), statsTimezone()).slice(0, 2)) || 0;
      }
      return Number(call.hour) || 0;
    }

    function cycleStartForDate(isoDate) {
      const day = Math.min(28, Math.max(1, Number(state.settings.statsCycleStartDay) || 1));
      const [year, month, currentDay] = isoDate.split("-").map(Number);
      const cycleMonth = currentDay >= day ? month - 1 : month - 2;
      return new Date(Date.UTC(year, cycleMonth, day)).toISOString().slice(0, 10);
    }

    function statsRangeBounds() {
      const today = isoDateInStatsTimezone();
      const allCalls = activeCalls();
      const sortedDates = allCalls.map(callIsoDateInStatsTimezone).filter(Boolean).sort(compareIsoDate);

      if (state.statsRange.preset === "yesterday") {
        const date = addDays(today, -1);
        return { from: date, to: date };
      }
      if (state.statsRange.preset === "week") return { from: startOfWeek(today), to: today };
      if (state.statsRange.preset === "month") return { from: cycleStartForDate(today), to: today };
      if (state.statsRange.preset === "last7") return { from: addDays(today, -6), to: today };
      if (state.statsRange.preset === "last30") return { from: addDays(today, -29), to: today };
      if (state.statsRange.preset === "all") {
        return { from: sortedDates[0] || today, to: sortedDates[sortedDates.length - 1] || today };
      }
      if (state.statsRange.preset === "custom") {
        const from = state.statsRange.from || today;
        const to = state.statsRange.to || from;
        return compareIsoDate(from, to) <= 0 ? { from, to } : { from: to, to: from };
      }
      return { from: today, to: today };
    }

    function callsForStatsRange() {
      const range = statsRangeBounds();
      return activeCalls().filter((call) => {
        const isoDate = callIsoDateInStatsTimezone(call);
        return compareIsoDate(isoDate, range.from) >= 0 && compareIsoDate(isoDate, range.to) <= 0;
      });
    }

    function currentAnalysis() {
      return stats.buildStatsAnalysis(callsForStatsRange(), state.reminders, state.settings, {
        callDate: callIsoDateInStatsTimezone,
        callHour: callHourInStatsTimezone
      });
    }

    function callHourKey(call) {
      return String(callHourInStatsTimezone(call)).padStart(2, "0");
    }

    function outcomeCategory(call) {
      if (call.primaryOutcome && call.primaryOutcome.category) return call.primaryOutcome.category;
      const description = String(call.description || "").toLowerCase();
      if (state.settings.successLabel && description.includes(String(state.settings.successLabel).toLowerCase())) return "success";
      if (state.settings.rejectionLabel && description.includes(String(state.settings.rejectionLabel).toLowerCase())) return "rejection";
      return "neutral";
    }

    function isNoAnswerCall(call) {
      const known = ["sin_respuesta", "no_answer", "нет_ответа"];
      const configured = (state.settings.frequentStatuses || []).filter((status) =>
        known.includes(String(status || "").toLowerCase())
      );
      const labels = configured.length ? configured : known;
      const description = String(call.description || "").toLowerCase();
      const raw = String(call.rawDescription || "").toLowerCase();
      return labels.some((label) => description.includes(String(label).toLowerCase()) || raw === String(label).toLowerCase());
    }

    function summarizeCalls(calls) {
      const total = calls.length;
      const success = calls.filter((call) => outcomeCategory(call) === "success").length;
      const rejections = calls.filter((call) => outcomeCategory(call) === "rejection").length;
      const callback = calls.filter((call) => outcomeCategory(call) === "callback").length;
      const successRate = total ? Math.round((success / total) * 1000) / 10 : 0;
      return { total, success, rejections, callback, successRate };
    }

    function facetLabel(facet) {
      if (!facet) return "";
      if (facet.kind === "type") return facet.value;
      const labels = {
        success: t("statsPositiveResults"),
        rejection: t("statsNegativeResults"),
        callback: t("statsCallbacks"),
        noAnswer: t("statsNoAnswer")
      };
      return labels[facet.value] || facet.value;
    }

    function syncRangeInputs() {
      const range = statsRangeBounds();
      $("#statsDateFrom").value = range.from;
      $("#statsDateTo").value = range.to;
      $$(".stats-range-field").forEach((field) => field.classList.toggle("hidden", state.statsRange.preset !== "custom"));
      $$("[data-stats-period]").forEach((button) => {
        const active = button.dataset.statsPeriod === state.statsRange.preset;
        button.classList.toggle("report-period-chip--active", active);
        button.setAttribute("aria-pressed", active ? "true" : "false");
      });
      $("#statsRangeLabel").textContent = `${displayIsoDate(range.from)} - ${displayIsoDate(range.to)} · ${statsTimezone()} · ${t("statsCycleStartDay")} ${state.settings.statsCycleStartDay || 1}`;
    }

    function formattedDuration(ms) {
      return timers.formatDuration(ms || 0);
    }

    function workMsForRange(range = statsRangeBounds()) {
      const timer = state.workTimer || {};
      return Object.entries(timers.dailyWorkEntries(timer)).reduce((total, [date, durationMs]) => {
        return compareIsoDate(date, range.from) >= 0 && compareIsoDate(date, range.to) <= 0
          ? total + (Number(durationMs) || 0)
          : total;
      }, 0);
    }

    function breakMsForRange(range = statsRangeBounds()) {
      const today = isoDateInStatsTimezone();
      const breaks = (state.workTimer?.breaks || [])
        .filter((item) => {
          const breakDate = V.isoDateInTimezone(new Date(item.startedAt), statsTimezone());
          return compareIsoDate(breakDate, range.from) >= 0 && compareIsoDate(breakDate, range.to) <= 0;
        })
        .reduce((sum, item) => sum + (Number(item.durationMs) || 0), 0);
      return compareIsoDate(range.from, today) <= 0 && compareIsoDate(today, range.to) <= 0
        ? breaks + timers.currentBreakElapsed(state.workTimer)
        : breaks;
    }

    function workTimeSummary() {
      const range = statsRangeBounds();
      const workMs = workMsForRange(range);
      const breakMs = breakMsForRange(range);
      return {
        workMs,
        breakMs,
        work: formattedDuration(workMs),
        breaks: formattedDuration(breakMs)
      };
    }

    function paidMsForRange(time) {
      return time.workMs + (state.settings.financial?.paidBreaks ? time.breakMs : 0);
    }

    function financialSummary(time) {
      const config = state.settings.financial || {};
      const hourlyRate = Number(config.hourlyRate) || 0;
      const currency = config.currency || "USD";
      const range = statsRangeBounds();
      const adjustments = (config.transactions || []).reduce((sum, item) => {
        if (compareIsoDate(item.date, range.from) < 0 || compareIsoDate(item.date, range.to) > 0) return sum;
        return sum + (item.direction === "expense" || item.type === "deduction" ? -Number(item.amount) : Number(item.amount));
      }, 0);
      const amount = (paidMsForRange(time) / 3600000) * hourlyRate + adjustments;
      return `${currency} ${Math.round(amount * 100) / 100}`;
    }

    function callsPerWorkedHour(totalCalls, workMs) {
      if (workMs <= 0) return t("statsNoWorkTime");
      return Math.round((totalCalls / (workMs / 3600000)) * 10) / 10;
    }

    function renderSummary(analysis) {
      const time = workTimeSummary();
      const cards = [
        [t("statsTotalCalls"), analysis.total, "", "primary"],
        [t("statsPositiveResults"), analysis.success, "success-metric", "primary"],
        [t("statsSuccessRate"), `${analysis.rates.success}%`, "success-metric", "primary"],
        [t("statsNegativeResults"), analysis.rejections, "rejection-metric", "primary"],
        [t("statsCallbacks"), analysis.callback, "callback-metric", ""],
        [t("statsNoAnswer"), analysis.noAnswer, "", ""],
        [t("statsAvgCallsHour"), callsPerWorkedHour(analysis.total, time.workMs), "", ""],
        [t("statsWorkTime"), time.work, "", "secondary"],
        [t("statsBreakTime"), time.breaks, "", "secondary"],
        [t("statsEstimatedEarnings"), financialSummary(time), "success-metric", "secondary"]
      ];
      $("#statsSummaryCards").innerHTML = cards
        .map(
          ([label, value, className, priority]) => `
            <article class="stats-summary-card ${className} ${priority ? `stats-kpi-${priority}` : ""}">
              <span class="muted">${escapeHtml(label)}</span>
              <strong>${escapeHtml(String(value))}</strong>
            </article>
          `
        )
        .join("");
    }

    function renderActivityMap(analysis) {
      const range = statsRangeBounds();
      const max = Math.max(1, ...Object.values(analysis.byDay));
      const days = [];
      for (let date = range.from; compareIsoDate(date, range.to) <= 0; date = addDays(date, 1)) {
        days.push(date);
        if (days.length > 370) break;
      }
      $("#statsActivityMap").innerHTML = analysis.total === 0
        ? `<p class="stats-empty-message">${escapeHtml(t("statsNoCallsRange"))}</p>`
        : days.length
        ? days
            .map((date) => {
              const count = analysis.byDay[date] || 0;
              const level = count === 0 ? 0 : Math.max(1, Math.ceil((count / max) * 4));
              const selected = state.selectedStatsDay === date;
              return `<button type="button" class="stats-day-cell level-${level}${selected ? " selected" : ""}" data-stats-day="${escapeHtml(date)}" title="${escapeHtml(`${displayIsoDate(date)} · ${count} llamadas`)}" aria-label="${escapeHtml(`${displayIsoDate(date)} · ${count} llamadas`)}"></button>`;
            })
            .join("")
        : `<p class="muted">${escapeHtml(t("statsNoData"))}</p>`;
    }

    function scheduleForDate(date) {
      return (state.workTimer?.manualWorkSchedules || []).find((item) => item.date === date) || null;
    }

    function loadScheduleDate(date) {
      const today = isoDateInStatsTimezone();
      scheduleDate = compareIsoDate(date, today) > 0 ? today : date;
      selectedScheduleHours = new Set(scheduleForDate(scheduleDate)?.hours || []);
      scheduleEditing = false;
      renderScheduleEditor();
    }

    function openTimeAdjustment(date = isoDateInStatsTimezone()) {
      loadScheduleDate(date);
      $("#timeAdjustmentModal").classList.remove("hidden");
    }

    function closeTimeAdjustment() {
      $("#timeAdjustmentModal").classList.add("hidden");
      scheduleEditing = false;
    }

    function schedulePeriodCards() {
      const periods = [
        ["statsEarlyMorning", 0, 6],
        ["statsMorning", 6, 8],
        ["statsDaytime", 8, 13],
        ["statsAfternoon", 13, 17],
        ["statsEvening", 17, 24]
      ];
      const cards = [["statsTotal", 0, 24], ...periods];
      return cards.map(([key, from, to], index) => {
        const count = [...selectedScheduleHours].filter((hour) => hour >= from && hour < to).length;
        return `<article class="schedule-period-card period-${index}"><span>${escapeHtml(t(key))}</span><strong>${count}h</strong><small>${String(from).padStart(2, "0")}:00–${String(to).padStart(2, "0")}:00</small></article>`;
      }).join("");
    }

    function renderScheduleEditor() {
      if (!scheduleDate) return;
      const trackedMs = Number(timers.trackedDailyWorkEntries(state.workTimer)[scheduleDate]) || 0;
      $("#scheduleDate").value = scheduleDate;
      $("#scheduleDate").max = isoDateInStatsTimezone();
      $("#scheduleNextDay").disabled = scheduleDate >= isoDateInStatsTimezone();
      $("#schedulePeriodSummary").innerHTML = schedulePeriodCards();
      $("#scheduleSelectedTotal").textContent = timers.formatDuration(selectedScheduleHours.size * 3600000).slice(0, 5);
      $("#scheduleRecordedHint").textContent = `${t("statsClockRecorded")}: ${timers.formatDuration(trackedMs).slice(0, 5)}`;
      const editButton = $("#scheduleEditToggle");
      editButton.textContent = scheduleEditing ? "🔓" : "🔒";
      editButton.title = t(scheduleEditing ? "statsLockSchedule" : "statsUnlockSchedule");
      $("#saveSchedule").disabled = !scheduleEditing;
      $("#scheduleHourGrid").classList.toggle("is-locked", !scheduleEditing);
      $("#scheduleHourGrid").innerHTML = Array.from({ length: 24 }, (_item, hour) => {
        const selected = selectedScheduleHours.has(hour);
        const period = hour < 6 ? 1 : hour < 8 ? 2 : hour < 13 ? 3 : hour < 17 ? 4 : 5;
        return `<button type="button" class="schedule-hour period-${period}${selected ? " selected" : ""}" data-schedule-hour="${hour}" ${scheduleEditing ? "" : "disabled"}><span>${String(hour).padStart(2, "0")}:00</span><small>${selected ? "✓" : ""}</small></button>`;
      }).join("");
    }

    function toggleScheduleHour(hour) {
      if (!scheduleEditing) return;
      if (selectedScheduleHours.has(hour)) selectedScheduleHours.delete(hour);
      else selectedScheduleHours.add(hour);
      renderScheduleEditor();
    }

    async function saveSchedule() {
      if (!scheduleEditing || !scheduleDate) return;
      const trackedAtSaveMs = Number(timers.trackedDailyWorkEntries(state.workTimer)[scheduleDate]) || 0;
      const schedule = {
        date: scheduleDate,
        hours: [...selectedScheduleHours].sort((a, b) => a - b),
        targetMinutes: selectedScheduleHours.size * 60,
        trackedAtSaveMs,
        updatedAt: new Date().toISOString()
      };
      const schedules = (state.workTimer?.manualWorkSchedules || []).filter((item) => item.date !== scheduleDate);
      state.workTimer = V.normalizeWorkTimer({ ...state.workTimer, manualWorkSchedules: [...schedules, schedule] });
      await runAction(async () => {
        await storage.write("workTimer", state.workTimer);
        scheduleEditing = false;
        render();
        renderScheduleEditor();
        setStatusMessage(t("statsScheduleSaved"), "success");
      });
    }

    function currentTimesheetAnchor() {
      const [year, month] = isoDateInStatsTimezone().split("-").map(Number);
      return new Date(year, month - 1, 1);
    }

    function renderTimesheet() {
      const anchor = timesheetAnchor || currentTimesheetAnchor();
      const year = anchor.getFullYear();
      const month = anchor.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const today = isoDateInStatsTimezone();
      const entries = timers.dailyWorkEntries(state.workTimer);
      const monthInput = $("#timesheetMonth");
      monthInput.value = `${year}-${String(month + 1).padStart(2, "0")}`;
      monthInput.max = today.slice(0, 7);
      $("#timesheetNextMonth").disabled = monthInput.value >= monthInput.max;
      $("#statsTimesheet").innerHTML = Array.from({ length: daysInMonth }, (_item, index) => {
        const day = index + 1;
        const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const hours = (Number(entries[date]) || 0) / 3600000;
        const future = compareIsoDate(date, today) > 0;
        const adjusted = Boolean(scheduleForDate(date));
        return `<button type="button" class="timesheet-day${hours ? " has-time" : ""}${adjusted ? " adjusted" : ""}" data-timesheet-date="${date}" ${future ? "disabled" : ""}><span>${day}</span><small>${new Date(year, month, day).toLocaleDateString(undefined, { weekday: "short" }).slice(0, 2)}</small><strong>${hours ? `${Math.round(hours * 10) / 10}h` : "–"}</strong></button>`;
      }).join("");
    }

    function shiftTimesheetMonth(direction) {
      const anchor = timesheetAnchor || currentTimesheetAnchor();
      timesheetAnchor = new Date(anchor.getFullYear(), anchor.getMonth() + direction, 1);
      if (timesheetAnchor > currentTimesheetAnchor()) timesheetAnchor = currentTimesheetAnchor();
      renderTimesheet();
    }

    function renderBars(containerId, entries, total, options = {}) {
      const empty = options.empty || t("statsNoData");
      const rows = entries.slice(0, options.limit || 8);
      document.querySelector(containerId).innerHTML = rows.length
        ? rows
            .map(([label, value, dataValue]) => {
              const width = total ? Math.max(4, Math.round((value / total) * 100)) : 0;
              const facetValue = dataValue || label;
              const dataAttribute = options.kind ? `data-stats-facet-kind="${escapeHtml(options.kind)}" data-stats-facet-value="${escapeHtml(facetValue)}"` : "";
              const selected = state.selectedStatsFacet?.kind === options.kind && state.selectedStatsFacet?.value === facetValue;
              return `
                <button type="button" class="stats-bar-row${selected ? " selected" : ""}" ${dataAttribute} title="${escapeHtml(`${label}: ${value}`)}">
                  <div>
                    <span>${escapeHtml(label)}</span>
                    <strong>${escapeHtml(String(value))}</strong>
                  </div>
                  <span class="stats-bar-track"><span style="width:${width}%"></span></span>
                </button>
              `;
            })
            .join("")
        : `<p class="muted">${escapeHtml(empty)}</p>`;
    }

    function renderOutcomeDistribution(analysis) {
      renderBars(
        "#statsOutcomeDistribution",
        [
          [t("statsPositiveResults"), analysis.success, "success"],
          [t("statsNegativeResults"), analysis.rejections, "rejection"],
          [t("statsCallbacks"), analysis.callback, "callback"],
          [t("statsNoAnswer"), analysis.noAnswer, "noAnswer"]
        ].filter(([, value]) => value > 0),
        analysis.total,
        { kind: "outcome" }
      );
    }

    function renderTypeDistribution(analysis) {
      renderBars("#statsTypeDistribution", Object.entries(analysis.byType).sort((a, b) => b[1] - a[1]), analysis.total, { kind: "type", limit: 6 });
    }

    function renderHourlyPerformance(analysis) {
      const max = Math.max(1, ...Object.values(analysis.byHour));
      const currentHour = V.timeInTimezone(new Date(), statsTimezone()).slice(0, 2);
      $("#statsHourlyPerformance").innerHTML = Array.from({ length: 24 }, (_, hour) => {
        const key = String(hour).padStart(2, "0");
        const count = analysis.byHour[key] || 0;
        const height = count ? Math.max(8, Math.round((count / max) * 100)) : 2;
        const selected = state.selectedStatsHour === key;
        const current = key === currentHour && statsRangeBounds().to === isoDateInStatsTimezone();
        return `
          <button type="button" class="stats-hour-cell${selected ? " selected" : ""}${count ? " has-data" : ""}${current ? " current-hour" : ""}" data-stats-hour="${key}" title="${key}:00 · ${count} llamadas">
            <span class="stats-hour-bar" style="height:${height}%"></span>
            <span>${key}</span>
          </button>
        `;
      }).join("");
    }

    function insight(label, value) {
      return `
        <article class="stats-insight-card">
          <span class="muted">${escapeHtml(label)}</span>
          <strong>${escapeHtml(value || t("statsNoData"))}</strong>
        </article>
      `;
    }

    function renderInsights(analysis) {
      const hourLabel = (hour) => (hour ? `${hour}:00` : "");
      $("#statsInsights").innerHTML = [
        insight(t("statsBestDay"), analysis.insights.bestDay ? displayIsoDate(analysis.insights.bestDay) : ""),
        insight(t("statsWorstDay"), analysis.insights.worstDay ? displayIsoDate(analysis.insights.worstDay) : ""),
        insight(t("statsStrongestHour"), hourLabel(analysis.insights.strongestHour)),
        insight(t("statsWeakestHour"), hourLabel(analysis.insights.weakestHour)),
        insight(t("statsBestSuccessDay"), analysis.insights.bestSuccessDay ? displayIsoDate(analysis.insights.bestSuccessDay) : ""),
        insight(t("statsMostRejectionsDay"), analysis.insights.mostRejectionsDay ? displayIsoDate(analysis.insights.mostRejectionsDay) : ""),
        insight(t("statsFewestRejectionsDay"), analysis.insights.fewestRejectionsDay ? displayIsoDate(analysis.insights.fewestRejectionsDay) : "")
      ].join("");
    }

    function renderDetail(analysis) {
      const calls = callsForStatsRange();
      const activeDay = state.selectedStatsDay || state.hoveredStatsDay;
      const activeHour = state.selectedStatsHour || state.hoveredStatsHour;
      const activeFacet = state.selectedStatsFacet || state.hoveredStatsFacet;
      const dayCalls = activeDay ? calls.filter((call) => callIsoDateInStatsTimezone(call) === activeDay) : [];
      const hourCalls = activeHour ? calls.filter((call) => callHourKey(call) === activeHour) : [];
      const facetCalls = activeFacet
        ? calls.filter((call) => {
            if (activeFacet.kind === "type") return String(call.callType || "").trim() === activeFacet.value;
            if (activeFacet.kind === "outcome") {
              if (activeFacet.value === "noAnswer") {
                return isNoAnswerCall(call);
              }
              return outcomeCategory(call) === activeFacet.value;
            }
            return false;
          })
        : [];
      const detailCalls = activeDay ? dayCalls : activeHour ? hourCalls : activeFacet ? facetCalls : [];
      const summary = summarizeCalls(detailCalls);
      const blocks = Object.entries(analysis.byHour)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([hour, count]) => `${hour}:00 ${count}`)
        .join(" · ");
      $("#statsDetail").innerHTML = `
        <div class="stats-detail-active">
          <span class="muted">${escapeHtml(activeDay ? t("statsSelectedDay") : activeHour ? t("statsSelectedHour") : activeFacet ? t("statsSelectedMetric") : t("statsDetail"))}</span>
          <strong>${escapeHtml(activeDay ? displayIsoDate(activeDay) : activeHour ? `${activeHour}:00` : activeFacet ? facetLabel(activeFacet) : t("statsNoData"))}</strong>
        </div>
        <div class="stats-detail-grid">
          <article>
            <span class="muted">${escapeHtml(t("statsTotalCalls"))}</span>
            <strong>${escapeHtml(detailCalls.length ? String(summary.total) : t("statsNoData"))}</strong>
          </article>
          <article>
            <span class="muted">${escapeHtml(t("statsPositiveResults"))}</span>
            <strong>${escapeHtml(detailCalls.length ? String(summary.success) : t("statsNoData"))}</strong>
          </article>
          <article>
            <span class="muted">${escapeHtml(t("statsNegativeResults"))}</span>
            <strong>${escapeHtml(detailCalls.length ? String(summary.rejections) : t("statsNoData"))}</strong>
          </article>
          <article>
            <span class="muted">${escapeHtml(t("statsSuccessRate"))}</span>
            <strong>${escapeHtml(detailCalls.length ? `${summary.successRate}%` : t("statsNoData"))}</strong>
          </article>
        </div>
        <div class="stats-block-summary">
          <span class="muted">${escapeHtml(t("statsProductivityBlocks"))}</span>
          <p>${escapeHtml(blocks || t("statsAvailableWithHistory"))}</p>
        </div>
      `;
    }

    function render() {
      if (!state.settings) return;
      syncRangeInputs();
      const analysis = currentAnalysis();
      renderSummary(analysis);
      renderActivityMap(analysis);
      renderOutcomeDistribution(analysis);
      renderHourlyPerformance(analysis);
      renderTypeDistribution(analysis);
      renderInsights(analysis);
      renderDetail(analysis);
      renderTimesheet();
    }

    function setPeriod(period) {
      state.statsRange.preset = period;
      state.selectedStatsDay = null;
      state.selectedStatsHour = null;
      state.selectedStatsFacet = null;
      render();
    }

    function exportContent(extension) {
      const analysis = currentAnalysis();
      const range = statsRangeBounds();
      const lines = [
        `# CallFlow - ${t("stats")}`,
        "",
        `Periodo: ${displayIsoDate(range.from)} - ${displayIsoDate(range.to)}`,
        "",
        `- ${t("statsTotalCalls")}: ${analysis.total}`,
        `- ${t("statsPositiveResults")}: ${analysis.success} (${analysis.rates.success}%)`,
        `- ${t("statsNegativeResults")}: ${analysis.rejections} (${analysis.rates.rejection}%)`,
        `- ${t("statsCallbacks")}: ${analysis.callback}`,
        `- ${t("statsNoAnswer")}: ${analysis.noAnswer}`,
        `- ${t("statsAvgCallsHour")}: ${callsPerWorkedHour(analysis.total, workTimeSummary().workMs)}`,
        "",
        `## ${t("statsInsights")}`,
        `- ${t("statsBestDay")}: ${analysis.insights.bestDay ? displayIsoDate(analysis.insights.bestDay) : t("statsNoData")}`,
        `- ${t("statsStrongestHour")}: ${analysis.insights.strongestHour ? `${analysis.insights.strongestHour}:00` : t("statsNoData")}`,
        `- ${t("statsWeakestHour")}: ${analysis.insights.weakestHour ? `${analysis.insights.weakestHour}:00` : t("statsNoData")}`,
        "",
        `## ${t("statsCallTypes")}`,
        ...Object.entries(analysis.byType).map(([label, value]) => `- ${label}: ${value}`)
      ];
      return extension === "txt" ? lines.map((line) => line.replace(/^#+\s*/g, "")).join("\n") : lines.join("\n");
    }

    async function exportStats(extension) {
      const range = statsRangeBounds();
      await runAction(
        () =>
          window.callflow.exportNote({
            fileName: `callflow-stats-${range.from}-${range.to}`,
            content: exportContent(extension),
            extension
          }),
        { userMessage: i18n.t("saveFailed", language()), logMessage: "Failed to export stats" }
      );
      setStatusMessage(i18n.t("saved", language()), "success");
    }

    function handleDocumentClick(event) {
      const period = event.target.dataset.statsPeriod;
      const day = event.target.dataset.statsDay;
      const hour = event.target.dataset.statsHour;
      const facetKind = event.target.dataset.statsFacetKind;
      const facetValue = event.target.dataset.statsFacetValue;
      if (period) setPeriod(period);
      if (day) {
        state.selectedStatsDay = state.selectedStatsDay === day ? null : day;
        state.selectedStatsHour = null;
        state.selectedStatsFacet = null;
        render();
      }
      if (hour) {
        state.selectedStatsHour = state.selectedStatsHour === hour ? null : hour;
        state.selectedStatsDay = null;
        state.selectedStatsFacet = null;
        render();
      }
      if (facetKind && facetValue) {
        const current = state.selectedStatsFacet;
        state.selectedStatsFacet = current?.kind === facetKind && current?.value === facetValue ? null : { kind: facetKind, value: facetValue };
        state.selectedStatsDay = null;
        state.selectedStatsHour = null;
        render();
      }
    }

    function handlePointer(event) {
      const day = event.target.dataset.statsDay || null;
      const hour = event.target.dataset.statsHour || null;
      const facetKind = event.target.dataset.statsFacetKind || null;
      const facetValue = event.target.dataset.statsFacetValue || null;
      state.hoveredStatsDay = day;
      state.hoveredStatsHour = hour;
      state.hoveredStatsFacet = facetKind && facetValue ? { kind: facetKind, value: facetValue } : null;
      if (!state.selectedStatsDay && !state.selectedStatsHour && !state.selectedStatsFacet) renderDetail(currentAnalysis());
    }

    function bindEvents() {
      $("#statsDateFrom").addEventListener("change", (event) => {
        state.statsRange.from = event.target.value;
        state.statsRange.preset = "custom";
        render();
      });
      $("#statsDateTo").addEventListener("change", (event) => {
        state.statsRange.to = event.target.value;
        state.statsRange.preset = "custom";
        render();
      });
      $("#exportStatsMd").addEventListener("click", () => exportStats("md"));
      $("#exportStatsTxt").addEventListener("click", () => exportStats("txt"));
      $("#openTimeAdjustment").addEventListener("click", () => openTimeAdjustment());
      $("#closeTimeAdjustment").addEventListener("click", closeTimeAdjustment);
      $("#timeAdjustmentModal").addEventListener("click", (event) => {
        if (event.target.id === "timeAdjustmentModal") closeTimeAdjustment();
      });
      $("#schedulePreviousDay").addEventListener("click", () => loadScheduleDate(addDays(scheduleDate, -1)));
      $("#scheduleNextDay").addEventListener("click", () => loadScheduleDate(addDays(scheduleDate, 1)));
      $("#scheduleCalendarButton").addEventListener("click", (event) => {
        event.stopPropagation();
        $("#scheduleDate").focus();
        $("#scheduleDate").click();
      });
      $("#scheduleDate").addEventListener("change", (event) => loadScheduleDate(event.target.value));
      $("#scheduleEditToggle").addEventListener("click", () => {
        scheduleEditing = !scheduleEditing;
        if (!scheduleEditing) selectedScheduleHours = new Set(scheduleForDate(scheduleDate)?.hours || []);
        renderScheduleEditor();
      });
      $("#scheduleHourGrid").addEventListener("click", (event) => {
        const button = event.target.closest("[data-schedule-hour]");
        if (button) toggleScheduleHour(Number(button.dataset.scheduleHour));
      });
      $("#saveSchedule").addEventListener("click", saveSchedule);
      $("#timesheetPreviousMonth").addEventListener("click", () => shiftTimesheetMonth(-1));
      $("#timesheetNextMonth").addEventListener("click", () => shiftTimesheetMonth(1));
      $("#timesheetMonth").addEventListener("change", (event) => {
        const [year, month] = event.target.value.split("-").map(Number);
        if (year && month) timesheetAnchor = new Date(year, month - 1, 1);
        if (timesheetAnchor > currentTimesheetAnchor()) timesheetAnchor = currentTimesheetAnchor();
        renderTimesheet();
      });
      $("#statsTimesheet").addEventListener("click", (event) => {
        const day = event.target.closest("[data-timesheet-date]");
        if (day) openTimeAdjustment(day.dataset.timesheetDate);
      });
      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") closeTimeAdjustment();
      });
      $("#statsView").addEventListener("mouseover", handlePointer);
      $("#statsView").addEventListener("mouseleave", () => {
        state.hoveredStatsDay = null;
        state.hoveredStatsHour = null;
        state.hoveredStatsFacet = null;
        if (!state.selectedStatsDay && !state.selectedStatsHour && !state.selectedStatsFacet) renderDetail(currentAnalysis());
      });
    }

    return { bindEvents, handleDocumentClick, render };
  }

  window.CallFlowStatsView = { createStatsView };
})();
