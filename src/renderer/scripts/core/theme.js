(function () {
  const FAMILIES = ["default", "gruvbox"];
  const MODES = ["light", "dark", "system"];
  const HINT_KEY = "callflow.themeHint";
  const FAMILY_LABEL_KEYS = {
    default: "themeFamilyDefault",
    gruvbox: "themeFamilyGruvbox"
  };
  const MODE_LABEL_KEYS = {
    light: "themeLight",
    dark: "themeDark",
    system: "themeSystem"
  };

  function normalizeFamily(value) {
    return FAMILIES.includes(value) ? value : "default";
  }

  function normalizeMode(value) {
    return MODES.includes(value) ? value : "system";
  }

  function resolveMode(mode, systemPrefersLight) {
    const preference = normalizeMode(mode);
    if (preference === "system") return systemPrefersLight ? "light" : "dark";
    return preference;
  }

  function familyLabelKey(family) {
    return FAMILY_LABEL_KEYS[normalizeFamily(family)];
  }

  function modeLabelKey(mode) {
    return MODE_LABEL_KEYS[normalizeMode(mode)];
  }

  function describeActive(input = {}) {
    const family = normalizeFamily(input.family);
    const mode = normalizeMode(input.mode);
    const resolved = input.resolved === "light" ? "light" : "dark";
    return {
      family,
      mode,
      resolved,
      isSystem: mode === "system",
      familyLabelKey: FAMILY_LABEL_KEYS[family],
      modeLabelKey: MODE_LABEL_KEYS[mode],
      resolvedLabelKey: MODE_LABEL_KEYS[resolved]
    };
  }

  function normalizeResolved(value) {
    return value === "light" ? "light" : "dark";
  }

  function serializeHint(input = {}) {
    return JSON.stringify({
      family: normalizeFamily(input.family),
      resolved: normalizeResolved(input.resolved)
    });
  }

  function parseHint(raw) {
    if (typeof raw !== "string" || !raw || raw.length > 200) return null;
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return null;
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    const keys = Object.keys(parsed).sort();
    if (keys.length !== 2 || keys[0] !== "family" || keys[1] !== "resolved") return null;
    if (!FAMILIES.includes(parsed.family)) return null;
    if (parsed.resolved !== "light" && parsed.resolved !== "dark") return null;
    return { family: parsed.family, resolved: parsed.resolved };
  }

  const api = {
    FAMILIES,
    HINT_KEY,
    MODES,
    describeActive,
    familyLabelKey,
    modeLabelKey,
    normalizeFamily,
    normalizeMode,
    parseHint,
    resolveMode,
    serializeHint
  };

  if (typeof window !== "undefined") {
    window.CallFlowTheme = api;
  }

  if (typeof module !== "undefined") {
    module.exports = api;
  }
})();
