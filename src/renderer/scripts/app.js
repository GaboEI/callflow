(function () {
  const state = {
    settings: null,
    calls: [],
    reminders: [],
    knowledgeBase: [],
    selectedNoteId: null,
    lastCall: null,
    selectedBlocks: new Set()
  };

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));

  function linesToArray(value) {
    return String(value || "")
      .split(/\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function arrayToLines(value) {
    return (value || []).join("\n");
  }

  function escapeHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function markdownPreview(markdown) {
    const escaped = escapeHtml(markdown);
    return escaped
      .replace(/^### (.*)$/gm, "<h3>$1</h3>")
      .replace(/^## (.*)$/gm, "<h2>$1</h2>")
      .replace(/^# (.*)$/gm, "<h1>$1</h1>")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\n/g, "<br />");
  }

  function getViewTitle(view) {
    const titles = {
      dashboard: "Dashboard",
      reports: "Reportes",
      reminders: "Recordatorios",
      stats: "Estadísticas",
      knowledge: "Chuleta",
      settings: "Configuración"
    };
    return titles[view] || "CallFlow";
  }

  function setView(view) {
    $$(".nav-link").forEach((button) => button.classList.toggle("active", button.dataset.view === view));
    $$(".view").forEach((section) => section.classList.remove("active"));
    $(`#${view}View`).classList.add("active");
    $("#viewTitle").textContent = getViewTitle(view);
    render();
  }

  function applySettingsToForms() {
    const settings = state.settings;
    const onboardingForm = $("#onboardingForm");
    onboardingForm.language.value = settings.language;
    onboardingForm.timezone.value = settings.timezone;
    onboardingForm.operatorName.value = settings.operatorName || "";
    onboardingForm.callTypes.value = arrayToLines(settings.callTypes);
    onboardingForm.callStatuses.value = arrayToLines(settings.callStatuses);
    onboardingForm.successLabel.value = settings.successLabel;
    onboardingForm.rejectionLabel.value = settings.rejectionLabel;

    const settingsForm = $("#settingsForm");
    settingsForm.language.innerHTML = [
      ["es", "Español"],
      ["en", "English"],
      ["ru", "Русский"]
    ]
      .map(([value, label]) => `<option value="${value}">${label}</option>`)
      .join("");
    settingsForm.language.value = settings.language;
    settingsForm.timezone.value = settings.timezone;
    settingsForm.operatorName.value = settings.operatorName || "";
    settingsForm.successLabel.value = settings.successLabel;
    settingsForm.rejectionLabel.value = settings.rejectionLabel;
    settingsForm.reportHeaderFormat.value = settings.reportHeaderFormat;
    settingsForm.theme.value = settings.theme || "dark";
    settingsForm.callTypes.value = arrayToLines(settings.callTypes);
    settingsForm.callStatuses.value = arrayToLines(settings.callStatuses);
  }

  function settingsFromForm(form, onboardingCompleted) {
    return {
      ...state.settings,
      language: form.language.value,
      timezone: form.timezone.value,
      operatorName: form.operatorName.value.trim(),
      callTypes: linesToArray(form.callTypes.value),
      callStatuses: linesToArray(form.callStatuses.value),
      successLabel: form.successLabel.value.trim() || "Exitosa",
      rejectionLabel: form.rejectionLabel.value.trim() || "Rechazo",
      reportHeaderFormat: form.reportHeaderFormat
        ? form.reportHeaderFormat.value
        : state.settings.reportHeaderFormat,
      theme: form.theme ? form.theme.value : "dark",
      onboardingCompleted
    };
  }

  async function saveSettings(settings) {
    state.settings = settings;
    await CallFlowStorage.write("settings", settings);
    CallFlowI18n.applyI18n(settings.language);
    applySettingsToForms();
    render();
  }

  function renderCallOptions() {
    const callType = $("#callForm select[name='callType']");
    callType.innerHTML = state.settings.callTypes
      .map((type) => `<option value="${escapeHtml(type)}">${escapeHtml(type)}</option>`)
      .join("");

    $("#statusList").innerHTML = state.settings.callStatuses
      .map((status) => `<option value="${escapeHtml(status)}"></option>`)
      .join("");
  }

  function renderHeader() {
    const now = CallFlowReports.formatCallTimestamp(new Date(), state.settings);
    $("#currentBlockLabel").textContent = CallFlowReports.blockFromHour(now.hour);
    $("#operatorLabel").textContent = state.settings.operatorName || "Sin operador";
  }

  function renderBlocks() {
    const todayCalls = CallFlowReports.callsForToday(state.calls, state.settings);
    const groups = CallFlowReports.groupByBlock(todayCalls);
    const entries = Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));

    $("#hourBlocks").innerHTML = entries.length
      ? entries
          .map(([block, calls]) => `
            <article class="block-item">
              <strong>${block}</strong>
              <span class="muted">${calls.length} llamadas</span>
            </article>
          `)
          .join("")
      : '<p class="muted">Todavía no hay llamadas registradas hoy.</p>';

    $("#reportBlocks").innerHTML = entries.length
      ? entries
          .map(([block, calls]) => `
            <article class="report-item">
              <header>
                <label><input type="checkbox" data-block="${escapeHtml(block)}" ${state.selectedBlocks.has(block) ? "checked" : ""} /> ${block}</label>
                <span class="tag">${calls.length} llamadas</span>
              </header>
              <code>${escapeHtml(calls.map((call) => call.fullLine).join("\n\n"))}</code>
            </article>
          `)
          .join("")
      : '<p class="muted">No hay bloques para copiar.</p>';
  }

  function statsCards(stats) {
    const base = [
      ["Total de llamadas", stats.total],
      [state.settings.successLabel, stats.success],
      [state.settings.rejectionLabel, stats.rejections],
      ["Sin respuesta", stats.noAnswer],
      ["Recordatorios pendientes", stats.pendingReminders]
    ];

    const byType = Object.entries(stats.byType).map(([key, value]) => [`Proveedor ${key}`, value]);
    const byHour = Object.entries(stats.byHour).map(([key, value]) => [`Hora ${key}`, value]);
    return [...base, ...byType, ...byHour]
      .map(([label, value]) => `<article class="card"><span class="muted">${escapeHtml(label)}</span><strong>${value}</strong></article>`)
      .join("");
  }

  function renderStats() {
    const todayCalls = CallFlowReports.callsForToday(state.calls, state.settings);
    const stats = CallFlowStats.buildStats(todayCalls, state.reminders, state.settings);
    $("#dashboardStats").innerHTML = statsCards(stats);
    $("#statsCards").innerHTML = statsCards(stats);
  }

  function renderReminders() {
    const filter = $("#reminderFilter").value;
    const reminders = CallFlowReminders.filterReminders(state.reminders, filter);
    $("#reminderList").innerHTML = reminders.length
      ? reminders
          .map((reminder) => `
            <article class="list-item">
              <header>
                <strong>${escapeHtml(reminder.date)} ${escapeHtml(reminder.time)}</strong>
                <span class="tag">${escapeHtml(reminder.status)}</span>
              </header>
              <p>${escapeHtml(reminder.note)}</p>
              ${reminder.callId ? `<span class="muted">ID: ${escapeHtml(reminder.callId)}</span>` : ""}
              <div class="button-row">
                <button data-complete-reminder="${reminder.id}">Completar</button>
              </div>
            </article>
          `)
          .join("")
      : '<p class="muted">No hay recordatorios en esta vista.</p>';
  }

  function renderNotes() {
    const query = $("#noteSearch").value.toLowerCase();
    const notes = state.knowledgeBase.filter((note) =>
      `${note.title} ${note.content}`.toLowerCase().includes(query)
    );

    $("#notesList").innerHTML = notes.length
      ? notes
          .map((note) => `
            <article class="list-item">
              <header>
                <strong>${escapeHtml(note.title)}</strong>
                <button data-select-note="${note.id}">Abrir</button>
              </header>
              <p class="muted">${escapeHtml(note.content.slice(0, 120))}</p>
            </article>
          `)
          .join("")
      : '<p class="muted">No hay notas.</p>';

    const selected = state.knowledgeBase.find((note) => note.id === state.selectedNoteId);
    const form = $("#noteForm");
    if (selected) {
      form.title.value = selected.title;
      form.content.value = selected.content;
      $("#notePreview").innerHTML = markdownPreview(selected.content);
    } else {
      form.title.value = "";
      form.content.value = "";
      $("#notePreview").innerHTML = '<span class="muted">Vista previa</span>';
    }
  }

  function renderLastCall() {
    if (!state.lastCall) {
      const latest = [...state.calls].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
      state.lastCall = latest || null;
    }
    $("#lastFullLine").textContent = state.lastCall ? state.lastCall.fullLine : "-";
  }

  function render() {
    if (!state.settings) return;
    renderHeader();
    renderCallOptions();
    renderBlocks();
    renderStats();
    renderReminders();
    renderNotes();
    renderLastCall();
  }

  async function saveCall(event) {
    event.preventDefault();
    const submitter = event.submitter;
    const form = event.currentTarget;
    const call = CallFlowReports.createCallRecord(
      {
        callId: form.callId.value,
        callType: form.callType.value,
        description: form.description.value.trim(),
        customComment: form.customComment.value.trim()
      },
      state.settings
    );

    state.calls.push(call);
    state.lastCall = call;
    await CallFlowStorage.write("calls", state.calls);

    if (submitter && submitter.dataset.action === "saveCopy") {
      await window.callflow.copyText(call.crmLine);
      $("#lastSavedLabel").textContent = "Guardado y copiado para CRM";
    } else {
      $("#lastSavedLabel").textContent = "Guardado";
    }

    form.callId.value = "";
    form.description.value = "";
    form.customComment.value = "";
    form.callId.focus();
    render();
  }

  async function copyLastCrm() {
    if (!state.lastCall) return;
    await window.callflow.copyText(state.lastCall.crmLine);
    $("#lastSavedLabel").textContent = "Último CRM copiado";
  }

  async function copySelectedBlocks() {
    const todayCalls = CallFlowReports.callsForToday(state.calls, state.settings);
    const groups = CallFlowReports.groupByBlock(todayCalls);
    const reports = [...state.selectedBlocks]
      .sort()
      .filter((block) => groups[block])
      .map((block) => CallFlowReports.buildSupervisorReport(block, groups[block], state.settings));

    if (reports.length) {
      await window.callflow.copyText(reports.join("\n\n"));
    }
  }

  async function saveReminder(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const reminder = {
      id: crypto.randomUUID(),
      callId: form.callId.value.trim(),
      date: form.date.value,
      time: form.time.value,
      note: form.note.value.trim(),
      status: "pending",
      createdAt: new Date().toISOString()
    };
    state.reminders.push(reminder);
    await CallFlowStorage.write("reminders", state.reminders);
    form.reset();
    render();
  }

  async function completeReminder(id) {
    state.reminders = state.reminders.map((reminder) =>
      reminder.id === id ? { ...reminder, status: "completed", completedAt: new Date().toISOString() } : reminder
    );
    await CallFlowStorage.write("reminders", state.reminders);
    render();
  }

  async function saveNote(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const existing = state.knowledgeBase.find((note) => note.id === state.selectedNoteId);
    if (existing) {
      existing.title = form.title.value.trim();
      existing.content = form.content.value;
      existing.updatedAt = new Date().toISOString();
    } else {
      const note = {
        id: crypto.randomUUID(),
        title: form.title.value.trim(),
        content: form.content.value,
        createdAt: new Date().toISOString()
      };
      state.knowledgeBase.push(note);
      state.selectedNoteId = note.id;
    }
    await CallFlowStorage.write("knowledgeBase", state.knowledgeBase);
    render();
  }

  async function deleteNote() {
    if (!state.selectedNoteId) return;
    state.knowledgeBase = state.knowledgeBase.filter((note) => note.id !== state.selectedNoteId);
    state.selectedNoteId = null;
    await CallFlowStorage.write("knowledgeBase", state.knowledgeBase);
    render();
  }

  async function exportNote(extension) {
    const note = state.knowledgeBase.find((item) => item.id === state.selectedNoteId);
    if (!note) return;
    await window.callflow.exportNote({
      fileName: note.title.replace(/[^a-z0-9_-]+/gi, "-").toLowerCase(),
      content: note.content,
      extension
    });
  }

  function bindEvents() {
    $$(".nav-link").forEach((button) => button.addEventListener("click", () => setView(button.dataset.view)));
    $("#onboardingForm").addEventListener("submit", async (event) => {
      event.preventDefault();
      await saveSettings(settingsFromForm(event.currentTarget, true));
      $("#onboarding").classList.add("hidden");
      $("#app").classList.remove("hidden");
    });

    $("#settingsForm").addEventListener("submit", async (event) => {
      event.preventDefault();
      await saveSettings(settingsFromForm(event.currentTarget, true));
    });

    $("#callForm").addEventListener("submit", saveCall);
    $("#copyLastCrm").addEventListener("click", copyLastCrm);
    $("#copySelectedBlocks").addEventListener("click", copySelectedBlocks);
    $("#reminderForm").addEventListener("submit", saveReminder);
    $("#reminderFilter").addEventListener("change", render);
    $("#noteForm").addEventListener("submit", saveNote);
    $("#deleteNote").addEventListener("click", deleteNote);
    $("#newNote").addEventListener("click", () => {
      state.selectedNoteId = null;
      renderNotes();
      $("#noteForm input[name='title']").focus();
    });
    $("#noteSearch").addEventListener("input", renderNotes);
    $("#noteForm textarea[name='content']").addEventListener("input", (event) => {
      $("#notePreview").innerHTML = markdownPreview(event.target.value);
    });
    $("#exportMd").addEventListener("click", () => exportNote("md"));
    $("#exportTxt").addEventListener("click", () => exportNote("txt"));

    document.addEventListener("change", (event) => {
      if (event.target.matches("[data-block]")) {
        if (event.target.checked) state.selectedBlocks.add(event.target.dataset.block);
        else state.selectedBlocks.delete(event.target.dataset.block);
      }
    });

    document.addEventListener("click", (event) => {
      const reminderId = event.target.dataset.completeReminder;
      const noteId = event.target.dataset.selectNote;
      if (reminderId) completeReminder(reminderId);
      if (noteId) {
        state.selectedNoteId = noteId;
        renderNotes();
      }
    });
  }

  async function init() {
    bindEvents();
    const data = await CallFlowStorage.readAll();
    Object.assign(state, data);
    CallFlowI18n.applyI18n(state.settings.language);
    applySettingsToForms();
    const dataDir = await window.callflow.getDataDir();
    $("#dataDirLabel").textContent = dataDir;

    if (state.settings.onboardingCompleted) {
      $("#app").classList.remove("hidden");
      $("#onboarding").classList.add("hidden");
    } else {
      $("#onboarding").classList.remove("hidden");
      $("#app").classList.add("hidden");
    }

    render();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
