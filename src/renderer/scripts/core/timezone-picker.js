(function () {
  function createTimezonePicker(context) {
    const { $, state, timezones, timezonesCore, i18n, escapeHtml, activeFormLanguage } = context;
    const normalizeTimezoneSearch = timezonesCore.normalizeTimezoneSearch;
    const timezoneLabel = (value, language) => timezonesCore.timezoneLabel(value, language, i18n.t);
    const timezoneOption = (value, language) => timezonesCore.timezoneOption(value, language, i18n.t);

    function pickerState(pickerId) {
      return state.timezonePickers[pickerId];
    }

    function form(pickerId) {
      return pickerId === "onboarding" ? $("#onboardingForm") : $("#settingsForm");
    }

    function elements(pickerId) {
      return {
        form: form(pickerId),
        search: document.querySelector(`[data-timezone-search="${pickerId}"]`),
        selected: document.querySelector(`[data-timezone-selected="${pickerId}"]`),
        results: document.querySelector(`[data-timezone-results="${pickerId}"]`)
      };
    }

    function buildOptions(language) {
      return [timezoneOption("local", language), ...timezones.map((timezone) => timezoneOption(timezone, language))];
    }

    function filterOptions(pickerId, language) {
      const current = pickerState(pickerId);
      const normalizedQuery = normalizeTimezoneSearch(current.searchQuery);
      const compactOffsetQuery = normalizedQuery.replace(":00", "");
      const options = buildOptions(language).filter((option) => {
        if (!normalizedQuery) return true;
        return option.searchText.includes(normalizedQuery) || option.searchText.includes(compactOffsetQuery);
      });
      current.filteredTimezoneOptions = options.slice(0, 80);
      if (current.highlightedTimezoneIndex >= current.filteredTimezoneOptions.length) {
        current.highlightedTimezoneIndex = current.filteredTimezoneOptions.length ? 0 : -1;
      }
    }

    function render(pickerId, language) {
      const current = pickerState(pickerId);
      const pickerElements = elements(pickerId);
      if (!pickerElements.form || !pickerElements.form.timezone || !pickerElements.search || !pickerElements.results) return;

      pickerElements.form.timezone.value = current.selectedTimezoneValue || "local";
      pickerElements.search.value = current.searchQuery;
      if (pickerElements.selected) pickerElements.selected.textContent = timezoneLabel(current.selectedTimezoneValue || "local", language);

      pickerElements.results.classList.toggle("open", current.isTimezoneDropdownOpen);
      pickerElements.results.innerHTML = current.filteredTimezoneOptions.length
        ? current.filteredTimezoneOptions
            .map((option, index) => {
              const active = index === current.highlightedTimezoneIndex;
              return `
                <button type="button" class="timezone-option${active ? " active" : ""}" data-timezone-picker-option="${pickerId}" data-value="${escapeHtml(option.value)}" aria-selected="${active ? "true" : "false"}">
                  <span>${escapeHtml(option.label)}</span>
                  <small>${escapeHtml(option.value)}</small>
                </button>
              `;
            })
            .join("")
        : '<p class="timezone-empty">No results</p>';
    }

    function open(pickerId) {
      const current = pickerState(pickerId);
      current.isTimezoneDropdownOpen = true;
      filterOptions(pickerId, activeFormLanguage());
      render(pickerId, activeFormLanguage());
    }

    function close(pickerId) {
      const current = pickerState(pickerId);
      current.isTimezoneDropdownOpen = false;
      current.highlightedTimezoneIndex = -1;
      render(pickerId, activeFormLanguage());
    }

    function toggle(pickerId) {
      if (pickerState(pickerId).isTimezoneDropdownOpen) {
        close(pickerId);
        return;
      }
      open(pickerId);
    }

    function renderAll(language) {
      ["onboarding", "settings"].forEach((pickerId) => {
        const pickerForm = form(pickerId);
        const current = pickerState(pickerId);
        if (!pickerForm || !pickerForm.timezone || !current) return;
        current.selectedTimezoneValue = pickerForm.timezone.value || current.selectedTimezoneValue || "local";
        current.searchQuery = "";
        filterOptions(pickerId, language);
        render(pickerId, language);
      });
    }

    function select(pickerId, value) {
      const pickerForm = form(pickerId);
      const current = pickerState(pickerId);
      current.selectedTimezoneValue = value;
      current.searchQuery = "";
      current.isTimezoneDropdownOpen = false;
      current.highlightedTimezoneIndex = -1;
      pickerForm.timezone.value = value;
      filterOptions(pickerId, pickerForm.language.value);
      render(pickerId, pickerForm.language.value);
    }

    function handleSearchInput(input) {
      const pickerId = input.dataset.timezoneSearch;
      const current = pickerState(pickerId);
      current.searchQuery = input.value;
      current.isTimezoneDropdownOpen = true;
      current.highlightedTimezoneIndex = 0;
      filterOptions(pickerId, activeFormLanguage());
      render(pickerId, activeFormLanguage());
    }

    function handleSearchKeydown(event) {
      const pickerId = event.currentTarget.dataset.timezoneSearch;
      const current = pickerState(pickerId);

      if (event.key === "ArrowDown") {
        event.preventDefault();
        if (!current.isTimezoneDropdownOpen) {
          open(pickerId);
          return;
        }
        const maxIndex = current.filteredTimezoneOptions.length - 1;
        current.highlightedTimezoneIndex = current.highlightedTimezoneIndex < maxIndex ? current.highlightedTimezoneIndex + 1 : 0;
        render(pickerId, activeFormLanguage());
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        if (!current.isTimezoneDropdownOpen) {
          open(pickerId);
          return;
        }
        const maxIndex = current.filteredTimezoneOptions.length - 1;
        current.highlightedTimezoneIndex = current.highlightedTimezoneIndex > 0 ? current.highlightedTimezoneIndex - 1 : maxIndex;
        render(pickerId, activeFormLanguage());
      }

      if (event.key === "Enter" && current.isTimezoneDropdownOpen) {
        const option = current.filteredTimezoneOptions[current.highlightedTimezoneIndex];
        if (option) {
          event.preventDefault();
          select(pickerId, option.value);
        }
      }

      if (event.key === "Escape") {
        event.preventDefault();
        close(pickerId);
      }
    }

    return {
      close,
      filterOptions,
      form,
      handleSearchInput,
      handleSearchKeydown,
      open,
      pickerState,
      render,
      renderAll,
      select,
      toggle
    };
  }

  window.CallFlowTimezonePicker = { createTimezonePicker };

  if (typeof module !== "undefined") {
    module.exports = window.CallFlowTimezonePicker;
  }
})();
