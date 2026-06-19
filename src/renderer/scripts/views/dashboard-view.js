(function () {
  function createDashboardView(context) {
    const {
      $,
      activeCalls,
      activeTimezones,
      applySettingsToForms,
      compactStatusLabel,
      currentDateInputValue,
      currentTimeInputValue,
      escapeHtml,
      i18n,
      normalizeSettings,
      renderApp,
      renderReminderTimezoneSelectors,
      renderReportBlocks,
      reports,
      runAction,
      setStatusMessage,
      setView,
      state,
      stats,
      storage,
      uniqueItems,
      validators: V
    } = context;

    function renderCallOptions() {
      const callType = $("#callForm select[name='callType']");
      const currentCallType = callType.value;
      callType.innerHTML = state.settings.callTypes
        .map((type) => `<option value="${escapeHtml(type)}">${escapeHtml(type)}</option>`)
        .join("");
      callType.disabled = !state.settings.callTypes.length;
      if (state.settings.callTypes.includes(currentCallType)) callType.value = currentCallType;
      else callType.value = "";

      renderStatusOptions(false);
      renderCustomCommentOptions(false);
    }

    function renderOptionButtons(options, dataName, optionsConfig = {}) {
      return options
        .map(
          (value) => `
            <button type="button" class="status-option${optionsConfig.fullText ? " full-text" : ""}${optionsConfig.recommended === value ? " recommended" : ""}" data-${dataName}="${escapeHtml(value)}" title="${escapeHtml(value)}">
              <span>${escapeHtml(optionsConfig.fullText ? value : compactStatusLabel(value))}</span>
            </button>
          `
        )
        .join("");
    }

    function statusUsageCounts(statuses) {
      const activeStatuses = new Set(statuses);
      return state.calls.reduce((result, call) => {
        const rawDescription = String(call.rawDescription || "").trim();
        if (activeStatuses.has(rawDescription)) {
          result[rawDescription] = (result[rawDescription] || 0) + 1;
          return result;
        }
        statuses.forEach((status) => {
          if (!status) return;
          if (String(call.description || "").toLowerCase().includes(String(status).toLowerCase())) {
            result[status] = (result[status] || 0) + 1;
          }
        });
        return result;
      }, {});
    }

    function renderStatusOptions(open = true) {
      const input = $("#descriptionInput");
      const list = $("#statusOptions");
      if (!input || !list) return;
      const query = input.value.trim().toLowerCase();
      const activeStatuses = state.settings.frequentStatuses || [];
      const counts = statusUsageCounts(activeStatuses);
      const options = activeStatuses.filter((status) =>
        String(status).toLowerCase().includes(query)
      ).sort((a, b) => (counts[b] || 0) - (counts[a] || 0) || activeStatuses.indexOf(a) - activeStatuses.indexOf(b));
      const topStatus = options.find((status) => counts[status] > 0) || "";
      list.classList.toggle("open", open && options.length > 0);
      list.innerHTML = renderOptionButtons(options, "status-option", { recommended: topStatus });
    }

    function renderCustomCommentOptions(open = true) {
      const input = $("#customCommentInput");
      const list = $("#customCommentOptions");
      if (!input || !list) return;
      const query = input.value.trim().toLowerCase();
      const options = (state.settings.customComments || []).filter((comment) =>
        String(comment).toLowerCase().includes(query)
      );
      list.classList.toggle("open", open && options.length > 0);
      list.innerHTML = renderOptionButtons(options, "custom-comment-option", { fullText: true });
    }

    function selectStatusOption(value) {
      const input = $("#descriptionInput");
      if (!input) return;
      input.value = value;
      renderStatusOptions(false);
      input.focus();
    }

    function selectCustomCommentOption(value) {
      const input = $("#customCommentInput");
      if (!input) return;
      input.value = value;
      renderCustomCommentOptions(false);
      input.focus();
    }

    function activeOutcomeLabels(category) {
      const presetsForCategory = state.settings.outcomePresets[category] || { items: [] };
      return uniqueItems(presetsForCategory.items || []);
    }

    function activeOutcomeLabelSet(category) {
      return new Set(activeOutcomeLabels(category).map((label) => String(label).toLowerCase()));
    }

    function mostUsedOutcomeLabel(category) {
      const activeLabels = activeOutcomeLabelSet(category);
      const counts = state.calls.reduce((result, call) => {
        if (!call.primaryOutcome || call.primaryOutcome.category !== category || !call.primaryOutcome.label) return result;
        if (!activeLabels.has(String(call.primaryOutcome.label).toLowerCase())) return result;
        result[call.primaryOutcome.label] = (result[call.primaryOutcome.label] || 0) + 1;
        return result;
      }, {});
      return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || "";
    }

    function defaultOutcomeLabel(category) {
      const presetsForCategory = state.settings.outcomePresets[category] || { items: [] };
      const activeLabels = activeOutcomeLabels(category);
      const activeDefault = activeLabels.includes(presetsForCategory.default) ? presetsForCategory.default : "";
      return mostUsedOutcomeLabel(category) || activeDefault || activeLabels[0] || "";
    }

    function selectedOutcomeLabel(category) {
      return state.selectedPrimaryOutcome && state.selectedPrimaryOutcome.category === category
        ? state.selectedPrimaryOutcome.label
        : defaultOutcomeLabel(category);
    }

    function callbackOutcomePayload() {
      const form = $("#callForm");
      const selected = state.selectedPrimaryOutcome;
      if (!selected || selected.category !== "callback") return null;
      const timezone = form.callbackTimezone?.value || state.settings.lastReminderTimezone || activeTimezones()[0] || state.settings.timezone;
      return {
        category: "callback",
        label: selected.label,
        callbackDate: form.callbackDate.value,
        callbackTime: form.callbackTime.value,
        timezone: V.resolveTimezone(timezone),
        dueAt: V.zonedDateTimeToUtc(form.callbackDate.value, form.callbackTime.value, timezone)?.toISOString() || null
      };
    }

    function currentPrimaryOutcomePayload() {
      if (!state.selectedPrimaryOutcome) return null;
      if (state.selectedPrimaryOutcome.category === "callback") return callbackOutcomePayload();
      return {
        category: state.selectedPrimaryOutcome.category,
        label: state.selectedPrimaryOutcome.label,
        callbackDate: null,
        callbackTime: null
      };
    }

    function defaultCallbackDateTime() {
      const form = $("#callForm");
      renderReminderTimezoneSelectors();
      const timezone = form.callbackTimezone?.value || state.settings.lastReminderTimezone || activeTimezones()[0] || state.settings.timezone;
      if (!form.callbackDate.value) form.callbackDate.value = currentDateInputValue(timezone);
      if (!form.callbackTime.value) form.callbackTime.value = currentTimeInputValue(timezone);
    }

    function selectPrimaryOutcome(category, label) {
      const previousCategory = state.selectedPrimaryOutcome?.category || null;
      state.selectedPrimaryOutcome = { category, label };
      if (category === "callback") {
        defaultCallbackDateTime();
      }
      if (previousCategory === "callback" && category !== "callback") {
        const form = $("#callForm");
        form.callbackDate.value = "";
        form.callbackTime.value = "";
      }
      state.openOutcomeMenu = null;
      renderOutcomeControls();
    }

    function clearPrimaryOutcome() {
      state.selectedPrimaryOutcome = null;
      state.openOutcomeMenu = null;
      const form = $("#callForm");
      form.callbackDate.value = "";
      form.callbackTime.value = "";
      renderOutcomeControls();
    }

    async function updateOutcomePresets(outcomePresets) {
      state.settings = normalizeSettings({
        ...state.settings,
        outcomePresets
      });
      await runAction(async () => {
        await storage.write("settings", state.settings);
        renderOutcomeControls();
      });
    }

    async function addOutcomePreset(category) {
      const input = document.querySelector(`[data-new-outcome="${category}"]`);
      const value = String(input?.value || "").trim();
      if (!value) return;
      const presetsCopy = structuredClone(state.settings.outcomePresets);
      presetsCopy[category].items = uniqueItems([...presetsCopy[category].items, value]);
      presetsCopy[category].default = presetsCopy[category].default || value;
      await updateOutcomePresets(presetsCopy);
      selectPrimaryOutcome(category, value);
    }

    async function removeOutcomePreset(category, label) {
      const language = state.settings.language || "es";
      if (!window.confirm(i18n.t("confirmRemoveOutcome", language))) return;
      const presetsCopy = structuredClone(state.settings.outcomePresets);
      presetsCopy[category].items = presetsCopy[category].items.filter((item) => item !== label);
      if (presetsCopy[category].default === label) {
        presetsCopy[category].default = presetsCopy[category].items[0] || "";
      }
      if (state.selectedPrimaryOutcome?.category === category && state.selectedPrimaryOutcome.label === label) {
        state.selectedPrimaryOutcome = null;
      }
      await updateOutcomePresets(presetsCopy);
    }

    function renderOutcomeMenu(category) {
      const language = state.settings.language || "es";
      const presetsForCategory = state.settings.outcomePresets[category] || { items: [] };
      return `
        <div class="outcome-menu-list">
          ${presetsForCategory.items
            .map(
              (item) => `
                <div class="outcome-menu-item">
                  <button type="button" data-select-outcome="${category}" data-value="${escapeHtml(item)}">${escapeHtml(item)}</button>
                  <button type="button" class="outcome-remove" data-remove-outcome="${category}" data-value="${escapeHtml(item)}" title="${i18n.t("removeOutcome", language)}">×</button>
                </div>
              `
            )
            .join("")}
        </div>
        <div class="outcome-menu-actions">
          <input data-new-outcome="${category}" placeholder="${escapeHtml(i18n.t("newOutcome", language))}" />
          <button type="button" data-add-outcome="${category}">${escapeHtml(i18n.t("addOutcome", language))}</button>
        </div>
        <button type="button" class="outcome-clear" data-clear-outcome>${escapeHtml(i18n.t("clearOutcome", language))}</button>
      `;
    }

    function renderOutcomeControls() {
      if (!state.settings) return;
      ["success", "rejection", "callback"].forEach((category) => {
        const button = document.querySelector(`[data-outcome-toggle="${category}"]`);
        const label = document.querySelector(`[data-outcome-label="${category}"]`);
        const menu = document.querySelector(`[data-outcome-menu="${category}"]`);
        const selected = state.selectedPrimaryOutcome?.category === category;
        if (!button || !label || !menu) return;
        label.textContent = selectedOutcomeLabel(category);
        button.classList.toggle("selected", selected);
        button.setAttribute("role", "radio");
        button.setAttribute("aria-checked", selected ? "true" : "false");
        menu.classList.toggle("open", state.openOutcomeMenu === category);
        menu.innerHTML = state.openOutcomeMenu === category ? renderOutcomeMenu(category) : "";
      });

      const callbackSelected = state.selectedPrimaryOutcome?.category === "callback";
      $("#callbackFields").classList.toggle("hidden", !callbackSelected);
      renderReminderTimezoneSelectors();
    }

    function renderDashboardInlineManagers() {
      const language = state.settings.language || "es";
      $("#dashboardCallTypeList").innerHTML = state.settings.callTypes.length
        ? state.settings.callTypes
          .map(
            (type) => `
              <span class="chip">
                ${escapeHtml(type)}
                <button type="button" data-remove-dashboard-call-type="${escapeHtml(type)}" aria-label="${i18n.t("removeCallType", language)}">×</button>
              </span>
            `
          )
          .join("")
        : '<span class="muted">-</span>';
    }

    async function updateFrequentStatuses(statuses) {
      state.settings = normalizeSettings({
        ...state.settings,
        frequentStatuses: uniqueItems(statuses)
      });
      state.formLists.settingsFrequentStatuses = [...state.settings.frequentStatuses];
      state.formLists.onboardingFrequentStatuses = [...state.settings.frequentStatuses];
      await runAction(async () => {
        await storage.write("settings", state.settings);
        applySettingsToForms();
        renderApp();
      });
    }

    async function addCurrentDashboardStatus() {
      const input = $("#callForm input[name='description']");
      const value = input.value.trim();
      if (!value) return;
      await updateFrequentStatuses([...state.settings.frequentStatuses, value]);
      input.focus();
    }

    async function removeCurrentDashboardStatus() {
      const input = $("#callForm input[name='description']");
      const value = input.value.trim();
      if (!value || !state.settings.frequentStatuses.includes(value)) return;
      const language = state.settings.language || "es";
      if (!window.confirm(i18n.t("confirmRemoveStatus", language))) return;
      await updateFrequentStatuses(state.settings.frequentStatuses.filter((status) => status !== value));
      input.focus();
    }

    async function updateCustomComments(customComments) {
      state.settings = normalizeSettings({
        ...state.settings,
        customComments: uniqueItems(customComments)
      });
      await runAction(async () => {
        await storage.write("settings", state.settings);
        renderCustomCommentOptions(false);
        renderApp();
      });
    }

    async function addCurrentCustomComment() {
      const input = $("#customCommentInput");
      const value = input.value.trim();
      if (!value) return;
      await updateCustomComments([...(state.settings.customComments || []), value]);
      input.focus();
    }

    async function removeCurrentCustomComment() {
      const input = $("#customCommentInput");
      const value = input.value.trim();
      if (!value || !(state.settings.customComments || []).includes(value)) return;
      const language = state.settings.language || "es";
      if (!window.confirm(i18n.t("confirmRemoveCustomComment", language))) return;
      await updateCustomComments((state.settings.customComments || []).filter((comment) => comment !== value));
      input.focus();
    }

    async function updateCallTypes(callTypes) {
      state.settings = normalizeSettings({
        ...state.settings,
        callTypes: uniqueItems(callTypes)
      });
      state.formLists.settingsCallTypes = [...state.settings.callTypes];
      state.formLists.onboardingCallTypes = [...state.settings.callTypes];
      await runAction(async () => {
        await storage.write("settings", state.settings);
        applySettingsToForms();
        renderApp();
      });
    }

    async function addDashboardCallType() {
      const input = $("#newDashboardCallType");
      const value = input.value.trim();
      if (!value) return;
      await updateCallTypes([...state.settings.callTypes, value]);
      $("#callForm select[name='callType']").value = value;
      input.value = "";
      input.focus();
    }

    async function removeDashboardCallType(value) {
      const language = state.settings.language || "es";
      if (!window.confirm(i18n.t("confirmRemoveCallType", language))) return;
      await updateCallTypes(state.settings.callTypes.filter((type) => type !== value));
    }

    function renderCapturedCallTime() {
      const label = $("#capturedCallTimeLabel");
      if (!label || !state.settings) return;

      if (!state.pendingCallCapturedAt) {
        label.textContent = "";
        return;
      }

      const stamp = reports.formatCallTimestamp(new Date(state.pendingCallCapturedAt), state.settings);
      label.textContent = `${i18n.t("capturedCallTime", state.settings.language || "es")}: ${stamp.date} ${stamp.time}`;
    }

    function callProductivityCategory(call) {
      const category = call.primaryOutcome?.category;
      if (["success", "callback", "rejection"].includes(category)) return category;

      const description = String(call.description || "").toLowerCase();
      const matchesActiveOutcome = (outcomeCategory) =>
        activeOutcomeLabels(outcomeCategory).some((label) => {
          const normalized = String(label || "").toLowerCase();
          return normalized && description.includes(normalized);
        });

      if (matchesActiveOutcome("success")) return "success";
      if (matchesActiveOutcome("rejection")) return "rejection";
      if (matchesActiveOutcome("callback")) return "callback";
      return "neutral";
    }

    function blockProductivity(calls) {
      const metrics = calls.reduce(
        (result, call) => {
          result.total += 1;
          result[callProductivityCategory(call)] += 1;
          return result;
        },
        { total: 0, success: 0, callback: 0, rejection: 0, neutral: 0 }
      );
      const outcomeScore =
        metrics.success * 5 +
        metrics.callback * 2 +
        metrics.neutral * 0.5 -
        metrics.rejection * 3;
      const qualityRatio = metrics.total
        ? (metrics.success * 3 + metrics.callback - metrics.rejection * 2) / metrics.total
        : 0;
      const volumeSignal = Math.min(metrics.total * 0.2, 2);
      return {
        ...metrics,
        score: Number((outcomeScore + qualityRatio + volumeSignal).toFixed(3))
      };
    }

    function uniqueScore(score, entries) {
      return entries.filter((entry) => entry.productivity.score === score).length === 1;
    }

    function renderBlocks() {
      const todayCalls = reports.ensureDailySequences(reports.callsForToday(activeCalls(), state.settings));
      const groups = reports.groupByBlock(todayCalls);
      const entries = Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
      const currentBlock = reports.blockFromHour(reports.formatCallTimestamp(new Date(), state.settings).hour);
      const scoredClosedEntries = entries
        .filter(([block]) => block !== currentBlock)
        .map(([block, calls]) => ({ block, productivity: blockProductivity(calls) }));
      const scores = scoredClosedEntries.map((entry) => entry.productivity.score);
      const maxScore = scores.length ? Math.max(...scores) : 0;
      const minScore = scores.length ? Math.min(...scores) : 0;
      const shouldMarkBest = scoredClosedEntries.length > 1 && uniqueScore(maxScore, scoredClosedEntries);
      const shouldMarkWorst = scoredClosedEntries.length > 2 && minScore < maxScore && uniqueScore(minScore, scoredClosedEntries);

      $("#hourBlocks").innerHTML = entries.length
        ? entries
          .map(([block, calls]) => {
            const current = block === currentBlock;
            const productivity = current ? null : blockProductivity(calls);
            const best = !current && shouldMarkBest && productivity.score === maxScore;
            const worst = !current && shouldMarkWorst && productivity.score === minScore;
            const title = current
              ? "Bloque actual en curso"
              : `Score ${productivity.score}: ${productivity.success} positivas, ${productivity.callback} callbacks, ${productivity.rejection} rechazos, ${productivity.neutral} neutras`;
            return `
              <article class="block-item compact-hour-block${current ? " current-block" : ""}${best ? " best-block" : ""}${worst ? " worst-block" : ""}" title="${escapeHtml(title)}">
                <strong>${block}</strong>
                <span class="muted">${calls.length} llamadas${current ? " · en curso" : ""}</span>
              </article>
            `;
          })
          .join("")
        : '<p class="muted">Todavía no hay llamadas registradas hoy.</p>';

      renderReportBlocks();
    }

    function statsCards(dailyStats) {
      const base = [
        ["Total de llamadas", dailyStats.total, ""],
        [state.settings.successLabel, dailyStats.success, "success-metric"],
        [state.settings.rejectionLabel, dailyStats.rejections, "rejection-metric"],
        ["Sin respuesta", dailyStats.noAnswer, ""],
        ["Recordatorios pendientes", dailyStats.pendingReminders, ""]
      ];

      const byType = Object.entries(dailyStats.byType).map(([key, value]) => [`Tipo ${key}`, value, ""]);
      const byStatus = Object.entries(dailyStats.statusCounts).map(([key, value]) => [key, value, ""]);
      return [...base, ...byType, ...byStatus]
        .map(([label, value, className]) => {
          const displayLabel = compactStatusLabel(label);
          return `
            <article class="card ${className}">
              <span class="muted stat-label" title="${escapeHtml(label)}">${escapeHtml(displayLabel)}</span>
              <strong>${value}</strong>
            </article>
          `;
        })
        .join("");
    }

    function renderStats() {
      const todayCalls = reports.callsForToday(activeCalls(), state.settings);
      const dailyStats = stats.buildStats(todayCalls, state.reminders, state.settings);
      $("#dashboardStats").innerHTML = statsCards(dailyStats);
      $("#statsCards").innerHTML = statsCards(dailyStats);
    }

    function renderLastCall() {
      if (!state.lastCall) {
        const latest = [...activeCalls()].sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")))[0];
        state.lastCall = latest || null;
      }
      $("#lastFullLine").textContent = state.lastCall
        ? reports.buildCallLine(state.lastCall, state.settings)
        : "-";
    }

    async function saveCall(event) {
      event.preventDefault();
      const submitter = event.submitter;
      const form = event.currentTarget;
      const primaryOutcome = currentPrimaryOutcomePayload();
      const validation = V.validateCallForm({ callId: form.callId.value });
      if (!validation.ok) {
        setStatusMessage(i18n.t(validation.messageKey, state.settings.language || "es"), "error");
        return;
      }
      if (
        primaryOutcome &&
        primaryOutcome.category === "callback" &&
        (!V.validIsoDate(primaryOutcome.callbackDate) || !V.validTime(primaryOutcome.callbackTime) || !primaryOutcome.dueAt)
      ) {
        $("#lastSavedLabel").textContent = i18n.t("selectCallbackDateTime", state.settings.language || "es");
        return;
      }

      const call = reports.createCallRecord(
        {
          callId: validation.value.callId,
          callType: form.callType.value,
          primaryOutcome,
          description: form.description.value.trim(),
          customComment: form.customComment.value.trim(),
          capturedAt: state.pendingCallCapturedAt,
          dailySequence: reports.callsForToday(activeCalls(), state.settings).length + 1
        },
        state.settings
      );

      const nextCalls = [...state.calls, call];
      let nextReminders = state.reminders;
      if (primaryOutcome && primaryOutcome.category === "callback") {
        nextReminders = [...state.reminders, {
          id: crypto.randomUUID(),
          callId: call.callId,
          relatedCallId: call.id,
          callType: call.callType,
          operator: call.operatorName,
          date: primaryOutcome.callbackDate,
          time: primaryOutcome.callbackTime,
          timezone: primaryOutcome.timezone,
          dueAt: primaryOutcome.dueAt,
          note: call.description || primaryOutcome.label,
          status: "pending",
          createdAt: new Date().toISOString()
        }];
      }

      await runAction(
        async () => {
          await storage.write("calls", nextCalls);
          if (primaryOutcome && primaryOutcome.category === "callback") {
            await storage.write("reminders", nextReminders);
            state.settings = normalizeSettings({ ...state.settings, lastReminderTimezone: primaryOutcome.timezone });
            await storage.write("settings", state.settings);
          }
          if (submitter && ["saveCopy", "saveCopyReminder"].includes(submitter.dataset.action)) {
            await window.callflow.copyText(call.crmLine);
            setStatusMessage(i18n.t("savedAndCopiedCrm", state.settings.language), "success");
          } else {
            setStatusMessage(i18n.t("saved", state.settings.language), "success");
          }
          state.calls = nextCalls;
          state.reminders = nextReminders;
          state.lastCall = call;

          form.callId.value = "";
          form.description.value = "";
          form.customComment.value = "";
          form.callbackDate.value = "";
          form.callbackTime.value = "";
          state.pendingCallCapturedAt = null;
          state.selectedPrimaryOutcome = null;
          state.openOutcomeMenu = null;
          form.callId.focus();
          renderApp();

          if (submitter && submitter.dataset.action === "saveCopyReminder") {
            const reminderForm = $("#reminderForm");
            reminderForm.callId.value = call.callId;
            setStatusMessage(i18n.t("savedCopiedReminder", state.settings.language), "success");
            setView("reminders");
            reminderForm.date.focus();
          }
        },
        { userMessage: i18n.t("saveFailed", state.settings.language || "es"), logMessage: "Failed to save call" }
      );
    }

    async function copyLastCrm() {
      if (!state.lastCall) return;
      await runAction(async () => {
        await window.callflow.copyText(state.lastCall.crmLine);
        setStatusMessage(i18n.t("lastCrmCopied", state.settings.language), "success");
      });
    }

    function captureCurrentCallTime() {
      state.pendingCallCapturedAt = new Date().toISOString();
      renderCapturedCallTime();
    }

    async function importCallIdFromClipboard() {
      const text = await runAction(() => window.callflow.readClipboardText());
      const callId = V.cleanClipboardCallId(text);
      if (!callId) return;
      const form = $("#callForm");
      form.callId.value = callId;
      captureCurrentCallTime();
      renderStatusOptions(false);
      form.callId.focus();
    }

    function handleDocumentClick(event) {
      const statusOption = event.target.closest("[data-status-option]");
      const customCommentOption = event.target.closest("[data-custom-comment-option]");
      const outcomeToggle = event.target.closest("[data-outcome-toggle]");
      const dashboardCallTypeToRemove = event.target.dataset.removeDashboardCallType;
      const selectOutcomeCategory = event.target.dataset.selectOutcome;
      const addOutcomeCategory = event.target.dataset.addOutcome;
      const removeOutcomeCategory = event.target.dataset.removeOutcome;
      const clearOutcome = event.target.closest("[data-clear-outcome]");

      if (dashboardCallTypeToRemove) removeDashboardCallType(dashboardCallTypeToRemove);
      if (outcomeToggle) {
        const category = outcomeToggle.dataset.outcomeToggle;
        if (state.selectedPrimaryOutcome?.category !== category) {
          selectPrimaryOutcome(category, defaultOutcomeLabel(category));
        }
        state.openOutcomeMenu = state.openOutcomeMenu === category ? null : category;
        renderOutcomeControls();
      }
      if (selectOutcomeCategory) selectPrimaryOutcome(selectOutcomeCategory, event.target.dataset.value);
      if (addOutcomeCategory) addOutcomePreset(addOutcomeCategory);
      if (removeOutcomeCategory) removeOutcomePreset(removeOutcomeCategory, event.target.dataset.value);
      if (clearOutcome) clearPrimaryOutcome();
      if (statusOption) selectStatusOption(statusOption.dataset.statusOption);
      if (customCommentOption) selectCustomCommentOption(customCommentOption.dataset.customCommentOption);
      if (!event.target.closest(".status-combobox")) renderStatusOptions(false);
      if (!event.target.closest(".custom-comment-combobox")) renderCustomCommentOptions(false);
      if (!event.target.closest(".outcome-control")) {
        state.openOutcomeMenu = null;
        renderOutcomeControls();
      }
    }

    function bindEvents() {
      $("#callForm").addEventListener("submit", saveCall);
      $("#copyLastCrm").addEventListener("click", copyLastCrm);
      $("#importCallIdClipboard").addEventListener("click", importCallIdFromClipboard);
      $("#captureCallTime").addEventListener("click", captureCurrentCallTime);
      $("#toggleCallTypeManager").addEventListener("click", () => {
        $("#dashboardCallTypeManager").classList.toggle("hidden");
        if (!$("#dashboardCallTypeManager").classList.contains("hidden")) $("#newDashboardCallType").focus();
      });
      $("#saveDashboardCallType").addEventListener("click", addDashboardCallType);
      $("#newDashboardCallType").addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          addDashboardCallType();
        }
      });
      $("#addCurrentStatus").addEventListener("click", addCurrentDashboardStatus);
      $("#removeCurrentStatus").addEventListener("click", removeCurrentDashboardStatus);
      $("#addCurrentCustomComment").addEventListener("click", addCurrentCustomComment);
      $("#removeCurrentCustomComment").addEventListener("click", removeCurrentCustomComment);
      $("#callForm input[name='description']").addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
          renderStatusOptions(false);
          return;
        }
        if (event.key === "Enter") {
          event.preventDefault();
          addCurrentDashboardStatus();
        }
      });
      $("#callForm input[name='description']").addEventListener("focus", () => renderStatusOptions(true));
      $("#callForm input[name='description']").addEventListener("input", () => renderStatusOptions(true));
      $("#customCommentInput").addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
          renderCustomCommentOptions(false);
          return;
        }
        if (event.key === "Enter") {
          event.preventDefault();
          addCurrentCustomComment();
        }
      });
      $("#customCommentInput").addEventListener("focus", () => renderCustomCommentOptions(true));
      $("#customCommentInput").addEventListener("input", () => renderCustomCommentOptions(true));
      $("#callForm").addEventListener("keydown", (event) => {
        const input = event.target.closest("[data-new-outcome]");
        if (input && event.key === "Enter") {
          event.preventDefault();
          addOutcomePreset(input.dataset.newOutcome);
        }
      });
    }

    function render() {
      renderCapturedCallTime();
      renderCallOptions();
      renderOutcomeControls();
      renderDashboardInlineManagers();
      renderBlocks();
      renderStats();
      renderLastCall();
    }

    return {
      bindEvents,
      handleDocumentClick,
      render,
      renderStats
    };
  }

  window.CallFlowDashboardView = { createDashboardView };
})();
