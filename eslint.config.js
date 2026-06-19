const browserGlobals = {
  AudioContext: "readonly",
  Blob: "readonly",
  Event: "readonly",
  FileReader: "readonly",
  Intl: "readonly",
  URL: "readonly",
  clearInterval: "readonly",
  clearTimeout: "readonly",
  confirm: "readonly",
  console: "readonly",
  crypto: "readonly",
  document: "readonly",
  localStorage: "readonly",
  navigator: "readonly",
  setInterval: "readonly",
  setTimeout: "readonly",
  structuredClone: "readonly",
  window: "readonly"
};

const nodeGlobals = {
  __dirname: "readonly",
  clearInterval: "readonly",
  console: "readonly",
  global: "readonly",
  module: "readonly",
  process: "readonly",
  require: "readonly",
  setInterval: "readonly"
};

module.exports = [
  {
    ignores: ["node_modules/**", "dist/**"]
  },
  {
    files: ["src/main/**/*.js", "src/shared/**/*.js", "test/**/*.js", "eslint.config.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "script",
      globals: nodeGlobals
    }
  },
  {
    files: ["src/renderer/**/*.js", "src/shared/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "script",
      globals: {
        ...browserGlobals,
        ...nodeGlobals,
        CallFlowI18n: "readonly",
        CallFlowOutcomes: "readonly",
        CallFlowReminders: "readonly",
        CallFlowReports: "readonly",
        CallFlowSchema: "readonly",
        CallFlowDashboardView: "readonly",
        CallFlowReportsView: "readonly",
        CallFlowRemindersView: "readonly",
        CallFlowSettingsView: "readonly",
        CallFlowKnowledgeView: "readonly",
        CallFlowClockView: "readonly",
        CallFlowStats: "readonly",
        CallFlowStorage: "readonly"
      }
    }
  },
  {
    rules: {
      "constructor-super": "error",
      "for-direction": "error",
      "getter-return": "error",
      "no-async-promise-executor": "error",
      "no-class-assign": "error",
      "no-compare-neg-zero": "error",
      "no-cond-assign": "error",
      "no-const-assign": "error",
      "no-constant-binary-expression": "error",
      "no-constant-condition": "error",
      "no-control-regex": "error",
      "no-debugger": "error",
      "no-dupe-args": "error",
      "no-dupe-class-members": "error",
      "no-dupe-else-if": "error",
      "no-dupe-keys": "error",
      "no-duplicate-case": "error",
      "no-empty-character-class": "error",
      "no-empty-pattern": "error",
      "no-ex-assign": "error",
      "no-fallthrough": "error",
      "no-func-assign": "error",
      "no-import-assign": "error",
      "no-invalid-regexp": "error",
      "no-irregular-whitespace": "error",
      "no-loss-of-precision": "error",
      "no-misleading-character-class": "error",
      "no-new-native-nonconstructor": "error",
      "no-obj-calls": "error",
      "no-promise-executor-return": "error",
      "no-prototype-builtins": "error",
      "no-self-assign": "error",
      "no-setter-return": "error",
      "no-sparse-arrays": "error",
      "no-this-before-super": "error",
      "no-undef": "error",
      "no-unexpected-multiline": "error",
      "no-unreachable": "error",
      "no-unsafe-finally": "error",
      "no-unsafe-negation": "error",
      "no-unused-private-class-members": "error",
      "no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_", varsIgnorePattern: "^_" }
      ]
    }
  }
];
