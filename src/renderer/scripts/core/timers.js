(function () {
  function defaultWorkTimer() {
    return {
      status: "idle",
      previousStatus: null,
      workElapsedMs: 0,
      workStartedAt: null,
      dailyWorkDate: null,
      dailyWorkElapsedMs: 0,
      dailyWorkStartedAt: null,
      currentBreakStartedAt: null,
      breaks: []
    };
  }

  function normalizeWorkTimer(timer) {
    return {
      ...defaultWorkTimer(),
      ...(timer || {}),
      workElapsedMs: Number(timer && timer.workElapsedMs) || 0,
      dailyWorkElapsedMs: Number(timer && timer.dailyWorkElapsedMs) || 0,
      breaks: Array.isArray(timer && timer.breaks) ? timer.breaks : []
    };
  }

  function formatDuration(ms) {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  }

  function currentWorkElapsed(timer, now = Date.now()) {
    const normalized = normalizeWorkTimer(timer);
    if (normalized.status !== "working" || !normalized.workStartedAt) return normalized.workElapsedMs;
    return normalized.workElapsedMs + Math.max(0, now - new Date(normalized.workStartedAt).getTime());
  }

  function ensureDailyWorkTimer(timer, dayKey, now = new Date()) {
    const normalized = normalizeWorkTimer(timer);
    if (!dayKey) return normalized;
    if (normalized.dailyWorkDate === dayKey) return normalized;
    return {
      ...normalized,
      dailyWorkDate: dayKey,
      dailyWorkElapsedMs: 0,
      dailyWorkStartedAt: normalized.status === "working" ? now.toISOString() : null
    };
  }

  function currentDailyWorkElapsed(timer, now = Date.now()) {
    const normalized = normalizeWorkTimer(timer);
    if (normalized.status !== "working" || !normalized.dailyWorkStartedAt) return normalized.dailyWorkElapsedMs;
    return normalized.dailyWorkElapsedMs + Math.max(0, now - new Date(normalized.dailyWorkStartedAt).getTime());
  }

  function currentBreakElapsed(timer, now = Date.now()) {
    const normalized = normalizeWorkTimer(timer);
    if (normalized.status !== "paused" || !normalized.currentBreakStartedAt) return 0;
    return Math.max(0, now - new Date(normalized.currentBreakStartedAt).getTime());
  }

  function freezeWorkTimer(timer, now = new Date(), dayKey = null) {
    const normalized = ensureDailyWorkTimer(timer, dayKey, now);
    if (normalized.status === "working" && normalized.workStartedAt) {
      normalized.workElapsedMs = currentWorkElapsed(normalized, now.getTime());
      normalized.workStartedAt = null;
      normalized.dailyWorkElapsedMs = currentDailyWorkElapsed(normalized, now.getTime());
      normalized.dailyWorkStartedAt = null;
      normalized.previousStatus = "working";
    } else if (normalized.status === "paused" && normalized.currentBreakStartedAt) {
      const startedAt = normalized.currentBreakStartedAt;
      const durationMs = Math.max(0, now.getTime() - new Date(startedAt).getTime());
      normalized.breaks = [...normalized.breaks, { startedAt, endedAt: now.toISOString(), durationMs }];
      normalized.currentBreakStartedAt = null;
      normalized.previousStatus = "paused";
    } else if (!normalized.previousStatus) {
      normalized.previousStatus = null;
    }
    normalized.status = "stopped";
    return normalized;
  }

  function toggleShiftTimer(timer, now = new Date(), dayKey = null) {
    const next = ensureDailyWorkTimer(timer, dayKey, now);

    if (next.status === "working") {
      next.workElapsedMs = currentWorkElapsed(next, now.getTime());
      next.dailyWorkElapsedMs = currentDailyWorkElapsed(next, now.getTime());
      next.workStartedAt = null;
      next.dailyWorkStartedAt = null;
      next.currentBreakStartedAt = now.toISOString();
      next.status = "paused";
      next.previousStatus = "working";
    } else {
      if (next.status === "paused" && next.currentBreakStartedAt) {
        const startedAt = next.currentBreakStartedAt;
        const durationMs = Math.max(0, now.getTime() - new Date(startedAt).getTime());
        next.breaks = [...next.breaks, { startedAt, endedAt: now.toISOString(), durationMs }];
      }
      next.currentBreakStartedAt = null;
      next.workStartedAt = now.toISOString();
      next.dailyWorkStartedAt = now.toISOString();
      next.status = next.status === "stopped" && next.previousStatus === "paused" ? "paused" : "working";
      if (next.status === "paused") {
        next.workStartedAt = null;
        next.dailyWorkStartedAt = null;
        next.currentBreakStartedAt = now.toISOString();
      }
      next.previousStatus = null;
    }

    return next;
  }

  const api = {
    currentBreakElapsed,
    currentDailyWorkElapsed,
    currentWorkElapsed,
    defaultWorkTimer,
    ensureDailyWorkTimer,
    formatDuration,
    freezeWorkTimer,
    normalizeWorkTimer,
    toggleShiftTimer
  };

  if (typeof window !== "undefined") {
    window.CallFlowTimers = api;
  }

  if (typeof module !== "undefined") {
    module.exports = api;
  }
})();
