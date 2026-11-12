// Preflight normaliser: makes a montage spec PASS the pre-render gates BEFORE any check/render (user 2026-11-11: «أنت تفحص كل شيء قبل الرندر، هذه أخطاء ضبط عندك»).
//   node tools/spec_normalize.mjs data/specs/<id>.json [--o port|land] [--allow-skips]
// Deterministic fixes, looped until stable (max 6 rounds), then a PLAIN verification (grid_plan without --write, coverage_check, mg_usage_audit):
//   1. scraps whose words are not in the speech (.tmp/<id>/cut_words.json) are dropped; `times` are rebuilt from the speech (never a word before it is spoken)
//   2. degenerate items (until <= at) are dropped
//   3. nameTag + subscribe exist, sit at coordinates the grid accepts (landscape: nameTag land {692,800}, subscribe land {410,838} = inside the solo slot and left of the face zone), and nothing else overlaps them
//   4. gaps (first minute > 0.3 s, anywhere > 5 s): filled with a slow zoom (never with mechanically cut speech: writing is chosen, 2026-11-12)
//   5. the grid planner runs with --write, every item it cannot place (over the face, no free slot, quote font < 26) becomes a zoom instead, and the loop repeats
//   6. fewer than 4 kit kinds → the question as it is read/asked becomes a torn note (never a generated or filler picture)
//   7. «mention without picture» / «required element missing» are NOT skipped silently: they are listed; `--allow-skips` writes documented skipMentions/skipRequired (disclose them in the report)
// Exit 1 + the remaining ✘ lines when something is left; exit 0 only when the plain gates are clean.
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { align } from "./lib/scraps_times.mjs";

const f = process.argv[2];
if (!f) { console.error("usage: node tools/spec_normalize.mjs data/specs/<id>.json [--o port|land] [--allow-skips]"); process.exit(2); }
const arg = (n, d) => (process.argv.includes("--" + n) ? process.argv[process.argv.indexOf("--" + n) + 1] : d);
const allowSkips = process.argv.includes("--allow-skips");
// --dry: report what is still incomplete and what would change, then put the spec back untouched (hand-planned montages)
const dry = process.argv.includes("--dry"), ORIG = fs.readFileSync(f, "utf8");
const read = () => JSON.parse(fs.readFileSync(f, "utf8"));
const write = (s) => { s.items.sort((a, b) => (span(a)?.[0] ?? 0) - (span(b)?.[0] ?? 0)); fs.writeFileSync(f, JSON.stringify(s, null, 1)); };
const span = (it) => { const a = it.at ?? it.from ?? it.oldAt ?? it.times?.[0]; const b = it.until ?? it.to ?? (it.dur != null && a != null ? a + it.dur : null) ?? (a != null ? a + 3 : null); return a == null ? null : [a, b]; };
const sh = (c) => { try { return execSync(c, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 1 << 26 }); } catch (e) { return String(e.stdout || "") + String(e.stderr || ""); } };
const spec0 = read(), id = spec0.id ?? path.basename(f, ".json");
const o = arg("o", /-L$/.test(spec0.comp ?? "") || arg("land", "") ? "land" : "port");
const words = JSON.parse(fs.readFileSync(path.join(".tmp", id, "cut_words.json"), "utf8"));
const grid = () => sh(`node tools/grid_plan.mjs ${f} --o ${o}`), gridW = () => sh(`node tools/grid_plan.mjs ${f} --o ${o} --write`);
const cov = () => sh(`node tools/coverage_check.mjs ${f}`), mg = () => sh(`node tools/mg_usage_audit.mjs ${f} --minutes ${Math.max(0.2, spec0.frames / 30 / 60)}`);
const times = () => sh(`node tools/scraps_times.mjs ${f}`);
const real = (s) => s.items.filter((i) => i.t !== "cover");
const notes = [];

