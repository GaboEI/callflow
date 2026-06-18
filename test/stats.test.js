const test = require("node:test");
const assert = require("node:assert/strict");

const stats = require("../src/renderer/scripts/stats");

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
