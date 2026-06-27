const test = require("node:test");
const assert = require("node:assert/strict");

const dashboardView = require("../src/renderer/scripts/views/dashboard-view");

test("dashboard-view exports helpers via module.exports", () => {
  assert.equal(typeof dashboardView.createDashboardView, "function");
  assert.equal(typeof dashboardView.blockProductivity, "function");
  assert.equal(typeof dashboardView.callProductivityCategory, "function");
});

test("dashboard-view outcome helpers derive active labels deterministically", () => {
  const outcomePresets = {
    success: { items: ["Venta", "Cierre"], default: "Venta" },
    callback: { items: ["Seguimiento"], default: "Seguimiento" },
    rejection: { items: ["Rechazo"], default: "Rechazo" }
  };
  const uniqueItems = (items) => [...new Set(items)];
  const calls = [
    { primaryOutcome: { category: "success", label: "Venta" } },
    { primaryOutcome: { category: "success", label: "Venta" } },
    { primaryOutcome: { category: "success", label: "Cierre" } },
    { primaryOutcome: { category: "callback", label: "Seguimiento" } }
  ];

  assert.deepEqual([...dashboardView.activeOutcomeLabelSet(outcomePresets, "success", uniqueItems)], ["venta", "cierre"]);
  assert.equal(dashboardView.mostUsedOutcomeLabel(calls, "success", outcomePresets, uniqueItems), "Venta");
  assert.equal(dashboardView.defaultOutcomeLabel(calls, "success", outcomePresets, uniqueItems), "Venta");
});

test("dashboard-view classifies productivity from labels and categories", () => {
  const outcomePresets = {
    success: { items: ["Venta"] },
    callback: { items: ["Seguimiento"] },
    rejection: { items: ["Rechazo"] }
  };
  const labels = (category) => (outcomePresets[category]?.items || []);
  assert.equal(dashboardView.callProductivityCategory({ primaryOutcome: { category: "success" } }, labels), "success");
  assert.equal(dashboardView.callProductivityCategory({ description: "seguimiento urgente" }, labels), "callback");
  assert.equal(dashboardView.callProductivityCategory({ description: "rechazo por precio" }, labels), "rejection");
  assert.equal(dashboardView.callProductivityCategory({ description: "sin coincidencia" }, labels), "neutral");
});

test("dashboard-view block productivity scores categories and empty sets", () => {
  const calls = [
    { primaryOutcome: { category: "success" } },
    { primaryOutcome: { category: "callback" } },
    { primaryOutcome: { category: "rejection" } },
    { description: "sin coincidencia" }
  ];
  const callCategory = (call) => dashboardView.callProductivityCategory(call, () => []);
  const empty = dashboardView.blockProductivity([], callCategory);
  assert.deepEqual(empty, { total: 0, success: 0, callback: 0, rejection: 0, neutral: 0, score: 0 });

  const scored = dashboardView.blockProductivity(calls, callCategory);
  assert.equal(scored.total, 4);
  assert.equal(scored.success, 1);
  assert.equal(scored.callback, 1);
  assert.equal(scored.rejection, 1);
  assert.equal(scored.neutral, 1);
  assert.equal(scored.score, 5.8);
});
