(function () {
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

  function createCalculatorView(context) {
    const { $, escapeHtml, i18n, normalizeSettings, runAction, setStatusMessage, state, storage, timers, validators: V } = context;

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
    let financeMode = "month";
    let financeAnchor = null;

    function t(key) {
      return i18n.t(key, state.settings.language || "es");
    }

    function financeSettings() {
      return {
        currency: "USD",
        hourlyRate: 0,
        paidBreaks: false,
        movementTypes: [],
        transactions: [],
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
      return hours * numberValue(config.hourlyRate);
    }

    function isoDate(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }

    function dateFromIso(value) {
      const [year, month, day] = String(value).split("-").map(Number);
      return new Date(year, month - 1, day);
    }

    function addDays(date, amount) {
      const next = new Date(date);
      next.setDate(next.getDate() + amount);
      return next;
    }

    function currentFinanceAnchor() {
      const today = new Date();
      const startDay = Math.min(28, Math.max(1, Number(state.settings.statsCycleStartDay) || 1));
      return today.getDate() < startDay
        ? new Date(today.getFullYear(), today.getMonth() - 1, 1)
        : new Date(today.getFullYear(), today.getMonth(), 1);
    }

    function cycleBounds(anchor = financeAnchor || currentFinanceAnchor()) {
      const startDay = Math.min(28, Math.max(1, Number(state.settings.statsCycleStartDay) || 1));
      if (financeMode === "year") {
        return {
          start: new Date(anchor.getFullYear(), 0, 1),
          end: new Date(anchor.getFullYear(), 11, 31)
        };
      }
      const start = new Date(anchor.getFullYear(), anchor.getMonth(), startDay);
      return { start, end: addDays(new Date(anchor.getFullYear(), anchor.getMonth() + 1, startDay), -1) };
    }

    function visibleBounds() {
      const bounds = cycleBounds();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return { ...bounds, visibleEnd: bounds.end > today ? today : bounds.end };
    }

    function transactionValue(item) {
      return item.direction === "expense" || item.type === "deduction" ? -numberValue(item.amount) : numberValue(item.amount);
    }

    function transactionsInRange(start, end) {
      const startIso = isoDate(start);
      const endIso = isoDate(end);
      return financeSettings().transactions.filter((item) => item.date >= startIso && item.date <= endIso);
    }

    function dailyAmount(date) {
      const config = financeSettings();
      const key = isoDate(date);
      const workMs = numberValue(timers.dailyWorkEntries(state.workTimer)[key]);
      const paidBreakMs = config.paidBreaks ? breakMsForDate(key) : 0;
      const movements = config.transactions.filter((item) => item.date === key).reduce((sum, item) => sum + transactionValue(item), 0);
      return ((workMs + paidBreakMs) / 3600000) * numberValue(config.hourlyRate) + movements;
    }

    function breakMsForDate(key) {
      const timezone = state.settings.statsTimezone || state.settings.timezone || "local";
      const completed = (state.workTimer?.breaks || []).reduce((sum, item) => {
        return V.isoDateInTimezone(new Date(item.startedAt), timezone) === key ? sum + numberValue(item.durationMs) : sum;
      }, 0);
      const current = state.workTimer?.currentBreakStartedAt && V.isoDateInTimezone(new Date(), timezone) === key
        ? timers.currentBreakElapsed(state.workTimer)
        : 0;
      return completed + current;
    }

    function financeSeries() {
      const { start, visibleEnd } = visibleBounds();
      if (visibleEnd < start) return [];
      if (financeMode === "year") {
        const lastMonth = visibleEnd.getFullYear() === start.getFullYear() ? visibleEnd.getMonth() : 11;
        return Array.from({ length: lastMonth + 1 }, (_item, month) => {
          const monthStart = new Date(start.getFullYear(), month, 1);
          const monthEnd = new Date(start.getFullYear(), month + 1, 0);
          const end = monthEnd > visibleEnd ? visibleEnd : monthEnd;
          let value = 0;
          for (let date = monthStart; date <= end; date = addDays(date, 1)) value += dailyAmount(date);
          return { key: isoDate(monthStart), label: monthStart.toLocaleDateString(undefined, { month: "short" }), value };
        });
      }
      const series = [];
      for (let date = start; date <= visibleEnd; date = addDays(date, 1)) {
        series.push({ key: isoDate(date), label: String(date.getDate()), value: dailyAmount(date) });
      }
      return series;
    }

    function financeRangeLabel() {
      const { start, visibleEnd } = visibleBounds();
      const options = { day: "numeric", month: "short", year: "numeric" };
      return `${start.toLocaleDateString(undefined, options)} - ${visibleEnd.toLocaleDateString(undefined, options)}`;
    }

    function renderMonthlyFinanceChart() {
      const chart = $("#monthlyFinanceChart");
      const total = $("#monthlyFinanceTotal");
      if (!chart || !total) return;
      const config = financeSettings();
      const series = financeSeries();
      const totalAmount = series.reduce((sum, item) => sum + item.value, 0);
      total.textContent = currencyFormat(totalAmount, config);
      $("#financeChartTitle").textContent = financeMode === "month" ? "Ganancias del ciclo mensual" : "Ganancias del año";
      $("#financeChartRange").textContent = `${financeRangeLabel()} · termina en el último día con datos`;
      const max = Math.max(1, ...series.map((item) => Math.abs(item.value)));
      const width = Math.max(720, series.length * (financeMode === "month" ? 32 : 58));
      const height = 230;
      const padX = 34;
      const top = 18;
      const bottom = 190;
      const hasNegative = series.some((item) => item.value < 0);
      const baseline = hasNegative ? 106 : bottom;
      const usableWidth = width - padX * 2;
      const points = series.map((item, index) => {
        const x = padX + (index / Math.max(1, series.length - 1)) * usableWidth;
        const availableHeight = hasNegative ? 76 : 150;
        const y = baseline - (item.value / max) * availableHeight;
        return { ...item, x, y };
      });
      const line = points.map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ");
      const fill = points.length ? `${padX},${baseline} ${line} ${points[points.length - 1].x},${baseline}` : "";
      const labels = points
        .map((point) => `<text x="${point.x.toFixed(1)}" y="218">${escapeHtml(point.label)}</text>`)
        .join("");
      const grid = Array.from({ length: 5 }, (_item, index) => {
        const y = top + (index / 4) * (bottom - top);
        return `<line x1="${padX}" y1="${y}" x2="${width - padX}" y2="${y}" class="finance-chart-grid"></line>`;
      }).join("");
      const verticalGrid = points.map((point) => `<line x1="${point.x}" y1="${top}" x2="${point.x}" y2="${bottom}" class="finance-chart-grid vertical"></line>`).join("");
      const dots = points.map((point) => `
        <circle cx="${point.x.toFixed(1)}" cy="${point.y.toFixed(1)}" r="5" class="finance-chart-point${point.value ? " is-active" : ""}" tabindex="0" data-finance-point="${escapeHtml(point.key)}" data-finance-value="${point.value}">
          <title>${escapeHtml(`${point.key}: ${currencyFormat(point.value, config)}`)}</title>
        </circle>`).join("");
      chart.innerHTML = `
        <svg viewBox="0 0 ${width} ${height}" style="min-width:${width}px" role="img" aria-label="${escapeHtml(currencyFormat(totalAmount, config))}">
          <g>${grid}${verticalGrid}</g>
          <line x1="${padX}" y1="${baseline}" x2="${width - padX}" y2="${baseline}" class="finance-chart-axis"></line>
          ${fill ? `<polyline points="${fill}" class="finance-chart-fill"></polyline>` : ""}
          ${line ? `<polyline points="${line}" class="finance-chart-line"></polyline>` : ""}
          <g>${dots}</g>
          <g class="finance-chart-labels">${labels}</g>
        </svg>
        <output class="finance-chart-tooltip hidden" id="financeChartTooltip"></output>
      `;
    }

    function renderFinanceForm() {
      const config = financeSettings();
      const bounds = visibleBounds();
      const workMs = Object.entries(timers.dailyWorkEntries(state.workTimer)).reduce((sum, [date, duration]) => {
        const parsed = dateFromIso(date);
        return parsed >= bounds.start && parsed <= bounds.visibleEnd ? sum + numberValue(duration) : sum;
      }, 0);
      let paidBreakMs = 0;
      if (config.paidBreaks) {
        for (let date = new Date(bounds.start); date <= bounds.visibleEnd; date = addDays(date, 1)) paidBreakMs += breakMsForDate(isoDate(date));
      }
      $("#financeConfigSummary").textContent = `${config.currency} · ${currencyFormat(config.hourlyRate, config)} por hora · ciclo desde el día ${state.settings.statsCycleStartDay || 1} · ${config.paidBreaks ? i18n.t("financePaidBreaks", state.settings.language) : i18n.t("financeUnpaidBreaks", state.settings.language)}`;
      $("#financePreview").textContent = currencyFormat(((workMs + paidBreakMs) / 3600000) * config.hourlyRate, config);
      const transactionForm = $("#financeTransactionForm");
      transactionForm.date.max = isoDate(new Date());
      if (!transactionForm.date.value || transactionForm.date.value > transactionForm.date.max) transactionForm.date.value = transactionForm.date.max;
      const selectedType = transactionForm.type.value;
      transactionForm.type.innerHTML = config.movementTypes
        .map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.label)}</option>`)
        .join("");
      if (config.movementTypes.some((item) => item.id === selectedType)) transactionForm.type.value = selectedType;
      const monthPicker = $("#financeMonthPicker");
      const anchor = financeAnchor || currentFinanceAnchor();
      monthPicker.value = `${anchor.getFullYear()}-${String(anchor.getMonth() + 1).padStart(2, "0")}`;
      const currentAnchor = currentFinanceAnchor();
      monthPicker.max = `${currentAnchor.getFullYear()}-${String(currentAnchor.getMonth() + 1).padStart(2, "0")}`;
      $("#financeYearPicker").value = String(anchor.getFullYear());
      $("#financeYearPicker").max = String(new Date().getFullYear());
      $("#financePeriodNext").disabled = financeMode === "month"
        ? anchor >= currentAnchor
        : anchor.getFullYear() >= new Date().getFullYear();
      monthPicker.classList.toggle("hidden", financeMode !== "month");
      $("#financeYearPicker").classList.toggle("hidden", financeMode !== "year");
      document.querySelectorAll("[data-finance-mode]").forEach((button) => button.classList.toggle("active", button.dataset.financeMode === financeMode));
      const movements = transactionsInRange(bounds.start, bounds.visibleEnd).sort((a, b) => b.date.localeCompare(a.date));
      $("#financeMovementCount").textContent = String(movements.length);
      $("#financeMovementsRange").textContent = financeRangeLabel();
      $("#financeTransactionList").innerHTML = movements.length
        ? movements.map((item) => `<div class="finance-transaction-item"><span><strong>${escapeHtml(item.label || config.movementTypes.find((type) => type.id === item.type)?.label || item.type)}</strong><small>${escapeHtml(item.date)}${item.note ? ` · ${escapeHtml(item.note)}` : ""}</small></span><b class="${item.direction === "expense" || item.type === "deduction" ? "negative" : "positive"}">${item.direction === "expense" || item.type === "deduction" ? "−" : "+"}${escapeHtml(currencyFormat(item.amount, config))}</b><button type="button" data-delete-finance="${escapeHtml(item.id)}" aria-label="Eliminar movimiento">×</button></div>`).join("")
        : `<p class="muted finance-empty">${escapeHtml(t("financeNoMovements"))}</p>`;
      $("#financeMovementTypeList").innerHTML = config.movementTypes.map((item) => `
        <span class="finance-movement-type-chip">
          <b>${escapeHtml(item.label)}</b><small>${item.direction === "expense" ? "−" : "+"}</small>
          <button type="button" data-delete-finance-type="${escapeHtml(item.id)}" aria-label="Eliminar tipo">×</button>
        </span>`).join("");
      renderMonthlyFinanceChart();
    }

    async function saveFinanceTransaction(event) {
      event.preventDefault();
      const form = event.currentTarget;
      const config = financeSettings();
      const movementType = config.movementTypes.find((item) => item.id === form.type.value) || config.movementTypes[0];
      const transaction = {
        id: crypto.randomUUID ? crypto.randomUUID() : `finance-${Date.now()}`,
        date: form.date.value,
        type: movementType.id,
        label: movementType.label,
        direction: movementType.direction,
        amount: numberValue(form.amount.value),
        note: String(form.note.value || "").trim(),
        createdAt: new Date().toISOString()
      };
      if (!transaction.date || transaction.amount <= 0) return;
      const financial = { ...config, transactions: [...config.transactions, transaction] };
      state.settings = normalizeSettings({ ...state.settings, financial });
      await runAction(async () => {
        await storage.write("settings", state.settings);
        form.amount.value = "";
        form.note.value = "";
        render();
        setStatusMessage("Movimiento financiero agregado", "success");
      });
    }

    async function deleteFinanceTransaction(id) {
      const config = financeSettings();
      const financial = { ...config, transactions: config.transactions.filter((item) => item.id !== id) };
      state.settings = normalizeSettings({ ...state.settings, financial });
      await runAction(async () => {
        await storage.write("settings", state.settings);
        render();
        setStatusMessage("Movimiento eliminado", "success");
      });
    }

    async function addFinanceMovementType(event) {
      event.preventDefault();
      const form = event.currentTarget;
      const config = financeSettings();
      const label = String(form.label.value || "").trim();
      if (!label) return;
      const type = {
        id: `movement-${Date.now()}`,
        label,
        direction: form.direction.value === "expense" ? "expense" : "income",
        locked: false
      };
      state.settings = normalizeSettings({
        ...state.settings,
        financial: { ...config, movementTypes: [...config.movementTypes, type] }
      });
      await runAction(async () => {
        await storage.write("settings", state.settings);
        form.reset();
        render();
        setStatusMessage("Tipo de movimiento agregado", "success");
      });
    }

    async function deleteFinanceMovementType(id) {
      const config = financeSettings();
      if (config.movementTypes.length <= 1) {
        setStatusMessage("Debe quedar al menos un tipo de movimiento", "warning");
        return;
      }
      state.settings = normalizeSettings({
        ...state.settings,
        financial: { ...config, movementTypes: config.movementTypes.filter((item) => item.id !== id) }
      });
      await runAction(async () => {
        await storage.write("settings", state.settings);
        render();
      });
    }

    function openFinanceMovements() {
      renderFinanceForm();
      $("#financeMovementsModal").classList.remove("hidden");
    }

    function closeFinanceMovements() {
      $("#financeTypesModal").classList.add("hidden");
      $("#financeMovementsModal").classList.add("hidden");
    }

    function openFinanceTypes() {
      $("#financeTypesModal").classList.remove("hidden");
      $("#financeMovementTypeForm").querySelector("input[name='label']").focus();
    }

    function closeFinanceTypes() {
      $("#financeTypesModal").classList.add("hidden");
    }

    function shiftFinancePeriod(direction) {
      const anchor = financeAnchor || currentFinanceAnchor();
      financeAnchor = financeMode === "month"
        ? new Date(anchor.getFullYear(), anchor.getMonth() + direction, 1)
        : new Date(anchor.getFullYear() + direction, 0, 1);
      const currentAnchor = financeMode === "month" ? currentFinanceAnchor() : new Date().getFullYear();
      if (financeMode === "month" && financeAnchor > currentAnchor) financeAnchor = currentAnchor;
      if (financeMode === "year" && financeAnchor.getFullYear() > currentAnchor) financeAnchor = new Date(currentAnchor, 0, 1);
      renderFinanceForm();
    }

    function showChartPoint(target) {
      const point = target.closest("[data-finance-point]");
      if (!point) return;
      const tooltip = $("#financeChartTooltip");
      tooltip.textContent = `${point.dataset.financePoint}: ${currencyFormat(point.dataset.financeValue)}`;
      tooltip.classList.remove("hidden");
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
      renderMonthlyFinanceChart();
    }

    function bindEvents() {
      $("#quickCalcKeypad").addEventListener("click", handleKeypad);
      $("#floatingCalcKeypad").addEventListener("click", handleKeypad);
      $("#quickCalcExpression").addEventListener("input", () => calculate("#quickCalcExpression", "#quickCalcResult", "#quickCalcHistory"));
      $("#floatingCalcExpression").addEventListener("input", () => calculate("#floatingCalcExpression", "#floatingCalcResult", "#floatingCalcHistory"));
      $("#quickCalcExpression").addEventListener("keydown", handleExpressionKeydown);
      $("#floatingCalcExpression").addEventListener("keydown", handleExpressionKeydown);
      $("#financeTransactionForm").addEventListener("submit", saveFinanceTransaction);
      $("#financeTransactionList").addEventListener("click", (event) => {
        const button = event.target.closest("[data-delete-finance]");
        if (button) deleteFinanceTransaction(button.dataset.deleteFinance);
      });
      $("#financeMovementTypeForm").addEventListener("submit", addFinanceMovementType);
      $("#financeMovementTypeList").addEventListener("click", (event) => {
        const button = event.target.closest("[data-delete-finance-type]");
        if (button) deleteFinanceMovementType(button.dataset.deleteFinanceType);
      });
      $("#openFinanceMovements").addEventListener("click", openFinanceMovements);
      $("#closeFinanceMovements").addEventListener("click", closeFinanceMovements);
      $("#openFinanceTypeEditor").addEventListener("click", openFinanceTypes);
      $("#closeFinanceTypes").addEventListener("click", closeFinanceTypes);
      $("#financeMovementsModal").addEventListener("click", (event) => {
        if (event.target.id === "financeMovementsModal") closeFinanceMovements();
      });
      $("#financeTypesModal").addEventListener("click", (event) => {
        if (event.target.id === "financeTypesModal") closeFinanceTypes();
      });
      $("#monthlyFinanceChart").addEventListener("click", (event) => showChartPoint(event.target));
      $("#monthlyFinanceChart").addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") showChartPoint(event.target);
      });
      document.querySelectorAll("[data-finance-mode]").forEach((button) => button.addEventListener("click", () => {
        financeMode = button.dataset.financeMode;
        financeAnchor = null;
        renderFinanceForm();
      }));
      $("#financePeriodPrevious").addEventListener("click", () => shiftFinancePeriod(-1));
      $("#financePeriodNext").addEventListener("click", () => shiftFinancePeriod(1));
      $("#financeMonthPicker").addEventListener("change", (event) => {
        const [year, month] = event.target.value.split("-").map(Number);
        if (year && month) financeAnchor = new Date(year, month - 1, 1);
        const currentAnchor = currentFinanceAnchor();
        if (financeAnchor > currentAnchor) financeAnchor = currentAnchor;
        renderFinanceForm();
      });
      $("#financeYearPicker").addEventListener("change", (event) => {
        const year = Math.min(new Date().getFullYear(), Number(event.target.value) || new Date().getFullYear());
        financeAnchor = new Date(year, 0, 1);
        renderFinanceForm();
      });
      $("#quickCalculatorToggle").addEventListener("click", openFloating);
      $("#quickCalculatorClose").addEventListener("click", closeFloating);
      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
          closeFloating();
          if (!$("#financeTypesModal").classList.contains("hidden")) closeFinanceTypes();
          else closeFinanceMovements();
        }
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

  const api = { createCalculatorView, normalizeExpression, isPendingExpression, evaluateExpression };

  if (typeof window !== "undefined") {
    window.CallFlowCalculatorView = api;
  }

  if (typeof module !== "undefined") {
    module.exports = api;
  }
})();
