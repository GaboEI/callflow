(function () {
  const state = window.CallFlowUiState.createInitialState();

  const presetStatusValues = new Set(Object.values(window.CallFlowSettings.presets).flatMap((preset) => preset.frequentStatuses));
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
  const timezoneCountries = Object.fromEntries(
    `
Europe/Andorra AD
Asia/Dubai AE
Asia/Kabul AF
America/Antigua AG
America/Anguilla AI
Europe/Tirane AL
Asia/Yerevan AM
Africa/Luanda AO
Antarctica/McMurdo AQ
Antarctica/Casey AQ
Antarctica/Davis AQ
Antarctica/DumontDUrville AQ
Antarctica/Mawson AQ
Antarctica/Palmer AQ
Antarctica/Rothera AQ
Antarctica/Syowa AQ
Antarctica/Troll AQ
Antarctica/Vostok AQ
America/Argentina/Buenos_Aires AR
America/Argentina/Cordoba AR
America/Argentina/Salta AR
America/Argentina/Jujuy AR
America/Argentina/Tucuman AR
America/Argentina/Catamarca AR
America/Argentina/La_Rioja AR
America/Argentina/San_Juan AR
America/Argentina/Mendoza AR
America/Argentina/San_Luis AR
America/Argentina/Rio_Gallegos AR
America/Argentina/Ushuaia AR
Pacific/Pago_Pago AS
Europe/Vienna AT
Australia/Lord_Howe AU
Antarctica/Macquarie AU
Australia/Hobart AU
Australia/Melbourne AU
Australia/Sydney AU
Australia/Broken_Hill AU
Australia/Brisbane AU
Australia/Lindeman AU
Australia/Adelaide AU
Australia/Darwin AU
Australia/Perth AU
Australia/Eucla AU
America/Aruba AW
Europe/Mariehamn AX
Asia/Baku AZ
Europe/Sarajevo BA
America/Barbados BB
Asia/Dhaka BD
Europe/Brussels BE
Africa/Ouagadougou BF
Europe/Sofia BG
Asia/Bahrain BH
Africa/Bujumbura BI
Africa/Porto-Novo BJ
America/St_Barthelemy BL
Atlantic/Bermuda BM
Asia/Brunei BN
America/La_Paz BO
America/Kralendijk BQ
America/Noronha BR
America/Belem BR
America/Fortaleza BR
America/Recife BR
America/Araguaina BR
America/Maceio BR
America/Bahia BR
America/Sao_Paulo BR
America/Campo_Grande BR
America/Cuiaba BR
America/Santarem BR
America/Porto_Velho BR
America/Boa_Vista BR
America/Manaus BR
America/Eirunepe BR
America/Rio_Branco BR
America/Nassau BS
Asia/Thimphu BT
Africa/Gaborone BW
Europe/Minsk BY
America/Belize BZ
America/St_Johns CA
America/Halifax CA
America/Glace_Bay CA
America/Moncton CA
America/Goose_Bay CA
America/Blanc-Sablon CA
America/Toronto CA
America/Iqaluit CA
America/Atikokan CA
America/Winnipeg CA
America/Resolute CA
America/Rankin_Inlet CA
America/Regina CA
America/Swift_Current CA
America/Edmonton CA
America/Cambridge_Bay CA
America/Inuvik CA
America/Vancouver CA
America/Creston CA
America/Dawson_Creek CA
America/Fort_Nelson CA
America/Whitehorse CA
America/Dawson CA
Indian/Cocos CC
Africa/Kinshasa CD
Africa/Lubumbashi CD
Africa/Bangui CF
Africa/Brazzaville CG
Europe/Zurich CH
Africa/Abidjan CI
Pacific/Rarotonga CK
America/Santiago CL
America/Coyhaique CL
America/Punta_Arenas CL
Pacific/Easter CL
Africa/Douala CM
Asia/Shanghai CN
Asia/Urumqi CN
America/Bogota CO
America/Costa_Rica CR
America/Havana CU
Atlantic/Cape_Verde CV
America/Curacao CW
Indian/Christmas CX
Asia/Nicosia CY
Asia/Famagusta CY
Europe/Prague CZ
Europe/Berlin DE
Europe/Busingen DE
Africa/Djibouti DJ
Europe/Copenhagen DK
America/Dominica DM
America/Santo_Domingo DO
Africa/Algiers DZ
America/Guayaquil EC
Pacific/Galapagos EC
Europe/Tallinn EE
Africa/Cairo EG
Africa/El_Aaiun EH
Africa/Asmara ER
Europe/Madrid ES
Africa/Ceuta ES
Atlantic/Canary ES
Africa/Addis_Ababa ET
Europe/Helsinki FI
Pacific/Fiji FJ
Atlantic/Stanley FK
Pacific/Chuuk FM
Pacific/Pohnpei FM
Pacific/Kosrae FM
Atlantic/Faroe FO
Europe/Paris FR
Africa/Libreville GA
Europe/London GB
America/Grenada GD
Asia/Tbilisi GE
America/Cayenne GF
Europe/Guernsey GG
Africa/Accra GH
Europe/Gibraltar GI
America/Nuuk GL
America/Danmarkshavn GL
America/Scoresbysund GL
America/Thule GL
Africa/Banjul GM
Africa/Conakry GN
America/Guadeloupe GP
Africa/Malabo GQ
Europe/Athens GR
Atlantic/South_Georgia GS
America/Guatemala GT
Pacific/Guam GU
Africa/Bissau GW
America/Guyana GY
Asia/Hong_Kong HK
America/Tegucigalpa HN
Europe/Zagreb HR
America/Port-au-Prince HT
Europe/Budapest HU
Asia/Jakarta ID
Asia/Pontianak ID
Asia/Makassar ID
Asia/Jayapura ID
Europe/Dublin IE
Asia/Jerusalem IL
Europe/Isle_of_Man IM
Asia/Kolkata IN
Indian/Chagos IO
Asia/Baghdad IQ
Asia/Tehran IR
Atlantic/Reykjavik IS
Europe/Rome IT
Europe/Jersey JE
America/Jamaica JM
Asia/Amman JO
Asia/Tokyo JP
Africa/Nairobi KE
Asia/Bishkek KG
Asia/Phnom_Penh KH
Pacific/Tarawa KI
Pacific/Kanton KI
Pacific/Kiritimati KI
Indian/Comoro KM
America/St_Kitts KN
Asia/Pyongyang KP
Asia/Seoul KR
Asia/Kuwait KW
America/Cayman KY
Asia/Almaty KZ
Asia/Qyzylorda KZ
Asia/Qostanay KZ
Asia/Aqtobe KZ
Asia/Aqtau KZ
Asia/Atyrau KZ
Asia/Oral KZ
Asia/Vientiane LA
Asia/Beirut LB
America/St_Lucia LC
Europe/Vaduz LI
Asia/Colombo LK
Africa/Monrovia LR
Africa/Maseru LS
Europe/Vilnius LT
Europe/Luxembourg LU
Europe/Riga LV
Africa/Tripoli LY
Africa/Casablanca MA
Europe/Monaco MC
Europe/Chisinau MD
Europe/Podgorica ME
America/Marigot MF
Indian/Antananarivo MG
Pacific/Majuro MH
Pacific/Kwajalein MH
Europe/Skopje MK
Africa/Bamako ML
Asia/Yangon MM
Asia/Ulaanbaatar MN
Asia/Hovd MN
Asia/Macau MO
Pacific/Saipan MP
America/Martinique MQ
Africa/Nouakchott MR
America/Montserrat MS
Europe/Malta MT
Indian/Mauritius MU
Indian/Maldives MV
Africa/Blantyre MW
America/Mexico_City MX
America/Cancun MX
America/Merida MX
America/Monterrey MX
America/Matamoros MX
America/Chihuahua MX
America/Ciudad_Juarez MX
America/Ojinaga MX
America/Mazatlan MX
America/Bahia_Banderas MX
America/Hermosillo MX
America/Tijuana MX
Asia/Kuala_Lumpur MY
Asia/Kuching MY
Africa/Maputo MZ
Africa/Windhoek NA
Pacific/Noumea NC
Africa/Niamey NE
Pacific/Norfolk NF
Africa/Lagos NG
America/Managua NI
Europe/Amsterdam NL
Europe/Oslo NO
Asia/Kathmandu NP
Pacific/Nauru NR
Pacific/Niue NU
Pacific/Auckland NZ
Pacific/Chatham NZ
Asia/Muscat OM
America/Panama PA
America/Lima PE
Pacific/Tahiti PF
Pacific/Marquesas PF
Pacific/Gambier PF
Pacific/Port_Moresby PG
Pacific/Bougainville PG
Asia/Manila PH
Asia/Karachi PK
Europe/Warsaw PL
America/Miquelon PM
Pacific/Pitcairn PN
America/Puerto_Rico PR
Asia/Gaza PS
Asia/Hebron PS
Europe/Lisbon PT
Atlantic/Madeira PT
Atlantic/Azores PT
Pacific/Palau PW
America/Asuncion PY
Asia/Qatar QA
Indian/Reunion RE
Europe/Bucharest RO
Europe/Belgrade RS
Europe/Kaliningrad RU
Europe/Moscow RU
Europe/Simferopol UA
Europe/Kirov RU
Europe/Volgograd RU
Europe/Astrakhan RU
Europe/Saratov RU
Europe/Ulyanovsk RU
Europe/Samara RU
Asia/Yekaterinburg RU
Asia/Omsk RU
Asia/Novosibirsk RU
Asia/Barnaul RU
Asia/Tomsk RU
Asia/Novokuznetsk RU
Asia/Krasnoyarsk RU
Asia/Irkutsk RU
Asia/Chita RU
Asia/Yakutsk RU
Asia/Khandyga RU
Asia/Vladivostok RU
Asia/Ust-Nera RU
Asia/Magadan RU
Asia/Sakhalin RU
Asia/Srednekolymsk RU
Asia/Kamchatka RU
Asia/Anadyr RU
Africa/Kigali RW
Asia/Riyadh SA
Pacific/Guadalcanal SB
Indian/Mahe SC
Africa/Khartoum SD
Europe/Stockholm SE
Asia/Singapore SG
Atlantic/St_Helena SH
Europe/Ljubljana SI
Arctic/Longyearbyen SJ
Europe/Bratislava SK
Africa/Freetown SL
Europe/San_Marino SM
Africa/Dakar SN
Africa/Mogadishu SO
America/Paramaribo SR
Africa/Juba SS
Africa/Sao_Tome ST
America/El_Salvador SV
America/Lower_Princes SX
Asia/Damascus SY
Africa/Mbabane SZ
America/Grand_Turk TC
Africa/Ndjamena TD
Indian/Kerguelen TF
Africa/Lome TG
Asia/Bangkok TH
Asia/Dushanbe TJ
Pacific/Fakaofo TK
Asia/Dili TL
Asia/Ashgabat TM
Africa/Tunis TN
Pacific/Tongatapu TO
Europe/Istanbul TR
America/Port_of_Spain TT
Pacific/Funafuti TV
Asia/Taipei TW
Africa/Dar_es_Salaam TZ
Europe/Kyiv UA
Africa/Kampala UG
Pacific/Midway UM
Pacific/Wake UM
America/New_York US
America/Detroit US
America/Kentucky/Louisville US
America/Kentucky/Monticello US
America/Indiana/Indianapolis US
America/Indiana/Vincennes US
America/Indiana/Winamac US
America/Indiana/Marengo US
America/Indiana/Petersburg US
America/Indiana/Vevay US
America/Chicago US
America/Indiana/Tell_City US
America/Indiana/Knox US
America/Menominee US
America/North_Dakota/Center US
America/North_Dakota/New_Salem US
America/North_Dakota/Beulah US
America/Denver US
America/Boise US
America/Phoenix US
America/Los_Angeles US
America/Anchorage US
America/Juneau US
America/Sitka US
America/Metlakatla US
America/Yakutat US
America/Nome US
America/Adak US
Pacific/Honolulu US
America/Montevideo UY
Asia/Samarkand UZ
Asia/Tashkent UZ
Europe/Vatican VA
America/St_Vincent VC
America/Caracas VE
America/Tortola VG
America/St_Thomas VI
Asia/Ho_Chi_Minh VN
Pacific/Efate VU
Pacific/Wallis WF
Pacific/Apia WS
Asia/Aden YE
Indian/Mayotte YT
Africa/Johannesburg ZA
Africa/Lusaka ZM
Africa/Harare ZW
`.trim().split("\n").map((line) => line.split(" "))
  );

  const { $, $$ } = window.CallFlowDom;
  const V = window.CallFlowValidators;
  const Settings = window.CallFlowSettings;
  const Timezones = window.CallFlowTimezones;
  const Markdown = window.CallFlowMarkdown;
  const Recurrence = window.CallFlowRecurrence;
  const Timers = window.CallFlowTimers;
  const defaultOutcomePresets = Settings.defaultOutcomePresets;
  const defaultRejectionLabel = Settings.defaultRejectionLabel;
  const defaultSuccessLabel = Settings.defaultSuccessLabel;
  const firstOrDefault = Settings.firstOrDefault;
  const addDaysIso = Recurrence.addDaysIso;
  const normalizeSettings = (settings) => Settings.normalizeSettings(settings, V);
  const normalizeWorkTimer = Timers.normalizeWorkTimer;
  const presetForLanguage = Settings.presetForLanguage;
  const uniqueItems = Settings.uniqueItems;
  const { runAction, setStatusMessage } = window.CallFlowActions.createActions({
    $,
    state,
    i18n: CallFlowI18n
  });

  function normalizeRuntimeData() {
    state.calls = V.normalizeCollection(state.calls, V.normalizeCall, state.settings);
    const callsBeforeTrashPurge = state.calls.length;
    const reportTrashCutoff = new Date();
    reportTrashCutoff.setDate(reportTrashCutoff.getDate() - 30);
    state.calls = state.calls.filter((call) => {
      if (call.reportDeletedAt) return new Date(call.reportDeletedAt) > reportTrashCutoff;
      return true;
    });
    state.callsNeedPersist = state.callsNeedPersist || state.calls.length !== callsBeforeTrashPurge;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    state.reminders = V.normalizeCollection(state.reminders, V.normalizeReminder, state.settings)
      .filter((reminder) => {
        if (reminder.status === "deleted" && reminder.deletedAt) {
          return new Date(reminder.deletedAt) > thirtyDaysAgo;
        }
        return true;
      });
    state.knowledgeBase = V.normalizeCollection(state.knowledgeBase, V.normalizeNote);
    state.workTimer = V.normalizeWorkTimer(state.workTimer);
    state.health = Array.isArray(state.health) ? state.health : [];
  }

  function freezeStaleTimerOnStartup() {
    const timer = normalizeWorkTimer(state.workTimer);
    if (timer.status === "working") {
      state.workTimer = {
        ...timer,
        status: "stopped",
        previousStatus: "working",
        workStartedAt: null,
        currentBreakStartedAt: null
      };
      return;
    }
    if (timer.status === "paused") {
      state.workTimer = {
        ...timer,
        status: "stopped",
        previousStatus: "paused",
        workStartedAt: null,
        currentBreakStartedAt: null
      };
    }
  }

  function showHealthNotice() {
    const recovered = state.health.find((event) => event.type && event.type.includes("corrupt-json"));
    if (!recovered) return;
    const file = recovered.file || "datos";
    const backup = recovered.backupFile || "backup";
    setStatusMessage(`Se recuperaron datos de ${file}. Backup: ${backup}`, "warning");
  }

  const languageLocale = Timezones.languageLocale;

  const escapeHtml = Markdown.escapeHtml;
  const escapeRegExp = Markdown.escapeRegExp;
  const timezonePicker = window.CallFlowTimezonePicker.createTimezonePicker({
    $,
    activeFormLanguage,
    escapeHtml,
    i18n: CallFlowI18n,
    state,
    timezones,
    timezonesCore: Timezones
  });
  const dateTimePicker = window.CallFlowDateTimePicker.createDateTimePicker({
    $,
    $$,
    activeTimezones,
    escapeHtml,
    localeForLanguage: languageLocale,
    state,
    validators: V
  });

  function compactStatusLabel(value) {
    const text = String(value || "");
    if (text.length <= 72) return text;
    return `${text.slice(0, 48)}...${text.slice(-18)}`;
  }

  const markdownPreview = Markdown.markdownPreview;
  const knowledgeView = window.CallFlowKnowledgeView.createKnowledgeView({
    $,
    escapeHtml,
    markdownPreview,
    renderApp: () => render(),
    runAction,
    setStatusMessage,
    state,
    validators: V
  });

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
    if (view === "reminders") remindersView.prepareFormDefaults();
  }

  function applySettingsToForms() {
    const settings = state.settings;
    const onboardingForm = $("#onboardingForm");
    onboardingForm.language.value = settings.language;
    onboardingForm.timezone.value = settings.timezone;
    onboardingForm.operatorName.value = settings.operatorName || "";
    state.formLists.onboardingCallTypes = [...settings.callTypes];
    state.formLists.onboardingFrequentStatuses = [...settings.frequentStatuses];
    state.formLists.onboardingSuccessOutcomes = [...settings.outcomePresets.success.items];
    state.formLists.onboardingRejectionOutcomes = [...settings.outcomePresets.rejection.items];
    state.formLists.onboardingCallbackOutcomes = [...settings.outcomePresets.callback.items];
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
    settingsForm.reportHeaderFormat.value = settings.reportHeaderFormat;
    settingsForm.linePrefixMode.value = settings.linePrefixMode || "hash";
    settingsForm.theme.value = settings.theme || "dark";
    settingsForm.clockFormat.value = settings.clockFormat || "24h";
    settingsForm.startOnLogin.checked = Boolean(settings.startOnLogin);
    settingsForm.runInBackground.checked = Boolean(settings.runInBackground);
    settingsForm.notifyAtExactTime.checked = settings.notifyAtExactTime !== false;
    settingsForm.notifyBeforeMinutes.value = String(settings.notifyBeforeMinutes || 0);
    settingsForm.reminderSound.value = settings.reminderSound || "soft";
    state.formLists.settingsCallTypes = [...settings.callTypes];
    state.formLists.settingsFrequentStatuses = [...settings.frequentStatuses];
    state.formLists.settingsSuccessOutcomes = [...settings.outcomePresets.success.items];
    state.formLists.settingsRejectionOutcomes = [...settings.outcomePresets.rejection.items];
    state.formLists.settingsCallbackOutcomes = [...settings.outcomePresets.callback.items];
    state.presetMeta.settingsFrequentStatuses.custom = [...settings.frequentStatuses];
    timezonePicker.renderAll(settings.language);
    settingsView.renderListEditors();
    settingsView.renderActiveTimezoneEditors();
  }

  function outcomePresetsFromForm(listPrefix) {
    const successItems = uniqueItems(state.formLists[`${listPrefix}SuccessOutcomes`]);
    const rejectionItems = uniqueItems(state.formLists[`${listPrefix}RejectionOutcomes`]);
    const callbackItems = uniqueItems(state.formLists[`${listPrefix}CallbackOutcomes`]);
    return {
      success: {
        default: firstOrDefault(successItems, ""),
        items: successItems
      },
      rejection: {
        default: firstOrDefault(rejectionItems, ""),
        items: rejectionItems
      },
      callback: {
        default: firstOrDefault(callbackItems, ""),
        items: callbackItems
      }
    };
  }

  function settingsFromForm(form, onboardingCompleted) {
    const listPrefix = form.id === "onboardingForm" ? "onboarding" : "settings";
    const language = form.language.value;
    const outcomePresets = outcomePresetsFromForm(listPrefix);
    return {
      ...state.settings,
      language,
      timezone: form.timezone.value,
      activeTimezones: uniqueItems([form.timezone.value, ...(state.settings.activeTimezones || [])]).slice(0, V.MAX_ACTIVE_TIMEZONES),
      pinnedClockTimezones: (state.settings.pinnedClockTimezones || []).filter((timezone) =>
        uniqueItems([form.timezone.value, ...(state.settings.activeTimezones || [])]).includes(timezone)
      ),
      lastReminderTimezone: state.settings.lastReminderTimezone,
      operatorName: form.operatorName.value.trim(),
      callTypes: [...state.formLists[`${listPrefix}CallTypes`]],
      frequentStatuses: [...state.formLists[`${listPrefix}FrequentStatuses`]],
      customComments: state.settings.customComments || [],
      successLabel: outcomePresets.success.default || defaultSuccessLabel(language),
      rejectionLabel: outcomePresets.rejection.default || defaultRejectionLabel(language),
      outcomePresets,
      reportHeaderFormat: form.reportHeaderFormat
        ? form.reportHeaderFormat.value
        : state.settings.reportHeaderFormat,
      linePrefixMode: form.linePrefixMode ? form.linePrefixMode.value : state.settings.linePrefixMode || "hash",
      clockFormat: form.clockFormat ? form.clockFormat.value : state.settings.clockFormat || "24h",
      startOnLogin: form.startOnLogin ? form.startOnLogin.checked : Boolean(state.settings.startOnLogin),
      runInBackground: form.runInBackground ? form.runInBackground.checked : Boolean(state.settings.runInBackground),
      notifyAtExactTime: form.notifyAtExactTime
        ? form.notifyAtExactTime.checked
        : state.settings.notifyAtExactTime !== false,
      notifyBeforeMinutes: form.notifyBeforeMinutes
        ? Number(form.notifyBeforeMinutes.value) || 0
        : Number(state.settings.notifyBeforeMinutes) || 0,
      reminderSound: form.reminderSound ? form.reminderSound.value : state.settings.reminderSound || "soft",
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

  function refreshPresetBackedStatuses(listId, language) {
    const meta = state.presetMeta[listId] || { custom: [] };
    state.formLists[listId] = uniqueItems([...presetForLanguage(language).selectedStatuses, ...meta.custom]);
  }

  function refreshOnboardingOutcomePresets(language) {
    const defaults = defaultOutcomePresets({
      language,
      successLabel: defaultSuccessLabel(language),
      rejectionLabel: defaultRejectionLabel(language)
    });
    state.formLists.onboardingSuccessOutcomes = [...defaults.success.items];
    state.formLists.onboardingRejectionOutcomes = [...defaults.rejection.items];
    state.formLists.onboardingCallbackOutcomes = [...defaults.callback.items];
  }

  function handleLanguageChange(form, language) {
    CallFlowI18n.applyI18n(language);
    timezonePicker.renderAll(language);
    settingsView.renderActiveTimezoneEditors();

    if (form.id === "onboardingForm" && !state.settings.onboardingCompleted) {
      refreshPresetBackedStatuses("onboardingFrequentStatuses", language);
      refreshOnboardingOutcomePresets(language);
    }

    settingsView.renderListEditors();
  }

  function shortTimezoneName(timezone) {
    if (timezone === "local") return "Local";
    const city = timezone.split("/").pop() || timezone;
    return city.replaceAll("_", " ");
  }

  function countryFlag(countryCode) {
    const normalized = String(countryCode || "").toUpperCase();
    if (!/^[A-Z]{2}$/.test(normalized)) return "🌐";
    return Array.from(normalized)
      .map((letter) => String.fromCodePoint(127397 + letter.charCodeAt(0)))
      .join("");
  }

  function timezoneFlag(timezone) {
    if (timezone === "local") return timezoneFlag(Intl.DateTimeFormat().resolvedOptions().timeZone);
    if (timezone === "UTC") return "🌐";
    return countryFlag(timezoneCountries[timezone]);
  }

  function activeTimezones() {
    return V.uniqueItems([state.settings.timezone || "local", ...(state.settings.activeTimezones || [])]).slice(0, V.MAX_ACTIVE_TIMEZONES);
  }

  const clockView = window.CallFlowClockView.createClockView({
    $,
    escapeHtml,
    i18n: CallFlowI18n,
    localeForLanguage: languageLocale,
    normalizeSettings,
    normalizeWorkTimer,
    runAction,
    shortTimezoneName,
    state,
    storage: CallFlowStorage,
    timers: Timers,
    timezoneFlag,
    validators: V
  });
  const settingsView = window.CallFlowSettingsView.createSettingsView({
    $$,
    activeFormLanguage,
    activeTimezones,
    applySettingsToForms,
    escapeHtml,
    i18n: CallFlowI18n,
    normalizeRuntimeData,
    normalizeSettings,
    presetForLanguage,
    presetStatusValues,
    renderApp: () => render(),
    runAction,
    setStatusMessage,
    shortTimezoneName,
    state,
    storage: CallFlowStorage,
    timezoneFlag,
    uniqueItems
  });
  const remindersView = window.CallFlowRemindersView.createRemindersView({
    $,
    activeTimezones,
    addDaysIso,
    currentDateInputValue,
    currentTimeInputValue,
    escapeHtml,
    i18n: CallFlowI18n,
    normalizeSettings,
    recurrence: Recurrence,
    renderApp: () => render(),
    renderReminderTimezoneSelectors,
    runAction,
    setStatusMessage,
    setView,
    state,
    storage: CallFlowStorage,
    timezoneFlag,
    validators: V
  });
  const reportsView = window.CallFlowReportsView.createReportsView({
    $$,
    $,
    activeCalls,
    callIsoDate,
    compareIsoDate,
    displayIsoDate,
    escapeHtml,
    escapeRegExp,
    i18n: CallFlowI18n,
    isoDateOffset,
    renderApp: () => render(),
    runAction,
    setStatusMessage,
    state,
    storage: CallFlowStorage
  });
  const dashboardView = window.CallFlowDashboardView.createDashboardView({
    $,
    activeCalls,
    activeTimezones,
    applySettingsToForms,
    compactStatusLabel,
    currentDateInputValue,
    currentTimeInputValue,
    escapeHtml,
    i18n: CallFlowI18n,
    normalizeSettings,
    renderApp: () => render(),
    renderReminderTimezoneSelectors,
    renderReportBlocks: reportsView.renderReportBlocks,
    reports: CallFlowReports,
    runAction,
    setStatusMessage,
    setView,
    state,
    stats: CallFlowStats,
    storage: CallFlowStorage,
    uniqueItems,
    validators: V
  });

  async function updateActiveTimezones(timezones, lastReminderTimezone = state.settings.lastReminderTimezone) {
    const zones = V.uniqueItems([state.settings.timezone || "local", ...timezones]).slice(0, V.MAX_ACTIVE_TIMEZONES);
    state.settings = normalizeSettings({
      ...state.settings,
      activeTimezones: zones,
      pinnedClockTimezones: (state.settings.pinnedClockTimezones || []).filter((timezone) => zones.includes(timezone)),
      lastReminderTimezone: zones.includes(lastReminderTimezone) ? lastReminderTimezone : zones[0]
    });
    await runAction(async () => {
      await CallFlowStorage.write("settings", state.settings);
      applySettingsToForms();
      render();
    });
  }

  async function addActiveTimezoneFromPicker(pickerId) {
    const pickerState = timezonePicker.pickerState(pickerId);
    const value = pickerState.selectedTimezoneValue || timezonePicker.form(pickerId).timezone.value || "local";
    await updateActiveTimezones([...activeTimezones(), value], value);
  }

  async function removeActiveTimezone(value) {
    await updateActiveTimezones(activeTimezones().filter((timezone) => timezone !== value));
  }

  function currentDateInputValue(timezone = state.settings || "local") {
    return V.isoDateInTimezone(new Date(), timezone);
  }

  function currentTimeInputValue(timezone = state.settings || "local") {
    return V.timeInTimezone(new Date(), timezone);
  }

  function renderReminderTimezoneSelectors() {
    if (!state.settings) return;
    const zones = activeTimezones();
    const last = zones.includes(state.settings.lastReminderTimezone) ? state.settings.lastReminderTimezone : zones[0] || state.settings.timezone || "local";
    [
      { field: $("#reminderTimezoneField"), select: $("#reminderForm select[name='timezone']") },
      { field: $("#callbackTimezoneField"), select: $("#callForm select[name='callbackTimezone']") }
    ].forEach(({ field, select }) => {
      if (!field || !select) return;
      const current = select.value || last;
      field.classList.toggle("hidden", zones.length <= 1);
      select.innerHTML = zones
        .map((timezone) => `<option value="${escapeHtml(timezone)}">${escapeHtml(`${timezoneFlag(timezone)} ${shortTimezoneName(timezone)}`)}</option>`)
        .join("");
      select.value = zones.includes(current) ? current : last;
    });
  }

  function renderHeader() {
    const now = CallFlowReports.formatCallTimestamp(new Date(), state.settings);
    $("#currentBlockLabel").textContent = CallFlowReports.blockFromHour(now.hour);
    $("#operatorLabel").textContent = state.settings.operatorName || "Sin operador";
    clockView.renderWorkClock();
  }

  function isoDateInSettings(date) {
    return V.isoDateInTimezone(date, state.settings);
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

  function activeCalls() {
    return state.calls.filter((call) => !call.reportDeletedAt);
  }

  function render() {
    if (!state.settings) return;
    renderHeader();
    dashboardView.render();
    settingsView.render();
    remindersView.render();
    knowledgeView.render();
    clockView.render();
    dateTimePicker.enhanceInputs();
  }

  function handleDocumentChange(event) {
    if (event.target.closest("#dateTimePicker")) {
      dateTimePicker.handleChange(event);
      return;
    }
    reportsView.handleDocumentChange(event);
  }

  function handleDocumentFocusIn(event) {
    if (event.target.matches("input[type='date'], input[type='time']")) {
      dateTimePicker.enhanceInputs();
      dateTimePicker.open(event.target);
    }
  }

  function handleDocumentClick(event) {
    const picker = event.target.closest("#dateTimePicker");
    if (picker) {
      dateTimePicker.handleClick(event);
      return;
    }
    if (!event.target.closest(".cf-datetime-input")) {
      dateTimePicker.close();
    }
    const sidebarToggle = event.target.closest("#sidebarToggle");
    const sidebarBackdrop = event.target.closest("#sidebarBackdrop");
    if (sidebarBackdrop) {
      $("#app").classList.remove("sidebar-open");
      $("#sidebarBackdrop").hidden = true;
    }
    if (sidebarToggle) return;
    const timezoneToggle = event.target.closest("[data-timezone-toggle]");
    const timezoneOption = event.target.closest("[data-timezone-picker-option]");
    const addListId = event.target.dataset.addListItem;
    const removeListId = event.target.dataset.removeListItem;
    const presetListId = event.target.dataset.presetListItem;
    const timezoneToggleId = timezoneToggle ? timezoneToggle.dataset.timezoneToggle : null;
    const timezonePickerId = timezoneOption ? timezoneOption.dataset.timezonePickerOption : null;
    const addActiveTimezonePicker = event.target.dataset.addActiveTimezone;
    const removeActiveTimezoneValue = event.target.dataset.removeActiveTimezone;
    const togglePinnedClockButton = event.target.closest("[data-toggle-pinned-clock]");
    const togglePinnedClockValue = togglePinnedClockButton ? togglePinnedClockButton.dataset.togglePinnedClock : null;
    const noteId = event.target.dataset.selectNote;
    if (addListId) {
      settingsView.addListItem(addListId, document.querySelector(`[data-list-input="${addListId}"]`).value);
    }
    if (removeListId) {
      settingsView.removeListItem(removeListId, event.target.dataset.value);
    }
    if (presetListId) {
      settingsView.addListItem(presetListId, event.target.dataset.value);
    }
    dashboardView.handleDocumentClick(event);
    reportsView.handleDocumentClick(event);
    if (timezoneToggleId) {
      const input = document.querySelector(`[data-timezone-search="${timezoneToggleId}"]`);
      timezonePicker.toggle(timezoneToggleId);
      if (timezonePicker.pickerState(timezoneToggleId).isTimezoneDropdownOpen) input.focus();
    }
    if (timezonePickerId) {
      timezonePicker.select(timezonePickerId, timezoneOption.dataset.value);
    }
    if (!event.target.closest(".timezone-picker")) {
      timezonePicker.close("onboarding");
      timezonePicker.close("settings");
    }
    remindersView.handleDocumentClick(event);
    if (addActiveTimezonePicker) addActiveTimezoneFromPicker(addActiveTimezonePicker);
    if (removeActiveTimezoneValue) removeActiveTimezone(removeActiveTimezoneValue);
    if (togglePinnedClockValue) clockView.togglePinnedClock(togglePinnedClockValue);
    clockView.closePanelIfOutside(event.target);
    if (noteId) {
      knowledgeView.selectNote(noteId);
    }
  }

  function handleWindowResize() {
    dateTimePicker.position();
    if (window.innerWidth >= 780) {
      $("#app").classList.remove("sidebar-open");
      $("#sidebarBackdrop").hidden = true;
      $("#sidebarToggle").setAttribute("aria-label", CallFlowI18n.t("openSidebar", state.settings.language));
    }
  }

  function handleGlobalKeydown(event) {
    dateTimePicker.handleGlobalKeydown(event);
  }

  function bindEvents() {
    dateTimePicker.enhanceInputs();
    $$(".nav-link").forEach((button) => button.addEventListener("click", () => setView(button.dataset.view)));
    $("#onboardingForm").addEventListener("submit", async (event) => {
      event.preventDefault();
      await runAction(async () => {
        await saveSettings(settingsFromForm(event.currentTarget, true));
        $("#onboarding").classList.add("hidden");
        $("#app").classList.remove("hidden");
      });
    });
    $("#onboardingForm select[name='language']").addEventListener("change", (event) => {
      handleLanguageChange($("#onboardingForm"), event.target.value);
    });

    $("#settingsForm").addEventListener("submit", async (event) => {
      event.preventDefault();
      await runAction(() => saveSettings(settingsFromForm(event.currentTarget, true)));
    });
    $("#settingsForm select[name='language']").addEventListener("change", (event) => {
      handleLanguageChange($("#settingsForm"), event.target.value);
    });
    dashboardView.bindEvents();
    clockView.bindEvents();
    $("#sidebarToggle").addEventListener("click", () => {
      const app = $("#app");
      app.classList.toggle("sidebar-open");
      const open = app.classList.contains("sidebar-open");
      $("#sidebarToggle").setAttribute("aria-label", CallFlowI18n.t(open ? "closeSidebar" : "openSidebar", state.settings.language));
      $("#sidebarBackdrop").hidden = !open;
    });
    reportsView.bindEvents();
    remindersView.bindEvents();
    knowledgeView.bindEvents();
    settingsView.bindEvents();
    $$("[data-list-input]").forEach((input) => {
      input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          settingsView.addListItem(input.dataset.listInput, input.value);
        }
      });
    });
    $$("[data-timezone-search]").forEach((input) => {
      input.addEventListener("focus", () => {
        timezonePicker.open(input.dataset.timezoneSearch);
      });
      input.addEventListener("input", () => {
        timezonePicker.handleSearchInput(input);
      });
      input.addEventListener("keydown", timezonePicker.handleSearchKeydown);
    });

    document.addEventListener("change", handleDocumentChange);
    document.addEventListener("focusin", handleDocumentFocusIn);
    document.addEventListener("click", handleDocumentClick);

    window.addEventListener("resize", handleWindowResize);
    window.addEventListener("scroll", dateTimePicker.position, true);
    document.addEventListener("keydown", handleGlobalKeydown);
    window.addEventListener("beforeunload", () => {
      clockView.freezeAndPersistTimerOnUnload();
    });
  }

  async function init() {
    bindEvents();
    window.callflow.onReminderSound(remindersView.playReminderSound);
    window.callflow.onReminderAlarm(remindersView.handleAlarm);
    window.callflow.onOpenReminder(remindersView.openFromNotification);
    const data = await CallFlowStorage.readAll();
    Object.assign(state, data);
    state.settings = normalizeSettings(state.settings);
    normalizeRuntimeData();
    freezeStaleTimerOnStartup();
    await clockView.persistWorkTimer();
    if (state.callsNeedPersist) {
      await CallFlowStorage.write("calls", state.calls);
      state.callsNeedPersist = false;
    }
    await CallFlowStorage.write("reminders", state.reminders);
    CallFlowI18n.applyI18n(state.settings.language);
    applySettingsToForms();
    const dataDir = await window.callflow.getDataDir();
    $("#dataDirLabel").textContent = dataDir;
    clockView.startClock();
    state.reminderTimer = setInterval(remindersView.renderReminders, 1000);
    remindersView.prepareFormDefaults();
    showHealthNotice();

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
