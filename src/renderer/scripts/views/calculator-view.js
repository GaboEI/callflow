(function () {
  function createCalculatorView(context) {
    const { $, escapeHtml, normalizeSettings, runAction, setStatusMessage, state, storage, timers } = context;

    const keypadItems = [
      { label: "C", value: "clear", kind: "utility" },
      { label: "⌫", value: "backspace", kind: "utility" },
      { label: "(", value: "(" },
      { label: ")", value: ")" },
      { label: "%", value: "%" },
      { label: "7", value: "7" },
      { label: "8", value: "8" },
      { label: "9", value: "9" },
      { label: "/", value: "/" },
      { label: "√", value: "sqrt(" },
      { label: "4", value: "4" },
      { label: "5", value: "5" },
      { label: "6", value: "6" },
      { label: "*", value: "*" },
      { label: "x²", value: "**2" },
      { label: "1", value: "1" },
      { label: "2", value: "2" },
      { label: "3", value: "3" },
      { label: "-", value: "-" },
      { label: "π", value: "π" },
      { label: "0", value: "0" },
      { label: ".", value: "." },
      { label: "00", value: "00" },
      { label: "+", value: "+" },
      { label: "=", value: "equals", kind: "equals" }
    ];
    let lastOperation = "";

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

    function normalizeExpression(rawValue) {
      return String(rawValue || "")
        .replace(/,/g, ".")
        .replace(/(\d+(?:\.\d+)?)%/g, "($1/100)")
        .replace(/π/g, "Math.PI")
        .replace(/\bpi\b/gi, "Math.PI")
        .replace(/\bsqrt\(/gi, "Math.sqrt(")
        .trim();
    }

    function isPendingExpression(expression) {
      if (!expression) return false;
      const openParens = (expression.match(/\(/g) || []).length;
      const closeParens = (expression.match(/\)/g) || []).length;
      return /[+\-*/.(]$/.test(expression) || /\*\*$/.test(expression) || openParens > closeParens;
    }

    function evaluateExpression(rawValue) {
      const expression = normalizeExpression(rawValue);
      if (!expression) return 0;
      if (isPendingExpression(expression)) return null;
      const safeExpression = expression
        .replace(/Math\.PI/g, "")
        .replace(/Math\.sqrt/g, "");
      if (!/^[\d+\-*/().\s]+$/.test(safeExpression)) throw new Error("Invalid expression");
      return Function(`"use strict"; return (${expression});`)();
    }

    function renderKeypad(containerId) {
      const container = $(containerId);
      if (!container || container.dataset.ready === "true") return;
      container.dataset.ready = "true";
      container.innerHTML = keypadItems
        .map((item) => {
          const className = item.kind ? ` class="calculator-key-${escapeHtml(item.kind)}"` : "";
          return `<button type="button"${className} data-calc-key="${escapeHtml(item.value)}">${escapeHtml(item.label)}</button>`;
        })
        .join("");
    }

    function updateHistory(historyId) {
      const history = $(historyId);
      if (history) history.textContent = lastOperation ? `Última operación: ${lastOperation}` : "";
    }

    function calculate(inputId, resultId, historyId, final = false) {
      const input = $(inputId);
      const result = $(resultId);
      if (!input || !result) return;
      try {
        const value = evaluateExpression(input.value);
        if (value === null) {
          result.textContent = final ? "Completa la operación" : "0";
          updateHistory(historyId);
          return;
        }
        const formatted = Number.isFinite(value) ? String(Math.round(value * 10000) / 10000) : "0";
        result.textContent = formatted;
        if (final && String(input.value || "").trim()) {
          lastOperation = `${input.value.trim()} = ${formatted}`;
          updateHistory("#quickCalcHistory");
          updateHistory("#floatingCalcHistory");
        } else {
          updateHistory(historyId);
        }
      } catch (_error) {
        result.textContent = final ? "Error" : "0";
        updateHistory(historyId);
      }
    }

    function handleKeypad(event) {
      const key = event.target.dataset.calcKey;
      if (!key) return;
      const compact = event.currentTarget.classList.contains("compact");
      const input = compact ? $("#floatingCalcExpression") : $("#quickCalcExpression");
      const resultId = compact ? "#floatingCalcResult" : "#quickCalcResult";
      const historyId = compact ? "#floatingCalcHistory" : "#quickCalcHistory";
      if (!input) return;
      if (key === "clear") input.value = "";
      else if (key === "backspace") input.value = input.value.slice(0, -1);
      else if (key === "equals") calculate(compact ? "#floatingCalcExpression" : "#quickCalcExpression", resultId, historyId, true);
      else input.value += key;
      if (key !== "equals") calculate(compact ? "#floatingCalcExpression" : "#quickCalcExpression", resultId, historyId);
      input.focus();
    }

    function handleExpressionKeydown(event) {
      if (event.key !== "Enter") return;
      event.preventDefault();
      const floating = event.currentTarget.id === "floatingCalcExpression";
      calculate(
        floating ? "#floatingCalcExpression" : "#quickCalcExpression",
        floating ? "#floatingCalcResult" : "#quickCalcResult",
        floating ? "#floatingCalcHistory" : "#quickCalcHistory",
        true
      );
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
      calculate("#quickCalcExpression", "#quickCalcResult", "#quickCalcHistory");
      calculate("#floatingCalcExpression", "#floatingCalcResult", "#floatingCalcHistory");
    }

    function bindEvents() {
      $("#quickCalcKeypad").addEventListener("click", handleKeypad);
      $("#floatingCalcKeypad").addEventListener("click", handleKeypad);
      $("#quickCalcExpression").addEventListener("input", () => calculate("#quickCalcExpression", "#quickCalcResult", "#quickCalcHistory"));
      $("#floatingCalcExpression").addEventListener("input", () => calculate("#floatingCalcExpression", "#floatingCalcResult", "#floatingCalcHistory"));
      $("#quickCalcExpression").addEventListener("keydown", handleExpressionKeydown);
      $("#floatingCalcExpression").addEventListener("keydown", handleExpressionKeydown);
      $("#financeSettingsForm").addEventListener("submit", saveFinance);
      $("#quickCalculatorToggle").addEventListener("click", openFloating);
      $("#quickCalculatorClose").addEventListener("click", closeFloating);
      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") closeFloating();
      });
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
