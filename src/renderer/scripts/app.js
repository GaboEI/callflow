(function () {
  const state = {
    settings: null,
    calls: [],
    reminders: [],
    reminderFormCollapsed: true,
    activeAlarmReminderId: null,
    activeAlarmPhase: null,
    activeAlarmSoundKey: null,
    alarmSoundTimer: null,
    knowledgeBase: [],
    health: [],
    callsNeedPersist: false,
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
    },
    dateTimePicker: {
      input: null,
      mode: null,
      step: "date",
      year: null,
      month: null,
      hour: 0,
      minute: 0
    }
  };

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

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));
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

  function parseIsoDateParts(value) {
    const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return null;
    const year = Number(match[1]);
    const month = Number(match[2]) - 1;
    const day = Number(match[3]);
    if (month < 0 || month > 11 || day < 1 || day > 31) return null;
    return { year, month, day };
  }

  function parseTimeParts(value) {
    const match = String(value || "").match(/^(\d{2}):(\d{2})$/);
    if (!match) return null;
    const hour = Number(match[1]);
    const minute = Number(match[2]);
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
    return { hour, minute };
  }

  function inputTimezone(input) {
    const form = input?.form;
    if (!form) return state.settings || "local";
    if (input.name === "date" || input.name === "time") {
      return form.timezone?.value || state.settings?.lastReminderTimezone || activeTimezones()[0] || state.settings?.timezone || "local";
    }
    if (input.name === "callbackDate" || input.name === "callbackTime") {
      return form.callbackTimezone?.value || state.settings?.lastReminderTimezone || activeTimezones()[0] || state.settings?.timezone || "local";
    }
    return state.settings || "local";
  }

  function currentPickerDateParts(input) {
    const existing = parseIsoDateParts(input.value);
    if (existing) return existing;
    const current = V.isoDateInTimezone(new Date(), inputTimezone(input));
    return parseIsoDateParts(current) || parseIsoDateParts(new Date().toISOString().slice(0, 10));
  }

  function currentPickerTimeParts(input) {
    const existing = parseTimeParts(input.value);
    if (existing) return existing;
    return parseTimeParts(V.timeInTimezone(new Date(), inputTimezone(input))) || { hour: 0, minute: 0 };
  }

  function setPickerInputValue(input, value) {
    input.value = value;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function monthName(month) {
    const language = state.settings?.language || "es";
    const label = new Intl.DateTimeFormat(languageLocale(language), { month: "long" })
      .format(new Date(Date.UTC(2026, month, 1)));
    return label.charAt(0).toUpperCase() + label.slice(1);
  }

  function weekdayLabels() {
    const language = state.settings?.language || "es";
    const monday = new Date(Date.UTC(2026, 5, 15));
    return Array.from({ length: 7 }, (_item, index) =>
      new Intl.DateTimeFormat(languageLocale(language), { weekday: "short" })
        .format(new Date(monday.getTime() + index * 86400000))
        .slice(0, 2)
    );
  }

  function sameIsoDay(parts, year, month, day) {
    return parts && parts.year === year && parts.month === month && parts.day === day;
  }

  function pickerText(key) {
    const language = state.settings?.language || "es";
    const labels = {
      es: {
        previousMonth: "Mes anterior",
        nextMonth: "Mes siguiente",
        month: "Mes",
        year: "Año",
        exactMinute: "Minuto exacto",
        apply: "OK"
      },
      en: {
        previousMonth: "Previous month",
        nextMonth: "Next month",
        month: "Month",
        year: "Year",
        exactMinute: "Exact minute",
        apply: "OK"
      },
      ru: {
        previousMonth: "Предыдущий месяц",
        nextMonth: "Следующий месяц",
        month: "Месяц",
        year: "Год",
        exactMinute: "Точная минута",
        apply: "OK"
      }
    };
    return (labels[language] || labels.es)[key] || key;
  }

  function datePickerDays(year, month) {
    const firstDay = new Date(Date.UTC(year, month, 1)).getUTCDay();
    const leadingDays = (firstDay + 6) % 7;
    const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    const daysInPreviousMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const cells = [];

    for (let index = leadingDays - 1; index >= 0; index -= 1) {
      cells.push({ year, month: month - 1, day: daysInPreviousMonth - index, muted: true });
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push({ year, month, day, muted: false });
    }
    while (cells.length % 7 !== 0 || cells.length < 42) {
      const nextDay = cells.filter((cell) => cell.month === month + 1).length + 1;
      cells.push({ year, month: month + 1, day: nextDay, muted: true });
    }

    return cells.map((cell) => {
      const normalized = new Date(Date.UTC(cell.year, cell.month, cell.day));
      return {
        year: normalized.getUTCFullYear(),
        month: normalized.getUTCMonth(),
        day: normalized.getUTCDate(),
        muted: cell.muted
      };
    });
  }

  function findAssociatedTimeInput(input) {
    const form = input.form;
    if (!form || input.type !== "date") return null;
    if (input.name === "callbackDate") return form.callbackTime || null;
    if (input.name === "date") return form.time || null;
    return null;
  }

  function positionDateTimePicker() {
    const input = state.dateTimePicker.input;
    const picker = $("#dateTimePicker");
    if (!input || !picker || picker.classList.contains("hidden")) return;

    const rect = input.getBoundingClientRect();
    const width = Math.min(368, Math.max(292, Math.floor(window.innerWidth - 24)));
    picker.style.width = `${width}px`;
    const pickerHeight = picker.offsetHeight || 360;
    const preferredTop = rect.bottom + 8;
    const top = preferredTop + pickerHeight > window.innerHeight - 12
      ? Math.max(12, rect.top - pickerHeight - 8)
      : preferredTop;
    const left = Math.min(Math.max(12, rect.left), window.innerWidth - width - 12);
    picker.style.top = `${top}px`;
    picker.style.left = `${left}px`;
  }

  function renderDateTimePicker() {
    const picker = $("#dateTimePicker");
    const pickerState = state.dateTimePicker;
    const input = pickerState.input;
    if (!picker || !input || !pickerState.mode) return;

    picker.classList.remove("hidden");
    picker.dataset.mode = pickerState.mode;

    if (pickerState.mode === "date") {
      const selected = parseIsoDateParts(input.value);
      const today = parseIsoDateParts(V.isoDateInTimezone(new Date(), inputTimezone(input)));
      const weekdays = weekdayLabels().map((day) => `<span>${escapeHtml(day)}</span>`).join("");
      const monthOptions = Array.from({ length: 12 }, (_item, month) =>
        `<option value="${month}" ${pickerState.month === month ? "selected" : ""}>${escapeHtml(monthName(month))}</option>`
      ).join("");
      const days = datePickerDays(pickerState.year, pickerState.month)
        .map((cell) => {
          const dateValue = `${cell.year}-${String(cell.month + 1).padStart(2, "0")}-${String(cell.day).padStart(2, "0")}`;
          const classes = [
            "cf-picker-day",
            cell.muted ? "is-muted" : "",
            sameIsoDay(selected, cell.year, cell.month, cell.day) ? "is-selected" : "",
            sameIsoDay(today, cell.year, cell.month, cell.day) ? "is-today" : ""
          ].filter(Boolean).join(" ");
          return `<button type="button" class="${classes}" data-cf-picker-date="${dateValue}">${cell.day}</button>`;
        })
        .join("");

      picker.innerHTML = `
        <div class="cf-picker-header">
          <button type="button" class="icon-button" data-cf-picker-month="-1" aria-label="${escapeHtml(pickerText("previousMonth"))}">‹</button>
          <div class="cf-picker-month-year">
            <select data-cf-picker-month-select aria-label="${escapeHtml(pickerText("month"))}">${monthOptions}</select>
            <input type="number" data-cf-picker-year-input aria-label="${escapeHtml(pickerText("year"))}" min="1900" max="2200" value="${pickerState.year}" />
          </div>
          <button type="button" class="icon-button" data-cf-picker-month="1" aria-label="${escapeHtml(pickerText("nextMonth"))}">›</button>
        </div>
        <div class="cf-picker-weekdays">${weekdays}</div>
        <div class="cf-picker-calendar">${days}</div>
      `;
    } else {
      const hourButtons = Array.from({ length: 24 }, (_item, hour) => {
        const value = String(hour).padStart(2, "0");
        const selected = pickerState.hour === hour ? " is-selected" : "";
        return `<button type="button" class="cf-picker-cell${selected}" data-cf-picker-hour="${hour}">${value}</button>`;
      }).join("");
      const minuteButtons = Array.from({ length: 12 }, (_item, index) => index * 5).map((minute) => {
        const value = String(minute).padStart(2, "0");
        const selected = pickerState.minute === minute ? " is-selected" : "";
        return `<button type="button" class="cf-picker-cell${selected}" data-cf-picker-minute="${minute}">${value}</button>`;
      }).join("");

      picker.innerHTML = `
        <div class="cf-picker-header">
          <button type="button" class="icon-button${pickerState.step === "hour" ? " is-selected" : ""}" data-cf-picker-step="hour">HH</button>
          <strong>${String(pickerState.hour).padStart(2, "0")}:${String(pickerState.minute).padStart(2, "0")}</strong>
          <button type="button" class="icon-button${pickerState.step === "minute" ? " is-selected" : ""}" data-cf-picker-step="minute">MM</button>
        </div>
        ${
          pickerState.step === "hour"
            ? `<div class="cf-picker-grid hours">${hourButtons}</div>`
            : `
              <div class="cf-picker-grid minutes">${minuteButtons}</div>
              <div class="cf-picker-exact-minute">
                <label>
                  <span>${escapeHtml(pickerText("exactMinute"))}</span>
                  <div class="cf-exact-minute-control">
                    <input id="exactMinuteInput" type="number" min="0" max="59" inputmode="numeric" value="${String(pickerState.minute).padStart(2, "0")}" />
                    <div class="cf-minute-stepper" aria-label="${escapeHtml(pickerText("exactMinute"))}">
                      <button type="button" data-cf-picker-minute-step="1" aria-label="+1">⌃</button>
                      <button type="button" data-cf-picker-minute-step="-1" aria-label="-1">⌄</button>
                    </div>
                  </div>
                </label>
                <button type="button" data-cf-picker-apply-minute>${escapeHtml(pickerText("apply"))}</button>
              </div>
            `
        }
      `;
    }

    positionDateTimePicker();
  }

  function closeDateTimePicker() {
    const picker = $("#dateTimePicker");
    if (picker) picker.classList.add("hidden");
    state.dateTimePicker.input = null;
    state.dateTimePicker.mode = null;
  }

  function openDateTimePicker(input) {
    if (!input || !["date", "time"].includes(input.type)) return;
    enhanceDateTimeInputs();
    state.dateTimePicker.input = input;
    state.dateTimePicker.mode = input.type;

    if (input.type === "date") {
      const parts = currentPickerDateParts(input);
      state.dateTimePicker.step = "date";
      state.dateTimePicker.year = parts.year;
      state.dateTimePicker.month = parts.month;
    } else {
      const parts = currentPickerTimeParts(input);
      state.dateTimePicker.step = "hour";
      state.dateTimePicker.hour = parts.hour;
      state.dateTimePicker.minute = parts.minute;
    }

    renderDateTimePicker();
  }

  function commitPickerDate(value) {
    const input = state.dateTimePicker.input;
    if (!input) return;
    setPickerInputValue(input, value);
    const associatedTimeInput = findAssociatedTimeInput(input);
    closeDateTimePicker();
    if (associatedTimeInput) {
      setTimeout(() => {
        associatedTimeInput.focus();
        openDateTimePicker(associatedTimeInput);
      }, 0);
    }
  }

  function commitPickerTime(minute) {
    const input = state.dateTimePicker.input;
    if (!input) return;
    const normalizedMinute = Math.min(59, Math.max(0, Number(minute) || 0));
    state.dateTimePicker.minute = normalizedMinute;
    setPickerInputValue(
      input,
      `${String(state.dateTimePicker.hour).padStart(2, "0")}:${String(normalizedMinute).padStart(2, "0")}`
    );
    closeDateTimePicker();
  }

  function shiftPickerMonth(direction) {
    const date = new Date(Date.UTC(state.dateTimePicker.year, state.dateTimePicker.month + direction, 1));
    state.dateTimePicker.year = date.getUTCFullYear();
    state.dateTimePicker.month = date.getUTCMonth();
    renderDateTimePicker();
  }

  function setPickerMonth(month) {
    const nextMonth = Math.min(11, Math.max(0, Number(month)));
    if (Number.isNaN(nextMonth)) return;
    state.dateTimePicker.month = nextMonth;
    renderDateTimePicker();
  }

  function setPickerYear(year) {
    const nextYear = Math.min(2200, Math.max(1900, Number(year)));
    if (Number.isNaN(nextYear)) return;
    state.dateTimePicker.year = nextYear;
    renderDateTimePicker();
  }

  function exactMinuteInputValue() {
    const input = $("#exactMinuteInput");
    return Math.min(59, Math.max(0, Number(input?.value) || 0));
  }

  function nudgeExactMinute(delta) {
    const input = $("#exactMinuteInput");
    if (!input) return;
    const nextMinute = (exactMinuteInputValue() + delta + 60) % 60;
    input.value = String(nextMinute).padStart(2, "0");
    state.dateTimePicker.minute = nextMinute;
    renderDateTimePicker();
  }

  function handleDateTimePickerClick(event) {
    const monthButton = event.target.closest("[data-cf-picker-month]");
    const dateButton = event.target.closest("[data-cf-picker-date]");
    const stepButton = event.target.closest("[data-cf-picker-step]");
    const hourButton = event.target.closest("[data-cf-picker-hour]");
    const minuteButton = event.target.closest("[data-cf-picker-minute]");
    const minuteStepButton = event.target.closest("[data-cf-picker-minute-step]");
    const applyMinute = event.target.closest("[data-cf-picker-apply-minute]");

    if (monthButton) shiftPickerMonth(Number(monthButton.dataset.cfPickerMonth));
    if (dateButton) commitPickerDate(dateButton.dataset.cfPickerDate);
    if (stepButton) {
      state.dateTimePicker.step = stepButton.dataset.cfPickerStep;
      renderDateTimePicker();
    }
    if (hourButton) {
      state.dateTimePicker.hour = Number(hourButton.dataset.cfPickerHour);
      state.dateTimePicker.step = "minute";
      renderDateTimePicker();
    }
    if (minuteButton) commitPickerTime(Number(minuteButton.dataset.cfPickerMinute));
    if (minuteStepButton) nudgeExactMinute(Number(minuteStepButton.dataset.cfPickerMinuteStep));
    if (applyMinute) commitPickerTime($("#exactMinuteInput")?.value);
  }

  function handleDateTimePickerChange(event) {
    const monthSelect = event.target.closest("[data-cf-picker-month-select]");
    const yearInput = event.target.closest("[data-cf-picker-year-input]");
    const exactMinuteInput = event.target.closest("#exactMinuteInput");
    if (monthSelect) setPickerMonth(monthSelect.value);
    if (yearInput) setPickerYear(yearInput.value);
    if (exactMinuteInput) {
      exactMinuteInput.value = String(exactMinuteInputValue()).padStart(2, "0");
      state.dateTimePicker.minute = exactMinuteInputValue();
    }
  }

  function enhanceDateTimeInputs() {
    $$("input[type='date'], input[type='time']").forEach((input) => {
      if (input.dataset.callflowDateTime === "true") return;
      input.dataset.callflowDateTime = "true";
      input.classList.add("cf-datetime-input");
      input.readOnly = true;
      input.autocomplete = "off";
      input.addEventListener("focus", () => openDateTimePicker(input));
      input.addEventListener("click", () => openDateTimePicker(input));
      input.addEventListener("keydown", (event) => {
        if (["Enter", " ", "ArrowDown"].includes(event.key)) {
          event.preventDefault();
          openDateTimePicker(input);
        }
        if (event.key === "Escape") closeDateTimePicker();
      });
    });
  }

  const languageLocale = Timezones.languageLocale;
  const normalizeTimezoneSearch = Timezones.normalizeTimezoneSearch;
  const timezoneLabel = (value, language) => Timezones.timezoneLabel(value, language, CallFlowI18n.t);
  const timezoneOption = (value, language) => Timezones.timezoneOption(value, language, CallFlowI18n.t);

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

  const escapeHtml = Markdown.escapeHtml;
  const escapeRegExp = Markdown.escapeRegExp;

  function compactStatusLabel(value) {
    const text = String(value || "");
    if (text.length <= 72) return text;
    return `${text.slice(0, 48)}...${text.slice(-18)}`;
  }

  const markdownPreview = Markdown.markdownPreview;

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

  async function updateCustomCommentsFromDashboard(customComments) {
    state.settings = normalizeSettings({
      ...state.settings,
      customComments: uniqueItems(customComments)
    });
    await runAction(async () => {
      await CallFlowStorage.write("settings", state.settings);
      renderCustomCommentOptions(false);
      render();
    });
  }

  async function addCurrentCustomComment() {
    const input = $("#customCommentInput");
    const value = input.value.trim();
    if (!value) return;
    await updateCustomCommentsFromDashboard([...(state.settings.customComments || []), value]);
    input.focus();
  }

  async function removeCurrentCustomComment() {
    const input = $("#customCommentInput");
    const value = input.value.trim();
    if (!value || !(state.settings.customComments || []).includes(value)) return;
    const language = state.settings.language || "es";
    if (!window.confirm(CallFlowI18n.t("confirmRemoveCustomComment", language))) return;
    await updateCustomCommentsFromDashboard((state.settings.customComments || []).filter((comment) => comment !== value));
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

  function currentWorkElapsed(now = Date.now()) {
    return Timers.currentWorkElapsed(state.workTimer, now);
  }

  function currentBreakElapsed(now = Date.now()) {
    return Timers.currentBreakElapsed(state.workTimer, now);
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
    value.textContent = Timers.formatDuration(paused ? currentBreakElapsed() : currentWorkElapsed());
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
    state.workTimer = Timers.toggleShiftTimer(state.workTimer);
    await persistWorkTimer();
    renderShiftTimer();
  }

  async function stopShiftTimer() {
    const timer = normalizeWorkTimer(state.workTimer);
    if (timer.status === "idle" || timer.status === "stopped") return;
    state.workTimer = Timers.freezeWorkTimer(timer);
    await persistWorkTimer();
    renderShiftTimer();
  }

  async function freezeAndPersistTimerOnUnload() {
    const timer = normalizeWorkTimer(state.workTimer);
    if (!["working", "paused"].includes(timer.status)) return;
    state.workTimer = Timers.freezeWorkTimer(timer);
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

  function activeCalls() {
    return state.calls.filter((call) => !call.reportDeletedAt);
  }

  function reportTrashMode() {
    return state.reportRange.preset === "trash";
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
    const fromInput = $("#reportDateFrom");
    const toInput = $("#reportDateTo");
    const rangeFields = $$(".report-range-field");
    if (!fromInput || !toInput) return;

    const range = reportRangeBounds();
    fromInput.value = range.from;
    toInput.value = range.to;
    rangeFields.forEach((field) => field.classList.toggle("hidden", state.reportRange.preset !== "custom"));
    $$("[data-report-period]").forEach((button) => {
      const active = button.dataset.reportPeriod === state.reportRange.preset;
      button.classList.toggle("report-period-chip--active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  function reportBlockKey(isoDate, block) {
    return `${isoDate}|${block}`;
  }

  function reportGroupsForRange() {
    const range = reportRangeBounds();
    const sourceCalls = reportTrashMode()
      ? state.calls.filter((call) => call.reportDeletedAt)
      : activeCalls();
    const calls = CallFlowReports.ensureDailySequences(sourceCalls)
      .filter((call) => {
        if (reportTrashMode()) return true;
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
    if (reportTrashMode()) {
      return `
        <button type="button" data-restore-report-block="${escapeHtml(key)}">Restaurar</button>
        <button type="button" class="danger ghost-danger" data-permanent-delete-report-block="${escapeHtml(key)}">Eliminar definitivo</button>
      `;
    }
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
    const trash = reportTrashMode();

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
            : `<code>${highlightedReportText(lines)}</code>`
        }
      </article>
    `;
  }

  function renderReportBlocks() {
    syncReportRangeInputs();
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
      : `<p class="muted">${escapeHtml(CallFlowI18n.t("noReportBlocks", state.settings.language || "es"))}</p>`;

    if (state.reportSearch.activeIndex >= state.reportSearch.matches) {
      state.reportSearch.activeIndex = Math.max(0, state.reportSearch.matches - 1);
    }
    renderReportSearchStatus();
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
    const todayCalls = CallFlowReports.ensureDailySequences(CallFlowReports.callsForToday(activeCalls(), state.settings));
    const groups = CallFlowReports.groupByBlock(todayCalls);
    const entries = Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
    const currentBlock = CallFlowReports.blockFromHour(CallFlowReports.formatCallTimestamp(new Date(), state.settings).hour);
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
    const todayCalls = CallFlowReports.callsForToday(activeCalls(), state.settings);
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
    if (reminder.status === "deleted") {
      if (reminder.deletedAt) {
        const delDate = new Date(reminder.deletedAt);
        const day = String(delDate.getDate()).padStart(2, "0");
        const month = String(delDate.getMonth() + 1).padStart(2, "0");
        const hours = String(delDate.getHours()).padStart(2, "0");
        const minutes = String(delDate.getMinutes()).padStart(2, "0");
        const label = CallFlowI18n.t("deletedAtLabel", state.settings.language || "es");
        return `${label} ${day}.${month} ${hours}:${minutes}`;
      }
      return CallFlowI18n.t("reminderDeletedLabel", state.settings.language || "es");
    }
    const due = reminderDueDate(reminder);
    const diff = due - new Date();
    if (diff < 0) return `Vencido hace ${compactDuration(Math.abs(diff))}`;
    return `Faltan ${compactDuration(diff)}`;
  }

  function reminderStatusKey(reminder) {
    if (reminder.status === "deleted") return "deleted";
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
      pending: CallFlowI18n.t("reminderPending", state.settings.language || "es"),
      deleted: CallFlowI18n.t("reminderDeletedLabel", state.settings.language || "es")
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

  function getActiveReminderFilter() {
    const active = document.querySelector(".reminder-chip.reminder-chip--active");
    return active ? active.dataset.filter : "all";
  }

  function setReminderFilter(filterValue) {
    document.querySelectorAll(".reminder-chip").forEach((btn) => {
      btn.classList.toggle("reminder-chip--active", btn.dataset.filter === filterValue);
    });
    render();
  }

  function renderReminders() {
    const filter = getActiveReminderFilter();
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
                      <button type="button" class="icon-button" data-copy-reminder-call-id="${escapeHtml(reminder.callId)}" title="${escapeHtml(CallFlowI18n.t("copyCallId", state.settings.language || "es"))}">⇩</button>
                      <span class="reminder-id" title="${escapeHtml(reminder.callId)}">ID: ${escapeHtml(reminder.callId)}</span>
                    </div>`
                  : ""
              }
              <div class="reminder-actions">
                ${
                  reminderStatusKey(reminder) === "deleted"
                    ? `
                        <button type="button" data-restore-reminder="${reminder.id}">${escapeHtml(CallFlowI18n.t("restoreReminder", state.settings.language || "es"))}</button>
                        <button type="button" class="icon-button danger ghost-danger" data-permanent-delete-reminder="${reminder.id}" title="${escapeHtml(CallFlowI18n.t("permanentDeleteReminder", state.settings.language || "es"))}">🗑</button>
                      `
                    : `
                        <button type="button" class="icon-button" data-edit-reminder="${reminder.id}" title="${escapeHtml(CallFlowI18n.t("editReminder", state.settings.language || "es"))}">✎</button>
                        ${
                          reminderStatusKey(reminder) === "completed"
                            ? `<span class="tag reminder-completed-label">${escapeHtml(CallFlowI18n.t("reminderCompleted", state.settings.language || "es"))}</span>`
                            : `<button type="button" data-complete-reminder="${reminder.id}">${escapeHtml(CallFlowI18n.t("completeReminder", state.settings.language || "es"))}</button>`
                        }
                        <button type="button" class="icon-button danger ghost-danger" data-delete-reminder="${reminder.id}" title="${escapeHtml(CallFlowI18n.t("deleteReminder", state.settings.language || "es"))}">🗑</button>
                      `
                }
              </div>
            </article>
          `)
          .join("")
      : '<p class="muted">No hay recordatorios en esta vista.</p>';
  }

  function prepareReminderFormDefaults(options = {}) {
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
    if (options.refreshDate || !form.date.value) form.date.value = currentDateInputValue(timezone);
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
    if (!collapsed) prepareReminderFormDefaults({ refreshDate: true });
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
      const latest = [...activeCalls()].sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")))[0];
      state.lastCall = latest || null;
    }
    $("#lastFullLine").textContent = state.lastCall
      ? CallFlowReports.buildCallLine(state.lastCall, state.settings)
      : "-";
  }

  function render() {
    if (!state.settings) return;
    const renderParts = {
      renderActiveTimezoneEditors,
      renderBlocks,
      renderCallOptions,
      renderCapturedCallTime,
      renderDashboardInlineManagers,
      renderHeader,
      renderLastCall,
      renderListEditors,
      renderNotes,
      renderOutcomeControls,
      renderReminderFormVisibility,
      renderReminders,
      renderStats
    };
    window.CallFlowDashboardView.render(renderParts);
    window.CallFlowReportsView.render(renderParts);
    window.CallFlowSettingsView.render(renderParts);
    window.CallFlowRemindersView.render(renderParts);
    window.CallFlowKnowledgeView.render(renderParts);
    window.CallFlowClockView.render(renderParts);
    enhanceDateTimeInputs();
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
        dailySequence: CallFlowReports.callsForToday(activeCalls(), state.settings).length + 1
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

  function buildPlainSupervisorReport(block, calls) {
    const operator = (state.settings.operatorName || "OPERADOR").toUpperCase();
    const lines = calls.map((call) => CallFlowReports.buildCallLine(call, state.settings)).join("\n");
    return [`REPORTE ${operator} DE ${block}`, "", lines].join("\n");
  }

  function reportExportBaseName() {
    const operator = String(state.settings.operatorName || "operador")
      .trim()
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-+|-+$/g, "");
    return `${operator || "operador"}-report-${isoDateOffset(0)}`;
  }

  function selectedReportTexts(format = "md") {
    const groupsByDate = reportGroupsForRange();
    return [...state.selectedBlocks]
      .sort()
      .map((key) => {
        const [isoDate, block] = key.split("|");
        const calls = groupsByDate[isoDate] && groupsByDate[isoDate][block];
        if (!calls) return "";
        return format === "txt"
          ? buildPlainSupervisorReport(block, calls)
          : CallFlowReports.buildSupervisorReport(block, calls, state.settings);
      })
      .filter(Boolean);
  }

  async function copySelectedBlocks() {
    const reports = selectedReportTexts("md");
    if (reports.length) {
      await runAction(async () => {
        await window.callflow.copyText(reports.join("\n\n"));
        setStatusMessage(CallFlowI18n.t("copied", state.settings.language || "es"), "success");
      });
    }
  }

  async function exportSelectedBlocks(extension) {
    const reports = selectedReportTexts(extension);
    if (!reports.length) return;
    await runAction(
      () =>
        window.callflow.exportNote({
          fileName: reportExportBaseName(),
          content: reports.join("\n\n"),
          extension
        }),
      { userMessage: CallFlowI18n.t("saveFailed", state.settings.language || "es"), logMessage: "Failed to export report" }
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

  function clearReportSelection() {
    state.selectedBlocks.clear();
    renderReportBlocks();
  }

  function setReportPeriod(period) {
    state.reportRange.preset = period;
    state.selectedBlocks.clear();
    state.editingReportBlockKey = null;
    state.reportSearch.activeIndex = 0;
    render();
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
    const deletedAt = new Date().toISOString();
    state.calls = state.calls.map((call) => (ids.has(call.id) ? { ...call, reportDeletedAt: deletedAt } : call));
    if (state.lastCall && ids.has(state.lastCall.id)) state.lastCall = null;
    state.selectedBlocks.delete(key);
    if (state.editingReportBlockKey === key) state.editingReportBlockKey = null;
    await CallFlowStorage.write("calls", state.calls);
    render();
  }

  async function restoreReportBlock(key) {
    const ids = new Set(callsForReportBlockKey(key).map((call) => call.id));
    state.calls = state.calls.map((call) => {
      if (!ids.has(call.id)) return call;
      const restored = { ...call };
      delete restored.reportDeletedAt;
      return restored;
    });
    await CallFlowStorage.write("calls", state.calls);
    render();
  }

  async function permanentDeleteReportBlock(key) {
    if (!window.confirm("Eliminar definitivamente este bloque?")) return;
    const ids = new Set(callsForReportBlockKey(key).map((call) => call.id));
    state.calls = state.calls.filter((call) => !ids.has(call.id));
    if (state.lastCall && ids.has(state.lastCall.id)) state.lastCall = null;
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

  function nextRecurringReminder(reminder) {
    return Recurrence.nextRecurringReminder(reminder, {
      createId: () => crypto.randomUUID(),
      now: new Date(),
      resolveTimezone: () => V.resolveTimezone(state.settings),
      zonedDateTimeToUtc: V.zonedDateTimeToUtc
    });
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

  async function deleteReminder(id) {
    const language = state.settings.language || "es";
    if (!window.confirm(CallFlowI18n.t("confirmDeleteReminder", language))) return;
    if (state.activeAlarmReminderId === id) clearReminderAlarm();
    const nextReminders = state.reminders.map((reminder) =>
      reminder.id === id ? { ...reminder, status: "deleted", deletedAt: new Date().toISOString() } : reminder
    );
    await runAction(async () => {
      await CallFlowStorage.write("reminders", nextReminders);
      state.reminders = nextReminders;
      render();
      setStatusMessage(CallFlowI18n.t("saved", language), "success");
    });
  }

  async function restoreReminder(id) {
    const language = state.settings.language || "es";
    const nextReminders = state.reminders.map((reminder) =>
      reminder.id === id ? { ...reminder, status: "pending", deletedAt: undefined } : reminder
    );
    await runAction(async () => {
      await CallFlowStorage.write("reminders", nextReminders);
      state.reminders = nextReminders;
      render();
      setStatusMessage(CallFlowI18n.t("saved", language), "success");
    });
  }

  async function permanentDeleteReminder(id) {
    const language = state.settings.language || "es";
    if (!window.confirm(CallFlowI18n.t("confirmPermanentDeleteReminder", language))) return;
    const nextReminders = state.reminders.filter((reminder) => reminder.id !== id);
    await runAction(async () => {
      await CallFlowStorage.write("reminders", nextReminders);
      state.reminders = nextReminders;
      render();
      setStatusMessage(CallFlowI18n.t("saved", language), "success");
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

  function renderDiagnostics(diagnostics) {
    const output = $("#diagnosticsOutput");
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
      const data = await CallFlowStorage.readAll();
      Object.assign(state, data);
      state.settings = normalizeSettings(state.settings);
      normalizeRuntimeData();
      applySettingsToForms();
      CallFlowI18n.applyI18n(state.settings.language);
      render();
      setStatusMessage(CallFlowI18n.t("saved", language), "success");
    });
  }

  function handleDocumentChange(event) {
    if (event.target.closest("#dateTimePicker")) {
      handleDateTimePickerChange(event);
      return;
    }
    if (event.target.matches("[data-report-block]")) {
      if (event.target.checked) state.selectedBlocks.add(event.target.dataset.reportBlock);
      else state.selectedBlocks.delete(event.target.dataset.reportBlock);
    }
  }

  function handleDocumentFocusIn(event) {
    if (event.target.matches("input[type='date'], input[type='time']")) {
      enhanceDateTimeInputs();
      openDateTimePicker(event.target);
    }
  }

  function handleDocumentClick(event) {
    const picker = event.target.closest("#dateTimePicker");
    if (picker) {
      handleDateTimePickerClick(event);
      return;
    }
    if (!event.target.closest(".cf-datetime-input")) {
      closeDateTimePicker();
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
    const statusOption = event.target.closest("[data-status-option]");
    const customCommentOption = event.target.closest("[data-custom-comment-option]");
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
    const restoreReportBlockKey = event.target.dataset.restoreReportBlock;
    const permanentDeleteReportBlockKey = event.target.dataset.permanentDeleteReportBlock;
    const reportPeriod = event.target.dataset.reportPeriod;
    const timezoneToggleId = timezoneToggle ? timezoneToggle.dataset.timezoneToggle : null;
    const timezonePickerId = timezoneOption ? timezoneOption.dataset.timezonePickerOption : null;
    const reminderId = event.target.dataset.completeReminder;
    const reminderCallId = event.target.dataset.copyReminderCallId;
    const editReminderId = event.target.dataset.editReminder;
    const deleteReminderId = event.target.closest("[data-delete-reminder]")?.dataset.deleteReminder;
    const restoreReminderId = event.target.closest("[data-restore-reminder]")?.dataset.restoreReminder;
    const permanentDeleteReminderId = event.target.closest("[data-permanent-delete-reminder]")?.dataset.permanentDeleteReminder;
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
    if (restoreReportBlockKey) {
      restoreReportBlock(restoreReportBlockKey);
    }
    if (permanentDeleteReportBlockKey) {
      permanentDeleteReportBlock(permanentDeleteReportBlockKey);
    }
    if (reportPeriod) {
      setReportPeriod(reportPeriod);
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
    if (customCommentOption) {
      selectCustomCommentOption(customCommentOption.dataset.customCommentOption);
    }
    if (!event.target.closest(".status-combobox")) {
      renderStatusOptions(false);
    }
    if (!event.target.closest(".custom-comment-combobox")) {
      renderCustomCommentOptions(false);
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
    if (deleteReminderId) deleteReminder(deleteReminderId);
    if (restoreReminderId) restoreReminder(restoreReminderId);
    if (permanentDeleteReminderId) permanentDeleteReminder(permanentDeleteReminderId);
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
  }

  function handleWindowResize() {
    positionDateTimePicker();
    if (window.innerWidth >= 780) {
      $("#app").classList.remove("sidebar-open");
      $("#sidebarBackdrop").hidden = true;
      $("#sidebarToggle").setAttribute("aria-label", CallFlowI18n.t("openSidebar", state.settings.language));
    }
  }

  function handleGlobalKeydown(event) {
    if (event.target.matches("[data-cf-picker-year-input]") && event.key === "Enter") {
      event.preventDefault();
      setPickerYear(event.target.value);
    }
    if (event.target.matches("#exactMinuteInput") && event.key === "Enter") {
      event.preventDefault();
      commitPickerTime(event.target.value);
    }
    if (event.key === "Escape") closeDateTimePicker();
  }

  function bindEvents() {
    enhanceDateTimeInputs();
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
    $("#copySelectedBlocks").addEventListener("click", copySelectedBlocks);
    $("#exportSelectedMd").addEventListener("click", () => exportSelectedBlocks("md"));
    $("#exportSelectedTxt").addEventListener("click", () => exportSelectedBlocks("txt"));
    $("#selectAllReportBlocks").addEventListener("click", selectAllVisibleReportBlocks);
    $("#clearReportSelection").addEventListener("click", clearReportSelection);
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
    document.querySelector(".reminder-chips").addEventListener("click", (e) => {
      const chip = e.target.closest(".reminder-chip");
      if (chip) setReminderFilter(chip.dataset.filter);
    });
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
    $("#exportBackup").addEventListener("click", exportBackup);
    $("#importBackup").addEventListener("click", importBackup);
    $("#refreshDiagnostics").addEventListener("click", refreshDiagnostics);
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

    document.addEventListener("change", handleDocumentChange);
    document.addEventListener("focusin", handleDocumentFocusIn);
    document.addEventListener("click", handleDocumentClick);

    window.addEventListener("resize", handleWindowResize);
    window.addEventListener("scroll", positionDateTimePicker, true);
    document.addEventListener("keydown", handleGlobalKeydown);
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
    if (state.callsNeedPersist) {
      await CallFlowStorage.write("calls", state.calls);
      state.callsNeedPersist = false;
    }
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
