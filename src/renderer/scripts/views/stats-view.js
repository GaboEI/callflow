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
        [t("statsTotalCalls"), analysis.total, "", "primary"],
        [t("statsPositiveResults"), analysis.success, "success-metric", "primary"],
        [t("statsSuccessRate"), `${analysis.rates.success}%`, "success-metric", "primary"],
        [t("statsNegativeResults"), analysis.rejections, "rejection-metric", "primary"],
        [t("statsCallbacks"), analysis.callback, "callback-metric", ""],
        [t("statsNoAnswer"), analysis.noAnswer, "", ""],
        [t("statsAvgCallsHour"), analysis.averages.callsPerActiveHour || t("statsNoData"), "", ""],
        [t("statsWorkTime"), time.work, "", "secondary"],
        [t("statsBreakTime"), time.breaks, "", "secondary"]
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
      const currentHour = String(new Date().getHours()).padStart(2, "0");
      $("#statsHourlyPerformance").innerHTML = Array.from({ length: 24 }, (_, hour) => {
        const key = String(hour).padStart(2, "0");
        const count = analysis.byHour[key] || 0;
        const height = count ? Math.max(8, Math.round((count / max) * 100)) : 2;
        const selected = state.selectedStatsHour === key;
        const current = key === currentHour && statsRangeBounds().to === isoDateOffset(0);
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
      const dayCalls = activeDay ? calls.filter((call) => callIsoDate(call) === activeDay) : [];
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
