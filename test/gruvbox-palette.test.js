const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const themesDir = path.join(__dirname, "..", "src", "renderer", "styles", "themes");

// Official palette: morhetz/gruvbox v2.0.0, colors/gruvbox.vim, `let s:gb.<name> = ['#hex', n]`
// (lines 89-132 of the file shipped in gruvbox-master.zip).
const OFFICIAL = {
  "--gb-dark0-hard": "#1d2021",
  "--gb-dark0": "#282828",
  "--gb-dark0-soft": "#32302f",
  "--gb-dark1": "#3c3836",
  "--gb-dark2": "#504945",
  "--gb-dark3": "#665c54",
  "--gb-dark4": "#7c6f64",
  "--gb-gray": "#928374",
  "--gb-light0-hard": "#f9f5d7",
  "--gb-light0": "#fbf1c7",
  "--gb-light0-soft": "#f2e5bc",
  "--gb-light1": "#ebdbb2",
  "--gb-light2": "#d5c4a1",
  "--gb-light3": "#bdae93",
  "--gb-light4": "#a89984",
  "--gb-bright-red": "#fb4934",
  "--gb-bright-green": "#b8bb26",
  "--gb-bright-yellow": "#fabd2f",
  "--gb-bright-blue": "#83a598",
  "--gb-bright-purple": "#d3869b",
  "--gb-bright-aqua": "#8ec07c",
  "--gb-bright-orange": "#fe8019",
  "--gb-neutral-red": "#cc241d",
  "--gb-neutral-green": "#98971a",
  "--gb-neutral-yellow": "#d79921",
  "--gb-neutral-blue": "#458588",
  "--gb-neutral-purple": "#b16286",
  "--gb-neutral-aqua": "#689d6a",
  "--gb-neutral-orange": "#d65d0e",
  "--gb-faded-red": "#9d0006",
  "--gb-faded-green": "#79740e",
  "--gb-faded-yellow": "#b57614",
  "--gb-faded-blue": "#076678",
  "--gb-faded-purple": "#8f3f71",
  "--gb-faded-aqua": "#427b58",
  "--gb-faded-orange": "#af3a03"
};

function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

function gruvboxFiles() {
  return fs
    .readdirSync(themesDir)
    .filter((name) => /^gruvbox.*\.css$/.test(name))
    .map((name) => ({ name, css: stripComments(fs.readFileSync(path.join(themesDir, name), "utf8")) }));
}

test("gruvbox tokens declare every official palette colour with its exact value", () => {
  const tokens = gruvboxFiles().find((file) => file.name === "gruvbox.tokens.css");
  assert.ok(tokens, "gruvbox.tokens.css must exist");
  const declared = {};
  for (const [, name, value] of tokens.css.matchAll(/(--gb-[a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{6})\s*;/g)) {
    declared[name] = value.toLowerCase();
  }
  assert.deepEqual(declared, OFFICIAL);
});

test("gruvbox stylesheets contain no colour literals other than the official palette", () => {
  const official = new Set(Object.values(OFFICIAL));
  const files = gruvboxFiles();
  assert.ok(files.length >= 1);
  for (const file of files) {
    const hexes = file.css.match(/#[0-9a-fA-F]{3,8}\b/g) || [];
    hexes.forEach((hex) => {
      assert.ok(official.has(hex.toLowerCase()), `${file.name}: ${hex} is not an official Gruvbox colour`);
    });
    if (file.name !== "gruvbox.tokens.css") {
      assert.equal(hexes.length, 0, `${file.name} must reference palette tokens instead of hex literals`);
    }
    assert.doesNotMatch(file.css, /\b(?:rgba?|hsla?)\(/i, `${file.name} must not use rgb()/hsl() literals`);
  }
});

test("gruvbox rules are scoped to the gruvbox family so Default is unaffected", () => {
  for (const file of gruvboxFiles()) {
    const selectors = [...file.css.matchAll(/(?:^|})\s*([^{}@][^{}]*)\{/g)].map((match) => match[1].trim());
    selectors
      .filter((selector) => !/^(?:from|to|\d+%|@(?:media|supports|layer|container|keyframes)\b)/.test(selector))
      .forEach((selectorList) => {
        selectorList.split(",").forEach((selector) => {
          assert.match(
            selector.trim(),
            /\[data-theme-family="gruvbox"\]/,
            `${file.name}: unscoped selector "${selector.trim().slice(0, 80)}"`
          );
        });
      });
  }
});
