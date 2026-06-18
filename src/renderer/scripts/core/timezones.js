(function () {
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
    const cleanCity = city.replaceAll("_", " ");
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
    const resolvedTimezone = timezone === "local" ? Intl.DateTimeFormat().resolvedOptions().timeZone : timezone;

    try {
      const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: resolvedTimezone,
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

  function timezoneCurrentTime(timezone, language, date = new Date()) {
    const resolvedTimezone = timezone === "local" ? Intl.DateTimeFormat().resolvedOptions().timeZone : timezone;
    try {
      return new Intl.DateTimeFormat(languageLocale(language), {
        timeZone: resolvedTimezone,
        hour: "2-digit",
        minute: "2-digit"
      }).format(date);
    } catch (_error) {
      return "";
    }
  }

  function timezoneLabel(value, language, translate) {
    if (value === "local") {
      const resolved = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
      return `${translate("localSystemTime", language)} — ${resolved} — ${timezoneOffset("local")}`;
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

  function timezoneOption(value, language, translate) {
    const resolvedTimezone = value === "local" ? Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC" : value;
    const [region, ...cityParts] = value.split("/");
    const city = cityParts.join("/");
    const displayName =
      value === "local"
        ? translate("localSystemTime", language)
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

  const api = {
    languageLocale,
    localizedCity,
    localizedRegion,
    normalizeTimezoneSearch,
    timezoneCurrentTime,
    timezoneLabel,
    timezoneOffset,
    timezoneOption,
    timezoneSearchAliases
  };

  if (typeof window !== "undefined") {
    window.CallFlowTimezones = api;
  }

  if (typeof module !== "undefined") {
    module.exports = api;
  }
})();
