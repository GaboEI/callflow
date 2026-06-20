(function () {
  function createAiView(context) {
    const { $, i18n, setStatusMessage, state } = context;

    function language() {
      return state.settings?.language || "es";
    }

    function t(key) {
      return i18n.t(key, language());
    }

    function activeCalls() {
      return (state.calls || []).filter((call) => !call.reportDeletedAt);
    }

    function activeReminders() {
      return (state.reminders || []).filter((reminder) => reminder.status !== "deleted");
    }

    function setText(selector, value) {
      const element = $(selector);
      if (element) element.textContent = String(value);
    }

    function unavailableNotice() {
      const status = $("#aiComposerStatus");
      if (status) status.textContent = t("aiFutureStatus");
      setStatusMessage(t("aiFutureToast"), "warning");
    }

    function render() {
      setText("#aiReportsCount", activeCalls().length);
      setText("#aiStatsCount", activeCalls().length ? t("aiStatsReady") : "0");
      setText("#aiScriptsCount", state.knowledgeBase?.length || 0);
      setText("#aiRemindersCount", activeReminders().length);
    }

    function bindEvents() {
      $("#aiComposer")?.addEventListener("submit", (event) => {
        event.preventDefault();
        const prompt = $("#aiPrompt");
        if (!prompt?.value.trim()) {
          prompt?.focus();
          return;
        }
        unavailableNotice();
      });

      document.querySelectorAll("[data-ai-suggestion]").forEach((button) => {
        button.addEventListener("click", () => {
          const prompt = $("#aiPrompt");
          if (!prompt) return;
          prompt.value = button.textContent.trim();
          prompt.focus();
        });
      });
    }

    return {
      bindEvents,
      render
    };
  }

  window.CallFlowAiView = { createAiView };
})();
