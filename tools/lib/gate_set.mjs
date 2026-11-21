// THE MONTAGE'S GATES IN ONE CALL (tools/montage_build.mjs, 2026-11-21): the item gates of `stage.mjs check` and of `el.mjs add`, run unchanged in a
// workspace root (the real one, or a scratch root from tools/lib/gate_sandbox.mjs) on data/specs/<p>.json of that root. No render, no Studio, no network:
// the steps of stage check that draw frames (grid_sheet, judder probe), compile (typecheck) or write outside the spec (spec_register, source_crop --write,
// bumper_at --write) are not here — the full `stage.mjs check` still runs them after the build.
//   const res = await runGateSet(root, p, { forms, minutes })  → [{ name, ok, code, secs, fails: ["✘ …"], tail }]
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const runIn = (root, args, timeout = 240000) => new Promise((res) => {
  const t0 = Date.now(), c = spawn(process.execPath, args, { cwd: root, windowsHide: true });
  let o = ""; const k = setTimeout(() => { try { c.kill(); } catch { /* gone */ } }, timeout);
  c.stdout.on("data", (d) => { o += d; }); c.stderr.on("data", (d) => { o += d; });
  c.on("close", (code) => { clearTimeout(k); res({ code, out: o, secs: (Date.now() - t0) / 1000 }); });
});
const failLines = (out) => out.split(/\r?\n/).map((l) => l.trim()).filter((l) => /^✘/.test(l) && !/^✘ \d+ (باقية|مشكلة)/.test(l));

/** the gate list: [name, args (relative to root), {seq}] — seq gates write the spec and put it back, so they run alone, first */
export function gateList(root, p, { forms = ["land", "port"], minutes = 5 } = {}) {
  const sf = path.join("data", "specs", `${p}.json`), T = path.join(root, ".tmp", p);
  const g = [];
  for (const o of forms) g.push([`spec_normalize --dry (${o})`, ["tools/spec_normalize.mjs", sf, "--o", o, "--dry"], { seq: true }]);
  g.push(["writing_sync", ["tools/writing_sync.mjs", sf]]);
  g.push(["element_slots", ["tools/element_slots.mjs", p, ...(forms.length === 1 ? ["--only", forms[0]] : [])]]);
  g.push(["coverage_check", ["tools/coverage_check.mjs", sf]]);
  g.push(["late_check", ["tools/late_check.mjs", sf]]);
  g.push(["slot_boxes", ["--experimental-strip-types", "--no-warnings", "tools/slot_boxes.mjs", p]]);
  g.push(["pick_triggers", ["tools/pick_triggers.mjs", sf]]);
  for (const o of forms) g.push([`grid_plan (${o})`, ["tools/grid_plan.mjs", sf, "--o", o]]);
  g.push(["mg_usage_audit", ["tools/mg_usage_audit.mjs", sf, "--minutes", String(minutes)]]);
  g.push(["requirements", ["tools/requirements.mjs", p, "--check"]]);
  g.push(["sections (prepublish_gates --stage)", ["tools/prepublish_gates.mjs", p, "--stage"]]);
  g.push(["cover_item", ["tools/cover_item.mjs", p]]);
  g.push(["layers gaps", ["tools/layers.mjs", "gaps", p]]);
  g.push(["gallery_geometry", ["tools/gallery_geometry.mjs", sf]]);
  g.push(["brand_audit", ["tools/brand_audit.mjs", "--strict", sf]]);
  if (fs.existsSync(path.join(T, "writing.json"))) g.push(["writing_place", ["tools/writing_place.mjs", p]]);
  return g;
}

export async function runGateSet(root, p, opts = {}) {
  const list = gateList(root, p, opts), out = [];
  const one = async ([name, args]) => { const r = await runIn(root, args); const fails = failLines(r.out); return { name, ok: r.code === 0, code: r.code, secs: r.secs, fails, tail: r.out.trim().split(/\r?\n/).slice(-3).join(" | ") }; };
  for (const g of list.filter((x) => x[2]?.seq)) out.push(await one(g));
  const rest = list.filter((x) => !x[2]?.seq), N = opts.parallel ?? 4;
  const res = new Array(rest.length); let k = 0;
  await Promise.all(Array.from({ length: Math.min(N, rest.length) }, async () => { while (k < rest.length) { const i = k++; res[i] = await one(rest[i]); } }));
  return [...out, ...res];
}

export { runIn, failLines };
