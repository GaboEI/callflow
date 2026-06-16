(function () {
  const dictionaries = {
    es: {
      onboardingTitle: "Configuración inicial",
      onboardingSubtitle: "Prepara la app para tu turno de trabajo.",
      language: "Idioma",
      timezone: "Zona horaria",
      operatorName: "Nombre del operador",
      callTypes: "Tipos / proveedores",
      callStatuses: "Estados frecuentes",
      successLabel: "Etiqueta exitosa",
      rejectionLabel: "Etiqueta rechazo",
      finishOnboarding: "Guardar y abrir dashboard",
      dashboard: "Dashboard",
      reports: "Reportes",
      reminders: "Recordatorios",
      stats: "Estadísticas",
      knowledge: "Chuleta",
      settings: "Configuración",
      quickRegister: "Registro rápido",
      callId: "ID de llamada",
      callType: "Tipo / proveedor",
      description: "Descripción / estado",
      customComment: "Comentario personalizado",
      save: "Guardar",
      saveCopyCrm: "Guardar y copiar CRM",
      copyLastCrm: "Copiar último CRM",
      lastLine: "Última línea generada",
      todayBlocks: "Bloques de hoy",
      todayStats: "Estadísticas del día",
      hourlyReports: "Reportes horarios",
      copySelectedBlocks: "Copiar bloques seleccionados",
      newReminder: "Crear recordatorio",
      saveReminder: "Guardar recordatorio",
      reminderList: "Lista",
      newNote: "Nueva nota",
      saveNote: "Guardar nota",
      delete: "Eliminar",
      saveSettings: "Guardar configuración"
    },
    en: {
      onboardingTitle: "Initial setup",
      onboardingSubtitle: "Prepare the app for your work shift.",
      language: "Language",
      timezone: "Time zone",
      operatorName: "Operator name",
      callTypes: "Types / providers",
      callStatuses: "Frequent statuses",
      successLabel: "Success label",
      rejectionLabel: "Rejection label",
      finishOnboarding: "Save and open dashboard",
      dashboard: "Dashboard",
      reports: "Reports",
      reminders: "Reminders",
      stats: "Stats",
      knowledge: "Cheat sheet",
      quickRegister: "Quick register"
    },
    ru: {
      onboardingTitle: "Начальная настройка",
      onboardingSubtitle: "Подготовьте приложение к рабочей смене.",
      language: "Язык",
      timezone: "Часовой пояс",
      operatorName: "Имя оператора",
      callTypes: "Типы / провайдеры",
      callStatuses: "Частые статусы",
      successLabel: "Успешная метка",
      rejectionLabel: "Отказ",
      finishOnboarding: "Сохранить и открыть",
      dashboard: "Панель",
      reports: "Отчеты",
      reminders: "Напоминания",
      stats: "Статистика",
      knowledge: "Шпаргалка",
      quickRegister: "Быстрая запись"
    }
  };

  function t(key, lang) {
    return (dictionaries[lang] && dictionaries[lang][key]) || dictionaries.es[key] || key;
  }

  function applyI18n(lang) {
    document.documentElement.lang = lang || "es";
    document.querySelectorAll("[data-i18n]").forEach((node) => {
      node.textContent = t(node.dataset.i18n, lang);
    });
  }

  window.CallFlowI18n = { t, applyI18n };
})();
