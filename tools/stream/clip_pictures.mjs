// صور المذكورات في مقطع من بث أو درس (أمر المستخدم 2026-11-19: «من قال لك تستثني الصور؟ ما حدا سمح لك بهذا»).
//   node tools/stream/clip_pictures.mjs <بث> <مقطع> [<مقطع> …]
// يقرأ .tmp/<بث>/pictures.json = { "<مقطع>": [ { el: "PhotoFrame"|"PinnedPhoto", at, until, src, name? } ] } ويضيف كل صورة من المعرض (el.mjs add: المكان والمقاس منه)،
// ثم تنال الصورة مكانها: لوحة الكلام (pick) وقصاصاته وملاحظاته التي تتعارض معها في الشريط السفلي تُقصَّر قبلها أو تُحذف (الصورة فوق الكتابة)،
// ثم element_slots --fix لما بقي (بطاقة الاسم والاشتراك). لا إعفاء لمذكور من صورته. يُعاد تشغيله بأمان (الصورة بالمصدر نفسه تُستبدل).
import fs from "node:fs"; import path from "node:path"; import { spawnSync } from "node:child_process";
process.chdir(path.resolve(import.meta.dirname, "..", ".."));
const [P, ...ids] = process.argv.slice(2);
if (!P || !ids.length) { console.error("usage: node tools/stream/clip_pictures.mjs <stream> <clip> [<clip> …]"); process.exit(2); }
const rd = (f, d) => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch { return d; } };
const pics = rd(path.join(".tmp", P, "pictures.json"), {});
const PIC = new Set(["pic", "scholar", "tphoto", "photo"]), LOW = new Set(["pick", "scraps", "torn", "rows", "blur", "text"]);
const R = (x) => +x.toFixed(2);
const end0 = (i) => i.until ?? i.to ?? (i.dur != null ? i.at + i.dur : i.at + 3), st = (i) => i.at ?? i.from ?? 0;
/* نهاية اللوحة الفعلية في المحرك = max(until, آخر حدث + 2.3) (pickUntil) لا until وحدها */
const lastEv = (i) => Math.max(st(i), ...["rows", "lines", "msgs"].flatMap((k) => (Array.isArray(i[k]) ? i[k].map((r) => r.at + (k === "lines" ? Math.max(0.5, String(r.text ?? "").length * 0.06) : 0)) : [])), i.flipAt ?? 0);
const end = (i) => (i.t === "pick" ? Math.max(end0(i), lastEv(i) + 2.3) : end0(i));
/** the way is cleared BEFORE an element is added (2026-11-22, stream dress rehearsal): tools/el.mjs add refuses an element that brings a violation, and the template's panels fill every
 *  slot («pick» with «pick», «الكتابة» with the picture), so every picture and every due pick was refused. The picture (or pick) is more important than the writing under it
 *  (القواعد العامة: الحديث والآية، ثم الصورة، ثم الكتابة): a lower item that began ≥ 1.8 s earlier is shortened to end before it, any other is removed. Returns the log lines. */
