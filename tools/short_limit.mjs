// One truth for the length of a short portrait video (reel, silent reaction, lesson clip): the WHOLE published file, bumper included,
// must stay <= data/short_limit.json maxTotal (YouTube Shorts = 3:00). Used by reel_from_episode, coverage_check, prepend_bumper and final_review.
//   node tools/short_limit.mjs [<project>]   → prints the limit, the bumper seconds and the content budget (and the spec's length if a project is given)
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const rd = (f) => { try { return JSON.parse(fs.readFileSync(path.join(ROOT, f), "utf8")); } catch { return null; } };
export const SHORT_MAX = rd("data/short_limit.json")?.maxTotal ?? 179;
/** the longest rendered bumper (the pick is random, so the budget assumes the longest) */
export const bumperSeconds = () => { const m = rd("public/fawasel/manifest.json") ?? rd("public/fawasel/fawasel.json"); const s = (m?.bumpers ?? []).map((b) => b.seconds ?? 5); return s.length ? Math.max(...s) : 5; };
/** seconds of content allowed before the bumper */
export const contentBudget = () => +(SHORT_MAX - bumperSeconds()).toFixed(2);
/** is this project a short portrait video? (reel spec, silent reaction) */
export const isShort = (name) => { const sp = rd(`data/specs/${name}.json`); return sp?.kind === "reel" || fs.existsSync(path.join(ROOT, "public", "silent", String(name), "config.json")); };

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) {
  const p = process.argv[2], sp = p ? rd(`data/specs/${p}.json`) : null;
  console.log(`الحد الكلي ${SHORT_MAX}ث، الفاصل ${bumperSeconds()}ث، المحتوى حتى ${contentBudget()}ث` + (sp ? `؛ المواصفة ${((sp.frames ?? 0) / (sp.fps ?? 30)).toFixed(2)}ث` : ""));
}
