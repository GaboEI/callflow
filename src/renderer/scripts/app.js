(function () {
  const state = {
    settings: null,
    calls: [],
    reminders: [],
    knowledgeBase: [],
    workTimer: null,
    clockTimer: null,
    selectedNoteId: null,
    lastCall: null,
    selectedBlocks: new Set(),
    editingReportBlockKey: null,
    reportRange: {
      preset: "today",
      from: "",
      to: ""
    },
    reportSearch: {
      query: "",
      matches: 0,
      activeIndex: 0
    },
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
    },
    timezonePickers: {
      onboarding: {
        searchQuery: "",
        selectedTimezoneValue: "local",
        isTimezoneDropdownOpen: false,
        filteredTimezoneOptions: [],
        highlightedTimezoneIndex: -1
      },
      settings: {
        searchQuery: "",
        selectedTimezoneValue: "local",
        isTimezoneDropdownOpen: false,
        filteredTimezoneOptions: [],
        highlightedTimezoneIndex: -1
      }
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

  function defaultWorkTimer() {
    return {
      status: "idle",
      workElapsedMs: 0,
      workStartedAt: null,
      currentBreakStartedAt: null,
      breaks: []
    };
  }

  function normalizeWorkTimer(timer) {
    return {
      ...defaultWorkTimer(),
      ...(timer || {}),
      workElapsedMs: Number(timer && timer.workElapsedMs) || 0,
      breaks: Array.isArray(timer && timer.breaks) ? timer.breaks : []
    };
  }

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
      rejectionLabel: settings.rejectionLabel || defaultRejectionLabel(settings.language),
      linePrefixMode: settings.linePrefixMode || "hash",
      clockFormat: settings.clockFormat || "24h"
    };

    if (!normalized.onboardingCompleted && !normalized.frequentStatuses.length) {
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

  function normalizeTimezoneSearch(value) {
    return String(value || "")
      .toLowerCase()
      .replaceAll("_", " ")
      .replaceAll("/", " ")
      .replace(/[—–-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function timezoneSearchAliases(value) {
    const aliases = {
      "Europe/Madrid": "spain madrid espana madrid españa madrid spain espana españa madrid",
      "Europe/London": "united kingdom uk england britain londres london",
      "Europe/Moscow": "russia rusia moscu moscow moscú moskva",
      "America/New_York": "new york nyc united states usa us estados unidos",
      "America/Mexico_City": "mexico city méxico city mexico ciudad méxico ciudad ciudad de mexico ciudad de méxico",
      "America/Havana": "cuba havana habana",
      "America/Los_Angeles": "los angeles california united states usa us",
      "America/Chicago": "chicago united states usa us",
      "Asia/Tokyo": "japan japon japón tokyo",
      "Asia/Dubai": "united arab emirates emirates dubai",
      "UTC": "gmt utc universal"
    };
    return aliases[value] || "";
  }

  function timezoneOption(value, language) {
    const resolvedTimezone = value === "local" ? Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC" : value;
    const [region, ...cityParts] = value.split("/");
    const city = cityParts.join("/");
    const displayName =
      value === "local"
        ? CallFlowI18n.t("localSystemTime", language)
        : city
          ? `${localizedRegion(region, language)} / ${localizedCity(city, language)}`
          : value;
    const offset = timezoneOffset(value);
    const currentTime = timezoneCurrentTime(value, language);
    const label =
      value === "local"
        ? `${displayName} — ${resolvedTimezone} — ${offset}`
        : `${displayName} — ${offset}${currentTime ? ` — ${currentTime}` : ""}`;
    const searchText = normalizeTimezoneSearch(
      [
        value,
        value.replaceAll("_", " "),
        resolvedTimezone,
        resolvedTimezone.replaceAll("_", " "),
        displayName,
        localizedRegion(region, language),
        localizedCity(city, language),
        offset,
        offset.replace(":00", ""),
        timezoneSearchAliases(value)
      ].join(" ")
    );

    return {
      value,
      label,
      resolvedTimezone,
      offset,
      currentTime,
      searchText
    };
  }

  function timezonePickerState(pickerId) {
    return state.timezonePickers[pickerId];
  }

  function timezonePickerForm(pickerId) {
    return pickerId === "onboarding" ? $("#onboardingForm") : $("#settingsForm");
  }

  function timezonePickerElements(pickerId) {
    return {
      form: timezonePickerForm(pickerId),
      search: document.querySelector(`[data-timezone-search="${pickerId}"]`),
      selected: document.querySelector(`[data-timezone-selected="${pickerId}"]`),
      results: document.querySelector(`[data-timezone-results="${pickerId}"]`)
    };
  }

  function buildTimezoneOptions(language) {
    return [timezoneOption("local", language), ...timezones.map((timezone) => timezoneOption(timezone, language))];
  }

  function filterTimezoneOptions(pickerId, language) {
    const pickerState = timezonePickerState(pickerId);
    const normalizedQuery = normalizeTimezoneSearch(pickerState.searchQuery);
    const compactOffsetQuery = normalizedQuery.replace(":00", "");
    const options = buildTimezoneOptions(language).filter((option) => {
      if (!normalizedQuery) return true;
      return option.searchText.includes(normalizedQuery) || option.searchText.includes(compactOffsetQuery);
    });
    pickerState.filteredTimezoneOptions = options.slice(0, 80);
    if (pickerState.highlightedTimezoneIndex >= pickerState.filteredTimezoneOptions.length) {
      pickerState.highlightedTimezoneIndex = pickerState.filteredTimezoneOptions.length ? 0 : -1;
    }
  }

  function renderTimezonePicker(pickerId, language) {
    const pickerState = timezonePickerState(pickerId);
    const { form, search, selected, results } = timezonePickerElements(pickerId);
    if (!form || !form.timezone || !search || !results) return;

    form.timezone.value = pickerState.selectedTimezoneValue || "local";
    search.value = pickerState.searchQuery;
    if (selected) selected.textContent = timezoneLabel(pickerState.selectedTimezoneValue || "local", language);

    results.classList.toggle("open", pickerState.isTimezoneDropdownOpen);
    results.innerHTML = pickerState.filteredTimezoneOptions.length
      ? pickerState.filteredTimezoneOptions
          .map((option, index) => {
            const active = index === pickerState.highlightedTimezoneIndex;
            return `
              <button type="button" class="timezone-option${active ? " active" : ""}" data-timezone-picker-option="${pickerId}" data-value="${escapeHtml(option.value)}" aria-selected="${active ? "true" : "false"}">
                <span>${escapeHtml(option.label)}</span>
                <small>${escapeHtml(option.value)}</small>
              </button>
            `;
          })
          .join("")
      : '<p class="timezone-empty">No results</p>';
  }

  function openTimezoneDropdown(pickerId) {
    const pickerState = timezonePickerState(pickerId);
    pickerState.isTimezoneDropdownOpen = true;
    filterTimezoneOptions(pickerId, activeFormLanguage());
    renderTimezonePicker(pickerId, activeFormLanguage());
  }

  function closeTimezoneDropdown(pickerId) {
    const pickerState = timezonePickerState(pickerId);
    pickerState.isTimezoneDropdownOpen = false;
    pickerState.highlightedTimezoneIndex = -1;
    renderTimezonePicker(pickerId, activeFormLanguage());
  }

  function toggleTimezoneDropdown(pickerId) {
    const pickerState = timezonePickerState(pickerId);
    if (pickerState.isTimezoneDropdownOpen) {
      closeTimezoneDropdown(pickerId);
      return;
    }
    openTimezoneDropdown(pickerId);
  }

  function escapeHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function escapeRegExp(value) {
    return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function compactStatusLabel(value) {
    const text = String(value || "");
    if (text.length <= 72) return text;
    return `${text.slice(0, 48)}...${text.slice(-18)}`;
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
    if (window.innerWidth < 780) {
      $("#app").classList.remove("sidebar-open");
      $("#sidebarBackdrop").hidden = true;
      $("#sidebarToggle").setAttribute("aria-label", CallFlowI18n.t("openSidebar", state.settings.language || "es"));
    }
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
    settingsForm.linePrefixMode.value = settings.linePrefixMode || "hash";
    settingsForm.theme.value = settings.theme || "dark";
    settingsForm.clockFormat.value = settings.clockFormat || "24h";
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
      linePrefixMode: form.linePrefixMode ? form.linePrefixMode.value : state.settings.linePrefixMode || "hash",
      clockFormat: form.clockFormat ? form.clockFormat.value : state.settings.clockFormat || "24h",
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
      const form = timezonePickerForm(pickerId);
      const pickerState = timezonePickerState(pickerId);
      if (!form || !form.timezone || !pickerState) return;
      pickerState.selectedTimezoneValue = form.timezone.value || pickerState.selectedTimezoneValue || "local";
      pickerState.searchQuery = "";
      filterTimezoneOptions(pickerId, language);
      renderTimezonePicker(pickerId, language);
    });
  }

  function selectTimezone(pickerId, value) {
    const form = timezonePickerForm(pickerId);
    const pickerState = timezonePickerState(pickerId);
    pickerState.selectedTimezoneValue = value;
    pickerState.searchQuery = "";
    pickerState.isTimezoneDropdownOpen = false;
    pickerState.highlightedTimezoneIndex = -1;
    form.timezone.value = value;
    filterTimezoneOptions(pickerId, form.language.value);
    renderTimezonePicker(pickerId, form.language.value);
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
    const currentCallType = callType.value;
    callType.innerHTML = state.settings.callTypes
      .map((type) => `<option value="${escapeHtml(type)}">${escapeHtml(type)}</option>`)
      .join("");
    callType.disabled = !state.settings.callTypes.length;
    if (state.settings.callTypes.includes(currentCallType)) callType.value = currentCallType;
    else callType.value = "";

    renderStatusOptions(false);
  }

  function renderStatusOptions(open = true) {
    const input = $("#descriptionInput");
    const list = $("#statusOptions");
    if (!input || !list) return;
    const query = input.value.trim().toLowerCase();
    const options = state.settings.frequentStatuses.filter((status) =>
      String(status).toLowerCase().includes(query)
    );
    list.classList.toggle("open", open && options.length > 0);
    list.innerHTML = options
      .map(
        (status) => `
          <button type="button" class="status-option" data-status-option="${escapeHtml(status)}" title="${escapeHtml(status)}">
            <span>${escapeHtml(compactStatusLabel(status))}</span>
          </button>
        `
      )
      .join("");
  }

  function selectStatusOption(value) {
    const input = $("#descriptionInput");
    if (!input) return;
    input.value = value;
    renderStatusOptions(false);
    input.focus();
  }

  function renderDashboardInlineManagers() {
    const language = state.settings.language || "es";
    $("#dashboardCallTypeList").innerHTML = state.settings.callTypes.length
      ? state.settings.callTypes
          .map(
            (type) => `
              <span class="chip">
                ${escapeHtml(type)}
                <button type="button" data-remove-dashboard-call-type="${escapeHtml(type)}" aria-label="${CallFlowI18n.t("removeCallType", language)}">×</button>
              </span>
            `
          )
          .join("")
      : '<span class="muted">-</span>';
  }

  async function updateFrequentStatusesFromDashboard(statuses) {
    state.settings = normalizeSettings({
      ...state.settings,
      frequentStatuses: uniqueItems(statuses)
    });
    state.formLists.settingsFrequentStatuses = [...state.settings.frequentStatuses];
    state.formLists.onboardingFrequentStatuses = [...state.settings.frequentStatuses];
    await CallFlowStorage.write("settings", state.settings);
    applySettingsToForms();
    render();
  }

  async function addCurrentDashboardStatus() {
    const input = $("#callForm input[name='description']");
    const value = input.value.trim();
    if (!value) return;
    await updateFrequentStatusesFromDashboard([...state.settings.frequentStatuses, value]);
    input.focus();
  }

  async function removeCurrentDashboardStatus() {
    const input = $("#callForm input[name='description']");
    const value = input.value.trim();
    if (!value || !state.settings.frequentStatuses.includes(value)) return;
    const language = state.settings.language || "es";
    if (!window.confirm(CallFlowI18n.t("confirmRemoveStatus", language))) return;
    await updateFrequentStatusesFromDashboard(state.settings.frequentStatuses.filter((status) => status !== value));
    input.focus();
  }

  async function updateCallTypesFromDashboard(callTypes) {
    state.settings = normalizeSettings({
      ...state.settings,
      callTypes: uniqueItems(callTypes)
    });
    state.formLists.settingsCallTypes = [...state.settings.callTypes];
    state.formLists.onboardingCallTypes = [...state.settings.callTypes];
    await CallFlowStorage.write("settings", state.settings);
    applySettingsToForms();
    render();
  }

  async function addDashboardCallType() {
    const input = $("#newDashboardCallType");
    const value = input.value.trim();
    if (!value) return;
    await updateCallTypesFromDashboard([...state.settings.callTypes, value]);
    $("#callForm select[name='callType']").value = value;
    input.value = "";
    input.focus();
  }

  async function removeDashboardCallType(value) {
    const language = state.settings.language || "es";
    if (!window.confirm(CallFlowI18n.t("confirmRemoveCallType", language))) return;
    await updateCallTypesFromDashboard(state.settings.callTypes.filter((type) => type !== value));
  }

  function renderHeader() {
    const now = CallFlowReports.formatCallTimestamp(new Date(), state.settings);
    $("#currentBlockLabel").textContent = CallFlowReports.blockFromHour(now.hour);
    $("#operatorLabel").textContent = state.settings.operatorName || "Sin operador";
    renderWorkClock();
  }

  function formatWorkClock(date) {
    const timezone = CallFlowReports.resolveTimezone(state.settings);
    const format = state.settings.clockFormat || "24h";

    if (format === "military") {
      const parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: timezone,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
      }).formatToParts(date);
      const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
      return `${values.hour}${values.minute}${values.second}`;
    }

    return new Intl.DateTimeFormat(languageLocale(state.settings.language), {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: format === "12h"
    }).format(date);
  }

  function renderWorkClock() {
    const clock = $("#workClock");
    if (!clock || !state.settings) return;
    clock.textContent = formatWorkClock(new Date());
  }

  function startWorkClock() {
    if (state.clockTimer) clearInterval(state.clockTimer);
    renderWorkClock();
    renderShiftTimer();
    state.clockTimer = setInterval(() => {
      renderWorkClock();
      renderShiftTimer();
    }, 1000);
  }

  function formatDuration(ms) {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  }

  function currentWorkElapsed(now = Date.now()) {
    const timer = normalizeWorkTimer(state.workTimer);
    if (timer.status !== "working" || !timer.workStartedAt) return timer.workElapsedMs;
    return timer.workElapsedMs + Math.max(0, now - new Date(timer.workStartedAt).getTime());
  }

  function currentBreakElapsed(now = Date.now()) {
    const timer = normalizeWorkTimer(state.workTimer);
    if (timer.status !== "paused" || !timer.currentBreakStartedAt) return 0;
    return Math.max(0, now - new Date(timer.currentBreakStartedAt).getTime());
  }

  function renderShiftTimer() {
    const timer = normalizeWorkTimer(state.workTimer);
    const wrapper = $("#shiftTimer");
    const label = $("#shiftTimerLabel");
    const value = $("#shiftTimerValue");
    const button = $("#shiftTimerToggle");
    if (!wrapper || !label || !value || !button || !state.settings) return;

    const language = state.settings.language || "es";
    const paused = timer.status === "paused";
    const working = timer.status === "working";
    wrapper.classList.toggle("paused", paused);
    wrapper.classList.toggle("working", working);
    label.textContent = CallFlowI18n.t(paused ? "breakTimer" : "workTimer", language);
    value.textContent = formatDuration(paused ? currentBreakElapsed() : currentWorkElapsed());
    button.textContent = working ? "⏸" : "▶";
    button.setAttribute(
      "aria-label",
      CallFlowI18n.t(working ? "pauseWorkTimer" : timer.status === "paused" ? "resumeWorkTimer" : "startWorkTimer", language)
    );
    button.title = button.getAttribute("aria-label");
  }

  async function persistWorkTimer() {
    state.workTimer = normalizeWorkTimer(state.workTimer);
    await CallFlowStorage.write("workTimer", state.workTimer);
  }

  async function toggleShiftTimer() {
    const timer = normalizeWorkTimer(state.workTimer);
    const now = new Date();

    if (timer.status === "working") {
      timer.workElapsedMs = currentWorkElapsed(now.getTime());
      timer.workStartedAt = null;
      timer.currentBreakStartedAt = now.toISOString();
      timer.status = "paused";
    } else {
      if (timer.status === "paused" && timer.currentBreakStartedAt) {
        const startedAt = timer.currentBreakStartedAt;
        const durationMs = Math.max(0, now.getTime() - new Date(startedAt).getTime());
        timer.breaks = [...timer.breaks, { startedAt, endedAt: now.toISOString(), durationMs }];
      }
      timer.currentBreakStartedAt = null;
      timer.workStartedAt = now.toISOString();
      timer.status = "working";
    }

    state.workTimer = timer;
    await persistWorkTimer();
    renderShiftTimer();
  }

  function isoDateInSettings(date) {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: CallFlowReports.resolveTimezone(state.settings),
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
    const parts = Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value]));
    return `${parts.year}-${parts.month}-${parts.day}`;
  }

  function isoDateOffset(days) {
    return isoDateInSettings(new Date(Date.now() - days * 24 * 60 * 60 * 1000));
  }

  function compareIsoDate(a, b) {
    return String(a).localeCompare(String(b));
  }

  function displayIsoDate(isoDate) {
    const [year, month, day] = String(isoDate || "").split("-");
    return year && month && day ? `${day}.${month}.${year}` : isoDate;
  }

  function callIsoDate(call) {
    if (call.createdAt) return isoDateInSettings(new Date(call.createdAt));
    const [day, month] = String(call.date || "").split(".");
    const year = new Date().getFullYear();
    return day && month ? `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}` : isoDateOffset(0);
  }

  function reportRangeBounds() {
    if (state.reportRange.preset === "yesterday") {
      const date = isoDateOffset(1);
      return { from: date, to: date };
    }

    if (state.reportRange.preset === "last7") {
      return { from: isoDateOffset(6), to: isoDateOffset(0) };
    }

    if (state.reportRange.preset === "last30") {
      return { from: isoDateOffset(29), to: isoDateOffset(0) };
    }

    if (state.reportRange.preset === "custom") {
      const from = state.reportRange.from || isoDateOffset(0);
      const to = state.reportRange.to || from;
      return compareIsoDate(from, to) <= 0 ? { from, to } : { from: to, to: from };
    }

    const today = isoDateOffset(0);
    return { from: today, to: today };
  }

  function syncReportRangeInputs() {
    const preset = $("#reportRangePreset");
    const fromInput = $("#reportDateFrom");
    const toInput = $("#reportDateTo");
    if (!preset || !fromInput || !toInput) return;

    const range = reportRangeBounds();
    preset.value = state.reportRange.preset;
    fromInput.value = range.from;
    toInput.value = range.to;
  }

  function reportBlockKey(isoDate, block) {
    return `${isoDate}|${block}`;
  }

  function reportGroupsForRange() {
    const range = reportRangeBounds();
    const calls = CallFlowReports.ensureDailySequences(state.calls)
      .filter((call) => {
        const isoDate = callIsoDate(call);
        return compareIsoDate(isoDate, range.from) >= 0 && compareIsoDate(isoDate, range.to) <= 0;
      })
      .sort((a, b) => String(a.createdAt || "").localeCompare(String(b.createdAt || "")));

    return calls.reduce((groups, call) => {
      const isoDate = callIsoDate(call);
      const block = call.block || CallFlowReports.blockFromHour(call.hour || 0);
      groups[isoDate] = groups[isoDate] || {};
      groups[isoDate][block] = groups[isoDate][block] || [];
      groups[isoDate][block].push(call);
      return groups;
    }, {});
  }

  function reportBlockActions(key, isEditing) {
    const language = state.settings.language || "es";
    if (isEditing) {
      return `
        <button type="button" data-save-report-block="${escapeHtml(key)}" data-i18n="saveBlock">${CallFlowI18n.t("saveBlock", language)}</button>
        <button type="button" data-cancel-report-edit="${escapeHtml(key)}" data-i18n="cancel">${CallFlowI18n.t("cancel", language)}</button>
      `;
    }

    return `
      <button type="button" data-edit-report-block="${escapeHtml(key)}" data-i18n="editBlock">${CallFlowI18n.t("editBlock", language)}</button>
      <button type="button" class="danger ghost-danger" data-delete-report-block="${escapeHtml(key)}" data-i18n="deleteBlock">${CallFlowI18n.t("deleteBlock", language)}</button>
    `;
  }

  function highlightedReportText(text) {
    const query = state.reportSearch.query.trim();
    if (!query) return escapeHtml(text);

    const pattern = new RegExp(escapeRegExp(query), "gi");
    let cursor = 0;
    let html = "";
    let match;

    while ((match = pattern.exec(text)) !== null) {
      const matchIndex = state.reportSearch.matches;
      const active = matchIndex === state.reportSearch.activeIndex;
      html += escapeHtml(text.slice(cursor, match.index));
      html += `<mark class="report-match${active ? " active" : ""}" data-report-match="${matchIndex}">${escapeHtml(match[0])}</mark>`;
      cursor = match.index + match[0].length;
      state.reportSearch.matches += 1;

      if (match.index === pattern.lastIndex) pattern.lastIndex += 1;
    }

    return html + escapeHtml(text.slice(cursor));
  }

  function renderReportSearchStatus() {
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

  function scrollToActiveReportMatch() {
    const active = document.querySelector(".report-match.active");
    if (!active) return;
    active.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });
  }

  function moveReportSearch(step) {
    if (!state.reportSearch.matches) return;
    const total = state.reportSearch.matches;
    state.reportSearch.activeIndex = (state.reportSearch.activeIndex + step + total) % total;
    renderReportBlocks();
    scrollToActiveReportMatch();
  }

  function renderReportBlock(isoDate, block, calls) {
    const key = reportBlockKey(isoDate, block);
    const isEditing = state.editingReportBlockKey === key;
    const lines = calls.map((call) => CallFlowReports.buildCallLine(call, state.settings)).join("\n");

    return `
      <article class="report-item">
        <header class="report-block-header">
          <label class="report-block-check">
            <input type="checkbox" data-report-block="${escapeHtml(key)}" ${state.selectedBlocks.has(key) ? "checked" : ""} />
            <strong>${escapeHtml(block)}</strong>
          </label>
          <div class="report-actions">
            <span class="tag">${calls.length} llamadas</span>
            ${reportBlockActions(key, isEditing)}
          </div>
        </header>
        ${
          isEditing
            ? `<textarea class="report-editor" data-report-editor="${escapeHtml(key)}" rows="7">${escapeHtml(lines)}</textarea>`
            : `<code>${highlightedReportText(lines)}</code>`
        }
      </article>
    `;
  }

  function renderReportBlocks() {
    syncReportRangeInputs();
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
      : `<p class="muted">${escapeHtml(CallFlowI18n.t("noReportBlocks", state.settings.language || "es"))}</p>`;

    if (state.reportSearch.activeIndex >= state.reportSearch.matches) {
      state.reportSearch.activeIndex = Math.max(0, state.reportSearch.matches - 1);
    }
    renderReportSearchStatus();
  }

  function renderBlocks() {
    const todayCalls = CallFlowReports.ensureDailySequences(CallFlowReports.callsForToday(state.calls, state.settings));
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

    renderReportBlocks();
  }

  function statsCards(stats) {
    const base = [
      ["Total de llamadas", stats.total, ""],
      [state.settings.successLabel, stats.success, "success-metric"],
      [state.settings.rejectionLabel, stats.rejections, "rejection-metric"],
      ["Sin respuesta", stats.noAnswer, ""],
      ["Recordatorios pendientes", stats.pendingReminders, ""]
    ];

    const byType = Object.entries(stats.byType).map(([key, value]) => [`Tipo ${key}`, value, ""]);
    const byStatus = Object.entries(stats.statusCounts).map(([key, value]) => [key, value, ""]);
    return [...base, ...byType, ...byStatus]
      .map(
        ([label, value, className]) =>
          `<article class="card ${className}"><span class="muted">${escapeHtml(label)}</span><strong>${value}</strong></article>`
      )
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
    $("#lastFullLine").textContent = state.lastCall
      ? CallFlowReports.buildCallLine(state.lastCall, state.settings)
      : "-";
  }

  function render() {
    if (!state.settings) return;
    renderHeader();
    renderCallOptions();
    renderDashboardInlineManagers();
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
        customComment: form.customComment.value.trim(),
        dailySequence: CallFlowReports.callsForToday(state.calls, state.settings).length + 1
      },
      state.settings
    );

    state.calls.push(call);
    state.lastCall = call;
    await CallFlowStorage.write("calls", state.calls);

    if (submitter && ["saveCopy", "saveCopyReminder"].includes(submitter.dataset.action)) {
      await window.callflow.copyText(call.crmLine);
      $("#lastSavedLabel").textContent = CallFlowI18n.t("savedAndCopiedCrm", state.settings.language);
    } else {
      $("#lastSavedLabel").textContent = CallFlowI18n.t("saved", state.settings.language);
    }

    form.callId.value = "";
    form.description.value = "";
    form.customComment.value = "";
    form.callId.focus();
    render();

    if (submitter && submitter.dataset.action === "saveCopyReminder") {
      const reminderForm = $("#reminderForm");
      reminderForm.callId.value = call.callId;
      $("#lastSavedLabel").textContent = CallFlowI18n.t("savedCopiedReminder", state.settings.language);
      setView("reminders");
      reminderForm.date.focus();
    }
  }

  async function copyLastCrm() {
    if (!state.lastCall) return;
    await window.callflow.copyText(state.lastCall.crmLine);
    $("#lastSavedLabel").textContent = CallFlowI18n.t("lastCrmCopied", state.settings.language);
  }

  async function copySelectedBlocks() {
    const groupsByDate = reportGroupsForRange();
    const reports = [...state.selectedBlocks]
      .sort()
      .map((key) => {
        const [isoDate, block] = key.split("|");
        const calls = groupsByDate[isoDate] && groupsByDate[isoDate][block];
        return calls ? CallFlowReports.buildSupervisorReport(block, calls, state.settings) : "";
      })
      .filter(Boolean);

    if (reports.length) {
      await window.callflow.copyText(reports.join("\n\n"));
    }
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
      call.reportLineOverride = lines[index] || "";
      if (!call.reportLineOverride) delete call.reportLineOverride;
    });
    state.editingReportBlockKey = null;
    await CallFlowStorage.write("calls", state.calls);
    render();
  }

  async function deleteReportBlock(key) {
    const language = state.settings.language || "es";
    if (!window.confirm(CallFlowI18n.t("confirmDeleteBlock", language))) return;
    const ids = new Set(callsForReportBlockKey(key).map((call) => call.id));
    state.calls = state.calls.filter((call) => !ids.has(call.id));
    state.selectedBlocks.delete(key);
    if (state.editingReportBlockKey === key) state.editingReportBlockKey = null;
    await CallFlowStorage.write("calls", state.calls);
    render();
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
    $("#shiftTimerToggle").addEventListener("click", toggleShiftTimer);
    $("#sidebarToggle").addEventListener("click", () => {
      const app = $("#app");
      app.classList.toggle("sidebar-open");
      const open = app.classList.contains("sidebar-open");
      $("#sidebarToggle").setAttribute("aria-label", CallFlowI18n.t(open ? "closeSidebar" : "openSidebar", state.settings.language));
      $("#sidebarBackdrop").hidden = !open;
    });
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
    $("#copySelectedBlocks").addEventListener("click", copySelectedBlocks);
    $("#reportRangePreset").addEventListener("change", (event) => {
      state.reportRange.preset = event.target.value;
      state.selectedBlocks.clear();
      state.editingReportBlockKey = null;
      state.reportSearch.activeIndex = 0;
      render();
    });
    $("#reportDateFrom").addEventListener("change", (event) => {
      state.reportRange.preset = "custom";
      state.reportRange.from = event.target.value;
      state.selectedBlocks.clear();
      state.editingReportBlockKey = null;
      state.reportSearch.activeIndex = 0;
      render();
    });
    $("#reportDateTo").addEventListener("change", (event) => {
      state.reportRange.preset = "custom";
      state.reportRange.to = event.target.value;
      state.selectedBlocks.clear();
      state.editingReportBlockKey = null;
      state.reportSearch.activeIndex = 0;
      render();
    });
    $("#reportSearchInput").addEventListener("input", (event) => {
      state.reportSearch.query = event.target.value;
      state.reportSearch.activeIndex = 0;
      renderReportBlocks();
      scrollToActiveReportMatch();
    });
    $("#reportSearchInput").addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        moveReportSearch(event.shiftKey ? -1 : 1);
      }
      if (event.key === "Escape") {
        state.reportSearch.query = "";
        state.reportSearch.activeIndex = 0;
        renderReportBlocks();
      }
    });
    $("#reportSearchPrev").addEventListener("click", () => moveReportSearch(-1));
    $("#reportSearchNext").addEventListener("click", () => moveReportSearch(1));
    $("#reportSearchClear").addEventListener("click", () => {
      state.reportSearch.query = "";
      state.reportSearch.activeIndex = 0;
      renderReportBlocks();
      $("#reportSearchInput").focus();
    });
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
        openTimezoneDropdown(input.dataset.timezoneSearch);
      });
      input.addEventListener("input", () => {
        const pickerId = input.dataset.timezoneSearch;
        const pickerState = timezonePickerState(pickerId);
        pickerState.searchQuery = input.value;
        pickerState.isTimezoneDropdownOpen = true;
        pickerState.highlightedTimezoneIndex = 0;
        filterTimezoneOptions(pickerId, activeFormLanguage());
        renderTimezonePicker(pickerId, activeFormLanguage());
      });
      input.addEventListener("keydown", (event) => {
        const pickerId = input.dataset.timezoneSearch;
        const pickerState = timezonePickerState(pickerId);

        if (event.key === "ArrowDown") {
          event.preventDefault();
          if (!pickerState.isTimezoneDropdownOpen) {
            openTimezoneDropdown(pickerId);
            return;
          }
          const maxIndex = pickerState.filteredTimezoneOptions.length - 1;
          pickerState.highlightedTimezoneIndex =
            pickerState.highlightedTimezoneIndex < maxIndex ? pickerState.highlightedTimezoneIndex + 1 : 0;
          renderTimezonePicker(pickerId, activeFormLanguage());
        }

        if (event.key === "ArrowUp") {
          event.preventDefault();
          if (!pickerState.isTimezoneDropdownOpen) {
            openTimezoneDropdown(pickerId);
            return;
          }
          const maxIndex = pickerState.filteredTimezoneOptions.length - 1;
          pickerState.highlightedTimezoneIndex =
            pickerState.highlightedTimezoneIndex > 0 ? pickerState.highlightedTimezoneIndex - 1 : maxIndex;
          renderTimezonePicker(pickerId, activeFormLanguage());
        }

        if (event.key === "Enter" && pickerState.isTimezoneDropdownOpen) {
          const option = pickerState.filteredTimezoneOptions[pickerState.highlightedTimezoneIndex];
          if (option) {
            event.preventDefault();
            selectTimezone(pickerId, option.value);
          }
        }

        if (event.key === "Escape") {
          event.preventDefault();
          closeTimezoneDropdown(pickerId);
        }
      });
    });

    document.addEventListener("change", (event) => {
      if (event.target.matches("[data-report-block]")) {
        if (event.target.checked) state.selectedBlocks.add(event.target.dataset.reportBlock);
        else state.selectedBlocks.delete(event.target.dataset.reportBlock);
      }
    });

    document.addEventListener("click", (event) => {
      const sidebarToggle = event.target.closest("#sidebarToggle");
      const sidebarBackdrop = event.target.closest("#sidebarBackdrop");
      if (sidebarBackdrop) {
        $("#app").classList.remove("sidebar-open");
        $("#sidebarBackdrop").hidden = true;
      }
      if (sidebarToggle) return;
      const timezoneToggle = event.target.closest("[data-timezone-toggle]");
      const timezoneOption = event.target.closest("[data-timezone-picker-option]");
      const statusOption = event.target.closest("[data-status-option]");
      const addListId = event.target.dataset.addListItem;
      const removeListId = event.target.dataset.removeListItem;
      const presetListId = event.target.dataset.presetListItem;
      const dashboardCallTypeToRemove = event.target.dataset.removeDashboardCallType;
      const editReportBlockKey = event.target.dataset.editReportBlock;
      const saveReportBlockKey = event.target.dataset.saveReportBlock;
      const cancelReportEditKey = event.target.dataset.cancelReportEdit;
      const deleteReportBlockKey = event.target.dataset.deleteReportBlock;
      const timezoneToggleId = timezoneToggle ? timezoneToggle.dataset.timezoneToggle : null;
      const timezonePickerId = timezoneOption ? timezoneOption.dataset.timezonePickerOption : null;
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
      if (dashboardCallTypeToRemove) {
        removeDashboardCallType(dashboardCallTypeToRemove);
      }
      if (editReportBlockKey) {
        state.editingReportBlockKey = editReportBlockKey;
        renderReportBlocks();
      }
      if (saveReportBlockKey) {
        saveReportBlockEdit(saveReportBlockKey);
      }
      if (cancelReportEditKey) {
        state.editingReportBlockKey = null;
        renderReportBlocks();
      }
      if (deleteReportBlockKey) {
        deleteReportBlock(deleteReportBlockKey);
      }
      if (timezoneToggleId) {
        const input = document.querySelector(`[data-timezone-search="${timezoneToggleId}"]`);
        toggleTimezoneDropdown(timezoneToggleId);
        if (timezonePickerState(timezoneToggleId).isTimezoneDropdownOpen) input.focus();
      }
      if (timezonePickerId) {
        selectTimezone(timezonePickerId, timezoneOption.dataset.value);
      }
      if (statusOption) {
        selectStatusOption(statusOption.dataset.statusOption);
      }
      if (!event.target.closest(".status-combobox")) {
        renderStatusOptions(false);
      }
      if (!event.target.closest(".timezone-picker")) {
        closeTimezoneDropdown("onboarding");
        closeTimezoneDropdown("settings");
      }
      if (reminderId) completeReminder(reminderId);
      if (noteId) {
        state.selectedNoteId = noteId;
        renderNotes();
      }
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth >= 780) {
        $("#app").classList.remove("sidebar-open");
        $("#sidebarBackdrop").hidden = true;
        $("#sidebarToggle").setAttribute("aria-label", CallFlowI18n.t("openSidebar", state.settings.language));
      }
    });
  }

  async function init() {
    bindEvents();
    const data = await CallFlowStorage.readAll();
    Object.assign(state, data);
    state.settings = normalizeSettings(state.settings);
    state.workTimer = normalizeWorkTimer(state.workTimer);
    CallFlowI18n.applyI18n(state.settings.language);
    applySettingsToForms();
    const dataDir = await window.callflow.getDataDir();
    $("#dataDirLabel").textContent = dataDir;
    startWorkClock();

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
