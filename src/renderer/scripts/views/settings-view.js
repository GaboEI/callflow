(function () {
  function createSettingsView(context) {
    const {
      $$,
      activeFormLanguage,
      activeTimezones,
      activeTimezonesForPicker,
      applySettingsToForms,
      escapeHtml,
      i18n,
      normalizeRuntimeData,
      normalizeSettings,
      presetForLanguage,
      presetStatusValues,
      renderApp,
      runAction,
      setStatusMessage,
      shortTimezoneName,
      state,
      storage,
      timezoneFlag,
      uniqueItems
    } = context;
    let activeSettingsTab = "general";
    let activeSettingsList = "settingsCallTypes";

    function setSettingsTab(tabId = "general") {
      activeSettingsTab = tabId;
      document.querySelectorAll("[data-settings-tab]").forEach((button) => {
        const active = button.dataset.settingsTab === activeSettingsTab;
        button.classList.toggle("active", active);
        button.setAttribute("aria-selected", String(active));
      });
      document.querySelectorAll("[data-settings-panel]").forEach((panel) => {
        const active = panel.dataset.settingsPanel === activeSettingsTab;
        panel.classList.toggle("active", active);
        panel.classList.toggle("hidden", !active);
      });
    }

    function setSettingsList(listId = "settingsCallTypes") {
      activeSettingsList = listId;
      document.querySelectorAll("[data-settings-list-tab]").forEach((button) => {
        const active = button.dataset.settingsListTab === activeSettingsList;
        button.classList.toggle("active", active);
        button.setAttribute("aria-selected", String(active));
      });
      document.querySelectorAll("[data-settings-list-panel]").forEach((panel) => {
        const active = panel.dataset.settingsListPanel === activeSettingsList;
        panel.classList.toggle("active", active);
        panel.classList.toggle("hidden", !active);
      });
    }

    function renderActiveTimezoneEditors() {
      ["onboarding", "settings"].forEach((pickerId) => {
        const output = document.querySelector(`[data-active-timezones-output="${pickerId}"]`);
        if (!output || !state.settings) return;
        const zones = activeTimezonesForPicker ? activeTimezonesForPicker(pickerId) : activeTimezones();
        output.innerHTML = zones
          .map(
            (timezone) => `
              <span class="chip timezone-chip" title="${escapeHtml(timezone)}">
                <span class="chip-text">${escapeHtml(timezoneFlag(timezone))} ${escapeHtml(shortTimezoneName(timezone))}</span>
                ${
                  zones.length <= 1
                    ? ""
                    : `<button type="button" data-remove-active-timezone="${escapeHtml(timezone)}" data-remove-active-timezone-picker="${escapeHtml(pickerId)}" aria-label="${escapeHtml(i18n.t("remove", activeFormLanguage()))}">×</button>`
                }
              </span>
            `
          )
          .join("");
      });
    }

    function renderListEditors() {
      const activeLanguage = activeFormLanguage();
      Object.entries(state.formLists).forEach(([listId, items]) => {
        const output = document.querySelector(`[data-list-output="${listId}"]`);
        if (!output) return;
        output.innerHTML = items.length
          ? items
              .map(
                (item) => `
                  <span class="chip" title="${escapeHtml(item)}">
                    <span class="chip-text">${escapeHtml(item)}</span>
                    <button type="button" data-remove-list-item="${listId}" data-value="${escapeHtml(item)}" aria-label="${i18n.t("remove", activeLanguage)}">×</button>
                  </span>
                `
              )
              .join("")
          : '<span class="muted">-</span>';
      });

      $$("[data-status-suggestions]").forEach((container) => {
        const target = container.dataset.statusSuggestions;
        container.innerHTML = presetForLanguage(activeLanguage).frequentStatuses
          .map((status) => `<button type="button" class="chip preset" data-preset-list-item="${target}" data-value="${escapeHtml(status)}">${escapeHtml(status)}</button>`)
          .join("");
      });
    }

    function addListItem(listId, value) {
      const item = String(value || "").trim();
      if (!item) return;
      state.formLists[listId] = uniqueItems([...state.formLists[listId], item]);
      if (state.presetMeta[listId] && !presetStatusValues.has(item)) {
        state.presetMeta[listId].custom = uniqueItems([...state.presetMeta[listId].custom, item]);
      }
      const input = document.querySelector(`[data-list-input="${listId}"]`);
      if (input) input.value = "";
      renderListEditors();
    }

    function removeListItem(listId, value) {
      state.formLists[listId] = state.formLists[listId].filter((item) => item !== value);
      if (state.presetMeta[listId]) {
        state.presetMeta[listId].custom = state.presetMeta[listId].custom.filter((item) => item !== value);
      }
      renderListEditors();
    }

    function renderDiagnostics(diagnostics) {
      const output = document.querySelector("#diagnosticsOutput");
      const summary = document.querySelector("#diagnosticsSummary");
      if (!output || !diagnostics) return;
      const activeLanguage = state.settings?.language || "es";
      const text = (key) => i18n.t(key, activeLanguage);
      const healthCount = (diagnostics.health || []).length;
      const recentErrors = (diagnostics.recentLogs || []).filter((entry) => entry.level === "error").length;
      const healthSummary = healthCount || recentErrors
        ? text("diagnosticsNeedsReview")
        : text("diagnosticsOk");
      if (summary) summary.textContent = healthSummary;
      output.textContent = [
        `${text("diagnosticsStatus")}: ${healthSummary}`,
        `${text("diagnosticsDataFolder")}: ${diagnostics.dataDir || text("notAvailable")}`,
        `${text("diagnosticsSupportLog")}: ${diagnostics.logPath || text("notAvailable")}`,
        "",
        `${text("diagnosticsTechnicalDetails")}:`,
        `${text("diagnosticsAppVersion")}: ${diagnostics.appVersion || "unknown"}`,
        `Electron: ${diagnostics.electronVersion || "unknown"}`,
        `${text("diagnosticsSystem")}: ${diagnostics.platform || "unknown"}`,
        `${text("diagnosticsDataVersions")}: ${JSON.stringify(diagnostics.schemas || {})}`,
        `${text("diagnosticsHealthEvents")}: ${healthCount}`,
        `${text("diagnosticsRecentErrors")}: ${recentErrors}`
      ].join("\n");
    }

    async function refreshDiagnostics() {
      await runAction(async () => {
        const diagnostics = await window.callflow.getDiagnostics();
        renderDiagnostics(diagnostics);
        setStatusMessage(i18n.t("diagnosticsUpdated", state.settings?.language || "es"), "success");
      });
    }

    async function exportBackup() {
      await runAction(async () => {
        const result = await window.callflow.exportBackup();
        if (!result.canceled) setStatusMessage("Backup exportado", "success");
      });
    }

    async function importBackup() {
      const language = state.settings.language || "es";
      if (!window.confirm("Importar un backup reemplazará los datos actuales después de crear un backup local. ¿Continuar?")) return;
      await runAction(async () => {
        const result = await window.callflow.importBackup();
        if (result.canceled) return;
        const data = await storage.readAll();
        Object.assign(state, data);
        state.settings = normalizeSettings(state.settings);
        normalizeRuntimeData();
        applySettingsToForms();
        i18n.applyI18n(state.settings.language);
        renderApp();
        setStatusMessage(i18n.t("saved", language), "success");
      });
    }

    function render() {
      setSettingsTab(activeSettingsTab);
      setSettingsList(activeSettingsList);
      renderActiveTimezoneEditors();
      renderListEditors();
    }

    function bindEvents() {
      document.querySelectorAll("[data-settings-tab]").forEach((button) => {
        button.addEventListener("click", () => setSettingsTab(button.dataset.settingsTab));
      });
      document.querySelectorAll("[data-settings-list-tab]").forEach((button) => {
        button.addEventListener("click", () => setSettingsList(button.dataset.settingsListTab));
      });
      document.querySelector("#exportBackup").addEventListener("click", exportBackup);
      document.querySelector("#importBackup").addEventListener("click", importBackup);
      document.querySelector("#refreshDiagnostics").addEventListener("click", refreshDiagnostics);
    }

    return {
      addListItem,
      bindEvents,
      importBackup,
      refreshDiagnostics,
      removeListItem,
      render,
      renderActiveTimezoneEditors,
      renderListEditors,
      setSettingsTab
    };
  }

  window.CallFlowSettingsView = { createSettingsView };
})();
