// --spec <file> for the guard self-test (tools/guard_selftest.mjs + tools/selftest_cases/b_elements.mjs, 2026-11-21): a tool that reads data/specs/<p>.json by
// project name takes a SCRATCH spec instead, and only one under .tmp/selftest/ (anything else is refused, exit 2), so a real montage is always data/specs/<p>.json.
// The project name stays the CLI argument: the self-test names it "selftest/<run>/<case>", so every .tmp/<p>/… path of the tool lands in the scratch tree too.
// Call it BEFORE process.chdir (a relative path is the caller's). It removes «--spec <file>» from process.argv and returns the absolute file, or null.
import path from "node:path";

export const takeSpecArg = (root) => {
  const i = process.argv.indexOf("--spec");
  if (i < 2) return null;
  const f = path.resolve(process.argv[i + 1] ?? ""), scr = path.join(path.resolve(root), ".tmp", "selftest");
  process.argv.splice(i, 2);
  if (!f.toLowerCase().startsWith(scr.toLowerCase() + path.sep)) { console.error(`✘ --spec للاختبار الذاتي فقط: مواصفة تحت .tmp/selftest/ (لا ${f})`); process.exit(2); }
  return f;
};
