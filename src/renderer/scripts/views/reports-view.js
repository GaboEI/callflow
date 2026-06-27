(function () {
  function reportRangeBounds(reportRange, isoDateOffset, compareIsoDate) {
    if (reportRange.preset === "yesterday") {
      const date = isoDateOffset(1);
      return { from: date, to: date };
    }

    if (reportRange.preset === "last7") {
      return { from: isoDateOffset(6), to: isoDateOffset(0) };
    }

    if (reportRange.preset === "last30") {
      return { from: isoDateOffset(29), to: isoDateOffset(0) };
    }

    if (reportRange.preset === "custom") {
      const from = reportRange.from || isoDateOffset(0);
      const to = reportRange.to || from;
      return compareIsoDate(from, to) <= 0 ? { from, to } : { from: to, to: from };
    }

    const today = isoDateOffset(0);
    return { from: today, to: today };
  }

  function reportBlockKey(isoDate, block) {
    return `${isoDate}|${block}`;
  }

  function callsForReportBlockKey(key, groupsByDate) {
    const [isoDate, block] = key.split("|");
    return (groupsByDate[isoDate] && groupsByDate[isoDate][block]) || [];
  }

  function highlightedReportText(text, query, escapeHtml, escapeRegExp, initialMatches = 0, activeIndex = 0) {
    if (!query.trim()) return { html: escapeHtml(text), matches: initialMatches };

    const pattern = new RegExp(escapeRegExp(query), "gi");
    let cursor = 0;
    let html = "";
    let match;
    let matches = initialMatches;

    while ((match = pattern.exec(text)) !== null) {
      const active = matches === activeIndex;
      html += escapeHtml(text.slice(cursor, match.index));
      html += `<mark class="report-match${active ? " active" : ""}" data-report-match="${matches}">${escapeHtml(match[0])}</mark>`;
      cursor = match.index + match[0].length;
      matches += 1;
      if (match.index === pattern.lastIndex) pattern.lastIndex += 1;
    }

    return { html: html + escapeHtml(text.slice(cursor)), matches };
  }

  function buildPlainSupervisorReport(block, calls, operatorName, buildCallLine) {
    const operator = String(operatorName || "OPERADOR").toUpperCase();
    const lines = calls.map((call) => buildCallLine(call)).join("\n");
    return [`REPORTE ${operator} DE ${block}`, "", lines].join("\n");
  }

  function reportExportBaseName(operatorName, isoDateOffset) {
    const operator = String(operatorName || "operador")
      .trim()
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-+|-+$/g, "");
    return `${operator || "operador"}-report-${isoDateOffset(0)}`;
  }

  function reportGroupsForRangeData({
    activeCalls,
    callIsoDate,
    compareIsoDate,
    isoDateOffset,
    reportRange,
    reportTrashMode,
    stateCalls,
    ensureDailySequences,
    blockFromHour
  }) {
    const range = reportRangeBounds(reportRange, isoDateOffset, compareIsoDate);
    const sourceCalls = reportTrashMode ? stateCalls.filter((call) => call.reportDeletedAt) : activeCalls();
    const calls = ensureDailySequences(sourceCalls)
      .filter((call) => {
        if (reportTrashMode) return true;
        const isoDate = callIsoDate(call);
        return compareIsoDate(isoDate, range.from) >= 0 && compareIsoDate(isoDate, range.to) <= 0;
      })
      .sort((a, b) => String(a.createdAt || "").localeCompare(String(b.createdAt || "")));

    return calls.reduce((groups, call) => {
      const isoDate = callIsoDate(call);
      const block = call.block || blockFromHour(call.hour || 0);
      groups[isoDate] = groups[isoDate] || {};
      groups[isoDate][block] = groups[isoDate][block] || [];
      groups[isoDate][block].push(call);
      return groups;
    }, {});
  }

  function createReportsView(context) {
    const {
      $$,
      $,
      activeCalls,
      callIsoDate,
      compareIsoDate,
      displayIsoDate,
      escapeHtml,
      escapeRegExp,
      i18n,
      isoDateOffset,
      renderApp,
      runAction,
      setStatusMessage,
      state,
      storage
    } = context;

    function reportTrashMode() {
      return state.reportRange.preset === "trash";
    }

    function syncRangeInputs() {
      const fromInput = $("#reportDateFrom");
      const toInput = $("#reportDateTo");
      const rangeFields = $$(".report-range-field");
      if (!fromInput || !toInput) return;

      const range = reportRangeBounds(state.reportRange, isoDateOffset, compareIsoDate);
      fromInput.value = range.from;
      toInput.value = range.to;
      rangeFields.forEach((field) => field.classList.toggle("hidden", state.reportRange.preset !== "custom"));
      $$("[data-report-period]").forEach((button) => {
        const active = button.dataset.reportPeriod === state.reportRange.preset;
        button.classList.toggle("report-period-chip--active", active);
        button.setAttribute("aria-pressed", active ? "true" : "false");
      });
    }

    function reportGroupsForRange() {
      return reportGroupsForRangeData({
        activeCalls,
        callIsoDate,
        compareIsoDate,
        isoDateOffset,
        reportRange: state.reportRange,
        reportTrashMode: reportTrashMode(),
        stateCalls: state.calls,
        ensureDailySequences: window.CallFlowReports.ensureDailySequences,
        blockFromHour: window.CallFlowReports.blockFromHour
      });
    }

    function reportBlockActions(key, isEditing) {
      const language = state.settings.language || "es";
      if (reportTrashMode()) {
        return `
          <button type="button" data-restore-report-block="${escapeHtml(key)}">Restaurar</button>
          <button type="button" class="danger ghost-danger" data-permanent-delete-report-block="${escapeHtml(key)}">Eliminar definitivo</button>
        `;
      }
      if (isEditing) {
        return `
          <button type="button" data-save-report-block="${escapeHtml(key)}" data-i18n="saveBlock">${i18n.t("saveBlock", language)}</button>
          <button type="button" data-cancel-report-edit="${escapeHtml(key)}" data-i18n="cancel">${i18n.t("cancel", language)}</button>
        `;
      }

      return `
        <button type="button" data-edit-report-block="${escapeHtml(key)}" data-i18n="editBlock">${i18n.t("editBlock", language)}</button>
        <button type="button" class="danger ghost-danger" data-delete-report-block="${escapeHtml(key)}" data-i18n="deleteBlock">${i18n.t("deleteBlock", language)}</button>
      `;
    }

    function renderSearchStatus() {
      const counter = $("#reportSearchCounter");
      const input = $("#reportSearchInput");
      const prev = $("#reportSearchPrev");
      const next = $("#reportSearchNext");
      if (!counter || !input || !prev || !next) return;

      input.value = state.reportSearch.query;
      const total = state.reportSearch.matches;
      counter.textContent = state.reportSearch.query ? `${total ? state.reportSearch.activeIndex + 1 : 0}/${total}` : "0/0";
      prev.disabled = total < 2;
      next.disabled = total < 2;
    }

    function renderSelectionControls() {
      const language = state.settings.language || "es";
      const copyButton = $("#copySelectedBlocks");
      const toggleButton = $("#toggleReportSelection");
      if (!copyButton || !toggleButton) return;

      const visibleKeys = visibleReportBlockKeys();
      const allVisibleSelected = visibleKeys.length > 0 && visibleKeys.every((key) => state.selectedBlocks.has(key));
      const selectLabel = allVisibleSelected ? i18n.t("clearReportSelection", language) : i18n.t("selectAllReportBlocks", language);
      const selectIcon = allVisibleSelected ? "☐" : "☑";
      const copyLabel = i18n.t("copySelection", language);

      copyButton.title = copyLabel;
      copyButton.setAttribute("aria-label", copyLabel);
      copyButton.disabled = state.selectedBlocks.size === 0;
      copyButton.querySelector("span").textContent = "⧉";

      toggleButton.disabled = reportTrashMode() || visibleKeys.length === 0;
      toggleButton.dataset.selectionMode = allVisibleSelected ? "clear" : "select";
      toggleButton.querySelector("span[aria-hidden='true']").textContent = selectIcon;
      toggleButton.querySelector("[data-report-selection-label]").textContent = selectLabel;
    }

    function scrollToActiveMatch() {
      const active = document.querySelector(".report-match.active");
      if (!active) return;
      active.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });
    }

    function moveSearch(step) {
      if (!state.reportSearch.matches) return;
      const total = state.reportSearch.matches;
      state.reportSearch.activeIndex = (state.reportSearch.activeIndex + step + total) % total;
      renderReportBlocks();
      scrollToActiveMatch();
    }

    function renderReportBlock(isoDate, block, calls) {
      const key = reportBlockKey(isoDate, block);
      const isEditing = state.editingReportBlockKey === key;
      const lines = calls.map((call) => window.CallFlowReports.buildCallLine(call, state.settings)).join("\n");
      const trash = reportTrashMode();
      const highlighted = highlightedReportText(lines, state.reportSearch.query, escapeHtml, escapeRegExp, state.reportSearch.matches, state.reportSearch.activeIndex);
      state.reportSearch.matches = highlighted.matches;

      return `
        <article class="report-item${trash ? " report-item-trash" : ""}">
          <header class="report-block-header">
            <label class="report-block-check">
              ${trash ? "" : `<input type="checkbox" data-report-block="${escapeHtml(key)}" ${state.selectedBlocks.has(key) ? "checked" : ""} />`}
              <strong>${escapeHtml(block)}</strong>
            </label>
            <div class="report-actions">
              <span class="tag">${calls.length} llamadas${trash ? " · basura" : ""}</span>
              ${reportBlockActions(key, isEditing)}
            </div>
          </header>
          ${
            isEditing
              ? `<textarea class="report-editor" data-report-editor="${escapeHtml(key)}" rows="7">${escapeHtml(lines)}</textarea>`
              : `<code>${highlighted.html}</code>`
          }
        </article>
      `;
    }

    function renderReportBlocks() {
      syncRangeInputs();
      if (reportTrashMode()) {
        state.selectedBlocks.clear();
        state.editingReportBlockKey = null;
      }
      state.reportSearch.matches = 0;
      const groupsByDate = reportGroupsForRange();
      const dateEntries = Object.entries(groupsByDate).sort(([a], [b]) => a.localeCompare(b));

      $("#reportBlocks").innerHTML = dateEntries.length
        ? dateEntries
          .map(([isoDate, groups]) => {
            const blockEntries = Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
            return `
              <section class="report-day">
                <h3>${escapeHtml(displayIsoDate(isoDate))}</h3>
                <div class="report-list">
                  ${blockEntries.map(([block, calls]) => renderReportBlock(isoDate, block, calls)).join("")}
                </div>
              </section>
            `;
          })
          .join("")
        : `<p class="muted">${escapeHtml(i18n.t("noReportBlocks", state.settings.language || "es"))}</p>`;

      if (state.reportSearch.activeIndex >= state.reportSearch.matches) {
        state.reportSearch.activeIndex = Math.max(0, state.reportSearch.matches - 1);
      }
      renderSearchStatus();
      renderSelectionControls();
    }

    function buildPlainSupervisorReportView(block, calls) {
      return buildPlainSupervisorReport(block, calls, state.settings.operatorName, (call) =>
        window.CallFlowReports.buildCallLine(call, state.settings)
      );
    }

    function reportExportBaseNameView() {
      return reportExportBaseName(state.settings.operatorName, isoDateOffset);
    }

    function selectedReportTexts(format = "md") {
      const groupsByDate = reportGroupsForRange();
      return [...state.selectedBlocks]
        .sort()
        .map((key) => {
          const calls = callsForReportBlockKey(key, groupsByDate);
          const [, block] = key.split("|");
          if (!calls.length) return "";
          return format === "txt"
            ? buildPlainSupervisorReportView(block, calls)
            : window.CallFlowReports.buildSupervisorReport(block, calls, state.settings);
        })
        .filter(Boolean);
    }

    async function copySelectedBlocks() {
      const reports = selectedReportTexts("md");
      if (reports.length) {
        await runAction(async () => {
          await window.callflow.copyText(reports.join("\n\n"));
          setStatusMessage(i18n.t("copied", state.settings.language || "es"), "success");
        });
      }
    }

    async function exportSelectedBlocks(extension) {
      const reports = selectedReportTexts(extension);
      if (!reports.length) return;
      await runAction(
        () =>
          window.callflow.exportNote({
            fileName: reportExportBaseNameView(),
            content: reports.join("\n\n"),
            extension
          }),
        { userMessage: i18n.t("saveFailed", state.settings.language || "es"), logMessage: "Failed to export report" }
      );
    }

    function visibleReportBlockKeys() {
      const groupsByDate = reportGroupsForRange();
      return Object.entries(groupsByDate).flatMap(([isoDate, groups]) =>
        Object.keys(groups).map((block) => reportBlockKey(isoDate, block))
      );
    }

    function selectAllVisibleReportBlocks() {
      if (reportTrashMode()) return;
      visibleReportBlockKeys().forEach((key) => state.selectedBlocks.add(key));
      renderReportBlocks();
    }

    function clearSelection() {
      state.selectedBlocks.clear();
      renderReportBlocks();
    }

    function toggleVisibleReportBlockSelection() {
      const visibleKeys = visibleReportBlockKeys();
      const allVisibleSelected = visibleKeys.length > 0 && visibleKeys.every((key) => state.selectedBlocks.has(key));
      if (allVisibleSelected) clearSelection();
      else selectAllVisibleReportBlocks();
    }

    function setReportPeriod(period) {
      state.reportRange.preset = period;
      state.selectedBlocks.clear();
      state.editingReportBlockKey = null;
      state.reportSearch.activeIndex = 0;
      renderApp();
    }

    function callsForReportBlockKey(key) {
      const [isoDate, block] = String(key || "").split("|");
      const groupsByDate = reportGroupsForRange();
      return groupsByDate[isoDate] && groupsByDate[isoDate][block] ? groupsByDate[isoDate][block] : [];
    }

    async function saveReportBlockEdit(key) {
      const editor = $$("[data-report-editor]").find((node) => node.dataset.reportEditor === key);
      if (!editor) return;
      const calls = callsForReportBlockKey(key);
      const lines = editor.value.split("\n").map((line) => line.trim());
      calls.forEach((call, index) => {
        if (index >= lines.length) return;
        call.reportLineOverride = lines[index] || "";
        if (!call.reportLineOverride) delete call.reportLineOverride;
      });
      state.editingReportBlockKey = null;
      await storage.write("calls", state.calls);
      renderApp();
    }

    async function deleteReportBlock(key) {
      const language = state.settings.language || "es";
      if (!window.confirm(i18n.t("confirmDeleteBlock", language))) return;
      const ids = new Set(callsForReportBlockKey(key).map((call) => call.id));
      const deletedAt = new Date().toISOString();
      state.calls = state.calls.map((call) => (ids.has(call.id) ? { ...call, reportDeletedAt: deletedAt } : call));
      if (state.lastCall && ids.has(state.lastCall.id)) state.lastCall = null;
      state.selectedBlocks.delete(key);
      if (state.editingReportBlockKey === key) state.editingReportBlockKey = null;
      await storage.write("calls", state.calls);
      renderApp();
    }

    async function restoreReportBlock(key) {
      const ids = new Set(callsForReportBlockKey(key).map((call) => call.id));
      state.calls = state.calls.map((call) => {
        if (!ids.has(call.id)) return call;
        const restored = { ...call };
        delete restored.reportDeletedAt;
        return restored;
      });
      await storage.write("calls", state.calls);
      renderApp();
    }

    async function permanentDeleteReportBlock(key) {
      if (!window.confirm("Eliminar definitivamente este bloque?")) return;
      const ids = new Set(callsForReportBlockKey(key).map((call) => call.id));
      state.calls = state.calls.filter((call) => !ids.has(call.id));
      if (state.lastCall && ids.has(state.lastCall.id)) state.lastCall = null;
      await storage.write("calls", state.calls);
      renderApp();
    }

    function handleDocumentChange(event) {
      if (!event.target.matches("[data-report-block]")) return;
      if (event.target.checked) state.selectedBlocks.add(event.target.dataset.reportBlock);
      else state.selectedBlocks.delete(event.target.dataset.reportBlock);
      renderSelectionControls();
    }

    function handleDocumentClick(event) {
      const editReportBlockKey = event.target.dataset.editReportBlock;
      const saveReportBlockKey = event.target.dataset.saveReportBlock;
      const cancelReportEditKey = event.target.dataset.cancelReportEdit;
      const deleteReportBlockKey = event.target.dataset.deleteReportBlock;
      const restoreReportBlockKey = event.target.dataset.restoreReportBlock;
      const permanentDeleteReportBlockKey = event.target.dataset.permanentDeleteReportBlock;
      const reportPeriod = event.target.dataset.reportPeriod;
      if (editReportBlockKey) {
        state.editingReportBlockKey = editReportBlockKey;
        renderReportBlocks();
      }
      if (saveReportBlockKey) saveReportBlockEdit(saveReportBlockKey);
      if (cancelReportEditKey) {
        state.editingReportBlockKey = null;
        renderReportBlocks();
      }
      if (deleteReportBlockKey) deleteReportBlock(deleteReportBlockKey);
      if (restoreReportBlockKey) restoreReportBlock(restoreReportBlockKey);
      if (permanentDeleteReportBlockKey) permanentDeleteReportBlock(permanentDeleteReportBlockKey);
      if (reportPeriod) setReportPeriod(reportPeriod);
    }

    function bindEvents() {
      $("#copySelectedBlocks").addEventListener("click", copySelectedBlocks);
      $("#exportSelectedMd").addEventListener("click", () => exportSelectedBlocks("md"));
      $("#exportSelectedTxt").addEventListener("click", () => exportSelectedBlocks("txt"));
      $("#toggleReportSelection").addEventListener("click", toggleVisibleReportBlockSelection);
      $("#reportDateFrom").addEventListener("change", (event) => {
        state.reportRange.preset = "custom";
        state.reportRange.from = event.target.value;
        state.selectedBlocks.clear();
        state.editingReportBlockKey = null;
        state.reportSearch.activeIndex = 0;
        renderApp();
      });
      $("#reportDateTo").addEventListener("change", (event) => {
        state.reportRange.preset = "custom";
        state.reportRange.to = event.target.value;
        state.selectedBlocks.clear();
        state.editingReportBlockKey = null;
        state.reportSearch.activeIndex = 0;
        renderApp();
      });
      $("#reportSearchInput").addEventListener("input", (event) => {
        state.reportSearch.query = event.target.value;
        state.reportSearch.activeIndex = 0;
        renderReportBlocks();
        scrollToActiveMatch();
      });
      $("#reportSearchInput").addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          moveSearch(event.shiftKey ? -1 : 1);
        }
        if (event.key === "Escape") {
          state.reportSearch.query = "";
          state.reportSearch.activeIndex = 0;
          renderReportBlocks();
        }
      });
      $("#reportSearchPrev").addEventListener("click", () => moveSearch(-1));
      $("#reportSearchNext").addEventListener("click", () => moveSearch(1));
      $("#reportSearchClear").addEventListener("click", () => {
        state.reportSearch.query = "";
        state.reportSearch.activeIndex = 0;
        renderReportBlocks();
        $("#reportSearchInput").focus();
      });
    }

    function render() {
      renderReportBlocks();
    }

    return { bindEvents, handleDocumentChange, handleDocumentClick, render, renderReportBlocks };
  }

  const api = {
    buildPlainSupervisorReport,
    callsForReportBlockKey,
    createReportsView,
    highlightedReportText,
    reportBlockKey,
    reportExportBaseName,
    reportGroupsForRange: reportGroupsForRangeData,
    reportRangeBounds
  };

  if (typeof window !== "undefined") window.CallFlowReportsView = api;
  if (typeof module !== "undefined") module.exports = api;
})();
