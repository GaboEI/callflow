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
      isoDateOffset,
      runAction,
      setStatusMessage,
      state,
      stats,
      timers
    } = context;

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

    function startOfMonth(isoDate) {
      return `${isoDate.slice(0, 7)}-01`;
    }

    function statsRangeBounds() {
      const today = isoDateOffset(0);
      const allCalls = activeCalls();
      const sortedDates = allCalls.map(callIsoDate).filter(Boolean).sort(compareIsoDate);

      if (state.statsRange.preset === "yesterday") {
        const date = isoDateOffset(1);
        return { from: date, to: date };
      }
      if (state.statsRange.preset === "week") return { from: startOfWeek(today), to: today };
      if (state.statsRange.preset === "month") return { from: startOfMonth(today), to: today };
      if (state.statsRange.preset === "last7") return { from: isoDateOffset(6), to: today };
      if (state.statsRange.preset === "last30") return { from: isoDateOffset(29), to: today };
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
        const isoDate = callIsoDate(call);
        return compareIsoDate(isoDate, range.from) >= 0 && compareIsoDate(isoDate, range.to) <= 0;
      });
    }

    function currentAnalysis() {
      return stats.buildStatsAnalysis(callsForStatsRange(), state.reminders, state.settings, { callDate: callIsoDate });
    }

    function callHourKey(call) {
      const hour = Number(call.hour);
      if (Number.isInteger(hour) && hour >= 0 && hour <= 23) return String(hour).padStart(2, "0");
      if (call.createdAt) {
        const date = new Date(call.createdAt);
        if (!Number.isNaN(date.getTime())) return String(date.getHours()).padStart(2, "0");
      }
      return "00";
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
      $("#statsRangeLabel").textContent = `${displayIsoDate(range.from)} - ${displayIsoDate(range.to)}`;
    }

    function formattedDuration(ms) {
      return timers.formatDuration(ms || 0);
    }

    function workTimeSummary() {
      const range = statsRangeBounds();
      const today = isoDateOffset(0);
      if (range.from !== today || range.to !== today) {
        return {
          work: t("statsAvailableWithHistory"),
          breaks: t("statsAvailableWithHistory")
        };
      }
      const workMs = timers.currentWorkElapsed(state.workTimer);
      const breakMs = (state.workTimer?.breaks || []).reduce((sum, item) => sum + (Number(item.durationMs) || 0), 0) +
        timers.currentBreakElapsed(state.workTimer);
      return {
        work: formattedDuration(workMs),
        breaks: formattedDuration(breakMs)
      };
    }

    function renderSummary(analysis) {
      const time = workTimeSummary();
      const cards = [
        [t("statsTotalCalls"), analysis.total, ""],
        [t("statsPositiveResults"), analysis.success, "success-metric"],
        [t("statsNegativeResults"), analysis.rejections, "rejection-metric"],
        [t("statsCallbacks"), analysis.callback, "callback-metric"],
        [t("statsNoAnswer"), analysis.noAnswer, ""],
        [t("statsSuccessRate"), `${analysis.rates.success}%`, "success-metric"],
        [t("statsRejectionRate"), `${analysis.rates.rejection}%`, "rejection-metric"],
        [t("statsAvgCallsHour"), analysis.averages.callsPerActiveHour || t("statsNoData"), ""],
        [t("statsWorkTime"), time.work, ""],
        [t("statsBreakTime"), time.breaks, ""]
      ];
      $("#statsSummaryCards").innerHTML = cards
        .map(
          ([label, value, className]) => `
            <article class="stats-summary-card ${className}">
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
      $("#statsActivityMap").innerHTML = days.length
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

    function renderBars(containerId, entries, total, options = {}) {
      const empty = options.empty || t("statsNoData");
      const rows = entries.slice(0, options.limit || 8);
      document.querySelector(containerId).innerHTML = rows.length
        ? rows
            .map(([label, value]) => {
              const width = total ? Math.max(4, Math.round((value / total) * 100)) : 0;
              return `
                <div class="stats-bar-row" title="${escapeHtml(`${label}: ${value}`)}">
                  <div>
                    <span>${escapeHtml(label)}</span>
                    <strong>${escapeHtml(String(value))}</strong>
                  </div>
                  <span class="stats-bar-track"><span style="width:${width}%"></span></span>
                </div>
              `;
            })
            .join("")
        : `<p class="muted">${escapeHtml(empty)}</p>`;
    }

    function renderOutcomeDistribution(analysis) {
      renderBars(
        "#statsOutcomeDistribution",
        [
          [t("statsPositiveResults"), analysis.success],
          [t("statsNegativeResults"), analysis.rejections],
          [t("statsCallbacks"), analysis.callback],
          [t("statsNoAnswer"), analysis.noAnswer]
        ].filter(([, value]) => value > 0),
        analysis.total
      );
    }

    function renderTypeDistribution(analysis) {
      renderBars("#statsTypeDistribution", Object.entries(analysis.byType).sort((a, b) => b[1] - a[1]), analysis.total);
    }

    function renderHourlyPerformance(analysis) {
      const max = Math.max(1, ...Object.values(analysis.byHour));
      $("#statsHourlyPerformance").innerHTML = Array.from({ length: 24 }, (_, hour) => {
        const key = String(hour).padStart(2, "0");
        const count = analysis.byHour[key] || 0;
        const height = count ? Math.max(12, Math.round((count / max) * 100)) : 2;
        const selected = state.selectedStatsHour === key;
        return `
          <button type="button" class="stats-hour-cell${selected ? " selected" : ""}" data-stats-hour="${key}" title="${key}:00 · ${count} llamadas">
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
      const dayCalls = state.selectedStatsDay ? calls.filter((call) => callIsoDate(call) === state.selectedStatsDay) : [];
      const hourCalls = state.selectedStatsHour
        ? calls.filter((call) => callHourKey(call) === state.selectedStatsHour)
        : [];
      const blocks = Object.entries(analysis.byHour)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([hour, count]) => `${hour}:00 ${count}`)
        .join(" · ");
      $("#statsDetail").innerHTML = `
        <div class="stats-detail-grid">
          <article>
            <span class="muted">${escapeHtml(t("statsSelectedDay"))}</span>
            <strong>${escapeHtml(state.selectedStatsDay ? `${displayIsoDate(state.selectedStatsDay)} · ${dayCalls.length}` : t("statsNoData"))}</strong>
          </article>
          <article>
            <span class="muted">${escapeHtml(t("statsSelectedHour"))}</span>
            <strong>${escapeHtml(state.selectedStatsHour ? `${state.selectedStatsHour}:00 · ${hourCalls.length}` : t("statsNoData"))}</strong>
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
    }

    function setPeriod(period) {
      state.statsRange.preset = period;
      state.selectedStatsDay = null;
      state.selectedStatsHour = null;
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
        `- ${t("statsAvgCallsHour")}: ${analysis.averages.callsPerActiveHour || t("statsNoData")}`,
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
      if (period) setPeriod(period);
      if (day) {
        state.selectedStatsDay = state.selectedStatsDay === day ? null : day;
        render();
      }
      if (hour) {
        state.selectedStatsHour = state.selectedStatsHour === hour ? null : hour;
        render();
      }
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
    }

    return { bindEvents, handleDocumentClick, render };
  }

  window.CallFlowStatsView = { createStatsView };
})();
