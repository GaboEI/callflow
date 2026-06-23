const { execFileSync } = require("child_process");
const { readdirSync, statSync } = require("fs");
const path = require("path");

const DIRS = [
  path.resolve(__dirname, "..", "src"),
  path.resolve(__dirname, "..", "test")
];

function collectJsFiles(dir) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      results.push(...collectJsFiles(full));
    } else if (entry.endsWith(".js")) {
      results.push(full);
    }
  }
  return results;
}

const files = DIRS.flatMap((dir) => {
  try {
    return collectJsFiles(dir);
  } catch (_error) {
    return [];
  }
});

let failed = 0;
for (const file of files) {
  try {
    execFileSync(process.execPath, ["--check", file], { stdio: "pipe" });
  } catch (error) {
    failed += 1;
    const rel = path.relative(process.cwd(), file);
    console.error(`FAIL  ${rel}`);
    console.error(error.stderr ? error.stderr.toString().trim() : error.message);
  }
}

if (failed > 0) {
  console.error(`\n${failed} file(s) failed syntax check.`);
  process.exit(1);
} else {
  console.log(`${files.length} file(s) passed syntax check.`);
}
