const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const rendererDir = path.join(__dirname, "..", "src", "renderer");
const indexHtml = fs.readFileSync(path.join(rendererDir, "index.html"), "utf8");
const indexSource = fs.readFileSync(path.join(rendererDir, "scripts", "i18n.js"), "utf8");

const THEME_KEYS = [
  "settingsThemes",
  "settingsThemesHelp",
  "themeFamily",
  "themeFamilyDefault",
  "themeFamilyGruvbox",
  "themeMode",
  "themeActiveLabel"
];

function loadDictionaries() {
  const match = indexSource.match(/const dictionaries = (\{[\s\S]*?\n  \};)/);
  assert.ok(match, "i18n dictionaries object should be parseable");
  const context = {};
  vm.runInNewContext(`dictionaries = ${match[1]}`, context);
  return context.dictionaries;
}

function themesPanel() {
  const start = indexHtml.indexOf('data-settings-panel="themes"');
  assert.notEqual(start, -1, "themes settings panel should exist");
  const end = indexHtml.indexOf("</section>", start);
  assert.ok(end > start, "themes settings panel should be closed");
  return indexHtml.slice(start, end);
}

test("settings tabs end with the new themes tab", () => {
  const tabsBlock = indexHtml.slice(
    indexHtml.indexOf('class="settings-tabs"'),
    indexHtml.indexOf('id="settingsForm"')
  );
  const tabs = [...tabsBlock.matchAll(/data-settings-tab="([^"]+)"/g)].map((match) => match[1]);
  assert.ok(tabs.length >= 8, `expected at least 8 settings tabs, got ${tabs.length}`);
  assert.equal(tabs[tabs.length - 1], "themes", "themes tab must be the last tab so 1-7 keep their colours");
  assert.equal(tabs.filter((tab) => tab === "themes").length, 1, "themes tab must appear exactly once");
});

test("themes panel exposes family and mode controls", () => {
  const panel = themesPanel();
  assert.match(panel, /data-theme-family-choice="default"/);
  assert.match(panel, /data-theme-family-choice="gruvbox"/);
  ["light", "dark", "system"].forEach((mode) => {
    assert.match(panel, new RegExp(`data-theme-choice="${mode}"`), `themes panel should offer ${mode} mode`);
  });
  assert.match(panel, /id="themeActiveSummary"/);
  assert.match(panel, /role="radiogroup"/);
});

test("the visual theme select is gone from the settings form", () => {
  assert.doesNotMatch(indexHtml, /<select[^>]*name="theme"/, "the General panel select must be removed");
  assert.doesNotMatch(indexHtml, /name='theme'/);
});

test("theme boot script is the first script and runs before onboarding", () => {
  const firstScript = indexHtml.indexOf("<script");
  const bootIndex = indexHtml.indexOf('scripts/core/theme-boot.js');
  const onboardingIndex = indexHtml.indexOf('id="onboarding"');
  assert.ok(firstScript !== -1, "index.html should include scripts");
  assert.ok(bootIndex !== -1, "theme-boot script should be referenced");
  assert.equal(firstScript, indexHtml.lastIndexOf("<script", bootIndex), "theme-boot should be the first script tag");
  assert.ok(bootIndex < onboardingIndex, "theme-boot must load before the onboarding/app markup");
});

test("theme helper script loads before app.js", () => {
  const themeIndex = indexHtml.indexOf('scripts/core/theme.js');
  const appIndex = indexHtml.indexOf('scripts/app.js');
  assert.ok(themeIndex !== -1, "core/theme.js should be referenced");
  assert.ok(appIndex !== -1, "app.js should be referenced");
  assert.ok(themeIndex < appIndex, "core/theme.js must load before app.js");
});

test("gruvbox token stylesheet is linked after main.css", () => {
  const mainIndex = indexHtml.indexOf("styles/main.css");
  const gruvboxIndex = indexHtml.indexOf("styles/themes/gruvbox.tokens.css");
  assert.ok(mainIndex !== -1, "main.css should be linked");
  assert.ok(gruvboxIndex !== -1, "gruvbox.tokens.css should be linked");
  assert.ok(gruvboxIndex > mainIndex, "gruvbox tokens must load after main.css");
});

test("every i18n key used by the themes panel exists in all dictionaries", () => {
  const dictionaries = loadDictionaries();
  const languages = Object.keys(dictionaries);
  assert.deepEqual(languages.sort(), ["en", "es", "ru"]);

  const panel = themesPanel();
  const usedKeys = new Set([
    ...[...panel.matchAll(/data-i18n="([^"]+)"/g)].map((match) => match[1]),
    ...[...panel.matchAll(/data-i18n-title="([^"]+)"/g)].map((match) => match[1])
  ]);
  THEME_KEYS.forEach((key) => usedKeys.add(key));

  usedKeys.forEach((key) => {
    languages.forEach((language) => {
      const value = dictionaries[language][key];
      assert.equal(typeof value, "string", `${language} is missing i18n key ${key}`);
      assert.ok(value.trim().length > 0, `${language} has an empty value for ${key}`);
    });
  });
});

test("settings general help no longer mentions appearance", () => {
  const dictionaries = loadDictionaries();
  const forbidden = {
    es: /apariencia/i,
    en: /appearance/i,
    ru: /внешний вид/i
  };
  Object.entries(forbidden).forEach(([language, pattern]) => {
    assert.doesNotMatch(dictionaries[language].settingsGeneralHelp, pattern);
  });
});
