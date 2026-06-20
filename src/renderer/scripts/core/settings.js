(function () {
  const outcomes = typeof require === "function" ? require("../../../shared/outcomes") : window.CallFlowOutcomes;

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
    return outcomes.defaultSuccessLabel(language);
  }

  function defaultRejectionLabel(language) {
    return outcomes.defaultRejectionLabel(language);
  }

  function defaultCallbackLabel(language) {
    return outcomes.defaultCallbackLabel(language);
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

  function normalizeSettings(settings, validators) {
    const sanitized = validators.normalizeSettings(settings);
    const normalized = {
      ...sanitized,
      ...settings,
      language: sanitized.language,
      timezone: sanitized.timezone,
      activeTimezones: sanitized.activeTimezones,
      pinnedClockTimezones: sanitized.pinnedClockTimezones,
      lastReminderTimezone: sanitized.lastReminderTimezone,
      statsTimezone: sanitized.statsTimezone,
      statsCycleStartDay: sanitized.statsCycleStartDay,
      callTypes: sanitized.callTypes,
      frequentStatuses: sanitized.frequentStatuses,
      customComments: sanitized.customComments,
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

  const api = {
    defaultCallbackLabel,
    defaultOutcomePresets,
    defaultRejectionLabel,
    defaultSuccessLabel,
    firstOrDefault,
    linesToArray,
    normalizeOutcomePresets,
    normalizeSettings,
    presetForLanguage,
    presets,
    rejectionPresetsForLanguage,
    uniqueItems
  };

  if (typeof window !== "undefined") {
    window.CallFlowSettings = api;
  }

  if (typeof module !== "undefined") {
    module.exports = api;
  }
})();
