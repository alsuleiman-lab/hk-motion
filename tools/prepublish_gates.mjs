// GAPS THE USER CAUGHT HIMSELF BEFORE PUBLISHING, NOW GATES (user 2026-11-21, GTA 6 episode: «اعمل خطة سبر لكل ما يجنبك الوقوع في الأخطاء مستقبلا ونفذها»).
// On gta6 three things reached the publishing step open: .tmp/gta6/sections.json did not exist until publishing and the spec had no sections rail
// (video-sections was skipped), the YouTube package had no description and no tags and picked an Ibn Taymiyyah playlist for an event commentary,
// and the questions page still had unanswered items (Zaid ibn Thabit / Usama ibn Zayd, the Cohen news, the study). One place for those rules:
//   sectionsFailures(p, spec)  → reasons: no sections.json · count ≠ data/sections_rule.json · no SectionsRail in the first RAIL_MAX s (or its count ≠ sections)
//   packageFailures(p)         → reasons from `yt_package.mjs <p> --check` (description, tags, chapters = sections.json, playlist)
//   questionsFailures(p)       → one reason listing every questions-page item with no answer, no note and no mark (questions.mjs mark)
//   appliesToEpisode(p, spec)  → true for a full episode published on YouTube in landscape (not reel, cartoon, paper, ad, explainer, lesson/stream, silent)
//   node tools/prepublish_gates.mjs <p> [--stage] [--root <dir>]   → prints every line, exit 1 on any failure
//        --stage = the montage check (stage.mjs check): sections and rail only, so the gap is filled while building, not at the end
// Used by tools/final_review.mjs (the landscape file of a full episode) and tools/stage.mjs check.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const WS = path.resolve(import.meta.dirname, "..");
export const NO_SECTIONS_KINDS = ["reel", "cartoon", "paper", "ad", "explainer", "lesson", "stream"];
export const RAIL_MAX = 10;   // «في أول ثوانٍ من الفيديو» (video-sections §2): the rail starts within the first 10 cut seconds
export const BUMP = 5;
const rd = (f, d) => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch { return d; } };

/** final-file seconds of a spec (the 5 s bumper inserted before cut time `at`, or at the end) — the same arithmetic as yt_package.mjs */
export const finalSeconds = (spec) => (spec?.frames ?? 0) / (spec?.fps ?? 30) + (spec?.bumper && (spec.bumper.end || Number.isFinite(spec.bumper.at)) ? BUMP : 0);
/** how many sections the user's table asks for (data/sections_rule.json, 2026-11-17) */
export function sectionsWant(spec, root = WS) {
  const rows = rd(path.join(root, "data", "sections_rule.json"), { rows: [] }).rows ?? [], mins = finalSeconds(spec) / 60;
  return { mins, want: [...rows].reverse().find((r) => mins >= r.from)?.count ?? 3 };
}

export function appliesToEpisode(p, spec, root = WS) {
  if (!spec || NO_SECTIONS_KINDS.includes(spec.kind)) return false;
  if (/^(stream|lesson)[_-]/.test(p) || /-R$/.test(p) || spec.fromEpisode) return false;
  if (fs.existsSync(path.join(root, "public", "silent", p, "config.json"))) return false;
  const fa = rd(path.join(root, ".tmp", p, "first_answers.json"), null);
  return !fa?.formats || /عرضي/.test(String(fa.formats));   // the landscape form was chosen (first-questions)
}

export function sectionsFailures(p, spec, root = WS) {
  const out = [], sf = path.join(root, ".tmp", p, "sections.json");
  const S = rd(sf, null);
  if (!Array.isArray(S) || !S.length) out.push(`لا أقسام: .tmp/${p}/sections.json غير موجود — اكتبه الآن بعد القص (مهارة video-sections §1: [{title, at}] بثواني القص، العدد: node tools/yt_package.mjs ${p} --count)`);
  else {
    const { mins, want } = sectionsWant(spec, root);
    if (S.length !== want) out.push(`الأقسام ${S.length} والجدول يطلب ${want} لمدة ${mins.toFixed(1)} دقيقة (data/sections_rule.json)`);
  }
  const rails = (spec?.items ?? []).filter((i) => i.t === "pick" && i.el === "SectionsRail");
  const early = rails.find((i) => Number(i.at) <= RAIL_MAX);
  if (!early) out.push(rails.length ? `خط الأقسام عند ${Number(rails[0].at).toFixed(1)}ث والمطلوب في أول ${RAIL_MAX} ثوانٍ (video-sections §2)` : `لا خط أقسام (SectionsRail) في أول ${RAIL_MAX} ثوانٍ من المواصفة: node tools/el.mjs add ${p} SectionsRail at=<ث> until=<ث> sections='[{"title":"…","at":<ث>},…]' (عناوينه = sections.json)`);
  else if (Array.isArray(S) && (early.sections ?? []).length !== S.length) out.push(`خط الأقسام فيه ${(early.sections ?? []).length} عنواناً وsections.json فيه ${S.length}`);
  return out;
}

export function packageFailures(p, root = WS) {
  const r = spawnSync(process.execPath, [path.join(WS, "tools", "yt_package.mjs"), p, "--check", "--root", root], { encoding: "utf8" });
  return r.status === 0 ? [] : (r.stdout + r.stderr).split(/\r?\n/).filter((l) => l.startsWith("✘")).map((l) => l.replace(/^✘\s*/, ""));
}

/** answered = a choice, a note, or a mark (questions.mjs mark: the user's own words from the chat) */
export const isAnswered = (a) => !!a && ((a.answer != null && !(Array.isArray(a.answer) && !a.answer.length)) || !!String(a.note ?? "").trim() || !!a.mark);
export function questionsFailures(p, root = WS) {
  const Q = rd(path.join(root, ".tmp", p, "questions.json"), []), A = rd(path.join(root, ".tmp", p, "answers.json"), {});
  const open = Q.filter((q) => !isAnswered(A[q.id]));
  return open.length ? [`صفحة الأسئلة فيها ${open.length} بنداً بلا جواب من المستخدم: ${open.map((q) => `[${q.id}] ${String(q.q).slice(0, 70)}`).join(" · ")} — لا تخترع جواباً: ذكّره بالصفحة، أو سجّل جوابه من المحادثة بنصه: node tools/questions.mjs mark ${p} <id> --said "<نصه>"`] : [];
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) {
  const p = process.argv[2], ri = process.argv.indexOf("--root"), root = ri > 0 ? path.resolve(process.argv[ri + 1]) : WS;
  if (!p) { console.error("usage: node tools/prepublish_gates.mjs <p> [--stage] [--root <dir>]"); process.exit(2); }
  const spec = rd(path.join(root, "data", "specs", `${p}.json`), null);
  if (!appliesToEpisode(p, spec, root)) { console.log(`✔ prepublish_gates: «${p}» ليس حلقة عرضية كاملة (${spec ? spec.kind ?? "بلا نوع" : "بلا مواصفة"}): لا أقسام ولا حزمة يوتيوب`); process.exit(0); }
  const stage = process.argv.includes("--stage");
  const all = [["الأقسام", sectionsFailures(p, spec, root)], ...(stage ? [] : [["حزمة يوتيوب", packageFailures(p, root)], ["صفحة الأسئلة", questionsFailures(p, root)]])];
  for (const [k, f] of all) console.log(f.length ? f.map((x) => `✘ ${k}: ${x}`).join("\n") : `✔ ${k}`);
  process.exit(all.some(([, f]) => f.length) ? 1 : 0);
}
