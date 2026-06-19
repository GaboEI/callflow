(function () {
  function createActions({ $, state, i18n }) {
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

    async function runAction(action, options = {}) {
      try {
        return await action();
      } catch (error) {
        console.error(options.logMessage || "CallFlow action failed", error);
        setStatusMessage(options.userMessage || i18n.t("actionFailed", state.settings?.language || "es"), "error");
        return null;
      }
    }

    return { runAction, setStatusMessage };
  }

  window.CallFlowActions = { createActions };

  if (typeof module !== "undefined") {
    module.exports = window.CallFlowActions;
  }
})();
