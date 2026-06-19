(function () {
  const validators =
    typeof require === "function" ? require("./validators") : window.CallFlowValidators;
  const outcomes = typeof require === "function" ? require("./outcomes") : window.CallFlowOutcomes;

  const CURRENT_SCHEMA_VERSION = 1;
  const SCHEMA_KEYS = ["settings", "calls", "reminders", "knowledgeBase", "workTimer"];

  function isPlainObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }

  function clone(value) {
    if (value === undefined) return undefined;
    return JSON.parse(JSON.stringify(value));
  }

  function isVersionedPayload(value) {
    return isPlainObject(value) && Number.isInteger(value.schemaVersion) && Object.prototype.hasOwnProperty.call(value, "data");
  }

  function unwrapPayload(value) {
    return isVersionedPayload(value)
      ? { schemaVersion: value.schemaVersion, data: value.data, wasVersioned: true }
      : { schemaVersion: 0, data: value, wasVersioned: false };
  }

  function wrapPayload(key, data, schemaVersion = CURRENT_SCHEMA_VERSION) {
    if (!SCHEMA_KEYS.includes(key)) return clone(data);
    return {
      schemaVersion,
      data: clone(data)
    };
  }

  function normalizeSettings(settings, defaults = {}) {
    const normalized = validators.normalizeSettings(settings, defaults);
    const language = outcomes.languageCode(normalized.language);
    const callbackLabel = outcomes.defaultCallbackLabel(language);
    const callbackGroup = normalized.outcomePresets && normalized.outcomePresets.callback;

    if (callbackGroup) {
      const items = Array.isArray(callbackGroup.items) ? callbackGroup.items : [];
      const onlyLegacyDefault = items.length <= 1 && items.every(outcomes.isLegacyCallbackDefault);
      if (onlyLegacyDefault && language !== "es") {
        normalized.outcomePresets.callback = {
          default: callbackLabel,
          items: [callbackLabel]
        };
      }
    }
    return normalized;
  }

  function normalizeData(key, data, context = {}) {
    const settings = context.settings || context.defaults || {};
    if (key === "settings") return normalizeSettings(data, context.defaults || {});
    if (key === "calls") return validators.normalizeCollection(data, validators.normalizeCall, settings);
    if (key === "reminders") return validators.normalizeCollection(data, validators.normalizeReminder, settings.timezone || "local");
    if (key === "knowledgeBase") return validators.normalizeCollection(data, validators.normalizeNote);
    if (key === "workTimer") return validators.normalizeWorkTimer(data);
    return clone(data);
  }

  function migrateData(key, rawData, context = {}) {
    const payload = unwrapPayload(rawData);
    const schemaVersion = Number(payload.schemaVersion) || 0;
    if (!SCHEMA_KEYS.includes(key)) {
      return {
        data: clone(payload.data),
        schemaVersion,
        changed: false
      };
    }

    if (schemaVersion > CURRENT_SCHEMA_VERSION) {
      const error = new Error(`Unsupported ${key} schema version ${schemaVersion}`);
      error.code = "SCHEMA_VERSION_UNSUPPORTED";
      throw error;
    }

    const normalized = normalizeData(key, payload.data, context);
    const changed = !payload.wasVersioned || schemaVersion !== CURRENT_SCHEMA_VERSION;
    return {
      data: normalized,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      changed
    };
  }

  function schemaVersions() {
    return SCHEMA_KEYS.reduce((result, key) => {
      result[key] = CURRENT_SCHEMA_VERSION;
      return result;
    }, {});
  }

  const api = {
    CURRENT_SCHEMA_VERSION,
    SCHEMA_KEYS,
    isVersionedPayload,
    migrateData,
    normalizeData,
    schemaVersions,
    unwrapPayload,
    wrapPayload
  };

  if (typeof window !== "undefined") {
    window.CallFlowSchema = api;
  }

  if (typeof module !== "undefined") {
    module.exports = api;
  }
})();
