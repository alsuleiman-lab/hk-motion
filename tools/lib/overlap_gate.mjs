// NO TWO ELEMENTS IN ONE PLACE, WHOEVER WROTE THEM (user 2026-11-20: «جمعت بين عنصرين فوق بعض… يجب ان لا يقبله البرنامج حتى لو فعلته أنت»).
// tools/el.mjs refuses a NEW overlap at the moment of writing, but an overlap already in the spec, a spec edited by hand, or a gate skipped got through
// to the render. This is the same pair of checks (tools/element_slots.mjs: two elements in one area at one time; tools/slot_boxes.mjs: where each element is
// DRAWN on the grid — on the face, on the cards, over another element, off screen) run where nothing can skip it: the render queue entry and the full
// render itself (tools/render_queue.mjs admit, tools/gpu_render.mjs). No switch turns it off: the montage is fixed (node tools/el.mjs slot …).
//   overlapFailures(p, "land" | "port" | null) → the ✘ lines that concern that orientation (a line naming neither orientation concerns both)
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const run = (args) => { const r = spawnSync(process.execPath, args, { cwd: ROOT, encoding: "utf8", windowsHide: true, maxBuffer: 1 << 26 }); return `${r.stdout ?? ""}\n${r.stderr ?? ""}`; };

export const overlapFailures = (p, orient = null) => {
  const out = [run(["tools/element_slots.mjs", p]), run(["--experimental-strip-types", "--no-warnings", "tools/slot_boxes.mjs", p])].join("\n");
  const lines = out.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.startsWith("✘") && !/^✘ \d+ (باقية|مشكلة)/.test(l));
  if (!orient) return lines;
  const mine = orient === "land" ? "عرضي" : "طولي", other = orient === "land" ? "طولي" : "عرضي";
  return lines.filter((l) => l.includes(mine) || !l.includes(other));
};

if (import.meta.url === `file:///${process.argv[1]?.replace(/\\/g, "/")}`) {
  const [p, o] = process.argv.slice(2);
  if (!p) { console.error("usage: node tools/lib/overlap_gate.mjs <p> [land|port]"); process.exit(2); }
  const bad = overlapFailures(p, o ?? null);
  console.log(bad.length ? bad.join("\n") : `✔ ${p}: لا تراكب ولا مكان مرفوض`);
  process.exit(bad.length ? 1 : 0);
}
