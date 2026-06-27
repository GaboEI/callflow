const test = require("node:test");
const assert = require("node:assert/strict");

const reportsView = require("../src/renderer/scripts/views/reports-view");
const reports = require("../src/shared/reports");

test("reports-view exports helpers via module.exports", () => {
  assert.equal(typeof reportsView.createReportsView, "function");
  assert.equal(typeof reportsView.reportBlockKey, "function");
  assert.equal(typeof reportsView.reportGroupsForRange, "function");
});

test("reports-view block keys and lookup are deterministic", () => {
  const key = reportsView.reportBlockKey("2026-06-27", "08:00 - 09:00");
  assert.equal(key, "2026-06-27|08:00 - 09:00");
  assert.deepEqual(reportsView.callsForReportBlockKey("missing", {}), []);
  assert.deepEqual(reportsView.callsForReportBlockKey(key, { "2026-06-27": { "08:00 - 09:00": [1, 2] } }), [1, 2]);
});

test("reports-view highlights matches without breaking html escaping", () => {
  const result = reportsView.highlightedReportText(
    "Hola <mundo> y mundo",
    "mundo",
    (value) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"),
    (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  );

  assert.match(result.html, /<mark class="report-match"/);
  assert.match(result.html, /&lt;<mark class="report-match active" data-report-match="0">mundo<\/mark>&gt;/);
  assert.match(result.html, /data-report-match="0"/);
  assert.equal(reportsView.highlightedReportText("Hola", "  ", (value) => value, (value) => value).html, "Hola");
});

test("reports-view builds plain supervisor reports and export names", () => {
  const calls = [
    { callId: "1", callType: "A", date: "27.06", time: "08:00", operatorName: "Operador", description: "Venta" },
    { callId: "2", callType: "A", date: "27.06", time: "08:05", operatorName: "Operador", description: "Rechazo" }
  ];

  const report = reportsView.buildPlainSupervisorReport("08:00 - 09:00", calls, "Operador", (call) =>
    reports.buildCallLine(call, { operatorName: "Operador" })
  );

  assert.match(report, /^REPORTE OPERADOR DE 08:00 - 09:00/m);
  assert.match(report, /# 1 A 27.06 08:00 Operador: Venta/);
  assert.equal(reportsView.reportExportBaseName("Operador Name", () => "2026-06-27"), "operador-name-report-2026-06-27");
});

test("reports-view range bounds and grouping respect presets", () => {
  const compareIsoDate = (a, b) => a.localeCompare(b);
  const isoDateOffset = (days) => {
    const date = new Date("2026-06-27T00:00:00Z");
    date.setUTCDate(date.getUTCDate() - days);
    return date.toISOString().slice(0, 10);
  };
  const calls = [
    { id: 1, createdAt: "2026-06-26T08:00:00Z", date: "2026-06-26", hour: 8, block: "08:00 - 09:00" },
    { id: 2, createdAt: "2026-06-27T08:05:00Z", date: "2026-06-27", hour: 8, block: "08:00 - 09:00" },
    { id: 3, createdAt: "2026-06-27T10:00:00Z", date: "2026-06-27", hour: 10, block: "10:00 - 11:00" }
  ];

  assert.deepEqual(
    reportsView.reportRangeBounds({ preset: "yesterday" }, isoDateOffset, compareIsoDate),
    { from: "2026-06-26", to: "2026-06-26" }
  );
  assert.deepEqual(
    reportsView.reportRangeBounds({ preset: "custom", from: "2026-06-28", to: "2026-06-26" }, isoDateOffset, compareIsoDate),
    { from: "2026-06-26", to: "2026-06-28" }
  );

  const groups = reportsView.reportGroupsForRange({
    activeCalls: () => calls,
    callIsoDate: (call) => call.date,
    compareIsoDate,
    isoDateOffset,
    reportRange: { preset: "last7" },
    reportTrashMode: false,
    stateCalls: calls,
    ensureDailySequences: (items) => items,
    blockFromHour: reports.blockFromHour
  });

  assert.equal(Object.keys(groups).length, 2);
  assert.deepEqual(Object.keys(groups["2026-06-27"]).sort(), ["08:00 - 09:00", "10:00 - 11:00"]);
});
