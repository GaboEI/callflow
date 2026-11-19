const test = require("node:test");
const assert = require("node:assert/strict");

const validators = require("../src/shared/validators");
const settings = require("../src/renderer/scripts/core/settings");
const theme = require("../src/renderer/scripts/core/theme");

test("settings default to the default theme family when absent or invalid", () => {
  assert.equal(validators.normalizeSettings({}).themeFamily, "default");
  assert.equal(validators.normalizeSettings({ themeFamily: "nope" }).themeFamily, "default");
  assert.equal(validators.normalizeSettings({ themeFamily: 42 }).themeFamily, "default");
  assert.equal(validators.normalizeSettings({ themeFamily: null }).themeFamily, "default");
  assert.equal(validators.normalizeSettings({ themeFamily: ["gruvbox"] }).themeFamily, "default");
});

test("settings accept the gruvbox theme family", () => {
  assert.equal(validators.normalizeSettings({ themeFamily: "gruvbox" }).themeFamily, "gruvbox");
  assert.equal(validators.normalizeSettings({ themeFamily: "default" }).themeFamily, "default");
});

test("legacy settings without themeFamily keep their theme mode untouched", () => {
  ["system", "light", "dark"].forEach((mode) => {
    const normalized = validators.normalizeSettings({ theme: mode, language: "es" });
    assert.equal(normalized.theme, mode, `theme ${mode} should survive normalization`);
    assert.equal(normalized.themeFamily, "default", "themeFamily should default without touching theme");
  });
});

test("core normalizeSettings passes themeFamily through and keeps theme mode", () => {
  const gruvbox = settings.normalizeSettings({ theme: "dark", themeFamily: "gruvbox" }, validators);
  assert.equal(gruvbox.themeFamily, "gruvbox");
  assert.equal(gruvbox.theme, "dark");

  const legacy = settings.normalizeSettings({ theme: "light" }, validators);
  assert.equal(legacy.themeFamily, "default");
  assert.equal(legacy.theme, "light");

  const invalid = settings.normalizeSettings({ theme: "system", themeFamily: "solarized" }, validators);
  assert.equal(invalid.themeFamily, "default");
  assert.equal(invalid.theme, "system");
});

test("theme helpers normalize families and modes", () => {
  assert.deepEqual(theme.FAMILIES, ["default", "gruvbox"]);
  assert.deepEqual(theme.MODES, ["light", "dark", "system"]);

  assert.equal(theme.normalizeFamily("gruvbox"), "gruvbox");
  assert.equal(theme.normalizeFamily("default"), "default");
  assert.equal(theme.normalizeFamily("nope"), "default");
  assert.equal(theme.normalizeFamily(undefined), "default");

  assert.equal(theme.normalizeMode("light"), "light");
  assert.equal(theme.normalizeMode("dark"), "dark");
  assert.equal(theme.normalizeMode("system"), "system");
  assert.equal(theme.normalizeMode("nope"), "system");
  assert.equal(theme.normalizeMode(undefined), "system");
});

test("theme helpers resolve the system mode from the OS preference", () => {
  assert.equal(theme.resolveMode("light", false), "light");
  assert.equal(theme.resolveMode("dark", true), "dark");
  assert.equal(theme.resolveMode("system", true), "light");
  assert.equal(theme.resolveMode("system", false), "dark");
  assert.equal(theme.resolveMode("bogus", false), "dark");
});

test("theme helpers describe the active combination with label keys", () => {
  const explicit = theme.describeActive({ family: "gruvbox", mode: "dark", resolved: "dark" });
  assert.equal(explicit.family, "gruvbox");
  assert.equal(explicit.mode, "dark");
  assert.equal(explicit.resolved, "dark");
  assert.equal(explicit.isSystem, false);
  assert.equal(explicit.familyLabelKey, "themeFamilyGruvbox");
  assert.equal(explicit.modeLabelKey, "themeDark");
  assert.equal(explicit.resolvedLabelKey, "themeDark");

  const system = theme.describeActive({ family: "nope", mode: "system", resolved: "light" });
  assert.equal(system.family, "default");
  assert.equal(system.isSystem, true);
  assert.equal(system.resolved, "light");
  assert.equal(system.familyLabelKey, "themeFamilyDefault");
  assert.equal(system.modeLabelKey, "themeSystem");
  assert.equal(system.resolvedLabelKey, "themeLight");
});

test("theme hint round-trips through serializeHint and parseHint", () => {
  const raw = theme.serializeHint({ family: "gruvbox", resolved: "light" });
  assert.equal(typeof raw, "string");
  assert.deepEqual(theme.parseHint(raw), { family: "gruvbox", resolved: "light" });
  assert.deepEqual(theme.parseHint(theme.serializeHint({ family: "default", resolved: "dark" })), {
    family: "default",
    resolved: "dark"
  });
});

test("theme hint parsing rejects garbage and hostile payloads", () => {
  const rejected = [
    null,
    undefined,
    42,
    "",
    "not json",
    "[]",
    "null",
    "true",
    JSON.stringify({ family: "gruvbox" }),
    JSON.stringify({ resolved: "dark" }),
    JSON.stringify({ family: "solarized", resolved: "dark" }),
    JSON.stringify({ family: "gruvbox", resolved: "system" }),
    JSON.stringify({ family: "gruvbox", resolved: "dark", extra: "<script>" }),
    JSON.stringify({ family: ["gruvbox"], resolved: "dark" }),
    `${JSON.stringify({ family: "gruvbox", resolved: "dark" })}${"x".repeat(300)}`
  ];
  rejected.forEach((raw) => {
    assert.equal(theme.parseHint(raw), null, `should reject ${String(raw).slice(0, 40)}`);
  });
});

test("theme hint serialization normalizes untrusted input", () => {
  assert.deepEqual(theme.parseHint(theme.serializeHint({ family: "evil", resolved: "blue" })), {
    family: "default",
    resolved: "dark"
  });
  assert.deepEqual(theme.parseHint(theme.serializeHint()), { family: "default", resolved: "dark" });
});
