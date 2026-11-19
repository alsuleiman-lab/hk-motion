// يوازن كل جملة مدبلجة مع نافذتها في الفيديو (مهارة dubbing): تسريع أو إبطاء أو تطويل السكتات الداخلية أو تقصيرها، ثم يبني الصوت الكامل ويفحصه.
//   node tools/dub/mix.mjs --phrases <phrases.json> --fit <dir> --out <mix.wav> --total <ثواني الفيديو>
//        [--sel '{"8":"_c"}' (لاحقة ملف لكل جملة، الافتراضي بلا لاحقة)] [--sfx <sfx.json: [["pop",20.9],…]>] [--sfxdir <dir>] [--bed -31.6] [--no-auto]
// الأدوات بالترتيب: (1) النافذة الهدف T = نافذة الجملة + 0.1ث. (2) الأقصر منها: تُطال السكتات الداخلية (حتى +0.12ث لكل سكتة وبحد أقصى 0.35ث للسكتة) ثم يُبطَّأ الباقي حتى 0.82.
//   (3) الأطول: تُقصَّر السكتات الداخلية إلى 0.1ث ثم يُسرَّع الباقي حتى 1.18. لا تتجاوز الجملة نافذتها بأكثر من 0.15ث.
// البوابة (يفشل بالخروج 1): أي سكتة > 0.4ث في الناتج، أو طول غير الإجمالي، أو جملة تتداخل مع التي بعدها بأكثر من 0.15ث.
import fs from "node:fs"; import path from "node:path"; import { spawnSync } from "node:child_process";
const argv = process.argv.slice(2); const opt = (n, d) => { const i = argv.indexOf("--" + n); return i < 0 ? d : argv[i + 1]; };
const fit = opt("fit"), out = opt("out"), TOTAL = Number(opt("total"));
if (!opt("phrases") || !fit || !out || !TOTAL) { console.error("usage: node tools/dub/mix.mjs --phrases p.json --fit dir --out mix.wav --total 74.4 [--sel json] [--sfx sfx.json] [--sfxdir dir] [--no-auto]"); process.exit(2); }
const P = JSON.parse(fs.readFileSync(opt("phrases"), "utf8")), SEL = JSON.parse(opt("sel", "{}"));
const SFX = opt("sfx") ? JSON.parse(fs.readFileSync(opt("sfx"), "utf8")) : [], sfxdir = opt("sfxdir", "sfx"), BED = opt("bed", "-31.6"), AUTO = !argv.includes("--no-auto");
const ff = (a) => spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...a], { encoding: "utf8" });
const dur = (f) => Number(spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f], { encoding: "utf8" }).stdout);
const pauses = (f) => { const r = spawnSync("ffmpeg", ["-hide_banner", "-i", f, "-af", "silencedetect=n=-38dB:d=0.08", "-f", "null", "-"], { encoding: "utf8" }).stderr; const s = [...r.matchAll(/silence_start: ([\d.]+)/g)].map((m) => +m[1]), e = [...r.matchAll(/silence_end: ([\d.]+)/g)].map((m) => +m[1]); return s.map((a, i) => [a, e[i]]).filter(([a, b]) => b !== undefined && a > 0.05); };
const adj = path.join(path.dirname(path.resolve(out)), "dub_adj"); fs.mkdirSync(adj, { recursive: true });
const report = [], inputs = [];
for (const p of P) {
  const src = `${fit}/f${String(p.id).padStart(2, "0")}${SEL[p.id] ?? ""}.wav`; if (!fs.existsSync(src)) { console.error("missing", src); process.exit(2); }
  let d = dur(src), w = p.e - p.s, T = w + 0.1, file = src, note = "";
  if (AUTO && Math.abs(d - T) > 0.05) {
    const ps = pauses(src), n = ps.length; let extra = 0; const newLen = ps.map(([a, b]) => b - a);
    if (d < T) { const want = (T - d) * 0.5; if (n) for (let i = 0; i < n; i++) { const e = Math.max(0, Math.min(want / n, 0.12, 0.35 - newLen[i])); newLen[i] += e; extra += e; } }
    else { const want = (d - T) * 0.6; let got = 0; for (let i = 0; i < n && got < want; i++) { const cut = Math.max(0, Math.min(newLen[i] - 0.1, want - got)); newLen[i] -= cut; got += cut; } extra = -got; }
    let cur = src;
    if (Math.abs(extra) > 0.01) {
      let fc = "", lab = "", t0 = 0, k = 0;
      ps.forEach(([a, b], i) => { fc += `[0:a]atrim=${t0}:${a},asetpts=PTS-STARTPTS[s${k}];anullsrc=r=48000:cl=mono,atrim=0:${newLen[i].toFixed(3)}[p${k}];`; lab += `[s${k}][p${k}]`; t0 = b; k++; });
      fc += `[0:a]atrim=${t0},asetpts=PTS-STARTPTS[s${k}];${lab}[s${k}]concat=n=${2 * k + 1}:v=0:a=1[o]`;
      const tmp = `${adj}/p${p.id}.wav`; ff(["-i", src, "-filter_complex", fc, "-map", "[o]", "-ar", "48000", "-ac", "1", tmp]); cur = tmp; d = dur(tmp); note += `سكتات${extra > 0 ? "+" : ""}${extra.toFixed(2)} `;
    }
    if (Math.abs(d - T) > 0.05) {
      const f = d < T ? Math.max(0.82, d / T) : Math.min(1.18, d / T), tmp = `${adj}/t${p.id}.wav`;
      ff(["-i", cur, "-af", `atempo=${f.toFixed(3)}`, "-ar", "48000", "-ac", "1", tmp]); cur = tmp; d = dur(tmp); note += `سرعة×${f.toFixed(3)} `;
    }
    file = cur;
  }
  report.push({ id: p.id, window: +w.toFixed(2), len: +d.toFixed(2), start: p.s, end: +(p.s + d).toFixed(2), note: note.trim() }); inputs.push({ file, s: p.s });
}
const args = [], parts = [], labels = []; let n = 0;
for (const x of inputs) { args.push("-i", x.file); parts.push(`[${n}:a]aformat=channel_layouts=stereo,adelay=${Math.round(x.s * 1000)}|${Math.round(x.s * 1000)}[a${n}]`); labels.push(`[a${n}]`); n++; }
args.push("-f", "lavfi", "-t", String(TOTAL), "-i", `anoisesrc=d=${TOTAL}:c=pink:r=48000:a=0.5:seed=11`);
parts.push(`[${n}:a]lowpass=f=2600,highpass=f=90,volume=${BED}dB,aformat=channel_layouts=stereo,afade=t=in:d=0.15,afade=t=out:st=${TOTAL - 1.5}:d=1.5[bed]`); labels.push("[bed]"); n++;
for (const [s, t] of SFX) { args.push("-i", `${sfxdir}/${s}.wav`); parts.push(`[${n}:a]aformat=channel_layouts=stereo,adelay=${Math.round(t * 1000)}|${Math.round(t * 1000)}[s${n}]`); labels.push(`[s${n}]`); n++; }
parts.push(labels.join("") + `amix=inputs=${labels.length}:normalize=0:duration=longest,alimiter=limit=0.95[o]`);
const r = ff([...args, "-filter_complex", parts.join(";"), "-map", "[o]", "-t", String(TOTAL), "-ar", "48000", "-ac", "2", out]); if (r.status) { console.error(r.stderr); process.exit(1); }
for (const x of report) console.log(`جملة ${x.id}: نافذة ${x.window} ← ${x.len} ${x.note}`);
const errs = [];
const D = dur(out); if (Math.abs(D - TOTAL) > 0.1) errs.push(`طول الصوت ${D.toFixed(2)} لا يساوي ${TOTAL}`);
for (let i = 0; i + 1 < report.length; i++) if (report[i].end - report[i + 1].start > 0.15) errs.push(`الجملة ${report[i].id} تتداخل مع ${report[i + 1].id} بمقدار ${(report[i].end - report[i + 1].start).toFixed(2)}ث`);
const sil = spawnSync("ffmpeg", ["-hide_banner", "-i", out, "-af", "silencedetect=n=-38dB:d=0.4", "-f", "null", "-"], { encoding: "utf8" }).stderr; for (const m of sil.matchAll(/silence_start: ([\d.]+)/g)) errs.push(`سكتة > 0.4ث عند ${(+m[1]).toFixed(2)}`);
if (errs.length) { console.log("✘ " + errs.join("\n✘ ")); process.exit(1); } console.log("✔ الصوت متوازن مع النوافذ: بلا سكتة > 0.4ث ولا تداخل، والطول مطابق");
