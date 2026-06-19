(function () {
  function createSettingsView(context) {
    const {
      $$,
      activeFormLanguage,
      activeTimezones,
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

    function renderActiveTimezoneEditors() {
      ["onboarding", "settings"].forEach((pickerId) => {
        const output = document.querySelector(`[data-active-timezones-output="${pickerId}"]`);
        if (!output || !state.settings) return;
        const zones = activeTimezones();
        output.innerHTML = zones
          .map(
            (timezone) => `
              <span class="chip timezone-chip">
                ${escapeHtml(timezoneFlag(timezone))} ${escapeHtml(shortTimezoneName(timezone))}
                ${
                  zones.length <= 1
                    ? ""
                    : `<button type="button" data-remove-active-timezone="${escapeHtml(timezone)}" aria-label="${escapeHtml(i18n.t("remove", activeFormLanguage()))}">×</button>`
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
                  <span class="chip">
                    ${escapeHtml(item)}
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
      if (!output || !diagnostics) return;
      output.textContent = [
        `App: ${diagnostics.appVersion || "unknown"}`,
        `Electron: ${diagnostics.electronVersion || "unknown"}`,
        `Platform: ${diagnostics.platform || "unknown"}`,
        `Data: ${diagnostics.dataDir || ""}`,
        `Schemas: ${JSON.stringify(diagnostics.schemas || {})}`,
        `Log: ${diagnostics.logPath || ""}`,
        `Health events: ${(diagnostics.health || []).length}`,
        `Recent errors: ${(diagnostics.recentLogs || []).filter((entry) => entry.level === "error").length}`
      ].join("\n");
    }

    async function refreshDiagnostics() {
      await runAction(async () => {
        const diagnostics = await window.callflow.getDiagnostics();
        renderDiagnostics(diagnostics);
        setStatusMessage("Diagnóstico actualizado", "success");
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
      renderActiveTimezoneEditors();
      renderListEditors();
    }

    function bindEvents() {
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
      renderListEditors
    };
  }

  window.CallFlowSettingsView = { createSettingsView };
})();
