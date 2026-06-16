(function () {
  function resolveTimezone(settings) {
    if (!settings || settings.timezone === "local") {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    }
    return settings.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  }

  function dateParts(date, timezone) {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: timezone,
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).formatToParts(date);

    return Object.fromEntries(parts.map((part) => [part.type, part.value]));
  }

  function formatCallTimestamp(date, settings) {
    const parts = dateParts(date, resolveTimezone(settings));
    return {
      date: `${parts.day}.${parts.month}`,
      time: `${parts.hour}:${parts.minute}`,
      hour: Number(parts.hour)
    };
  }

  function blockFromHour(hour) {
    const start = String(hour).padStart(2, "0");
    const end = String((hour + 1) % 24).padStart(2, "0");
    return `${start}:00 - ${end}:00`;
  }

  function buildDescription(description, customComment) {
    return [description, customComment].filter(Boolean).join(" — ");
  }

  function linePrefix(call, settings) {
    const mode = settings.linePrefixMode || "hash";
    if (mode === "none") return "";
    if (mode === "dailyNumber") {
      const sequence = Number(call.dailySequence || 0);
      return sequence ? String(sequence).padStart(3, "0") : "";
    }
    return "#";
  }

  function buildCallLine(call, settings = {}) {
    const parts = [linePrefix(call, settings), call.callId, call.callType, call.date, call.time].filter(Boolean);
    return `${parts.join(" ")} ${call.operatorName}: ${call.description}`;
  }

  function buildCrmLine(call) {
    return `${call.date} ${call.time} ${call.operatorName}: ${call.description}`;
  }

  function createCallRecord(formData, settings) {
    const now = new Date();
    const stamp = formatCallTimestamp(now, settings);
    const description = buildDescription(formData.description, formData.customComment);
    const call = {
      id: crypto.randomUUID(),
      callId: formData.callId.trim(),
      callType: String(formData.callType || "").trim(),
      description,
      rawDescription: formData.description,
      customComment: formData.customComment,
      operatorName: settings.operatorName,
      date: stamp.date,
      time: stamp.time,
      hour: stamp.hour,
      block: blockFromHour(stamp.hour),
      dailySequence: formData.dailySequence || null,
      createdAt: now.toISOString()
    };
    call.fullLine = buildCallLine(call, settings);
    call.crmLine = buildCrmLine(call);
    return call;
  }

  function ensureDailySequences(calls) {
    const groups = calls.reduce((byDate, call) => {
      byDate[call.date] = byDate[call.date] || [];
      byDate[call.date].push(call);
      return byDate;
    }, {});

    Object.values(groups).forEach((items) => {
      items
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        .forEach((call, index) => {
          if (!call.dailySequence) call.dailySequence = index + 1;
        });
    });

    return calls;
  }

  function todayKey(settings, date = new Date()) {
    const parts = dateParts(date, resolveTimezone(settings));
    return `${parts.day}.${parts.month}`;
  }

  function callsForToday(calls, settings) {
    const key = todayKey(settings);
    return calls.filter((call) => call.date === key);
  }

  function groupByBlock(calls) {
    return calls.reduce((groups, call) => {
      groups[call.block] = groups[call.block] || [];
      groups[call.block].push(call);
      return groups;
    }, {});
  }

  function buildSupervisorReport(block, calls, settings) {
    const operator = (settings.operatorName || "OPERADOR").toUpperCase();
    const headerFormat = settings.reportHeaderFormat || "##### **REPORTE {OPERATOR} DE {BLOCK}**";
    const header = headerFormat.replace("{OPERATOR}", operator).replace("{BLOCK}", block);
    const body = calls.map((call) => buildCallLine(call, settings)).join("\n");
    return `${header}\n\n\`\`\`\n${body}\n\`\`\``;
  }

  window.CallFlowReports = {
    createCallRecord,
    callsForToday,
    groupByBlock,
    blockFromHour,
    buildSupervisorReport,
    buildCallLine,
    ensureDailySequences,
    resolveTimezone,
    formatCallTimestamp
  };
})();
