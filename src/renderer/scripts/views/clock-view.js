(function () {
  function createClockView(context) {
    const {
      $,
      escapeHtml,
      i18n,
      localeForLanguage,
      normalizeSettings,
      normalizeWorkTimer,
      runAction,
      state,
      storage,
      timers,
      timezoneFlag,
      shortTimezoneName,
      validators: V
    } = context;

    function activeTimezones() {
      return V.uniqueItems(state.settings.activeTimezones?.length ? state.settings.activeTimezones : [state.settings.timezone || "local"]).slice(
        0,
        V.MAX_ACTIVE_TIMEZONES
      );
    }

    function pinnedClockTimezones() {
      const zones = activeTimezones();
      return (state.settings.pinnedClockTimezones || []).filter((timezone) => zones.includes(timezone));
    }

    async function updatePinnedClockTimezones(timezones) {
      const zones = activeTimezones();
      state.settings = normalizeSettings({
        ...state.settings,
        pinnedClockTimezones: V.uniqueItems(timezones).filter((timezone) => zones.includes(timezone))
      });
      await runAction(async () => {
        await storage.write("settings", state.settings);
        renderWorkClock();
      });
    }

    async function togglePinnedClock(timezone) {
      const pinned = pinnedClockTimezones();
      await updatePinnedClockTimezones(
        pinned.includes(timezone) ? pinned.filter((item) => item !== timezone) : [...pinned, timezone]
      );
    }

    function formatWorkClockForTimezone(date, timezone) {
      const format = state.settings.clockFormat || "24h";

      if (format === "military") {
        const parts = new Intl.DateTimeFormat("en-GB", {
          timeZone: V.resolveTimezone(timezone),
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false
        }).formatToParts(date);
        const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
        return `${values.hour}${values.minute}${values.second}`;
      }

      return new Intl.DateTimeFormat(localeForLanguage(state.settings.language), {
        timeZone: V.resolveTimezone(timezone),
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: format === "12h"
      }).format(date);
    }

    function renderClockPanel(now = new Date()) {
      const panel = $("#clockPanel");
      const toggle = $("#clockPanelToggle");
      if (!panel || !toggle || !state.settings) return;
      const pinned = new Set(pinnedClockTimezones());
      const zones = activeTimezones();
      toggle.textContent = zones.length > 1 ? `${pinned.size}/${zones.length} ⌄` : "⌄";
      panel.innerHTML = `
        <header>
          <strong>${escapeHtml(i18n.t("allClocks", state.settings.language || "es"))}</strong>
        </header>
        <div class="clock-panel-list">
          ${zones
            .map((timezone) => {
              const isPinned = pinned.has(timezone);
              return `
                <button type="button" class="clock-panel-item${isPinned ? " pinned" : ""}" data-toggle-pinned-clock="${escapeHtml(timezone)}" title="${escapeHtml(i18n.t(isPinned ? "unpinClock" : "pinClock", state.settings.language || "es"))}">
                  <span>${escapeHtml(`${timezoneFlag(timezone)} ${shortTimezoneName(timezone)}`)}</span>
                  <strong>${escapeHtml(formatWorkClockForTimezone(now, timezone))}</strong>
                  <small aria-hidden="true">📌</small>
                </button>
              `;
            })
            .join("")}
        </div>
      `;
    }

    function renderWorkClock() {
      const clock = $("#workClock");
      if (!clock || !state.settings) return;
      const now = new Date();
      const pinned = pinnedClockTimezones();
      clock.innerHTML = pinned.length
        ? pinned
          .map((timezone) => {
            const flag = timezoneFlag(timezone);
            const label = shortTimezoneName(timezone);
            const value = formatWorkClockForTimezone(now, timezone);
            return `<span class="clock-chip" title="${escapeHtml(timezone)}"><small><span class="clock-flag">${escapeHtml(flag)}</span><span>${escapeHtml(label)}</span></small><strong>${escapeHtml(value)}</strong></span>`;
          })
          .join("")
        : `<span class="clock-empty">${escapeHtml(i18n.t("noPinnedClocks", state.settings.language || "es"))}</span>`;
      renderClockPanel(now);
    }

    function currentWorkElapsed(now = Date.now()) {
      return timers.currentWorkElapsed(state.workTimer, now);
    }

    function currentWorkDayKey(date = new Date()) {
      return V.isoDateInTimezone(date, state.settings);
    }

    function ensureTodayWorkTimer(now = new Date()) {
      const dayKey = currentWorkDayKey(now);
      const next = timers.ensureDailyWorkTimer(state.workTimer, dayKey, now);
      if (
        next.dailyWorkDate !== state.workTimer?.dailyWorkDate ||
        next.dailyWorkElapsedMs !== state.workTimer?.dailyWorkElapsedMs ||
        next.dailyWorkStartedAt !== state.workTimer?.dailyWorkStartedAt
      ) {
        state.workTimer = next;
      }
      return next;
    }

    function currentDailyWorkElapsed(now = Date.now()) {
      return timers.currentDailyWorkElapsed(state.workTimer, now);
    }

    function renderShiftTimer() {
      const now = new Date();
      const timer = ensureTodayWorkTimer(now);
      const wrapper = $("#shiftTimer");
      const label = $("#shiftTimerLabel");
      const value = $("#shiftTimerValue");
      const button = $("#shiftTimerToggle");
      const stopButton = $("#shiftTimerStop");
      if (!wrapper || !label || !value || !button || !stopButton || !state.settings) return;

      const language = state.settings.language || "es";
      const paused = timer.status === "paused";
      const working = timer.status === "working";
      const stopped = timer.status === "stopped";
      wrapper.classList.toggle("paused", paused);
      wrapper.classList.toggle("working", working);
      wrapper.classList.toggle("stopped", stopped);
      label.textContent = i18n.t("workTodayTimer", language);
      value.textContent = timers.formatDuration(currentDailyWorkElapsed(now.getTime()));
      button.textContent = working ? "⏸" : "▶";
      button.setAttribute(
        "aria-label",
        i18n.t(
          working ? "pauseWorkTimer" : timer.status === "paused" || stopped ? "resumeWorkTimer" : "startWorkTimer",
          language
        )
      );
      button.title = button.getAttribute("aria-label");
      stopButton.disabled = stopped || timer.status === "idle";
      stopButton.setAttribute("aria-label", i18n.t("pauseAllTimer", language));
      stopButton.title = stopButton.getAttribute("aria-label");
    }

    async function persistWorkTimer() {
      state.workTimer = ensureTodayWorkTimer();
      await storage.write("workTimer", state.workTimer);
    }

    async function persistActiveTimerSnapshot() {
      const now = new Date();
      const timer = ensureTodayWorkTimer(now);
      if (timer.status === "working" && timer.workStartedAt) {
        state.workTimer = {
          ...timer,
          workElapsedMs: currentWorkElapsed(now.getTime()),
          workStartedAt: now.toISOString(),
          dailyWorkElapsedMs: currentDailyWorkElapsed(now.getTime()),
          dailyWorkStartedAt: now.toISOString()
        };
        await persistWorkTimer();
      } else if (timer.status === "paused" && timer.currentBreakStartedAt) {
        state.workTimer = timer;
        await persistWorkTimer();
      }
    }

    async function toggleShiftTimer() {
      const now = new Date();
      state.workTimer = timers.toggleShiftTimer(state.workTimer, now, currentWorkDayKey(now));
      await persistWorkTimer();
      renderShiftTimer();
    }

    async function stopShiftTimer() {
      const timer = normalizeWorkTimer(state.workTimer);
      if (timer.status === "idle" || timer.status === "stopped") return;
      const now = new Date();
      state.workTimer = timers.freezeWorkTimer(timer, now, currentWorkDayKey(now));
      await persistWorkTimer();
      renderShiftTimer();
    }

    async function freezeAndPersistTimerOnUnload() {
      const timer = normalizeWorkTimer(state.workTimer);
      if (!["working", "paused"].includes(timer.status)) return;
      const now = new Date();
      state.workTimer = timers.freezeWorkTimer(timer, now, currentWorkDayKey(now));
      await persistWorkTimer();
    }

    function startClock() {
      if (state.clockTimer) clearInterval(state.clockTimer);
      if (state.timerPersistTimer) clearInterval(state.timerPersistTimer);
      renderWorkClock();
      renderShiftTimer();
      state.clockTimer = setInterval(() => {
        renderWorkClock();
        renderShiftTimer();
      }, 1000);
      state.timerPersistTimer = setInterval(() => {
        persistActiveTimerSnapshot().catch((error) => console.error("Timer snapshot failed", error));
      }, 10000);
    }

    function render() {
      renderWorkClock();
      renderShiftTimer();
    }

    function bindEvents() {
      $("#shiftTimerToggle").addEventListener("click", toggleShiftTimer);
      $("#shiftTimerStop").addEventListener("click", stopShiftTimer);
      $("#clockPanelToggle").addEventListener("click", () => {
        $("#clockPanel").classList.toggle("hidden");
      });
    }

    function closePanelIfOutside(target) {
      if (!target.closest("#workClockShell")) {
        $("#clockPanel").classList.add("hidden");
      }
    }

    return {
      activeTimezones,
      bindEvents,
      closePanelIfOutside,
      freezeAndPersistTimerOnUnload,
      persistWorkTimer,
      render,
      renderWorkClock,
      startClock,
      togglePinnedClock
    };
  }

  window.CallFlowClockView = { createClockView };
})();
