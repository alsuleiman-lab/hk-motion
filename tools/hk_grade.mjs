// THE COLOUR TOOL of HK-Motion (user 2026-11-19: «أداة الألوان نضيفها أساسية»): a montage's colour grade is a few exact settings in its spec (`grade`), applied to the recording's
// layers in the Studio (SVG colour matrix) and in the GPU render (the same matrix in the compositor), see src/gradeMatrix.ts. Looks are kept in data/grade_presets.json.
//   node tools/hk_grade.mjs get <p>                              the montage's grade (neutral when none)
//   node tools/hk_grade.mjs set <p> brightness=94 contrast=112 saturation=88 sepia=10 temperature=38 tint=2 warmth=22   only the named settings change
//   node tools/hk_grade.mjs preset <p> "دافئ سينمائي"            apply a saved look
//   node tools/hk_grade.mjs reset <p>                            back to neutral (the `grade` field is removed: the montage renders exactly as before)
//   node tools/hk_grade.mjs presets                              the saved looks
//   node tools/hk_grade.mjs save <name> <p>                      keep this montage's grade as a look      |  delete <name>   remove a look
// Ranges: brightness/contrast/saturation 0–200, sepia/warmth 0–100, temperature/tint −100…100 (neutral: 100 100 100 0 0 0 0).
import fs from "node:fs";
import path from "node:path";

process.chdir(path.resolve(import.meta.dirname, ".."));
const NEUTRAL = { brightness: 100, contrast: 100, saturation: 100, sepia: 0, temperature: 0, tint: 0, warmth: 0 };
const LIMITS = { brightness: [0, 200], contrast: [0, 200], saturation: [0, 200], sepia: [0, 100], temperature: [-100, 100], tint: [-100, 100], warmth: [0, 100] };
const PRESETS = path.join("data", "grade_presets.json");
const read = (f, d) => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch { return d; } };
const specFile = (p) => { const f = path.join("data", "specs", `${p}.json`); if (!fs.existsSync(f)) throw new Error(`لا مواصفة: ${f}`); return f; };

export const clean = (g) => {
  const out = {};
  for (const [k, v] of Object.entries(g ?? {})) {
    if (!(k in NEUTRAL)) throw new Error(`إعداد غير معروف: ${k} (المسموح: ${Object.keys(NEUTRAL).join(" ")})`);
    const n = Number(v); if (!Number.isFinite(n)) throw new Error(`${k}: ليس رقماً`);
    const [lo, hi] = LIMITS[k]; if (n < lo || n > hi) throw new Error(`${k}: بين ${lo} و${hi}`);
    out[k] = Math.round(n * 10) / 10;
  }
  return out;
};
export const getGrade = (p) => ({ ...NEUTRAL, ...(read(specFile(p), {}).grade ?? {}) });
export const setGrade = (p, g, replace = false) => {
  const f = specFile(p), s = read(f, {}), next = { ...(replace ? NEUTRAL : { ...NEUTRAL, ...(s.grade ?? {}) }), ...clean(g) };
  const neutral = Object.keys(NEUTRAL).every((k) => next[k] === NEUTRAL[k]);
  if (neutral) delete s.grade; else s.grade = Object.fromEntries(Object.entries(next).filter(([k, v]) => v !== NEUTRAL[k]));
  fs.writeFileSync(f, JSON.stringify(s, null, 1));
  return { ...NEUTRAL, ...(s.grade ?? {}) };
};
export const presets = () => read(PRESETS, { presets: {} }).presets;
export const savePreset = (name, g) => { const d = read(PRESETS, { presets: {} }); d.presets[name] = { ...NEUTRAL, ...clean(g) }; fs.writeFileSync(PRESETS, JSON.stringify(d, null, 1)); };
export const deletePreset = (name) => { const d = read(PRESETS, { presets: {} }); delete d.presets[name]; fs.writeFileSync(PRESETS, JSON.stringify(d, null, 1)); };

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) {
  const [cmd, ...args] = process.argv.slice(2);
  const kv = (l) => Object.fromEntries(l.map((a) => { const i = a.indexOf("="); if (i < 1) throw new Error(`«${a}»: اكتب الإعداد=القيمة`); return [a.slice(0, i), a.slice(i + 1)]; }));
  try {
    if (cmd === "get") console.log(JSON.stringify(getGrade(args[0])));
    else if (cmd === "set") { const [p, ...r] = args; console.log("✔ " + JSON.stringify(setGrade(p, kv(r)))); }
    else if (cmd === "preset") { const [p, name] = args, g = presets()[name]; if (!g) throw new Error(`لا لون محفوظ باسم «${name}» (node tools/hk_grade.mjs presets)`); console.log(`✔ ${name}: ` + JSON.stringify(setGrade(p, g, true))); }
    else if (cmd === "reset") { setGrade(args[0], NEUTRAL, true); console.log("✔ أُعيدت الألوان إلى الأصل"); }
    else if (cmd === "presets") for (const [n, g] of Object.entries(presets())) console.log(`${n}: ${JSON.stringify(g)}`);
    else if (cmd === "save") { const [name, p] = args; savePreset(name, getGrade(p)); console.log(`✔ حُفظ اللون «${name}»`); }
    else if (cmd === "delete") { deletePreset(args[0]); console.log(`✔ حُذف «${args[0]}»`); }
    else { console.error("usage: node tools/hk_grade.mjs get|set|preset|reset|presets|save|delete …"); process.exit(2); }
  } catch (e) { console.error("✘ " + e.message); process.exit(2); }
}
