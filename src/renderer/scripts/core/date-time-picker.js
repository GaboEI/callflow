(function () {
  function createDateTimePicker(context) {
    const { $, $$, state, validators: V, localeForLanguage, escapeHtml, activeTimezones } = context;

    function parseIsoDateParts(value) {
      const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (!match) return null;
      const year = Number(match[1]);
      const month = Number(match[2]) - 1;
      const day = Number(match[3]);
      if (month < 0 || month > 11 || day < 1 || day > 31) return null;
      return { year, month, day };
    }

    function parseTimeParts(value) {
      const match = String(value || "").match(/^(\d{2}):(\d{2})$/);
      if (!match) return null;
      const hour = Number(match[1]);
      const minute = Number(match[2]);
      if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
      return { hour, minute };
    }

    function isoFromParts(year, month, day) {
      return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }

    function isoTime(value) {
      const parts = parseIsoDateParts(value);
      return parts ? Date.UTC(parts.year, parts.month, parts.day) : null;
    }

    function compareIso(a, b) {
      const aTime = isoTime(a);
      const bTime = isoTime(b);
      if (aTime === null || bTime === null) return 0;
      return aTime - bTime;
    }

    function orderedRange(from, to) {
      if (!from && !to) return { from: "", to: "" };
      const start = from || to;
      const end = to || from;
      return compareIso(start, end) <= 0 ? { from: start, to: end } : { from: end, to: start };
    }

    function inputTimezone(input) {
      const form = input?.form;
      if (!form) return state.settings || "local";
      if (input.name === "date" || input.name === "time") {
        return form.timezone?.value || state.settings?.lastReminderTimezone || activeTimezones()[0] || state.settings?.timezone || "local";
      }
      if (input.name === "callbackDate" || input.name === "callbackTime") {
        return form.callbackTimezone?.value || state.settings?.lastReminderTimezone || activeTimezones()[0] || state.settings?.timezone || "local";
      }
      return state.settings || "local";
    }

    function currentPickerDateParts(input) {
      const existing = parseIsoDateParts(input.value);
      if (existing) return existing;
      const current = V.isoDateInTimezone(new Date(), inputTimezone(input));
      return parseIsoDateParts(current) || parseIsoDateParts(new Date().toISOString().slice(0, 10));
    }

    function currentPickerTimeParts(input) {
      const existing = parseTimeParts(input.value);
      if (existing) return existing;
      return parseTimeParts(V.timeInTimezone(new Date(), inputTimezone(input))) || { hour: 0, minute: 0 };
    }

    function setPickerInputValue(input, value) {
      input.value = value;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }

    function monthName(month) {
      const language = state.settings?.language || "es";
      const label = new Intl.DateTimeFormat(localeForLanguage(language), { month: "long" })
        .format(new Date(Date.UTC(2026, month, 1)));
      return label.charAt(0).toUpperCase() + label.slice(1);
    }

    function weekdayLabels() {
      const language = state.settings?.language || "es";
      const monday = new Date(Date.UTC(2026, 5, 15));
      return Array.from({ length: 7 }, (_item, index) =>
        new Intl.DateTimeFormat(localeForLanguage(language), { weekday: "short" })
          .format(new Date(monday.getTime() + index * 86400000))
          .slice(0, 2)
      );
    }

    function sameIsoDay(parts, year, month, day) {
      return parts && parts.year === year && parts.month === month && parts.day === day;
    }

    function sameIsoValue(value, year, month, day) {
      const parts = parseIsoDateParts(value);
      return sameIsoDay(parts, year, month, day);
    }

    function isInRange(value, from, to) {
      if (!value || !from || !to) return false;
      return compareIso(value, from) >= 0 && compareIso(value, to) <= 0;
    }

    function pickerText(key) {
      const language = state.settings?.language || "es";
      const labels = {
        es: {
          previousMonth: "Mes anterior",
          nextMonth: "Mes siguiente",
          month: "Mes",
          year: "Año",
          exactMinute: "Minuto exacto",
          dateRange: "Rango de fechas",
          cancel: "Cancelar",
          apply: "OK"
        },
        en: {
          previousMonth: "Previous month",
          nextMonth: "Next month",
          month: "Month",
          year: "Year",
          exactMinute: "Exact minute",
          dateRange: "Date range",
          cancel: "Cancel",
          apply: "OK"
        },
        ru: {
          previousMonth: "Предыдущий месяц",
          nextMonth: "Следующий месяц",
          month: "Месяц",
          year: "Год",
          exactMinute: "Точная минута",
          dateRange: "Диапазон дат",
          cancel: "Отмена",
          apply: "OK"
        }
      };
      return (labels[language] || labels.es)[key] || key;
    }

    function displayDate(value) {
      const parts = parseIsoDateParts(value);
      if (!parts) return "";
      const language = state.settings?.language || "es";
      return new Intl.DateTimeFormat(localeForLanguage(language), {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      }).format(new Date(Date.UTC(parts.year, parts.month, parts.day)));
    }

    function displayRange(from, to) {
      const range = orderedRange(from, to);
      if (!range.from && !range.to) return pickerText("dateRange");
      if (range.from === range.to) return displayDate(range.from);
      return `${displayDate(range.from)} - ${displayDate(range.to)}`;
    }

    function datePickerDays(year, month) {
      const firstDay = new Date(Date.UTC(year, month, 1)).getUTCDay();
      const leadingDays = (firstDay + 6) % 7;
      const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
      const daysInPreviousMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
      const cells = [];

      for (let index = leadingDays - 1; index >= 0; index -= 1) {
        cells.push({ year, month: month - 1, day: daysInPreviousMonth - index, muted: true });
      }
      for (let day = 1; day <= daysInMonth; day += 1) {
        cells.push({ year, month, day, muted: false });
      }
      while (cells.length % 7 !== 0 || cells.length < 42) {
        const nextDay = cells.filter((cell) => cell.month === month + 1).length + 1;
        cells.push({ year, month: month + 1, day: nextDay, muted: true });
      }

      return cells.map((cell) => {
        const normalized = new Date(Date.UTC(cell.year, cell.month, cell.day));
        return {
          year: normalized.getUTCFullYear(),
          month: normalized.getUTCMonth(),
          day: normalized.getUTCDate(),
          muted: cell.muted
        };
      });
    }

    function findAssociatedTimeInput(input) {
      const form = input.form;
      if (!form || input.type !== "date") return null;
      if (input.name === "callbackDate") return form.callbackTime || null;
      if (input.name === "date") return form.time || null;
      return null;
    }

    function position() {
      const input = state.dateTimePicker.input;
      const picker = $("#dateTimePicker");
      if (!input || !picker || picker.classList.contains("hidden")) return;

      const anchor = state.dateTimePicker.anchor || input;
      const rect = anchor.getBoundingClientRect();
      const width = Math.min(368, Math.max(292, Math.floor(window.innerWidth - 24)));
      picker.style.width = `${width}px`;
      const pickerHeight = picker.offsetHeight || 360;
      const preferredTop = rect.bottom + 8;
      const top = preferredTop + pickerHeight > window.innerHeight - 12
        ? Math.max(12, rect.top - pickerHeight - 8)
        : preferredTop;
      const left = Math.min(Math.max(12, rect.left), window.innerWidth - width - 12);
      picker.style.top = `${top}px`;
      picker.style.left = `${left}px`;
    }

    function rangeState() {
      const pickerState = state.dateTimePicker;
      const fromInput = pickerState.rangeFromInput;
      const toInput = pickerState.rangeToInput;
      const start = pickerState.rangeStart || fromInput?.value || "";
      const end = pickerState.rangeEnd || toInput?.value || start;
      return orderedRange(start, end);
    }

    function render() {
      const picker = $("#dateTimePicker");
      const pickerState = state.dateTimePicker;
      const input = pickerState.input;
      if (!picker || !input || !pickerState.mode) return;

      picker.classList.remove("hidden");
      picker.dataset.mode = pickerState.mode;

      if (pickerState.mode === "date" || pickerState.mode === "range") {
        const selected = parseIsoDateParts(input.value);
        const today = parseIsoDateParts(V.isoDateInTimezone(new Date(), inputTimezone(input)));
        const selectedRange = pickerState.mode === "range" ? rangeState() : null;
        const weekdays = weekdayLabels().map((day) => `<span>${escapeHtml(day)}</span>`).join("");
        const monthOptions = Array.from({ length: 12 }, (_item, month) =>
          `<option value="${month}" ${pickerState.month === month ? "selected" : ""}>${escapeHtml(monthName(month))}</option>`
        ).join("");
        const days = datePickerDays(pickerState.year, pickerState.month)
          .map((cell) => {
            const dateValue = isoFromParts(cell.year, cell.month, cell.day);
            const classes = [
              "cf-picker-day",
              cell.muted ? "is-muted" : "",
              pickerState.mode === "range" && isInRange(dateValue, selectedRange.from, selectedRange.to) ? "is-range" : "",
              pickerState.mode === "range" && sameIsoValue(selectedRange.from, cell.year, cell.month, cell.day) ? "is-range-start is-selected" : "",
              pickerState.mode === "range" && sameIsoValue(selectedRange.to, cell.year, cell.month, cell.day) ? "is-range-end is-selected" : "",
              pickerState.mode !== "range" && sameIsoDay(selected, cell.year, cell.month, cell.day) ? "is-selected" : "",
              sameIsoDay(today, cell.year, cell.month, cell.day) ? "is-today" : ""
            ].filter(Boolean).join(" ");
            return `<button type="button" class="${classes}" data-cf-picker-date="${dateValue}">${cell.day}</button>`;
          })
          .join("");

        picker.innerHTML = `
          <div class="cf-picker-header">
            <button type="button" class="icon-button" data-cf-picker-month="-1" aria-label="${escapeHtml(pickerText("previousMonth"))}">‹</button>
            <div class="cf-picker-month-year">
              <select data-cf-picker-month-select aria-label="${escapeHtml(pickerText("month"))}">${monthOptions}</select>
              <input type="number" data-cf-picker-year-input aria-label="${escapeHtml(pickerText("year"))}" min="1900" max="2200" value="${pickerState.year}" />
            </div>
            <button type="button" class="icon-button" data-cf-picker-month="1" aria-label="${escapeHtml(pickerText("nextMonth"))}">›</button>
          </div>
          <div class="cf-picker-weekdays">${weekdays}</div>
          <div class="cf-picker-calendar">${days}</div>
          ${pickerState.mode === "range" ? `
            <div class="cf-picker-range-footer">
              <strong>${escapeHtml(displayRange(selectedRange.from, selectedRange.to))}</strong>
              <div class="cf-picker-range-actions">
                <button type="button" class="cf-picker-cancel" data-cf-picker-cancel-range aria-label="${escapeHtml(pickerText("cancel"))}">×</button>
                <button type="button" class="cf-picker-apply" data-cf-picker-apply-range aria-label="${escapeHtml(pickerText("apply"))}">✓</button>
              </div>
            </div>
          ` : ""}
        `;
      } else {
        const hourButtons = Array.from({ length: 24 }, (_item, hour) => {
          const value = String(hour).padStart(2, "0");
          const selected = pickerState.hour === hour ? " is-selected" : "";
          return `<button type="button" class="cf-picker-cell${selected}" data-cf-picker-hour="${hour}">${value}</button>`;
        }).join("");
        const minuteButtons = Array.from({ length: 12 }, (_item, index) => index * 5).map((minute) => {
          const value = String(minute).padStart(2, "0");
          const selected = pickerState.minute === minute ? " is-selected" : "";
          return `<button type="button" class="cf-picker-cell${selected}" data-cf-picker-minute="${minute}">${value}</button>`;
        }).join("");

        picker.innerHTML = `
          <div class="cf-picker-header">
            <button type="button" class="icon-button${pickerState.step === "hour" ? " is-selected" : ""}" data-cf-picker-step="hour">HH</button>
            <strong>${String(pickerState.hour).padStart(2, "0")}:${String(pickerState.minute).padStart(2, "0")}</strong>
            <button type="button" class="icon-button${pickerState.step === "minute" ? " is-selected" : ""}" data-cf-picker-step="minute">MM</button>
          </div>
          ${
            pickerState.step === "hour"
              ? `<div class="cf-picker-grid hours">${hourButtons}</div>`
              : `
                <div class="cf-picker-grid minutes">${minuteButtons}</div>
                <div class="cf-picker-exact-minute">
                  <label>
                    <span>${escapeHtml(pickerText("exactMinute"))}</span>
                    <div class="cf-exact-minute-control">
                      <input id="exactMinuteInput" type="number" min="0" max="59" inputmode="numeric" value="${String(pickerState.minute).padStart(2, "0")}" />
                      <div class="cf-minute-stepper" aria-label="${escapeHtml(pickerText("exactMinute"))}">
                        <button type="button" data-cf-picker-minute-step="1" aria-label="+1">⌃</button>
                        <button type="button" data-cf-picker-minute-step="-1" aria-label="-1">⌄</button>
                      </div>
                    </div>
                  </label>
                  <button type="button" data-cf-picker-apply-minute>${escapeHtml(pickerText("apply"))}</button>
                </div>
              `
          }
        `;
      }

      position();
    }

    function close() {
      const picker = $("#dateTimePicker");
      if (picker) picker.classList.add("hidden");
      state.dateTimePicker.input = null;
      state.dateTimePicker.anchor = null;
      state.dateTimePicker.mode = null;
      state.dateTimePicker.rangeFromInput = null;
      state.dateTimePicker.rangeToInput = null;
      state.dateTimePicker.rangeStart = "";
      state.dateTimePicker.rangeEnd = "";
      state.dateTimePicker.rangeSelectingEnd = false;
    }

    function open(input) {
      if (!input || !["date", "time"].includes(input.type)) return;
      enhanceInputs();
      state.dateTimePicker.input = input;
      state.dateTimePicker.mode = input.type;

      if (input.type === "date") {
        const parts = currentPickerDateParts(input);
        state.dateTimePicker.step = "date";
        state.dateTimePicker.year = parts.year;
        state.dateTimePicker.month = parts.month;
      } else {
        const parts = currentPickerTimeParts(input);
        state.dateTimePicker.step = "hour";
        state.dateTimePicker.hour = parts.hour;
        state.dateTimePicker.minute = parts.minute;
      }

      render();
    }

    function openRange(fromInput, toInput, anchor = null) {
      if (!fromInput || !toInput) return;
      enhanceInputs();
      const range = orderedRange(fromInput.value, toInput.value);
      const parts = parseIsoDateParts(range.from || range.to) || currentPickerDateParts(fromInput);
      state.dateTimePicker.input = fromInput;
      state.dateTimePicker.anchor = anchor || fromInput;
      state.dateTimePicker.mode = "range";
      state.dateTimePicker.step = "date";
      state.dateTimePicker.year = parts.year;
      state.dateTimePicker.month = parts.month;
      state.dateTimePicker.rangeFromInput = fromInput;
      state.dateTimePicker.rangeToInput = toInput;
      state.dateTimePicker.rangeStart = range.from || isoFromParts(parts.year, parts.month, parts.day);
      state.dateTimePicker.rangeEnd = range.to || state.dateTimePicker.rangeStart;
      state.dateTimePicker.rangeSelectingEnd = false;
      render();
    }

    function commitDate(value) {
      const input = state.dateTimePicker.input;
      if (!input) return;
      setPickerInputValue(input, value);
      const associatedTimeInput = findAssociatedTimeInput(input);
      close();
      if (associatedTimeInput) {
        setTimeout(() => {
          associatedTimeInput.focus();
          open(associatedTimeInput);
        }, 0);
      }
    }

    function selectRangeDate(value) {
      const pickerState = state.dateTimePicker;
      if (!pickerState.rangeSelectingEnd) {
        pickerState.rangeStart = value;
        pickerState.rangeEnd = value;
        pickerState.rangeSelectingEnd = true;
      } else {
        const range = orderedRange(pickerState.rangeStart, value);
        pickerState.rangeStart = range.from;
        pickerState.rangeEnd = range.to;
        pickerState.rangeSelectingEnd = false;
      }
      const parts = parseIsoDateParts(value);
      if (parts) {
        pickerState.year = parts.year;
        pickerState.month = parts.month;
      }
      render();
    }

    function commitRange() {
      const pickerState = state.dateTimePicker;
      const fromInput = pickerState.rangeFromInput;
      const toInput = pickerState.rangeToInput;
      if (!fromInput || !toInput) return;
      const range = orderedRange(pickerState.rangeStart, pickerState.rangeEnd || pickerState.rangeStart);
      setPickerInputValue(fromInput, range.from);
      setPickerInputValue(toInput, range.to);
      close();
      enhanceInputs();
    }

    function commitTime(minute) {
      const input = state.dateTimePicker.input;
      if (!input) return;
      const normalizedMinute = Math.min(59, Math.max(0, Number(minute) || 0));
      state.dateTimePicker.minute = normalizedMinute;
      setPickerInputValue(
        input,
        `${String(state.dateTimePicker.hour).padStart(2, "0")}:${String(normalizedMinute).padStart(2, "0")}`
      );
      close();
    }

    function shiftMonth(direction) {
      const date = new Date(Date.UTC(state.dateTimePicker.year, state.dateTimePicker.month + direction, 1));
      state.dateTimePicker.year = date.getUTCFullYear();
      state.dateTimePicker.month = date.getUTCMonth();
      render();
    }

    function setMonth(month) {
      const nextMonth = Math.min(11, Math.max(0, Number(month)));
      if (Number.isNaN(nextMonth)) return;
      state.dateTimePicker.month = nextMonth;
      render();
    }

    function setYear(year) {
      const nextYear = Math.min(2200, Math.max(1900, Number(year)));
      if (Number.isNaN(nextYear)) return;
      state.dateTimePicker.year = nextYear;
      render();
    }

    function exactMinuteInputValue() {
      const input = $("#exactMinuteInput");
      return Math.min(59, Math.max(0, Number(input?.value) || 0));
    }

    function nudgeExactMinute(delta) {
      const input = $("#exactMinuteInput");
      if (!input) return;
      const nextMinute = (exactMinuteInputValue() + delta + 60) % 60;
      input.value = String(nextMinute).padStart(2, "0");
      state.dateTimePicker.minute = nextMinute;
      render();
    }

    function handleClick(event) {
      const monthButton = event.target.closest("[data-cf-picker-month]");
      const dateButton = event.target.closest("[data-cf-picker-date]");
      const stepButton = event.target.closest("[data-cf-picker-step]");
      const hourButton = event.target.closest("[data-cf-picker-hour]");
      const minuteButton = event.target.closest("[data-cf-picker-minute]");
      const minuteStepButton = event.target.closest("[data-cf-picker-minute-step]");
      const applyMinute = event.target.closest("[data-cf-picker-apply-minute]");
      const applyRange = event.target.closest("[data-cf-picker-apply-range]");
      const cancelRange = event.target.closest("[data-cf-picker-cancel-range]");

      if (monthButton) shiftMonth(Number(monthButton.dataset.cfPickerMonth));
      if (dateButton) {
        if (state.dateTimePicker.mode === "range") selectRangeDate(dateButton.dataset.cfPickerDate);
        else commitDate(dateButton.dataset.cfPickerDate);
      }
      if (stepButton) {
        state.dateTimePicker.step = stepButton.dataset.cfPickerStep;
        render();
      }
      if (hourButton) {
        state.dateTimePicker.hour = Number(hourButton.dataset.cfPickerHour);
        state.dateTimePicker.step = "minute";
        render();
      }
      if (minuteButton) commitTime(Number(minuteButton.dataset.cfPickerMinute));
      if (minuteStepButton) nudgeExactMinute(Number(minuteStepButton.dataset.cfPickerMinuteStep));
      if (applyMinute) commitTime($("#exactMinuteInput")?.value);
      if (applyRange) commitRange();
      if (cancelRange) close();
    }

    function handleChange(event) {
      const monthSelect = event.target.closest("[data-cf-picker-month-select]");
      const yearInput = event.target.closest("[data-cf-picker-year-input]");
      const exactMinuteInput = event.target.closest("#exactMinuteInput");
      if (monthSelect) setMonth(monthSelect.value);
      if (yearInput) setYear(yearInput.value);
      if (exactMinuteInput) {
        exactMinuteInput.value = String(exactMinuteInputValue()).padStart(2, "0");
        state.dateTimePicker.minute = exactMinuteInputValue();
      }
    }

    function handleGlobalKeydown(event) {
      if (event.target.matches("[data-cf-picker-year-input]") && event.key === "Enter") {
        event.preventDefault();
        setYear(event.target.value);
      }
      if (event.target.matches("#exactMinuteInput") && event.key === "Enter") {
        event.preventDefault();
        commitTime(event.target.value);
      }
      if (event.key === "Escape") close();
    }

    function enhanceInputs() {
      $$("input[type='date'], input[type='time']").forEach((input) => {
        if (input.dataset.callflowDateTime === "true") return;
        input.dataset.callflowDateTime = "true";
        input.classList.add("cf-datetime-input");
        input.readOnly = true;
        input.autocomplete = "off";
        input.addEventListener("focus", () => open(input));
        input.addEventListener("click", () => open(input));
        input.addEventListener("keydown", (event) => {
          if (["Enter", " ", "ArrowDown"].includes(event.key)) {
            event.preventDefault();
            open(input);
          }
          if (event.key === "Escape") close();
        });
      });
      enhanceRangeInputs();
    }

    function rangePairs() {
      return [
        { id: "report", from: $("#reportDateFrom"), to: $("#reportDateTo") },
        { id: "reminder", from: $("#reminderDateFrom"), to: $("#reminderDateTo") },
        { id: "stats", from: $("#statsDateFrom"), to: $("#statsDateTo") }
      ].filter((pair) => pair.from && pair.to);
    }

    function rangeIsVisible(fromInput, toInput) {
      const fromHidden = fromInput.closest("label")?.classList.contains("hidden") || fromInput.closest(".reminder-range-fields")?.classList.contains("hidden");
      const toHidden = toInput.closest("label")?.classList.contains("hidden") || toInput.closest(".reminder-range-fields")?.classList.contains("hidden");
      return !fromHidden && !toHidden;
    }

    function syncRangeButton(button, fromInput, toInput) {
      button.querySelector("[data-cf-range-label]").textContent = displayRange(fromInput.value, toInput.value);
      button.classList.toggle("hidden", !rangeIsVisible(fromInput, toInput));
    }

    function enhanceRangeInputs() {
      rangePairs().forEach(({ id, from, to }) => {
        const fromLabel = from.closest("label");
        const toLabel = to.closest("label");
        if (!fromLabel || !toLabel) return;

        fromLabel.classList.add("cf-range-native-field");
        toLabel.classList.add("cf-range-native-field");

        let button = document.querySelector(`[data-cf-date-range-trigger="${id}"]`);
        if (!button) {
          button = document.createElement("button");
          button.type = "button";
          button.className = "cf-date-range-trigger cf-datetime-input";
          button.dataset.cfDateRangeTrigger = id;
          button.innerHTML = `
            <span class="cf-date-range-caption">${escapeHtml(pickerText("dateRange"))}</span>
            <strong data-cf-range-label></strong>
          `;
          fromLabel.parentNode.insertBefore(button, fromLabel);
          button.addEventListener("click", () => openRange(from, to, button));
          button.addEventListener("keydown", (event) => {
            if (["Enter", " ", "ArrowDown"].includes(event.key)) {
              event.preventDefault();
              openRange(from, to, button);
            }
            if (event.key === "Escape") close();
          });
        }
        syncRangeButton(button, from, to);
      });
    }

    return {
      close,
      enhanceInputs,
      handleChange,
      handleClick,
      handleGlobalKeydown,
      open,
      position
    };
  }

  window.CallFlowDateTimePicker = { createDateTimePicker };

  if (typeof module !== "undefined") {
    module.exports = window.CallFlowDateTimePicker;
  }
})();
