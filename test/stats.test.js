const test = require("node:test");
const assert = require("node:assert/strict");

const stats = require("../src/shared/stats");

test("builds daily stats from primary outcomes and legacy descriptions", () => {
  const calls = [
    {
      description: "Exitosa",
      callType: "Ventas",
      primaryOutcome: { category: "success", label: "Venta" }
    },
    {
      description: "Rechazo — Precio alto",
      callType: "Ventas",
      primaryOutcome: { category: "rejection", label: "Rechazo" }
    },
    {
      description: "Sin_respuesta",
      callType: "Soporte",
      primaryOutcome: null
    },
    {
      description: "Seguimiento especial",
      callType: "",
      primaryOutcome: null
    }
  ];

  const result = stats.buildStats(
    calls,
    [{ status: "pending" }, { status: "completed" }, { status: "overdue" }],
    {
      successLabel: "Exitosa",
      rejectionLabel: "Rechazo",
      frequentStatuses: ["Sin_respuesta", "Seguimiento especial"]
    }
  );

  assert.equal(result.total, 4);
  assert.equal(result.success, 1);
  assert.equal(result.rejections, 1);
  assert.equal(result.noAnswer, 1);
  assert.deepEqual(result.byType, { Ventas: 2, Soporte: 1 });
  assert.deepEqual(result.statusCounts, { "Seguimiento especial": 1 });
  assert.equal(result.pendingReminders, 2);
});

test("builds range analysis from configurable outcomes", () => {
  const calls = [
    {
      createdAt: "2026-06-18T08:10:00.000Z",
      hour: 8,
      description: "Venta",
      callType: "3333",
      primaryOutcome: { category: "success", label: "Venta" }
    },
    {
      createdAt: "2026-06-18T08:30:00.000Z",
      hour: 8,
      description: "Rechazo",
      callType: "3333",
      primaryOutcome: { category: "rejection", label: "Rechazo" }
    },
    {
      createdAt: "2026-06-19T09:00:00.000Z",
      hour: 9,
      description: "Rellamada",
      callType: "4444",
      primaryOutcome: { category: "callback", label: "Callback" }
    },
    {
      createdAt: "2026-06-19T09:15:00.000Z",
      hour: 9,
      description: "Venta",
      callType: "4444",
      primaryOutcome: { category: "success", label: "Venta" }
    }
  ];

  const result = stats.buildStatsAnalysis(calls, [], {
    successLabel: "Venta",
    rejectionLabel: "Rechazo",
    frequentStatuses: ["Sin_respuesta"]
  });

  assert.equal(result.total, 4);
  assert.equal(result.success, 2);
  assert.equal(result.rejections, 1);
  assert.equal(result.callback, 1);
  assert.equal(result.rates.success, 50);
  assert.deepEqual(result.byType, { 3333: 2, 4444: 2 });
  assert.deepEqual(result.byHour, { "08": 2, "09": 2 });
  assert.equal(result.insights.bestDay, "2026-06-18");
  assert.equal(result.insights.strongestHour, "08");
});
