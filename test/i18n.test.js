const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function loadDictionaries() {
  const source = fs.readFileSync(path.join(__dirname, "..", "src", "renderer", "scripts", "i18n.js"), "utf8");
  const match = source.match(/const dictionaries = (\{[\s\S]*?\n  \};)/);
  assert.ok(match, "i18n dictionaries object should be parseable");
  const context = {};
  vm.runInNewContext(`dictionaries = ${match[1]}`, context);
  return context.dictionaries;
}

test("all i18n dictionaries expose the same keys", () => {
  const dictionaries = loadDictionaries();
  const languages = Object.keys(dictionaries);
  const allKeys = [...new Set(Object.values(dictionaries).flatMap((dictionary) => Object.keys(dictionary)))].sort();

  languages.forEach((language) => {
    assert.deepEqual(Object.keys(dictionaries[language]).sort(), allKeys, `${language} has missing or extra i18n keys`);
  });
});
