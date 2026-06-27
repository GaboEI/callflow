const test = require("node:test");
const assert = require("node:assert/strict");

const {
  evaluateExpression,
  financeForWork,
  financeSettings,
  isPendingExpression,
  normalizeExpression
} = require("../src/renderer/scripts/views/calculator-view");

test("calculator normalizes expression input tokens", () => {
  assert.equal(normalizeExpression(" 2,5 "), "2.5");
  assert.equal(normalizeExpression("50%"), "(50/100)");
  assert.equal(normalizeExpression("π + pi + PI"), "Math.PI + Math.PI + Math.PI");
  assert.equal(normalizeExpression("sqrt(9)"), "Math.sqrt(9)");
});

test("calculator detects pending expressions", () => {
  assert.equal(isPendingExpression("2+"), true);
  assert.equal(isPendingExpression("(2+3"), true);
  assert.equal(isPendingExpression("2**"), true);
  assert.equal(isPendingExpression("2+3"), false);
  assert.equal(isPendingExpression(""), false);
});

test("calculator evaluates supported arithmetic expressions", () => {
  assert.equal(evaluateExpression("2+3"), 5);
  assert.equal(evaluateExpression("8/2"), 4);
  assert.equal(evaluateExpression("2+3*4"), 14);
  assert.equal(evaluateExpression("(2+3)*4"), 20);
  assert.equal(evaluateExpression("200*10%"), 20);
  assert.equal(evaluateExpression("sqrt(9)"), 3);
  assert.ok(Math.abs(evaluateExpression("pi") - Math.PI) < Number.EPSILON);
  assert.equal(evaluateExpression(""), 0);
  assert.equal(evaluateExpression("2+"), null);
});

test("calculator rejects unsafe expression input", () => {
  [
    "2+abc",
    "constructor",
    "(function(){})()",
    "[].constructor",
    "process",
    "require('fs')"
  ].forEach((expression) => {
    assert.throws(() => evaluateExpression(expression), /Invalid expression/);
  });
});

test("calculator finance helpers compute work value from time and rate", () => {
  assert.equal(financeForWork(0, 10), 0);
  assert.equal(financeForWork(3_600_000, 10), 10);
  assert.equal(financeForWork(1_800_000, 12), 6);
  assert.equal(financeForWork(-1, 10), 0);
  assert.equal(financeForWork(3_600_000, 0), 0);
});

test("calculator finance settings merges defaults with financial state", () => {
  assert.deepEqual(financeSettings({ financial: { hourlyRate: 25, paidBreaks: true } }), {
    currency: "USD",
    hourlyRate: 25,
    paidBreaks: true,
    movementTypes: [],
    transactions: []
  });
});
