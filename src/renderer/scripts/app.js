(function () {
  const state = {
    settings: null,
    calls: [],
    reminders: [],
    reminderFormCollapsed: false,
    activeAlarmReminderId: null,
    activeAlarmPhase: null,
    activeAlarmSoundKey: null,
    alarmSoundTimer: null,
    knowledgeBase: [],
    health: [],
    workTimer: null,
    clockTimer: null,
    timerPersistTimer: null,
    reminderTimer: null,
    selectedNoteId: null,
    editingReminderId: null,
    lastCall: null,
    pendingCallCapturedAt: null,
    selectedPrimaryOutcome: null,
    openOutcomeMenu: null,
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
      onboardingSuccessOutcomes: [],
      onboardingRejectionOutcomes: [],
      onboardingCallbackOutcomes: [],
      settingsCallTypes: [],
      settingsFrequentStatuses: [],
      settingsSuccessOutcomes: [],
      settingsRejectionOutcomes: [],
      settingsCallbackOutcomes: []
    },
    presetMeta: {
      onboardingFrequentStatuses: { custom: [] },
      settingsFrequentStatuses: { custom: [] }
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

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));
  const V = window.CallFlowValidators;

  function defaultWorkTimer() {
    return {
      status: "idle",
      previousStatus: null,
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
      return value
        .filter((item) => item !== null && item !== undefined)
        .map((item) => String(item).trim())
        .filter(Boolean);
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

  function defaultCallbackLabel(language) {
    return { es: "Rellamada", en: "Callback", ru: "Повторный_звонок" }[language] || "Rellamada";
  }

  function rejectionPresetsForLanguage(language) {
    return {
      es: ["Rechazo", "No_interesado", "Precio_alto", "No_tiene_dinero", "No_autoriza"],
      en: ["Rejected", "Not_interested", "Price_too_high", "No_money", "Not_authorized"],
      ru: ["Отказ", "Не_интересно", "Высокая_цена", "Нет_денег", "Не_разрешает"]
    }[language] || ["Rechazo", "No_interesado", "Precio_alto", "No_tiene_dinero"];
  }

  function defaultOutcomePresets(settings) {
    const language = settings.language || "es";
    const successItems = uniqueItems([settings.successLabel, ...presetForLanguage(language).successLabels]);
    const rejectionItems = uniqueItems([settings.rejectionLabel, ...rejectionPresetsForLanguage(language)]);
    const callbackLabel = defaultCallbackLabel(language);
    return {
      success: {
        default: settings.successLabel || defaultSuccessLabel(language),
        items: successItems
      },
      rejection: {
        default: settings.rejectionLabel || defaultRejectionLabel(language),
        items: rejectionItems
      },
      callback: {
        default: callbackLabel,
        items: [callbackLabel]
      }
    };
  }

  function firstOrDefault(items, fallback) {
    return uniqueItems(items)[0] || fallback || "";
  }

  function normalizeOutcomePresets(settings) {
    const defaults = defaultOutcomePresets(settings);
    const existing = settings.outcomePresets || {};
    return ["success", "rejection", "callback"].reduce((result, category) => {
      const hasStoredCategory = Object.prototype.hasOwnProperty.call(existing, category);
      const current = hasStoredCategory ? existing[category] || {} : {};
      const hasStoredItems = Array.isArray(current.items);
      const items = uniqueItems(hasStoredItems ? current.items : defaults[category].items || []);
      const fallbackDefault = hasStoredCategory
        ? current.default || items[0] || ""
        : defaults[category].default || items[0] || "";
      result[category] = {
        default: items.includes(fallbackDefault) ? fallbackDefault : items[0] || fallbackDefault,
        items
      };
      return result;
    }, {});
  }

  function normalizeSettings(settings) {
    const sanitized = V.normalizeSettings(settings);
    const normalized = {
      ...sanitized,
      ...settings,
      language: sanitized.language,
      timezone: sanitized.timezone,
      activeTimezones: sanitized.activeTimezones,
      pinnedClockTimezones: sanitized.pinnedClockTimezones,
      lastReminderTimezone: sanitized.lastReminderTimezone,
      callTypes: sanitized.callTypes,
      frequentStatuses: sanitized.frequentStatuses,
      successLabel: sanitized.successLabel || defaultSuccessLabel(sanitized.language),
      rejectionLabel: sanitized.rejectionLabel || defaultRejectionLabel(sanitized.language),
      outcomePresets: normalizeOutcomePresets(sanitized),
      linePrefixMode: sanitized.linePrefixMode,
      clockFormat: sanitized.clockFormat,
      startOnLogin: sanitized.startOnLogin,
      runInBackground: sanitized.runInBackground,
      notifyBeforeMinutes: sanitized.notifyBeforeMinutes,
      notifyAtExactTime: sanitized.notifyAtExactTime,
      reminderSound: sanitized.reminderSound,
      theme: sanitized.theme,
      onboardingCompleted: sanitized.onboardingCompleted
    };

    if (!normalized.onboardingCompleted && !normalized.frequentStatuses.length) {
      normalized.frequentStatuses = [...presetForLanguage(normalized.language).selectedStatuses];
    }

    delete normalized.callStatuses;
    return normalized;
  }

  function normalizeRuntimeData() {
    state.calls = V.normalizeCollection(state.calls, V.normalizeCall, state.settings);
    state.reminders = V.normalizeCollection(state.reminders, V.normalizeReminder, state.settings);
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

  function setStatusMessage(message, tone = "info") {
    const target = $("#lastSavedLabel");
    if (target) target.textContent = message || "";
    const notice = $("#systemNotice");
    if (!notice) return;
    const showNotice = message && ["warning", "error"].includes(tone);
    notice.textContent = showNotice ? message : "";
    notice.classList.toggle("hidden", !showNotice);
    notice.dataset.tone = tone;
  }

  function showHealthNotice() {
    const recovered = state.health.find((event) => event.type && event.type.includes("corrupt-json"));
    if (!recovered) return;
    const file = recovered.file || "datos";
    const backup = recovered.backupFile || "backup";
    setStatusMessage(`Se recuperaron datos de ${file}. Backup: ${backup}`, "warning");
  }

  async function runAction(action, options = {}) {
    try {
      return await action();
    } catch (error) {
      console.error(options.logMessage || "CallFlow action failed", error);
      setStatusMessage(options.userMessage || CallFlowI18n.t("actionFailed", state.settings?.language || "es"), "error");
      return null;
    }
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
    if (view === "reminders") prepareReminderFormDefaults();
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
    renderTimezonePickers(settings.language);
    renderListEditors();
    renderActiveTimezoneEditors();
  }

  function outcomePresetsFromForm(listPrefix, language) {
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
    const outcomePresets = outcomePresetsFromForm(listPrefix, language);
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
    renderTimezonePickers(language);
    renderActiveTimezoneEditors();

    if (form.id === "onboardingForm" && !state.settings.onboardingCompleted) {
      refreshPresetBackedStatuses("onboardingFrequentStatuses", language);
      refreshOnboardingOutcomePresets(language);
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

  function pinnedClockTimezones() {
    const zones = activeTimezones();
    return (state.settings.pinnedClockTimezones || []).filter((timezone) => zones.includes(timezone));
  }

  function renderActiveTimezoneEditors() {
    ["onboarding", "settings"].forEach((pickerId) => {
      const output = document.querySelector(`[data-active-timezones-output="${pickerId}"]`);
      if (!output || !state.settings) return;
      const zones = activeTimezones();
      output.innerHTML = zones
        .map(
          (timezone, index) => `
            <span class="chip timezone-chip">
              ${escapeHtml(timezoneFlag(timezone))} ${escapeHtml(shortTimezoneName(timezone))}
              ${
                index === 0
                  ? ""
                  : `<button type="button" data-remove-active-timezone="${escapeHtml(timezone)}" aria-label="${escapeHtml(CallFlowI18n.t("remove", activeFormLanguage()))}">×</button>`
              }
            </span>
          `
        )
        .join("");
    });
  }

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
    const pickerState = timezonePickerState(pickerId);
    const value = pickerState.selectedTimezoneValue || timezonePickerForm(pickerId).timezone.value || "local";
    await updateActiveTimezones([...activeTimezones(), value], value);
  }

  async function removeActiveTimezone(value) {
    await updateActiveTimezones(activeTimezones().filter((timezone) => timezone !== value));
  }

  async function updatePinnedClockTimezones(timezones) {
    const zones = activeTimezones();
    state.settings = normalizeSettings({
      ...state.settings,
      pinnedClockTimezones: V.uniqueItems(timezones).filter((timezone) => zones.includes(timezone))
    });
    await runAction(async () => {
      await CallFlowStorage.write("settings", state.settings);
      renderWorkClock();
    });
  }

  async function togglePinnedClock(timezone) {
    const pinned = pinnedClockTimezones();
    await updatePinnedClockTimezones(
      pinned.includes(timezone) ? pinned.filter((item) => item !== timezone) : [...pinned, timezone]
    );
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

  function mostUsedOutcomeLabel(category) {
    const counts = state.calls.reduce((result, call) => {
      if (!call.primaryOutcome || call.primaryOutcome.category !== category || !call.primaryOutcome.label) return result;
      result[call.primaryOutcome.label] = (result[call.primaryOutcome.label] || 0) + 1;
      return result;
    }, {});
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || "";
  }

  function defaultOutcomeLabel(category) {
    const presetsForCategory = state.settings.outcomePresets[category] || { items: [] };
    return mostUsedOutcomeLabel(category) || presetsForCategory.default || presetsForCategory.items[0] || "";
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

  function currentDateInputValue(timezone = state.settings || "local") {
    return V.isoDateInTimezone(new Date(), timezone);
  }

  function currentTimeInputValue(timezone = state.settings || "local") {
    return V.timeInTimezone(new Date(), timezone);
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
      await CallFlowStorage.write("settings", state.settings);
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
    if (!window.confirm(CallFlowI18n.t("confirmRemoveOutcome", language))) return;
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
                <button type="button" class="outcome-remove" data-remove-outcome="${category}" data-value="${escapeHtml(item)}" title="${CallFlowI18n.t("removeOutcome", language)}">×</button>
              </div>
            `
          )
          .join("")}
      </div>
      <div class="outcome-menu-actions">
        <input data-new-outcome="${category}" placeholder="${escapeHtml(CallFlowI18n.t("newOutcome", language))}" />
        <button type="button" data-add-outcome="${category}">${escapeHtml(CallFlowI18n.t("addOutcome", language))}</button>
      </div>
      <button type="button" class="outcome-clear" data-clear-outcome>${escapeHtml(CallFlowI18n.t("clearOutcome", language))}</button>
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
    await runAction(async () => {
      await CallFlowStorage.write("settings", state.settings);
      applySettingsToForms();
      render();
    });
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
    await runAction(async () => {
      await CallFlowStorage.write("settings", state.settings);
      applySettingsToForms();
      render();
    });
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
    const now = new Date();
    const pinned = pinnedClockTimezones();
    clock.innerHTML = pinned.length
      ? pinned
      .map((timezone) => {
        const flag = timezoneFlag(timezone);
        const label = shortTimezoneName(timezone);
        const value = formatWorkClockForTimezone(now, timezone);
        return `<span class="clock-chip" title="${escapeHtml(timezone)}"><small><span class="clock-flag">${escapeHtml(flag)}</span><span>${escapeHtml(label)}</span></small><strong>${escapeHtml(value)}</strong></span>`;
      })
          .join("")
      : `<span class="clock-empty">${escapeHtml(CallFlowI18n.t("noPinnedClocks", state.settings.language || "es"))}</span>`;
    renderClockPanel(now);
  }

  function renderClockPanel(now = new Date()) {
    const panel = $("#clockPanel");
    const toggle = $("#clockPanelToggle");
    if (!panel || !toggle || !state.settings) return;
    const pinned = new Set(pinnedClockTimezones());
    const zones = activeTimezones();
    toggle.textContent = zones.length > 1 ? `${pinned.size}/${zones.length} ⌄` : "⌄";
    panel.innerHTML = `
      <header>
        <strong>${escapeHtml(CallFlowI18n.t("allClocks", state.settings.language || "es"))}</strong>
      </header>
      <div class="clock-panel-list">
        ${zones
          .map((timezone) => {
            const isPinned = pinned.has(timezone);
            return `
              <button type="button" class="clock-panel-item${isPinned ? " pinned" : ""}" data-toggle-pinned-clock="${escapeHtml(timezone)}" title="${escapeHtml(CallFlowI18n.t(isPinned ? "unpinClock" : "pinClock", state.settings.language || "es"))}">
                <span>${escapeHtml(`${timezoneFlag(timezone)} ${shortTimezoneName(timezone)}`)}</span>
                <strong>${escapeHtml(formatWorkClockForTimezone(now, timezone))}</strong>
                <small aria-hidden="true">📌</small>
              </button>
            `;
          })
          .join("")}
      </div>
    `;
  }

  function formatWorkClockForTimezone(date, timezone) {
    const format = state.settings.clockFormat || "24h";

    if (format === "military") {
      const parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: V.resolveTimezone(timezone),
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
      }).formatToParts(date);
      const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
      return `${values.hour}${values.minute}${values.second}`;
    }

    return new Intl.DateTimeFormat(languageLocale(state.settings.language), {
      timeZone: V.resolveTimezone(timezone),
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: format === "12h"
    }).format(date);
  }

  function renderCapturedCallTime() {
    const label = $("#capturedCallTimeLabel");
    if (!label || !state.settings) return;

    if (!state.pendingCallCapturedAt) {
      label.textContent = "";
      return;
    }

    const stamp = CallFlowReports.formatCallTimestamp(new Date(state.pendingCallCapturedAt), state.settings);
    label.textContent = `${CallFlowI18n.t("capturedCallTime", state.settings.language || "es")}: ${stamp.date} ${stamp.time}`;
  }

  function startWorkClock() {
    if (state.clockTimer) clearInterval(state.clockTimer);
    if (state.timerPersistTimer) clearInterval(state.timerPersistTimer);
    renderWorkClock();
    renderShiftTimer();
    state.clockTimer = setInterval(() => {
      renderWorkClock();
      renderShiftTimer();
    }, 1000);
    state.timerPersistTimer = setInterval(() => {
      persistActiveTimerSnapshot().catch((error) => console.error("Timer snapshot failed", error));
    }, 10000);
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
    const stopButton = $("#shiftTimerStop");
    if (!wrapper || !label || !value || !button || !stopButton || !state.settings) return;

    const language = state.settings.language || "es";
    const paused = timer.status === "paused";
    const working = timer.status === "working";
    const stopped = timer.status === "stopped";
    wrapper.classList.toggle("paused", paused);
    wrapper.classList.toggle("working", working);
    wrapper.classList.toggle("stopped", stopped);
    label.textContent = CallFlowI18n.t(stopped ? "totalPauseTimer" : paused ? "breakTimer" : "workTimer", language);
    value.textContent = formatDuration(paused ? currentBreakElapsed() : currentWorkElapsed());
    button.textContent = working ? "⏸" : "▶";
    button.setAttribute(
      "aria-label",
      CallFlowI18n.t(
        working ? "pauseWorkTimer" : timer.status === "paused" || stopped ? "resumeWorkTimer" : "startWorkTimer",
        language
      )
    );
    button.title = button.getAttribute("aria-label");
    stopButton.disabled = stopped || timer.status === "idle";
    stopButton.setAttribute("aria-label", CallFlowI18n.t("pauseAllTimer", language));
    stopButton.title = stopButton.getAttribute("aria-label");
  }

  async function persistWorkTimer() {
    state.workTimer = normalizeWorkTimer(state.workTimer);
    await CallFlowStorage.write("workTimer", state.workTimer);
  }

  async function persistActiveTimerSnapshot() {
    const timer = normalizeWorkTimer(state.workTimer);
    const now = new Date();
    if (timer.status === "working" && timer.workStartedAt) {
      state.workTimer = {
        ...timer,
        workElapsedMs: currentWorkElapsed(now.getTime()),
        workStartedAt: now.toISOString()
      };
      await persistWorkTimer();
    } else if (timer.status === "paused" && timer.currentBreakStartedAt) {
      state.workTimer = timer;
      await persistWorkTimer();
    }
  }

  async function toggleShiftTimer() {
    const timer = normalizeWorkTimer(state.workTimer);
    const now = new Date();

    if (timer.status === "working") {
      timer.workElapsedMs = currentWorkElapsed(now.getTime());
      timer.workStartedAt = null;
      timer.currentBreakStartedAt = now.toISOString();
      timer.status = "paused";
      timer.previousStatus = "working";
    } else {
      if (timer.status === "paused" && timer.currentBreakStartedAt) {
        const startedAt = timer.currentBreakStartedAt;
        const durationMs = Math.max(0, now.getTime() - new Date(startedAt).getTime());
        timer.breaks = [...timer.breaks, { startedAt, endedAt: now.toISOString(), durationMs }];
      }
      timer.currentBreakStartedAt = null;
      timer.workStartedAt = now.toISOString();
      timer.status = timer.status === "stopped" && timer.previousStatus === "paused" ? "paused" : "working";
      if (timer.status === "paused") {
        timer.workStartedAt = null;
        timer.currentBreakStartedAt = now.toISOString();
      }
      timer.previousStatus = null;
    }

    state.workTimer = timer;
    await persistWorkTimer();
    renderShiftTimer();
  }

  function freezeWorkTimer(timer, now = new Date()) {
    const normalized = normalizeWorkTimer(timer);
    if (normalized.status === "working" && normalized.workStartedAt) {
      normalized.workElapsedMs = currentWorkElapsed(now.getTime());
      normalized.workStartedAt = null;
      normalized.previousStatus = "working";
    } else if (normalized.status === "paused" && normalized.currentBreakStartedAt) {
      const startedAt = normalized.currentBreakStartedAt;
      const durationMs = Math.max(0, now.getTime() - new Date(startedAt).getTime());
      normalized.breaks = [...normalized.breaks, { startedAt, endedAt: now.toISOString(), durationMs }];
      normalized.currentBreakStartedAt = null;
      normalized.previousStatus = "paused";
    } else if (!normalized.previousStatus) {
      normalized.previousStatus = null;
    }
    normalized.status = "stopped";
    return normalized;
  }

  async function stopShiftTimer() {
    const timer = normalizeWorkTimer(state.workTimer);
    if (timer.status === "idle" || timer.status === "stopped") return;
    state.workTimer = freezeWorkTimer(timer);
    await persistWorkTimer();
    renderShiftTimer();
  }

  async function freezeAndPersistTimerOnUnload() {
    const timer = normalizeWorkTimer(state.workTimer);
    if (!["working", "paused"].includes(timer.status)) return;
    state.workTimer = freezeWorkTimer(timer);
    await persistWorkTimer();
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
    const counts = entries.map(([, calls]) => calls.length);
    const maxCount = counts.length ? Math.max(...counts) : 0;
    const minCount = counts.length ? Math.min(...counts) : 0;
    const shouldMarkBest = entries.length > 2;
    const shouldMarkWorst = entries.length > 3 && minCount < maxCount;

    $("#hourBlocks").innerHTML = entries.length
      ? entries
          .map(([block, calls]) => {
            const best = shouldMarkBest && calls.length === maxCount;
            const worst = shouldMarkWorst && calls.length === minCount;
            return `
            <article class="block-item compact-hour-block${best ? " best-block" : ""}${worst ? " worst-block" : ""}">
              <strong>${block}</strong>
              <span class="muted">${calls.length} llamadas</span>
            </article>
          `;
          })
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
    const todayCalls = CallFlowReports.callsForToday(state.calls, state.settings);
    const stats = CallFlowStats.buildStats(todayCalls, state.reminders, state.settings);
    $("#dashboardStats").innerHTML = statsCards(stats);
    $("#statsCards").innerHTML = statsCards(stats);
  }

  function reminderDueDate(reminder) {
    return V.reminderDueDate(reminder, state.settings) || new Date(8640000000000000);
  }

  function sortedReminders(reminders) {
    return [...reminders].sort((a, b) => {
      const dueDiff = reminderDueDate(a) - reminderDueDate(b);
      if (dueDiff !== 0) return dueDiff;
      return String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
    });
  }

  function compactDuration(ms) {
    const units = [
      ["mes", "meses", 30 * 24 * 60 * 60 * 1000],
      ["sem", "sems", 7 * 24 * 60 * 60 * 1000],
      ["d", "d", 24 * 60 * 60 * 1000],
      ["h", "h", 60 * 60 * 1000],
      ["min", "min", 60 * 1000],
      ["s", "s", 1000]
    ];
    let remaining = Math.max(0, Math.floor(ms));
    const parts = [];
    for (const [singular, plural, size] of units) {
      const value = Math.floor(remaining / size);
      if (!value && parts.length === 0 && size > 60 * 1000) continue;
      if (value || parts.length) {
        parts.push(`${value}${value === 1 ? singular : plural}`);
        remaining -= value * size;
      }
      if (parts.length >= 2) break;
    }
    return parts.length ? parts.join(" ") : "0s";
  }

  function reminderCountdownLabel(reminder) {
    if (reminder.status === "completed") return "Completado";
    const due = reminderDueDate(reminder);
    const diff = due - new Date();
    if (diff < 0) return `Vencido hace ${compactDuration(Math.abs(diff))}`;
    return `Faltan ${compactDuration(diff)}`;
  }

  function reminderStatusKey(reminder) {
    if (!V.reminderDueDate(reminder, state.settings) && reminder.status !== "completed") return "invalid";
    if (reminder.status === "completed") return "completed";
    if (reminder.status === "overdue") return "overdue";
    if (reminder.status === "invalid") return "invalid";
    return "pending";
  }

  function reminderStatusLabel(reminder) {
    const key = reminderStatusKey(reminder);
    const labels = {
      completed: CallFlowI18n.t("reminderCompleted", state.settings.language || "es"),
      overdue: CallFlowI18n.t("reminderOverdue", state.settings.language || "es"),
      invalid: CallFlowI18n.t("reminderInvalid", state.settings.language || "es"),
      pending: CallFlowI18n.t("reminderPending", state.settings.language || "es")
    };
    return labels[key];
  }

  function reminderRepeatLabel(reminder) {
    const repeat = reminder.repeat || "once";
    const labels = {
      once: CallFlowI18n.t("repeatOnce", state.settings.language || "es"),
      daily: CallFlowI18n.t("repeatDaily", state.settings.language || "es"),
      weekdays: CallFlowI18n.t("repeatWeekdays", state.settings.language || "es"),
      weekly: CallFlowI18n.t("repeatWeekly", state.settings.language || "es"),
      monthly: CallFlowI18n.t("repeatMonthly", state.settings.language || "es")
    };
    return labels[repeat] || labels.once;
  }

  function reminderTimezoneLabel(reminder) {
    const timezone = reminder.timezone || V.resolveTimezone(state.settings);
    return `${timezoneFlag(timezone)} ${timezone}`;
  }

  function renderReminders() {
    const filter = $("#reminderFilter").value;
    const reminders = sortedReminders(CallFlowReminders.filterReminders(state.reminders, filter, state.settings));
    $("#reminderList").innerHTML = reminders.length
      ? reminders
          .map((reminder) => `
            <article class="list-item reminder-item reminder-${reminderStatusKey(reminder)}">
              <div class="reminder-main">
                <p class="reminder-title">${escapeHtml(reminder.note)}</p>
                <div class="reminder-details">
                  <span>${escapeHtml(reminder.date)} ${escapeHtml(reminder.time)}</span>
                  <span class="reminder-timezone">${escapeHtml(reminderTimezoneLabel(reminder))}</span>
                  <span>${escapeHtml(reminderRepeatLabel(reminder))}</span>
                </div>
              </div>
              <div class="reminder-meta">
                <span class="reminder-state">${escapeHtml(reminderStatusLabel(reminder))}</span>
                <span class="reminder-countdown">${escapeHtml(reminderCountdownLabel(reminder))}</span>
              </div>
              ${
                reminder.callId
                  ? `<div class="reminder-id-row">
                      <span class="reminder-id" title="${escapeHtml(reminder.callId)}">ID: ${escapeHtml(reminder.callId)}</span>
                      <button type="button" class="icon-button" data-copy-reminder-call-id="${escapeHtml(reminder.callId)}" title="${escapeHtml(CallFlowI18n.t("copyCallId", state.settings.language || "es"))}">⇩</button>
                    </div>`
                  : ""
              }
              <div class="reminder-actions">
                <button type="button" class="icon-button" data-edit-reminder="${reminder.id}" title="${escapeHtml(CallFlowI18n.t("editReminder", state.settings.language || "es"))}">✎</button>
                ${
                  reminderStatusKey(reminder) === "completed"
                    ? `<span class="tag reminder-completed-label">${escapeHtml(CallFlowI18n.t("reminderCompleted", state.settings.language || "es"))}</span>`
                    : `<button type="button" data-complete-reminder="${reminder.id}">${escapeHtml(CallFlowI18n.t("completeReminder", state.settings.language || "es"))}</button>`
                }
              </div>
            </article>
          `)
          .join("")
      : '<p class="muted">No hay recordatorios en esta vista.</p>';
  }

  function prepareReminderFormDefaults() {
    const form = $("#reminderForm");
    if (!form) return;
    if (state.editingReminderId) return;
    const dashboardCallId = $("#callForm input[name='callId']")?.value.trim();
    const lastCallId = state.lastCall?.callId || "";
    if (!form.callId.value && (dashboardCallId || lastCallId)) {
      form.callId.value = dashboardCallId || lastCallId;
    }
    renderReminderTimezoneSelectors();
    if (form.timezone && !form.timezone.value) {
      form.timezone.value = state.settings.lastReminderTimezone || activeTimezones()[0] || state.settings.timezone;
    }
    const timezone = form.timezone?.value || state.settings.lastReminderTimezone || activeTimezones()[0] || state.settings.timezone;
    if (!form.date.value) form.date.value = currentDateInputValue(timezone);
    if (!form.time.value) form.time.value = currentTimeInputValue(timezone);
    if (!form.repeat.value) form.repeat.value = "once";
  }

  function cancelReminderEdit() {
    state.editingReminderId = null;
    const form = $("#reminderForm");
    form.reset();
    $("#cancelReminderEdit").classList.add("hidden");
    $("#saveReminderButton").textContent = CallFlowI18n.t("saveReminder", state.settings.language || "es");
    prepareReminderFormDefaults();
  }

  function renderReminderFormVisibility() {
    const panel = $("#reminderCreatePanel");
    const showButton = $("#showReminderForm");
    const toggleButton = $("#toggleReminderForm");
    if (!panel || !showButton || !toggleButton) return;
    panel.classList.toggle("hidden", state.reminderFormCollapsed);
    showButton.classList.toggle("hidden", !state.reminderFormCollapsed);
    toggleButton.textContent = "▴";
    toggleButton.title = CallFlowI18n.t("hide", state.settings?.language || "es");
    toggleButton.setAttribute("aria-label", CallFlowI18n.t("hide", state.settings?.language || "es"));
  }

  function setReminderFormCollapsed(collapsed) {
    state.reminderFormCollapsed = collapsed;
    renderReminderFormVisibility();
    if (!collapsed) prepareReminderFormDefaults();
  }

  function editReminder(id) {
    const reminder = state.reminders.find((item) => item.id === id);
    if (!reminder) return;
    setReminderFormCollapsed(false);
    state.editingReminderId = id;
    const form = $("#reminderForm");
    form.callId.value = reminder.callId || "";
    form.date.value = reminder.date || currentDateInputValue();
    form.time.value = reminder.time || currentTimeInputValue();
    form.repeat.value = reminder.repeat || "once";
    form.note.value = reminder.note || "";
    $("#cancelReminderEdit").classList.remove("hidden");
    $("#saveReminderButton").textContent = CallFlowI18n.t("updateReminder", state.settings.language || "es");
    form.callId.focus();
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
      const latest = [...state.calls].sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")))[0];
      state.lastCall = latest || null;
    }
    $("#lastFullLine").textContent = state.lastCall
      ? CallFlowReports.buildCallLine(state.lastCall, state.settings)
      : "-";
  }

  function render() {
    if (!state.settings) return;
    renderHeader();
    renderCapturedCallTime();
    renderCallOptions();
    renderOutcomeControls();
    renderDashboardInlineManagers();
    renderActiveTimezoneEditors();
    renderListEditors();
    renderBlocks();
    renderStats();
    renderReminders();
    renderReminderFormVisibility();
    renderNotes();
    renderLastCall();
  }

  async function saveCall(event) {
    event.preventDefault();
    const submitter = event.submitter;
    const form = event.currentTarget;
    const primaryOutcome = currentPrimaryOutcomePayload();
    const validation = V.validateCallForm({ callId: form.callId.value });
    if (!validation.ok) {
      setStatusMessage(CallFlowI18n.t(validation.messageKey, state.settings.language || "es"), "error");
      return;
    }
    if (
      primaryOutcome &&
      primaryOutcome.category === "callback" &&
      (!V.validIsoDate(primaryOutcome.callbackDate) || !V.validTime(primaryOutcome.callbackTime) || !primaryOutcome.dueAt)
    ) {
      $("#lastSavedLabel").textContent = CallFlowI18n.t("selectCallbackDateTime", state.settings.language || "es");
      return;
    }

    const call = CallFlowReports.createCallRecord(
      {
        callId: validation.value.callId,
        callType: form.callType.value,
        primaryOutcome,
        description: form.description.value.trim(),
        customComment: form.customComment.value.trim(),
        capturedAt: state.pendingCallCapturedAt,
        dailySequence: CallFlowReports.callsForToday(state.calls, state.settings).length + 1
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
        await CallFlowStorage.write("calls", nextCalls);
        if (primaryOutcome && primaryOutcome.category === "callback") {
          await CallFlowStorage.write("reminders", nextReminders);
          state.settings = normalizeSettings({ ...state.settings, lastReminderTimezone: primaryOutcome.timezone });
          await CallFlowStorage.write("settings", state.settings);
        }
        if (submitter && ["saveCopy", "saveCopyReminder"].includes(submitter.dataset.action)) {
          await window.callflow.copyText(call.crmLine);
          setStatusMessage(CallFlowI18n.t("savedAndCopiedCrm", state.settings.language), "success");
        } else {
          setStatusMessage(CallFlowI18n.t("saved", state.settings.language), "success");
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
        render();

        if (submitter && submitter.dataset.action === "saveCopyReminder") {
          const reminderForm = $("#reminderForm");
          reminderForm.callId.value = call.callId;
          setStatusMessage(CallFlowI18n.t("savedCopiedReminder", state.settings.language), "success");
          setView("reminders");
          reminderForm.date.focus();
        }
      },
      { userMessage: CallFlowI18n.t("saveFailed", state.settings.language || "es"), logMessage: "Failed to save call" }
    );
  }

  async function copyLastCrm() {
    if (!state.lastCall) return;
    await runAction(async () => {
      await window.callflow.copyText(state.lastCall.crmLine);
      setStatusMessage(CallFlowI18n.t("lastCrmCopied", state.settings.language), "success");
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
      await runAction(async () => {
        await window.callflow.copyText(reports.join("\n\n"));
        setStatusMessage(CallFlowI18n.t("copied", state.settings.language || "es"), "success");
      });
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
      if (index >= lines.length) return;
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
    const existingReminder = state.reminders.find((reminder) => reminder.id === state.editingReminderId);
    const reminderTimezone = existingReminder?.timezone || form.timezone?.value || state.settings.lastReminderTimezone || activeTimezones()[0] || V.resolveTimezone(state.settings);
    const validation = V.validateReminderPayload({
      callId: form.callId.value.trim(),
      date: form.date.value,
      time: form.time.value,
      repeat: form.repeat.value || "once",
      note: form.note.value.trim(),
      timezone: reminderTimezone
    });
    if (!validation.ok) {
      setStatusMessage(CallFlowI18n.t(validation.messageKey, state.settings.language || "es"), "error");
      return;
    }
    const reminderPayload = validation.value;
    let nextReminders;
    if (state.editingReminderId) {
      nextReminders = state.reminders.map((reminder) =>
        reminder.id === state.editingReminderId
          ? { ...reminder, ...reminderPayload, updatedAt: new Date().toISOString() }
          : reminder
      );
    } else {
      nextReminders = [...state.reminders, {
        id: crypto.randomUUID(),
        ...reminderPayload,
        status: "pending",
        createdAt: new Date().toISOString()
      }];
    }
    await runAction(
      async () => {
        await CallFlowStorage.write("reminders", nextReminders);
        if (!existingReminder) {
          state.settings = normalizeSettings({ ...state.settings, lastReminderTimezone: reminderPayload.timezone });
          await CallFlowStorage.write("settings", state.settings);
        }
        state.reminders = nextReminders;
        state.editingReminderId = null;
        $("#cancelReminderEdit").classList.add("hidden");
        $("#saveReminderButton").textContent = CallFlowI18n.t("saveReminder", state.settings.language || "es");
        form.reset();
        prepareReminderFormDefaults();
        render();
        setStatusMessage(CallFlowI18n.t("reminderSaved", state.settings.language || "es"), "success");
      },
      { userMessage: CallFlowI18n.t("saveFailed", state.settings.language || "es"), logMessage: "Failed to save reminder" }
    );
  }

  async function copyReminderCallId(callId) {
    if (!callId) return;
    await runAction(() => window.callflow.copyText(callId));
  }

  function isoDateValue(date) {
    return V.isoDateInTimezone(date, state.settings || "local");
  }

  function setReminderDateShortcut(shortcut) {
    const form = $("#reminderForm");
    const timezone = form.timezone?.value || state.settings.lastReminderTimezone || activeTimezones()[0] || state.settings.timezone;
    let date = V.isoDateInTimezone(new Date(), timezone);
    if (shortcut === "tomorrow") date = addDaysIso(date, 1);
    if (shortcut === "nextWeek") date = addDaysIso(date, 7);
    form.date.value = date;
    form.time.focus();
  }

  function playTone(audioContext, frequency, start, duration, type = "sine", gainValue = 0.08) {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(gainValue, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  }

  function playReminderSound(sound) {
    if (sound === "none") return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const audioContext = new AudioContext();
    const now = audioContext.currentTime;
    const patterns = {
      soft: [[660, 0, 0.16, "sine"], [880, 0.18, 0.18, "sine"]],
      ping: [[1046, 0, 0.12, "triangle"]],
      bell: [[784, 0, 0.16, "sine"], [1175, 0.1, 0.22, "sine"], [1568, 0.18, 0.28, "sine"]],
      alert: [[523, 0, 0.16, "square"], [523, 0.22, 0.16, "square"], [523, 0.44, 0.2, "square"]],
      chime: [[523, 0, 0.14, "triangle"], [659, 0.12, 0.14, "triangle"], [784, 0.24, 0.22, "triangle"]]
    };
    (patterns[sound] || patterns.soft).forEach(([frequency, offset, duration, type]) => {
      playTone(audioContext, frequency, now + offset, duration, type);
    });
    setTimeout(() => audioContext.close(), 1200);
  }

  function stopAlarmSound() {
    if (state.alarmSoundTimer) {
      clearInterval(state.alarmSoundTimer);
      state.alarmSoundTimer = null;
    }
    state.activeAlarmSoundKey = null;
  }

  function startAlarmSound(sound, reminderId, phase) {
    const soundKey = `${reminderId}:${phase}:${sound}`;
    if (state.activeAlarmSoundKey === soundKey) return;
    stopAlarmSound();
    state.activeAlarmSoundKey = soundKey;
    if (sound === "none") return;
    playReminderSound(sound);
    state.alarmSoundTimer = setInterval(() => playReminderSound(sound), 8000);
  }

  function activeAlarmReminder() {
    return state.reminders.find((reminder) => reminder.id === state.activeAlarmReminderId) || null;
  }

  function alarmPhaseLabel(phase) {
    if (phase === "early") return CallFlowI18n.t("alarmEarly", state.settings.language || "es");
    if (phase === "overdue") return CallFlowI18n.t("alarmOverdue", state.settings.language || "es");
    return CallFlowI18n.t("alarmNow", state.settings.language || "es");
  }

  function renderReminderAlarm() {
    const overlay = $("#reminderAlarmOverlay");
    if (!overlay) return;
    const reminder = activeAlarmReminder();
    if (!reminder || reminder.status === "completed") {
      overlay.classList.add("hidden");
      stopAlarmSound();
      return;
    }
    overlay.classList.remove("hidden");
    $("#reminderAlarmPhase").textContent = alarmPhaseLabel(state.activeAlarmPhase);
    $("#reminderAlarmTitle").textContent = CallFlowI18n.t("alarmTitle", state.settings.language || "es");
    $("#reminderAlarmMeta").textContent = [
      reminder.date,
      reminder.time,
      reminder.timezone || V.resolveTimezone(state.settings),
      reminder.callId ? `ID: ${reminder.callId}` : ""
    ]
      .filter(Boolean)
      .join(" - ");
    $("#reminderAlarmNote").textContent = reminder.note || "";
  }

  function clearReminderAlarm() {
    state.activeAlarmReminderId = null;
    state.activeAlarmPhase = null;
    $("#reminderAlarmOverlay").classList.add("hidden");
    stopAlarmSound();
  }

  function handleReminderAlarm(payload) {
    if (!payload || !payload.reminder || !payload.reminder.id) return;
    const current = state.reminders.find((reminder) => reminder.id === payload.reminder.id);
    if (!current || current.status === "completed") return;
    state.reminders = state.reminders.map((reminder) =>
      reminder.id === payload.reminder.id ? { ...reminder, ...payload.reminder } : reminder
    );
    state.activeAlarmReminderId = payload.reminder.id;
    state.activeAlarmPhase = payload.phase || "exact";
    renderReminderAlarm();
    startAlarmSound(state.settings.reminderSound || "soft", payload.reminder.id, state.activeAlarmPhase);
  }

  async function updateReminderSuppression(id, fields) {
    const nextReminders = state.reminders.map((reminder) =>
      reminder.id === id ? { ...reminder, ...fields, updatedAt: new Date().toISOString() } : reminder
    );
    await runAction(async () => {
      await CallFlowStorage.write("reminders", nextReminders);
      state.reminders = nextReminders;
      clearReminderAlarm();
      render();
    });
  }

  async function snoozeActiveAlarm(minutes) {
    const reminder = activeAlarmReminder();
    if (!reminder) return;
    await updateReminderSuppression(reminder.id, {
      snoozedUntil: new Date(Date.now() + minutes * 60 * 1000).toISOString(),
      mutedUntil: null
    });
  }

  async function muteActiveAlarm(minutes) {
    const reminder = activeAlarmReminder();
    if (!reminder) return;
    await updateReminderSuppression(reminder.id, {
      mutedUntil: new Date(Date.now() + minutes * 60 * 1000).toISOString()
    });
  }

  async function completeActiveAlarm() {
    const reminder = activeAlarmReminder();
    if (!reminder) return;
    clearReminderAlarm();
    await completeReminder(reminder.id);
  }

  function openReminderFromNotification(reminderId) {
    setView("reminders");
    if (reminderId) editReminder(reminderId);
  }

  function addDaysIso(isoDate, days) {
    const [year, month, day] = isoDate.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day + days));
    return date.toISOString().slice(0, 10);
  }

  function isoWeekday(isoDate) {
    const [year, month, day] = isoDate.split("-").map(Number);
    return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  }

  function addOneMonthClampedIso(isoDate) {
    const [year, month, day] = isoDate.split("-").map(Number);
    const target = new Date(Date.UTC(year, month, 1));
    const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
    target.setUTCDate(Math.min(day, lastDay));
    return target.toISOString().slice(0, 10);
  }

  function nextRecurringReminder(reminder) {
    const repeat = reminder.repeat || "once";
    if (repeat === "once") return null;
    const timezone = reminder.timezone || V.resolveTimezone(state.settings);
    let nextDate = reminder.date;
    let nextDueAt = V.zonedDateTimeToUtc(nextDate, reminder.time, timezone);
    if (!nextDueAt) return null;
    const now = new Date();
    do {
      if (repeat === "daily") {
        nextDate = addDaysIso(nextDate, 1);
      } else if (repeat === "weekdays") {
        nextDate = addDaysIso(nextDate, 1);
        while (isoWeekday(nextDate) === 0 || isoWeekday(nextDate) === 6) {
          nextDate = addDaysIso(nextDate, 1);
        }
      } else if (repeat === "weekly") {
        nextDate = addDaysIso(nextDate, 7);
      } else if (repeat === "monthly") {
        nextDate = addOneMonthClampedIso(nextDate);
      } else {
        return null;
      }
      nextDueAt = V.zonedDateTimeToUtc(nextDate, reminder.time, timezone);
    } while (nextDueAt && nextDueAt <= now);
    if (!nextDueAt) return null;
    return {
      ...reminder,
      id: crypto.randomUUID(),
      date: nextDate,
      time: reminder.time,
      timezone,
      dueAt: nextDueAt.toISOString(),
      status: "pending",
      createdAt: new Date().toISOString(),
      previousReminderId: reminder.id,
      completedAt: undefined,
      updatedAt: undefined
    };
  }

  async function completeReminder(id) {
    const current = state.reminders.find((reminder) => reminder.id === id);
    const next = current ? nextRecurringReminder(current) : null;
    if (state.activeAlarmReminderId === id) clearReminderAlarm();
    const nextReminders = state.reminders.map((reminder) =>
      reminder.id === id ? { ...reminder, status: "completed", completedAt: new Date().toISOString() } : reminder
    );
    if (next) nextReminders.push(next);
    await runAction(async () => {
      await CallFlowStorage.write("reminders", nextReminders);
      state.reminders = nextReminders;
      render();
    });
  }

  async function saveNote(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const validation = V.validateNotePayload({ title: form.title.value, content: form.content.value });
    if (!validation.ok) {
      setStatusMessage(CallFlowI18n.t(validation.messageKey, state.settings.language || "es"), "error");
      return;
    }
    const existing = state.knowledgeBase.find((note) => note.id === state.selectedNoteId);
    let nextKnowledgeBase;
    let nextSelectedNoteId = state.selectedNoteId;
    if (existing) {
      nextKnowledgeBase = state.knowledgeBase.map((note) =>
        note.id === state.selectedNoteId
          ? { ...note, title: validation.value.title, content: validation.value.content, updatedAt: new Date().toISOString() }
          : note
      );
    } else {
      const note = {
        id: crypto.randomUUID(),
        title: validation.value.title,
        content: validation.value.content,
        createdAt: new Date().toISOString()
      };
      nextKnowledgeBase = [...state.knowledgeBase, note];
      nextSelectedNoteId = note.id;
    }
    await runAction(async () => {
      await CallFlowStorage.write("knowledgeBase", nextKnowledgeBase);
      state.knowledgeBase = nextKnowledgeBase;
      state.selectedNoteId = nextSelectedNoteId;
      render();
      setStatusMessage(CallFlowI18n.t("noteSaved", state.settings.language || "es"), "success");
    });
  }

  async function deleteNote() {
    if (!state.selectedNoteId) return;
    const nextKnowledgeBase = state.knowledgeBase.filter((note) => note.id !== state.selectedNoteId);
    await runAction(async () => {
      await CallFlowStorage.write("knowledgeBase", nextKnowledgeBase);
      state.knowledgeBase = nextKnowledgeBase;
      state.selectedNoteId = null;
      render();
    });
  }

  async function exportNote(extension) {
    const note = state.knowledgeBase.find((item) => item.id === state.selectedNoteId);
    if (!note) return;
    await runAction(() =>
      window.callflow.exportNote({
        fileName: note.title.replace(/[^a-z0-9_-]+/gi, "-").toLowerCase() || "callflow-note",
        content: note.content,
        extension
      })
    );
  }

  function bindEvents() {
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
    $("#previewReminderSound").addEventListener("click", () => {
      playReminderSound($("#settingsForm select[name='reminderSound']").value);
    });
    $("#completeReminderAlarm").addEventListener("click", completeActiveAlarm);
    $("#snoozeReminderAlarm5").addEventListener("click", () => snoozeActiveAlarm(5));
    $("#snoozeReminderAlarm15").addEventListener("click", () => snoozeActiveAlarm(15));
    $("#silenceReminderAlarm").addEventListener("click", () => muteActiveAlarm(30));
    $("#dismissReminderAlarm").addEventListener("click", () => muteActiveAlarm(5));
    $("#settingsForm select[name='language']").addEventListener("change", (event) => {
      handleLanguageChange($("#settingsForm"), event.target.value);
    });
    $("#callForm").addEventListener("submit", saveCall);
    $("#copyLastCrm").addEventListener("click", copyLastCrm);
    $("#importCallIdClipboard").addEventListener("click", importCallIdFromClipboard);
    $("#captureCallTime").addEventListener("click", captureCurrentCallTime);
    $("#shiftTimerToggle").addEventListener("click", toggleShiftTimer);
    $("#shiftTimerStop").addEventListener("click", stopShiftTimer);
    $("#clockPanelToggle").addEventListener("click", () => {
      $("#clockPanel").classList.toggle("hidden");
    });
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
    $("#callForm").addEventListener("keydown", (event) => {
      const input = event.target.closest("[data-new-outcome]");
      if (input && event.key === "Enter") {
        event.preventDefault();
        addOutcomePreset(input.dataset.newOutcome);
      }
    });
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
    $("#cancelReminderEdit").addEventListener("click", cancelReminderEdit);
    $("#toggleReminderForm").addEventListener("click", () => setReminderFormCollapsed(true));
    $("#showReminderForm").addEventListener("click", () => setReminderFormCollapsed(false));
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
      const outcomeToggle = event.target.closest("[data-outcome-toggle]");
      const addListId = event.target.dataset.addListItem;
      const removeListId = event.target.dataset.removeListItem;
      const presetListId = event.target.dataset.presetListItem;
      const dashboardCallTypeToRemove = event.target.dataset.removeDashboardCallType;
      const selectOutcomeCategory = event.target.dataset.selectOutcome;
      const addOutcomeCategory = event.target.dataset.addOutcome;
      const removeOutcomeCategory = event.target.dataset.removeOutcome;
      const clearOutcome = event.target.closest("[data-clear-outcome]");
      const editReportBlockKey = event.target.dataset.editReportBlock;
      const saveReportBlockKey = event.target.dataset.saveReportBlock;
      const cancelReportEditKey = event.target.dataset.cancelReportEdit;
      const deleteReportBlockKey = event.target.dataset.deleteReportBlock;
      const timezoneToggleId = timezoneToggle ? timezoneToggle.dataset.timezoneToggle : null;
      const timezonePickerId = timezoneOption ? timezoneOption.dataset.timezonePickerOption : null;
      const reminderId = event.target.dataset.completeReminder;
      const reminderCallId = event.target.dataset.copyReminderCallId;
      const editReminderId = event.target.dataset.editReminder;
      const reminderDateShortcut = event.target.dataset.reminderDateShortcut;
      const addActiveTimezonePicker = event.target.dataset.addActiveTimezone;
      const removeActiveTimezoneValue = event.target.dataset.removeActiveTimezone;
      const togglePinnedClockButton = event.target.closest("[data-toggle-pinned-clock]");
      const togglePinnedClockValue = togglePinnedClockButton ? togglePinnedClockButton.dataset.togglePinnedClock : null;
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
      if (outcomeToggle) {
        const category = outcomeToggle.dataset.outcomeToggle;
        if (state.selectedPrimaryOutcome?.category !== category) {
          selectPrimaryOutcome(category, defaultOutcomeLabel(category));
        }
        state.openOutcomeMenu = state.openOutcomeMenu === category ? null : category;
        renderOutcomeControls();
      }
      if (selectOutcomeCategory) {
        selectPrimaryOutcome(selectOutcomeCategory, event.target.dataset.value);
      }
      if (addOutcomeCategory) {
        addOutcomePreset(addOutcomeCategory);
      }
      if (removeOutcomeCategory) {
        removeOutcomePreset(removeOutcomeCategory, event.target.dataset.value);
      }
      if (clearOutcome) {
        clearPrimaryOutcome();
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
      if (!event.target.closest(".outcome-control")) {
        state.openOutcomeMenu = null;
        renderOutcomeControls();
      }
      if (!event.target.closest(".timezone-picker")) {
        closeTimezoneDropdown("onboarding");
        closeTimezoneDropdown("settings");
      }
      if (reminderId) completeReminder(reminderId);
      if (reminderCallId) copyReminderCallId(reminderCallId);
      if (editReminderId) editReminder(editReminderId);
      if (reminderDateShortcut) setReminderDateShortcut(reminderDateShortcut);
      if (addActiveTimezonePicker) addActiveTimezoneFromPicker(addActiveTimezonePicker);
      if (removeActiveTimezoneValue) removeActiveTimezone(removeActiveTimezoneValue);
      if (togglePinnedClockValue) togglePinnedClock(togglePinnedClockValue);
      if (!event.target.closest("#workClockShell")) {
        $("#clockPanel").classList.add("hidden");
      }
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
    window.addEventListener("beforeunload", () => {
      freezeAndPersistTimerOnUnload();
    });
  }

  async function init() {
    bindEvents();
    window.callflow.onReminderSound(playReminderSound);
    window.callflow.onReminderAlarm(handleReminderAlarm);
    window.callflow.onOpenReminder(openReminderFromNotification);
    const data = await CallFlowStorage.readAll();
    Object.assign(state, data);
    state.settings = normalizeSettings(state.settings);
    normalizeRuntimeData();
    freezeStaleTimerOnStartup();
    await persistWorkTimer();
    await CallFlowStorage.write("reminders", state.reminders);
    CallFlowI18n.applyI18n(state.settings.language);
    applySettingsToForms();
    const dataDir = await window.callflow.getDataDir();
    $("#dataDirLabel").textContent = dataDir;
    startWorkClock();
    state.reminderTimer = setInterval(renderReminders, 1000);
    prepareReminderFormDefaults();
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
