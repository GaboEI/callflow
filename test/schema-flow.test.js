const test = require("node:test");
const assert = require("node:assert/strict");

const reports = require("../src/shared/reports");
const reminders = require("../src/shared/reminders");
const schema = require("../src/shared/schema");

test("real call flow data can be normalized across save, crm copy, callback reminder and report", () => {
  const settings = schema.normalizeData("settings", {
    language: "en",
    operatorName: "Agent",
    linePrefixMode: "dailyNumber",
    outcomePresets: { callback: { items: ["Rellamada"] } }
  });

  const callbackOutcome = {
    category: "callback",
    label: settings.outcomePresets.callback.default,
    callbackDate: "2026-06-19",
    callbackTime: "15:30"
  };
  const call = reports.createCallRecord(
    {
      callId: "CRM-100",
      callType: "Sales",
      primaryOutcome: callbackOutcome,
      description: "Customer asked for follow up",
      customComment: "Priority",
      capturedAt: "2026-06-19T14:00:00.000Z",
      dailySequence: 1
    },
    settings
  );

  const savedCalls = schema.normalizeData("calls", [call], { settings });
  const automaticReminder = schema.normalizeData("reminders", [
    {
      callId: call.callId,
      relatedCallId: call.id,
      date: callbackOutcome.callbackDate,
      time: callbackOutcome.callbackTime,
      timezone: "UTC",
      note: "Customer asked for follow up",
      status: "pending"
    }
  ], { settings });
  const report = reports.buildSupervisorReport(savedCalls[0].block, savedCalls, settings);

  assert.match(call.crmLine, /Customer asked for follow up/);
  assert.equal(savedCalls[0].primaryOutcome.label, "Callback");
  assert.equal(automaticReminder[0].status, "pending");
  assert.equal(reminders.filterReminders(automaticReminder, "all", new Date("2026-06-19T12:00:00.000Z")).length, 1);
  assert.match(report, /CRM-100/);
});
