(function () {
  function compactDuration(ms) {
    const units = [
      ["mes", "meses", 30 * 24 * 60 * 60 * 1000],
      ["sem", "sems", 7 * 24 * 60 * 60 * 1000],
      ["d", "d", 24 * 60 * 60 * 1000],
      ["h", "h", 60 * 60 * 1000],
      ["min", "min", 60 * 1000],
      ["s", "s", 1000]
    ];
    let remaining = Math.max(0, Math.floor(ms));
    const parts = [];
    for (const [singular, plural, size] of units) {
      const value = Math.floor(remaining / size);
      if (!value && parts.length === 0 && size > 60 * 1000) continue;
      if (value || parts.length) {
        if (!value && parts.length) continue;
        parts.push(`${value}${value === 1 ? singular : plural}`);
        remaining -= value * size;
      }
      if (parts.length >= 2) break;
    }
    return parts.length ? parts.join(" ") : "0s";
  }

  function reminderDueDate(reminder, validators, settings) {
    return validators.reminderDueDate(reminder, settings) || new Date(8640000000000000);
  }

  function sortedReminders(reminders, dueDateFn = (reminder) => reminderDueDate(reminder, {}, {})) {
    return [...reminders].sort((a, b) => {
      const dueDiff = dueDateFn(a) - dueDateFn(b);
      if (dueDiff !== 0) return dueDiff;
      return String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
    });
  }

  function alarmPhaseLabel(phase, t) {
    if (phase === "early") return t("alarmEarly");
    if (phase === "overdue") return t("alarmOverdue");
    return t("alarmNow");
  }

  function reminderStatusKey(reminder, today, validators, settings) {
    if (reminder.status === "deleted") return "deleted";
    if (!validators.reminderDueDate(reminder, settings) && reminder.status !== "completed") return "invalid";
    if (reminder.status === "completed") return "completed";
    if (reminder.status === "overdue") return "overdue";
    if (reminder.status === "invalid") return "invalid";
    if (today && reminder.dueAt) {
      const dueTime = new Date(reminder.dueAt).getTime();
      const todayTime = today instanceof Date ? today.getTime() : new Date(today).getTime();
      if (Number.isFinite(dueTime) && Number.isFinite(todayTime)) {
        return dueTime < todayTime ? "overdue" : "pending";
      }
    }
    return "pending";
  }

  function reminderRepeatLabel(reminder, t) {
    const repeat = reminder.repeat || "once";
    const labels = {
      once: t("repeatOnce"),
      daily: t("repeatDaily"),
      weekdays: t("repeatWeekdays"),
      weekly: t("repeatWeekly"),
      monthly: t("repeatMonthly")
    };
    return labels[repeat] || labels.once;
  }

  function reminderStatusLabel(reminder, t, today, validators, settings) {
    const key = reminderStatusKey(reminder, today, validators, settings);
    const labels = {
      completed: t("reminderCompleted"),
      overdue: t("reminderOverdue"),
      invalid: t("reminderInvalid"),
      pending: t("reminderPending"),
      deleted: t("reminderDeletedLabel")
    };
    return labels[key];
  }

  function nextRecurringReminder(reminder, recurrence, options) {
    return recurrence.nextRecurringReminder(reminder, options);
  }

  function createRemindersView(context) {
    const {
      $,
      activeTimezones,
      addDaysIso,
      currentDateInputValue,
      currentTimeInputValue,
      escapeHtml,
      i18n,
      normalizeSettings,
      recurrence,
      renderApp,
      renderReminderTimezoneSelectors,
      runAction,
      setStatusMessage,
      setView,
      state,
      storage,
      timezoneFlag,
      validators: V
    } = context;

    function reminderCountdownLabel(reminder) {
      if (reminder.status === "completed") return "Completado";
      if (reminder.status === "deleted") {
        if (reminder.deletedAt) {
          const delDate = new Date(reminder.deletedAt);
          const day = String(delDate.getDate()).padStart(2, "0");
          const month = String(delDate.getMonth() + 1).padStart(2, "0");
          const hours = String(delDate.getHours()).padStart(2, "0");
          const minutes = String(delDate.getMinutes()).padStart(2, "0");
          const label = i18n.t("deletedAtLabel", state.settings.language || "es");
          return `${label} ${day}.${month} ${hours}:${minutes}`;
        }
        return i18n.t("reminderDeletedLabel", state.settings.language || "es");
      }
      const due = reminderDueDate(reminder, V, state.settings);
      const diff = due - new Date();
      if (diff < 0) return `Vencido hace ${compactDuration(Math.abs(diff))}`;
      return `Faltan ${compactDuration(diff)}`;
    }

    function reminderStatusLabelView(reminder) {
      return reminderStatusLabel(reminder, (key) => i18n.t(key, state.settings.language || "es"), new Date(), V, state.settings);
    }

    function reminderRepeatLabelView(reminder) {
      return reminderRepeatLabel(reminder, (key) => i18n.t(key, state.settings.language || "es"));
    }

    function reminderTimezoneLabel(reminder) {
      const timezone = reminder.timezone || V.resolveTimezone(state.settings);
      return `${timezoneFlag(timezone)} ${timezone}`;
    }

    function getActiveReminderFilter() {
      const active = document.querySelector(".reminder-chip.reminder-chip--active");
      return active ? active.dataset.filter : "all";
    }

    function setReminderFilter(filterValue) {
      if (filterValue === "range" && !state.reminderRange.from && !state.reminderRange.to) {
        const timezone = V.resolveTimezone(state.settings);
        const today = currentDateInputValue(timezone);
        state.reminderRange = { from: today, to: today };
      }
      document.querySelectorAll(".reminder-chip").forEach((btn) => {
        btn.classList.toggle("reminder-chip--active", btn.dataset.filter === filterValue);
      });
      renderApp();
    }

    function renderReminderRangeFields(filter) {
      const fields = $("#reminderRangeFields");
      const fromInput = $("#reminderDateFrom");
      const toInput = $("#reminderDateTo");
      if (!fields || !fromInput || !toInput) return;
      const range = state.reminderRange || { from: "", to: "" };
      fields.classList.toggle("hidden", filter !== "range");
      fromInput.value = range.from || "";
      toInput.value = range.to || "";
    }

    function renderReminders() {
      const filter = getActiveReminderFilter();
      renderReminderRangeFields(filter);
      const reminders = sortedReminders(window.CallFlowReminders.filterReminders(state.reminders, filter, state.settings, {
        range: state.reminderRange
      }), (reminder) => reminderDueDate(reminder, V, state.settings));
      $("#reminderList").innerHTML = reminders.length
        ? reminders
          .map((reminder) => `
            <article class="list-item reminder-item reminder-${reminderStatusKey(reminder, new Date(), V, state.settings)}">
              <div class="reminder-main">
                <p class="reminder-title">${escapeHtml(reminder.note)}</p>
                <div class="reminder-details">
                  <span>${escapeHtml(reminder.date)} ${escapeHtml(reminder.time)}</span>
                  <span class="reminder-timezone">${escapeHtml(reminderTimezoneLabel(reminder))}</span>
                  <span>${escapeHtml(reminderRepeatLabelView(reminder))}</span>
                </div>
              </div>
              <div class="reminder-meta">
                <span class="reminder-state">${escapeHtml(reminderStatusLabelView(reminder))}</span>
                <span class="reminder-countdown">${escapeHtml(reminderCountdownLabel(reminder))}</span>
              </div>
              ${
                reminder.callId
                  ? `<div class="reminder-id-row">
                      <button type="button" class="icon-button" data-copy-reminder-call-id="${escapeHtml(reminder.callId)}" title="${escapeHtml(i18n.t("copyCallId", state.settings.language || "es"))}">⇩</button>
                      <span class="reminder-id" title="${escapeHtml(reminder.callId)}">ID: ${escapeHtml(reminder.callId)}</span>
                    </div>`
                  : ""
              }
              <div class="reminder-actions">
                ${
                  reminderStatusKey(reminder, new Date(), V, state.settings) === "deleted"
                    ? `
                        <button type="button" data-restore-reminder="${reminder.id}">${escapeHtml(i18n.t("restoreReminder", state.settings.language || "es"))}</button>
                        <button type="button" class="icon-button danger ghost-danger" data-permanent-delete-reminder="${reminder.id}" title="${escapeHtml(i18n.t("permanentDeleteReminder", state.settings.language || "es"))}">🗑</button>
                      `
                    : `
                        <button type="button" class="icon-button" data-edit-reminder="${reminder.id}" title="${escapeHtml(i18n.t("editReminder", state.settings.language || "es"))}">✎</button>
                        ${
                          reminderStatusKey(reminder, new Date(), V, state.settings) === "completed"
                            ? `<span class="tag reminder-completed-label">${escapeHtml(i18n.t("reminderCompleted", state.settings.language || "es"))}</span>`
                            : `<button type="button" data-complete-reminder="${reminder.id}">${escapeHtml(i18n.t("completeReminder", state.settings.language || "es"))}</button>`
                        }
                        <button type="button" class="icon-button danger ghost-danger" data-delete-reminder="${reminder.id}" title="${escapeHtml(i18n.t("deleteReminder", state.settings.language || "es"))}">🗑</button>
                      `
                }
              </div>
            </article>
          `)
          .join("")
        : '<p class="muted">No hay recordatorios en esta vista.</p>';
    }

    function prepareFormDefaults(options = {}) {
      const form = $("#reminderForm");
      if (!form) return;
      if (state.editingReminderId) return;
      const dashboardCallId = $("#callForm input[name='callId']")?.value.trim();
      const lastCallId = state.lastCall?.callId || "";
      if (!form.callId.value && (dashboardCallId || lastCallId)) {
        form.callId.value = dashboardCallId || lastCallId;
      }
      renderReminderTimezoneSelectors();
      if (form.timezone && !form.timezone.value) {
        form.timezone.value = state.settings.lastReminderTimezone || activeTimezones()[0] || state.settings.timezone;
      }
      const timezone = form.timezone?.value || state.settings.lastReminderTimezone || activeTimezones()[0] || state.settings.timezone;
      if (options.refreshDate || !form.date.value) form.date.value = currentDateInputValue(timezone);
      if (!form.time.value) form.time.value = currentTimeInputValue(timezone);
      if (!form.repeat.value) form.repeat.value = "once";
    }

    function cancelEdit() {
      state.editingReminderId = null;
      const form = $("#reminderForm");
      form.reset();
      $("#cancelReminderEdit").classList.add("hidden");
      $("#saveReminderButton").textContent = i18n.t("saveReminder", state.settings.language || "es");
      prepareFormDefaults();
    }

    function renderFormVisibility() {
      const panel = $("#reminderCreatePanel");
      const showButton = $("#showReminderForm");
      const toggleButton = $("#toggleReminderForm");
      if (!panel || !showButton || !toggleButton) return;
      panel.classList.toggle("hidden", state.reminderFormCollapsed);
      showButton.classList.toggle("hidden", !state.reminderFormCollapsed);
      toggleButton.textContent = "▴";
      toggleButton.title = i18n.t("hide", state.settings?.language || "es");
      toggleButton.setAttribute("aria-label", i18n.t("hide", state.settings?.language || "es"));
    }

    function setFormCollapsed(collapsed) {
      state.reminderFormCollapsed = collapsed;
      renderFormVisibility();
      if (!collapsed) prepareFormDefaults({ refreshDate: true });
    }

    function editReminder(id) {
      const reminder = state.reminders.find((item) => item.id === id);
      if (!reminder) return;
      setFormCollapsed(false);
      state.editingReminderId = id;
      const form = $("#reminderForm");
      form.callId.value = reminder.callId || "";
      form.date.value = reminder.date || currentDateInputValue();
      form.time.value = reminder.time || currentTimeInputValue();
      form.repeat.value = reminder.repeat || "once";
      form.note.value = reminder.note || "";
      $("#cancelReminderEdit").classList.remove("hidden");
      $("#saveReminderButton").textContent = i18n.t("updateReminder", state.settings.language || "es");
      form.callId.focus();
    }

    async function saveReminder(event) {
      event.preventDefault();
      const form = event.currentTarget;
      const existingReminder = state.reminders.find((reminder) => reminder.id === state.editingReminderId);
      const reminderTimezone = existingReminder?.timezone || form.timezone?.value || state.settings.lastReminderTimezone || activeTimezones()[0] || V.resolveTimezone(state.settings);
      const validation = V.validateReminderPayload({
        callId: form.callId.value.trim(),
        date: form.date.value,
        time: form.time.value,
        repeat: form.repeat.value || "once",
        note: form.note.value.trim(),
        timezone: reminderTimezone
      });
      if (!validation.ok) {
        setStatusMessage(i18n.t(validation.messageKey, state.settings.language || "es"), "error");
        return;
      }
      const reminderPayload = validation.value;
      let nextReminders;
      if (state.editingReminderId) {
        nextReminders = state.reminders.map((reminder) =>
          reminder.id === state.editingReminderId
            ? { ...reminder, ...reminderPayload, updatedAt: new Date().toISOString() }
            : reminder
        );
      } else {
        nextReminders = [...state.reminders, {
          id: crypto.randomUUID(),
          ...reminderPayload,
          status: "pending",
          createdAt: new Date().toISOString()
        }];
      }
      await runAction(
        async () => {
          await storage.write("reminders", nextReminders);
          if (!existingReminder) {
            state.settings = normalizeSettings({ ...state.settings, lastReminderTimezone: reminderPayload.timezone });
            await storage.write("settings", state.settings);
          }
          state.reminders = nextReminders;
          state.editingReminderId = null;
          $("#cancelReminderEdit").classList.add("hidden");
          $("#saveReminderButton").textContent = i18n.t("saveReminder", state.settings.language || "es");
          form.reset();
          prepareFormDefaults();
          renderApp();
          setStatusMessage(i18n.t("reminderSaved", state.settings.language || "es"), "success");
        },
        { userMessage: i18n.t("saveFailed", state.settings.language || "es"), logMessage: "Failed to save reminder" }
      );
    }

    async function copyReminderCallId(callId) {
      if (!callId) return;
      await runAction(() => window.callflow.copyText(callId));
    }

    function setDateShortcut(shortcut) {
      const form = $("#reminderForm");
      const timezone = form.timezone?.value || state.settings.lastReminderTimezone || activeTimezones()[0] || state.settings.timezone;
      let date = V.isoDateInTimezone(new Date(), timezone);
      if (shortcut === "tomorrow") date = addDaysIso(date, 1);
      if (shortcut === "nextWeek") date = addDaysIso(date, 7);
      form.date.value = date;
      form.time.focus();
    }

    function playTone(audioContext, frequency, start, duration, type = "sine", gainValue = 0.08) {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(gainValue, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start(start);
      oscillator.stop(start + duration + 0.02);
    }

    function playReminderSound(sound) {
      if (sound === "none") return;
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const audioContext = new AudioContext();
      const now = audioContext.currentTime;
      const patterns = {
        soft: [[660, 0, 0.16, "sine"], [880, 0.18, 0.18, "sine"]],
        ping: [[1046, 0, 0.12, "triangle"]],
        bell: [[784, 0, 0.16, "sine"], [1175, 0.1, 0.22, "sine"], [1568, 0.18, 0.28, "sine"]],
        alert: [[523, 0, 0.16, "square"], [523, 0.22, 0.16, "square"], [523, 0.44, 0.2, "square"]],
        chime: [[523, 0, 0.14, "triangle"], [659, 0.12, 0.14, "triangle"], [784, 0.24, 0.22, "triangle"]]
      };
      (patterns[sound] || patterns.soft).forEach(([frequency, offset, duration, type]) => {
        playTone(audioContext, frequency, now + offset, duration, type);
      });
      setTimeout(() => audioContext.close(), 1200);
    }

    function stopAlarmSound() {
      if (state.alarmSoundTimer) {
        clearInterval(state.alarmSoundTimer);
        state.alarmSoundTimer = null;
      }
      state.activeAlarmSoundKey = null;
    }

    function startAlarmSound(sound, reminderId, phase) {
      const soundKey = `${reminderId}:${phase}:${sound}`;
      if (state.activeAlarmSoundKey === soundKey) return;
      stopAlarmSound();
      state.activeAlarmSoundKey = soundKey;
      if (sound === "none") return;
      playReminderSound(sound);
      state.alarmSoundTimer = setInterval(() => playReminderSound(sound), 8000);
    }

    function activeAlarmReminder() {
      return state.reminders.find((reminder) => reminder.id === state.activeAlarmReminderId) || null;
    }

    function renderAlarm() {
      const overlay = $("#reminderAlarmOverlay");
      if (!overlay) return;
      const reminder = activeAlarmReminder();
      if (!reminder || reminder.status === "completed") {
        overlay.classList.add("hidden");
        stopAlarmSound();
        return;
      }
      overlay.classList.remove("hidden");
      $("#reminderAlarmPhase").textContent = alarmPhaseLabel(state.activeAlarmPhase, (key) => i18n.t(key, state.settings.language || "es"));
      $("#reminderAlarmTitle").textContent = i18n.t("alarmTitle", state.settings.language || "es");
      $("#reminderAlarmMeta").textContent = [
        reminder.date,
        reminder.time,
        reminder.timezone || V.resolveTimezone(state.settings),
        reminder.callId ? `ID: ${reminder.callId}` : ""
      ]
        .filter(Boolean)
        .join(" - ");
      $("#reminderAlarmNote").textContent = reminder.note || "";
    }

    function clearAlarm() {
      state.activeAlarmReminderId = null;
      state.activeAlarmPhase = null;
      $("#reminderAlarmOverlay").classList.add("hidden");
      stopAlarmSound();
    }

    function handleAlarm(payload) {
      if (!payload || !payload.reminder || !payload.reminder.id) return;
      const current = state.reminders.find((reminder) => reminder.id === payload.reminder.id);
      if (!current || current.status === "completed") return;
      state.reminders = state.reminders.map((reminder) =>
        reminder.id === payload.reminder.id ? { ...reminder, ...payload.reminder } : reminder
      );
      state.activeAlarmReminderId = payload.reminder.id;
      state.activeAlarmPhase = payload.phase || "exact";
      renderAlarm();
      startAlarmSound(state.settings.reminderSound || "soft", payload.reminder.id, state.activeAlarmPhase);
    }

    async function updateReminderSuppression(id, fields) {
      const nextReminders = state.reminders.map((reminder) =>
        reminder.id === id ? { ...reminder, ...fields, updatedAt: new Date().toISOString() } : reminder
      );
      await runAction(async () => {
        await storage.write("reminders", nextReminders);
        state.reminders = nextReminders;
        clearAlarm();
        renderApp();
      });
    }

    async function snoozeActiveAlarm(minutes) {
      const reminder = activeAlarmReminder();
      if (!reminder) return;
      await updateReminderSuppression(reminder.id, {
        snoozedUntil: new Date(Date.now() + minutes * 60 * 1000).toISOString(),
        mutedUntil: null
      });
    }

    async function muteActiveAlarm(minutes) {
      const reminder = activeAlarmReminder();
      if (!reminder) return;
      await updateReminderSuppression(reminder.id, {
        mutedUntil: new Date(Date.now() + minutes * 60 * 1000).toISOString()
      });
    }

    async function completeActiveAlarm() {
      const reminder = activeAlarmReminder();
      if (!reminder) return;
      clearAlarm();
      await completeReminder(reminder.id);
    }

    function openFromNotification(reminderId) {
      setView("reminders");
      if (reminderId) editReminder(reminderId);
    }

    function nextRecurringReminderView(reminder) {
      return nextRecurringReminder(reminder, recurrence, {
        createId: () => crypto.randomUUID(),
        now: new Date(),
        resolveTimezone: () => V.resolveTimezone(state.settings),
        zonedDateTimeToUtc: V.zonedDateTimeToUtc
      });
    }

    async function completeReminder(id) {
      const current = state.reminders.find((reminder) => reminder.id === id);
      const next = current ? nextRecurringReminderView(current) : null;
      if (state.activeAlarmReminderId === id) clearAlarm();
      const nextReminders = state.reminders.map((reminder) =>
        reminder.id === id ? { ...reminder, status: "completed", completedAt: new Date().toISOString() } : reminder
      );
      if (next) nextReminders.push(next);
      await runAction(async () => {
        await storage.write("reminders", nextReminders);
        state.reminders = nextReminders;
        renderApp();
      });
    }

    async function deleteReminder(id) {
      const language = state.settings.language || "es";
      if (!window.confirm(i18n.t("confirmDeleteReminder", language))) return;
      if (state.activeAlarmReminderId === id) clearAlarm();
      const nextReminders = state.reminders.map((reminder) =>
        reminder.id === id ? { ...reminder, status: "deleted", deletedAt: new Date().toISOString() } : reminder
      );
      await runAction(async () => {
        await storage.write("reminders", nextReminders);
        state.reminders = nextReminders;
        renderApp();
        setStatusMessage(i18n.t("saved", language), "success");
      });
    }

    async function restoreReminder(id) {
      const language = state.settings.language || "es";
      const nextReminders = state.reminders.map((reminder) =>
        reminder.id === id ? { ...reminder, status: "pending", deletedAt: undefined } : reminder
      );
      await runAction(async () => {
        await storage.write("reminders", nextReminders);
        state.reminders = nextReminders;
        renderApp();
        setStatusMessage(i18n.t("saved", language), "success");
      });
    }

    async function permanentDeleteReminder(id) {
      const language = state.settings.language || "es";
      if (!window.confirm(i18n.t("confirmPermanentDeleteReminder", language))) return;
      const nextReminders = state.reminders.filter((reminder) => reminder.id !== id);
      await runAction(async () => {
        await storage.write("reminders", nextReminders);
        state.reminders = nextReminders;
        renderApp();
        setStatusMessage(i18n.t("saved", language), "success");
      });
    }

    function handleDocumentClick(event) {
      const reminderId = event.target.dataset.completeReminder;
      const reminderCallId = event.target.dataset.copyReminderCallId;
      const editReminderId = event.target.dataset.editReminder;
      const deleteReminderId = event.target.closest("[data-delete-reminder]")?.dataset.deleteReminder;
      const restoreReminderId = event.target.closest("[data-restore-reminder]")?.dataset.restoreReminder;
      const permanentDeleteReminderId = event.target.closest("[data-permanent-delete-reminder]")?.dataset.permanentDeleteReminder;
      const reminderDateShortcut = event.target.dataset.reminderDateShortcut;
      if (reminderId) completeReminder(reminderId);
      if (reminderCallId) copyReminderCallId(reminderCallId);
      if (editReminderId) editReminder(editReminderId);
      if (deleteReminderId) deleteReminder(deleteReminderId);
      if (restoreReminderId) restoreReminder(restoreReminderId);
      if (permanentDeleteReminderId) permanentDeleteReminder(permanentDeleteReminderId);
      if (reminderDateShortcut) setDateShortcut(reminderDateShortcut);
    }

    function render() {
      renderReminders();
      renderFormVisibility();
      renderAlarm();
    }

    function bindEvents() {
      $("#previewReminderSound").addEventListener("click", () => {
        playReminderSound($("#settingsForm select[name='reminderSound']").value);
      });
      $("#completeReminderAlarm").addEventListener("click", completeActiveAlarm);
      $("#snoozeReminderAlarm5").addEventListener("click", () => snoozeActiveAlarm(5));
      $("#snoozeReminderAlarm15").addEventListener("click", () => snoozeActiveAlarm(15));
      $("#silenceReminderAlarm").addEventListener("click", () => muteActiveAlarm(30));
      $("#dismissReminderAlarm").addEventListener("click", () => muteActiveAlarm(5));
      $("#reminderForm").addEventListener("submit", saveReminder);
      $("#cancelReminderEdit").addEventListener("click", cancelEdit);
      $("#toggleReminderForm").addEventListener("click", () => setFormCollapsed(true));
      $("#showReminderForm").addEventListener("click", () => setFormCollapsed(false));
      document.querySelector(".reminder-chips")?.addEventListener("click", (event) => {
        const chip = event.target.closest(".reminder-chip");
        if (chip) setReminderFilter(chip.dataset.filter);
      });
      $("#reminderDateFrom").addEventListener("change", (event) => {
        state.reminderRange.from = event.target.value;
        setReminderFilter("range");
      });
      $("#reminderDateTo").addEventListener("change", (event) => {
        state.reminderRange.to = event.target.value;
        setReminderFilter("range");
      });
    }

    return {
      bindEvents,
      clearAlarm,
      handleAlarm,
      handleDocumentClick,
      openFromNotification,
      playReminderSound,
      prepareFormDefaults,
      render,
      renderReminders
    };
  }

  const api = {
    alarmPhaseLabel,
    compactDuration,
    createRemindersView,
    nextRecurringReminder,
    reminderDueDate,
    reminderRepeatLabel,
    reminderStatusKey,
    reminderStatusLabel,
    sortedReminders
  };

  if (typeof window !== "undefined") {
    window.CallFlowRemindersView = api;
  }

  if (typeof module !== "undefined") {
    module.exports = api;
  }
})();
