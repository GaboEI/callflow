const test = require("node:test");
const assert = require("node:assert/strict");

const statsView = require("../src/renderer/scripts/views/stats-view");

test("stats-view exports helpers via module.exports", () => {
  assert.equal(typeof statsView.createStatsView, "function");
  assert.equal(typeof statsView.addDays, "function");
  assert.equal(typeof statsView.startOfWeek, "function");
});

test("stats-view date helpers handle boundaries", () => {
  assert.equal(statsView.addDays("2026-06-27", 5), "2026-07-02");
  assert.equal(statsView.addDays("2026-01-01", -1), "2025-12-31");
  assert.equal(statsView.addDays("2024-12-31", 1), "2025-01-01");
  assert.equal(statsView.startOfWeek("2026-06-27"), "2026-06-22");
  assert.equal(statsView.startOfWeek("2026-01-01"), "2025-12-29");
  assert.equal(statsView.cycleStartForDate("2026-06-27", 15), "2026-06-15");
  assert.equal(statsView.cycleStartForDate("2026-06-10", 15), "2026-05-15");
});

test("stats-view classifies and summarizes calls with injected settings", () => {
  const settings = {
    successLabel: "Venta",
    rejectionLabel: "Rechazo",
    frequentStatuses: ["Sin_respuesta", "No_answer"]
  };
  const calls = [
    { description: "Venta cerrada", primaryOutcome: { category: "success" } },
    { description: "Rechazo por precio", primaryOutcome: { category: "rejection" } },
    { description: "Seguimiento", primaryOutcome: { category: "callback" } },
    { description: "Venta por texto" },
    { description: "Sin_respuesta", rawDescription: "Sin_respuesta" }
  ];

  assert.equal(statsView.outcomeCategory(calls[0], settings), "success");
  assert.equal(statsView.outcomeCategory({ description: "venta exitosa" }, settings), "success");
  assert.equal(statsView.outcomeCategory({ description: "rechazo total" }, settings), "rejection");
  assert.equal(statsView.outcomeCategory({ description: "otra cosa" }, settings), "neutral");
  assert.equal(statsView.isNoAnswerCall(calls[4], settings), true);
  assert.equal(statsView.isNoAnswerCall({ description: "llamada normal" }, settings), false);

  assert.deepEqual(statsView.summarizeCalls(calls, settings), {
    total: 5,
    success: 2,
    rejections: 1,
    callback: 1,
    successRate: 40
  });
});

test("stats-view formattedDuration delegates through the timer formatter", () => {
  const timers = {
    formatDuration(ms) {
      return `duration:${ms}`;
    }
  };

  assert.equal(statsView.formattedDuration(0, timers), "duration:0");
  assert.equal(statsView.formattedDuration(1234, timers), "duration:1234");
});

test("stats-view callHourKey uses the injected hour extractor", () => {
  const callHourInTimezone = (call) => call.hour;
  assert.equal(statsView.callHourKey({ hour: 7 }, callHourInTimezone), "07");
  assert.equal(statsView.callHourKey({ hour: 18 }, callHourInTimezone), "18");
});
