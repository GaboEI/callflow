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
    const legalTermsVersion = "2026-06-21";

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
      if (activeSettingsTab === "about") refreshAboutInfo();
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

    async function refreshAboutInfo() {
      if (!window.callflow?.getDiagnostics) return;
      const language = state.settings?.language || "es";
      const versionOutput = document.querySelector("#aboutAppVersion");
      const dataDirOutput = document.querySelector("#aboutDataDir");
      const termsOutput = document.querySelector("#aboutTermsVersion");
      const acceptedVersionOutput = document.querySelector("#aboutTermsAcceptedVersion");
      const acceptedAtOutput = document.querySelector("#aboutTermsAcceptedAt");
      const accepted = state.settings?.legalAcceptance || null;
      const formatDateTime = (value) => {
        if (!value) return i18n.t("legalNotAccepted", language);
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return value;
        try {
          return new Intl.DateTimeFormat(language, {
            dateStyle: "medium",
            timeStyle: "short"
          }).format(date);
        } catch (_error) {
          return date.toLocaleString(language);
        }
      };
      if (termsOutput) termsOutput.textContent = legalTermsVersion;
      if (acceptedVersionOutput) {
        acceptedVersionOutput.textContent = accepted?.termsVersion || i18n.t("legalNotAccepted", language);
      }
      if (acceptedAtOutput) {
        acceptedAtOutput.textContent = formatDateTime(accepted?.acceptedAt);
      }
      try {
        const diagnostics = await window.callflow.getDiagnostics();
        if (versionOutput) versionOutput.textContent = diagnostics.appVersion || "0.2.0-beta.1";
        if (dataDirOutput) dataDirOutput.textContent = diagnostics.dataDir || i18n.t("notAvailable", language);
      } catch (_error) {
        if (versionOutput) versionOutput.textContent = "0.2.0-beta.1";
        if (dataDirOutput) dataDirOutput.textContent = i18n.t("notAvailable", language);
      }
    }

    function checkUpdates() {
      setStatusMessage(i18n.t("updatesManual", state.settings?.language || "es"), "warning");
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

    async function eraseLocalData() {
      const language = state.settings?.language || "es";
      const confirmMessage = i18n.t("eraseLocalDataConfirm", language);
      const confirmToken = i18n.t("eraseLocalDataConfirmToken", language);
      if (!window.confirm(confirmMessage)) return;
      const typed = window.prompt(i18n.t("eraseLocalDataTypeConfirm", language), confirmToken);
      if (!typed || typed.trim() !== confirmToken) {
        setStatusMessage(i18n.t("eraseLocalDataCanceled", language), "warning");
        return;
      }
      await runAction(async () => {
        setStatusMessage(i18n.t("eraseLocalDataInProgress", language), "warning");
        await window.callflow.resetLocalData();
        setStatusMessage(i18n.t("eraseLocalDataRestarting", language), "success");
        await window.callflow.restartApp();
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
      document.querySelector("#eraseLocalData").addEventListener("click", eraseLocalData);
      document.querySelector("#refreshDiagnostics").addEventListener("click", refreshDiagnostics);
      document.querySelector("#checkUpdates")?.addEventListener("click", checkUpdates);
    }

    return {
      addListItem,
      bindEvents,
      importBackup,
      refreshAboutInfo,
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
