const test = require("node:test");
const assert = require("node:assert/strict");

const dateTimePicker = require("../src/renderer/scripts/core/date-time-picker");
const uiState = require("../src/renderer/scripts/core/ui-state");
const timezonePicker = require("../src/renderer/scripts/core/timezone-picker");

function localeForLanguage(language) {
  return {
    en: "en-US",
    es: "es-ES",
    ru: "ru-RU"
  }[language] || "en-US";
}

function normalizeTimezoneSearch(value) {
  return String(value || "")
    .toLowerCase()
    .replaceAll("_", " ")
    .replaceAll("/", " ")
    .replace(/[—–-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function timezoneOption(value, language) {
  return {
    value,
    label: `${language}:${value}`,
    searchText: normalizeTimezoneSearch(value)
  };
}

test("date-time picker parses and compares date/time values", () => {
  assert.deepEqual(dateTimePicker.parseIsoDateParts("2026-06-27"), { year: 2026, month: 5, day: 27 });
  assert.equal(dateTimePicker.parseIsoDateParts("bad"), null);
  assert.equal(dateTimePicker.parseIsoDateParts("2026-13-01"), null);

  assert.deepEqual(dateTimePicker.parseTimeParts("23:59"), { hour: 23, minute: 59 });
  assert.equal(dateTimePicker.parseTimeParts("24:00"), null);
  assert.equal(dateTimePicker.parseTimeParts("12:60"), null);

  assert.equal(dateTimePicker.isoFromParts(2026, 5, 7), "2026-06-07");
  assert.equal(dateTimePicker.isoTime("1970-01-02"), 86400000);
  assert.equal(dateTimePicker.compareIso("2026-01-01", "2026-01-02") < 0, true);
  assert.equal(dateTimePicker.compareIso("2026-01-02", "2026-01-01") > 0, true);
  assert.equal(dateTimePicker.compareIso("2026-01-01", "2026-01-01"), 0);
  assert.equal(dateTimePicker.compareIso("bad", "2026-01-01"), 0);
  assert.deepEqual(dateTimePicker.orderedRange("2026-06-20", "2026-06-18"), {
    from: "2026-06-18",
    to: "2026-06-20"
  });
});

test("date-time picker range helpers include boundaries", () => {
  assert.equal(dateTimePicker.sameIsoDay({ year: 2026, month: 5, day: 27 }, 2026, 5, 27), true);
  assert.equal(dateTimePicker.sameIsoValue("2026-06-27", 2026, 5, 27), true);
  assert.equal(dateTimePicker.sameIsoValue("2026-06-28", 2026, 5, 27), false);

  assert.equal(dateTimePicker.isInRange("2026-06-18", "2026-06-18", "2026-06-20"), true);
  assert.equal(dateTimePicker.isInRange("2026-06-20", "2026-06-18", "2026-06-20"), true);
  assert.equal(dateTimePicker.isInRange("2026-06-21", "2026-06-18", "2026-06-20"), false);
});

test("date-time picker builds calendar cells and deterministic labels", () => {
  const february = dateTimePicker.datePickerDays(2024, 1);

  assert.equal(february.length, 42);
  assert.deepEqual(february[0], { year: 2024, month: 0, day: 29, muted: true });
  assert.deepEqual(february[41], { year: 2024, month: 2, day: 10, muted: true });
  assert.equal(
    february.some((cell) => cell.year === 2024 && cell.month === 1 && cell.day === 29 && !cell.muted),
    true
  );

  assert.equal(dateTimePicker.monthName(0, "en", localeForLanguage), "January");
  assert.deepEqual(dateTimePicker.weekdayLabels("en", localeForLanguage), ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]);
  assert.equal(dateTimePicker.displayDate("2026-06-27", "en", localeForLanguage), "06/27/2026");
  assert.equal(dateTimePicker.displayRange("", "", "en", localeForLanguage, "Date range"), "Date range");
  assert.equal(
    dateTimePicker.displayRange("2026-06-28", "2026-06-27", "en", localeForLanguage, "Date range"),
    "06/27/2026 - 06/28/2026"
  );
});

test("ui state creates the expected renderer state shape", () => {
  const state = uiState.createInitialState();

  assert.deepEqual(state.calls, []);
  assert.deepEqual(state.reminders, []);
  assert.deepEqual(state.knowledgeBase, []);
  assert.equal(state.selectedBlocks instanceof Set, true);
  assert.deepEqual(state.reportRange, { preset: "today", from: "", to: "" });
  assert.deepEqual(state.reminderRange, { from: "", to: "" });
  assert.deepEqual(state.statsRange, { preset: "today", from: "", to: "" });
  assert.deepEqual(state.timezonePickers.onboarding, {
    searchQuery: "",
    selectedTimezoneValue: "local",
    isTimezoneDropdownOpen: false,
    filteredTimezoneOptions: [],
    highlightedTimezoneIndex: -1
  });
  assert.equal(state.reminderFormCollapsed, true);
  assert.equal(state.callsNeedPersist, false);
});

test("ui state creates fresh nested references on every call", () => {
  const first = uiState.createInitialState();
  const second = uiState.createInitialState();

  assert.notEqual(first.calls, second.calls);
  assert.notEqual(first.reminders, second.reminders);
  assert.notEqual(first.knowledgeBase, second.knowledgeBase);
  assert.notEqual(first.selectedBlocks, second.selectedBlocks);
  assert.notEqual(first.reportRange, second.reportRange);
  assert.notEqual(first.reminderRange, second.reminderRange);
  assert.notEqual(first.statsRange, second.statsRange);
  assert.notEqual(first.formLists, second.formLists);
  assert.notEqual(first.timezonePickers, second.timezonePickers);
  assert.notEqual(first.timezonePickers.onboarding, second.timezonePickers.onboarding);
  assert.notEqual(first.dateTimePicker, second.dateTimePicker);
});

test("timezone picker builds local-first unique options", () => {
  const options = timezonePicker.buildOptions(
    ["Europe/Madrid", "Europe/Madrid", "America/Bogota"],
    "en",
    timezoneOption
  );

  assert.deepEqual(options.map((option) => option.value), ["local", "Europe/Madrid", "America/Bogota"]);
});

test("timezone picker filters options and keeps highlighted index valid", () => {
  const options = timezonePicker.buildOptions(
    ["Europe/Madrid", "America/Bogota", "America/New_York"],
    "en",
    timezoneOption
  );

  assert.deepEqual(
    timezonePicker.filterOptions(options, "MADRID", normalizeTimezoneSearch, -1).filteredTimezoneOptions.map((option) => option.value),
    ["Europe/Madrid"]
  );

  assert.deepEqual(
    timezonePicker.filterOptions(options, "america", normalizeTimezoneSearch, 10),
    {
      filteredTimezoneOptions: options.slice(2),
      highlightedTimezoneIndex: 0
    }
  );

  assert.deepEqual(timezonePicker.filterOptions(options, "missing", normalizeTimezoneSearch, 10), {
    filteredTimezoneOptions: [],
    highlightedTimezoneIndex: -1
  });
});

test("timezone picker limits empty-query results to the start of the list", () => {
  const source = Array.from({ length: 100 }, (_item, index) => `Etc/Test_${index}`);
  const options = timezonePicker.buildOptions(source, "en", timezoneOption);
  const result = timezonePicker.filterOptions(options, "", normalizeTimezoneSearch, 90);

  assert.equal(result.filteredTimezoneOptions.length, 80);
  assert.deepEqual(result.filteredTimezoneOptions.map((option) => option.value), options.slice(0, 80).map((option) => option.value));
  assert.equal(result.highlightedTimezoneIndex, 0);
});
