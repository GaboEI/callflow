(function () {
  function createActions({ $, state, i18n }) {
    let statusTimer = null;

    function setStatusMessage(message, tone = "info") {
      if (statusTimer) {
        clearTimeout(statusTimer);
        statusTimer = null;
      }
      const target = $("#lastSavedLabel");
      if (target) target.textContent = message || "";
      const notice = $("#systemNotice");
      if (!notice) return;
      const showNotice = message && ["warning", "error"].includes(tone);
      notice.textContent = showNotice ? message : "";
      notice.classList.toggle("hidden", !showNotice);
      notice.dataset.tone = tone;
      if (message) {
        statusTimer = setTimeout(() => {
          if (target && target.textContent === message) target.textContent = "";
          if (notice && notice.textContent === message) {
            notice.textContent = "";
            notice.classList.add("hidden");
            delete notice.dataset.tone;
          }
          statusTimer = null;
        }, tone === "error" ? 3000 : 2200);
      }
    }

    async function runAction(action, options = {}) {
      try {
        return await action();
      } catch (error) {
        console.error(options.logMessage || "CallFlow action failed", error);
        const userMessage = typeof options.userMessage === "function"
          ? options.userMessage(error)
          : options.userMessage;
        setStatusMessage(userMessage || error.userMessage || i18n.t("actionFailed", state.settings?.language || "es"), "error");
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
