// THE PRE-RENDER PASS AS A GATE (user 2026-11-21, GTA 6: «ليش تظهر أخطاء بعد الرندر؟ … لازم حل جذري»). tools/prerender_check.mjs measures, BEFORE any
// full render, every property final_review measures on the rendered file, and writes .tmp/<p>/prerender.json. This file reads it:
//   freshness(p, orient, {root})         {ok, why}: a pass for this orientation (L|R), newer than the spec, the words, the cut list and every audio source
//   verifiedAudio(p, orient, plan, {root})   gpu_render, after its own audio records: {file} = the checked mix to mux (same plan, same sources, same bytes),
//                                         else {fault: [lines]} — the plan the render collected is not the one checked: a fault of the program, said loudly
//   programFaults(p, orient, failedIds, {root})   final_review: every property it failed on that prerender PASSED → «عيب في البرنامج لا في الحلقة: …»
//   PROGRAM_FAULT                         the line the user asked for (2026-11-21), word for word
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { inputStamp, comparePlans } from "./audio_plan.mjs";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
export const PROGRAM_FAULT = "عيب في البرنامج لا في الحلقة";
export const recordFile = (p, root = ROOT) => path.join(root, ".tmp", p, "prerender.json");
const rd = (f) => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch { return null; } };
export const sha = (f) => { try { return crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex"); } catch { return null; } };
export const stampOf = (f) => { try { const st = fs.statSync(f); return `${st.size}:${Math.floor(st.mtimeMs)}`; } catch { return "missing"; } };
/** the files besides the spec whose change makes a pass stale (cut list, words: the cut model and the bumper place are read from them) */
export const sideFiles = (p, root = ROOT) => [path.join("public", `${p}_map.json`), path.join(".tmp", p, "cut_words.json")].filter((f) => fs.existsSync(path.join(root, f)));
export const sideStamp = (p, root = ROOT) => Object.fromEntries(sideFiles(p, root).map((f) => [f.replace(/\\/g, "/"), stampOf(path.join(root, f))]));
const AR_O = { L: "العرضي", R: "الطولي" };
export const orientOf = (o) => (o === "L" || o === "land" ? "L" : "R");

export function freshness(p, orient, { root = ROOT } = {}) {
  const o = orientOf(orient), rec = rd(recordFile(p, root)), specF = path.join(root, "data", "specs", `${p}.json`);
  const cmd = `node tools/prerender_check.mjs ${p}`;
  if (!rec) return { ok: false, why: `لا فحص قبل الرندر لـ${p} (${cmd})` };
  const e = rec.orients?.[o];
  if (!e) return { ok: false, why: `فحص ما قبل الرندر لم يشمل ${AR_O[o]} (${cmd} --o ${o === "L" ? "land" : "port"})` };
  if (!e.ok) return { ok: false, why: `فحص ما قبل الرندر فشل في ${AR_O[o]}: ${(e.twins ?? []).filter((t) => !t.ok).map((t) => t.label).slice(0, 4).join("، ") || "انظر .tmp/" + p + "/prerender.json"}` };
  if (rec.spec !== sha(specF)) return { ok: false, why: `تغيّرت المواصفة بعد فحص ما قبل الرندر: أعده (${cmd})` };
  const side = sideStamp(p, root), changed = Object.keys({ ...side, ...(rec.side ?? {}) }).filter((k) => side[k] !== rec.side?.[k]);
  if (changed.length) return { ok: false, why: `تغيّر ${changed.join("، ")} بعد فحص ما قبل الرندر: أعده (${cmd})` };
  const now = inputStamp(e.plan ?? [], root), moved = Object.keys(e.planStamp ?? {}).filter((k) => now[k] !== e.planStamp[k]);
  if (moved.length) return { ok: false, why: `تغيّر صوت ${moved.slice(0, 3).join("، ")} بعد فحص ما قبل الرندر: أعده (${cmd})` };
  if (!e.wav || stampOf(path.join(root, e.wav)) !== e.wavStamp) return { ok: false, why: `الصوت المفحوص ${e.wav ?? "؟"} تغيّر أو حُذف: أعد فحص ما قبل الرندر (${cmd})` };
  return { ok: true, why: "", entry: e, rec };
}

/** gpu_render after its own audio records: the checked mix when the plan is the same, else the fault lines */
export function verifiedAudio(p, orient, plan, { root = ROOT } = {}) {
  const f = freshness(p, orient, { root });
  if (!f.ok) return { fault: [`${PROGRAM_FAULT}: لا صوت مفحوص صالح عند الرندر (${f.why})`] };
  const diff = comparePlans(f.entry.plan, plan);
  if (diff.length) return { fault: [`${PROGRAM_FAULT}: خطة الصوت التي جمعها الرندر غير التي فُحصت قبله (أداة الفحص tools/prerender_check.mjs لا ترى ما يرسمه الرندر):`, ...diff.map((d) => "   " + d)] };
  const wav = path.join(root, f.entry.wav);
  if (f.entry.wavSha && sha(wav) !== f.entry.wavSha) return { fault: [`${PROGRAM_FAULT}: ملف الصوت المفحوص تغيّر بعد الفحص (${f.entry.wav})`] };
  return { file: wav };
}

/** final_review: the ids it failed → a line for each one prerender passed for this orientation (the twin missed it: fix the tool) */
export function programFaults(p, orient, failed, { root = ROOT } = {}) {
  const rec = rd(recordFile(p, root)), e = rec?.orients?.[orientOf(orient)];
  if (!e) return [];
  const passed = new Map((e.twins ?? []).filter((t) => t.ok).map((t) => [t.id, t.label]));
  return [...new Set(failed)].filter((id) => passed.has(id)).map((id) => `${PROGRAM_FAULT}: «${passed.get(id)}» نجح قبل الرندر وفشل بعده — أصلح توأمه في tools/prerender_check.mjs`);
}
