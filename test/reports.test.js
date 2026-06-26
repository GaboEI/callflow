const test = require("node:test");
const assert = require("node:assert/strict");

const reports = require("../src/shared/reports");

const settings = {
  timezone: "UTC",
  operatorName: "Ana",
  reportHeaderFormat: "##### **REPORTE {OPERATOR} DE {BLOCK}**",
  linePrefixMode: "hash",
  language: "es"
};

test("creates a call record with CRM and supervisor line formats", () => {
  const call = reports.createCallRecord(
    {
      callId: "20506955",
      callType: "Soporte",
      description: "Sin_respuesta",
      customComment: "Cliente pidio rellamada",
      capturedAt: "2026-06-18T14:05:00.000Z",
      dailySequence: 1
    },
    settings
  );

  assert.equal(call.date, "18.06");
  assert.equal(call.time, "14:05");
  assert.equal(call.block, "14:00 - 15:00");
  assert.equal(call.description, "Sin_respuesta — Cliente pidio rellamada");
  assert.equal(call.fullLine, "# 20506955 Soporte 18.06 14:05 Ana: Sin_respuesta — Cliente pidio rellamada");
  assert.equal(call.crmLine, "18.06 14:05 Ana: Sin_respuesta — Cliente pidio rellamada");
});

test("callback outcome is included before status and custom comment", () => {
  const call = reports.createCallRecord(
    {
      callId: "9001",
      callType: "",
      primaryOutcome: {
        category: "callback",
        label: "Rellamada",
        callbackDate: "2026-06-19",
        callbackTime: "09:30"
      },
      description: "Buzon",
      customComment: "Prefiere manana",
      capturedAt: "2026-06-18T10:00:00.000Z"
    },
    settings
  );

  assert.equal(call.description, "Rellamada 19.06 09:30 — Buzon — Prefiere manana");
  assert.equal(call.fullLine, "# 9001 18.06 10:00 Ana: Rellamada 19.06 09:30 — Buzon — Prefiere manana");
});

test("daily numbering mode uses padded sequence instead of hash", () => {
  const call = {
    callId: "123",
    callType: "",
    date: "18.06",
    time: "08:00",
    operatorName: "Ana",
    description: "Exitosa",
    dailySequence: 7
  };

  assert.equal(
    reports.buildCallLine(call, { ...settings, linePrefixMode: "dailyNumber" }),
    "007 123 18.06 08:00 Ana: Exitosa"
  );
});

test("daily sequencing preserves valid existing numbers and fills the lowest free gaps", () => {
  const calls = [
    { id: "kept-2", date: "18.06", createdAt: "2026-06-18T10:00:00.000Z", dailySequence: 2 },
    { id: "missing-earlier", date: "18.06", createdAt: "2026-06-18T09:00:00.000Z", dailySequence: null },
    { id: "kept-4", date: "18.06", createdAt: "2026-06-18T11:00:00.000Z", dailySequence: 4 },
    { id: "other-day", date: "19.06", createdAt: "2026-06-19T09:00:00.000Z", dailySequence: null }
  ];

  reports.ensureDailySequences(calls);

  assert.deepEqual(
    calls.map((call) => [call.id, call.dailySequence]),
    [
      ["kept-2", 2],
      ["missing-earlier", 1],
      ["kept-4", 4],
      ["other-day", 1]
    ]
  );
});

test("daily sequencing repairs duplicate and invalid values in stable order", () => {
  const calls = [
    { id: "kept-1", date: "18.06", createdAt: "2026-06-18T09:00:00.000Z", dailySequence: 1 },
    { id: "duplicate-later", date: "18.06", createdAt: "2026-06-18T10:00:00.000Z", dailySequence: 1 },
    { id: "same-time-b", date: "18.06", createdAt: "2026-06-18T11:00:00.000Z", dailySequence: 0 },
    { id: "same-time-a", date: "18.06", createdAt: "2026-06-18T11:00:00.000Z", dailySequence: "bad" }
  ];

  reports.ensureDailySequences(calls);

  assert.deepEqual(
    calls.map((call) => [call.id, call.dailySequence]),
    [
      ["kept-1", 1],
      ["duplicate-later", 2],
      ["same-time-b", 4],
      ["same-time-a", 3]
    ]
  );
});

test("supervisor report keeps calls on consecutive lines", () => {
  const calls = [
    {
      callId: "1",
      callType: "",
      date: "18.06",
      time: "09:00",
      operatorName: "Ana",
      description: "Exitosa"
    },
    {
      callId: "2",
      callType: "",
      date: "18.06",
      time: "09:10",
      operatorName: "Ana",
      description: "Rechazo"
    }
  ];

  assert.equal(
    reports.buildSupervisorReport("09:00 - 10:00", calls, settings),
    [
      "##### **REPORTE ANA DE 09:00 - 10:00**",
      "",
      "```",
      "# 1 18.06 09:00 Ana: Exitosa",
      "# 2 18.06 09:10 Ana: Rechazo",
      "```"
    ].join("\n")
  );
});
