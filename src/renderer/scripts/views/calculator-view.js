(function () {
  function createCalculatorView(context) {
    const { $, escapeHtml, normalizeSettings, runAction, setStatusMessage, state, storage, timers } = context;

    const keypadItems = ["7", "8", "9", "/", "4", "5", "6", "*", "1", "2", "3", "-", "0", ".", "%", "+", "(", ")", "C", "="];

    function financeSettings() {
      return {
        currency: "USD",
        hourlyRate: 0,
        bonuses: 0,
        deductions: 0,
        adjustments: 0,
        ...(state.settings?.financial || {})
      };
    }

    function numberValue(value) {
      return Number.isFinite(Number(value)) ? Number(value) : 0;
    }

    function currencyFormat(value, config = financeSettings()) {
      const amount = Math.round(numberValue(value) * 100) / 100;
      return `${config.currency || "USD"} ${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
    }

    function evaluateExpression(rawValue) {
      const expression = String(rawValue || "")
        .replace(/,/g, ".")
        .replace(/(\d+(?:\.\d+)?)%/g, "($1/100)")
        .trim();
      if (!expression) return 0;
      if (!/^[\d+\-*/().\s]+$/.test(expression)) throw new Error("Invalid expression");
      return Function(`"use strict"; return (${expression});`)();
    }

    function renderKeypad(containerId) {
      const container = $(containerId);
      if (!container || container.dataset.ready === "true") return;
      container.dataset.ready = "true";
      container.innerHTML = keypadItems
        .map((item) => `<button type="button" data-calc-key="${escapeHtml(item)}">${escapeHtml(item)}</button>`)
        .join("");
    }

    function calculate(inputId, resultId) {
      const input = $(inputId);
      const result = $(resultId);
      if (!input || !result) return;
      try {
        const value = evaluateExpression(input.value);
        result.textContent = Number.isFinite(value) ? String(Math.round(value * 10000) / 10000) : "0";
      } catch (_error) {
        result.textContent = "Error";
      }
    }

    function handleKeypad(event) {
      const key = event.target.dataset.calcKey;
      if (!key) return;
      const compact = event.currentTarget.classList.contains("compact");
      const input = compact ? $("#floatingCalcExpression") : $("#quickCalcExpression");
      const resultId = compact ? "#floatingCalcResult" : "#quickCalcResult";
      if (!input) return;
      if (key === "C") input.value = "";
      else if (key === "=") calculate(compact ? "#floatingCalcExpression" : "#quickCalcExpression", resultId);
      else input.value += key;
      if (key !== "=") calculate(compact ? "#floatingCalcExpression" : "#quickCalcExpression", resultId);
      input.focus();
    }

    function estimatedFinance(workMs = timers.currentWorkElapsed(state.workTimer)) {
      const config = financeSettings();
      const hours = Math.max(0, workMs || 0) / 3600000;
      return hours * numberValue(config.hourlyRate) + numberValue(config.bonuses) + numberValue(config.adjustments) - numberValue(config.deductions);
    }

    function renderFinanceForm() {
      const form = $("#financeSettingsForm");
      if (!form) return;
      const config = financeSettings();
      form.currency.value = config.currency || "USD";
      form.hourlyRate.value = config.hourlyRate || "";
      form.bonuses.value = config.bonuses || "";
      form.deductions.value = config.deductions || "";
      form.adjustments.value = config.adjustments || "";
      $("#financePreview").textContent = currencyFormat(estimatedFinance(), config);
    }

    async function saveFinance(event) {
      event.preventDefault();
      const form = event.currentTarget;
      const financial = {
        currency: String(form.currency.value || "USD").trim().slice(0, 16) || "USD",
        hourlyRate: numberValue(form.hourlyRate.value),
        bonuses: numberValue(form.bonuses.value),
        deductions: numberValue(form.deductions.value),
        adjustments: numberValue(form.adjustments.value)
      };
      state.settings = normalizeSettings({ ...state.settings, financial });
      await runAction(async () => {
        await storage.write("settings", state.settings);
        render();
        setStatusMessage("Finanzas guardadas", "success");
      });
    }

    function openFloating() {
      $("#quickCalculatorPanel").classList.remove("hidden");
      $("#floatingCalcExpression").focus();
    }

    function closeFloating() {
      $("#quickCalculatorPanel").classList.add("hidden");
    }

    function closeFloatingIfOutside(target) {
      if (!target.closest("#quickCalculatorPanel") && !target.closest("#quickCalculatorToggle")) closeFloating();
    }

    function render() {
      renderKeypad("#quickCalcKeypad");
      renderKeypad("#floatingCalcKeypad");
      renderFinanceForm();
      calculate("#quickCalcExpression", "#quickCalcResult");
      calculate("#floatingCalcExpression", "#floatingCalcResult");
    }

    function bindEvents() {
      $("#quickCalcKeypad").addEventListener("click", handleKeypad);
      $("#floatingCalcKeypad").addEventListener("click", handleKeypad);
      $("#quickCalcExpression").addEventListener("input", () => calculate("#quickCalcExpression", "#quickCalcResult"));
      $("#floatingCalcExpression").addEventListener("input", () => calculate("#floatingCalcExpression", "#floatingCalcResult"));
      $("#financeSettingsForm").addEventListener("submit", saveFinance);
      $("#quickCalculatorToggle").addEventListener("click", openFloating);
      $("#quickCalculatorClose").addEventListener("click", closeFloating);
    }

    return {
      bindEvents,
      closeFloatingIfOutside,
      currencyFormat,
      estimatedFinance,
      financeSettings,
      render
    };
  }

  window.CallFlowCalculatorView = { createCalculatorView };
})();