function clearFor(spec, pc) {
  const log = [];
  const total = (spec.frames ?? 0) / 30;
  for (const it of [...spec.items]) {
    /* the name and the subscribe card are not dropped: moved to just after the element (or just before it when no room is left), the way the template's own gap-filler would place them */
    if (it !== pc && (it.t === "nameTag" || it.t === "subscribe") && !(st(it) >= end(pc) || end(it) <= st(pc))) {
      const d = it.dur ?? 3.1, after = R(end(pc) + 0.5), before = R(st(pc) - d - 0.5);
      if (after + d <= total - 3.2) { it.at = after; log.push(`نُقل ${it.t}@${R(st(it))} إلى ما بعد العنصر`); } else if (before >= 0) { it.at = before; log.push(`نُقل ${it.t} إلى ما قبل العنصر`); } else { spec.items = spec.items.filter((x) => x !== it); log.push(`حُذف ${it.t} (لا موضع)`); }
      continue;
    }
    if (it === pc || !LOW.has(it.t)) continue;
    if (st(it) >= end(pc) || end(it) <= st(pc)) continue;
    if (st(it) <= st(pc) - 1.8) {
      const nu = R(st(pc) - 0.2); if (it.t === "rows") it.to = nu; else it.until = nu;
      // اللوحة تبقى حتى آخر سطر فيها + مدة الإمساك فلا يكفي تقصير `until`: تُحذف الأسطر التي يحين وقتها بعد الصورة
      /* اللوحة تُمسك بعد آخر حدث فيها: آخر سطر + زمن كتابته (طول النص × 0.06، وأدناه 0.5ث) + 0.8 دخول + 1.5 إمساك (pickUntil في المحرك)؛ فلا يُبقى إلا سطر ينتهي قبل الصورة */
      for (const k of ["rows", "lines", "msgs"]) if (Array.isArray(it[k])) it[k] = it[k].filter((r) => r.at + (k === "lines" ? Math.max(0.5, String(r.text ?? "").length * 0.06) : 0) + 2.3 <= nu);
      if (["rows", "lines", "msgs"].some((k) => Array.isArray(it[k]) && !it[k].length)) { spec.items = spec.items.filter((x) => x !== it); log.push(`حُذف ${it.t}@${st(it)} (لا سطر قبل الصورة@${st(pc)})`); }
      else log.push(`قُصِّر ${it.t}@${st(it)} قبل الصورة@${st(pc)}`);
    }
    else { spec.items = spec.items.filter((x) => x !== it); log.push(`حُذف ${it.t}@${st(it)} لأن الصورة@${st(pc)} أهم`); }
  }
  return log;
}
for (const id of ids) {
  const list = pics[id] ?? [], f = `data/specs/${id}.json`;
  let spec = rd(f, null); if (!spec) { console.log(`✘ ${id}: لا مواصفة`); continue; }
  // 1) أزل ما أُضيف سابقاً بالمصدر نفسه
  /* (2026-11-22, stream dress rehearsal) an entry may carry "vals" { var: value } for an element that is not a picture (a due pick: Iceberg, FillGlasses, Footnote…, given its element
     instead of a waiver): arrays and objects are passed as JSON, and the same pick at the same second is replaced, so the file is safe to apply twice */
  const srcs = new Set(list.map((x) => x.src).filter((x) => x != null)), picks = list.filter((x) => x.vals);
  spec.items = spec.items.filter((i) => !(PIC.has(i.t) && srcs.has(i.src)) && !(i.t === "pick" && picks.some((p) => p.el === i.el && Math.abs((i.at ?? 0) - p.at) < 0.6))); fs.writeFileSync(f, JSON.stringify(spec, null, 1));
  // 2) أضفها من المعرض
  const cleared = [];
  for (const p of list) {
    { const s1 = rd(f, spec), lg = clearFor(s1, { t: "pic", at: p.at, until: p.until ?? p.at + 4 }); if (lg.length) { fs.writeFileSync(f, JSON.stringify(s1, null, 1)); cleared.push(...lg); } }
    const args = ["tools/el.mjs", "add", id, p.el, `at=${p.at}`, `until=${p.until}`, ...(p.src != null ? [`src=${p.src}`] : []), ...(p.name ? [`name=${p.name}`] : []), ...Object.entries(p.vals ?? {}).map(([k, v]) => `${k}=${typeof v === "string" ? v : JSON.stringify(v)}`)];
    const r = spawnSync(process.execPath, args, { encoding: "utf8" }); console.log(`${id} ${p.el}@${p.at}: ${(r.stdout || r.stderr).trim().split("\n")[0].slice(0, 90)}`);
  }
  // 3) نال كل مكانه: الكتابة المتعارضة تُقصَّر أو تُحذف
  spec = rd(f, spec); const mine = spec.items.filter((i) => PIC.has(i.t) && srcs.has(i.src)); const log = [...cleared];
  for (const pc of mine) log.push(...clearFor(spec, pc));   // what is left in the way of a picture that is in (a picture added by an older run)
  fs.writeFileSync(f, JSON.stringify(spec, null, 1));
  if (log.length) console.log(`${id}: ${log.join(" | ")}`);
  const e = spawnSync(process.execPath, ["tools/element_slots.mjs", id, "--fix"], { encoding: "utf8" }); console.log(`${id}: ${(e.stdout || e.stderr).trim().split("\n").filter(Boolean).slice(-4).join(" | ").slice(0, 400)}`);
}