for (let round = 0; round < 6; round++) {
  sh(`node tools/writing_sync.mjs ${f} --fix`);   // writing never before its words (moves or drops the item; the gap step below refills)
  let ch = 0; const s = read(), dur = s.frames / 30;
  const n0 = s.items.length;
  // 1+2) scraps not in the speech, degenerate items
  s.items = s.items.filter((it) => { if (it.t === "cover") return true; const sp = span(it); if (sp && it.until != null && sp[1] <= sp[0] + 0.05 && it.t !== "pic") return false; if (it.t !== "scraps") return true; const tm = align(it.text, it.at, it.until, words); return tm.filter((x) => x == null).length <= it.text.split(" ").length / 2; });
  if (s.items.length !== n0) ch++;
  // 3) solo cards
  // landscape solo slot [390,840,1520,985]; the face/title zone starts at x≈986 on these recordings → name card 386–986 (x 686), subscribe 410–970
  const solo = { nameTag: o === "land" ? { x: 686, y: 800 } : null, subscribe: o === "land" ? { x: 410, y: 838 } : null };
  if (!s.items.some((i) => i.t === "nameTag")) { s.items.push({ t: "nameTag", at: dur > 25 ? 15 : 0.8, x: 540, y: 1393, dur: 3.13, land: { x: 686, y: 800 } }); ch++; }
  if (!s.items.some((i) => i.t === "subscribe") && dur >= 9 && !(o === "land" && dur < 60)) { s.items.push({ t: "subscribe", at: +Math.max(5, Math.min(40, dur - 4.5)).toFixed(2), x: 260, y: 1413, dur: 3.13, land: { x: 410, y: 838 } }); ch++; }
  for (const i of s.items) if (solo[i.t] && o === "land" && (i.land?.x !== solo[i.t].x || i.land?.y !== solo[i.t].y)) { i.land = { ...solo[i.t] }; ch++; }
  { // name card and subscribe never together: name card first, subscribe after it; no room (very short clip) → the subscribe card goes
    const nt = s.items.find((i) => i.t === "nameTag"), sb = s.items.find((i) => i.t === "subscribe");
    if (nt && sb) { const [a, b] = span(nt), [c, d] = span(sb);
      if (c < b + 0.3 && a < d + 0.3) { const at = +(b + 0.5).toFixed(2); if (at + (sb.dur ?? 3.13) <= dur - 0.3) sb.at = at; else if (a > 0.6 && (sb.dur ?? 3.13) + 0.5 <= a) sb.at = 0.3; else s.items = s.items.filter((i) => i !== sb); ch++; } }
  }
  const cards = s.items.filter((i) => i.t === "nameTag" || i.t === "subscribe");
  const k0 = s.items.length;
  s.items = s.items.filter((x) => { if (x.t === "cover" || x.t === "blur" || x.t === "nameTag" || x.t === "subscribe" || x.t === "bgclip" || x.t === "credit") return true; /* a background video behind him is not on top of a card */ const sp = span(x); return !(sp && cards.some((c) => { const [a, b] = span(c); return sp[0] < b - 0.05 && sp[1] > a + 0.05; })); });
  if (s.items.length !== k0) ch++;
  // 6) kit kinds: fewer than 4 → the question as it is read/asked becomes a torn note (a real quote of the speech).
  //    NEVER a generated or filler picture (user 2026-11-11: «عم تستخدم صور من عندك»)
  if (/ناقص/.test(mg()) && !s.items.some((i) => i.t === "torn")) {
    const q = s.items.find((i) => i.t === "scraps" && i.text.split(" ").length >= 3 && !cards.some((c) => { const [a, b] = span(c); return i.at < b && i.until > a; }));
    if (q) { Object.assign(q, { t: "torn", size: 42, land: { x: 960, size: 30, y: 822 } }); delete q.times; ch++; notes.push(`torn@${q.at}`); } else notes.push("أنواع العناصر ناقصة ولا جملة تصلح ملاحظة: أضف عنصراً من الكلام في الخطة");
  }
  write(s); times();
  // 4) gaps
  const out = cov(); const s2 = read();
  // 4a) no push-in planned (tools/moves_plan.mjs found no cue word): push in on the sentence that opens near 40 % of the clip, and every ≤ 100 s after
  if (/الحركات: 0 تقريب/.test(out) && words.length) {
    const starts = words.filter((w, i) => i === 0 || w.s - words[i - 1].e >= 0.45).map((w) => w.s), dur2 = s2.frames / 30;
    const zs = []; for (let t0 = Math.min(dur2 * 0.4, 60); t0 < dur2 - 3; t0 += 100) { const st = starts.reduce((b, x) => (Math.abs(x - t0) < Math.abs(b - t0) ? x : b), starts[0]); if (st < dur2 - 3.5 && !zs.some((z) => Math.abs(z.from - st) < 20)) zs.push({ from: +st.toFixed(2), to: +Math.min(st + 3, dur2 - 0.5).toFixed(2), amt: 0.08 }); }
    s2.zooms = [...(s2.zooms || []), ...zs].sort((a, b) => a.from - b.from); if (!Array.isArray(s2.shake)) s2.shake = []; ch++; notes.push(`push-in@${zs.map((z) => z.from).join(",")}`);
  }
  for (const m of out.matchAll(/(?:فراغ أطول من 5 ث|لحظات بلا عنصر)[^:]*: ([^\n|]*)/g)) for (const g of m[1].matchAll(/(\d+):(\d+)–(\d+):(\d+)|(\d+\.?\d*)–(\d+\.?\d*) ث/g)) {
    const [a, b] = g[1] != null ? [+g[1] * 60 + +g[2], +g[3] * 60 + +g[4]] : [+g[5], +g[6]];
    // only words that START inside the gap: a word spoken before the gap would make its caption «written before spoken» in the timing check (and the loop would drop and re-add it forever)
    const ws = words.filter((w) => w.s >= a - 0.05 && w.s < b - 0.05);
    /* (2026-11-12, user: zoom only at important words) a gap is REPORTED for a picture of what is said or a card of his words — never a push-in.
       (2026-11-12, constitution stage 4) writing is CHOSEN by reading (.tmp/<p>/writing.json, one torn + one scraps a minute): a gap is never filled with
       mechanically cut speech any more — always a slow push-in (gap_zooms.mjs does the same before this tool) */
    if (true) { notes.push(`فراغ ${a.toFixed(1)}–${b.toFixed(1)}ث: املأه بصورة ما يُقال أو ببطاقة بكلماته، لا بتقريب (أمر 2026-11-12)`); continue; }
    for (let k = 0; k < ws.length; k += 6) {
      const c = ws.slice(k, k + 6), nxt = ws[k + 6];
      // the timing check ignores words under 3 letters: a caption must open with a word it can see (else it reads as «written before spoken»)
      while (c.length > 1 && c[0].w.replace(/[^\p{L}]/gu, "").length < 3) c.shift();
      s2.items.push({ t: "scraps", text: c.map((w) => w.w).join(" "), at: +Math.max(c[0].s, a).toFixed(2), until: +Math.min(c[c.length - 1].e + 0.3, nxt ? nxt.s : b + 0.3).toFixed(2), y: 1520, land: { y: 858, size: 30 }, times: c.map((w) => +Math.max(w.s, a).toFixed(2)) }); ch++; }
  }
  // 7) skips are listed, written only with --allow-skips
  for (const m of out.matchAll(/(?:^|[:،] )([^،:\n]+?) عند \d+:\d+ \((\d+)s\)/gm)) if (!/^✘|مذكور/.test(m[1])) { notes.push(`required: ${m[1].trim()}@${m[2]}`); if (allowSkips) { s2.skipRequired = [...new Set([...(s2.skipRequired || []), ...[-1, 0, 1].map((d) => `${m[1].trim()}@${+m[2] + d}`)])]; ch++; } }
  for (const m of out.matchAll(/مذكور بلا صورة عند ذكره \(\d+\): ([^\n]*?)(?= \| FAILED|\n|$)/g)) { const names = m[1].split("،").map((x) => x.replace(/\s*\(.*$/, "").trim()).filter(Boolean); notes.push(`mention-no-picture: ${names.join("، ")}`); if (allowSkips) { s2.skipMentions = [...new Set([...(s2.skipMentions || []), ...names])]; ch++; } }
  write(s2); times();
  // 5) grid: write, then turn what cannot be placed into zooms
  const gout = gridW(); const s3 = read(), r3 = real(s3), kill = new Set();
  for (const m of gout.matchAll(/✘ (\w+)#(\d+) [^\n]*?(?:فوق الوجه|لا خانة)/g)) kill.add(r3[+m[2] - 1]);
  for (const m of gout.matchAll(/✘ (\w+)#(\d+) \[land\][^\n]*الخط/g)) kill.add(r3[+m[2] - 1]);
  for (const m of gout.matchAll(/✘ (?:nameTag|subscribe)#\d+ [^\n]*?مع ([^\n]+)/g)) for (const x of m[1].split("+")) { const n = x.match(/#(\d+)/); if (n) kill.add(r3[+n[1] - 1]); }
  kill.delete(undefined); for (const k of [...kill]) if (["nameTag", "subscribe", "cover"].includes(k.t)) kill.delete(k);
  if (kill.size) for (const i of kill) notes.push(`✘ لا مكان لـ${i.t} عند ${i.at ?? i.from}ث (فوق الوجه أو بلا خانة): غيّر وقته أو نوعه — لا يُحذف ولا يُستبدل بتقريب (أمر 2026-11-12)`);
  if (!ch) break;
}
gridW();
// the grid's --write snaps the landscape solo cards back to the slot centre (over the face/title zone): put them back where the plain check accepts them
if (o === "land") { const s = read(); let n = 0; for (const i of s.items) { const c = i.t === "nameTag" ? { x: 686, y: 800 } : i.t === "subscribe" ? { x: 410, y: 838 } : null; if (c && (i.land?.x !== c.x || i.land?.y !== c.y)) { i.land = c; n++; } } if (n) write(s); }
// the grid's --write resizes cards to its slots; the gallery size and place is the last word on every card (stage check verifies it)
sh(`node tools/gallery_geometry.mjs ${f} --write`);
const g = grid(), c = cov(), m = mg(), ws = sh(`node tools/writing_sync.mjs ${f}`);
if (dry) {
  const now = read(), was = JSON.parse(ORIG);
  const cnt = (s) => s.items.reduce((o, i) => ((o[i.t] = (o[i.t] || 0) + 1), o), {});
  const a = cnt(was), b = cnt(now);
  const diff = [...new Set([...Object.keys(a), ...Object.keys(b)])].filter((k) => a[k] !== b[k]).map((k) => `${k} ${a[k] ?? 0}→${b[k] ?? 0}`);
  const zw = was.zooms?.length ?? 0, zn = now.zooms?.length ?? 0;
  console.log(`[spec_normalize --dry] كان سيغيّر: ${diff.join("، ") || "لا شيء في الأعداد"}${zw !== zn ? ` · تقريب ${zw}→${zn}` : ""}`);
  fs.writeFileSync(f, ORIG);
  if (diff.length || zw !== zn) process.exitCode = 1;   // the spec as built is incomplete
}
const bad = [...(g.match(/✘[^\n]*/g) || []), ...(c.match(/✘[^\n]*/g) || []), ...(m.match(/✘[^\n]*/g) || [])];
console.log(`[spec_normalize] ${id} (${o}): ${bad.length ? "✘ " + bad.length + " باقية" : "✔ نظيف"}${notes.length ? "\n  ملاحظات: " + [...new Set(notes)].join(" | ") : ""}`);
for (const b of bad) console.log("  " + b.slice(0, 200));
process.exit(bad.length || process.exitCode === 1 ? 1 : 0);
