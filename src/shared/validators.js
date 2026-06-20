(function () {
  const outcomes = typeof require === "function" ? require("./outcomes") : window.CallFlowOutcomes;

  const LIMITS = {
    callId: 120,
    shortText: 120,
    mediumText: 240,
    noteTitle: 160,
    noteContent: 20000,
    reportHeader: 300
  };
  const MAX_ACTIVE_TIMEZONES = 10;

  const repeatValues = new Set(["once", "daily", "weekdays", "weekly", "monthly"]);
  const languages = new Set(["es", "en", "ru"]);
  const linePrefixModes = new Set(["hash", "none", "dailyNumber"]);
  const clockFormats = new Set(["24h", "12h", "military"]);
  const reminderSounds = new Set(["soft", "ping", "bell", "alert", "chime", "none"]);
  const reminderStatuses = new Set(["pending", "overdue", "completed", "deleted"]);

  function isPlainObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }

  function text(value, max = LIMITS.mediumText) {
    return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
  }

  function multilineText(value, max = LIMITS.noteContent) {
    return String(value || "").replace(/\r\n/g, "\n").slice(0, max);
  }

  function uniqueItems(value, maxItemLength = LIMITS.shortText) {
    const items = Array.isArray(value) ? value : String(value || "").split(/\n|,/);
    const seen = new Set();
    return items
      .map((item) => text(item, maxItemLength))
      .filter((item) => {
        const key = item.toLowerCase();
        if (!item || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }

  function validIsoDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) return false;
    const [year, month, day] = String(value).split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  }

  function validTime(value) {
    const match = String(value || "").match(/^(\d{2}):(\d{2})$/);
    if (!match) return false;
    const hour = Number(match[1]);
    const minute = Number(match[2]);
    return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
  }

  function resolveTimezone(settingsOrTimezone) {
    const timezone =
      typeof settingsOrTimezone === "string"
        ? settingsOrTimezone
        : settingsOrTimezone && settingsOrTimezone.timezone;
    if (!timezone || timezone === "local") {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    }
    return timezone;
  }

  function dateTimePartsInZone(date, timezone) {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: resolveTimezone(timezone),
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    }).formatToParts(date);
    return Object.fromEntries(parts.map((part) => [part.type, part.value]));
  }

  function isoDateInTimezone(date = new Date(), settingsOrTimezone = "local") {
    const parts = dateTimePartsInZone(date, settingsOrTimezone);
    return `${parts.year}-${parts.month}-${parts.day}`;
  }

  function timeInTimezone(date = new Date(), settingsOrTimezone = "local") {
    const parts = dateTimePartsInZone(date, settingsOrTimezone);
    return `${parts.hour}:${parts.minute}`;
  }

  function zonedDateTimeToUtc(dateValue, timeValue, settingsOrTimezone = "local") {
    if (!validIsoDate(dateValue) || !validTime(timeValue)) return null;
    const timezone = resolveTimezone(settingsOrTimezone);
    const [year, month, day] = String(dateValue).split("-").map(Number);
    const [hour, minute] = String(timeValue).split(":").map(Number);
    let utcMs = Date.UTC(year, month - 1, day, hour, minute, 0, 0);

    for (let index = 0; index < 3; index += 1) {
      const parts = dateTimePartsInZone(new Date(utcMs), timezone);
      const renderedMs = Date.UTC(
        Number(parts.year),
        Number(parts.month) - 1,
        Number(parts.day),
        Number(parts.hour),
        Number(parts.minute),
        Number(parts.second || 0),
        0
      );
      const targetMs = Date.UTC(year, month - 1, day, hour, minute, 0, 0);
      const diff = targetMs - renderedMs;
      if (diff === 0) break;
      utcMs += diff;
    }

    const result = new Date(utcMs);
    const check = dateTimePartsInZone(result, timezone);
    if (`${check.year}-${check.month}-${check.day}` !== dateValue || `${check.hour}:${check.minute}` !== timeValue) {
      return null;
    }
    return result;
  }

  function reminderDueDate(reminder, settingsOrTimezone) {
    if (reminder && validIsoDateTime(reminder.dueAt)) return new Date(reminder.dueAt);
    if (!validIsoDate(reminder && reminder.date)) return null;
    const time = validTime(reminder.time) ? reminder.time : "00:00";
    return zonedDateTimeToUtc(reminder.date, time, reminder.timezone || settingsOrTimezone || "local");
  }

  function validIsoDateTime(value) {
    if (!value) return false;
    const date = new Date(value);
    return !Number.isNaN(date.getTime());
  }

  function randomId(prefix) {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  function normalizeOutcome(outcome) {
    if (!isPlainObject(outcome)) return null;
    const category = ["success", "rejection", "callback"].includes(outcome.category) ? outcome.category : "";
    const label = text(outcome.label, LIMITS.shortText);
    if (!category || !label) return null;
    return {
      category,
      label,
      callbackDate: category === "callback" && validIsoDate(outcome.callbackDate) ? outcome.callbackDate : null,
      callbackTime: category === "callback" && validTime(outcome.callbackTime) ? outcome.callbackTime : null
    };
  }

  function normalizeOutcomePresets(settings) {
    const current = isPlainObject(settings.outcomePresets) ? settings.outcomePresets : {};
    return ["success", "rejection", "callback"].reduce((result, category) => {
      const group = isPlainObject(current[category]) ? current[category] : {};
      const items = uniqueItems(group.items, LIMITS.shortText);
      const fallback =
        category === "success"
          ? settings.successLabel
          : category === "rejection"
            ? settings.rejectionLabel
            : outcomes.defaultCallbackLabel(settings.language);
      const defaultValue = text(group.default || items[0] || fallback, LIMITS.shortText);
      result[category] = {
        default: items.includes(defaultValue) ? defaultValue : items[0] || defaultValue,
        items: items.length ? items : [defaultValue].filter(Boolean)
      };
      return result;
    }, {});
  }

  function normalizeSettings(settings, defaults = {}) {
    const source = isPlainObject(settings) ? settings : {};
    const merged = { ...defaults, ...source };
    const language = languages.has(merged.language) ? merged.language : "es";
    const requestedPrimaryTimezone = text(merged.timezone, LIMITS.shortText) || "local";
    const candidateActiveTimezones = (
      Array.isArray(merged.activeTimezones) && merged.activeTimezones.length
        ? uniqueItems(merged.activeTimezones, LIMITS.shortText)
        : [requestedPrimaryTimezone]
    ).slice(0, MAX_ACTIVE_TIMEZONES);
    const activeTimezones = candidateActiveTimezones.length ? candidateActiveTimezones : [requestedPrimaryTimezone];
    const primaryTimezone = activeTimezones.includes(requestedPrimaryTimezone)
      ? requestedPrimaryTimezone
      : activeTimezones[0] || requestedPrimaryTimezone;
    const hasPinnedClockTimezones = Object.prototype.hasOwnProperty.call(merged, "pinnedClockTimezones");
    const pinnedClockTimezones = (
      hasPinnedClockTimezones ? uniqueItems(merged.pinnedClockTimezones, LIMITS.shortText) : activeTimezones.slice(0, 1)
    ).filter((timezone) => activeTimezones.includes(timezone));
    const lastReminderTimezone = text(merged.lastReminderTimezone, LIMITS.shortText);
    const statsTimezone = text(merged.statsTimezone, LIMITS.shortText) || primaryTimezone || "local";
    const statsCycleStartDay = Math.min(28, Math.max(1, Number(merged.statsCycleStartDay) || 1));
    const normalized = {
      ...merged,
      language,
      timezone: primaryTimezone,
      activeTimezones,
      pinnedClockTimezones,
      lastReminderTimezone: activeTimezones.includes(lastReminderTimezone) ? lastReminderTimezone : primaryTimezone,
      statsTimezone,
      statsCycleStartDay,
      operatorName: text(merged.operatorName, LIMITS.shortText),
      callTypes: uniqueItems(merged.callTypes, LIMITS.shortText),
      frequentStatuses: uniqueItems(merged.frequentStatuses || merged.callStatuses, LIMITS.shortText),
      customComments: uniqueItems(merged.customComments, LIMITS.mediumText),
      successLabel: text(merged.successLabel, LIMITS.shortText) || "Exitosa",
      rejectionLabel: text(merged.rejectionLabel, LIMITS.shortText) || "Rechazo",
      reportHeaderFormat: text(merged.reportHeaderFormat, LIMITS.reportHeader) || "##### **REPORTE {OPERATOR} DE {BLOCK}**",
      linePrefixMode: linePrefixModes.has(merged.linePrefixMode) ? merged.linePrefixMode : "hash",
      clockFormat: clockFormats.has(merged.clockFormat) ? merged.clockFormat : "24h",
      startOnLogin: Boolean(merged.startOnLogin),
      runInBackground: Boolean(merged.runInBackground),
      notifyBeforeMinutes: Math.min(1440, Math.max(0, Number(merged.notifyBeforeMinutes) || 0)),
      notifyAtExactTime: merged.notifyAtExactTime !== false,
      reminderSound: reminderSounds.has(merged.reminderSound) ? merged.reminderSound : "soft",
      theme: merged.theme === "dark" ? "dark" : "dark",
      onboardingCompleted: Boolean(merged.onboardingCompleted)
    };
    normalized.outcomePresets = normalizeOutcomePresets(normalized);
    delete normalized.callStatuses;
    return normalized;
  }

  function normalizeCall(call, settings = {}) {
    if (!isPlainObject(call)) return null;
    const createdAt = validIsoDateTime(call.createdAt) ? call.createdAt : new Date().toISOString();
    const description = text(call.description, LIMITS.mediumText);
    const date = text(call.date, 5);
    const time = validTime(call.time) ? call.time : "00:00";
    return {
      ...call,
      id: text(call.id, LIMITS.shortText) || randomId("call"),
      callId: text(call.callId, LIMITS.callId),
      callType: text(call.callType, LIMITS.shortText),
      description,
      rawDescription: text(call.rawDescription || description, LIMITS.mediumText),
      customComment: text(call.customComment, LIMITS.mediumText),
      primaryOutcome: normalizeOutcome(call.primaryOutcome),
      operatorName: text(call.operatorName || settings.operatorName, LIMITS.shortText),
      date: /^\d{2}\.\d{2}$/.test(date) ? date : "01.01",
      time,
      hour: Number.isInteger(Number(call.hour)) ? Math.max(0, Math.min(23, Number(call.hour))) : Number(time.slice(0, 2)) || 0,
      block: text(call.block, LIMITS.shortText),
      dailySequence: Number(call.dailySequence) > 0 ? Number(call.dailySequence) : null,
      capturedAt: validIsoDateTime(call.capturedAt) ? call.capturedAt : null,
      createdAt,
      reportLineOverride: text(call.reportLineOverride, LIMITS.mediumText) || undefined
    };
  }

  function normalizeReminder(reminder, settingsOrTimezone = "local") {
    if (!isPlainObject(reminder)) return null;
    const status = reminderStatuses.has(reminder.status) ? reminder.status : "pending";
    const timezone = resolveTimezone(reminder.timezone || settingsOrTimezone);
    const due = reminderDueDate({ ...reminder, timezone }, timezone);
    return {
      ...reminder,
      id: text(reminder.id, LIMITS.shortText) || randomId("reminder"),
      callId: text(reminder.callId, LIMITS.callId),
      relatedCallId: text(reminder.relatedCallId, LIMITS.shortText),
      callType: text(reminder.callType, LIMITS.shortText),
      operator: text(reminder.operator, LIMITS.shortText),
      date: validIsoDate(reminder.date) ? reminder.date : "",
      time: validTime(reminder.time) ? reminder.time : "",
      timezone,
      dueAt: due ? due.toISOString() : null,
      repeat: repeatValues.has(reminder.repeat) ? reminder.repeat : "once",
      note: text(reminder.note, LIMITS.mediumText),
      status,
      createdAt: validIsoDateTime(reminder.createdAt) ? reminder.createdAt : new Date().toISOString(),
      updatedAt: validIsoDateTime(reminder.updatedAt) ? reminder.updatedAt : undefined,
      completedAt: validIsoDateTime(reminder.completedAt) ? reminder.completedAt : undefined,
      snoozedUntil: validIsoDateTime(reminder.snoozedUntil) ? reminder.snoozedUntil : null,
      mutedUntil: validIsoDateTime(reminder.mutedUntil) ? reminder.mutedUntil : null
    };
  }

  function normalizeNote(note) {
    if (!isPlainObject(note)) return null;
    const title = text(note.title, LIMITS.noteTitle);
    const content = multilineText(note.content, LIMITS.noteContent);
    return {
      ...note,
      id: text(note.id, LIMITS.shortText) || randomId("note"),
      title,
      content,
      createdAt: validIsoDateTime(note.createdAt) ? note.createdAt : new Date().toISOString(),
      updatedAt: validIsoDateTime(note.updatedAt) ? note.updatedAt : undefined
    };
  }

  function normalizeWorkTimer(timer) {
    const source = isPlainObject(timer) ? timer : {};
    const status = ["idle", "working", "paused", "stopped"].includes(source.status) ? source.status : "idle";
    const previousStatus = ["working", "paused"].includes(source.previousStatus) ? source.previousStatus : null;
    return {
      status,
      previousStatus,
      workElapsedMs: Math.max(0, Number(source.workElapsedMs) || 0),
      workStartedAt: validIsoDateTime(source.workStartedAt) ? source.workStartedAt : null,
      dailyWorkDate: validIsoDate(source.dailyWorkDate) ? source.dailyWorkDate : null,
      dailyWorkElapsedMs: Math.max(0, Number(source.dailyWorkElapsedMs) || 0),
      dailyWorkStartedAt: validIsoDateTime(source.dailyWorkStartedAt) ? source.dailyWorkStartedAt : null,
      currentBreakStartedAt: validIsoDateTime(source.currentBreakStartedAt) ? source.currentBreakStartedAt : null,
      breaks: Array.isArray(source.breaks)
        ? source.breaks
            .filter(isPlainObject)
            .map((item) => ({
              startedAt: validIsoDateTime(item.startedAt) ? item.startedAt : null,
              endedAt: validIsoDateTime(item.endedAt) ? item.endedAt : null,
              durationMs: Math.max(0, Number(item.durationMs) || 0)
            }))
            .filter((item) => item.startedAt && item.endedAt)
        : []
    };
  }

  function normalizeCollection(value, normalizer, ...args) {
    return (Array.isArray(value) ? value : []).map((item) => normalizer(item, ...args)).filter(Boolean);
  }

  function validateCallForm(payload) {
    const callId = text(payload.callId, LIMITS.callId);
    if (!callId) return { ok: false, messageKey: "callIdRequired" };
    if (String(payload.callId || "").includes("\n")) return { ok: false, messageKey: "singleLineCallId" };
    return { ok: true, value: { ...payload, callId } };
  }

  function validateReminderPayload(payload) {
    const note = text(payload.note, LIMITS.mediumText);
    if (!validIsoDate(payload.date) || !validTime(payload.time)) return { ok: false, messageKey: "invalidReminderDateTime" };
    if (!note) return { ok: false, messageKey: "reminderNoteRequired" };
    const timezone = resolveTimezone(payload.timezone || "local");
    const dueAt = zonedDateTimeToUtc(payload.date, payload.time, timezone);
    if (!dueAt) return { ok: false, messageKey: "invalidReminderDateTime" };
    return {
      ok: true,
      value: {
        callId: text(payload.callId, LIMITS.callId),
        date: payload.date,
        time: payload.time,
        timezone,
        dueAt: dueAt.toISOString(),
        repeat: repeatValues.has(payload.repeat) ? payload.repeat : "once",
        note
      }
    };
  }

  function validateNotePayload(payload) {
    const title = text(payload.title, LIMITS.noteTitle);
    const content = multilineText(payload.content, LIMITS.noteContent).trim();
    if (!title) return { ok: false, messageKey: "noteTitleRequired" };
    if (!content) return { ok: false, messageKey: "noteContentRequired" };
    return { ok: true, value: { title, content } };
  }

  function cleanClipboardCallId(value) {
    return text(String(value || "").split(/\r?\n/)[0], LIMITS.callId);
  }

  const api = {
    LIMITS,
    MAX_ACTIVE_TIMEZONES,
    text,
    multilineText,
    uniqueItems,
    validIsoDate,
    validTime,
    resolveTimezone,
    isoDateInTimezone,
    timeInTimezone,
    zonedDateTimeToUtc,
    reminderDueDate,
    normalizeSettings,
    normalizeCall,
    normalizeReminder,
    normalizeNote,
    normalizeWorkTimer,
    normalizeCollection,
    validateCallForm,
    validateReminderPayload,
    validateNotePayload,
    cleanClipboardCallId
  };

  if (typeof window !== "undefined") {
    window.CallFlowValidators = api;
  }

  if (typeof module !== "undefined") {
    module.exports = api;
  }
})();
