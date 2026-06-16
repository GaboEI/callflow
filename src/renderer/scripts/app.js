(function () {
  const state = {
    settings: null,
    calls: [],
    reminders: [],
    knowledgeBase: [],
    selectedNoteId: null,
    lastCall: null,
    selectedBlocks: new Set(),
    formLists: {
      onboardingCallTypes: [],
      onboardingFrequentStatuses: [],
      settingsCallTypes: [],
      settingsFrequentStatuses: []
    },
    presetMeta: {
      onboardingFrequentStatuses: { custom: [] },
      settingsFrequentStatuses: { custom: [] }
    },
    labelTouched: {
      onboardingSuccess: false,
      onboardingRejection: false,
      settingsSuccess: false,
      settingsRejection: false
    }
  };

  const presets = {
    es: {
      frequentStatuses: [
        "Sin_respuesta",
        "Buzón",
        "Contesta_cuelga",
        "Teléfono_apagado",
        "Teléfono_fuera_de_línea",
        "No_habla"
      ],
      selectedStatuses: ["Sin_respuesta", "Buzón", "Contesta_cuelga", "Teléfono_apagado"],
      successLabels: ["Exitosa", "Venta", "Cita_agendada", "Caso_resuelto", "Seguimiento_programado"],
      rejectionLabel: "Rechazo"
    },
    en: {
      frequentStatuses: [
        "No_answer",
        "Voicemail",
        "Answers_and_hangs_up",
        "Phone_off",
        "Phone_out_of_service",
        "Does_not_speak"
      ],
      selectedStatuses: ["No_answer", "Voicemail", "Answers_and_hangs_up", "Phone_off"],
      successLabels: ["Successful", "Sale", "Appointment_booked", "Case_resolved", "Follow_up_scheduled"],
      rejectionLabel: "Rejected"
    },
    ru: {
      frequentStatuses: [
        "Нет_ответа",
        "Голосовая_почта",
        "Ответил_и_сбросил",
        "Телефон_выключен",
        "Телефон_вне_зоны",
        "Не_говорит"
      ],
      selectedStatuses: ["Нет_ответа", "Голосовая_почта", "Ответил_и_сбросил", "Телефон_выключен"],
      successLabels: ["Успешно", "Продажа", "Встреча_назначена", "Заявка_решена", "Повторный_звонок_назначен"],
      rejectionLabel: "Отказ"
    }
  };

  const presetStatusValues = new Set(Object.values(presets).flatMap((preset) => preset.frequentStatuses));
  const fallbackTimezones = [
    "Africa/Cairo",
    "Africa/Casablanca",
    "Africa/Johannesburg",
    "America/Argentina/Buenos_Aires",
    "America/Bogota",
    "America/Chicago",
    "America/Los_Angeles",
    "America/Mexico_City",
    "America/New_York",
    "America/Santiago",
    "America/Sao_Paulo",
    "America/Toronto",
    "Asia/Dubai",
    "Asia/Hong_Kong",
    "Asia/Jerusalem",
    "Asia/Kolkata",
    "Asia/Seoul",
    "Asia/Shanghai",
    "Asia/Singapore",
    "Asia/Tokyo",
    "Australia/Sydney",
    "Europe/Berlin",
    "Europe/Lisbon",
    "Europe/London",
    "Europe/Madrid",
    "Europe/Moscow",
    "Europe/Paris",
    "Europe/Rome",
    "UTC"
  ];
  const timezones =
    typeof Intl.supportedValuesOf === "function"
      ? Intl.supportedValuesOf("timeZone")
      : fallbackTimezones;

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));

  function linesToArray(value) {
    if (Array.isArray(value)) {
      return value.map((item) => String(item).trim()).filter(Boolean);
    }
    return String(value || "")
      .split(/\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function uniqueItems(value) {
    return [...new Set(linesToArray(value))];
  }

  function presetForLanguage(language) {
    return presets[language] || presets.es;
  }

  function defaultSuccessLabel(language) {
    return presetForLanguage(language).successLabels[0];
  }

  function defaultRejectionLabel(language) {
    return presetForLanguage(language).rejectionLabel;
  }

  function isSystemDefaultSuccessLabel(value) {
    return Object.values(presets).some((preset) => preset.successLabels[0] === value);
  }

  function isSystemDefaultRejectionLabel(value) {
    return Object.values(presets).some((preset) => preset.rejectionLabel === value);
  }

  function normalizeSettings(settings) {
    const normalized = {
      ...settings,
      timezone: settings.timezone || "local",
      callTypes: uniqueItems(settings.callTypes),
      frequentStatuses: uniqueItems(settings.frequentStatuses || settings.callStatuses),
      successLabel: settings.successLabel || defaultSuccessLabel(settings.language),
      rejectionLabel: settings.rejectionLabel || defaultRejectionLabel(settings.language)
    };

    if (!normalized.frequentStatuses.length) {
      normalized.frequentStatuses = [...presetForLanguage(normalized.language).selectedStatuses];
    }

    delete normalized.callStatuses;
    return normalized;
  }

  function languageLocale(language) {
    return { es: "es-ES", en: "en-US", ru: "ru-RU" }[language] || "es-ES";
  }

  function localizedRegion(region, language) {
    const names = {
      es: {
        Africa: "África",
        America: "América",
        Antarctica: "Antártida",
        Arctic: "Ártico",
        Asia: "Asia",
        Atlantic: "Atlántico",
        Australia: "Australia",
        Europe: "Europa",
        Indian: "Índico",
        Pacific: "Pacífico",
        UTC: "UTC",
        Etc: "Etc"
      },
      en: {
        Africa: "Africa",
        America: "America",
        Antarctica: "Antarctica",
        Arctic: "Arctic",
        Asia: "Asia",
        Atlantic: "Atlantic",
        Australia: "Australia",
        Europe: "Europe",
        Indian: "Indian",
        Pacific: "Pacific",
        UTC: "UTC",
        Etc: "Etc"
      },
      ru: {
        Africa: "Африка",
        America: "Америка",
        Antarctica: "Антарктида",
        Arctic: "Арктика",
        Asia: "Азия",
        Atlantic: "Атлантика",
        Australia: "Австралия",
        Europe: "Европа",
        Indian: "Индийский океан",
        Pacific: "Тихий океан",
        UTC: "UTC",
        Etc: "Etc"
      }
    };
    return (names[language] && names[language][region]) || region;
  }

  function localizedCity(city, language) {
    const cleanCity = city.replaceAll("_", "_");
    const ruCities = {
      Madrid: "Мадрид",
      London: "Лондон",
      Moscow: "Москва",
      Paris: "Париж",
      Rome: "Рим",
      Berlin: "Берлин",
      New_York: "Нью-Йорк",
      Mexico_City: "Мехико",
      Los_Angeles: "Лос-Анджелес",
      Chicago: "Чикаго",
      Tokyo: "Токио",
      Seoul: "Сеул",
      Shanghai: "Шанхай",
      Singapore: "Сингапур",
      Dubai: "Дубай",
      Sydney: "Сидней"
    };
    if (language === "ru" && ruCities[city]) return ruCities[city];
    return cleanCity;
  }

  function timezoneOffset(timezone, date = new Date()) {
    if (timezone === "local") {
      timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    }

    try {
      const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        timeZoneName: "shortOffset",
        hour: "2-digit"
      }).formatToParts(date);
      const rawOffset = parts.find((part) => part.type === "timeZoneName").value;
      if (rawOffset === "GMT" || rawOffset === "UTC") return "UTC+00:00";
      const match = rawOffset.match(/^GMT([+-])(\d{1,2})(?::(\d{2}))?$/);
      if (!match) return rawOffset.replace("GMT", "UTC");
      return `UTC${match[1]}${match[2].padStart(2, "0")}:${match[3] || "00"}`;
    } catch (_error) {
      return "UTC";
    }
  }

  function timezoneCurrentTime(timezone, language) {
    const resolvedTimezone = timezone === "local" ? Intl.DateTimeFormat().resolvedOptions().timeZone : timezone;
    try {
      return new Intl.DateTimeFormat(languageLocale(language), {
        timeZone: resolvedTimezone,
        hour: "2-digit",
        minute: "2-digit"
      }).format(new Date());
    } catch (_error) {
      return "";
    }
  }

  function timezoneLabel(value, language) {
    if (value === "local") {
      const resolved = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
      return `${CallFlowI18n.t("localSystemTime", language)} — ${resolved} — ${timezoneOffset("local")}`;
    }

    const [region, ...cityParts] = value.split("/");
    const city = cityParts.join("/");
    const label = city ? `${localizedRegion(region, language)} / ${localizedCity(city, language)}` : value;
    const currentTime = timezoneCurrentTime(value, language);
    return `${label} — ${timezoneOffset(value)}${currentTime ? ` — ${currentTime}` : ""}`;
  }

  function timezoneMatches(value, label, query) {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return true;
    return `${value} ${label}`.toLowerCase().includes(normalizedQuery);
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
    onboardingForm.successLabel.value = settings.successLabel;
    onboardingForm.rejectionLabel.value = settings.rejectionLabel;
    state.formLists.onboardingCallTypes = [...settings.callTypes];
    state.formLists.onboardingFrequentStatuses = [...settings.frequentStatuses];
    state.presetMeta.onboardingFrequentStatuses.custom = settings.onboardingCompleted
      ? [...settings.frequentStatuses]
      : settings.frequentStatuses.filter((status) => !presetStatusValues.has(status));

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
    state.formLists.settingsCallTypes = [...settings.callTypes];
    state.formLists.settingsFrequentStatuses = [...settings.frequentStatuses];
    state.presetMeta.settingsFrequentStatuses.custom = [...settings.frequentStatuses];
    renderTimezonePickers(settings.language);
    renderListEditors();
    renderLabelSuggestions(settings.language);
  }

  function settingsFromForm(form, onboardingCompleted) {
    const listPrefix = form.id === "onboardingForm" ? "onboarding" : "settings";
    return {
      ...state.settings,
      language: form.language.value,
      timezone: form.timezone.value,
      operatorName: form.operatorName.value.trim(),
      callTypes: [...state.formLists[`${listPrefix}CallTypes`]],
      frequentStatuses: [...state.formLists[`${listPrefix}FrequentStatuses`]],
      successLabel: form.successLabel.value.trim() || defaultSuccessLabel(form.language.value),
      rejectionLabel: form.rejectionLabel.value.trim() || defaultRejectionLabel(form.language.value),
      reportHeaderFormat: form.reportHeaderFormat
        ? form.reportHeaderFormat.value
        : state.settings.reportHeaderFormat,
      theme: form.theme ? form.theme.value : "dark",
      onboardingCompleted
    };
  }

  async function saveSettings(settings) {
    state.settings = normalizeSettings(settings);
    await CallFlowStorage.write("settings", state.settings);
    CallFlowI18n.applyI18n(state.settings.language);
    applySettingsToForms();
    render();
  }

  function activeFormLanguage() {
    const onboardingVisible = !$("#onboarding").classList.contains("hidden");
    const form = onboardingVisible ? $("#onboardingForm") : $("#settingsForm");
    return form.language.value || state.settings.language || "es";
  }

  function renderLabelSuggestions(language) {
    const preset = presetForLanguage(language);
    $("#successLabelSuggestions").innerHTML = preset.successLabels
      .map((label) => `<option value="${escapeHtml(label)}"></option>`)
      .join("");
    $("#rejectionLabelSuggestions").innerHTML = `<option value="${escapeHtml(preset.rejectionLabel)}"></option>`;
  }

  function refreshPresetBackedStatuses(listId, language) {
    const meta = state.presetMeta[listId] || { custom: [] };
    state.formLists[listId] = uniqueItems([...presetForLanguage(language).selectedStatuses, ...meta.custom]);
  }

  function handleLanguageChange(form, language) {
    CallFlowI18n.applyI18n(language);
    renderLabelSuggestions(language);
    renderTimezonePickers(language);

    if (form.id === "onboardingForm" && !state.settings.onboardingCompleted) {
      refreshPresetBackedStatuses("onboardingFrequentStatuses", language);
      if (!state.labelTouched.onboardingSuccess) {
        form.successLabel.value = defaultSuccessLabel(language);
      }
      if (!state.labelTouched.onboardingRejection) {
        form.rejectionLabel.value = defaultRejectionLabel(language);
      }
    }

    if (form.id === "settingsForm") {
      if (!state.labelTouched.settingsSuccess && isSystemDefaultSuccessLabel(form.successLabel.value)) {
        form.successLabel.value = defaultSuccessLabel(language);
      }
      if (!state.labelTouched.settingsRejection && isSystemDefaultRejectionLabel(form.rejectionLabel.value)) {
        form.rejectionLabel.value = defaultRejectionLabel(language);
      }
    }

    renderListEditors();
  }

  function renderTimezonePickers(language) {
    ["onboarding", "settings"].forEach((pickerId) => {
      const form = pickerId === "onboarding" ? $("#onboardingForm") : $("#settingsForm");
      const hidden = form.timezone;
      const search = document.querySelector(`[data-timezone-search="${pickerId}"]`);
      if (!hidden || !search) return;
      search.value = timezoneLabel(hidden.value || "local", language);
      renderTimezoneResults(pickerId, language, "");
    });
  }

  function renderTimezoneResults(pickerId, language, query) {
    const results = document.querySelector(`[data-timezone-results="${pickerId}"]`);
    if (!results) return;

    const localOption = { value: "local", label: timezoneLabel("local", language) };
    const zoneOptions = timezones
      .map((timezone) => ({ value: timezone, label: timezoneLabel(timezone, language) }))
      .filter((option) => timezoneMatches(option.value, option.label, query));
    const options = timezoneMatches(localOption.value, localOption.label, query)
      ? [localOption, ...zoneOptions.slice(0, 80)]
      : zoneOptions.slice(0, 80);

    results.innerHTML = options
      .map(
        (option) => `
          <button type="button" class="timezone-option" data-timezone-picker-option="${pickerId}" data-value="${escapeHtml(option.value)}">
            <span>${escapeHtml(option.label)}</span>
            <small>${escapeHtml(option.value)}</small>
          </button>
        `
      )
      .join("");
  }

  function selectTimezone(pickerId, value) {
    const form = pickerId === "onboarding" ? $("#onboardingForm") : $("#settingsForm");
    const search = document.querySelector(`[data-timezone-search="${pickerId}"]`);
    form.timezone.value = value;
    search.value = timezoneLabel(value, form.language.value);
    renderTimezoneResults(pickerId, form.language.value, "");
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
                  <button type="button" data-remove-list-item="${listId}" data-value="${escapeHtml(item)}" aria-label="${CallFlowI18n.t("remove", activeLanguage)}">×</button>
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

  function renderCallOptions() {
    const callType = $("#callForm select[name='callType']");
    callType.innerHTML = state.settings.callTypes.length
      ? state.settings.callTypes
          .map((type) => `<option value="${escapeHtml(type)}">${escapeHtml(type)}</option>`)
          .join("")
      : '<option value="General">General</option>';

    $("#statusList").innerHTML = state.settings.frequentStatuses
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

    const byType = Object.entries(stats.byType).map(([key, value]) => [`Tipo ${key}`, value]);
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
    renderListEditors();
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
    $("#onboardingForm select[name='language']").addEventListener("change", (event) => {
      handleLanguageChange($("#onboardingForm"), event.target.value);
    });

    $("#settingsForm").addEventListener("submit", async (event) => {
      event.preventDefault();
      await saveSettings(settingsFromForm(event.currentTarget, true));
    });
    $("#settingsForm select[name='language']").addEventListener("change", (event) => {
      handleLanguageChange($("#settingsForm"), event.target.value);
    });
    $("#onboardingForm input[name='successLabel']").addEventListener("input", () => {
      state.labelTouched.onboardingSuccess = true;
    });
    $("#onboardingForm input[name='rejectionLabel']").addEventListener("input", () => {
      state.labelTouched.onboardingRejection = true;
    });
    $("#settingsForm input[name='successLabel']").addEventListener("input", () => {
      state.labelTouched.settingsSuccess = true;
    });
    $("#settingsForm input[name='rejectionLabel']").addEventListener("input", () => {
      state.labelTouched.settingsRejection = true;
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
    $$("[data-list-input]").forEach((input) => {
      input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          addListItem(input.dataset.listInput, input.value);
        }
      });
    });
    $$("[data-timezone-search]").forEach((input) => {
      input.addEventListener("focus", () => {
        renderTimezoneResults(input.dataset.timezoneSearch, activeFormLanguage(), "");
      });
      input.addEventListener("input", () => {
        renderTimezoneResults(input.dataset.timezoneSearch, activeFormLanguage(), input.value);
      });
    });

    document.addEventListener("change", (event) => {
      if (event.target.matches("[data-block]")) {
        if (event.target.checked) state.selectedBlocks.add(event.target.dataset.block);
        else state.selectedBlocks.delete(event.target.dataset.block);
      }
    });

    document.addEventListener("click", (event) => {
      const addListId = event.target.dataset.addListItem;
      const removeListId = event.target.dataset.removeListItem;
      const presetListId = event.target.dataset.presetListItem;
      const timezonePickerId = event.target.dataset.timezonePickerOption;
      const reminderId = event.target.dataset.completeReminder;
      const noteId = event.target.dataset.selectNote;
      if (addListId) {
        addListItem(addListId, document.querySelector(`[data-list-input="${addListId}"]`).value);
      }
      if (removeListId) {
        removeListItem(removeListId, event.target.dataset.value);
      }
      if (presetListId) {
        addListItem(presetListId, event.target.dataset.value);
      }
      if (timezonePickerId) {
        selectTimezone(timezonePickerId, event.target.dataset.value);
      }
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
    state.settings = normalizeSettings(state.settings);
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
