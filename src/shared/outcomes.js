(function () {
  const callbackLabels = {
    es: "Rellamada",
    en: "Callback",
    ru: "Повторный_звонок"
  };

  const successLabels = {
    es: "Exitosa",
    en: "Successful",
    ru: "Успешно"
  };

  const rejectionLabels = {
    es: "Rechazo",
    en: "Rejected",
    ru: "Отказ"
  };

  function languageCode(language) {
    return ["es", "en", "ru"].includes(language) ? language : "es";
  }

  function defaultCallbackLabel(language) {
    return callbackLabels[languageCode(language)];
  }

  function defaultSuccessLabel(language) {
    return successLabels[languageCode(language)];
  }

  function defaultRejectionLabel(language) {
    return rejectionLabels[languageCode(language)];
  }

  function isLegacyCallbackDefault(value) {
    return ["Rellamada", "Callback", "Повторный_звонок"].includes(String(value || "").trim());
  }

  const api = {
    defaultCallbackLabel,
    defaultRejectionLabel,
    defaultSuccessLabel,
    isLegacyCallbackDefault,
    languageCode
  };

  if (typeof window !== "undefined") {
    window.CallFlowOutcomes = api;
  }

  if (typeof module !== "undefined") {
    module.exports = api;
  }
})();
