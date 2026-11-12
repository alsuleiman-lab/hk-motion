// Shorten every pause longer than 0.40 s inside the silence itself (no word is touched) and shift the word times the same way.
//   node tools/film_trim.mjs <audioIn.wav> <asr_words.json> <audioOut.wav> <wordsOut.json> [--keep 0.26] [--db -34]
// asr_words.json = [{s,e,w}] ; the output keeps the same fields with the shifted times.  Run BEFORE tools/film_words*.mjs and the audio gate.
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';

const [inA, inW, outA, outW, ...rest] = process.argv.slice(2);
const opt = (n, d) => (rest.includes('--' + n) ? rest[rest.indexOf('--' + n) + 1] : d);
const KEEP = Number(opt('keep', '0.26')), DB = opt('db', '-34');
const probe = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', inA], {encoding: 'utf8'});
const dur = Number(probe.stdout.trim());
const sd = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', inA, '-af', `silencedetect=noise=${DB}dB:d=0.3`, '-f', 'null', '-'], {encoding: 'utf8'});
const text = (sd.stderr || '') + (sd.stdout || '');
const starts = [...text.matchAll(/silence_start: (-?[\d.]+)/g)].map((m) => Math.max(0, Number(m[1])));
const ends = [...text.matchAll(/silence_end: ([\d.]+)/g)].map((m) => Number(m[1]));
const cuts = [];
const prevF = opt('prev', ''), extra = opt('extra', '');
if (prevF) {
  // refine: keep the previous cuts (raw timeline) and add cuts for pauses the audio gate still reports in the OUTPUT timeline (start:len,...)
  const prev = JSON.parse(fs.readFileSync(prevF, 'utf8'));
  const O = (u) => { let rem = 0, out = u; for (const [x, y] of prev) { if (u >= x - rem) out += y - x; rem += y - x; } return out; };
  cuts.push(...prev);
  for (const e of extra.split(',').filter(Boolean)) { const [s, l] = e.split(':').map(Number); cuts.push([O(s + KEEP / 2), O(s + l - KEEP / 2)]); }
} else starts.forEach((s, i) => {
  const e = ends[i] ?? dur;
  if (e - s > 0.34 && s > 0.02) cuts.push([s + KEEP / 2, e - KEEP / 2]);          // leading silence (s≈0) is handled below
});
const lead = prevF ? 0 : starts[0] === 0 || starts[0] < 0.02 ? (ends[0] ?? 0) : 0;
if (lead > 0.2) cuts.unshift([0, lead - 0.12]);
cuts.sort((a, b) => a[0] - b[0]);
const keep = []; let p = 0;
for (const [a, b] of cuts) { if (a > p) keep.push([p, a]); p = b; }
if (p < dur) keep.push([p, dur]);
const f = keep.map((k, i) => `[0:a]atrim=${k[0].toFixed(4)}:${k[1].toFixed(4)},asetpts=PTS-STARTPTS[a${i}]`).join(';') + ';' + keep.map((_, i) => `[a${i}]`).join('') + `concat=n=${keep.length}:v=0:a=1[o]`;
fs.writeFileSync(outA + '.filter.txt', f);
const r = spawnSync('ffmpeg', ['-v', 'error', '-y', '-i', inA, '-/filter_complex', outA + '.filter.txt', '-map', '[o]', outA], {encoding: 'utf8'});
fs.unlinkSync(outA + '.filter.txt');
if (r.status !== 0) { console.error(r.stderr); process.exit(1); }
const removedBefore = (t) => cuts.reduce((acc, [a, b]) => acc + (t <= a ? 0 : Math.min(t, b) - a), 0);
const words = JSON.parse(fs.readFileSync(inW, 'utf8')).map((w) => ({...w, s: +(w.s - removedBefore(w.s)).toFixed(3), e: +(w.e - removedBefore(w.e)).toFixed(3)}));
fs.writeFileSync(outW, JSON.stringify(words));
fs.writeFileSync(outA.replace(/.wav$/, '') + '.cuts.json', JSON.stringify(cuts.map(([x, y]) => [+x.toFixed(3), +y.toFixed(3)])));
const total = cuts.reduce((a, [x, y]) => a + (y - x), 0);
console.log(`cuts ${cuts.length}, removed ${total.toFixed(2)} s, new duration ${(dur - total).toFixed(2)} s`);
